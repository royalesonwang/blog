"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import AlbumViewerDialog from "@/components/image/AlbumViewerDialog";
import { getImageUrl, getThumbnailUrl } from "@/lib/url";

interface AlbumImage {
  id: number;
  file_name: string;
  original_file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  description?: string;
  alt_text?: string;
  tags?: string[];
  folder_name: string;
  group_id: number;
  created_at: string;
  updated_at: string;
  device?: string;
  location?: string;
}

interface AlbumGroup {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  author_name: string;
  images: AlbumImage[];
}

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<AlbumGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<{id: number, title: string} | null>(null);
  
  // 追踪已经报错的图片URL，避免重复报错
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(new Set());

  // 处理图片加载失败的助手函数
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, filePath: string) => {
    const imageUrl = getThumbnailUrl(filePath);
    
    // 只有当这个URL还没有报错过时才记录错误
    if (!failedImageUrls.has(imageUrl)) {
      console.error(`图片加载失败: ${imageUrl}`);
      setFailedImageUrls(prev => new Set(prev).add(imageUrl));
    }
    
    // 设置默认的错误图片
    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' text-anchor='middle' alignment-baseline='middle' fill='%23999'%3E图片加载失败%3C/text%3E%3C/svg%3E";
  };

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        // 获取所有相册
        const response = await fetch("/api/albums");
        const data = await response.json();
        
        if (response.ok) {          
          // 获取相册数据
          const albumsData = data.albums || [];
            // 如果有相册，为每个相册获取图片
          if (albumsData.length > 0) {
            const albumsWithImages = await Promise.all(
              albumsData.map(async (album: AlbumGroup) => {
                try {
                  // 为每个相册获取图片
                  const imageResponse = await fetch(`/api/albums/${album.id}/images`);
                  const imageData = await imageResponse.json();
                    if (imageResponse.ok) {
                    // 将图片添加到相册中，添加调试信息
                    const images = imageData.images || [];
                    
                    return {
                      ...album,
                      images: images
                    };
                  }
                  
                  return {
                    ...album,
                    images: []
                  };
                } catch (error) {
                  console.error(`获取相册 ${album.id} 的图片失败:`, error);
                  return {
                    ...album,
                    images: []
                  };
                }
              })
            );
            
            setAlbums(albumsWithImages);
          } else {
            setAlbums(albumsData);
          }
        } else {
          setError(data.message || "获取相册失败");
        }
      } catch (error) {
        console.error("Error fetching albums:", error);
        setError("获取相册失败");
      } finally {
        setLoading(false);
      }
    };    fetchAlbums();
  }, []);    if (loading) {
    return (
      <section className="w-full py-16">
        <div className="container flex flex-col items-center lg:px-16">
          <div className="text-center">
            <h2 className="mb-3 text-pretty text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6 lg:max-w-3xl lg:text-5xl">
              Photo Gallery
            </h2>
            <p className="mb-8 text-muted-foreground md:text-base lg:max-w-2xl lg:text-lg">
              A collection of memories captured in images. Browse through our albums and enjoy the visual journey of moments and experiences.
            </p>          </div>
          <div className="text-center text-muted-foreground mt-8">
            Loading...
          </div>
        </div>
      </section>
    );
  }    if (error) {
    return (
      <section className="w-full py-16">
        <div className="container flex flex-col items-center lg:px-16">
          <div className="text-center">
            <h2 className="mb-3 text-pretty text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6 lg:max-w-3xl lg:text-5xl">
              Photo Gallery
            </h2>
          </div>
          <div className="text-center text-red-500 mt-8">
            {error}
          </div>
        </div>
      </section>
    );
  }    if (!albums || albums.length === 0) {
    return (
      <section className="w-full py-16">
        <div className="container flex flex-col items-center lg:px-16">
          <div className="text-center">
            <h2 className="mb-3 text-pretty text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6 lg:max-w-3xl lg:text-5xl">
              Photo Gallery
            </h2>
            <p className="mb-8 text-muted-foreground md:text-base lg:max-w-2xl lg:text-lg">
              A collection of memories captured in images.
            </p>
          </div>
          <div className="text-center text-muted-foreground mt-8">
            No albums available at the moment.
          </div>
        </div>
      </section>
    );
  }

  // 过滤掉没有图片的相册，并为每个相册选择最新的一张图片作为封面
  const albumsWithCovers = albums
    .filter(album => album.images && Array.isArray(album.images) && album.images.length > 0)
    .map(album => {
      // 按照创建时间排序找出最新的图片作为封面
      const sortedImages = [...album.images].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const coverImage = sortedImages[0]; // 最新的图片
        return {
        id: album.id,
        title: album.title,
        description: album.description,
        author_name: album.author_name,
        created_at: album.created_at,
        updated_at: album.updated_at,
        imageCount: album.images.length,
        coverImage: {
          ...coverImage,
          albumId: album.id,
          albumTitle: album.title
        }
      };
    });
  
  // 如果没有包含图片的相册，显示提示信息  
  if (albumsWithCovers.length === 0) {
    return (
      <section className="w-full py-16">
        <div className="container flex flex-col items-center lg:px-16">
          <div className="text-center">
            <h2 className="mb-3 text-pretty text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6 lg:max-w-3xl lg:text-5xl">
              Photo Gallery
            </h2>
          </div>
          <div className="text-center text-muted-foreground mt-8">
            No albums with images available at the moment.
          </div>
        </div>
      </section>
    );
  }
  // Instagram风格的布局：将相册组织成组，每组包含5个相册
  // 每组的布局是：4个正方形(摆成2x2) + 1个长方形(右侧)，然后是1个长方形(左侧) + 4个正方形(摆成2x2)，以此类推
  const albumGroups = [];
  for (let i = 0; i < albumsWithCovers.length; i += 5) {
    const group = albumsWithCovers.slice(i, Math.min(i + 5, albumsWithCovers.length));
    albumGroups.push(group);
  }    return (
    <section className="w-full py-16">
      <div className="container flex flex-col items-center lg:px-16">
        <div className="text-center">
          <h2 className="mb-3 text-pretty text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6 lg:max-w-3xl lg:text-5xl">
            Photo Gallery
          </h2>
          <p className="mb-4 text-muted-foreground md:text-base lg:max-w-2xl lg:text-lg">
            A collection of memories captured in images.
          </p>
        </div>
        {/* 版权声明 */}
        <div className="mt-4 pb-4 mb-4">
          <div className="text-left text-sm text-muted-foreground max-w mx-auto">
            <p>
              These images are intended for personal use only. For reposting, please provide proper attribution. 
              To obtain the original image or for commercial use, kindly contact: 
              <a 
                href="mailto:esonwang@outlook.com" 
                className="ml-1 text-primary hover:underline"
              >
                esonwang@outlook.com
              </a>.
            </p>
          </div>
        </div>
              {albumGroups.map((group, groupIndex) => {
        // 确定这组是偶数组还是奇数组
        const isOddGroup = groupIndex % 2 === 0; // 0,2,4...为奇数组（索引从0开始）
        const isFiveImages = group.length === 5; // 是否正好有5张图片
          
        return (
          <div key={`group-${groupIndex}`} className="mb-1" style={{ width: "100%" }}>
            {/* 当有5张图片时保持原有的布局 */}
            {isFiveImages && isOddGroup && (
              <div className="grid grid-cols-12 gap-1 w-full overflow-hidden">
                {/* 左侧4个正方形相册区域 */}
                <div className="col-span-12 md:col-span-8 grid grid-cols-2 gap-1 w-full">
                  {group.slice(0, 4).map((album, albumIndex) => {
                    const coverImage = album.coverImage;
                    
                    return (
                      <div 
                        key={`album-${album.id}`} 
                        className="relative overflow-hidden group cursor-pointer aspect-square w-full"
                        style={{ minHeight: "200px" }}
                        onClick={() => setSelectedAlbum({ id: album.id, title: album.title })}
                      >                        <Image
                          src={getThumbnailUrl(coverImage.file_path)}
                          alt={coverImage.alt_text || album.title}
                          fill                          priority={groupIndex === 0} /* 为第一组的图片添加priority属性，这些是LCP图片 */
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 960px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          onError={(e) => handleImageError(e, coverImage.file_path)}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                          <h3 className="text-base font-medium truncate">{album.title}</h3>
                          <p className="text-sm opacity-80">{album.imageCount} 张图片</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* 右侧长方形相册 */}
                <div className="col-span-12 md:col-span-4 w-full">
                  <div 
                    className="relative overflow-hidden group cursor-pointer aspect-square md:aspect-[4/5] h-full w-full"
                    style={{ minHeight: "420px" }}
                    onClick={() => setSelectedAlbum({ id: group[4].id, title: group[4].title })}
                  >                    <Image
                      src={getThumbnailUrl(group[4].coverImage.file_path)}
                      alt={group[4].coverImage.alt_text || group[4].title}
                      fill
                      priority={groupIndex === 0} /* 为首组的图片添加priority属性 */
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 960px) 100vw, (max-width: 1024px) 50vw, 33vw"                      onError={(e) => handleImageError(e, group[4].coverImage.file_path)}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                      <h3 className="text-base font-medium truncate">{group[4].title}</h3>
                      <p className="text-sm opacity-80">{group[4].imageCount} 张图片</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 偶数组且有5张图片: 1个长方形在左侧，4个正方形(2x2)在右侧 */}
            {isFiveImages && !isOddGroup && (
              <div className="grid grid-cols-12 gap-1 w-full overflow-hidden">
                {/* 左侧长方形相册 */}
                <div className="col-span-12 md:col-span-4 w-full">
                  <div 
                    className="relative overflow-hidden group cursor-pointer aspect-square md:aspect-[4/5] h-full w-full"
                    style={{ minHeight: "420px" }}
                    onClick={() => setSelectedAlbum({ id: group[0].id, title: group[0].title })}
                  >                    <Image
                      src={getThumbnailUrl(group[0].coverImage.file_path)}
                      alt={group[0].coverImage.alt_text || group[0].title}
                      fill
                      priority={groupIndex === 0 || groupIndex === 1} /* 为第一组和第二组的大图添加priority属性 */
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 960px) 100vw, (max-width: 1024px) 50vw, 33vw"                      onError={(e) => handleImageError(e, group[0].coverImage.file_path)}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                      <h3 className="text-base font-medium truncate">{group[0].title}</h3>
                      <p className="text-sm opacity-80">{group[0].imageCount} 张图片</p>
                    </div>
                  </div>
                </div>
                {/* 右侧4个正方形相册区域 */}
                <div className="col-span-12 md:col-span-8 grid grid-cols-2 gap-1 w-full">
                  {group.slice(1).map((album, albumIndex) => {
                    const coverImage = album.coverImage;
                    
                    return (
                      <div 
                        key={`album-${album.id}`} 
                        className="relative overflow-hidden group cursor-pointer aspect-square w-full"
                        style={{ minHeight: "200px" }}
                        onClick={() => setSelectedAlbum({ id: album.id, title: album.title })}
                      >                        <Image
                          src={getThumbnailUrl(coverImage.file_path)}
                          alt={coverImage.alt_text || album.title}                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 960px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          onError={(e) => handleImageError(e, coverImage.file_path)}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                          <h3 className="text-base font-medium truncate">{album.title}</h3>
                          <p className="text-sm opacity-80">{album.imageCount} 张图片</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
              {/* 不足5张图片时，不管奇偶，都采用2列排版 */}
            {!isFiveImages && (
              <div className="grid grid-cols-12 gap-1 w-full overflow-hidden">
                {group.map((album, albumIndex) => {
                  const coverImage = album.coverImage;
                  
                  return (
                    <div 
                      key={`album-${album.id}`} 
                      className="col-span-6 relative overflow-hidden group cursor-pointer aspect-square w-full"
                      style={{ minHeight: "200px" }}
                      onClick={() => setSelectedAlbum({ id: album.id, title: album.title })}
                    >                      <Image
                        src={getThumbnailUrl(coverImage.file_path)}
                        alt={coverImage.alt_text || album.title}
                        fill                        priority={groupIndex === 0 && albumIndex < 2} /* 为首组的前两张图片添加priority属性 */
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 960px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        onError={(e) => handleImageError(e, coverImage.file_path)}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                        <h3 className="text-base font-medium truncate">{album.title}</h3>
                        <p className="text-sm opacity-80">{album.imageCount} 张图片</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
        {/* 相册查看模态窗口 */}
      {selectedAlbum && (
        <AlbumViewerDialog
          open={selectedAlbum !== null}
          onClose={() => setSelectedAlbum(null)}
          albumId={selectedAlbum.id}
          albumTitle={selectedAlbum.title}        />
      )}

      </div>
    </section>
  );
}