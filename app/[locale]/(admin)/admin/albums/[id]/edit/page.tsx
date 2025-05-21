"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, BookImage } from "lucide-react";

interface AlbumGroup {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  author_name: string;
}

export default function EditAlbumPage() {
  const router = useRouter();
  const params = useParams();
  const albumId = params.id as string;
  
  const [formData, setFormData] = useState<Partial<AlbumGroup>>({
    title: "",
    description: "",
    author_name: "",
  });
  const [originalData, setOriginalData] = useState<AlbumGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载相册数据
  useEffect(() => {
    if (!albumId) return;
    
    const fetchAlbum = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/albums/${albumId}`);
        const data = await response.json();
        
        if (response.ok) {
          setFormData(data.album);
          setOriginalData(data.album);
        } else {
          setError(data.message || "Failed to load album");
          toast.error(`加载失败: ${data.message}`);
        }
      } catch (error) {
        console.error("Error loading album:", error);
        setError("Failed to load album");
        toast.error("加载相册失败");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAlbum();
  }, [albumId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title?.trim()) {
      toast.error("相册标题不能为空");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success("相册更新成功");
        setOriginalData(data.album);
      } else {
        toast.error(`更新失败: ${data.message}`);
      }
    } catch (error) {
      console.error("Error updating album:", error);
      toast.error("更新相册失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-3xl py-10 flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-3xl py-10">
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={() => router.push("/admin/albums")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回相册列表
          </Button>
        </div>
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-500">加载相册失败: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10">
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
            onClick={() => router.push(`/admin/albums/${albumId}/images`)}
          >
            管理相册图片
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <BookImage className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">编辑相册</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>相册信息</CardTitle>
            <CardDescription>
              编辑相册的基本信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">相册标题 <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                name="title"
                value={formData.title || ""}
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
                value={formData.description || ""}
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
                value={formData.author_name || ""}
                onChange={handleChange}
                placeholder="输入作者名称（选填）"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
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
              disabled={isSubmitting || JSON.stringify(formData) === JSON.stringify(originalData)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存变更
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
