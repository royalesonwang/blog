"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";

interface FooterSubscribeFormProps {
  className?: string;
}

export default function FooterSubscribeForm({ className = "" }: FooterSubscribeFormProps) {
  const { data: session } = useSession();
  const t = useTranslations("subscribe");
  const router = useRouter();
  const pathname = usePathname();
  
  const [email, setEmail] = useState(session?.user?.email || "");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error(t("email_required"));
      return;
    }
    
    if (!validateEmail(email)) {
      toast.error(t("invalid_email"));
      return;
    }

    // 将当前页面路径存储到sessionStorage，用于订阅完成后返回
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('subscribeReturnUrl', pathname);
    }

    // 跳转到专门的订阅页面，并传递邮箱参数
    const subscribeUrl = `/subscribe?email=${encodeURIComponent(email)}`;
    router.push(subscribeUrl);
  };  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Desktop layout: description and input in one row */}
        <div className="hidden lg:flex lg:items-center lg:gap-3">
          <div className="flex-shrink-0">
            <p className="text-sm">
              {t("subscribe_short_desc")}
            </p>
          </div>          <div className="flex items-center gap-1">
            <div className="w-52">
              <Input
                type="email"
                placeholder={t("email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!session?.user?.email}
                required
                className="h-8 text-xs rounded-r-none" 
              />
            </div>
            <div className="flex-shrink-0">
              <Button 
                type="submit" 
                className="h-8 text-xs px-3 rounded-l-none"
                size="sm"
              >
                {t("subscribe_button")}
              </Button>
            </div>
          </div>
        </div>        {/* Mobile layout: description above, input below */}
        <div className="lg:hidden space-y-2">
          <p className="text-xs text-center text-muted-foreground/80">
            {t("subscribe_short_desc")}
          </p>
          <div className="flex items-center gap-1">
            <div className="flex-1">
              <Input
                type="email"
                placeholder={t("email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!session?.user?.email}
                required
                className="h-8 text-xs rounded-r-none"
              />
            </div>
            <div className="flex-shrink-0">
              <Button 
                type="submit" 
                className="h-8 text-xs px-3 rounded-l-none"
                size="sm"
              >
                {t("subscribe_button")}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
