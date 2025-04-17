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
