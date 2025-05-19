"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  tablePlugin,
  imagePlugin,
  linkPlugin,
  linkDialogPlugin,
  codeBlockPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  toolbarPlugin,
  ListsToggle,
  BlockTypeSelect,
  CodeToggle,
  CreateLink,
  InsertImage,
  InsertThematicBreak,
  InsertTable,
  DiffSourceToggleWrapper,
  diffSourcePlugin,
  Separator,
  markdownShortcutPlugin,
  directivesPlugin,
  type ImageUploadHandler,
  MDXEditorMethods,
  codeMirrorPlugin,
  InsertCodeBlock,
  ChangeCodeMirrorLanguage,
  ConditionalContents
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import "./markdown-editor.css"; // 导入新的CSS文件
import ImageUploadDialog from "./ImageUploadDialog";
import CloudImageDialog from "./CloudImageDialog";
import { Button } from "@/components/ui/button";
import { CloudUpload, FolderOpenIcon } from "lucide-react";

// Custom toolbar button component for R2 image upload
function CloudImageUploadButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Upload & Insert Image (Cloudflare R2)"
      className="toolbar-btn"
      aria-label="Upload image to Cloudflare R2"
    >
      <CloudUpload className="h-4 w-4 text-blue-500" />
    </button>
  );
}

// Custom toolbar button component for selecting images from cloud
function CloudImageSelectButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Select Image from Cloud Storage"
      className="toolbar-btn"
      aria-label="Select image from cloud storage"
    >
      <FolderOpenIcon className="h-4 w-4 text-green-500" />
    </button>
  );
}

