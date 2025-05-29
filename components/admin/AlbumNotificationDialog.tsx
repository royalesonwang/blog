import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Mail, Users, Clock, Image as ImageIcon, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface RecentImage {
  file_path: string;
  file_name?: string;
  original_file_name?: string;
  description?: string;
  created_at: string;
}

interface ImageResult {
  totalCount: number;
  recentImages: RecentImage[];
}

interface AlbumNotificationDialogProps {
  open: boolean;
  onClose: () => void;
  albumId: string;
  albumTitle: string;
}

export default function AlbumNotificationDialog({
  open,
  onClose,
  albumId,
  albumTitle,
}: AlbumNotificationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedImagePath, setSelectedImagePath] = useState<string>('');
  const [notificationInfo, setNotificationInfo] = useState<{
    recentImages: ImageResult;
    subscriberCount: number;
    canSendNotification: boolean;
  } | null>(null);
  // 获取通知信息
  useEffect(() => {
    if (open && albumId) {
      fetchNotificationInfo();
    }
  }, [open, albumId]);

  const fetchNotificationInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/albums/${albumId}/notify`);
      const data = await response.json();
      
      if (response.ok) {
        setNotificationInfo({
          recentImages: data.recentImages || { totalCount: 0, recentImages: [] },
          subscriberCount: data.subscriberCount || 0,
          canSendNotification: data.canSendNotification || false,
        });
        
        // 默认选择最新的一张图片
        if (data.recentImages?.recentImages?.length > 0) {
          setSelectedImagePath(data.recentImages.recentImages[0].file_path);
        }
      } else {
        toast.error(`获取通知信息失败: ${data.message}`);
      }
    } catch (error) {
      console.error('Error fetching notification info:', error);
      toast.error('获取通知信息失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationInfo?.canSendNotification) return;
    
    setIsSending(true);
    try {
      const response = await fetch(`/api/albums/${albumId}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedImagePath: selectedImagePath
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(
          `相册通知发送完成！成功发送 ${data.sent} 封邮件${data.errors > 0 ? `，失败 ${data.errors} 封` : ''}`
        );
        onClose();
      } else {
        toast.error(`发送失败: ${data.message}`);
      }
    } catch (error) {
      console.error('Error sending album notification:', error);
      toast.error('发送相册通知失败');
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            发送相册更新通知
          </DialogTitle>
          <DialogDescription>
            向订阅者发送相册《{albumTitle}》的更新通知
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : notificationInfo ? (
          <div className="space-y-4">
            {/* 统计信息 */}            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm font-medium">最近图片</span>
                  </div>                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {notificationInfo.recentImages.totalCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    24小时内新增
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm font-medium">订阅者</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {notificationInfo.subscriberCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    已激活用户
                  </p>
                </CardContent>
              </Card>
            </div>{/* 状态提示 */}
            {!notificationInfo.canSendNotification && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />                <AlertDescription>
                  {notificationInfo.recentImages.totalCount === 0 
                    ? "最近24小时内没有新上传的图片，无法发送通知。"
                    : "没有用户订阅相册更新通知。"}
                </AlertDescription>
              </Alert>
            )}            {notificationInfo.canSendNotification && (
              <Alert variant="info">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  将向 {notificationInfo.subscriberCount} 位订阅者发送包含最新上传图片的更新通知。
                </AlertDescription>
              </Alert>
            )}            {/* 图片选择 */}
            {notificationInfo.recentImages.recentImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    选择封面图片
                  </CardTitle>
                  <CardDescription>
                    请选择一张图片作为邮件封面（默认已选择最新上传的图片）
                  </CardDescription>
                </CardHeader>                <CardContent>
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {notificationInfo.recentImages.recentImages.map((image, index) => {
                      const isSelected = selectedImagePath === image.file_path;
                      return (
                        <label 
                          key={image.file_path}
                          className="flex flex-col space-y-2 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="mt-0.5">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedImagePath(image.file_path);
                                  }
                                }}
                              />
                            </div>
                            
                            {/* 图片预览 */}
                            <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                              <img
                                src={`${process.env.NEXT_PUBLIC_R2_DOMAIN || 'https://storage.eson.wang'}/${image.file_path}`}
                                alt={image.description || image.original_file_name || '图片'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // 图片加载失败时显示默认图标
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg></div>';
                                  }
                                }}
                              />
                            </div>
                            
                            {/* 状态标识 */}
                            <div className="flex flex-col gap-1">
                              {index === 0 && (
                                <Badge variant="default" className="text-xs w-fit">
                                  最新
                                </Badge>
                              )}
                              {isSelected && (
                                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                  <CheckCircle className="h-3 w-3" />
                                  已选择
                                </div>
                              )}
                            </div>
                          </div>
                            {/* 图片信息 */}
                          <div className="ml-8 space-y-1">
                            {/* 图片名称 */}
                            <p className="text-sm font-medium text-foreground truncate">
                              {image.original_file_name || image.file_name || '未命名图片'}
                            </p>
                            {/* 图片描述 */}
                            {image.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {image.description}
                              </p>
                            )}
                            {/* 上传时间 */}
                            <p className="text-xs text-muted-foreground">
                              {formatDate(image.created_at)}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>        ) : (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              获取通知信息失败，请稍后重试。
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            取消
          </Button>          <Button 
            onClick={handleSendNotification}
            disabled={!notificationInfo?.canSendNotification || !selectedImagePath || isSending}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            {isSending ? "发送中..." : "发送通知"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
