import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import os from 'os';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = 'public';
const SMALL_FILE_THRESHOLD = 5 * 1024; // 5KB

// 动态计算最佳参数
async function calculateOptimalParams() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const cpuCount = os.cpus().length;
    const cpuUsage = os.loadavg()[0] / cpuCount;

    // 根据系统内存使用情况动态调整内存使用比例
    const memoryUsageRatio = 1 - (freeMemory / totalMemory);
    let memoryAllocationRatio;
    if (memoryUsageRatio < 0.7) {
        memoryAllocationRatio = 0.4;
    } else if (memoryUsageRatio < 0.85) {
        memoryAllocationRatio = 0.3;
    } else {
        memoryAllocationRatio = 0.2;
    }

    // 估算单个文件处理的平均内存占用
    const estimatedMemoryPerFile = Math.max(
        256 * 1024, // 最小256KB
        Math.min(
            1 * 1024 * 1024, // 最大1MB
            Math.floor(totalMemory / (1024 * cpuCount))
        )
    );
    
    // 计算批处理大小
    const memoryForProcessing = totalMemory * memoryAllocationRatio;
    let batchSize = Math.floor(memoryForProcessing / (estimatedMemoryPerFile * cpuCount));
    
    // 动态调整批处理大小的上下限
    const minBatchSize = Math.max(50, Math.floor(200 / cpuCount));
    const maxBatchSize = Math.min(
        2000,
        Math.floor(memoryForProcessing / (256 * 1024))
    );
    batchSize = Math.max(minBatchSize, Math.min(maxBatchSize, batchSize));
    
    // 优化工作线程数量
    let workerCount;
    const maxThreads = cpuCount * 2;
    const systemLoad = os.loadavg()[0] / cpuCount;
    const memoryConstraint = memoryUsageRatio > 0.85;

    if (memoryConstraint) {
        workerCount = Math.max(2, Math.min(cpuCount - 1, 4));
    } else if (systemLoad < 0.5) {
        workerCount = Math.max(2, Math.min(maxThreads, 6));
    } else if (systemLoad < 1.0) {
        workerCount = Math.max(2, Math.min(cpuCount + 2, 6));
    } else {
        workerCount = Math.max(2, Math.min(cpuCount, 4));
    }

    if (batchSize < 100) {
        workerCount = Math.min(workerCount, 2);
    } else if (batchSize < 200) {
        workerCount = Math.min(workerCount, 3);
    }
    
    return {
        batchSize,
        workerCount,
        systemInfo: {
            totalMemory: formatBytes(totalMemory),
            freeMemory: formatBytes(freeMemory),
            cpuCount,
            cpuUsage: (cpuUsage * 100).toFixed(1) + '%',
            memoryUsage: (memoryUsageRatio * 100).toFixed(1) + '%',
            memoryAllocationRatio: (memoryAllocationRatio * 100).toFixed(1) + '%',
            estimatedMemoryPerFile: formatBytes(estimatedMemoryPerFile)
        }
    };
}

