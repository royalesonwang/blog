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
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-foreground whitespace-nowrap">Subscribe my blog</h3>
          <div className="flex gap-0 flex-1">            
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
