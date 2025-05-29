'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { Turnstile } from '@marsidev/react-turnstile';
import { useAppContext } from "@/contexts/app";
import { toast } from 'sonner';

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  initialEmail?: string;
}

interface SubscribeFormData {
  name: string;
  email: string;
  content: string[];
  turnstileToken: string;
}

export default function SubscriptionModal({ 
  open, 
  onClose, 
  initialEmail = '' 
}: SubscriptionModalProps) {
  const t = useTranslations('subscribe');
  const { user } = useAppContext();
  const [formData, setFormData] = useState<SubscribeFormData>(() => {
    const email = initialEmail || user?.email || '';
    let name = user?.name || '';
    
    // 如果没有用户姓名且邮箱包含@符号，自动填充姓名
    if (!name && email.includes('@')) {
      name = email.split('@')[0];
    }
    
    return {
      name,
      email,
      content: ['Knowledge', 'Life', 'Academic', 'Album'], // 默认全选所有内容
      turnstileToken: ''
    };
  });

  const [loading, setLoading] = useState(false);
  // 更新邮箱值当 initialEmail 变化时
  useEffect(() => {
    if (initialEmail) {
      setFormData(prev => {
        const newData = { ...prev, email: initialEmail };
        
        // 如果姓名字段为空且邮箱包含@符号，自动填充姓名
        if (!prev.name && initialEmail.includes('@')) {
          const emailPrefix = initialEmail.split('@')[0];
          newData.name = emailPrefix;
        }
        
        return newData;
      });
    }
  }, [initialEmail]);
  // 重置用户信息当用户变化时
  useEffect(() => {
    setFormData(prev => {
      const email = initialEmail || user?.email || '';
      const newData = { 
        ...prev,
        name: user?.name || '',
        email 
      };
      
      // 如果没有用户姓名且邮箱包含@符号，自动填充姓名
      if (!user?.name && email.includes('@')) {
        const emailPrefix = email.split('@')[0];
        newData.name = emailPrefix;
      }
      
      return newData;
    });
  }, [user, initialEmail]);

  const contentOptions = [
    { id: 'Knowledge', label: t('knowledge'), description: t('knowledge_description') },
    { id: 'Life', label: t('life'), description: t('life_description') },
    { id: 'Academic', label: t('academic'), description: t('academic_description') },
    { id: 'Album', label: t('album'), description: t('album_description') }
  ];

  const handleContentChange = (contentId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      content: checked 
        ? [...prev.content, contentId]
        : prev.content.filter(id => id !== contentId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || formData.content.length === 0) {
      toast.error(t('validation.required_fields'));
      return;
    }

    if (!formData.turnstileToken) {
      toast.error(t('validation.turnstile_required'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('success_message'));
        onClose();
      } else {
        toast.error(result.message || t('error_message'));
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(t('error_network'));
    } finally {
      setLoading(false);
    }
  };
  const resetForm = () => {
    const email = initialEmail || user?.email || '';
    let name = user?.name || '';
    
    // 如果没有用户姓名且邮箱包含@符号，自动填充姓名
    if (!name && email.includes('@')) {
      name = email.split('@')[0];
    }
    
    setFormData({
      name,
      email,
      content: ['Knowledge', 'Life', 'Academic', 'Album'],
      turnstileToken: ''
    });
  };

  // 重置表单当关闭模态窗口时
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 姓名输入 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              {t('name_label')} <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('name_placeholder')}
              required
            />
          </div>          {/* 邮箱输入 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              {t('email_label')} <span className="text-red-500">*</span>
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                const email = e.target.value;
                setFormData(prev => {
                  const newData = { ...prev, email };
                  
                  // 如果姓名字段为空且邮箱包含@符号，自动填充姓名
                  if (!prev.name && email.includes('@')) {
                    const emailPrefix = email.split('@')[0];
                    newData.name = emailPrefix;
                  }
                  
                  return newData;
                });
              }}
              placeholder={t('email_placeholder')}
              required
            />
          </div>{/* 内容选择 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              {t('content_label')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {contentOptions.map((option) => {
                const isChecked = formData.content.includes(option.id);
                return (
                  <label 
                    key={option.id}
                    className="flex items-start space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="mt-0.5">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => handleContentChange(option.id, checked as boolean)}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {option.label}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Cloudflare Turnstile 验证 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('verification_label')} <span className="text-red-500">*</span>
            </label>
            <div className="flex justify-center">              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                onSuccess={(token) => {
                  setFormData(prev => ({ ...prev, turnstileToken: token }));
                  console.log('Verification successful');
                }}
                onError={() => {
                  setFormData(prev => ({ ...prev, turnstileToken: '' }));
                  toast.error(t('verification_failed'));
                }}
                onExpire={() => {
                  setFormData(prev => ({ ...prev, turnstileToken: '' }));
                  toast.info(t('verification_expired'));
                }}
                options={{
                  theme: "auto",
                  size: "normal"
                }}
              />
            </div>
          </div>
        </form>

        <DialogFooter className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            {t('go_back')}
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !formData.turnstileToken || formData.content.length === 0 || !formData.name || !formData.email}
            className="flex-1"
          >
            {loading ? t('submitting') : t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
