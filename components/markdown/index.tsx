"use client";

import "highlight.js/styles/atom-one-dark.min.css";
import "../../app/theme.css";

import MarkdownIt from "markdown-it";
import React, { useEffect, useState } from "react";
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
function normalizeLang(lang: string): string {
  if (!lang) return '';
  
  // 常见编程语言别名映射
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
}

// 预处理Markdown内容，确保分割线被正确识别
function preprocessMarkdown(content: string): string {
  if (!content) return '';
  
  let lines = content.split('\n');
  let resultLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // 检测可能的分割线（---、***、___）并添加空格
    // 这使得它们会被markdown-it识别为分割线而不是列表
    if (/^\s*(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) {
      let trimmed = line.trim();
      // 使用空格替换星号，在Markdown中这仍会解析为分割线
      // 但不会被误解为列表项
      if (trimmed.startsWith('*')) {
        resultLines.push('* * *');
      } else if (trimmed.startsWith('-')) {
        resultLines.push('- - -');
      } else {
        resultLines.push('_ _ _');
      }
    } 
    // 检测行首的星号或下划线，并区分列表项和斜体文本
    else if (/^\s*\*(?!\s)/.test(line) && line.indexOf('*', line.indexOf('*') + 1) > 0) {
      // 这可能是行首的斜体文本，而不是列表项
      // 在星号前添加零宽空格，防止它被识别为列表项
      let prefix = line.match(/^\s*/)?.[0] || '';
      let content = line.substring(prefix.length);
      resultLines.push(prefix + '\u200B' + content);
    } 
    else {
      resultLines.push(line);
    }
  }
  
  return resultLines.join('\n');
}

// 预处理引用文本（blockquotes）
function preprocessBlockquotes(content: string): string {
  if (!content) return '';
  
  // 确保引用标记">"后有空格，这样会被正确识别为blockquote
  const processedContent = content.replace(/^(\s*>)(?!\s)/gm, '$1 ');
  
  return processedContent;
}

// 预处理斜体和粗体文本，确保它们被正确识别
function preprocessEmphasis(content: string): string {
  if (!content) return '';
  
  // 修复斜体标记
  // 确保 *text* 和 _text_ 两种方式的斜体标记都能被正确识别
  let processedContent = content
    // 修复星号斜体：确保*前后有空格或标点符号
    .replace(/(?<![*\w])\*(?=\S)(.+?)(?<=\S)\*(?![*\w])/g, '*$1*')
    // 修复下划线斜体：确保_前后有空格或标点符号
    .replace(/(?<![_\w])_(?=\S)(.+?)(?<=\S)_(?![_\w])/g, '_$1_');
  
  // 特殊处理行首星号开始且行内有关闭星号的情况
  processedContent = processedContent.replace(
    /^(\s*)\*([^*\n]+)\*(.*)$/gm,
    (match, space, emphText, rest) => {
      // 如果星号后紧跟空格，这可能是列表项，保持原样
      if (emphText.startsWith(' ')) return match;
      // 否则，这可能是斜体文本，在星号前添加零宽空格
      return `${space}\u200B*${emphText}*${rest}`;
    }
  );
  
  // 处理特殊形式的行：如 *Written in Markdown. Last updated: 2025.*
  processedContent = processedContent.replace(
    /^\s*\*([^*]+)\.\s+([^*]+):\s+([^*.]+)\.\*\s*$/gm,
    (match) => {
      // 在开头星号前添加零宽空格，防止它被解析为列表项
      return '\u200B' + match;
    }
  );
  
  return processedContent;
}

