import sharp from 'sharp';
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
    const cpuUsage = os.loadavg()[0] / cpuCount; // 1分钟平均负载

    // 根据系统内存使用情况动态调整内存使用比例
    const memoryUsageRatio = 1 - (freeMemory / totalMemory);
    let memoryAllocationRatio;
    if (memoryUsageRatio < 0.7) { // 内存使用率低于70%
        memoryAllocationRatio = 0.4; // 可以使用40%的总内存
    } else if (memoryUsageRatio < 0.85) { // 内存使用率在70%-85%之间
        memoryAllocationRatio = 0.3; // 使用30%的总内存
    } else { // 内存使用率高于85%
        memoryAllocationRatio = 0.2; // 只使用20%的总内存
    }

    // 估算单个文件处理的平均内存占用（根据文件大小动态调整）
    const estimatedMemoryPerFile = Math.max(
        512 * 1024, // 最小512KB
        Math.min(
            2 * 1024 * 1024, // 最大2MB
            Math.floor(totalMemory / (1024 * cpuCount)) // 根据系统配置动态计算
        )
    );
    
    // 计算批处理大小
    const memoryForProcessing = totalMemory * memoryAllocationRatio;
    let batchSize = Math.floor(memoryForProcessing / (estimatedMemoryPerFile * cpuCount));
    
    // 动态调整批处理大小的上下限
    const minBatchSize = Math.max(50, Math.floor(200 / cpuCount)); // 确保每个CPU至少处理50个文件
    const maxBatchSize = Math.min(
        2000, // 硬上限
        Math.floor(memoryForProcessing / (512 * 1024)) // 根据分配内存动态计算上限
    );
    batchSize = Math.max(minBatchSize, Math.min(maxBatchSize, batchSize));
    
    // 优化工作线程数量计算
    let workerCount;
    const maxThreads = cpuCount * 2; // 最大允许CPU核心数的2倍线程
    const systemLoad = os.loadavg()[0] / cpuCount;
    const memoryConstraint = memoryUsageRatio > 0.85; // 改为85%

    if (memoryConstraint) {
        // 内存压力大时，限制线程数
        workerCount = Math.max(2, Math.min(cpuCount - 1, 4));
    } else if (systemLoad < 0.5) {
        // 系统负载很低，可以用最大线程数
        workerCount = Math.max(2, Math.min(maxThreads, 6));
    } else if (systemLoad < 1.0) {
        // 系统负载适中，使用较多线程
        workerCount = Math.max(2, Math.min(cpuCount + 2, 6));
    } else {
        // 系统负载较高，但仍有余力
        workerCount = Math.max(2, Math.min(cpuCount, 4));
    }

    // 根据批处理大小调整线程数
    // 如果批次太小，减少线程数以避免线程切换开销
    if (batchSize < 100) {
        workerCount = Math.min(workerCount, 2);
    } else if (batchSize < 200) {
        workerCount = Math.min(workerCount, 3);
    }
    
    // 检测是否在RAM disk上
    const isRamDisk = await checkIfRamDisk(sourceDir);
    
    return {
        batchSize,
        workerCount,
        isRamDisk,
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

// 检查目录是否在RAM disk上
async function checkIfRamDisk(dir) {
    try {
        if (process.platform === 'darwin') {
            // macOS: 检查是否在 /Volumes/RAMDisk
            return dir.startsWith('/Volumes/RAMDisk');
        } else if (process.platform === 'linux') {
            // Linux: 检查是否在 tmpfs
            const { stdout } = await import('child_process').then(cp => 
                new Promise((resolve) => {
                    cp.exec(`df -T "${dir}" | grep tmpfs`, (error, stdout) => resolve({ stdout }));
                })
            );
            return stdout.includes('tmpfs');
        }
    } catch (error) {
        return false;
    }
    return false;
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
    const { files, sourceDir, isRamDisk } = workerData;
    
    async function optimizeImage(inputPath) {
        const relativePath = path.relative(sourceDir, inputPath);
        const tempPath = `${inputPath}.temp`;
        
        try {
            const inputStats = await fs.stat(inputPath);
            const isSmallFile = inputStats.size < SMALL_FILE_THRESHOLD;
            
            // 根据是否在RAM disk上调整缓冲策略
            const sharpOptions = {
                failOnError: false,
                limitInputPixels: false,
                sequentialRead: !isRamDisk, // 如果不是RAM disk，使用顺序读取
            };
            
            let sharpInstance = sharp(inputPath, sharpOptions);
            
            if (isSmallFile) {
                await sharpInstance
                    .png({
                        compressionLevel: 9,
                        effort: 10,
                        palette: true,
                        colors: 128,
                        dither: 0.4
                    })
                    .toFile(tempPath);
            } else {
                await sharpInstance
                    .png({
                        quality: 70,
                        compressionLevel: 9,
                        palette: true,
                        colors: 128,
                        dither: 0.4,
                        effort: 10
                    })
                    .toFile(tempPath);
            }
            
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
    
    Promise.all(files.map(file => optimizeImage(file)))
        .then(results => parentPort.postMessage(results));
}

// 主线程逻辑
else {
    async function processImages() {
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
            console.log(`RAM Disk: ${optimalParams.isRamDisk ? '是' : '否'}`);
            console.log('==================================\n');
            
            // 获取所有PNG文件
            const files = await glob(path.join(sourceDir, '**/*.png'));
            const totalFiles = files.length;
            
            console.log(`找到 ${files.length} 个PNG文件需要优化\n`);
            
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
                        sourceDir,
                        isRamDisk: optimalParams.isRamDisk
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
    
    processImages();
} 