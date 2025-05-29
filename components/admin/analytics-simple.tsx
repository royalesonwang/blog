"use client";

export default function AnalyticsSimple() {
  return (
    <div className="w-full overflow-hidden rounded-lg border">
    <iframe 
        width="100%" 
        height="800" 
        src="https://lookerstudio.google.com/embed/reporting/c375e48e-ad73-47ab-9088-e8f5ce7f8e00/page/kIV1C" 
        frameBorder="0" 
        style={{ border: 0 }} 
        allowFullScreen
        sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        className="w-full"
    />
    </div>
  );
}
