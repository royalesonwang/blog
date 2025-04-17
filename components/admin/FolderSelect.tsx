"use client";

import { FolderIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface FolderSelectProps {
  folders: string[];
  selectedFolder: string;
  search?: string;
}

export default function FolderSelect({ folders, selectedFolder, search }: FolderSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFolderChange = (value: string) => {
    // 构建新的URL参数
    const params = new URLSearchParams(searchParams.toString());
    
    // 设置文件夹参数
    if (value === "All") {
      params.delete("folder");
    } else {
      params.set("folder", value);
    }
    
    // 设置搜索参数
    if (search) {
      params.set("search", search);
    }
    
    // 重置页码
    params.set("page", "1");
    
    // 导航到新URL
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={selectedFolder || "All"} onValueChange={handleFolderChange}>
      <SelectTrigger className="flex items-center gap-x-2">
        <FolderIcon className="h-4 w-4" />
        <SelectValue placeholder="Select folder" />
      </SelectTrigger>
      <SelectContent className="z-50">
        {folders.map((folderName, index) => (
          <SelectItem 
            className="cursor-pointer flex items-center gap-2" 
            key={`${folderName}-${index}`} 
            value={folderName}
          >
            <div className="flex items-center gap-2">
              <span>{folderName}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 