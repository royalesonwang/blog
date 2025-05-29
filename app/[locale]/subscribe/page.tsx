'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Turnstile } from '@marsidev/react-turnstile';
import { useAppContext } from "@/contexts/app";
import { toast } from 'sonner';

interface SubscribeFormData {
  name: string;
  email: string;
  content: string[];
  turnstileToken: string;
}

export default function SubscribePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('subscribe');
  const { user } = useAppContext();  const [formData, setFormData] = useState<SubscribeFormData>(() => {
    const email = searchParams.get('email') || user?.email || '';
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
        
        // 获取返回URL
        const returnUrl = sessionStorage.getItem('subscribeReturnUrl') || '/';
        sessionStorage.removeItem('subscribeReturnUrl');
        
        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          router.push(returnUrl);
        }, 2000);
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

  const handleGoBack = () => {
    const returnUrl = sessionStorage.getItem('subscribeReturnUrl') || '/';
    sessionStorage.removeItem('subscribeReturnUrl');
    router.push(returnUrl);
  };
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
              </div>              {/* 邮箱输入 */}
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
                <label className="block text-sm font-medium text-foreground mb-4">
                  {t('content_label')} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {contentOptions.map((option) => {
                    const isChecked = formData.content.includes(option.id);
                    return (
                      <label 
                        key={option.id}
                        className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
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
                          <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>{/* Cloudflare Turnstile 验证 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('verification_label')} <span className="text-red-500">*</span>
                </label>
                <div className="flex justify-center">                  <Turnstile
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                    onSuccess={(token) => {
                      // 当验证成功时设置token
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

              {/* 提交按钮 */}
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoBack}
                  className="flex-1"
                >
                  {t('go_back')}
                </Button>                <Button
                  type="submit"
                  disabled={loading || !formData.turnstileToken || formData.content.length === 0 || !formData.name || !formData.email}
                  className="flex-1"
                >
                  {loading ? t('submitting') : t('submit')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
