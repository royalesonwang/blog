import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || "";

  let supabaseKey = process.env.SUPABASE_ANON_KEY || "";
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase configuration missing", { 
      urlProvided: !!supabaseUrl, 
      keyProvided: !!supabaseKey 
    });
    
    // 在开发环境下提供更详细的错误信息
    if (process.env.NODE_ENV === 'development') {
      console.error("请配置Supabase环境变量:");
      console.error("1. 复制 .env.example 到 .env.local");
      console.error("2. 在 .env.local 中配置 SUPABASE_URL 和 SUPABASE_ANON_KEY");
      console.error("3. 如果您还没有Supabase项目，请访问: https://supabase.com");
    }
    
    throw new Error("Supabase URL or key is not set");
  }

  try {
    console.log("Creating Supabase client with URL:", supabaseUrl.substring(0, 10) + "...");
    const client = createClient(supabaseUrl, supabaseKey);
    return client;
  } catch (error) {
    console.error("Failed to create Supabase client:", error);
    throw new Error("Failed to create Supabase client");
  }
}
