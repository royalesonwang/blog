"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Turnstile } from "@marsidev/react-turnstile";

interface SubscribeFormProps {
  className?: string;
}

const CONTENT_OPTIONS = [
  { value: "Knowledge", key: "knowledge" },
  { value: "Life", key: "life" },
  { value: "Academic", key: "academic" },
  { value: "Album", key: "album" },
];

export default function SubscribeForm({ className = "" }: SubscribeFormProps) {
  const { data: session } = useSession();
  const t = useTranslations("subscribe");
  
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedContent, setSelectedContent] = useState<string[]>(["Knowledge", "Life", "Academic", "Album"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const turnstileRef = useRef<any>(null);

  // 如果用户已登录，自动填入邮箱
  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  const handleContentChange = (value: string, checked: boolean) => {
    if (checked) {
      setSelectedContent(prev => [...prev, value]);
    } else {
      setSelectedContent(prev => prev.filter(item => item !== value));
    }
  };
  const validateForm = () => {
    if (!email.trim()) {
      toast.error(t("email_required"));
      return false;
    }
    
    if (!name.trim()) {
      toast.error(t("name_required"));
      return false;
    }
    
    if (selectedContent.length === 0) {
      toast.error(t("content_required"));
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t("invalid_email"));
      return false;
    }
      if (!turnstileToken) {
      toast.error(t("captcha_required"));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          content: selectedContent,
          turnstileToken: turnstileToken,
        }),
      });

      const result = await response.json();      if (result.success) {
        // 新订阅或重新激活的订阅都当作成功处理
        toast.success(t("success_message"));        // 重置表单
        if (!session?.user?.email) {
          setEmail("");
          setName("");
        }
        setSelectedContent(["Knowledge", "Life", "Academic", "Album"]);
        setTurnstileToken("");
        // 重置 Turnstile
        if (turnstileRef.current) {
          turnstileRef.current.reset();
        }      } else {
        toast.error(result.message || t("error_message"));
        // 重置 Turnstile 以允许重试
        setTurnstileToken("");
        if (turnstileRef.current) {
          turnstileRef.current.reset();
        }
      }
    } catch (error) {
      console.error("Subscribe error:", error);
      toast.error(t("error_message"));
      // 重置 Turnstile 以允许重试
      setTurnstileToken("");
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4 text-center lg:text-left">
        <h3 className="text-lg font-semibold text-foreground mb-2 lg:text-right sm:text-center">
          {t("title")}
        </h3>
        <p className="text-sm text-muted-foreground lg:text-right sm:text-center">
          {t("description")}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">        {/* Desktop layout: everything in one row */}
        <div className="hidden lg:flex lg:items-start lg:gap-4">
          <div className="flex-1 min-w-0">
            <Label htmlFor="subscribe-name-desktop" className="text-xs block mb-1">
              {t("name_placeholder").replace("您的", "").replace("Your ", "")} *
            </Label>
            <Input
              id="subscribe-name-desktop"
              type="text"
              placeholder={t("name_placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm"
              required
            />
          </div>
          <div className="flex-1 min-w-0">
            <Label htmlFor="subscribe-email-desktop" className="text-xs block mb-1">
              {t("email_placeholder").replace("您的", "").replace("Your ", "")} *
            </Label>
            <Input
              id="subscribe-email-desktop"
              type="email"
              placeholder={t("email_placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!session?.user?.email}
              required
              className="h-8 text-sm"
            />
          </div>          <div className="flex-1 min-w-0">
            <Label className="text-xs block mb-1">{t("content_label")}</Label>
            <div className="flex flex-wrap items-center gap-2 min-h-[32px]">
              {CONTENT_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-1">
                  <Checkbox
                    id={`content-desktop-${option.value}`}
                    checked={selectedContent.includes(option.value)}
                    onCheckedChange={(checked: boolean) => 
                      handleContentChange(option.value, checked)
                    }
                    className="h-3 w-3"
                  />
                  <Label 
                    htmlFor={`content-desktop-${option.value}`} 
                    className="text-xs font-normal cursor-pointer"
                  >
                    {t(option.key)}
                  </Label>
                </div>
              ))}
            </div>
          </div>          <div className="flex-shrink-0 self-center">
            <Button 
              type="submit" 
              disabled={isSubmitting || selectedContent.length === 0 || !turnstileToken}
              className="h-8 text-sm px-6"
              size="sm"
            >
              {isSubmitting ? t("subscribing") : t("subscribe_button")}
            </Button>
          </div>
        </div>        {/* Turnstile for desktop */}
        <div className="hidden lg:flex justify-center">
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
            onSuccess={(token) => setTurnstileToken(token)}
            onError={() => setTurnstileToken("")}
            onExpire={() => setTurnstileToken("")}
            options={{
              theme: "auto",
              size: "normal"
            }}
          />
        </div>

        {/* Mobile layout: stacked */}
        <div className="lg:hidden space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="subscribe-name-mobile" className="text-xs">
                {t("name_placeholder").replace("您的", "").replace("Your ", "")} *
              </Label>
              <Input
                id="subscribe-name-mobile"
                type="text"
                placeholder={t("name_placeholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-sm"
                required
              />
            </div>
            <div>
              <Label htmlFor="subscribe-email-mobile" className="text-xs">
                {t("email_placeholder").replace("您的", "").replace("Your ", "")} *
              </Label>
              <Input
                id="subscribe-email-mobile"
                type="email"
                placeholder={t("email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!session?.user?.email}
                required
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs mb-2 block">{t("content_label")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`content-mobile-${option.value}`}
                    checked={selectedContent.includes(option.value)}
                    onCheckedChange={(checked: boolean) => 
                      handleContentChange(option.value, checked)
                    }
                    className="h-4 w-4"
                  />
                  <Label 
                    htmlFor={`content-mobile-${option.value}`} 
                    className="text-xs font-normal cursor-pointer"
                  >
                    {t(option.key)}
                  </Label>
                </div>
              ))}
            </div>          </div>

          {/* Turnstile for mobile */}
          <div className="flex justify-center">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken("")}
              onExpire={() => setTurnstileToken("")}
              options={{
                theme: "auto",
                size: "compact"
              }}
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || selectedContent.length === 0 || !turnstileToken}
            className="w-full h-8 text-sm"
            size="sm"
          >
            {isSubmitting ? t("subscribing") : t("subscribe_button")}
          </Button>
        </div>
      </form>
    </div>
  );
}
