import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = 'public/images';
const outputDir = 'dist/images';

// 统计数据
let totalFiles = 0;
let totalOriginalSize = 0;
let totalOptimizedSize = 0;
let successCount = 0;
let failCount = 0;
let startTime = Date.now();

// 文件大小阈值（字节）
const SMALL_FILE_THRESHOLD = 5 * 1024; // 5KB

async function optimizeImage(inputPath) {
    const relativePath = path.relative(sourceDir, inputPath);
    const outputPath = path.join(outputDir, relativePath);
    const outputDirPath = path.dirname(outputPath);

    await fs.mkdir(outputDirPath, { recursive: true });

    try {
        const inputStats = await fs.stat(inputPath);
        const isSmallFile = inputStats.size < SMALL_FILE_THRESHOLD;

        // 根据文件大小选择不同的压缩策略
        let sharpInstance = sharp(inputPath);
        
        if (isSmallFile) {
            // 小文件使用无损压缩策略
            await sharpInstance
                .png({
                    compressionLevel: 9,
                    effort: 10,
                    palette: false // 不使用调色板模式
                })
                .toFile(outputPath);
        } else {
            // 大文件使用有损压缩策略
            await sharpInstance
                .png({
                    quality: 80,
                    compressionLevel: 9,
                    palette: true,
                    colors: 256,
                    dither: 0.5,
                    effort: 10
                })
                .toFile(outputPath);
        }

        const outputStats = await fs.stat(outputPath);
        const savings = ((inputStats.size - outputStats.size) / inputStats.size * 100).toFixed(2);
        
        // 如果优化后文件更大，使用原始文件
        if (outputStats.size > inputStats.size) {
            await fs.copyFile(inputPath, outputPath);
            console.log(`⚠️ ${relativePath} (使用原始文件)`);
        } else {
            console.log(`✓ ${relativePath}`);
        }
        
        // 更新统计数据
        totalOriginalSize += inputStats.size;
        totalOptimizedSize += Math.min(inputStats.size, outputStats.size);
        successCount++;
        
        console.log(`  原始大小: ${(inputStats.size / 1024).toFixed(2)}KB`);
        console.log(`  优化大小: ${(Math.min(inputStats.size, outputStats.size) / 1024).toFixed(2)}KB`);
        console.log(`  节省: ${((inputStats.size - Math.min(inputStats.size, outputStats.size)) / inputStats.size * 100).toFixed(2)}%\n`);
    } catch (error) {
        console.error(`✗ 处理 ${relativePath} 时出错:`, error);
        failCount++;
    }
}

function printReport() {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    const totalSavings = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(2);
    
    console.log('\n========== 优化结果报告 ==========');
    console.log(`处理总文件数: ${totalFiles}`);
    console.log(`成功处理: ${successCount} 个文件`);
    console.log(`处理失败: ${failCount} 个文件`);
    console.log(`原始总大小: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`优化后总大小: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`总体积减少: ${totalSavings}%`);
    console.log(`处理耗时: ${duration}秒`);
    console.log(`CPU核心数: ${os.cpus().length}`);
    console.log('================================\n');
}

async function processImages() {
    try {
        // 清空输出目录
        await fs.rm(outputDir, { recursive: true, force: true });
        await fs.mkdir(outputDir, { recursive: true });
        
        // 获取所有PNG文件
        const files = await glob(path.join(sourceDir, '**/*.png'));
        totalFiles = files.length;
        
        console.log(`找到 ${files.length} 个PNG文件需要优化\n`);
        
        // 使用工作池并行处理图片，限制并发数为CPU核心数
        const concurrency = os.cpus().length;
        const chunks = [];
        for (let i = 0; i < files.length; i += concurrency) {
            chunks.push(files.slice(i, i + concurrency));
        }
        
        for (const chunk of chunks) {
            await Promise.all(chunk.map(file => optimizeImage(file)));
        }
        
        printReport();
    } catch (error) {
        console.error('处理过程中发生错误:', error);
    }
}

processImages(); 