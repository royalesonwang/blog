import ExifParser from 'exif-parser';

export interface ExifData {
  ISO?: number;
  ShutterSpeedValue?: number;
  ExposureTime?: number; // 快门速度 (例如：1/250)
  FNumber?: number; // 光圈 (例如：f/2.8)
  FocalLength?: number; // 焦距
  Make?: string; // 相机制造商
  Model?: string; // 相机型号
  LensModel?: string; // 镜头型号
  DateTimeOriginal?: string; // 拍摄时间
  GPSLatitude?: number; // GPS纬度
  GPSLongitude?: number; // GPS经度
  GPSAltitude?: number; // GPS高度
}

/**
 * 从文件对象中提取EXIF数据
 * @param file 图片文件对象
 * @returns 包含EXIF数据的对象，如果无法提取则返回空对象
 */
export async function extractExifData(file: File): Promise<ExifData> {
  try {
    // 如果不是图片文件，则直接返回空对象
    if (!file.type.startsWith('image/')) {
      console.warn('非图片文件，跳过EXIF解析:', file.type);
      return {};
    }

    // 将文件转换为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // 使用 exif-parser 解析EXIF数据
    const parser = ExifParser.create(arrayBuffer);
    
    // 启用各种选项以获取更完整的数据
    parser.enableBinaryFields(false);
    parser.enableImageSize(true);
    parser.enableReturnTags(true);
    parser.enableSimpleValues(true);
    
    const exifData = parser.parse();
    
    // 提取我们需要的数据
    const result: ExifData = {};
    
    if (exifData.tags) {
      const tags = exifData.tags;
      
      // 基本相机信息
      if (tags.Make) result.Make = tags.Make;
      if (tags.Model) result.Model = tags.Model;
      if (tags.LensModel) result.LensModel = tags.LensModel;
      
      // 摄影参数
      if (tags.ISO) result.ISO = tags.ISO;
      if (tags.ExposureTime) result.ExposureTime = tags.ExposureTime;
      if (tags.FNumber) result.FNumber = tags.FNumber;
      if (tags.FocalLength) result.FocalLength = tags.FocalLength;
      if (tags.ShutterSpeedValue) result.ShutterSpeedValue = tags.ShutterSpeedValue;
      
      // 拍摄时间
      if (tags.DateTimeOriginal) {
        // exif-parser 返回的是 Unix 时间戳，需要转换为 ISO 字符串
        result.DateTimeOriginal = new Date(tags.DateTimeOriginal * 1000).toISOString();
      }
      
      // GPS信息
      if (tags.GPSLatitude !== undefined && tags.GPSLongitude !== undefined) {
        result.GPSLatitude = tags.GPSLatitude;
        result.GPSLongitude = tags.GPSLongitude;
      }
      if (tags.GPSAltitude !== undefined) {
        result.GPSAltitude = tags.GPSAltitude;
      }
    }
    
    // 如果没有直接的 ExposureTime 但有 ShutterSpeedValue，进行转换
    if (!result.ExposureTime && result.ShutterSpeedValue !== undefined) {
      result.ExposureTime = 1.0 / Math.pow(2, result.ShutterSpeedValue);
    }
    
    console.log('提取的EXIF数据:', result);
    return result;
  } catch (error) {
    console.error('EXIF数据提取失败:', error);
    return {};
  }
}

/**
 * 格式化曝光时间(快门速度)为友好的显示格式
 * @param exposureTime 原始曝光时间值（秒）
 * @returns 格式化的字符串，例如 "1/250"
 */
export function formatExposureTime(exposureTime?: number): string {
  if (!exposureTime) return 'N/A';
  
  // 如果曝光时间大于或等于1秒，直接显示秒数
  if (exposureTime >= 1) {
    return `${exposureTime}s`;
  }
  
  // 否则转换为分数形式（1/x）
  const denominator = Math.round(1 / exposureTime);
  return `1/${denominator}s`;
}

/**
 * 格式化光圈值为友好的显示格式
 * @param fNumber 原始光圈值
 * @returns 格式化的字符串，例如 "f/2.8"
 */
export function formatFNumber(fNumber?: number): string {
  if (!fNumber) return 'N/A';
  return `f/${fNumber}`;
}

/**
 * 格式化焦距为友好的显示格式
 * @param focalLength 原始焦距值(mm)
 * @returns 格式化的字符串，例如 "35mm"
 */
export function formatFocalLength(focalLength?: number): string {
  if (!focalLength) return 'N/A';
  return `${Math.round(focalLength)}mm`;
}

/**
 * 从EXIF数据中提取设备信息
 * @param exif EXIF数据
 * @returns 设备信息字符串
 */
export function getDeviceInfo(exif: ExifData | undefined | null): string {
  if (!exif || (!exif.Make && !exif.Model)) return '';
  
  if (exif.Make && exif.Model) {
    // 有些相机型号中已经包含了制造商名称，避免重复
    if (exif.Model.includes(exif.Make)) {
      return exif.Model;
    }
    return `${exif.Make} ${exif.Model}`;
  }
  
  return exif.Make || exif.Model || '';
}

/**
 * 从EXIF数据中提取地理位置信息
 * @param exif EXIF数据
 * @returns 位置坐标字符串
 */
export function getLocationInfo(exif: ExifData): string {
  if (exif.GPSLatitude && exif.GPSLongitude) {
    return `${exif.GPSLatitude.toFixed(6)}, ${exif.GPSLongitude.toFixed(6)}`;
  }
  return '';
}

/**
 * 获取图片的主要EXIF信息的简洁描述
 * @param exif EXIF数据
 * @returns 主要参数描述
 */
export function getExifSummary(exif: ExifData | undefined | null): string {
  if (!exif) return '';
  
  const parts: string[] = [];
  
  if (exif.FocalLength) parts.push(formatFocalLength(exif.FocalLength));
  if (exif.FNumber) parts.push(formatFNumber(exif.FNumber));
  if (exif.ExposureTime) parts.push(formatExposureTime(exif.ExposureTime));
  if (exif.ISO) parts.push(`ISO ${exif.ISO}`);
  
  return parts.join(' · ');
}
