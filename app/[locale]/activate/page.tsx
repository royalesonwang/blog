'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface ActivationResult {
  success: boolean;
  message: string;
}

export default function ActivatePage() {
  const [result, setResult] = useState<ActivationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const uuid = searchParams.get('uuid');
  const t = useTranslations('activate');

  useEffect(() => {
    const handleActivation = async () => {
      if (!uuid) {
        setResult({
          success: false,
          message: t('error_missing_uuid')
        });
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/activate?uuid=${encodeURIComponent(uuid)}`, {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          setResult({
            success: true,
            message: data.message || t('success_message')
          });
        } else {
          const data = await response.json();
          setResult({
            success: false,
            message: data.message || t('error_invalid_link')
          });
        }
      } catch (error) {
        setResult({
          success: false,
          message: t('error_network')
        });
      } finally {
        setLoading(false);
      }
    };

    handleActivation();
  }, [uuid, t]);
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">{t('processing')}</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-card rounded-lg shadow-lg p-8 text-center">
          {result?.success ? (
            <>
              <div className="text-6xl mb-6">🎉</div>
              <h1 className="text-2xl font-bold text-green-600 mb-4">{t('success_title')}</h1>
              <p className="text-muted-foreground mb-6">
                {t('success_description')}
              </p>
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <p className="text-green-700 dark:text-green-300 text-sm">
                  ✅ {result.message}
                </p>
              </div>
              <div className="space-y-3">
                <a
                  href="/"
                  className="block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors"
                >
                  {t('go_to_blog')}
                </a>
              </div>
            </>          ) : (
            <>
              <div className="text-6xl mb-6">❌</div>
              <h1 className="text-2xl font-bold text-red-600 mb-4">{t('error_title')}</h1>
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-700 dark:text-red-300 text-sm">
                  {result?.message || t('error_unknown')}
                </p>
              </div>
              <div className="space-y-3">
                <a
                  href="/"
                  className="block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {t('back_home')}
                </a>
                <button
                  onClick={() => window.location.reload()}
                  className="block w-full bg-muted text-muted-foreground px-6 py-3 rounded-md hover:bg-muted/80 transition-colors"
                >
                  {t('retry')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
