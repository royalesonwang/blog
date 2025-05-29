"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FileImage, CheckCircle2, Copy, X, ImageIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
// 从本地导入 ProgressCircle 组件
import { ProgressCircle } from "./ProgressCircle";
import { cn } from "@/lib/utils";
import { getImageUrl, getThumbnailUrl } from "@/lib/url";
import { extractExifData, getDeviceInfo, getLocationInfo, formatExposureTime, formatFNumber, formatFocalLength, getExifSummary, ExifData } from "@/lib/exif-parser";

interface UploadedImage {  
  id: string;
  file_path: string;
  fileName: string | null;
  originalName: string;
  size: number;
  width: number;
  height: number;
  exif_iso?: number | null; // ISO值
  exif_exposure_time?: number | null; // 快门速度
  exif_f_number?: number | null; // 光圈值
  exif_focal_length?: number | null; // 焦距
  device?: string | null; // 设备信息
  location?: string | null; // 位置信息
}

interface UploadedImageWithUrls extends UploadedImage {
  url: string;
  thumbnailUrl: string | null;
}

interface ImageUploaderProps {
  onImagesUploaded?: (images: UploadedImageWithUrls[]) => void;
  onImageUploaded?: (imageUrl: string, thumbnailUrl: string, altText: string, fileName: string | null) => void;
  defaultFolder?: string;
  showFileInfo?: boolean;
  previewHeight?: string;
  onPreviewChange?: (previewUrl: string | null) => void;
  onFileSelected?: (hasFile: boolean) => void;
  multiple?: boolean;
  maxFiles?: number;
  targetTable?: string; // 指定上传目标表，例如'album_image'
  albumId?: string | null; // 如果上传到相册，指定相册ID
  compressImages?: boolean; // 是否压缩图片
  maxImageWidth?: number; // 压缩后的最大宽度
  maxImageHeight?: number; // 压缩后的最大高度
  imageQuality?: number; // 压缩质量(0-1)
  addWatermarkByDefault?: boolean; // 默认是否添加水印
}

