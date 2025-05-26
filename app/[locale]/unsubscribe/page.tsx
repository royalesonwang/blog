'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface UnsubscribeResult {
  success: boolean;
  message: string;
  email?: string;
}

export default function UnsubscribePage() {  const [result, setResult] = useState<UnsubscribeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const uuid = searchParams.get('uuid');
  const t = useTranslations('unsubscribe');

  useEffect(() => {
    const handleUnsubscribe = async () => {      if (!uuid) {
        setResult({
          success: false,
          message: t('error_missing_uuid')
        });
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/subscribe/unsubscribe?uuid=${encodeURIComponent(uuid)}`, {
          method: 'GET',
        });        if (response.ok) {
          const data = await response.json();
          setResult({
            success: true,
            message: t('success_message'),
            email: data.email // 从API响应中获取邮箱地址
          });
        } else {
          const data = await response.json();
          setResult({
            success: false,
            message: data.message || t('error_unknown')
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
    };    handleUnsubscribe();
  }, [uuid, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('processing')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {result?.success ? (
            <>
              <div className="text-6xl mb-6">✅</div>
              <h1 className="text-2xl font-bold text-blue-600 mb-4">{t('success_title')}</h1>
              <p className="text-gray-600 mb-4">您已成功取消订阅。</p>
              {result.email && (
                <div className="bg-gray-100 p-3 rounded-md mb-4">
                  <span className="font-medium">{result.email}</span>
                </div>
              )}              <p className="text-gray-600 mb-6">
                {t('success_description')}
              </p>
              <div className="space-y-3">
                <a
                  href="/"
                  className="block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"                >
                  {t('back_home')}
                </a>
                <a
                  href="/#subscribe"
                  className="block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors"
                >
                  {t('resubscribe')}
                </a>
              </div>
            </>
          ) : (
            <>
              <div className="text-6xl mb-6">❌</div>              <h1 className="text-2xl font-bold text-red-600 mb-4">{t('error_title')}</h1>
              <p className="text-gray-600 mb-6">{result?.message || t('error_unknown')}</p>
              <div className="space-y-3">
                <a
                  href="/"
                  className="block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"                >
                  {t('back_home')}
                </a>
                <button
                  onClick={() => window.location.reload()}
                  className="block w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 transition-colors"
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
