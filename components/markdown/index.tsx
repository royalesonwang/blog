"use client";

import "highlight.js/styles/atom-one-dark.min.css";
import "../../app/theme.css";

import MarkdownIt from "markdown-it";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import hljs from "highlight.js";

// 修复 isSpace 未定义的问题
function fixIsSpaceIssue() {
  // 确保 isSpace 函数在全局作用域中可用
  if (typeof window !== 'undefined' && typeof (window as any).isSpace === 'undefined') {
    (window as any).isSpace = function(code: number): boolean {
      switch (code) {
        case 0x09: // \t
        case 0x20: // space
        case 0xa0: // &nbsp;
        case 0x1680:
        case 0x2000:
        case 0x2001:
        case 0x2002:
        case 0x2003:
        case 0x2004:
        case 0x2005:
        case 0x2006:
        case 0x2007:
        case 0x2008:
        case 0x2009:
        case 0x200a:
        case 0x202f:
        case 0x205f:
        case 0x3000:
          return true;
        default:
          return false;
      }
    };
  }
}

// 规范化语言标识符
const normalizeLang = (lang: string): string => {
  if (!lang) return '';
  
  // 常见编程语言别名映射 - 使用静态对象以避免重复创建
  const languageAliases: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'sh': 'bash',
    'zsh': 'bash',
    'csharp': 'cs',
    'html': 'html',
    'css': 'css',
    'md': 'markdown'
  };
  
  return languageAliases[lang.toLowerCase()] || lang.toLowerCase();
};

// 性能优化版的预处理函数
const preprocessMarkdown = (content: string): string => {
  if (!content) return '';
  
  const lines = content.split('\n');
  const resultLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // 使用更高效的测试方法
    if (/^\s*(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) {
      // 直接使用特殊的HTML实体格式表示水平线，避免后续处理影响
      resultLines.push('\u200B<hr class="markdown-hr" />');
    } 
    else if (/^\s*\*(?!\s)/.test(line) && line.indexOf('*', line.indexOf('*') + 1) > 0) {
      const prefix = line.match(/^\s*/)?.[0] || '';
      const content = line.substring(prefix.length);
      resultLines.push(prefix + '\u200B' + content);
    } 
    else {
      resultLines.push(line);
    }
  }
  
  return resultLines.join('\n');
};

// 合并预处理函数以减少字符串操作次数
const processMarkdownContent = (content: string): string => {
  if (!content) return '';
  
  // 先应用预处理函数处理特殊的水平线格式
  content = preprocessMarkdown(content);
  
  // 应用各种预处理，减少多次字符串转换和分割
  return content
    // 预处理引用文本
    .replace(/^(\s*>)(?!\s)/gm, '$1 ')
    // 修复斜体标记
    .replace(/(?<![*\w])\*(?=\S)(.+?)(?<=\S)\*(?![*\w])/g, '*$1*')
    .replace(/(?<![_\w])_(?=\S)(.+?)(?<=\S)_(?![_\w])/g, '_$1_')
    // 特殊处理行首斜体
    .replace(
      /^(\s*)\*([^*\n]+)\*(.*)$/gm,
      (match, space, emphText, rest) => {
        if (emphText.startsWith(' ')) return match;
        return `${space}\u200B*${emphText}*${rest}`;
      }
    )
    // 处理特殊形式的行
    .replace(
      /^\s*\*([^*]+)\.\s+([^*]+):\s+([^*.]+)\.\*\s*$/gm,
      (match) => '\u200B' + match
    )
    // 确保有序列表项有一个空格
    .replace(/^(\d+)\.(?!\s)/gm, '$1. ')
    // 确保无序列表项有一个空格
    .replace(/^[-*+](?!\s)/gm, '- ')
    // 格式化嵌套列表的缩进
    .replace(/^(\s+)[-*+](?!\s)/gm, (match, p1) => `${p1}- `)
    .replace(/^(\s+)(\d+)\.(?!\s)/gm, (match, p1, p2) => `${p1}${p2}. `);
};

