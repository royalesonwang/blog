"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Blog as BlogType } from "@/types/blocks/blog";
import { useLocale } from "next-intl";

// Default cover image for blogs without a cover
const DEFAULT_COVER_IMAGE = "https://pub-6593d615435f4165860abc01713587bb.r2.dev/default_blog_cover.png";

export default function BlogShowcase({ blog }: { blog: BlogType }) {
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

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };
    updateSelection();
    carouselApi.on("select", updateSelection);
    return () => {
      carouselApi.off("select", updateSelection);
    };
  }, [carouselApi]);

  // Empty blog message based on locale
  const getEmptyBlogMessage = (locale: string) => {
    return locale.startsWith("zh") ? "这里没有任何博客！" : "No blog posts yet!";
  };

  return (
    <section id={blog.name} className="py-16">
      <div className="container">
        <div className="mb-8 flex items-end justify-between md:mb-14 lg:mb-16">
          <div>
            {blog.label && (
              <p className="mb-2 text-sm font-medium uppercase tracking-wider">
                {blog.label}
              </p>
            )}
            <h2 className="mb-2 text-pretty text-3xl font-bold lg:text-4xl">
              {blog.title}
            </h2>
            {blog.description && (
              <p className="text-muted-foreground md:text-base lg:text-lg">
                {blog.description}
              </p>
            )}
          </div>
          {blog.items && blog.items.length > 0 && (
            <div className="shrink-0 gap-2 md:flex">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  carouselApi?.scrollPrev();
                }}
                disabled={!canScrollPrev}
                className="disabled:pointer-events-auto"
              >
                <ArrowLeft className="size-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  carouselApi?.scrollNext();
                }}
                disabled={!canScrollNext}
                className="disabled:pointer-events-auto"
              >
                <ArrowRight className="size-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="container">
        {blog.items && blog.items.length > 0 ? (
          <Carousel
            setApi={setCarouselApi}
            opts={{
              breakpoints: {
                "(max-width: 768px)": {
                  dragFree: true,
                },
              },
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-5">
              {blog.items.map((item, i) => (
                <CarouselItem
                  key={i}
                  className="pl-5 md:basis-1/3 lg:basis-1/3"
                >
                  <a
                    href={item.url || `/${item.locale}/posts/${item.slug}`}
                    target={item.target || "_self"}
                    className="group flex h-full flex-col justify-between rounded-xl border border-border bg-transparent overflow-hidden"
                  >
                    <div className="overflow-hidden">
                      <img
                        src={item.cover_url || DEFAULT_COVER_IMAGE}
                        alt={item.title || ""}
                        className="aspect-[16/9] h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4 md:p-4 lg:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {item.created_at && (
                          <Badge variant="outline" className="text-xs">
                            {new Date(item.created_at).toLocaleDateString()}
                          </Badge>
                        )}
                        <div className="line-clamp-1 break-words text-lg font-medium md:text-xl lg:text-xl">
                          {item.title}
                        </div>
                      </div>
                      <div className="mb-3 line-clamp-1 text-sm text-muted-foreground md:mb-4 md:text-base">
                        {item.description || getDefaultDescription(locale)}
                      </div>
                      {blog.read_more_text && (
                        <p className="flex items-center text-sm hover:underline">
                          {blog.read_more_text}
                          <ArrowRight className="ml-2 size-4" />
                        </p>
                      )}
                    </div>
                  </a>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="flex justify-center items-center py-16 text-xl text-muted-foreground">
            {getEmptyBlogMessage(locale)}
          </div>
        )}
      </div>
    </section>
  );
} 