// 格式化字节数
function formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(2)}${units[unitIndex]}`;
}

// 工作线程逻辑
if (!isMainThread) {
    const { files, sourceDir } = workerData;
    
    async function optimizeJson(inputPath) {
        const relativePath = path.relative(sourceDir, inputPath);
        const tempPath = `${inputPath}.temp`;
        
        try {
            const inputStats = await fs.stat(inputPath);
            const isSmallFile = inputStats.size < SMALL_FILE_THRESHOLD;
            
            // 读取JSON文件
            const jsonContent = await fs.readFile(inputPath, 'utf8');
            let jsonData;
            
            try {
                jsonData = JSON.parse(jsonContent);
            } catch (error) {
                return {
                    success: false,
                    path: relativePath,
                    error: '无效的JSON文件'
                };
            }
            
            // 压缩JSON
            const optimizedJson = JSON.stringify(jsonData);
            
            // 写入临时文件
            await fs.writeFile(tempPath, optimizedJson, 'utf8');
            
            const outputStats = await fs.stat(tempPath);
            if (outputStats.size < inputStats.size) {
                // 如果优化后的文件更小，则替换原文件
                await fs.rename(tempPath, inputPath);
                return {
                    success: true,
                    inputSize: inputStats.size,
                    outputSize: outputStats.size,
                    path: relativePath
                };
            } else {
                // 如果优化后的文件更大，则删除临时文件
                await fs.unlink(tempPath);
                return {
                    success: true,
                    inputSize: inputStats.size,
                    outputSize: inputStats.size,
                    path: relativePath,
                    skipped: true
                };
            }
        } catch (error) {
            // 清理临时文件
            try {
                await fs.unlink(tempPath);
            } catch {}
            
            return {
                success: false,
                path: relativePath,
                error: error.message
            };
        }
    }
    
    Promise.all(files.map(file => optimizeJson(file)))
        .then(results => parentPort.postMessage(results));
}

// 主线程逻辑
else {
    async function processJsonFiles() {
        try {
            // 计算最佳参数
            const optimalParams = await calculateOptimalParams();
            console.log('\n========== 系统资源信息 ==========');
            console.log(`总内存: ${optimalParams.systemInfo.totalMemory}`);
            console.log(`可用内存: ${optimalParams.systemInfo.freeMemory}`);
            console.log(`CPU核心数: ${optimalParams.systemInfo.cpuCount}`);
            console.log(`CPU使用率: ${optimalParams.systemInfo.cpuUsage}`);
            console.log(`内存使用率: ${optimalParams.systemInfo.memoryUsage}`);
            console.log(`内存分配比例: ${optimalParams.systemInfo.memoryAllocationRatio}`);
            console.log(`估计每个文件内存占用: ${optimalParams.systemInfo.estimatedMemoryPerFile}`);
            console.log(`优化批次大小: ${optimalParams.batchSize}`);
            console.log(`工作线程数: ${optimalParams.workerCount}`);
            console.log('==================================\n');
            
            // 获取所有JSON文件
            const files = await glob(path.join(sourceDir, '**/*.json'));
            const totalFiles = files.length;
            
            console.log(`找到 ${files.length} 个JSON文件需要优化\n`);
            
            // 初始化统计数据
            let totalOriginalSize = 0;
            let totalOptimizedSize = 0;
            let successCount = 0;
            let failCount = 0;
            let skippedCount = 0;
            const startTime = Date.now();
            
            const results = [];
            
            // 将文件分成多个批次
            const batches = [];
            for (let i = 0; i < files.length; i += optimalParams.batchSize) {
                batches.push(files.slice(i, Math.min(i + optimalParams.batchSize, files.length)));
            }
            
            let batchIndex = 0;
            
            // 处理每个批次
            const processBatch = async () => {
                if (batchIndex >= batches.length) return null;
                
                const currentBatch = batches[batchIndex++];
                const worker = new Worker(new URL(import.meta.url), {
                    workerData: {
                        files: currentBatch,
                        sourceDir
                    }
                });
                
                return new Promise((resolve, reject) => {
                    worker.on('message', (batchResults) => {
                        results.push(...batchResults);
                        
                        // 更新进度
                        const progress = Math.round((results.length / totalFiles) * 100);
                        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
                        const estimatedTotal = (elapsedTime / progress * 100).toFixed(1);
                        process.stdout.write(`\r处理进度: ${progress}% (${results.length}/${totalFiles}) - 已用时间: ${elapsedTime}秒 - 预计总时间: ${estimatedTotal}秒`);
                        
                        worker.terminate();
                        resolve();
                    });
                    
                    worker.on('error', (err) => {
                        worker.terminate();
                        reject(err);
                    });
                    
                    worker.on('exit', (code) => {
                        if (code !== 0 && !worker.exitCode) {
                            reject(new Error(`Worker stopped with exit code ${code}`));
                        }
                    });
                });
            };
            
            // 并行处理所有批次
            while (batchIndex < batches.length) {
                const workerPromises = [];
                for (let i = 0; i < optimalParams.workerCount && batchIndex < batches.length; i++) {
                    workerPromises.push(processBatch());
                }
                await Promise.all(workerPromises);
            }
            
            // 统计结果
            for (const result of results) {
                if (result.success) {
                    successCount++;
                    totalOriginalSize += result.inputSize;
                    totalOptimizedSize += result.outputSize;
                    if (result.skipped) {
                        skippedCount++;
                    }
                } else {
                    failCount++;
                    console.error(`\n✗ 处理 ${result.path} 时出错:`, result.error);
                }
            }
            
            // 打印报告
            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);
            const totalSavings = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(2);
            
            console.log('\n\n========== 优化结果报告 ==========');
            console.log(`处理总文件数: ${totalFiles}`);
            console.log(`成功处理: ${successCount} 个文件`);
            console.log(`跳过处理: ${skippedCount} 个文件（优化后体积更大）`);
            console.log(`处理失败: ${failCount} 个文件`);
            console.log(`原始总大小: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`);
            console.log(`优化后总大小: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)}MB`);
            console.log(`总体积减少: ${totalSavings}%`);
            console.log(`处理耗时: ${duration}秒`);
            console.log(`平均处理速度: ${(totalFiles / duration).toFixed(2)}个/秒`);
            console.log('================================\n');
            
        } catch (error) {
            console.error('处理过程中发生错误:', error);
        }
    }
    
    processJsonFiles();
}