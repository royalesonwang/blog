"use client";

import { getSupabaseClient } from "@/models/db";
import Empty from "@/components/blocks/empty";
import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import FolderSelect from "@/components/admin/FolderSelect";
import ImageCardClient from "@/components/admin/ImageCardClient";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export const runtime = 'edge';

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

export default function ImagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // 提取查询参数
  const pageStr = searchParams.get('page') || '1';
  const page = Number(pageStr) || 1;
  const search = searchParams.get('search') || '';
  const folder = searchParams.get('folder') || '';
  
  // 状态管理
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 每页显示的图片数量
  const limit = 12;

  // 获取图片数据
  const fetchImages = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (folder && folder !== "All") params.append("folder", folder);
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      
      const response = await fetch(`/api/images?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setImages(data.images || []);
        
        // 处理文件夹列表
        const uniqueFolders = new Set<string>();
        uniqueFolders.add('All');
        uniqueFolders.add('default');
        
        if (data.folders && data.folders.length > 0) {
          data.folders.forEach((folderName: string) => {
            if (folderName && folderName.trim() !== '') {
              uniqueFolders.add(folderName.trim());
            }
          });
        }
        
        // 转换回数组并排序
        const sortedFolders = Array.from(uniqueFolders).sort((a, b) => {
          if (a === 'All') return -1;
          if (b === 'All') return 1;
          if (a === 'default') return -1;
          if (b === 'default') return 1;
          return a.localeCompare(b);
        });
        
        setFolders(sortedFolders);
        setCount(data.count || 0);
        setTotalPages(data.totalPages || 0);
      } else {
        setError(data.message || "Failed to fetch images");
        toast.error(data.message || "Failed to fetch images");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(`Error loading images: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 删除图片后的处理
  const handleImageDelete = (imageId: number) => {
    setImages(images.filter(img => img.id !== imageId));
    setCount(prev => prev - 1);
    
    // 如果当前页面已经没有图片，且不是第一页，则跳转到上一页
    if (images.length === 1 && page > 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', (page - 1).toString());
      router.push(`/admin/images?${params.toString()}`);
    } else {
      // 否则重新获取当前页数据
      fetchImages();
    }
  };

  // 更新图片后的处理
  const handleImageUpdate = (updatedImage: ImageUpload) => {
    setImages(images.map(img => 
      img.id === updatedImage.id ? updatedImage : img
    ));
  };
  
  // 初始加载和查询参数变化时获取数据
  useEffect(() => {
    fetchImages();
  }, [page, search, folder]);
  
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Image Library</h1>
            <p className="text-muted-foreground">
              {count} {count === 1 ? 'image' : 'images'} in your library
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <form method="get">
                <Input
                  placeholder="Search images..."
                  name="search"
                  defaultValue={search}
                  className="pl-8"
                  autoComplete="off"
                />
                {folder && <input type="hidden" name="folder" value={folder} />}
              </form>
            </div>
            
            <div className="w-full sm:w-48">
              <FolderSelect 
                folders={folders} 
                selectedFolder={folder} 
                search={search}
              />
            </div>
            
            <Button asChild>
              <Link href="/admin/img_upload">Upload New</Link>
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <Empty message={error} />
        ) : images.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {images.map((image) => (
                <ImageCardClient 
                  key={image.id} 
                  image={image}
                  onDelete={handleImageDelete}
                  onUpdate={handleImageUpdate}
                  folders={folders.filter(f => f !== 'All')}
                />
              ))}
            </div>
            
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  {page > 1 && (
                    <PaginationItem>
                      <PaginationPrevious href={`/admin/images?page=${page - 1}${search ? `&search=${search}` : ''}${folder ? `&folder=${folder}` : ''}`} />
                    </PaginationItem>
                  )}
                  
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNumber = i + 1;
                    // Show current page, first, last, and pages around current
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= page - 1 && pageNumber <= page + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href={`/admin/images?page=${pageNumber}${search ? `&search=${search}` : ''}${folder ? `&folder=${folder}` : ''}`}
                            isActive={pageNumber === page}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      (pageNumber === 2 && page > 3) ||
                      (pageNumber === totalPages - 1 && page < totalPages - 2)
                    ) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  {page < totalPages && (
                    <PaginationItem>
                      <PaginationNext href={`/admin/images?page=${page + 1}${search ? `&search=${search}` : ''}${folder ? `&folder=${folder}` : ''}`} />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : (
          <Card className="w-full py-16">
            <CardContent className="flex flex-col items-center justify-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <svg
                  className="h-10 w-10 text-muted-foreground"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10" />
                  <path d="m21 2-9 9" />
                  <path d="m15 8 6-6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No images found</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                {search
                  ? `No images matching "${search}" were found. Try a different search term or upload a new image.`
                  : "Your image library is empty. Start by uploading your first image."}
              </p>
              <Button asChild>
                <Link href="/admin/img_upload">Upload Image</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}