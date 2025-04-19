"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

// 定义目录项类型
interface TOCItem {
  id: string;
  text: string;
  level: number;
  children: TOCItem[];
}

// 提取MD内容中的标题并生成目录结构
function extractHeadings(content: string): TOCItem[] {
  // 匹配 # 到 ### 的标题
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings: TOCItem[] = [];
  const rootItems: TOCItem[] = [];
  let match;
  
  // 标题ID的映射，用于检测重复
  const idMap: Record<string, number> = {};

  // 生成唯一ID的函数
  const generateUniqueId = (text: string): string => {
    // 检查是否包含中文或其他非拉丁字符
    const hasNonLatinChars = /[^\u0000-\u007F]/.test(text);
    
    let baseId;
    if (hasNonLatinChars) {
      // 对于中文，生成基础ID
      baseId = text
        .toLowerCase()
        .replace(/\s+/g, "-");
      
      // 为非拉丁字符保留原始文本作为锚点
      // 但仍替换空格为连字符
    } else {
      // 对于拉丁字符，按原来的方式处理
      baseId = text
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "");
    }
    
    // 检查ID是否已存在，如果存在则添加计数器
    if (idMap[baseId]) {
      idMap[baseId]++;
      return `${baseId}-${idMap[baseId]}`;
    } else {
      idMap[baseId] = 1;
      return baseId;
    }
  };

  // 正则匹配所有标题
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length; // # 的数量代表级别
    let text = match[2].trim();
    
    // 去除标题中的Markdown粗体标识符号
    text = text.replace(/\*\*(.*?)\*\*/g, "$1"); // 去除 **粗体**
    text = text.replace(/\*(.*?)\*/g, "$1");     // 去除 *斜体*
    text = text.replace(/__(.*?)__/g, "$1");     // 去除 __粗体__
    text = text.replace(/_(.*?)_/g, "$1");       // 去除 _斜体_
    
    // 为标题创建 ID (用于锚点链接)
    const id = generateUniqueId(text);

    const item: TOCItem = {
      id,
      text,
      level,
      children: [],
    };

    headings.push(item);
  }

  // 构建嵌套结构 (最多支持三级)
  for (const item of headings) {
    if (item.level === 1) {
      rootItems.push(item);
    } else if (item.level === 2) {
      if (rootItems.length > 0) {
        rootItems[rootItems.length - 1].children.push(item);
      } else {
        rootItems.push(item);
      }
    } else if (item.level === 3) {
      const lastRoot = rootItems[rootItems.length - 1];
      if (lastRoot) {
        if (lastRoot.children.length > 0) {
          lastRoot.children[lastRoot.children.length - 1].children.push(item);
        } else {
          lastRoot.children.push(item);
        }
      }
    }
  }

  return rootItems;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const activeElementRef = useRef<HTMLAnchorElement | null>(null);
  const tocContainerRef = useRef<HTMLDivElement>(null);
  
  // 提取标题并构建目录
  useEffect(() => {
    if (content) {
      const extractedItems = extractHeadings(content);
      setTocItems(extractedItems);
    }
  }, [content]);
  
  // 当激活ID变化时滚动到对应的目录项
  useEffect(() => {
    if (!activeId || !tocContainerRef.current) return;
    
    // 使用setTimeout确保DOM已更新
    setTimeout(() => {
      // 使用document.querySelector查找当前容器内的活跃元素
      const activeElement = tocContainerRef.current?.querySelector(`a[href="#${activeId}"]`) as HTMLAnchorElement | null;
      
      if (activeElement && tocContainerRef.current) {
        // 保存引用以便在调试时使用
        activeElementRef.current = activeElement;
        
        // 获取滚动容器和活跃元素的位置信息
        const container = tocContainerRef.current;
        const containerTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const containerBottom = containerTop + containerHeight;
        
        // 获取元素相对于滚动容器的位置
        const elementTop = activeElement.offsetTop;
        const elementHeight = activeElement.offsetHeight;
        const elementBottom = elementTop + elementHeight;
        
        // 判断元素是否在可视区域
        const isInView = (
          elementTop >= containerTop &&
          elementBottom <= containerBottom
        );
        
        // 如果元素不在可视区域，则滚动到可见位置
        if (!isInView) {
          // 如果元素在容器上方，则滚动使其位于顶部附近
          if (elementTop < containerTop) {
            container.scrollTo({
              top: Math.max(0, elementTop - 60), // 增加向上滚动的空间
              behavior: 'smooth'
            });
          }
          // 如果元素在容器下方，则滚动使其位于底部附近
          else if (elementBottom > containerBottom) {
            container.scrollTo({
              top: elementBottom - containerHeight + 40, // 保持一定空间
              behavior: 'smooth'
            });
          }
        }
      }
    }, 50); // 延迟50ms确保DOM已更新
  }, [activeId]);

  // 监听滚动事件更新当前活动标题
  useEffect(() => {
    const handleScroll = () => {
      // 获取页面上所有标题元素
      const headingElements = Array.from(
        document.querySelectorAll<HTMLElement>("h1[id], h2[id], h3[id]")
      );

      if (headingElements.length === 0) return;

      // 计算每个标题的位置信息
      const headingPositions = headingElements.map((heading) => {
        const { top } = heading.getBoundingClientRect();
        return { id: heading.id, top };
      });

      // 设置偏移量，考虑到页眉的高度
      const scrollOffset = 100; // 调整此值以匹配页眉高度

      // 查找当前在视口中或刚刚离开视口上方的标题
      // 1. 首先检查是否有标题在视口上方区域内
      const headingsAboveViewport = headingPositions.filter(
        heading => heading.top < scrollOffset
      );
      
      // 如果有标题在视口上方，选择最后一个（最接近视口的标题）
      if (headingsAboveViewport.length > 0) {
        const lastHeadingAbove = headingsAboveViewport[headingsAboveViewport.length - 1];
        setActiveId(lastHeadingAbove.id);
        return;
      }
      
      // 2. 如果没有标题在视口上方，检查视口中的标题
      const headingsInViewport = headingPositions.filter(
        heading => heading.top >= scrollOffset && heading.top < window.innerHeight / 2
      );
      
      if (headingsInViewport.length > 0) {
        // 选择视口中第一个标题
        setActiveId(headingsInViewport[0].id);
        return;
      }
      
      // 3. 如果视口上方和视口中都没有标题，选择第一个尚未到达的标题
      const nextHeadings = headingPositions.filter(
        heading => heading.top >= window.innerHeight / 2
      );
      
      if (nextHeadings.length > 0) {
        // 选择即将到达的第一个标题
        setActiveId(nextHeadings[0].id);
        return;
      }
      
      // 4. 如果所有标题都在视口之下，选择第一个标题
      if (headingPositions.length > 0) {
        setActiveId(headingPositions[0].id);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // 初始执行一次

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [tocItems]);

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <nav className="toc-sidebar">
      <div className="text-sm font-medium mb-4">Contents</div>
      <div 
        ref={tocContainerRef}
        className="pr-2 max-h-[calc(50vh-40px)] overflow-y-auto"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent'
        }}
      >
        <ul className="space-y-2 text-sm">
          {tocItems.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  "block py-1 hover:text-primary transition-colors",
                  activeId === item.id ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {item.text}
              </a>

              {item.children.length > 0 && (
                <ul className="pl-4 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <li key={child.id}>
                      <a
                        href={`#${child.id}`}
                        className={cn(
                          "block py-1 hover:text-primary transition-colors",
                          activeId === child.id
                            ? "text-primary font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {child.text}
                      </a>

                      {child.children.length > 0 && (
                        <ul className="pl-4 mt-1 space-y-1">
                          {child.children.map((grandchild) => (
                            <li key={grandchild.id}>
                              <a
                                href={`#${grandchild.id}`}
                                className={cn(
                                  "block py-1 hover:text-primary transition-colors",
                                  activeId === grandchild.id
                                    ? "text-primary font-medium"
                                    : "text-muted-foreground"
                                )}
                              >
                                {grandchild.text}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
} 