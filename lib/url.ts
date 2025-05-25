/**
 * 图片URL处理工具函数
 */

// 客户端和服务端都能使用的配置
const DEFAULT_CONFIG = {
  domain: 'https://storage.eson.wang', // 从环境变量获取的默认域名
  imageFolder: 'uploads',
  thumbnailFolder: 'thumbnail'
};

/**
 * 获取环境配置（兼容客户端和服务端）
 */
function getConfig() {
  // 优先使用环境变量，如果不存在则使用默认配置
/*   console.log("process.env.NEXT_PUBLIC_R2_DOMAIN:"+process.env.NEXT_PUBLIC_R2_DOMAIN)
  console.log("process.env.IMAGE_FOLDER:"+process.env.NEXT_PUBLIC_IMAGE_FOLDER)
  console.log("process.env.THUMBNAIL_FOLDER:"+process.env.NEXT_PUBLIC_THUMBNAIL_FOLDER) */  
  return {
    domain: process.env.NEXT_PUBLIC_R2_DOMAIN || DEFAULT_CONFIG.domain,
    imageFolder: process.env.NEXT_PUBLIC_IMAGE_FOLDER || DEFAULT_CONFIG.imageFolder,
    thumbnailFolder: process.env.NEXT_PUBLIC_THUMBNAIL_FOLDER || DEFAULT_CONFIG.thumbnailFolder
  };
}

/**
 * 构建图片的原始URL
 * @param filePath 图片的文件路径
 * @returns 完整的原始图片URL
 */
export function getImageUrl(filePath: string): string {
  if (!filePath) return '';
  
  try {
    // 获取配置
    const config = getConfig();
    
    // 确保domain没有尾随斜杠
    const cleanDomain = config.domain.endsWith('/') ? config.domain.slice(0, -1) : config.domain;
    
    // 如果filePath已经是完整URL（包含http或https），直接返回
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    // 去掉可能以/开头的路径
    const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    // 如果normalizedPath已经包含了文件夹路径，则不再添加IMAGE_FOLDER
    if (normalizedPath.startsWith(`${config.imageFolder}/`) || normalizedPath.startsWith('uploads/')) {
      return `${cleanDomain}/${normalizedPath}`;
    }
    
    // 标准形式：域名/文件夹/文件路径
    return `${cleanDomain}/${config.imageFolder}/${normalizedPath}`;
  } catch (error) {
    console.error("Error generating image URL:", error, { filePath });
    return filePath || ''; // 失败时返回原始路径或空字符串
  }
}

/**
 * 构建图片的缩略图URL
 * @param filePath 图片的文件路径
 * @returns 完整的缩略图URL
 */
export function getThumbnailUrl(filePath: string): string {
  if (!filePath) return '';
  
  try {
    // 获取配置
    const config = getConfig();
    
    // 确保domain没有尾随斜杠
    const cleanDomain = config.domain.endsWith('/') ? config.domain.slice(0, -1) : config.domain;
    
    // 如果filePath已经是完整URL（包含http或https）
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      // 检查是否为上传图片URL，如果是则替换为缩略图URL
      if (filePath.includes(`/${config.imageFolder}/`)) {
        return filePath.replace(`/${config.imageFolder}/`, `/${config.thumbnailFolder}/`);
      }
      return filePath; // 如果不是上传图片URL，直接返回原URL
    }
    
    // 去掉可能以/开头的路径
    const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    // 如果normalizedPath包含了uploads/路径，替换为thumbnail/
    if (normalizedPath.startsWith(`${config.imageFolder}/`)) {
      return `${cleanDomain}/${normalizedPath.replace(`${config.imageFolder}/`, `${config.thumbnailFolder}/`)}`;
    }
    
    // 如果normalizedPath已经明确以缩略图文件夹开头
    if (normalizedPath.startsWith(`${config.thumbnailFolder}/`)) {
      return `${cleanDomain}/${normalizedPath}`;
    }
    
    // 标准形式：域名/缩略图文件夹/文件路径
    return `${cleanDomain}/${config.thumbnailFolder}/${normalizedPath}`;
  } catch (error) {
    console.error("Error generating thumbnail URL:", error, { filePath });
    return filePath || ''; // 失败时返回原始路径或空字符串
  }
}

/**
 * 从文件路径中提取不包含文件夹的文件名
 * @param filePath 文件路径
 * @returns 不包含文件夹的文件名
 */
export function getFileNameFromPath(filePath: string): string {
  if (!filePath) return '';
  
  // 去除可能包含的域名部分
  let path = filePath;
  if (path.includes('://')) {
    path = path.split('/').slice(3).join('/');
  }
  
  // 去除文件夹部分，只保留文件名
  const segments = path.split('/');
  return segments[segments.length - 1];
}

/**
 * 获取公共访问URL（优先使用缩略图，如果不存在则使用原图）
 * @param filePath 图片的文件路径
 * @returns 完整的公共访问URL
 */
export function getPublicUrl(filePath: string): string {
  if (!filePath) return '';
  
  // 如果已经是完整URL，直接返回
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // 清理路径开头的斜杠
  const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
  
  // 默认返回缩略图URL
  return getThumbnailUrl(cleanPath);
}
