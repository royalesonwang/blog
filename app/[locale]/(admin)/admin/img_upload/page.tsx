"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { toast } from "sonner";
import { CloudIcon, CheckCircle2, FileImage, Copy, Info } from "lucide-react";
export const runtime = 'edge';

export default function ImageUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [altText, setAltText] = useState("");
  const [tags, setTags] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("default");

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
        setThumbnailUrl(data.thumbnailUrl);
        setFileName(data.fileName);
        toast.success("Image uploaded successfully to Cloudflare R2");
        
        // 记录缩略图和尺寸信息
        console.log("Upload successful with details:", {
          original: data.url,
          thumbnail: data.thumbnailUrl,
          width: data.width,
          height: data.height
        });
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

  return (
    <div className="container py-10">
      <div className="flex items-center gap-3 mb-8">
        <CloudIcon className="h-8 w-8 text-blue-500" />
        <h1 className="text-3xl font-bold">Cloudflare R2 Image Upload</h1>
      </div>
      
      <Alert className="mb-6 bg-blue-50">
        <Info className="h-4 w-4" />
        <AlertTitle>About Cloudflare R2 Image Upload</AlertTitle>
        <AlertDescription>
          Images are uploaded to Cloudflare R2 storage. Large images (over 1440px) will be automatically 
          resized to optimize storage and loading speed. Additionally, a thumbnail (max 640px) will be 
          generated for each image.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload New Image</CardTitle>
            <CardDescription>
              Select an image file to upload to Cloudflare R2.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="picture">Picture</Label>
                <Input
                  id="picture"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              {file && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Selected file:</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileImage className="h-4 w-4" />
                    {file.name} ({Math.round(file.size / 1024)} KB)
                  </div>
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="folder">Folder</Label>
                <div className="flex gap-2">
                  <Input
                    id="folder"
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    placeholder="Enter folder name..."
                    autoComplete="off"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter a folder name to organize your images. Leave as "default" if not needed.
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
                <Label htmlFor="altText">Alt Text</Label>
                <Input
                  id="altText"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Alternative text for accessibility..."
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
                <p className="text-xs text-muted-foreground">Separate tags with commas (e.g., nature, landscape, sky)</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? "Uploading to R2..." : "Upload to Cloudflare R2"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Image Preview</CardTitle>
            <CardDescription>
              Preview of the uploaded image will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 bg-muted rounded-md">
              {file ? (
                <img
                  src={thumbnailUrl || uploadedUrl || URL.createObjectURL(file)}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <p className="text-muted-foreground">No image selected</p>
              )}
            </div>
            
            {uploadedUrl && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <h3 className="font-medium">Upload successful!</h3>
                </div>
                
                <div>
                  <Label>File Path:</Label>
                  <div className="mt-1 text-sm text-muted-foreground">{fileName}</div>
                </div>
                
                <div>
                  <Label>R2 Public URL (Original):</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={uploadedUrl} readOnly />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(uploadedUrl);
                        toast.success("URL copied to clipboard");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Original image (max 1440px if resized)
                  </p>
                </div>
                
                <div>
                  <Label>Thumbnail URL:</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={thumbnailUrl || ''} readOnly />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        if (thumbnailUrl) {
                          navigator.clipboard.writeText(thumbnailUrl);
                          toast.success("Thumbnail URL copied to clipboard");
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Thumbnail is optimized for web display (max 640x640px)
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 