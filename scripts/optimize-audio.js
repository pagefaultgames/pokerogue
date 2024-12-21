import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取CPU核心数并计算最佳并行数
const CPU_CORES = os.cpus().length;
// 使用核心数-1作为并行数，确保系统仍有资源处理其他任务
// 同时设置最小值2和最大值8，避免太少或太多
const DEFAULT_CONCURRENT = Math.max(2, Math.min(CPU_CORES - 1, 8));

// 支持的音频格式
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi'];

// 获取文件扩展名（修改为大小写不敏感）
const getExtension = (filePath) => {
  return path.extname(filePath).toLowerCase();
};

// 执行FFmpeg命令的Promise包装（减少日志输出）
const execFFmpeg = (cmd) => {
  return new Promise((resolve, reject) => {
    // 添加线程优化参数，使用CPU核心数-1
    const optimizedCmd = cmd + ` -threads ${Math.max(1, CPU_CORES - 1)}`;
    const process = exec(optimizedCmd, { stdio: ['pipe', 'pipe', 'pipe'] }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });

    // 添加30秒超时
    const timeout = setTimeout(() => {
      process.kill();
      reject(new Error('FFmpeg执行超时'));
    }, 30000);

    process.on('exit', () => {
      clearTimeout(timeout);
    });
  });
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) {
    return `${bytes}B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)}KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  }
};

// 比较文件大小并打印结果
const compareAndLogSize = (inputPath, originalSize, compressedSize) => {
  const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
  const isLarger = compressedSize > originalSize;
  
  console.log(`${isLarger ? '压缩后文件更大，保留原文件' : '压缩完成'}: ${inputPath}`);
  console.log(`原始大小: ${formatFileSize(originalSize)}`);
  console.log(`压缩后大小: ${formatFileSize(compressedSize)}`);
  console.log(`${isLarger ? '体积增加' : '节省空间'}: ${isLarger ? -savings : savings}%`);
  
  return { isLarger, savings };
};

// 并行处理文件的函数
const processFilesInParallel = async (files, processFunction, maxConcurrent = DEFAULT_CONCURRENT) => {
  console.log(`使用 ${maxConcurrent} 个并行任务处理文件（系统共 ${CPU_CORES} 个CPU核心）`);
  const chunks = [];
  for (let i = 0; i < files.length; i += maxConcurrent) {
    chunks.push(files.slice(i, i + maxConcurrent));
  }
  
  let processedCount = 0;
  let errorCount = 0;
  
  for (const chunk of chunks) {
    const results = await Promise.allSettled(chunk.map(file => processFunction(file)));
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        processedCount++;
      } else {
        errorCount++;
      }
    });
  }
  
  return { processedCount, errorCount };
};

// 音频优化
const optimizeAudio = async (inputPath) => {
  console.log(`开始处理音频文件: ${inputPath}`);
  
  // 统一使用小写扩展名
  const extension = getExtension(inputPath);
  const tempOutputPath = inputPath.replace(/\.[^/.]+$/, `_temp${extension}`);
  const tempOpusPath = inputPath.replace(/\.[^/.]+$/, '_temp.opus');
  let tempMp3Path = null;
  
  try {
    // 根据不同格式选择最佳压缩策略
    if (extension === '.wav') {
      // WAV文件先转opus，再转MP3以获得更好的压缩效果
      await execFFmpeg(`ffmpeg -hide_banner -loglevel error -i "${inputPath}" -c:a libopus -b:a 48k -ac 1 -ar 24000 -application audio "${tempOpusPath}"`);
      
      // 转回MP3格式，使用VBR模式
      tempMp3Path = inputPath.replace(/\.[^/.]+$/, '_temp.mp3');
      await execFFmpeg(`ffmpeg -hide_banner -loglevel error -i "${tempOpusPath}" -c:a libmp3lame -q:a 5 -ac 1 -ar 22050 -compression_level 0 "${tempMp3Path}"`);
      
      // 比较文件大小
      const originalSize = fs.statSync(inputPath).size;
      const mp3Size = fs.statSync(tempMp3Path).size;
      const { isLarger } = compareAndLogSize(inputPath, originalSize, mp3Size);
      
      if (!isLarger) {
        // 如果MP3更小，替换原文件
        fs.unlinkSync(inputPath);
        fs.renameSync(tempMp3Path, inputPath);
      }
      
      return inputPath;
    } else if (extension === '.m4a') {
      // m4a文件使用opus中转以获得更好的压缩效果
      await execFFmpeg(`ffmpeg -hide_banner -loglevel error -i "${inputPath}" -c:a libopus -b:a 48k -ac 1 -ar 24000 -application audio "${tempOpusPath}"`);
      
      // 转回m4a/aac格式，使用更优化的参数
      await execFFmpeg(`ffmpeg -hide_banner -loglevel error -i "${tempOpusPath}" -c:a aac -b:a 48k -ac 1 -ar 22050 -profile:a aac_low -movflags +faststart -compression_level 0 "${tempOutputPath}"`);
      
      // 清理临时opus文件
      if (fs.existsSync(tempOpusPath)) {
        fs.unlinkSync(tempOpusPath);
      }
    } else {
      // 其他格式使用opus中转
      await execFFmpeg(`ffmpeg -hide_banner -loglevel error -i "${inputPath}" -c:a libopus -b:a 48k -ac 1 -ar 24000 -application audio "${tempOpusPath}"`);
      
      // 第二步：转回原格式
      let codecCmd;
      switch(extension) {
        case '.mp3':
          // 使用LAME的VBR模式，质量等级5（范围0-9，数字越大文件越小）
          codecCmd = '-c:a libmp3lame -q:a 5 -ac 1 -ar 22050';
          break;
        case '.ogg':
          // 使用Vorbis编码器的VBR模式，质量等级更激进
          codecCmd = '-c:a libvorbis -q:a 2 -ac 1 -ar 22050';
          break;
        case '.flac':
          // 使用最大压缩级别，并降低采样率
          codecCmd = '-c:a flac -compression_level 12 -ac 1 -ar 22050';
          break;
        case '.aac':
          // 使用AAC低复杂度配置，更低的比特率
          codecCmd = '-c:a aac -b:a 48k -ac 1 -ar 22050 -profile:a aac_low';
          break;
        default:
          codecCmd = '-c:a libmp3lame -q:a 5 -ac 1 -ar 22050';
      }
      
      // 添加faststart标志以优化文件结构（对于支持的格式）
      if (['.m4a', '.aac', '.mp4'].includes(extension)) {
        codecCmd += ' -movflags +faststart';
      }
      
      await execFFmpeg(`ffmpeg -hide_banner -loglevel error -i "${tempOpusPath}" ${codecCmd} "${tempOutputPath}"`);
    }
    
    // 比较文件大小
    const originalSize = fs.statSync(inputPath).size;
    const compressedSize = fs.statSync(tempOutputPath).size;
    const { isLarger } = compareAndLogSize(inputPath, originalSize, compressedSize);
    
    if (isLarger) {
      // 如果压缩后文件更大，保留原文件
      fs.unlinkSync(tempOutputPath);
      return inputPath;
    }
    
    // 替换原文件
    fs.unlinkSync(inputPath);
    fs.renameSync(tempOutputPath, inputPath);
    
    return inputPath;
  } catch (error) {
    console.error(`处理文件失败: ${inputPath}`);
    throw error;
  } finally {
    // 清理所有临时文件
    const tempFiles = [tempOutputPath, tempOpusPath, tempMp3Path].filter(Boolean);
    for (const tempFile of tempFiles) {
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
          console.log(`已清理临时文件: ${tempFile}`);
        }
      } catch (e) {
        console.error(`清理临时文件失败: ${tempFile}`, e);
      }
    }
  }
};

// 视频优化
const optimizeVideo = async (inputPath) => {
  console.log(`开始处理视频文件: ${inputPath}`);
  
  const extension = getExtension(inputPath);
  const tempOutputPath = inputPath.replace(extension, `_temp${extension}`);
  
  try {
    // 根据不同格式选择合适的编码器和参数
    let codecCmd;
    switch(extension) {
      case '.webm':
        // VP9编码器，更激进的压缩参数
        codecCmd = `-c:v libvpx-vp9 -crf 35 -b:v 0 -deadline good -cpu-used 4 -row-mt 1 -tile-columns 2 -tile-rows 2 ` +
                  `-vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" ` +
                  `-c:a libopus -b:a 48k -ac 1 -ar 24000 -application audio`;
        break;
      case '.mov':
      case '.avi':
        // 转换为MP4格式，使用x264编码器
        tempOutputPath = inputPath.replace(extension, '_temp.mp4');
        codecCmd = `-c:v libx264 -crf 28 -preset fast -tune fastdecode -profile:v high ` +
                  `-vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" ` +
                  `-c:a aac -b:a 48k -ac 1 -ar 24000 -profile:a aac_low -movflags +faststart`;
        break;
      default: // mp4
        // 使用x264编码器，更激进的压缩参数
        codecCmd = `-c:v libx264 -crf 28 -preset fast -tune fastdecode -profile:v high ` +
                  `-vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" ` +
                  `-c:a aac -b:a 48k -ac 1 -ar 24000 -profile:a aac_low -movflags +faststart`;
    }
    
    // 添加通用的视频优化参数
    codecCmd += ` -sws_flags lanczos+accurate_rnd -map_metadata -1`;
    
    await execFFmpeg(`ffmpeg -hide_banner -loglevel error -i "${inputPath}" ${codecCmd} "${tempOutputPath}"`);
    
    // 比较文件大小
    const originalSize = fs.statSync(inputPath).size;
    const compressedSize = fs.statSync(tempOutputPath).size;
    const { isLarger } = compareAndLogSize(inputPath, originalSize, compressedSize);
    
    if (isLarger) {
      // 如果压缩后文件更大，保留原文件
      fs.unlinkSync(tempOutputPath);
      return inputPath;
    }
    
    // 替换原文件（如果是mov/avi转mp4，则删除原文件）
    fs.unlinkSync(inputPath);
    fs.renameSync(tempOutputPath, inputPath.replace(extension, extension === '.mov' || extension === '.avi' ? '.mp4' : extension));
    
    return inputPath;
  } catch (error) {
    if (fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath);
    }
    throw error;
  }
};

