"use client";

import { useState, useEffect } from "react";
import { formatDistance } from "date-fns";
import { Edit, Trash2, ZoomIn, FolderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";
import FullScreenPreview from "./FullScreenPreview";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import EditImageDialog from "./EditImageDialog";
import { getImageUrl, getThumbnailUrl } from "@/lib/url";

interface ImageUpload {
  id: number;
  file_name: string;
  original_file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  description: string;
  alt_text: string;
  tags: string[];
  folder_name: string;
  created_at: string;
  updated_at: string;
  uploaded_by: string;
  user: {
    nickname: string;
    avatar_url: string;
  };
}

interface ImageCardClientProps {
  image: ImageUpload;
  onDelete?: (id: number) => void;
  onUpdate?: (image: ImageUpload) => void;
  folders?: string[];
  albumId?: string; // 新增：相册ID，如果存在则表示在相册中编辑
}

export default function ImageCardClient({ image, onDelete, onUpdate, folders = [], albumId }: ImageCardClientProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentImage, setCurrentImage] = useState<ImageUpload>(image);
  
  // 当外部 image 属性变化时，更新内部状态
  useEffect(() => {
    setCurrentImage(image);
  }, [image]);
  
  // 删除图片的处理函数
  const handleDeleteImage = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch('/api/images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageId: currentImage.id }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('图片删除成功');
        // 调用父组件的删除回调，更新UI
        if (onDelete) {
          onDelete(currentImage.id);
        }
      } else {
        toast.error(`删除失败: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('删除过程中发生错误');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // 更新图片信息的处理函数
  const handleUpdateImage = (updatedImage: ImageUpload) => {
    setCurrentImage(updatedImage);
    if (onUpdate) {
      onUpdate(updatedImage);
    }
  };
  
  return (
    <>      <Card className="overflow-hidden">
        <div className="aspect-square bg-muted relative group cursor-pointer" onClick={() => setPreviewOpen(true)}>
          <img
            src={getThumbnailUrl(currentImage.file_path)}
            alt={currentImage.alt_text || currentImage.original_file_name}
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="icon" variant="secondary" onClick={(e) => {
              e.stopPropagation();
              setPreviewOpen(true);
            }}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              onClick={(e) => {
                e.stopPropagation();
                setEditDialogOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="destructive" 
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex flex-col gap-2 h-[140px]">
            <div className="flex justify-between items-start">
              <div className="font-medium truncate" title={currentImage.original_file_name}>
                {currentImage.original_file_name}
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                {Math.round(currentImage.file_size / 1024)} KB
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FolderIcon className="h-3 w-3" />
              <span>{currentImage.folder_name || 'default'}</span>
            </div>
            
            <div className="min-h-[20px]">
              {currentImage.description ? (
                <p className="text-sm text-muted-foreground truncate" title={currentImage.description}>
                  {currentImage.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic truncate">
                  无描述
                </p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1 mt-1 min-h-[24px]">
              {currentImage.tags && currentImage.tags.length > 0 ? (
                <>
                  {currentImage.tags.slice(0, 3).map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {currentImage.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{currentImage.tags.length - 3}
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-xs text-muted-foreground/50 italic">无标签</span>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-auto">
              <div className="text-xs text-muted-foreground">
                {formatDistance(new Date(currentImage.created_at), new Date(), { addSuffix: true })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
        {/* 图片预览 - 使用原图 */}
      {previewOpen && (
        <FullScreenPreview 
          src={getImageUrl(currentImage.file_path)} 
          alt={currentImage.alt_text || currentImage.original_file_name} 
          onClose={() => setPreviewOpen(false)} 
        />
      )}
      
      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteImage}
        isDeleting={isDeleting}
        title="确认删除图片"
        description={`确定要删除 "${currentImage.original_file_name}" 吗？此操作无法撤销，图片将从存储中永久删除。`}
      />      {/* 编辑图片对话框 */}
      {editDialogOpen && (
        <EditImageDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          image={currentImage}
          onUpdate={handleUpdateImage}
          folders={folders}
          albumId={albumId}
        />
      )}
    </>
  );
} 