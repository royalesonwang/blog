"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FileImage, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getImageUrl, getThumbnailUrl } from "@/lib/url";

interface ImageUploaderProps {
  onImageUploaded?: (imageUrl: string, file_path: string, altText: string, fileName: string | null) => void;
  defaultFolder?: string;
  showPreview?: boolean;
  showFileInfo?: boolean;
  previewHeight?: string;
  onPreviewChange?: (previewUrl: string | null) => void;
  onFileSelected?: (hasFile: boolean) => void;
}

export default function ImageUploader({
  onImageUploaded,
  defaultFolder = "default",
  showPreview = true,
  showFileInfo = true,
  previewHeight = "h-48",
  onPreviewChange,
  onFileSelected,
}: ImageUploaderProps) {  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [altText, setAltText] = useState("");
  const [tags, setTags] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(defaultFolder);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // 清理函数，组件卸载时释放创建的预览URL
  useEffect(() => {
    return () => {
      if (previewUrl && !uploadedFilePath) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, uploadedFilePath]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // 创建本地预览URL
      const localPreviewUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(localPreviewUrl);
      
      // 通知父组件预览URL已更新
      if (onPreviewChange) {
        onPreviewChange(localPreviewUrl);
      }
      
      // 通知父组件文件已选择
      if (onFileSelected) {
        onFileSelected(true);
      }
        // 重置上传状态
      setUploadedFilePath(null);
      setFileName(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("description", description);
      formData.append("altText", altText);
      formData.append("tags", tags);
      formData.append("folderName", selectedFolder);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
        if (response.ok) {
        setUploadedFilePath(data.file_path);
        setFileName(data.fileName);
          // 上传成功后清除预览
        setPreviewUrl(null);
        
        // 通知父组件预览已清除
        if (onPreviewChange) {
          onPreviewChange(null);
        }
        
        toast.success("Image uploaded successfully to Cloudflare R2");
        
        console.log("Upload successful with details:", {
          file_path: data.file_path,
          width: data.width,
          height: data.height
        });
        
        if (onImageUploaded) {
          const imageUrl = getImageUrl(data.file_path);
          onImageUploaded(imageUrl, data.file_path, altText, data.fileName);
        }
      } else {
        throw new Error(data.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image to Cloudflare R2");
    } finally {
      setUploading(false);
    }
  };    const resetForm = () => {
    if (previewUrl) {
      // 释放本地预览URL资源
      URL.revokeObjectURL(previewUrl);
    }
    
    setFile(null);
    setPreviewUrl(null);
    setUploadedFilePath(null);
    setFileName(null);
    setDescription("");
    setAltText("");
    setTags("");
    setSelectedFolder(defaultFolder);
    
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
          <Label htmlFor="picture">Select Image</Label>
          <Input
            id="picture"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
        
        {file && showFileInfo && (
          <div className="mt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileImage className="h-4 w-4" />
              {file.name} ({Math.round(file.size / 1024)} KB)
            </div>
          </div>
        )}
        
        <div className="grid gap-2">
          <Label htmlFor="folder">Folder</Label>
          <Input
            id="folder"
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            placeholder="Enter folder name..."
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Folder to organize your images. Default is {defaultFolder}.
          </p>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="altText">Alt Text</Label>
          <Input
            id="altText"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Alternative text for accessibility..."
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Describe the image for screen readers and SEO.
          </p>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter image description..."
            autoComplete="off"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Comma-separated tags..."
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Separate tags with commas (e.g., nature, landscape, sky)
          </p>
        </div>
        
        <Button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </Button>
      </div>
        {showPreview && (        <div className="space-y-4">          {/* 只有当有预览但没上传成功时显示预览图 */}
          {previewUrl && !uploadedFilePath && (
            <div className={`flex items-center justify-center ${previewHeight} bg-muted rounded-md`}>
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
          
          {/* 上传成功后显示成功信息 */}
          {uploadedFilePath && (
            <div className="space-y-4">              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="font-medium">Upload Successful!</p>
              </div>
              
              <div className="space-y-4">
                {showFileInfo && fileName && (
                  <div>
                    <Label>File Path:</Label>
                    <div className="mt-1 text-sm text-muted-foreground">{fileName}</div>
                  </div>
                )}
                
                <div>
                  <Label>R2 Public URL (Original):</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={getImageUrl(uploadedFilePath)} readOnly className="text-xs" />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(getImageUrl(uploadedFilePath));
                        toast.success("URL copied to clipboard");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Original image (max 1440px if resized)
                  </p>
                </div>
                
                <div>
                  <Label>Thumbnail URL:</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={getThumbnailUrl(uploadedFilePath)} readOnly className="text-xs" />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(getThumbnailUrl(uploadedFilePath));
                        toast.success("Thumbnail URL copied to clipboard");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Optimized for display (max 640x640px)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
