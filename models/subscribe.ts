import { Subscribe } from "@/types/subscribe";
import { getSupabaseClient } from "./db";

export enum SubscribeStatus {
  Pending = "pending",
  Active = "active",
  Inactive = "inactive",
  Deleted = "deleted",
}

export enum SubscribePlan {
  Free = "free",
  Premium = "premium",
}

// 生成UUID的辅助函数
export function generateUUID(): string {
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, function(c) {
    const r = Math.random() * 16 | 0;
    return r.toString(16);
  });
}

export async function insertSubscribe(subscribe: Subscribe) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("subscribe").insert({
    name: subscribe.name,
    email: subscribe.email,
    content: subscribe.content.join(','),
    status: subscribe.status || SubscribeStatus.Pending, // 默认为pending状态
    plan: subscribe.plan || SubscribePlan.Free,
    created_at: new Date().toISOString(),
    uuid: subscribe.uuid || generateUUID()
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function findSubscribeByEmail(
  email: string
): Promise<Subscribe | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("subscribe")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    return undefined;
  }

  // 将content字符串转换为数组
  if (data && data.content) {
    data.content = data.content.split(',');
  }

  return data;
}

/**
 * 根据UUID查找订阅信息
 */
export async function findSubscribeByUUID(
  uuid: string
): Promise<Subscribe | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("subscribe")
    .select("*")
    .eq("uuid", uuid)
    .single();

  if (error) {
    return undefined;
  }

  // 将content字符串转换为数组
  if (data && data.content) {
    data.content = data.content.split(',');
  }

  return data;
}

export async function updateSubscribeContent(
  email: string,
  content: string[]
): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  // 首先获取现有订阅，检查是否有UUID
  const { data: existingSubscribe } = await supabase
    .from("subscribe")
    .select("uuid")
    .eq("email", email)
    .single();
  
  // 如果没有UUID，生成一个新的
  const uuid = existingSubscribe?.uuid || generateUUID();
  
  const { error } = await supabase
    .from("subscribe")
    .update({
      content: content.join(','),
      status: SubscribeStatus.Active, // 重新激活订阅
      updated_at: new Date().toISOString(),
      uuid: uuid // 确保更新时有UUID
    })
    .eq("email", email);

  return !error;
}

export async function getAllSubscribes(
  page: number = 1,
  limit: number = 50
): Promise<Subscribe[]> {
  if (page < 1) page = 1;
  if (limit <= 0) limit = 50;

  const offset = (page - 1) * limit;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("subscribe")
    .select("*")
    .eq("status", SubscribeStatus.Active)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // 将content字符串转换为数组
  return data.map(item => ({
    ...item,
    content: item.content ? item.content.split(',') : []
  }));
}

/**
 * 根据文章类型获取已订阅该类型的活跃用户
 * @param contentType 文章类型
 * @returns 订阅用户列表
 */
export async function findActiveSubscribersByContentType(
  contentType: string
): Promise<Subscribe[]> {
  const supabase = getSupabaseClient();
    // 查询状态为 active 的所有订阅者
  console.log(`正在查询订阅了 ${contentType} 类型内容的活跃用户...`);
  // 使用更简单但更健壮的查询方式
  // 先获取所有活跃用户，然后在客户端进行过滤，避免复杂的SQL查询导致的语法错误
  const { data, error } = await supabase
    .from("subscribe")
    .select("*")
    .eq("status", SubscribeStatus.Active);

  if (error) {
    console.error("Error finding subscribers by content type:", error);
    return [];
  }

  console.log(`数据库中查询到 ${data?.length || 0} 个可能匹配的订阅者`);
  
  // 将content字符串转换为数组，并进行额外的客户端过滤以确保精确匹配
  const filteredSubscribers = (data || [])
    .map(subscribe => {      // 将content字符串转换为数组
      const contentArray = subscribe.content ? subscribe.content.split(',').map((item: string) => item.trim()) : [];
      console.log(`订阅者 ${subscribe.email} 的订阅内容类型: [${contentArray.join(', ')}]`);
      return {
        ...subscribe,
        content: contentArray
      };    })
    .filter(subscribe => {
      // 进一步确认内容类型完全匹配，使用严格比较确保精确匹配
      const hasMatchingType = subscribe.content.some((type: string) => type === contentType);
      if (!hasMatchingType) {
        console.log(`✗ 订阅者 ${subscribe.email} 没有准确匹配内容类型 "${contentType}"`);
      } else {
        console.log(`✓ 找到订阅者 ${subscribe.email}，已订阅 "${contentType}" 类型`);
      }
      return hasMatchingType;
    });
    
  console.log(`过滤后剩余 ${filteredSubscribers.length} 个匹配的订阅者`);
  
  return filteredSubscribers;
}

/**
 * 激活订阅并重新生成UUID
 * @param uuid 当前的UUID
 * @returns 激活后的新UUID
 */
export async function activateSubscription(uuid: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  
  // 首先检查订阅是否存在且为pending状态
  const { data: existingSubscribe } = await supabase
    .from("subscribe")
    .select("*")
    .eq("uuid", uuid)
    .eq("status", SubscribeStatus.Pending)
    .single();

  if (!existingSubscribe) {
    return null; // 订阅不存在或已激活
  }

  // 生成新的UUID
  const newUUID = generateUUID();
  
  const { error } = await supabase
    .from("subscribe")
    .update({
      status: SubscribeStatus.Active,
      uuid: newUUID,
      updated_at: new Date().toISOString()
    })
    .eq("uuid", uuid);

  if (error) {
    console.error("Error activating subscription:", error);
    return null;
  }

  return newUUID;
}

/**
 * 检查邮箱是否有待激活的订阅
 * @param email 邮箱地址
 * @returns 是否有待激活的订阅
 */
export async function hasPendingSubscription(email: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("subscribe")
    .select("id")
    .eq("email", email)
    .eq("status", SubscribeStatus.Pending)
    .single();

  return !error && data !== null;
}
