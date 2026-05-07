import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// SUPABASE CLIENT — usa service_role_key para acesso total
// ============================================================

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "❌ Variáveis de ambiente ausentes: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias."
    );
  }

  _client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _client;
}

// ============================================================
// INVOCAR EDGE FUNCTION
// ============================================================
export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  payload: Record<string, unknown>
): Promise<T> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.functions.invoke<T>(functionName, {
    body: payload,
  });

  if (error) {
    throw new Error(
      `Edge function "${functionName}" falhou: ${error.message}`
    );
  }

  return data as T;
}

// ============================================================
// CHAMAR FUNÇÃO RPC
// ============================================================
export async function callRpc<T = unknown>(
  rpcName: string,
  params: Record<string, unknown>
): Promise<T> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc(rpcName, params);

  if (error) {
    throw new Error(`RPC "${rpcName}" falhou: ${error.message}`);
  }

  return data as T;
}

// ============================================================
// CONSULTAR TABELA DIRETAMENTE (SELECT + filtro company_id)
// ============================================================
export interface QueryTableOptions {
  columns?: string;   // ex: "id, name, email" — padrão: "*"
  limit?: number;     // padrão: 100
  offset?: number;    // padrão: 0
  orderBy?: string;   // ex: "created_at"
  ascending?: boolean;
}

export async function queryTable<T = unknown>(
  tableName: string,
  companyId: string,
  options: QueryTableOptions = {}
): Promise<T[]> {
  const supabase = getSupabaseClient();

  const {
    columns = "*",
    limit = 100,
    offset = 0,
    orderBy,
    ascending = true,
  } = options;

  let query = supabase
    .from(tableName)
    .select(columns)
    .eq("company_id", companyId)
    .range(offset, offset + limit - 1);

  if (orderBy) {
    query = query.order(orderBy, { ascending });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Consulta na tabela "${tableName}" falhou: ${error.message}`
    );
  }

  return (data ?? []) as T[];
}
