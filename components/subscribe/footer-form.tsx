"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import SubscriptionModal from "./subscription-modal";

interface FooterSubscribeFormProps {
  className?: string;
}

export default function FooterSubscribeForm({ className = "" }: FooterSubscribeFormProps) {
  const { data: session } = useSession();
  const t = useTranslations("subscribe");
  
  const [email, setEmail] = useState(session?.user?.email || "");
  const [showModal, setShowModal] = useState(false);

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
    }    // 打开订阅模态窗口，传递邮箱
    setShowModal(true);
  };
  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* 移动端布局：标题在上方 */}
        <div className="md:hidden">
          <h3 className="text-sm text-center mb-3">Subscribe my Blog</h3>
          <div className="flex justify-center">
            <div className="w-52">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("enter_email")}
                className="h-8 text-xs rounded-r-none outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-input focus-visible:ring-0 focus-visible:ring-offset-0"
                required
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs px-3 rounded-l-none"
            >
              {t("subscribe")}
            </Button>
          </div>
        </div>

        {/* 桌面端布局：标题与输入框平齐 */}
        <div className="hidden md:flex items-center">
          <div className="flex justify-center flex-1 w-full">
            <h3 className="text-sm p-2">Subscribe my Blog</h3>         
            <div className="w-52">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("enter_email")}
                className="h-8 text-xs rounded-r-none outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-input focus-visible:ring-0 focus-visible:ring-offset-0"
                required
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs px-3 rounded-l-none"
            >
              {t("subscribe")}
            </Button>
          </div>
        </div>
      </form>

      {/* 订阅模态窗口 */}
      <SubscriptionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        initialEmail={email}
      />
    </div>
  );
}
