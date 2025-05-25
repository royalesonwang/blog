import { ArrowRight } from "lucide-react";
import { Blog as BlogType } from "@/types/blocks/blog";
import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { getThumbnailUrl } from "@/lib/url";

// Default cover image for blogs without a cover
const DEFAULT_COVER_IMAGE = "https://pub-6593d615435f4165860abc01713587bb.r2.dev/default_blog_cover.png";

// 处理图片URL，使用统一的URL工具函数
const getImageUrl = (item: any) => {
  // 如果存在缩略图URL，优先使用
  if (item.cover_thumbnail_url) {
    return item.cover_thumbnail_url;
  }
  
  // 如果有原图URL，使用getThumbnailUrl函数处理
  if (item.cover_url) {
    return getThumbnailUrl(item.cover_url);
  }
  
  // 默认返回默认图片
  return DEFAULT_COVER_IMAGE;
};

export default function Blog({ blog }: { blog: BlogType }) {
  if (blog.disabled) {
    return null;
  }
  
  // Get current locale
  const locale = useLocale();
  
  // Default descriptions based on locale
  const getDefaultDescription = (locale: string) => {
    return locale.startsWith("zh") 
      ? "作者还没写介绍呢，快进来瞅瞅吧！" 
      : "Description? Nah—just dive in!";
  };
  
  // Empty blog message based on locale
  const getEmptyBlogMessage = (locale: string) => {
    return locale.startsWith("zh") ? "这里没有任何博客！" : "No blog posts yet!";
  };

  return (
    <section className="w-full py-16">
      <div className="container flex flex-col items-center gap-8 lg:px-16">
        <div className="text-center">
          <p className="mb-6 text-xs font-medium uppercase tracking-wider">
            {blog.label}
          </p>
          <h2 className="mb-3 text-pretty text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6 lg:max-w-3xl lg:text-5xl">
            {blog.title}
          </h2>
          <p className="mb-8 text-muted-foreground md:text-base lg:max-w-2xl lg:text-lg">
            {blog.description}
          </p>
        </div>
        
        {blog.items && blog.items.length > 0 ? (
          <div className="w-full flex flex-wrap items-start">
            {blog.items.map((item, idx) => (
              <a
                key={idx}
                href={item.url || `/${item.locale}/posts/${item.slug}`}
                target={item.target || "_self"}
                className="w-full md:w-1/3 p-4"
              >
                <div className="flex flex-col overflow-clip rounded-xl border border-border">
                  <div className="overflow-hidden">
                    <img
                      src={getImageUrl(item)}
                      alt={item.title || ""}
                      className="aspect-[16/9] h-full w-full object-cover object-center transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <div className="px-4 py-4 md:px-4 md:py-4 lg:px-4 lg:py-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {item.created_at && (
                        <Badge variant="outline" className="text-xs">
                          {new Date(item.created_at).toLocaleDateString()}
                        </Badge>
                      )}
                      
                      {/* 显示文章类型 */}
                      {item.type && (
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                      )}
                      
                      <h3 className="w-full mt-1 line-clamp-1 text-lg font-semibold md:text-xl lg:text-xl">
                        {item.title}
                      </h3>
                    </div>
                    <p className="mb-3 line-clamp-1 text-muted-foreground md:mb-4 lg:mb-6">
                      {item.description || getDefaultDescription(locale)}
                    </p>
                    {blog.read_more_text && (
                      <p className="flex items-center hover:underline">
                        {blog.read_more_text}
                        <ArrowRight className="ml-2 size-4" />
                      </p>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center py-16 text-xl text-muted-foreground">
            {getEmptyBlogMessage(locale)}
          </div>
        )}
      </div>
    </section>
  );
}
