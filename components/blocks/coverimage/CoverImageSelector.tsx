"use client";

import { useState, useEffect } from "react";
import { ImageIcon, Upload, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUploadDialog from "@/components/blocks/editor/ImageUploadDialog";
import CloudImageDialog from "@/components/blocks/editor/CloudImageDialog";
import { getImageUrl, getPublicUrl } from "@/lib/url";

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
    console.log("CoverImageSelector: image uploaded", imageUrl);
    setInputValue(imageUrl);
    onChange(imageUrl);
    setIsUploadDialogOpen(false);
  };

  const handleSelectImage = (imageUrl: string, altText: string) => {
    console.log("CoverImageSelector: image selected", imageUrl);
    setInputValue(imageUrl);
    onChange(imageUrl);
    setIsCloudDialogOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log("CoverImageSelector: input changed", newValue);
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col space-y-2">        {inputValue && (
          <div className="w-full h-40 mb-2 relative rounded-md overflow-hidden border">
            <img
              src={getPublicUrl(inputValue)}
              alt="Cover preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.warn('Cover image failed to load:', inputValue);
                // 如果加载失败，尝试作为相对路径处理
                if (!inputValue.startsWith('http')) {
                  const target = e.target as HTMLImageElement;
                  const fallbackUrl = getImageUrl(inputValue);
                  if (fallbackUrl !== target.src) {
                    target.src = fallbackUrl;
                  }
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