export default function ImageUploader({
  onImageUploaded,
  onImagesUploaded,
  defaultFolder = "default",
  showFileInfo = true,
  previewHeight = "h-48",
  onPreviewChange,
  onFileSelected,
  multiple = false,
  maxFiles = 10,  targetTable = "image_uploads",
  albumId,
  compressImages = true, // 默认启用压缩
  maxImageWidth = 2160, // 与后端一致
  maxImageHeight = 2160, // 与后端一致
  imageQuality = 1, // 默认质量100%
  addWatermarkByDefault = false, // 默认不添加水印
}: ImageUploaderProps) {  const [files, setFiles] = useState<File[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentUploadIndex, setCurrentUploadIndex] = useState<number>(-1); // 添加当前上传文件索引
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [compressionInfo, setCompressionInfo] = useState<{
    original: { size: number, width: number, height: number },
    compressed: { size: number, width: number, height: number }
  } | null>(null);
  const [description, setDescription] = useState("");
  const [altText, setAltText] = useState("");
  const [tags, setTags] = useState("");
  const [device, setDevice] = useState("");
  const [location, setLocation] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(defaultFolder);
  const [previewUrls, setPreviewUrls] = useState<{[key: string]: string}>({});  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number | null>(null);
  // 添加一个状态来控制是否启用压缩
  const [enableCompression, setEnableCompression] = useState<boolean>(compressImages);
  // 添加一个状态来控制是否添加水印
  const [addWatermark, setAddWatermark] = useState<boolean>(addWatermarkByDefault);
  // 添加状态来存储每个文件的EXIF数据
  const [fileExifData, setFileExifData] = useState<{[key: string]: ExifData}>({});

  // 清理函数，组件卸载时释放创建的预览URL
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      const totalFiles = multiple ? [...files, ...fileList] : fileList;
      
      // 限制文件数量
      const allowedFiles = totalFiles.slice(0, maxFiles);
      
      if (totalFiles.length > maxFiles) {
        toast.warning(`最多只能上传${maxFiles}个文件。`);
      }
      
      setFiles(allowedFiles);
      
      // 清除之前的预览URL
      Object.values(previewUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
      
      // 创建新的预览URLs
      const newPreviewUrls: {[key: string]: string} = {};
      allowedFiles.forEach((file, index) => {
        newPreviewUrls[`file-${index}`] = URL.createObjectURL(file);
      });
        setPreviewUrls(newPreviewUrls);
      setSelectedPreviewIndex(0);
      
      // 通知父组件预览URL已更新
      if (onPreviewChange && Object.values(newPreviewUrls).length > 0) {
        onPreviewChange(Object.values(newPreviewUrls)[0]);
      }      // 通知父组件文件已选择
      if (onFileSelected) {
        onFileSelected(allowedFiles.length > 0);
      }

      // 清空之前的EXIF数据
      setFileExifData({});
      
      // 为所有文件提取EXIF数据（无论单图还是多图）
      if (allowedFiles.length > 0) {
        allowedFiles.forEach((file, index) => {
          extractExifData(file).then(exifData => {
              // 对于第一个文件，自动填充设备信息（但不填充地点信息）
            if (index === 0) {
              const deviceInfo = getDeviceInfo(exifData);
              
              // 只自动填充设备信息，不填充地点信息
              if (deviceInfo && !device) {
                setDevice(deviceInfo);
              }
            }
            
            // 存储EXIF数据以在预览中显示
            if (exifData && Object.keys(exifData).length > 0) {
              setFileExifData(prev => {
                const newData = {
                  ...prev,
                  [`file-${index}`]: exifData
                };
                return newData;
              });
            } else {
              console.log(`No EXIF data to store for file-${index}`);
            }
          }).catch(error => {
            console.error(`EXIF提取失败，文件${index}:`, error);
          });
        });
      }      // 设置当前文件（用于单图模式）
      if (!multiple && allowedFiles.length > 0) {
        setCurrentFile(allowedFiles[0]);
      } else if (!multiple) {
        setCurrentFile(null);
      }
    }
  };
  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    // 更新预览URLs
    const fileKey = `file-${index}`;
    if (previewUrls[fileKey]) {
      URL.revokeObjectURL(previewUrls[fileKey]);
      const newPreviewUrls = { ...previewUrls };
      delete newPreviewUrls[fileKey];
      
      // 重新映射键值对以确保键的连续性
      const updatedPreviewUrls: {[key: string]: string} = {};
      newFiles.forEach((file, idx) => {
        const oldKey = `file-${idx < index ? idx : idx + 1}`;
        if (newPreviewUrls[oldKey]) {
          updatedPreviewUrls[`file-${idx}`] = newPreviewUrls[oldKey];
        }
      });
      
      setPreviewUrls(updatedPreviewUrls);
      
      // 更新EXIF数据映射，确保键的连续性
      const newFileExifData = { ...fileExifData };
      delete newFileExifData[fileKey];
      
      const updatedFileExifData: {[key: string]: ExifData} = {};
      newFiles.forEach((file, idx) => {
        const oldKey = `file-${idx < index ? idx : idx + 1}`;
        if (newFileExifData[oldKey]) {
          updatedFileExifData[`file-${idx}`] = newFileExifData[oldKey];
        }
      });
      
      setFileExifData(updatedFileExifData);
      
      // 更新选中的预览
      if (selectedPreviewIndex === index) {
        if (newFiles.length > 0) {
          const newIndex = Math.min(index, newFiles.length - 1);
          setSelectedPreviewIndex(newIndex);
          if (onPreviewChange) {
            onPreviewChange(updatedPreviewUrls[`file-${newIndex}`] || null);
          }
        } else {
          setSelectedPreviewIndex(null);
          if (onPreviewChange) {
            onPreviewChange(null);
          }
        }
      } else if (selectedPreviewIndex !== null && selectedPreviewIndex > index) {
        setSelectedPreviewIndex(selectedPreviewIndex - 1);
      }
    }
    
    // 通知父组件文件已选择
    if (onFileSelected) {
      onFileSelected(newFiles.length > 0);
    }
  };

  const handleSelectPreview = (index: number) => {
    setSelectedPreviewIndex(index);
    if (onPreviewChange) {
      onPreviewChange(previewUrls[`file-${index}`] || null);
    }
  };  const uploadSingleFile = async (file: File, index: number): Promise<UploadedImage | null> => {
    try {
      // 更新当前正在上传的文件和索引
      setCurrentFile(file);
      setCurrentUploadIndex(index);
      
      // 使用已存储的EXIF数据（而不是重新提取，因为压缩后EXIF会丢失）
      const exifData = fileExifData[`file-${index}`] || {};
      console.log("使用已存储的EXIF数据:", exifData);
      
      // 创建form数据
      const formData = new FormData();
      formData.append("file", file);
      formData.append("description", description);
      formData.append("altText", altText);
      formData.append("tags", tags);
      formData.append("folderName", selectedFolder);
      formData.append("device", device);
      formData.append("location", location);
      formData.append("targetTable", targetTable);
      if (albumId) {
        formData.append("albumId", albumId);
      }
        // 添加EXIF数据到表单
      if (exifData.ISO) {
        formData.append("exif_iso", exifData.ISO.toString());
      }
      if (exifData.ExposureTime) {
        formData.append("exif_exposure_time", exifData.ExposureTime.toString());
      }
      if (exifData.FNumber) {
        formData.append("exif_f_number", exifData.FNumber.toString());
      }
      if (exifData.FocalLength) {
        formData.append("exif_focal_length", exifData.FocalLength.toString());
      }

      // 设置初始进度
      setUploadProgress(prev => ({
        ...prev,
        [`file-${index}`]: 0
      }));

      // 模拟上传进度 (真实情况下可以使用XMLHttpRequest来跟踪进度)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[`file-${index}`] || 0;
          if (currentProgress < 90) {
            return {
              ...prev,
              [`file-${index}`]: currentProgress + Math.random() * 10
            };
          }
          return prev;
        });
      }, 300);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      
      // 设置完成状态
      setUploadProgress(prev => ({
        ...prev,
        [`file-${index}`]: 100
      }));      const data = await response.json();
        if (response.ok) {
        const uploadedImage: UploadedImage = {
          id: data.id,
          file_path: data.file_path,
          fileName: data.fileName,
          originalName: data.original_name,
          size: data.size,
          width: data.width,
          height: data.height,
          // 添加EXIF数据到上传结果
          exif_iso: exifData.ISO || null,
          exif_exposure_time: exifData.ExposureTime || null,
          exif_f_number: exifData.FNumber || null,
          exif_focal_length: exifData.FocalLength || null,
          device: device || null,
          location: location || null
        };console.log("Upload successful with details:", uploadedImage);
          // 单图上传回调兼容旧版接口
        if (!multiple && onImageUploaded) {
          try {
            const imageUrl = data.file_path ? getImageUrl(data.file_path) : '';
            const thumbnailUrl = data.file_path ? getThumbnailUrl(data.file_path) : '';
            onImageUploaded(imageUrl, thumbnailUrl, altText, data.fileName);
          } catch (error) {
            console.error("Error processing image URLs for callback:", error);
            onImageUploaded('', '', altText, data.fileName);
          }
        }
        return uploadedImage;
      } else {
        throw new Error(data.message || "上传图片失败");
      }
    } catch (error) {
      console.error("上传错误:", error);
      toast.error(`文件 ${file.name} 上传失败: ${error instanceof Error ? error.message : "未知错误"}`);
      
      // 设置错误状态
      setUploadProgress(prev => ({
        ...prev,
        [`file-${index}`]: -1 // 使用负值表示错误
      }));
      
      return null;
    }
  };  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("请选择要上传的图片");
      return;
    }

    setUploading(true);
    
    try {
      const results: UploadedImage[] = [];
      
      // 按顺序上传所有文件
      for (let i = 0; i < files.length; i++) {
        // 压缩图片（如果启用压缩）
        const fileToUpload = enableCompression ? await compressImage(files[i]) : files[i];
        
        // 上传文件（使用已经提取并存储的EXIF数据）
        const result = await uploadSingleFile(fileToUpload, i);
        if (result) {
          results.push(result);
        }
      }
      
      // 更新上传完成的图片列表
      setUploadedImages(results);
        // 多图上传回调
      if (onImagesUploaded && results.length > 0) {
        // 转换为页面组件期望的格式，添加url和thumbnailUrl字段
        const processedResults = results.map(img => {
          try {
            const imageUrl = img.file_path ? getImageUrl(img.file_path) : '';
            // 构建缩略图URL
            const thumbnailUrl = img.file_path ? getThumbnailUrl(img.file_path) : null;
            return {
              ...img,
              url: imageUrl,
              thumbnailUrl: thumbnailUrl
            };
          } catch (error) {
            console.error("Error processing image URLs:", error);
            return {
              ...img,
              url: '',
              thumbnailUrl: null
            };
          }
        });
        onImagesUploaded(processedResults);
      }
        // 清除预览
      if (Object.keys(previewUrls).length > 0) {
        Object.values(previewUrls).forEach(url => {
          URL.revokeObjectURL(url);
        });
      }
        // 清空文件列表和相关状态
      setFiles([]);
      setPreviewUrls({});
      setSelectedPreviewIndex(null);
      setUploadProgress({});
      setFileExifData({});
      setCurrentUploadIndex(-1); // 重置当前上传索引
      
      // 通知父组件预览已清除和文件已清除
      if (onPreviewChange) {
        onPreviewChange(null);
      }
      if (onFileSelected) {
        onFileSelected(false);
      }
      
    } catch (error) {
      console.error("上传错误:", error);
      toast.error(`上传图片失败: ${error instanceof Error ? error.message : "未知错误"}`);    } finally {
      setUploading(false);
      setCurrentFile(null);
      setCurrentUploadIndex(-1); // 重置当前上传索引
    }
  };    const resetForm = () => {
    // 释放预览URL资源
    Object.values(previewUrls).forEach(url => {
      URL.revokeObjectURL(url);
    });
      setFiles([]);
    setPreviewUrls({});
    setSelectedPreviewIndex(null);
    setUploadedImages([]);
    setCurrentUploadIndex(-1); // 重置当前上传索引
    setDescription("");
    setAltText("");
    setTags("");
    setDevice("");
    setLocation("");
    setSelectedFolder(defaultFolder);
    setUploadProgress({});
    setFileExifData({}); // 清除EXIF数据
    
    // 通知父组件文件已清除
    if (onPreviewChange) {
      onPreviewChange(null);
    }
    if (onFileSelected) {
      onFileSelected(false);
    }
  };// 图片压缩和添加水印函数
  const compressImage = async (file: File): Promise<File> => {
    // 如果用户禁用了压缩且不需要添加水印，或者文件是GIF格式(GIF不适合用canvas压缩)，直接返回原文件
    if ((!enableCompression && !addWatermark) || file.type === 'image/gif') {
      return file;
    }

    try {
      // 创建一个FileReader读取文件
      const reader = new FileReader();
      
      // 将文件读取为Data URL
      return new Promise((resolve, reject) => {
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            // 获取原始尺寸
            let width = img.width;
            let height = img.height;
            
            // 检查是否需要调整大小并添加水印
            const shouldProcessImage = width > maxImageWidth || height > maxImageHeight || file.size >= 1024 * 1024 || addWatermark;
            
            if (!shouldProcessImage) {
              // 如果文件小于1MB且尺寸不超过限制，且不需要添加水印，则不处理
              resolve(file);
              return;
            }
            
            // 维持宽高比例的情况下调整尺寸
            if (width > maxImageWidth) {
              const ratio = maxImageWidth / width;
              width = maxImageWidth;
              height = Math.round(height * ratio);
            }
            
            if (height > maxImageHeight) {
              const ratio = maxImageHeight / height;
              height = maxImageHeight;
              width = Math.round(width * ratio);
            }
            
            // 创建canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            // 在canvas上绘制调整大小后的图像
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              console.error('无法创建canvas上下文');
              resolve(file); // 失败时返回原始文件
              return;
            }
            
            // 绘制图片
            ctx.drawImage(img, 0, 0, width, height);
            
            // 添加水印
            if (addWatermark) {
              const watermark = new Image();
              watermark.onload = () => {                // 水印位置计算 - 底部居中
                const watermarkWidth = Math.min(height * 0.2, watermark.width); // 限制水印大小为图片宽度的30%
                const watermarkHeight = (watermarkWidth / watermark.width) * watermark.height;
                const watermarkX = (width - watermarkWidth) / 2; // 水平居中放置
                const watermarkY = height - watermarkHeight - 30; // 距离底部边缘30像素
                
                // 设置水印透明度
                ctx.globalAlpha = 1; // 半透明水印
                
                // 绘制水印
                ctx.drawImage(watermark, watermarkX, watermarkY, watermarkWidth, watermarkHeight);
                
                // 恢复透明度
                ctx.globalAlpha = 1.0;
                
                // 导出图片
                exportCanvasToFile();
              };
              
              // 加载水印图片出错时，仍然导出无水印图片
              watermark.onerror = () => {
                console.error('水印图片加载失败');
                exportCanvasToFile();
              };
              
              // 加载水印图片
              watermark.src = '/imgs/watermark.png';
            } else {
              // 无需水印，直接导出
              exportCanvasToFile();
            }
            
            // 导出Canvas到File对象
            function exportCanvasToFile() {
              // 将canvas内容转换为Blob
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    console.error('无法生成blob');
                    resolve(file);
                    return;
                  }
                  
                  // 创建新的File对象
                  const processedFile = new File(
                    [blob],
                    file.name, // 保持原文件名
                    {
                      type: file.type,
                      lastModified: Date.now(),
                    }
                  );
                  // 更新处理信息状态
                  setCompressionInfo({
                    original: { size: file.size, width: img.width, height: img.height },
                    compressed: { size: processedFile.size, width, height }
                  });
                  
                  resolve(processedFile);
                },
                file.type,
                imageQuality // 压缩质量
              );
            }          };
          
          img.onerror = () => {
            console.error('图片加载失败');
            resolve(file); // 失败时返回原始文件
          };
          
          // 设置图片源
          img.src = event.target?.result as string;
        };
        
        reader.onerror = () => {
          console.error('读取文件失败');
          resolve(file); // 失败时返回原始文件
        };
        
        // 开始读取文件
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('压缩图片时出错:', error);
      return file; // 出错时返回原始文件
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="picture">选择图片{multiple ? " (可多选)" : ""}</Label>
          <div className="relative">
            <Input
              id="picture"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              multiple={multiple}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
            />
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-8 flex flex-col items-center justify-center gap-2 hover:border-muted-foreground/50 transition-colors">
              <UploadIcon className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                {multiple 
                  ? `点击或拖拽图片到此处上传（最多${maxFiles}张）` 
                  : "点击或拖拽图片到此处上传"}
              </p>
              <p className="text-xs text-muted-foreground">支持 JPG, PNG, GIF, WEBP 格式</p>
            </div>
          </div>
        </div>
        
        {files.length > 0 && (
          <div className="mt-4">
            <Label className="mb-2 block">已选择 {files.length} 张图片</Label>
            <div className="flex flex-wrap gap-2 mb-4">
              {files.map((file, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "relative group border rounded-md overflow-hidden w-16 h-16", 
                    selectedPreviewIndex === index ? "ring-2 ring-primary" : ""
                  )}
                  onClick={() => handleSelectPreview(index)}
                >
                  <img 
                    src={previewUrls[`file-${index}`]} 
                    alt={`预览 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-0 right-0 w-5 h-5 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {uploadProgress[`file-${index}`] > 0 && uploadProgress[`file-${index}`] < 100 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                      <ProgressCircle 
                        value={uploadProgress[`file-${index}`]} 
                        className="w-8 h-8" 
                      />
                    </div>
                  )}
                  {uploadProgress[`file-${index}`] === 100 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                  {uploadProgress[`file-${index}`] === -1 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                      <X className="h-5 w-5 text-destructive" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
      <div className="space-y-4">
        {/* 只有当有预览但没上传成功时显示预览图 */}
        {selectedPreviewIndex !== null && files.length > 0 && (
            <>
              {/* 显示EXIF信息 - 强制显示以便调试 */}
              {selectedPreviewIndex !== null && (
                <div>
                    {/* 显示EXIF摘要 */}
                  {(() => {
                    const exifData = fileExifData[`file-${selectedPreviewIndex}`];
                    const summary = getExifSummary(exifData);
                    
                    if (summary) {
                      return (
                        <div className="mt-3 pt-3">
                          <p className="text-md">{summary}</p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </>
          )}
          
          {/* 上传成功后显示成功信息 */}
          {uploadedImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="font-medium">上传成功！</p>
              </div>
              
            </div>
          )}
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="folder">文件夹</Label>
          <Input
            id="folder"
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            placeholder="输入文件夹名称..."
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            用于组织图片的文件夹。默认为 {defaultFolder}。
          </p>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="altText">替代文本</Label>
          <Input
            id="altText"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="图片的替代文本（用于无障碍访问）..."
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            用于屏幕阅读器和SEO的图片描述。
          </p>
        </div>
          <div className="grid gap-2">
          <Label htmlFor="description">描述</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="输入图片描述..."
            autoComplete="off"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="device">拍摄设备</Label>
          <Input
            id="device"
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            placeholder="如：iPhone 15 Pro, Canon EOS R5..."
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            用于记录拍摄图片的设备信息
          </p>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="location">拍摄地点</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="如：北京市海淀区，巴黎埃菲尔铁塔..."
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            用于记录图片拍摄的地理位置信息
          </p>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="tags">标签</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="用逗号分隔的标签..."
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            用逗号分隔标签（例如：自然,风景,天空）
          </p>
        </div>
          <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Switch
              id="compression-mode"
              checked={enableCompression}
              onCheckedChange={setEnableCompression}
            />
            <Label htmlFor="compression-mode" className="cursor-pointer">
              上传前的图片压缩 ({maxImageWidth}x{maxImageHeight}, 质量 {Math.round(imageQuality * 100)}%)
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            {enableCompression
              ? "已启用压缩，自动调整图片尺寸和质量以减小文件大小" 
              : "未启用压缩，将上传原始图片（可能会因文件过大导致上传失败）"}
          </p>
        </div>
        
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Switch
              id="watermark-mode"
              checked={addWatermark}
              onCheckedChange={setAddWatermark}
            />
            <Label htmlFor="watermark-mode" className="cursor-pointer">
              添加水印
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            {addWatermark 
              ? "已启用水印，上传的图片将自动添加水印" 
              : "未启用水印，上传的图片将不添加水印"}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleUpload} 
            disabled={files.length === 0 || uploading}
            className="flex-1"          >
            {uploading 
              ? `上传中 (${currentUploadIndex >= 0 ? `${Math.round(uploadProgress[`file-${currentUploadIndex}`] || 0)}%` : "0%"})` 
              : `上传${multiple ? " " + files.length + " 张" : ""}图片`}
          </Button>
          {files.length > 0 && (
            <Button 
              variant="outline" 
              onClick={resetForm} 
              disabled={uploading}
            >
              清除
            </Button>
          )}        </div>
      </div>
      
    </div>
  );
}
