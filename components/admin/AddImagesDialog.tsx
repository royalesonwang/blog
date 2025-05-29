"use client";

import { useState } from "react";
import { AlbumIcon, CheckCircle2, Copy, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import MultiImageUploader from "@/components/image/MultiImageUploader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AddImagesDialogProps {
  open: boolean;
  onClose: () => void;
  onImagesUploaded: (uploadedImages: any[]) => void;
  albumId: string;
  albumName?: string; // 添加相册名字属性
}

export default function AddImagesDialog({
  open,
  onClose,
  onImagesUploaded,
  albumId,
  albumName,
}: AddImagesDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{
    id: string;
    url: string;
    thumbnailUrl: string | null;
    fileName: string | null;
    originalName: string;
    size: number;
    width: number;
    height: number;
  }>>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasFileSelected, setHasFileSelected] = useState<boolean>(false);
  
  // 处理对话框关闭，确保上传中状态被重置
  const handleClose = () => {
    if (!isUploading) {
      resetForm();
      onClose();
    }
  };

  const handleImagesUploaded = (images: Array<{
    id: string;
    url: string;
    thumbnailUrl: string | null;
    fileName: string | null;
    originalName: string;
    size: number;
    width: number;
    height: number;
  }>) => {
    setUploadedImages(images);
    setIsUploading(false);
    
    // 如果有上传成功的图片，添加到相册
    if (images.length > 0) {
      onImagesUploaded(images);
    }
  };
  
  const resetForm = () => {
    setUploadedImages([]);
    setSelectedImage(null);
    setPreviewUrl(null);
    setHasFileSelected(false);
    setIsUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[1200px] h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlbumIcon className="h-5 w-5 text-blue-500" />
            上传图片到相册
          </DialogTitle>          <DialogDescription>
            上传图片到相册"{albumName || albumId}"。大尺寸图片（超过2160px）将自动调整大小，
            并生成缩略图（最大1200px）用于显示。
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="max-h-[70vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <CardTitle>上传新图片</CardTitle>
              <CardDescription>
                选择要上传到相册的图片文件。
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3">              <MultiImageUploader 
                defaultFolder={`album/${albumId}`}
                onImagesUploaded={handleImagesUploaded}
                previewHeight="h-64"
                showFileInfo={true}
                onPreviewChange={(url) => setPreviewUrl(url)}
                onFileSelected={(hasFile) => setHasFileSelected(hasFile)}
                multiple={true}
                maxFiles={10}
                targetTable="album_image"
                albumId={albumId}
              />              <p className="mt-2 text-xs text-muted-foreground">
                图片将存储在 album/{albumName || albumId}/ 文件夹中。
              </p>
            </CardContent>
          </Card>
          
          <Card className="max-h-[70vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <CardTitle>图片预览</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              {uploadedImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center">
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
              ) : (
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
                        onClick={() => setSelectedImage(image.id)}
                      >
                        <div className="flex items-center gap-2 w-full overflow-hidden">
                          <img 
                            src={image.thumbnailUrl || image.url} 
                            alt={`图片 ${index + 1}`}
                            className="w-8 h-8 object-cover rounded"
                          />
                          <span className="text-xs truncate">{image.originalName}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                  
                  {selectedImage && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-sm font-medium mb-2">选中的图片</h4>
                      {uploadedImages.find(img => img.id === selectedImage)?.fileName && (
                        <div>
                          <Label>文件路径:</Label>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {uploadedImages.find(img => img.id === selectedImage)?.fileName}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-2 flex justify-center">
                        <Button 
                          variant="default" 
                          onClick={() => {
                            const url = uploadedImages.find(img => img.id === selectedImage)?.url;
                            if (url) {
                              navigator.clipboard.writeText(url);
                              toast.success("URL已复制到剪贴板");
                            }
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
      </DialogContent>
    </Dialog>
  );
}
