"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FileImage, CheckCircle2, Copy, CloudIcon } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";

interface ImageUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onImageUploaded: (imageUrl: string, altText: string) => void;
  defaultFolder?: string;
}

export default function ImageUploadDialog({
  open,
  onClose,
  onImageUploaded,
  defaultFolder = "editor",
}: ImageUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [altText, setAltText] = useState("");
  const [tags, setTags] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(defaultFolder);

  useEffect(() => {
    setSelectedFolder(defaultFolder);
  }, [defaultFolder]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadedUrl(null);
      setFileName(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("description", description);
      formData.append("altText", altText);
      formData.append("tags", tags);
      formData.append("folderName", selectedFolder);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadedUrl(data.url);
        setFileName(data.fileName);
        toast.success("Image uploaded successfully to Cloudflare R2");
      } else {
        throw new Error(data.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image to Cloudflare R2");
    } finally {
      setUploading(false);
    }
  };

  const handleInsertImage = () => {
    if (uploadedUrl) {
      onImageUploaded(uploadedUrl, altText);
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setFile(null);
    setUploadedUrl(null);
    setFileName(null);
    setDescription("");
    setAltText("");
    setTags("");
    setSelectedFolder(defaultFolder);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudIcon className="h-5 w-5 text-blue-500" />
            Upload Image to Cloudflare R2
          </DialogTitle>
          <DialogDescription>
            Upload an image to use in your content. The image will be stored in Cloudflare R2.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="picture">Select Image</Label>
              <Input
                id="picture"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            
            {file && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileImage className="h-4 w-4" />
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </div>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="folder">Folder</Label>
              <Input
                id="folder"
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                placeholder="Enter folder name..."
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Folder to organize your images. Default is the post slug or "default" if no slug exists.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="altText">Alt Text</Label>
              <Input
                id="altText"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Alternative text for accessibility..."
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Describe the image for screen readers and SEO.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter image description..."
                autoComplete="off"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Comma-separated tags..."
                autoComplete="off"
              />
            </div>
            
            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? "Uploading..." : "Upload Image"}
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-48 bg-muted rounded-md mb-4">
                {file ? (
                  <img
                    src={uploadedUrl || URL.createObjectURL(file)}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <p className="text-muted-foreground">No image selected</p>
                )}
              </div>
              
              {uploadedUrl && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <p className="font-medium">Upload successful!</p>
                  </div>
                  
                  <div>
                    <Label>R2 Public URL:</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={uploadedUrl} readOnly className="text-xs" />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(uploadedUrl);
                          toast.success("URL copied");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between items-center mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleInsertImage} 
            disabled={!uploadedUrl}
          >
            Insert Image Into Editor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 