// 创建并缓存 MarkdownIt 实例
const createMarkdownIt = () => {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  });
  
  // 为静态ID映射创建属性
  (md as any).__idMap = {};
    // 自定义水平线规则
  md.renderer.rules.hr = () => '<hr class="markdown-hr" />';
  
  // 允许HTML内容通过预处理器生成的特殊水平线标记
  md.renderer.rules.html_block = (tokens, idx) => {
    const content = tokens[idx].content.trim();
    if (content === '<hr class="markdown-hr" />') {
      return content;
    }
    return tokens[idx].content;
  };
  
  // 自定义标题渲染
  md.renderer.rules.heading_open = (tokens, idx) => {
    const token = tokens[idx];
    const nextToken = tokens[idx + 1];
    const level = token.tag.slice(1);
    
    let content = '';
    if (nextToken && nextToken.type === 'inline' && nextToken.content) {
      content = nextToken.content;
    }
    
    // 去除标题中的Markdown标识符号
    content = content
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/_(.*?)_/g, "$1");
    
    const idMap = (md as any).__idMap;
    
    // 检查是否包含非拉丁字符
    const hasNonLatinChars = /[^\u0000-\u007F]/.test(content);
    
    let baseId;
    if (hasNonLatinChars) {
      baseId = content.toLowerCase().replace(/\s+/g, "-");
    } else {
      baseId = content.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
    }
    
    // 确保ID唯一
    let id = baseId;
    if (idMap[baseId]) {
      idMap[baseId]++;
      id = `${baseId}-${idMap[baseId]}`;
    } else {
      idMap[baseId] = 1;
    }
      
    return `<${token.tag} id="${id}" class="scroll-mt-16">`;
  };
  
  // 配置代码高亮
  md.set({
    highlight: (str, lang) => {
      const normalizedLang = normalizeLang(lang);
      
      if (normalizedLang && hljs.getLanguage(normalizedLang)) {
        try {
          return `<pre class="hljs language-${normalizedLang}"><code class="language-${normalizedLang}">${
            hljs.highlight(str, { language: normalizedLang, ignoreIllegals: true }).value
          }</code></pre>`;
        } catch (_) {
          return `<pre class="hljs"><code>${MarkdownIt().utils.escapeHtml(str)}</code></pre>`;
        }
      }

      return `<pre class="hljs"><code>${MarkdownIt().utils.escapeHtml(str)}</code></pre>`;
    },
  });

  // 自定义各种元素的渲染
  md.renderer.rules.blockquote_open = () => '<blockquote class="markdown-blockquote">';
  md.renderer.rules.blockquote_close = () => '</blockquote>';
  md.renderer.rules.em_open = () => '<em class="markdown-italic">';
  md.renderer.rules.strong_open = () => '<strong class="markdown-bold">';
  md.renderer.rules.bullet_list_open = () => '<ul class="markdown-unordered-list">';
  md.renderer.rules.ordered_list_open = () => '<ol class="markdown-ordered-list">';
  md.renderer.rules.list_item_open = () => '<li class="markdown-list-item">';
  md.renderer.rules.table_open = () => '<div class="table-container"><table class="markdown-table">';
  md.renderer.rules.table_close = () => '</table></div>';
  md.renderer.rules.thead_open = () => '<thead class="markdown-thead">';
  md.renderer.rules.tbody_open = () => '<tbody class="markdown-tbody">';
  md.renderer.rules.th_open = () => '<th class="markdown-th" scope="col">';
  md.renderer.rules.td_open = () => '<td class="markdown-td">';
  md.renderer.rules.tr_open = () => '<tr class="markdown-table-row">';

  return md;
};

export default function Markdown({ content }: { content: string }) {
  const [renderedContent, setRenderedContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // 创建和缓存 MarkdownIt 实例
  const md = useMemo(() => createMarkdownIt(), []);
  // 预处理和渲染 Markdown - 使用useCallback提高性能
  const renderMarkdown = useCallback((content: string) => {
    try {
      if (!content) {
        setRenderedContent("");
        return;
      }

      // 修复 isSpace 未定义的问题
      fixIsSpaceIssue();
      
      // 应用预处理步骤，已经包含了preprocessMarkdown的调用
      const processedContent = processMarkdownContent(content);
      
      // 渲染Markdown
      const htmlContent = md.render(processedContent);
      
      setRenderedContent(htmlContent);
      setError(null);
    } catch (err) {
      console.error("Markdown rendering error:", err);
      setError(`Failed to render markdown: ${err instanceof Error ? err.message : String(err)}`);
      setRenderedContent("");
    }
  }, [md]);

  // 只在content变化时重新渲染，并通过requestIdleCallback优化
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 使用requestIdleCallback当浏览器空闲时渲染大型内容
      // 这可以防止渲染阻塞主线程导致UI卡顿
      if (typeof window.requestIdleCallback === 'function') {
        // @ts-ignore - requestIdleCallback在TypeScript中可能未正确定义
        const idleCallbackId = requestIdleCallback(() => {
          renderMarkdown(content);
        }, { timeout: 1000 }); // 设置最大延迟为1秒
        
        return () => {
          if (typeof window.cancelIdleCallback === 'function') {
            // @ts-ignore - cancelIdleCallback在TypeScript中可能未正确定义
            cancelIdleCallback(idleCallbackId);
          }
        };
      } else {
        // 兼容不支持requestIdleCallback的浏览器
        const timeoutId = setTimeout(() => renderMarkdown(content), 0);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [content, renderMarkdown]);

  if (error) {
    return <div className="markdown-error text-red-500">{error}</div>;
  }

  if (!renderedContent) {
    return null;
  }

  return (
    <div
      className="max-w-full overflow-x-auto markdown"
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}
