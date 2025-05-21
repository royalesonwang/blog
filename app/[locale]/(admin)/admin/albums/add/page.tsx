"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save, BookImage, Image, CheckCircle2 } from "lucide-react";
import MultiImageUploader from "@/components/image/MultiImageUploader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

export default function AddAlbumPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    author_name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleImagesUploaded = (images: UploadedImage[]) => {
    setUploadedImages(images);
    toast.success(`已上传 ${images.length} 张图片，即将添加到相册`);
  };

  const handleUploadToAlbum = async (albumId: number) => {
    // 如果有上传的图片，将它们关联到相册
    if (uploadedImages.length > 0) {
      const imagePromises = uploadedImages.map(image => {
        // 确保 image.id 是数字格式
        const imageId = typeof image.id === 'string' ? parseInt(image.id) : image.id;
        
        return fetch(`/api/albums/${albumId}/images`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_id: imageId,
          }),
        });
      });
      
      // 等待所有图片添加完成
      try {
        const responses = await Promise.all(imagePromises);
        
        // 检查是否所有图片都成功关联
        const failedUploads = responses.filter(response => !response.ok).length;
        
        if (failedUploads > 0) {
          toast.warning(`${failedUploads}张图片无法添加到相册，请在相册编辑页面重试`);
          return false;
        } else {
          toast.success(`已成功将${uploadedImages.length}张图片添加到相册`);
          return true;
        }
      } catch (error) {
        console.error("添加图片到相册失败:", error);
        toast.error("部分图片可能未成功添加到相册");
        return false;
      }
    }
    return true;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("相册标题不能为空");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 首先创建相册
      const albumResponse = await fetch("/api/albums", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      const albumData = await albumResponse.json();
      
      if (!albumResponse.ok) {
        throw new Error(albumData.message || "创建相册失败");
      }
      
      const albumId = albumData.album.id;
      
      // 处理图片上传到相册
      const imageUploadSuccess = await handleUploadToAlbum(albumId);
      
      // 根据图片处理状态显示不同的成功消息
      if (uploadedImages.length > 0) {
        if (!imageUploadSuccess) {
          toast.success("相册创建成功，但部分图片添加失败");
        } else {
          toast.success(`相册创建成功，已添加 ${uploadedImages.length} 张图片`);
        }
      } else {
        toast.success("相册创建成功");
      }
      
      // 导航到编辑图片页面
      router.push(`/admin/albums/${albumId}/images`);
      
    } catch (error) {
      console.error("Error creating album:", error);
      toast.error(error instanceof Error ? error.message : "创建相册失败");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-8">
        <Button 
          variant="outline" 
          onClick={() => router.push("/admin/albums")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回相册列表
        </Button>
        
        <div className="flex items-center gap-3">
          <BookImage className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">创建新相册</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>相册信息</CardTitle>
              <CardDescription>
                填写新相册的基本信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">相册标题 <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="输入相册标题"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">相册描述</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="输入相册描述（选填）"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="author_name">作者</Label>
                <Input
                  id="author_name"
                  name="author_name"
                  value={formData.author_name}
                  onChange={handleChange}
                  placeholder="输入作者名称（选填）"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/albums")}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-xs mr-2"></span>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    保存相册{uploadedImages.length > 0 ? ` (含${uploadedImages.length}张图片)` : ''}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
