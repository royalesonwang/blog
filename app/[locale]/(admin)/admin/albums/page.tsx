"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";
import { Info, PlusCircle, FolderOpen, Pencil, Trash2, ImageIcon, BookImage } from "lucide-react";
import { format } from "date-fns";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

interface AlbumGroup {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  author_name: string;
  image_count?: number;
  cover_url?: string;
}

export default function AlbumsPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<AlbumGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<AlbumGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const pageSize = 10;

  // 获取相册封面
  const fetchAlbumCover = async (albumId: number): Promise<string | undefined> => {
    try {
      const res = await fetch(`/api/albums/${albumId}/images`);
      const data = await res.json();
      if (data.success && data.images && data.images.length > 0) {
        return data.images[0].thumbnail_url || data.images[0].public_url;
      }
    } catch {}
    return undefined;
  };

  // 加载相册数据
  const loadAlbums = async (page: number = 1, search: string = "") => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search
      });
      const response = await fetch(`/api/albums?${queryParams.toString()}`);
      const data = await response.json();
      if (response.ok) {
        let albums: AlbumGroup[] = data.albums || [];
        // 并发获取封面
        const covers = await Promise.all(albums.map(a => fetchAlbumCover(a.id)));
        albums = albums.map((a, i) => ({ ...a, cover_url: covers[i] }));
        setAlbums(albums);
        setTotalPages(Math.ceil((data.total || 0) / pageSize));
      } else {
        toast.error(`Failed to load albums: ${data.message}`);
      }
    } catch (error) {
      console.error("Error loading albums:", error);
      toast.error("Failed to load albums");
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadAlbums(currentPage, searchTerm);
  }, [currentPage]);

  // 处理搜索
  const handleSearch = () => {
    setCurrentPage(1); // 重置为第一页
    loadAlbums(1, searchTerm);
  };

  // 处理按键事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 打开删除对话框
  const openDeleteDialog = (album: AlbumGroup) => {
    setAlbumToDelete(album);
    setDeleteDialogOpen(true);
  };

  // 删除相册
  const handleDelete = async () => {
    if (!albumToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/albums/${albumToDelete.id}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success("Album deleted successfully");
        loadAlbums(currentPage, searchTerm); // 重新加载数据
      } else {
        toast.error(`Failed to delete album: ${data.message}`);
      }
    } catch (error) {
      console.error("Error deleting album:", error);
      toast.error("Failed to delete album");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setAlbumToDelete(null);
    }
  };

  return (
    <div className="container max-w-7xl py-10">
      <div className="flex items-center gap-3 mb-8">
        <BookImage className="h-8 w-8 text-blue-500" />
        <h1 className="text-3xl font-bold">相册管理</h1>
      </div>
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input 
            placeholder="搜索相册..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="max-w-xs"
          />
          <Button onClick={handleSearch}>搜索</Button>
        </div>
        
        <Button 
          onClick={() => router.push("/admin/albums/add")}
          className="w-full sm:w-auto"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          新建相册
        </Button>
      </div>
      {loading ? (
        <div className="text-center p-8 text-muted-foreground">加载中...</div>
      ) : albums.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          {searchTerm ? "没有找到匹配的相册" : "暂无相册，点击\"新建相册\"按钮创建"}
        </div>
      ) : (
        <>
          {/* Instagram风格网格布局 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {albums.map((album) => (
              <div key={album.id} className="relative group rounded-lg overflow-hidden shadow border bg-white">
                <img
                  src={album.cover_url || "/default_album_cover.png"}
                  alt={album.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.push(`/admin/albums/${album.id}/edit`)}
                    title="编辑相册"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.push(`/admin/albums/${album.id}/images`)}
                    title="管理图片"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => openDeleteDialog(album)}
                    title="删除相册"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4">
                  <div className="font-bold text-lg truncate">{album.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{album.description}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">图片数: {album.image_count || 0}</span>
                    <span className="text-xs text-muted-foreground">{album.author_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(p => Math.max(1, p - 1));
                      }}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(i + 1);
                        }}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(p => Math.min(totalPages, p + 1));
                      }}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
      
      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="确认删除相册"
        description={`您确定要删除相册"${albumToDelete?.title}"吗？此操作将同时删除相册中的所有图片，且无法撤销。`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
