"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionActionsProps {
  subscription: {
    id: number;
    email: string;
    status: string;
    uuid?: string;
  };
  onUpdate?: () => void;
}

export default function SubscriptionActions({ subscription, onUpdate }: SubscriptionActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/subscriptions/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: subscription.id,
          status: newStatus,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('状态更新成功');
        onUpdate?.();
      } else {
        toast.error(result.message || '状态更新失败');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('状态更新失败');
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!confirm('确定要将此订阅设为不活跃状态吗？')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/subscriptions/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: subscription.id,
        }),
      });

      const result = await response.json();
        if (result.success) {
        toast.success('订阅已设为不活跃状态');
        onUpdate?.();
      } else {
        toast.error(result.message || '操作失败');
      }    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const canActivate = subscription.status === 'pending';
  const canDeactivate = subscription.status === 'active';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canActivate && (
          <DropdownMenuItem onClick={() => handleStatusChange('active')}>
            激活订阅
          </DropdownMenuItem>
        )}
        {canDeactivate && (
          <DropdownMenuItem onClick={() => handleStatusChange('inactive')}>
            停用订阅
          </DropdownMenuItem>
        )}
        {subscription.status === 'inactive' && (
          <DropdownMenuItem onClick={() => handleStatusChange('active')}>
            重新激活
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
