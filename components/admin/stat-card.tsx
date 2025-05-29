"use client";

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: string;
}

export default function StatCard({ title, value, description, trend, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 text-xl">{icon}</span>
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <span className={`text-sm font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}
          </span>
          <span className="text-sm text-gray-500 ml-1">与上期对比</span>
        </div>
      )}
    </div>
  );
}
