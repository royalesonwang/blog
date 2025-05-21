"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FileImage, CheckCircle2, Copy, X, ImageIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressCircle } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface UploadedImage {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  fileName: string | null;
  originalName: string;
  size: number;
  width: number;
  height: number;
}

interface ImageUploaderProps {
  onImagesUploaded?: (images: UploadedImage[]) => void;
  onImageUploaded?: (imageUrl: string, thumbnailUrl: string | null, altText: string, fileName: string | null) => void;
  defaultFolder?: string;
  showPreview?: boolean;
  showFileInfo?: boolean;
  previewHeight?: string;
  onPreviewChange?: (previewUrl: string | null) => void;
  onFileSelected?: (hasFile: boolean) => void;
  multiple?: boolean;
  maxFiles?: number;
  targetTable?: string; // 指定上传目标表，例如'album_image'
  albumId?: string | null; // 如果上传到相册，指定相册ID
}

export default function ImageUploader({
  onImageUploaded,
  onImagesUploaded,
  defaultFolder = "default",
  showPreview = true,
  showFileInfo = true,
  previewHeight = "h-48",
  onPreviewChange,
  onFileSelected,
  multiple = false,
  maxFiles = 10,
  targetTable = "image_uploads",
  albumId,
}: ImageUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [description, setDescription] = useState("");
  const [altText, setAltText] = useState("");
  const [tags, setTags] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(defaultFolder);
  const [previewUrls, setPreviewUrls] = useState<{[key: string]: string}>({});
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number | null>(null);

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
      }
      
      // 通知父组件文件已选择
      if (onFileSelected) {
        onFileSelected(allowedFiles.length > 0);
      }
      
      if (!multiple) {
        setCurrentFile(allowedFiles[0] || null);
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
  };

  const uploadSingleFile = async (file: File, index: number): Promise<UploadedImage | null> => {
    try {
      // 更新当前正在上传的文件
      setCurrentFile(file);
      
      // 创建form数据
      const formData = new FormData();
      formData.append("file", file);
      formData.append("description", description);
      formData.append("altText", altText);
      formData.append("tags", tags);
      formData.append("folderName", selectedFolder);
      
      // 添加目标表和相册ID参数
      formData.append("targetTable", targetTable);
      if (albumId !== null && albumId !== undefined) {
        formData.append("albumId", albumId);
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
      }));

      const data = await response.json();
      
      if (response.ok) {
        const uploadedImage: UploadedImage = {
          id: data.id,
          url: data.url,
          thumbnailUrl: data.thumbnailUrl,
          fileName: data.fileName,
          originalName: data.original_name,
          size: data.size,
          width: data.width,
          height: data.height
        };

        console.log("Upload successful with details:", uploadedImage);
        
        // 单图上传回调兼容旧版接口
        if (!multiple && onImageUploaded) {
          onImageUploaded(data.url, data.thumbnailUrl, altText, data.fileName);
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
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("请选择要上传的图片");
      return;
    }

    setUploading(true);
    
    try {
      const results: UploadedImage[] = [];
      
      // 按顺序上传所有文件
      for (let i = 0; i < files.length; i++) {
        const result = await uploadSingleFile(files[i], i);
        if (result) {
          results.push(result);
        }
      }
      
      // 更新上传完成的图片列表
      setUploadedImages(results);
      
      // 多图上传回调
      if (onImagesUploaded && results.length > 0) {
        onImagesUploaded(results);
      }
      
      // 清除预览
      if (Object.keys(previewUrls).length > 0) {
        Object.values(previewUrls).forEach(url => {
          URL.revokeObjectURL(url);
        });
      }
      
      setPreviewUrls({});
      setSelectedPreviewIndex(null);
      
      // 通知父组件预览已清除
      if (onPreviewChange) {
        onPreviewChange(null);
      }
      
      toast.success(`成功上传 ${results.length} 个图片`);
      
    } catch (error) {
      console.error("上传错误:", error);
      toast.error(`上传图片失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setUploading(false);
      setCurrentFile(null);
    }
  };
  
  const resetForm = () => {
    // 释放预览URL资源
    Object.values(previewUrls).forEach(url => {
      URL.revokeObjectURL(url);
    });
    
    setFiles([]);
    setPreviewUrls({});
    setSelectedPreviewIndex(null);
    setUploadedImages([]);
    setDescription("");
    setAltText("");
    setTags("");
    setSelectedFolder(defaultFolder);
    setUploadProgress({});
    
    // 通知父组件文件已清除
    if (onPreviewChange) {
      onPreviewChange(null);
    }
    if (onFileSelected) {
      onFileSelected(false);
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
        
        <div className="flex gap-2">
          <Button 
            onClick={handleUpload} 
            disabled={files.length === 0 || uploading}
            className="flex-1"
          >
            {uploading 
              ? `上传中 (${currentFile ? `${Math.round(uploadProgress[`file-${files.indexOf(currentFile)}`] || 0)}%` : "0%"})` 
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
          )}
        </div>
      </div>
        
      {showPreview && (
        <div className="space-y-4">
          {/* 只有当有预览但没上传成功时显示预览图 */}
          {selectedPreviewIndex !== null && files.length > 0 && (
            <div className={`flex items-center justify-center ${previewHeight} bg-muted rounded-md mb-4`}>
              <img
                src={previewUrls[`file-${selectedPreviewIndex}`]}
                alt="预览"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
          
          {/* 上传成功后显示成功信息 */}
          {uploadedImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="font-medium">上传成功！</p>
              </div>
              
              <div>
                <Label>上传结果:</Label>
                <div className="mt-2 space-y-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{image.originalName}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <Label>原图 URL:</Label>
                          <div className="flex gap-2 mt-1">
                            <Input value={image.url} readOnly className="text-xs" />
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                navigator.clipboard.writeText(image.url);
                                toast.success("URL已复制到剪贴板");
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {image.thumbnailUrl && (
                          <div>
                            <Label>缩略图 URL:</Label>
                            <div className="flex gap-2 mt-1">
                              <Input value={image.thumbnailUrl} readOnly className="text-xs" />
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => {
                                  navigator.clipboard.writeText(image.thumbnailUrl);
                                  toast.success("缩略图URL已复制到剪贴板");
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
