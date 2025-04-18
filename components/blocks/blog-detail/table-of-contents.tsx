"use client";

import { useEffect, useState } from "react";
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

  // 提取标题并构建目录
  useEffect(() => {
    if (content) {
      const extractedItems = extractHeadings(content);
      setTocItems(extractedItems);
    }
  }, [content]);

  // 监听滚动事件更新当前活动标题
  useEffect(() => {
    const handleScroll = () => {
      // 获取页面上所有标题元素
      const headingElements = Array.from(
        document.querySelectorAll<HTMLElement>("h1[id], h2[id], h3[id]")
      );

      if (headingElements.length === 0) return;

      // 计算哪个标题当前在视口内
      const headingPositions = headingElements.map((heading) => {
        const { top } = heading.getBoundingClientRect();
        return { id: heading.id, top };
      });

      // 找到第一个在视口内的标题
      const currentHeading = headingPositions.find(
        (heading) => heading.top >= 0 && heading.top < window.innerHeight / 2
      );

      if (currentHeading) {
        setActiveId(currentHeading.id);
      } else if (headingPositions[0]) {
        // 如果没有标题在视口内，就选择第一个
        setActiveId(headingPositions[0].id);
      }
    };

    window.addEventListener("scroll", handleScroll);
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
    </nav>
  );
} 