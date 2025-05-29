"use client";

import { useState } from "react";
import { CheckCircle2, CloudIcon, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import MultiImageUploader from "@/components/image/MultiImageUploader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getImageUrl, getThumbnailUrl } from "@/lib/url";
import { formatExposureTime, formatFNumber, formatFocalLength } from "@/lib/exif-parser";

interface ImageUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onImageUploaded: (imageUrl: string, altText: string) => void;
  defaultFolder?: string;
}

export default function ImageUploadDialog({
  open,
  onClose,
  onImageUploaded,
  defaultFolder = "editor",
}: ImageUploadDialogProps) {
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasFileSelected, setHasFileSelected] = useState<boolean>(false);  const [uploadedImages, setUploadedImages] = useState<Array<{
    id: string;
    file_path: string;
    fileName: string | null;
    originalName: string;
    size: number;
    width: number;
    height: number;
    exif_iso?: number | null;
    exif_exposure_time?: number | null;
    exif_f_number?: number | null;
    exif_focal_length?: number | null;
    device?: string | null;
    location?: string | null;
  }>>([]);

  const handleInternalImageUploaded = (
    filePath: string, 
    alt: string, 
    fileNamePath: string | null
  ) => {
    setUploadedFilePath(filePath);
    setFileName(fileNamePath);
    setAltText(alt);
  };
  const handleImagesUploaded = (images: Array<{
    id: string;
    file_path: string;
    fileName: string | null;
    originalName: string;
    size: number;
    width: number;
    height: number;
    exif_iso?: number | null;
    exif_exposure_time?: number | null;
    exif_f_number?: number | null;
    exif_focal_length?: number | null;
    device?: string | null;
    location?: string | null;
  }>) => {
    setUploadedImages(images);
    
    // 兼容单图上传的情况，使用第一张图片作为选中图片
    if (images.length > 0) {
      setUploadedFilePath(images[0].file_path);
      setFileName(images[0].fileName);
    }
  };
  // 添加图片
  const handleInsertToArticle = () => {
    if (uploadedFilePath) {
      let path = uploadedFilePath;
      
      // 移除可能存在的 /uploads/ 前缀
      const config = {
        imageFolder: process.env.NEXT_PUBLIC_IMAGE_FOLDER || 'uploads'
      };
      
      if (path.startsWith(`/${config.imageFolder}/`)) {
        path = path.substring(`/${config.imageFolder}/`.length);
      } else if (path.startsWith(`${config.imageFolder}/`)) {
        path = path.substring(`${config.imageFolder}/`.length);
      }
      
      // 调用父组件传入的回调，将处理后的路径和alt文本传递
      onImageUploaded(path, altText);
      resetForm();
      onClose();
    }
  };
  
  const resetForm = () => {
    setUploadedFilePath(null);
    setFileName(null);
    setAltText("");
    setPreviewUrl(null);
    setHasFileSelected(false);
    setUploadedImages([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudIcon className="h-5 w-5 text-blue-500" />
            上传图片到 Cloudflare R2
          </DialogTitle>
          <DialogDescription>
            上传图片用于内容展示。大尺寸图片（超过2160px）将自动调整大小，
            并生成缩略图（最大1200px）用于显示。
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="max-h-[50vh] overflow-y-auto">
            <CardHeader className="sticky top-0 bg-card z-10 border-b pb-3">
              <CardTitle>上传新图片</CardTitle>
              <CardDescription>
                选择要上传到Cloudflare R2的图片文件。
              </CardDescription>
            </CardHeader>            <CardContent className="pt-3">
              <MultiImageUploader 
                defaultFolder={defaultFolder}
                onImageUploaded={handleInternalImageUploaded}
                onImagesUploaded={handleImagesUploaded}
                previewHeight="h-64"
                showFileInfo={true}
                onPreviewChange={(url) => setPreviewUrl(url)}
                onFileSelected={(hasFile) => setHasFileSelected(hasFile)}
                multiple={true}
                maxFiles={5}
              />
            </CardContent>
          </Card>
          
          <Card className="max-h-[50vh] overflow-y-auto">
            <CardHeader className="sticky top-0 bg-card z-10 border-b pb-3">
              <CardTitle>上传详情</CardTitle>
              <CardDescription>
                已上传图片的相关信息。
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              {!uploadedFilePath && uploadedImages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <>
                      <p className="text-muted-foreground mb-2">未上传图片</p>
                      <p className="text-xs text-muted-foreground">上传图片查看详情</p>
                    </>
                  )}
                </div>
              )}
              
              {uploadedImages.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <h3 className="font-medium">上传成功！共 {uploadedImages.length} 张图片</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {uploadedImages.map((image, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto p-2 justify-start"
                        onClick={() => {
                          setUploadedFilePath(image.file_path);
                          setFileName(image.fileName);
                        }}
                      >
                        <div className="flex items-center gap-2 w-full overflow-hidden">
                          <img 
                            src={getThumbnailUrl(image.file_path)} 
                            alt={`图片 ${index + 1}`}
                            className="w-8 h-8 object-cover rounded"
                          />
                          <span className="text-xs truncate">{image.originalName}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                    {uploadedFilePath && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-sm font-medium mb-2">选中的图片</h4>
                      {fileName && (
                        <div className="mb-3">
                          <Label>文件路径:</Label>
                          <div className="mt-1 text-sm text-muted-foreground">{fileName}</div>
                        </div>
                      )}
                        {/* 显示EXIF信息 */}
                      {(() => {
                        const selectedImage = uploadedImages.find(img => img.file_path === uploadedFilePath);
                        if (selectedImage) {
                          return (
                            <div className="mb-3 p-3 bg-muted/30 rounded-md">
                              <h5 className="text-sm font-medium mb-2">图片信息</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* 相机参数 - 总是显示，没有数据时显示"无" */}
                                <div className="space-y-1">
                                  <h6 className="text-xs font-medium text-muted-foreground mb-1">相机参数</h6>
                                  <div className="flex justify-between text-xs">
                                    <span>ISO:</span>
                                    <span className="font-mono">{selectedImage.exif_iso || "无"}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span>快门速度:</span>
                                    <span className="font-mono">{selectedImage.exif_exposure_time ? formatExposureTime(selectedImage.exif_exposure_time) : "无"}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span>光圈:</span>
                                    <span className="font-mono">{selectedImage.exif_f_number ? formatFNumber(selectedImage.exif_f_number) : "无"}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span>焦距:</span>
                                    <span className="font-mono">{selectedImage.exif_focal_length ? formatFocalLength(selectedImage.exif_focal_length) : "无"}</span>
                                  </div>
                                </div>
                                
                                {/* 设备和位置信息 - 只在有数据时显示 */}
                                {(selectedImage.device || selectedImage.location) && (
                                  <div className="space-y-1">
                                    <h6 className="text-xs font-medium text-muted-foreground mb-1">设备信息</h6>
                                    {selectedImage.device && (
                                      <div className="flex justify-between text-xs">
                                        <span>设备:</span>
                                        <span className="truncate ml-2">{selectedImage.device}</span>
                                      </div>
                                    )}
                                    {selectedImage.location && (
                                      <div className="flex justify-between text-xs">
                                        <span>位置:</span>
                                        <span className="truncate ml-2">{selectedImage.location}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      <div className="mt-2 flex justify-center">
                        <Button 
                          variant="default" 
                          onClick={() => {
                            const fullUrl = getImageUrl(uploadedFilePath);
                            navigator.clipboard.writeText(fullUrl);
                            toast.success("URL已复制到剪贴板");
                          }}
                          className="w-full"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          复制图片URL
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter className="flex justify-between items-center mt-4">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button 
            onClick={handleInsertToArticle} 
            disabled={!uploadedFilePath}
          >
            添加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}