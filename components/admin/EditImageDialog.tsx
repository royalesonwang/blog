"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderIcon, Image, FileText, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";

// 辅助函数：获取缩略图URL
const getThumbnailUrl = (image: any): string => {
  // 如果已有缩略图字段，直接使用
  if (image.thumbnail_url) {
    return image.thumbnail_url;
  }
  
  // 否则尝试从公共URL构造缩略图URL
  if (image.public_url && image.public_url.includes('/uploads/')) {
    return image.public_url.replace('/uploads/', '/thumbnail/');
  }
  
  // 默认返回原图URL
  return image.public_url;
};

interface ImageUpload {
  id: number;
  file_name: string;
  original_file_name: string;
  public_url: string;
  thumbnail_url?: string;
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

interface EditImageDialogProps {
  open: boolean;
  onClose: () => void;
  image: ImageUpload;
  onUpdate: (updatedImage: ImageUpload) => void;
  folders?: string[];
}

export default function EditImageDialog({ 
  open, 
  onClose, 
  image, 
  onUpdate,
  folders = []
}: EditImageDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: image.description || '',
    alt_text: image.alt_text || '',
    tags: image.tags ? image.tags.join(', ') : '',
    folder_name: image.folder_name || 'default'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFolderChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      folder_name: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Process tags, convert to array
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const updateData = {
        imageId: image.id,
        description: formData.description,
        alt_text: formData.alt_text,
        tags: tagsArray,
        folder_name: image.folder_name
      };

      const response = await fetch('/api/images', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Image information updated successfully');
        onUpdate({
          ...image,
          description: formData.description,
          alt_text: formData.alt_text,
          tags: tagsArray,
          folder_name: image.folder_name
        });
        onClose();
      } else {
        toast.error(`Update failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error('An error occurred during the update process');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Image Information</DialogTitle>
          <DialogDescription>
            Modify the description, alt text, and tags of the image
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex flex-col space-y-1.5">
            <div className="h-40 w-full overflow-hidden rounded-md border mb-4">
              <img 
                src={getThumbnailUrl(image)} 
                alt={image.alt_text || image.original_file_name}
                className="h-full w-full object-contain" 
              />
            </div>
            
            <div className="text-sm text-muted-foreground mb-2">
              Filename: {image.original_file_name}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="alt_text" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Alt Text
              </Label>
              <Input
                id="alt_text"
                name="alt_text"
                value={formData.alt_text}
                onChange={handleChange}
                placeholder="Add descriptive alternative text for accessibility and SEO"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="flex items-center gap-1">
                <Image className="h-4 w-4" />
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add a more detailed description for the image"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags" className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                Tags
              </Label>
              <Input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="Separate tags with commas, e.g.: logo, banner, product"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center gap-1 mb-1">
                <FolderIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Folder</span>
              </div>
              <div className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted">
                <FolderIcon className="h-4 w-4 text-muted-foreground" />
                <span>{image.folder_name || 'default'}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 