export default function MarkdownEditor({
  value,
  onChange,
  slug,
}: {
  value: string;
  onChange: (value: string) => void;
  slug?: string;
}) {
  const editorRef = useRef<MDXEditorMethods>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isCloudImageDialogOpen, setIsCloudImageDialogOpen] = useState(false);
  const [imageUploadCallback, setImageUploadCallback] = useState<((url: string) => void) | null>(null);
  const [isDirectUpload, setIsDirectUpload] = useState(false);

  // 添加内联样式直接修改工具栏背景
  useEffect(() => {
    // DOM加载后执行
    const toolbars = document.querySelectorAll('.mdxeditor .toolbar, .mdxeditor [role="toolbar"]');
    toolbars.forEach(toolbar => {
      if (toolbar instanceof HTMLElement) {
        toolbar.style.backgroundColor = 'transparent';
        toolbar.style.borderBottom = '1px solid var(--border-color)';
        // 确保工具栏固定在顶部
        toolbar.style.position = 'sticky';
        toolbar.style.top = '0';
        toolbar.style.zIndex = '10';
        toolbar.style.width = '100%';
      }
    });

    // 修改模式选择器和下拉菜单的背景
    setTimeout(() => {
      // 定位特定元素并移除其背景色
      const specificElements = document.querySelectorAll('.mdxeditor div[style*="margin-left:auto"][style*="position:sticky"][style*="right:0"]');
      specificElements.forEach(element => {
        if (element instanceof HTMLElement) {
          element.style.backgroundColor = 'transparent';
          // 确保模式选择器在滚动时保持在右侧
          element.style.zIndex = '11';
        }
      });

      // 其他下拉菜单
      const dropdowns = document.querySelectorAll('.mdxeditor [data-view-mode-selector], .mdxeditor [role="listbox"], .mdxeditor [role="menu"]');
      dropdowns.forEach(dropdown => {
        if (dropdown instanceof HTMLElement) {
          dropdown.style.backgroundColor = 'transparent';
        }
      });

      // 确保弹出菜单和对话框正确显示
      const popups = document.querySelectorAll('.mdxeditor [data-radix-popper-content-wrapper], .mdxeditor .popup-container');
      popups.forEach(popup => {
        if (popup instanceof HTMLElement) {
          popup.style.zIndex = '20';
        }
      });
    }, 500);
  }, []);

  // Open the image upload dialog directly
  const openImageUploadDialog = () => {
    setIsDirectUpload(true);
    setIsImageDialogOpen(true);
  };

  // Open the cloud image selection dialog
  const openCloudImageDialog = () => {
    setIsCloudImageDialogOpen(true);
  };

  // Custom image upload handler that opens our dialog
  const handleImageUpload: ImageUploadHandler = async (file) => {
    return new Promise((resolve) => {
      // Store the resolve callback to be called after upload
      setImageUploadCallback(() => resolve);
      setIsDirectUpload(false);
      // Open the upload dialog
      setIsImageDialogOpen(true);
    });
  };

  // Handle the image uploaded event from the dialog
  const handleImageUploaded = (imageUrl: string, altText: string) => {
    if (imageUploadCallback) {
      // Resolve the promise with the uploaded URL
      imageUploadCallback(imageUrl);
      setImageUploadCallback(null);
    } else if (isDirectUpload && editorRef.current) {
      // For direct upload (via cloud button), create markdown image syntax
      const imageMarkdown = `![${altText || 'Image'}](${imageUrl})`;
      
      // Insert the markdown into the editor at the current position
      editorRef.current.insertMarkdown(imageMarkdown);
      setIsDirectUpload(false);
    }
  };

  // Handle image selection from cloud storage
  const handleCloudImageSelected = (imageUrl: string, altText: string) => {
    if (editorRef.current) {
      // Create markdown image syntax
      const imageMarkdown = `![${altText || 'Image'}](${imageUrl})`;
      
      // Insert the markdown into the editor at the current position
      editorRef.current.insertMarkdown(imageMarkdown);
    }
  };

  return (
    <div className="w-full" ref={editorContainerRef}>
      <MDXEditor
        ref={editorRef}
        markdown={value || ""}
        onChange={onChange}
        className="mdx-editor-custom md-list-fix"
        plugins={[
          headingsPlugin(),
          listsPlugin({
            checkList: true,
            // 确保列表样式被正确应用
            forceWrapped: true,
          }),
          quotePlugin(),
          thematicBreakPlugin(),
          tablePlugin(),
          imagePlugin({
            imageUploadHandler: handleImageUpload
          }),
          linkPlugin(),
          linkDialogPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: 'text' }),
          // 添加代码编辑器支持，支持常用编程语言
          codeMirrorPlugin({ 
            codeBlockLanguages: { 
              js: 'JavaScript', 
              jsx: 'JavaScript (React)',
              ts: 'TypeScript',
              tsx: 'TypeScript (React)',
              html: 'HTML',
              css: 'CSS',
              python: 'Python',
              php: 'PHP',
              java: 'Java',
              csharp: 'C#',
              c: 'C',
              cpp: 'C++',
              go: 'Go',
              ruby: 'Ruby',
              rust: 'Rust',
              swift: 'Swift',
              json: 'JSON',
              yml: 'YAML',
              markdown: 'Markdown',
              sql: 'SQL',
              shell: 'Shell',
              bash: 'Bash',
              text: '文本'
            } 
          }),
          diffSourcePlugin({ viewMode: 'rich-text' }),
          markdownShortcutPlugin(),
          directivesPlugin(), // 添加指令插件以支持更多格式
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <UndoRedo />
                <Separator />
                <BoldItalicUnderlineToggles />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <ListsToggle />
                <Separator />
                <CodeToggle />
                <Separator />
                <CreateLink />
                <CloudImageUploadButton onClick={openImageUploadDialog} />
                <CloudImageSelectButton onClick={openCloudImageDialog} />
                <Separator />
                <InsertCodeBlock />
                <Separator />
                <InsertThematicBreak />
                <InsertTable />
              </DiffSourceToggleWrapper>
            )
          })
        ]}
        contentEditableClassName="prose dark:prose-invert max-w-none"
      />
      
      {/* Image upload dialog */}
      <ImageUploadDialog 
        open={isImageDialogOpen}
        onClose={() => {
          setIsImageDialogOpen(false);
          // Reset the direct upload state when dialog is closed without uploading
          setIsDirectUpload(false);
          // Clear any pending callbacks if the dialog is closed without completing
          if (imageUploadCallback) {
            setImageUploadCallback(null);
          }
        }}
        onImageUploaded={handleImageUploaded}
        defaultFolder={slug || "default"}
      />

      {/* Cloud image selection dialog */}
      <CloudImageDialog
        open={isCloudImageDialogOpen}
        onClose={() => setIsCloudImageDialogOpen(false)}
        onImageSelected={handleCloudImageSelected}
        defaultFolder={slug || ""}
      />
    </div>
  );
}
