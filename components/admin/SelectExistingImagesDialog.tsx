"use client";

import { useState, useEffect } from "react";
import { ImageIcon, Search, Check, Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { getThumbnailUrl } from "@/lib/url";

interface ImageUpload {
  id: number;
  file_name: string;
  original_file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  description?: string;
  alt_text?: string;
  tags?: string[];
  folder_name: string;
  created_at: string;
  updated_at: string;
}

interface SelectExistingImagesDialogProps {
  open: boolean;
  onClose: () => void;
  onImagesSelected: (selectedImages: any[]) => void;
  albumId: string;
}

export default function SelectExistingImagesDialog({
  open,
  onClose,
  onImagesSelected,
  albumId,
}: SelectExistingImagesDialogProps) {
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [adding, setAdding] = useState(false);

  // 加载图片
  useEffect(() => {
    if (open) {
      fetchImages();
    }
  }, [open]);

  // 获取图片列表
  const fetchImages = async (search: string = "") => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      params.append("limit", "48"); // 加载更多图片以便选择
      
      const response = await fetch(`/api/images?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setImages(data.images || []);
      } else {
        toast.error("加载图片失败");
      }
    } catch (error) {
      console.error("Error loading images:", error);
      toast.error("加载图片时出错");
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = () => {
    fetchImages(searchTerm);
  };

  // 处理选择图片
  const toggleSelectImage = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(imageId => imageId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // 添加所选图片到相册
  const addSelectedImagesToAlbum = async () => {
    if (selectedIds.length === 0) {
      toast.error("请至少选择一张图片");
      return;
    }

    setAdding(true);
    const addedImages = [];

    try {
      // 逐个添加所选图片到相册
      for (const imageId of selectedIds) {
        const response = await fetch(`/api/albums/${albumId}/images`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image_id: imageId }),
        });

        const data = await response.json();
        
        if (response.ok) {
          addedImages.push(data.image);
        } else {
          toast.error(`添加图片 ID: ${imageId} 失败: ${data.message}`);
        }
      }

      if (addedImages.length > 0) {
        toast.success(`成功添加 ${addedImages.length} 张图片到相册`);
        onImagesSelected(addedImages);
        onClose();
      }
    } catch (error) {
      console.error("Error adding images to album:", error);
      toast.error("添加图片到相册失败");    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-blue-500" />
            从图库中选择图片
          </DialogTitle>
          <DialogDescription>
            选择已上传的图片添加到相册。可以添加多张图片。
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索图片..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-8"
            />
          </div>
          <Button onClick={handleSearch}>搜索</Button>
        </div>
        
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : images.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-center text-muted-foreground">
                  {searchTerm ? `没有找到与"${searchTerm}"匹配的图片` : "图库中暂无图片"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`relative border rounded-md overflow-hidden cursor-pointer transition-all ${
                    selectedIds.includes(image.id) ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => toggleSelectImage(image.id)}
                >                  <div className="aspect-square bg-muted relative">
                    <img
                      src={getThumbnailUrl(image.file_path)}
                      alt={image.alt_text || image.original_file_name}
                      className="w-full h-full object-cover"
                    />
                    {selectedIds.includes(image.id) && (
                      <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-2 text-xs truncate">
                    {image.original_file_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            已选择 {selectedIds.length} 张图片
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={adding}>
              取消
            </Button>
            <Button
              onClick={addSelectedImagesToAlbum}
              disabled={selectedIds.length === 0 || adding}
              className="min-w-[100px]"
            >
              {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {adding ? "添加中..." : "添加到相册"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
