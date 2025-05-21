"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { ArrowLeft, Info, ImageIcon, Pencil, BookImage, Plus } from "lucide-react";
import AddImagesDialog from "@/components/admin/AddImagesDialog";
import ImageCardClient from "@/components/admin/ImageCardClient";

interface AlbumGroup {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  author_name: string;
}

interface AlbumImage {
  id: number;
  file_name: string;
  original_file_name: string;
  file_path: string;
  public_url: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  description?: string;
  alt_text?: string;
  tags?: string[];
  folder_name: string;
  group_id: number;
  bucket_name: string;
  is_public: boolean;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  uploaded_by?: string;
  user?: {
    nickname: string;
    avatar_url: string;
  };
}

export default function AlbumImagesPage() {
  const router = useRouter();
  const params = useParams();
  const albumId = params.id as string;
  
  const [album, setAlbum] = useState<AlbumGroup | null>(null);
  const [images, setImages] = useState<AlbumImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedImage, setSelectedImage] = useState<AlbumImage | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 上传状态
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // 添加图片对话框状态
  const [addImagesDialogOpen, setAddImagesDialogOpen] = useState(false);

  // 加载相册和图片数据
  useEffect(() => {
    if (!albumId) return;
    
    const fetchAlbumData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 获取相册信息
        const albumResponse = await fetch(`/api/albums/${albumId}`);
        const albumData = await albumResponse.json();
        
        if (!albumResponse.ok) {
          throw new Error(albumData.message || "Failed to load album");
        }
        
        setAlbum(albumData.album);
        
        // 获取相册中的图片
        const imagesResponse = await fetch(`/api/albums/${albumId}/images`);
        const imagesData = await imagesResponse.json();
        
        if (imagesResponse.ok) {
          // 确保每个图片对象都有user字段，防止ImageCardClient出错
          const imagesWithUser = (imagesData.images || []).map((img: AlbumImage) => ({
            ...img,
            user: img.user || {
              nickname: 'User',
              avatar_url: ''
            }
          }));
          setImages(imagesWithUser);
        } else {
          console.error("Error loading album images:", imagesData.message);
        }
      } catch (error) {
        console.error("Error loading album data:", error);
        setError(error instanceof Error ? error.message : "Failed to load album data");
        toast.error("加载相册数据失败");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAlbumData();
  }, [albumId]);  
  
  // 处理图片上传
  const handleImagesUploaded = async (uploadedImages: any[]) => {
    if (uploadedImages.length === 0 || !album) return;
    
    toast.success(`成功上传 ${uploadedImages.length} 张图片到相册`);
    setUploadSuccess(true);
    
    // 刷新图片列表
    try {
      const imagesResponse = await fetch(`/api/albums/${albumId}/images`);
      const imagesData = await imagesResponse.json();
      
      if (imagesResponse.ok) {
        // 确保每个图片对象都有user字段
        const imagesWithUser = (imagesData.images || []).map((img: AlbumImage) => ({
          ...img,
          user: img.user || {
            nickname: 'User',
            avatar_url: ''
          }
        }));
        setImages(imagesWithUser);
      }
    } catch (error) {
      console.error("Error refreshing album images:", error);
    } finally {
      // 关闭对话框时重置上传成功状态，为下一次上传做准备
      if (uploadSuccess) {
        setTimeout(() => {
          setUploadSuccess(false);
        }, 1000);
      }
    }
  };
  
  // 处理图片更新
  const handleImageUpdate = (updatedImage: AlbumImage) => {
    setImages(prevImages => 
      prevImages.map(img => 
        img.id === updatedImage.id ? { ...updatedImage } : img
      )
    );
  };
  
  // 删除图片
  const handleDelete = async (imageId: number) => {
    const imageToDelete = images.find(img => img.id === imageId);
    if (!imageToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/albums/${albumId}/images/${imageId}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success("图片已从相册中移除");
        // 更新图片列表
        setImages(prevImages => prevImages.filter(img => img.id !== imageId));
      } else {
        toast.error(`删除失败: ${data.message}`);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("删除图片失败");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-10 flex justify-center items-center min-h-[300px]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="container max-w-7xl py-10">
        <Button 
          variant="outline" 
          onClick={() => router.push("/admin/albums")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回相册列表
        </Button>
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-500">加载失败: {error || "无法加载相册"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
            variant="outline" 
            onClick={() => router.push("/admin/albums")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回相册列表
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/admin/albums/${albumId}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            编辑相册信息
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3">
            <BookImage className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold">{album.title}</h1>
              {album.description && (
                <p className="text-muted-foreground mt-1">{album.description}</p>
              )}
            </div>
          </div>
          <Button 
            onClick={() => setAddImagesDialogOpen(true)}
            className="flex items-center gap-2"
            disabled={isUploading}
            variant="default"
          >
            <Plus className="h-4 w-4" />
            {isUploading ? "上传中..." : "添加图片"}
          </Button>
        </div>
      </div>
      
      <Alert className="mb-6 bg-blue-50">
        <Info className="h-4 w-4" />
        <AlertTitle>关于相册图片</AlertTitle>
        <AlertDescription>
          在这里您可以为相册"{album.title}"添加和管理图片。上传新图片或从现有图片中选择添加到此相册。
        </AlertDescription>
      </Alert>
      
      <div className="flex flex-col gap-6">
        {images.length === 0 ? (
          <Card className="w-full py-16">
            <CardContent className="flex flex-col items-center justify-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">相册中暂无图片</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                点击下方按钮为您的相册"{album.title}"添加图片
              </p>
              <Button 
                onClick={() => setAddImagesDialogOpen(true)}
                className="flex items-center gap-2"
                disabled={isUploading}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isUploading ? "上传中..." : "添加图片"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((image) => (
              <ImageCardClient 
                key={image.id} 
                image={image as any}
                onDelete={handleDelete}
                onUpdate={handleImageUpdate}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* 添加图片对话框 */}
      <AddImagesDialog
        open={addImagesDialogOpen}
        onClose={() => setAddImagesDialogOpen(false)}
        onImagesUploaded={handleImagesUploaded}
        albumId={albumId}
      />
    </div>
  );
}