// 递归处理目录
const processDirectory = async (dir) => {
  console.log(`开始扫描目录: ${dir}`);
  
  if (!fs.existsSync(dir)) {
    console.error(`错误: 目录不存在 - ${dir}`);
    return { processedCount: 0, errorCount: 0 };
  }
  
  const files = fs.readdirSync(dir);
  console.log(`在 ${dir} 中找到 ${files.length} 个文件/目录`);
  
  const tasks = [];
  const subdirs = [];
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      subdirs.push(filePath);
    } else {
      const extension = getExtension(filePath);
      if (AUDIO_EXTENSIONS.includes(extension)) {
        tasks.push({ path: filePath, type: 'audio' });
      } else if (VIDEO_EXTENSIONS.includes(extension)) {
        tasks.push({ path: filePath, type: 'video' });
      }
    }
  }
  
  // 并行处理文件
  let results = { processedCount: 0, errorCount: 0 };
  if (tasks.length > 0) {
    const processFile = async (task) => {
      try {
        if (task.type === 'audio') {
          await optimizeAudio(task.path);
        } else {
          await optimizeVideo(task.path);
        }
      } catch (error) {
        console.error(`处理文件 ${task.path} 时出错:`, error);
        throw error;
      }
    };
    
    const parallelResults = await processFilesInParallel(tasks, processFile);
    results.processedCount += parallelResults.processedCount;
    results.errorCount += parallelResults.errorCount;
  }
  
  // 递归处理子目录
  for (const subdir of subdirs) {
    const subdirResults = await processDirectory(subdir);
    results.processedCount += subdirResults.processedCount;
    results.errorCount += subdirResults.errorCount;
  }
  
  return results;
};

// 主目录
const mainDir = path.join(__dirname, '../public');

console.log('开始音视频优化处理...');
console.log(`主目录: ${mainDir}`);
console.log('支持的音频格式:', AUDIO_EXTENSIONS.join(', '));
console.log('支持的视频格式:', VIDEO_EXTENSIONS.join(', '));
console.log('警告：此操作将直接替换原文件，请确保已备份重要文件');

// 处理主目录（添加错误处理）
processDirectory(mainDir)
  .then((results) => {
    console.log('\n处理总结:');
    console.log(`- 成功处理文件数: ${results.processedCount}`);
    console.log(`- 处理失败文件数: ${results.errorCount}`);
    console.log('所有文件处理完成！');
  })
  .catch(error => {
    console.error('处理过程中出错:', error);
    process.exit(1);
  }); 