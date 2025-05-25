"use client";

import { useState, useEffect } from "react";
import { ImageIcon, Upload, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUploadDialog from "@/components/blocks/editor/ImageUploadDialog";
import CloudImageDialog from "@/components/blocks/editor/CloudImageDialog";
import { getImageUrl } from "@/lib/url";

interface CoverImageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  defaultFolder?: string;
}

export default function CoverImageSelector({
  value = "",
  onChange,
  placeholder = "Enter cover image URL...",
  error,
  defaultFolder = "cover_image",
}: CoverImageSelectorProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCloudDialogOpen, setIsCloudDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  useEffect(() => {
    console.log("CoverImageSelector: value prop changed", value);
    setInputValue(value || "");
  }, [value]);
  const handleUploadImage = (imageUrl: string) => {
    // 从完整URL中提取相对路径
    const relativePath = extractRelativePath(imageUrl);
    console.log("CoverImageSelector: image uploaded", relativePath);
    setInputValue(relativePath);
    onChange(relativePath);
    setIsUploadDialogOpen(false);
  };
    // 提取相对路径的辅助函数
  const extractRelativePath = (url: string): string => {
    // 如果已经是相对路径，直接返回
    if (url.startsWith('/') || !url.startsWith('http')) {
      return url;
    }
    
    const config = {
      domain: process.env.NEXT_PUBLIC_R2_DOMAIN || 'https://storage.eson.wang',
      imageFolder: process.env.NEXT_PUBLIC_IMAGE_FOLDER || 'uploads',
      thumbnailFolder: process.env.NEXT_PUBLIC_THUMBNAIL_FOLDER || 'thumbnail'
    };
    
    // 去除域名部分
    const cleanDomain = config.domain.endsWith('/') ? config.domain.slice(0, -1) : config.domain;
    if (url.startsWith(cleanDomain)) {
      let path = url.substring(cleanDomain.length);
      
      // 移除多余的 /uploads/ 前缀，只保留最后的文件路径部分
      if (path.startsWith(`/${config.imageFolder}/`)) {
        path = path.substring(`/${config.imageFolder}/`.length);
      }
      
      return path;
    }
    
    return url;
  };
  const handleSelectImage = (imageUrl: string, altText: string) => {
    // 从完整URL中提取相对路径
    const relativePath = extractRelativePath(imageUrl);
    console.log("CoverImageSelector: image selected", relativePath);
    setInputValue(relativePath);
    onChange(relativePath);
    setIsCloudDialogOpen(false);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // 如果用户输入完整URL，也转换为相对路径
    const relativePath = extractRelativePath(newValue);
    console.log("CoverImageSelector: input changed", relativePath);
    setInputValue(relativePath);
    onChange(relativePath);
  };

  return (
    <div className="space-y-2">      <div className="flex flex-col space-y-2">        {inputValue && (
          <div className="w-full h-40 mb-2 relative rounded-md overflow-hidden border">
            <img
              src={getImageUrl(inputValue)}
              alt="Cover preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                // 如果图片加载失败，可能是因为相对路径问题，尝试不同的前缀
                const imgElement = e.currentTarget;
                const src = imgElement.src;
                
                if (!src.includes('/thumbnail/') && inputValue.includes('/thumbnail/')) {
                  // 尝试直接使用完整路径
                  imgElement.src = getImageUrl(inputValue);
                }
              }}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder={placeholder}
              value={inputValue}
              onChange={handleInputChange}
              className={error ? "border-red-500" : ""}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsUploadDialogOpen(true)}
            title="Upload new image"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsCloudDialogOpen(true)}
            title="Select from cloud"
          >
            <FolderOpen className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Upload Dialog */}
      <ImageUploadDialog
        open={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onImageUploaded={(url) => handleUploadImage(url)}
        defaultFolder={defaultFolder}
      />

      {/* Cloud Selection Dialog */}
      <CloudImageDialog
        open={isCloudDialogOpen}
        onClose={() => setIsCloudDialogOpen(false)}
        onImageSelected={handleSelectImage}
        defaultFolder={defaultFolder}
      />
    </div>
  );
} 