import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Cliente Singleton (Fallback para Stdio / Env)
 */
let instance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!instance) {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados no .env");
    }
    instance = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return instance;
}

/**
 * Cria um cliente dinâmico baseado em credenciais externas (Postman / Headers)
 */
export function createDynamicSupabaseClient(apiKey: string, authHeader?: string): SupabaseClient {
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL não configurada no servidor.");
  }

  return createClient(supabaseUrl, apiKey, {
    auth: { persistSession: false },
    global: {
      headers: authHeader ? { Authorization: authHeader } : undefined,
    },
  });
}

/**
 * Helper genérico para query (Aceita um cliente específico)
 */
export async function queryTable(
  supabase: SupabaseClient,
  tableName: string,
  companyId: string,
  options: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    ascending?: boolean;
  } = {}
) {
  const { limit = 100, offset = 0, orderBy = "id", ascending = true } = options;

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("company_id", companyId)
    .order(orderBy, { ascending })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}
