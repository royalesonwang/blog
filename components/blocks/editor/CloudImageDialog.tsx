"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, CheckCircle2, FolderIcon, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getImageUrl, getThumbnailUrl } from "@/lib/url";

interface CloudImageDialogProps {
  open: boolean;
  onClose: () => void;
  onImageSelected: (imageUrl: string, altText: string) => void;
  defaultFolder?: string;
}

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

export default function CloudImageDialog({
  open,
  onClose,
  onImageSelected,
  defaultFolder = "",
}: CloudImageDialogProps) {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageUpload | null>(null);
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState(defaultFolder || "all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'error' | 'ok'>('idle');

  // 检查API状态
  const checkApiStatus = async () => {
    setApiStatus('checking');
    try {
      const response = await fetch('/api/images/status');
      if (response.ok) {
        setApiStatus('ok');
        return true;
      } else {
        setApiStatus('error');
        return false;
      }
    } catch (error) {
      console.error("API status check failed:", error);
      setApiStatus('error');
      return false;
    }
  };

  // Fetch images when dialog opens or filters change
  useEffect(() => {
    if (open) {
      fetchImages();
    } else {
      // Reset state when dialog closes
      setSelectedImage(null);
    }
  }, [open, page, folder]);

  // Update folder when defaultFolder changes
  useEffect(() => {
    setFolder(defaultFolder || "all");
  }, [defaultFolder]);

  // Function to fetch images from the API
  const fetchImages = async (retry = true) => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (folder && folder !== "all") params.append("folder", folder);
      params.append("page", page.toString());
      params.append("limit", "12"); // Show 12 images per page

      console.log(`Fetching images with params: ${params.toString()}`);
      const response = await fetch(`/api/images?${params.toString()}`);
      
      // 检查HTTP状态码
      if (!response.ok) {
        console.error(`API returned status: ${response.status}`);
        
        // 如果返回500错误，尝试检查API状态并重试
        if (response.status === 500 && retry) {
          const isApiOk = await checkApiStatus();
          if (isApiOk) {
            // API可用，尝试再次获取图片
            toast.info("Retrying to load images...");
            setTimeout(() => fetchImages(false), 1000);
            return;
          }
        }
        
        if (response.status === 401) {
          toast.error("You are not authorized to view these images");
          return;
        }
        
        // 尝试解析错误详情
        try {
          const errorData = await response.json();
          toast.error(errorData.message || `Error ${response.status}: Failed to load images`);
        } catch (parseError) {
          toast.error(`Error ${response.status}: Could not fetch images`);
        }
        return;
      }
      
      const data = await response.json();

      if (data.success) {
        setImages(data.images || []);
        setFolders(data.folders || []);
        setTotalPages(data.totalPages || 1);
        setCount(data.count || 0);
        setApiStatus('ok');
      } else {
        toast.error(data.message || "Failed to fetch images");
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      setApiStatus('error');
      
      // 尝试检查API状态并重试
      if (retry) {
        const isApiOk = await checkApiStatus();
        if (isApiOk) {
          toast.info("Connection restored. Retrying to load images...");
          setTimeout(() => fetchImages(false), 1000);
          return;
        }
      }
      
      toast.error(error instanceof Error 
        ? `Error: ${error.message}`
        : "Network error while loading images. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page
    fetchImages();
  };

  // Handle folder change
  const handleFolderChange = (value: string) => {
    setFolder(value === "all" ? "" : value);
    setPage(1); // Reset to first page
  };

  // Handle image selection
  const handleImageClick = (image: ImageUpload) => {
    setSelectedImage(image);
  };

  // Handle insert selected image
  const handleInsertImage = () => {
    if (selectedImage) {
      console.log("CloudImageDialog: inserting selected image", {
        url: getImageUrl(selectedImage.file_path),
        alt: selectedImage.alt_text || selectedImage.original_file_name
      });
      
      onImageSelected(
        getImageUrl(selectedImage.file_path),
        selectedImage.alt_text || selectedImage.original_file_name
      );
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderIcon className="h-5 w-5 text-blue-500" />
            Select Image from Cloud
          </DialogTitle>
          <DialogDescription>
            Choose an image from your cloud storage to insert into your content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search images..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </form>
            <div className="w-full sm:w-48">
              <Select value={folder} onValueChange={handleFolderChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All folders</SelectItem>
                  {folders.map((folderName) => (
                    <SelectItem key={folderName} value={folderName}>
                      {folderName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" onClick={() => fetchImages()}>
              Filter
            </Button>
          </div>

          {/* Images grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : apiStatus === 'error' ? (
            <div className="text-center py-12 border rounded-md bg-red-50">
              <p className="text-red-600 mb-4">
                Could not connect to the image server. There might be an issue with the connection.
              </p>
              <Button
                onClick={() => {
                  checkApiStatus().then(ok => {
                    if (ok) fetchImages();
                  });
                }}
              >
                Check Connection and Retry
              </Button>
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`
                    cursor-pointer rounded-md overflow-hidden border-2 transition-all
                    ${
                      selectedImage?.id === image.id
                        ? "border-primary ring-2 ring-primary ring-opacity-50"
                        : "border-border hover:border-muted-foreground"
                    }
                  `}
                  onClick={() => handleImageClick(image)}
                >
                  <div className="aspect-square bg-muted relative">
                    <img
                      src={getThumbnailUrl(image.file_path)}
                      alt={image.alt_text || image.original_file_name}
                      className="object-cover w-full h-full"
                    />
                    {selectedImage?.id === image.id && (
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">
                      {image.original_file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(image.file_size / 1024)} KB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-md bg-muted/30">
              <p className="text-muted-foreground">
                {search
                  ? `No images matching "${search}" found.`
                  : "No images found in your cloud storage."}
              </p>
              <Button 
                variant="link" 
                onClick={() => {
                  setSearch("");
                  setFolder("all");
                  setPage(1);
                  fetchImages();
                }}
              >
                Clear filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(page - 1);
                      }}
                    />
                  </PaginationItem>
                )}
                
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNumber = i + 1;
                  // Show limited page numbers to avoid clutter
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= page - 1 && pageNumber <= page + 1)
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(pageNumber);
                          }}
                          isActive={pageNumber === page}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(page + 1);
                      }}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}

          <div className="mt-2 text-sm text-muted-foreground">
            {count} {count === 1 ? "image" : "images"} found
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleInsertImage}
            disabled={!selectedImage}
          >
            Insert Selected Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 