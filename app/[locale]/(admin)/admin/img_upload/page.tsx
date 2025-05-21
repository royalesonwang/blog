"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { CloudIcon, Info, CheckCircle2, Copy, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import MultiImageUploader from "@/components/image/MultiImageUploader";
export const runtime = 'edge';

export default function ImageUploadPage() {  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [altText, setAltText] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasFileSelected, setHasFileSelected] = useState<boolean>(false);
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
    const handleImageUploaded = (
    imageUrl: string, 
    thumbUrl: string | null, 
    alt: string, 
    fileNamePath: string | null
  ) => {
    setUploadedUrl(imageUrl);
    setThumbnailUrl(thumbUrl);
    setFileName(fileNamePath);
    setAltText(alt);
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
    
    // 使用第一张图片作为当前选中图片
    if (images.length > 0) {
      setUploadedUrl(images[0].url);
      setThumbnailUrl(images[0].thumbnailUrl);
      setFileName(images[0].fileName);
      setAltText("");
    }
  };
  return (
    <div className="container max-w-7xl py-10">
      <div className="flex items-center gap-3 mb-8">
        <CloudIcon className="h-8 w-8 text-blue-500" />
        <h1 className="text-3xl font-bold">Cloudflare R2 Image Upload</h1>
      </div>
      
      <Alert className="mb-6 bg-blue-50">
        <Info className="h-4 w-4" />
        <AlertTitle>About Cloudflare R2 Image Upload</AlertTitle>
        <AlertDescription>
          Images are uploaded to Cloudflare R2 storage. Large images (over 1440px) will be automatically 
          resized to optimize storage and loading speed. Additionally, a thumbnail (max 640px) will be 
          generated for each image.
        </AlertDescription>      </Alert>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload New Image</CardTitle>
            <CardDescription>
              Select an image file to upload to Cloudflare R2.
            </CardDescription>
          </CardHeader>          <CardContent>
            <MultiImageUploader 
              defaultFolder="default"
              onImageUploaded={handleImageUploaded}
              onImagesUploaded={handleImagesUploaded}
              showPreview={false}
              previewHeight="h-64"
              onPreviewChange={(url) => setPreviewUrl(url)}
              onFileSelected={(hasFile) => setHasFileSelected(hasFile)}
              multiple={true}
              maxFiles={10}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upload Details</CardTitle>
            <CardDescription>
              Information about the uploaded image.
            </CardDescription>
          </CardHeader>          <CardContent>
            {uploadedUrl && uploadedImages.length === 0 && (              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <h3 className="font-medium">上传成功!</h3>
                </div>
                
                <div>
                  <Label>文件路径:</Label>
                  <div className="mt-1 text-sm text-muted-foreground">{fileName}</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <Button 
                      variant="default"
                      className="w-full" 
                      onClick={() => {
                        navigator.clipboard.writeText(uploadedUrl);
                        toast.success("原图URL已复制到剪贴板");
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      复制原图URL
                    </Button>
                  </div>
                  
                  {thumbnailUrl && (
                    <div>
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          navigator.clipboard.writeText(thumbnailUrl);
                          toast.success("缩略图URL已复制到剪贴板");
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        复制缩略图URL
                      </Button>
                    </div>
                  )}
                </div>                {thumbnailUrl && (
                  <div>
                    <Button 
                      variant="outline"
                      className="w-full mt-3"
                      onClick={() => {
                        navigator.clipboard.writeText(thumbnailUrl);
                        toast.success("缩略图URL已复制到剪贴板");
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      复制缩略图URL
                    </Button>
                  </div>
                )}
              </div>            )}
              {!uploadedUrl && uploadedImages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <>
                    <p className="text-muted-foreground mb-2">未选择图片</p>
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
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  {uploadedImages.map((image, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className={`h-auto p-2 justify-start ${uploadedUrl === image.url ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => {
                        setUploadedUrl(image.url);
                        setThumbnailUrl(image.thumbnailUrl);
                        setFileName(image.fileName);
                      }}
                    >
                      <div className="flex items-center gap-2 w-full overflow-hidden">
                        <img 
                          src={image.thumbnailUrl || image.url} 
                          alt={`图片 ${index + 1}`}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <span className="text-xs truncate">{image.originalName}</span>
                      </div>
                    </Button>
                  ))}
                </div>
                
                {uploadedUrl && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">选中的图片</h4>
                    
                    {fileName && (
                      <div>
                        <Label>文件路径:</Label>
                        <div className="mt-1 text-sm text-muted-foreground">{fileName}</div>
                      </div>
                    )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <Button 
                          variant="default"
                          className="w-full" 
                          onClick={() => {
                            navigator.clipboard.writeText(uploadedUrl);
                            toast.success("原图URL已复制到剪贴板");
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          复制原图URL
                        </Button>
                      </div>
                      
                      {thumbnailUrl && (
                        <div>
                          <Button 
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              navigator.clipboard.writeText(thumbnailUrl);
                              toast.success("缩略图URL已复制到剪贴板");
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            复制缩略图URL
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}