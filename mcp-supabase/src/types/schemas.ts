import { z } from "zod";

// ============================================================
// SHARED BASE SCHEMA — user_id e company_id são OBRIGATÓRIOS
// em TODOS os tools deste MCP.
// ============================================================
export const BaseSchema = z.object({
  user_id: z
    .string()
    .uuid("user_id deve ser um UUID válido")
    .describe("UUID do usuário autenticado (obrigatório em todas as operações)"),
  company_id: z
    .string()
    .uuid("company_id deve ser um UUID válido")
    .describe("UUID da empresa (obrigatório em todas as operações)"),
});

// ============================================================
// UTILITY: valida user_id e company_id e retorna erro padronizado
// Use esta função no início de cada tool handler.
// ============================================================
export function validateBaseParams(params: {
  user_id: string;
  company_id: string;
}): { valid: true } | { valid: false; error: object } {
  const result = BaseSchema.safeParse(params);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return {
      valid: false,
      error: {
        success: false,
        error: "VALIDATION_ERROR",
        message: "Parâmetros obrigatórios inválidos ou ausentes",
        details: errors,
      },
    };
  }

  return { valid: true };
}

// ============================================================
// EDGE FUNCTION SCHEMAS
// Estenda o BaseSchema para cada edge function.
// Exemplo: ExampleEdgeFunctionSchema = BaseSchema.extend({ ... })
// ============================================================

// Placeholder — substitua pelo schema real da sua edge function
export const ExampleEdgeFunctionSchema = BaseSchema.extend({
  // Adicione os parâmetros específicos da edge function aqui
  // param1: z.string().describe("Descrição do parâmetro"),
});

// ============================================================
// RPC SCHEMAS
// Estenda o BaseSchema para cada função RPC.
// ============================================================

// -------------------------------------------------------
// RPC: public.get_won_deals_reports_summary_v3
// Retorna o resumo de negócios ganhos/perdidos da empresa.
// Obs: user_id aqui é OPCIONAL na assinatura da função
// Supabase, mas OBRIGATÓRIO no MCP para rastreabilidade.
// -------------------------------------------------------
export const GetWonDealsSummarySchema = BaseSchema.extend({
  date_start: z
    .string()
    .datetime({ offset: true })
    .optional()
    .describe(
      "Data de início do filtro (ISO 8601 com timezone, ex: 2024-01-01T00:00:00-03:00). Opcional."
    ),
  date_end: z
    .string()
    .datetime({ offset: true })
    .optional()
    .describe(
      "Data de fim do filtro (ISO 8601 com timezone, ex: 2024-12-31T23:59:59-03:00). Opcional."
    ),
});

// Tipo do retorno da RPC get_won_deals_reports_summary_v3
export interface WonDealsSummaryRow {
  total_deals: number;
  total_lost: number;
  total_won: number;
  avg_days_to_win: string;
  total_revenue_won: string;
  total_revenue_forecast: string;
  total_revenue_lost: string;
}

// ============================================================
// TIPOS UTILITÁRIOS
// ============================================================
export type BaseParams = z.infer<typeof BaseSchema>;
export type GetWonDealsSummaryParams = z.infer<typeof GetWonDealsSummarySchema>;

// ============================================================
// TABLE QUERY SCHEMAS
// Todos herdam BaseSchema (user_id + company_id obrigatórios)
// e compartilham parâmetros de paginação.
// ============================================================

/** Parâmetros de paginação reutilizáveis */
const PaginationSchema = {
  limit: z
    .number()
    .int()
    .min(1)
    .max(500)
    .default(100)
    .describe("Quantidade máxima de registros a retornar (padrão: 100, máx: 500)"),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Deslocamento para paginação (padrão: 0)"),
};

// -------------------------------------------------------
// TABLE: public.users
// Colunas: id, created_at, updated_at, name, email,
//          role, status, company_id, is_ia
// -------------------------------------------------------
export interface UserRow {
  id: string;
  created_at: string;
  updated_at: string | null;
  name: string | null;
  email: string | null;
  role: number | null;
  status: boolean | null;
  company_id: string | null;
  is_ia: boolean | null;
}

export const ListUsersSchema = BaseSchema.extend({
  ...PaginationSchema,
  order_by: z
    .enum(["name", "email", "created_at", "updated_at", "role", "status"])
    .default("name")
    .describe(
      "Campo para ordenação. Opções: name, email, created_at, updated_at, role, status"
    ),
  ascending: z
    .boolean()
    .default(true)
    .describe("Ordenar de forma crescente (true) ou decrescente (false)"),
  status_filter: z
    .boolean()
    .optional()
    .describe("Filtrar por status: true = ativos, false = inativos. Omitir para retornar todos"),
  is_ia: z
    .boolean()
    .optional()
    .describe("Filtrar por usuários IA: true = apenas IAs, false = apenas humanos. Omitir para todos"),
});

// -------------------------------------------------------
// TABLE: public.pipelines
// Colunas: id, name, status, settings, company_id,
//          created_at, won_stage
// -------------------------------------------------------
export interface PipelineRow {
  id: string;
  name: string | null;
  status: boolean | null;
  settings: Record<string, unknown> | null;
  company_id: string | null;
  created_at: string;
  won_stage: boolean;
}

export const ListPipelinesSchema = BaseSchema.extend({
  ...PaginationSchema,
  order_by: z
    .enum(["name", "created_at", "status"])
    .default("name")
    .describe(
      "Campo para ordenação. Opções: name, created_at, status"
    ),
  ascending: z
    .boolean()
    .default(true)
    .describe("Ordenar de forma crescente (true) ou decrescente (false)"),
  status_filter: z
    .boolean()
    .optional()
    .describe("Filtrar por status: true = ativos, false = inativos. Omitir para retornar todos"),
});

// -------------------------------------------------------
// TABLE: public.sources
// Colunas: id, name, status, company_id
// Nota: sources NÃO tem created_at no schema atual
// -------------------------------------------------------
export interface SourceRow {
  id: string;
  name: string | null;
  status: boolean | null;
  company_id: string | null;
}

export const ListSourcesSchema = BaseSchema.extend({
  ...PaginationSchema,
  order_by: z
    .enum(["name", "status"])
    .default("name")
    .describe(
      "Campo para ordenação. Opções: name, status. " +
      "Nota: a tabela sources não possui coluna created_at"
    ),
  ascending: z
    .boolean()
    .default(true)
    .describe("Ordenar de forma crescente (true) ou decrescente (false)"),
  status_filter: z
    .boolean()
    .optional()
    .describe("Filtrar por status: true = ativas, false = inativas. Omitir para retornar todas"),
});

// -------------------------------------------------------
// TABLE: public.campaigns
// Colunas: id, name, status, company_id
// Nota: campaigns NÃO tem created_at no schema atual
// -------------------------------------------------------
export interface CampaignRow {
  id: string;
  name: string | null;
  status: boolean | null;
  company_id: string | null;
}

export const ListCampaignsSchema = BaseSchema.extend({
  ...PaginationSchema,
  order_by: z
    .enum(["name", "status"])
    .default("name")
    .describe(
      "Campo para ordenação. Opções: name, status. " +
      "Nota: a tabela campaigns não possui coluna created_at"
    ),
  ascending: z
    .boolean()
    .default(true)
    .describe("Ordenar de forma crescente (true) ou decrescente (false)"),
  status_filter: z
    .boolean()
    .optional()
    .describe("Filtrar por status: true = ativas, false = inativas. Omitir para retornar todas"),
});

