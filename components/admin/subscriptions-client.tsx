"use client";

import { useState, useEffect } from "react";
import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import SubscriptionActions from "@/components/admin/subscription-actions";
import moment from "moment";

interface SubscriptionData {
  id: number;
  email: string;
  name: string;
  content: string[];
  status: string;
  plan: string;
  created_at: string;
  updated_at?: string;
}

interface StatsData {
  total: number;
  active: number;
  pending: number;
  inactive: number;
  byContent: Record<string, number>;
  byPlan: Record<string, number>;
  recentSubscriptions: number;
}

interface SubscriptionsClientProps {
  initialSubscriptions?: SubscriptionData[];
  initialStats?: StatsData;
}

export default function SubscriptionsClient({ 
  initialSubscriptions = [], 
  initialStats = {
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
    byContent: {},
    byPlan: {},
    recentSubscriptions: 0
  }
}: SubscriptionsClientProps) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>(initialSubscriptions);
  const [stats, setStats] = useState<StatsData>(initialStats);
  const [loading, setLoading] = useState(false);

  // 初始化时加载数据
  useEffect(() => {
    if (initialSubscriptions.length === 0) {
      refreshData();
    }
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [subscriptionsRes, statsRes] = await Promise.all([
        fetch('/api/admin/subscriptions'),
        fetch('/api/admin/subscriptions/stats')
      ]);

      if (subscriptionsRes.ok && statsRes.ok) {
        const subscriptionsData = await subscriptionsRes.json();
        const statsData = await statsRes.json();
        
        setSubscriptions(subscriptionsData.data || []);
        setStats(statsData.data || initialStats);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn[] = [
    { name: "email", title: "邮箱" },
    { name: "name", title: "姓名" },
    {
      name: "content",
      title: "订阅内容",
      callback: (row: SubscriptionData) => {
        const contentLabels: { [key: string]: string } = {
          'Knowledge': '知识',
          'Life': '生活',
          'Academic': '学术',
          'Album': '相册'
        };
        
        if (Array.isArray(row.content)) {
          return row.content.map(item => contentLabels[item] || item).join(', ');
        }
        return row.content;
      },
    },
    {
      name: "status",
      title: "状态",
      callback: (row: SubscriptionData) => {        const statusLabels: { [key: string]: string } = {
          'pending': '待激活',
          'active': '已激活',
          'inactive': '未激活',
        };
        
        const status = row.status || 'pending';
        const label = statusLabels[status] || status;
        
        const colorClass = {
          'pending': 'text-yellow-600 bg-yellow-100',
          'active': 'text-green-600 bg-green-100',
          'inactive': 'text-red-600 bg-red-100',
        }[status] || 'text-gray-600 bg-gray-100';
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {label}
          </span>
        );
      },
    },
    {
      name: "plan",
      title: "计划",
      callback: (row: SubscriptionData) => {
        const planLabels: { [key: string]: string } = {
          'free': '免费',
          'premium': '高级'
        };
        
        const plan = row.plan || 'free';
        const label = planLabels[plan] || plan;
        
        const colorClass = plan === 'premium' 
          ? 'text-purple-600 bg-purple-100' 
          : 'text-blue-600 bg-blue-100';
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {label}
          </span>
        );
      },
    },
    {
      name: "created_at",
      title: "订阅时间",
      callback: (row: SubscriptionData) => moment(row.created_at).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      name: "updated_at",
      title: "更新时间",
      callback: (row: SubscriptionData) => {
        if (row.updated_at) {
          return moment(row.updated_at).format("YYYY-MM-DD HH:mm:ss");
        }
        return "-";
      },
    },
    {
      name: "actions",
      title: "操作",
      callback: (row: SubscriptionData) => (
        <SubscriptionActions subscription={row} onUpdate={refreshData} />
      ),
    },
  ];

  const table: TableSlotType = {
    title: "订阅用户管理",
    description: "查看和管理所有订阅用户的信息",
    columns,
    data: subscriptions,
    empty_message: "暂无订阅用户",
  };

  return (
    <div>
      {/* 用户列表 */}
      <TableSlot {...table} />
    </div>
  );
}