export default function Markdown({ content }: { content: string }) {
  const [renderedContent, setRenderedContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 页面加载时应用修复
    fixIsSpaceIssue();

    try {
      // 创建MarkdownIt实例并配置优先处理水平线规则
      const md: MarkdownIt = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        breaks: true,
      });
      
      // 增强markdown-it的配置，确保正确识别内联元素
      md.set({ 
        html: true,
        breaks: true,
        linkify: true,
        // 启用更严格的内联解析，帮助解析斜体/粗体
        typographer: true
      });
      
      // 自定义水平线规则，确保它具有更高的优先级
      md.renderer.rules.hr = function() {
        return '<hr class="markdown-hr" />';
      };
      
      // 自定义标题渲染，添加ID以支持锚点
      md.renderer.rules.heading_open = function(tokens, idx) {
        const token = tokens[idx];
        const nextToken = tokens[idx + 1];
        const level = token.tag.slice(1); // h1 -> 1, h2 -> 2, etc.
        
        // 获取标题内容
        let content = '';
        if (nextToken && nextToken.type === 'inline' && nextToken.content) {
          content = nextToken.content;
        }
        
        // 去除标题中的Markdown粗体和斜体标识符号
        content = content.replace(/\*\*(.*?)\*\*/g, "$1"); // 去除 **粗体**
        content = content.replace(/\*(.*?)\*/g, "$1");     // 去除 *斜体*
        content = content.replace(/__(.*?)__/g, "$1");     // 去除 __粗体__
        content = content.replace(/_(.*?)_/g, "$1");       // 去除 _斜体_
        
        // 静态ID映射（在渲染器中不能持久化状态，所以使用一个内部的静态映射）
        if (!(md as any).__idMap) {
          (md as any).__idMap = {};
        }
        const idMap = (md as any).__idMap;
        
        // 为标题创建ID (用于锚点链接)
        // 检查是否包含中文或其他非拉丁字符
        const hasNonLatinChars = /[^\u0000-\u007F]/.test(content);
        
        let baseId;
        if (hasNonLatinChars) {
          // 对于中文，生成基础ID，只替换空格
          baseId = content
            .toLowerCase()
            .replace(/\s+/g, "-");
        } else {
          // 对于拉丁字符，按原来的方式处理
          baseId = content
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w\-]+/g, "");
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
        highlight: function (str: string, lang: string): string {
          const normalizedLang = normalizeLang(lang);
          
          if (normalizedLang && hljs.getLanguage(normalizedLang)) {
            try {
              return `<pre class="hljs language-${normalizedLang}"><code class="language-${normalizedLang}">${
                hljs.highlight(str, { language: normalizedLang, ignoreIllegals: true }).value
              }</code></pre>`;
            } catch (_) {
              // 出错时返回未高亮的代码
              return `<pre class="hljs"><code>${MarkdownIt().utils.escapeHtml(str)}</code></pre>`;
            }
          }

          // 如果没有指定语言或语言无法识别，返回普通代码块
          return `<pre class="hljs"><code>${MarkdownIt().utils.escapeHtml(str)}</code></pre>`;
        },
      });

      // 自定义引用块（blockquote）的渲染
      md.renderer.rules.blockquote_open = function() {
        return '<blockquote class="markdown-blockquote">';
      };
      
      md.renderer.rules.blockquote_close = function() {
        return '</blockquote>';
      };
      
      // 自定义斜体（em）的渲染
      md.renderer.rules.em_open = function() {
        return '<em class="markdown-italic">';
      };
      
      // 自定义粗体（strong）的渲染
      md.renderer.rules.strong_open = function() {
        return '<strong class="markdown-bold">';
      };

      // 自定义列表渲染
      // 自定义无序列表开始标签
      md.renderer.rules.bullet_list_open = function() {
        return '<ul class="markdown-unordered-list">';
      };

      // 自定义有序列表开始标签
      md.renderer.rules.ordered_list_open = function() {
        return '<ol class="markdown-ordered-list">';
      };

      // 自定义列表项开始标签
      md.renderer.rules.list_item_open = function() {
        return '<li class="markdown-list-item">';
      };

      // 自定义表格样式
      md.renderer.rules.table_open = function() {
        return '<div class="table-container"><table class="markdown-table">';
      };
      
      md.renderer.rules.table_close = function() {
        return '</table></div>';
      };
      
      md.renderer.rules.thead_open = function() {
        return '<thead class="markdown-thead">';
      };
      
      md.renderer.rules.tbody_open = function() {
        return '<tbody class="markdown-tbody">';
      };
      
      // 自定义表格头部单元格样式
      md.renderer.rules.th_open = function() {
        return '<th class="markdown-th" scope="col">';
      };
      
      // 自定义表格单元格样式
      md.renderer.rules.td_open = function() {
        return '<td class="markdown-td">';
      };
      
      // 增强表格行样式
      md.renderer.rules.tr_open = function() {
        return '<tr class="markdown-table-row">';
      };

      // 优化Markdown解析配置，确保正确处理内联元素
      md.set({
        html: true,
        breaks: true,
        linkify: true,
        typographer: true // 启用更严格的内联解析
      });

      // 只在客户端渲染markdown
      if (content) {
        // 预处理 markdown
        let processedContent = preprocessMarkdown(content);
        
        // 预处理引用文本
        processedContent = preprocessBlockquotes(processedContent);
        
        // 预处理斜体和粗体文本
        processedContent = preprocessEmphasis(processedContent);
        
        // 确保有序列表和无序列表有正确的格式和缩进
        processedContent = processedContent
          // 确保有序列表项有一个空格
          .replace(/^(\d+)\.(?!\s)/gm, '$1. ')
          // 确保无序列表项有一个空格
          .replace(/^[-*+](?!\s)/gm, '- ')
          // 格式化嵌套列表的缩进
          .replace(/^(\s+)[-*+](?!\s)/gm, (match, p1) => `${p1}- `)
          .replace(/^(\s+)(\d+)\.(?!\s)/gm, (match, p1, p2) => `${p1}${p2}. `);
        
        // 修复表格格式问题
        let tableFixedContent = processedContent;
        
        // 查找可能的表格行并修复格式
        const tableRegex = /^\|(.*\|)+\s*$/gm;
        const potentialTables = processedContent.match(tableRegex);
        
        if (potentialTables) {
          // 找到了可能的表格，进行进一步处理
          let processedContentLines = processedContent.split('\n');
          
          for (let i = 0; i < processedContentLines.length; i++) {
            const line = processedContentLines[i];
            
            // 是否是表格行
            if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
              // 检查是否有分隔行 (---|---|---)
              if (i + 1 < processedContentLines.length) {
                const nextLine = processedContentLines[i + 1];
                if (nextLine.trim().startsWith('|') && nextLine.includes('-')) {
                  // 可能是表格头部和分隔行
                  
                  // 获取列数 (通过计算 | 字符数减1)
                  const columnCount = (line.match(/\|/g) || []).length - 1;
                  
                  // 检查分隔行是否格式正确
                  const separatorParts = nextLine.split('|').filter(Boolean);
                  if (separatorParts.length !== columnCount) {
                    // 修复分隔行
                    const newSeparator = '|' + Array(columnCount).fill('---').join('|') + '|';
                    processedContentLines[i + 1] = newSeparator;
                  }
                }
              }
              
              // 确保表格每行的单元格数量一致
              const cells = line.split('|').filter(Boolean);
              if (i > 0 && i > 1) { // 不是表头和分隔行
                const prevLine = processedContentLines[i - 2]; // 跳过分隔行
                if (prevLine.trim().startsWith('|') && prevLine.trim().endsWith('|')) {
                  const prevCells = prevLine.split('|').filter(Boolean);
                  if (prevCells.length > cells.length) {
                    // 当前行的单元格少于上一行，需要添加空单元格
                    const diff = prevCells.length - cells.length;
                    let adjustedLine = line.trimEnd();
                    for (let j = 0; j < diff; j++) {
                      adjustedLine += ' |';
                    }
                    processedContentLines[i] = adjustedLine;
                  }
                }
              }
            }
          }
          
          tableFixedContent = processedContentLines.join('\n');
        }
        
        // 渲染最终内容
        const htmlContent = md.render(tableFixedContent);
        
        // 在客户端渲染后，添加一个小延迟来应用样式修复
        setRenderedContent(htmlContent);
        setError(null);
      } else {
        setRenderedContent("");
      }
    } catch (err) {
      console.error("Markdown rendering error:", err);
      setError(`Failed to render markdown: ${err instanceof Error ? err.message : String(err)}`);
      setRenderedContent("");
    }
  }, [content]);

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
