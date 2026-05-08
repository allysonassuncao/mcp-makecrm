import { z } from "zod";

// ============================================================
// SHARED BASE SCHEMA — company_id é OBRIGATÓRIO.
// user_id é OPCIONAL (UUID válido se informado).
// ============================================================
export const BaseSchema = z.object({
  user_id: z
    .string()
    .uuid("user_id deve ser um UUID válido")
    .optional()
    .describe("UUID do usuário autenticado (opcional)"),
  company_id: z
    .string()
    .uuid("company_id deve ser um UUID válido")
    .describe("UUID da empresa (obrigatório em todas as operações)"),
});

// ============================================================
// UTILITY: valida company_id (obrigatório) e user_id (opcional)
// e retorna erro padronizado.
// Use esta função no início de cada tool handler.
// ============================================================
export function validateBaseParams(params: {
  user_id?: string;
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

// -------------------------------------------------------
// RPC: public.get_lost_deals_reports_summary
// Retorna o resumo de negócios perdidos da empresa.
// -------------------------------------------------------
export const GetLostDealsSummarySchema = BaseSchema.extend({
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

export interface LostDealsSummaryRow {
  total_deals: number;
  total_lost: number;
  total_won: number;
  avg_days_to_loss: string;
  total_revenue_lost: string;
  total_revenue_forecast: string;
  total_revenue_won: string;
}

// -------------------------------------------------------
// RPC: public.get_won_deals_reports_graphic_v3
// Retorna dados para gráficos de negócios ganhos (fontes, campanhas, produtos).
// -------------------------------------------------------
export const GetWonDealsGraphicSchema = BaseSchema.extend({
  start_date: z
    .string()
    .describe("Data de início do filtro (YYYY-MM-DD). Opcional.")
    .optional(),
  end_date: z
    .string()
    .describe("Data de fim do filtro (YYYY-MM-DD). Opcional.")
    .optional(),
});

export interface WonDealsGraphicRow {
  sources: { label: string; value: number }[];
  campaigns: { label: string; value: number }[];
  products: { label: string; value: number }[];
}

// -------------------------------------------------------
// RPC: public.get_lost_deals_reports_graphic
// Retorna dados para gráficos de negócios perdidos (fontes, campanhas, motivos).
// -------------------------------------------------------
export const GetLostDealsGraphicSchema = BaseSchema.extend({
  start_date: z
    .string()
    .describe("Data de início do filtro (ISO 8601 ou YYYY-MM-DD). Opcional.")
    .optional(),
  end_date: z
    .string()
    .describe("Data de fim do filtro (ISO 8601 ou YYYY-MM-DD). Opcional.")
    .optional(),
});

export interface LostDealsGraphicRow {
  sources: { label: string; value: number }[];
  campaigns: { label: string; value: number }[];
  reasons: { label: string; value: number }[];
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

// -------------------------------------------------------
// TABLE: public.roles
// Colunas: id, name, status
// Nota: roles NÃO tem company_id, mas a query vai considerar apenas isso no db?
// Ops, base schema requer company_id. Se for um cadastro global, não envia company_id?
// Pelo BaseSchema, company_id é obrigatório.
// -------------------------------------------------------
export interface RoleRow {
  id: number;
  name: string | null;
  status: boolean | null;
}

export const ListRolesSchema = BaseSchema.extend({
  ...PaginationSchema,
  order_by: z
    .enum(["id", "name", "status"])
    .default("name")
    .describe("Campo para ordenação. Opções: id, name, status"),
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
// TABLE: public.lost_reasons
// Colunas: id, company_id, name, status, created_at
// -------------------------------------------------------
export interface LostReasonRow {
  id: string;
  company_id: string | null;
  name: string | null;
  status: boolean | null;
  created_at: string;
}

export const ListLostReasonsSchema = BaseSchema.extend({
  ...PaginationSchema,
  order_by: z
    .enum(["name", "created_at", "status"])
    .default("name")
    .describe("Campo para ordenação. Opções: name, created_at, status"),
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
// TABLE: public.noshow_reasons
// Colunas: id, company_id, name, status, created_at
// -------------------------------------------------------
export interface NoshowReasonRow {
  id: string;
  company_id: string;
  name: string;
  status: boolean;
  created_at: string;
}

export const ListNoshowReasonsSchema = BaseSchema.extend({
  ...PaginationSchema,
  order_by: z
    .enum(["name", "created_at", "status"])
    .default("name")
    .describe("Campo para ordenação. Opções: name, created_at, status"),
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
// TABLE: public.pipeline_deal_meets
// Colunas: id, bot_id, deal_id, user_id, type, title, event_id, created_at, start, end, status, attendees, link, description
// -------------------------------------------------------
export interface PipelineDealMeetRow {
  id: string;
  bot_id: string | null;
  deal_id: string | null;
  user_id: string | null;
  type: string | null;
  title: string | null;
  event_id: string | null;
  created_at: string;
  start: string | null;
  end: string | null;
  status: boolean | null;
  attendees: any[] | null;
  link: string | null;
  description: string | null;
}

export const ListPipelineDealMeetsSchema = BaseSchema.extend({
  ...PaginationSchema,
  order_by: z
    .enum(["title", "created_at", "start", "end", "status"])
    .default("created_at")
    .describe("Campo para ordenação. Opções: title, created_at, start, end, status"),
  ascending: z
    .boolean()
    .default(false)
    .describe("Ordenar de forma crescente (true) ou decrescente (false)"),
  status_filter: z
    .boolean()
    .optional()
    .describe("Filtrar por status: true = ativas, false = inativas. Omitir para retornar todas"),
  deal_id: z.string().uuid().optional().describe("Filtrar por deal_id específico"),
  user_id_filter: z.string().uuid().optional().describe("Filtrar por user_id específico"),
});

// -------------------------------------------------------
// TABLE: public.pipeline_deal_losts
// Colunas: id, deal_id, reason_id, description, created_at
// -------------------------------------------------------
export interface PipelineDealLostRow {
  id: number;
  deal_id: string | null;
  reason_id: string | null;
  description: string | null;
  created_at: string;
}

export const ListPipelineDealLostsSchema = BaseSchema.extend({
  ...PaginationSchema,
  order_by: z
    .enum(["id", "created_at"])
    .default("created_at")
    .describe("Campo para ordenação. Opções: id, created_at"),
  ascending: z
    .boolean()
    .default(false)
    .describe("Ordenar de forma crescente (true) ou decrescente (false)"),
  deal_id: z.string().uuid().optional().describe("Filtrar por deal_id específico"),
  reason_id: z.string().uuid().optional().describe("Filtrar por reason_id específico"),
});

// -------------------------------------------------------
// TABLE: public.pipeline_deal_meet_noshow
// Colunas: id, meet_id, user_id, reason_id, description, created_at
// -------------------------------------------------------
export interface PipelineDealMeetNoshowRow {
  id: number;
  meet_id: string;
  user_id: string;
  reason_id: string;
  description: string | null;
  created_at: string;
}

export const ListPipelineDealMeetNoshowSchema = BaseSchema.extend({
  ...PaginationSchema,
  order_by: z
    .enum(["id", "created_at"])
    .default("created_at")
    .describe("Campo para ordenação. Opções: id, created_at"),
  ascending: z
    .boolean()
    .default(false)
    .describe("Ordenar de forma crescente (true) ou decrescente (false)"),
  meet_id: z.string().uuid().optional().describe("Filtrar por meet_id específico"),
});

// -------------------------------------------------------
// TABLE: public.pipeline_deal_utms
// Colunas: id, company_id, deal_id, utm_id, utm_term, utm_medium, utm_source, utm_content, utm_campaign, created_at
// -------------------------------------------------------
export interface PipelineDealUtmRow {
  id: number;
  company_id: string | null;
  deal_id: string | null;
  utm_id: string | null;
  utm_term: string | null;
  utm_medium: string | null;
  utm_source: string | null;
  utm_content: string | null;
  utm_campaign: string | null;
  created_at: string;
}

export const ListPipelineDealUtmsSchema = BaseSchema.extend({
  ...PaginationSchema,
  order_by: z
    .enum(["id", "created_at", "utm_source", "utm_medium", "utm_campaign"])
    .default("created_at")
    .describe("Campo para ordenação. Opções: id, created_at, utm_source, utm_medium, utm_campaign"),
  ascending: z
    .boolean()
    .default(false)
    .describe("Ordenar de forma crescente (true) ou decrescente (false)"),
  deal_id: z.string().uuid().optional().describe("Filtrar por deal_id específico"),
});

// -------------------------------------------------------
// TABLE: public.pipeline_deal_quotes
// Colunas: id, deal_id, product_id, quoted_price, closed_price, user_id, created_at, updated_at, currency
// -------------------------------------------------------
export interface PipelineDealQuoteRow {
  id: string;
  deal_id: string | null;
  product_id: string | null;
  quoted_price: number | null;
  closed_price: number | null;
  user_id: string | null;
  created_at: string;
  updated_at: string | null;
  currency: number;
}

export const ListPipelineDealQuotesSchema = BaseSchema.extend({
  ...PaginationSchema,
  order_by: z
    .enum(["created_at", "updated_at", "quoted_price", "closed_price"])
    .default("created_at")
    .describe("Campo para ordenação. Opções: created_at, updated_at, quoted_price, closed_price"),
  ascending: z
    .boolean()
    .default(false)
    .describe("Ordenar de forma crescente (true) ou decrescente (false)"),
  deal_id: z.string().uuid().optional().describe("Filtrar por deal_id específico"),
  user_id_filter: z.string().uuid().optional().describe("Filtrar por user_id (vendedor) específico"),
});

// -------------------------------------------------------
// TABLE: public.pipeline_deal_quote_payments
// Colunas: id, quote_id, value, created_at, currency
// -------------------------------------------------------
export interface PipelineDealQuotePaymentRow {
  id: string;
  quote_id: string;
  value: number;
  created_at: string;
  currency: number;
}

export const ListPipelineDealQuotePaymentsSchema = BaseSchema.extend({
  ...PaginationSchema,
  order_by: z
    .enum(["created_at", "value"])
    .default("created_at")
    .describe("Campo para ordenação. Opções: created_at, value"),
  ascending: z
    .boolean()
    .default(false)
    .describe("Ordenar de forma crescente (true) ou decrescente (false)"),
  quote_id: z.string().uuid().optional().describe("Filtrar por quote_id específico"),
});

// -------------------------------------------------------
// TABLE: public.currencys
// Colunas: id, code, symbol, name
// -------------------------------------------------------
export interface CurrencyRow {
  id: number;
  code: string;
  symbol: string;
  name: string;
}

export const ListCurrencysSchema = BaseSchema.extend({
  ...PaginationSchema,
  order_by: z
    .enum(["id", "code", "name"])
    .default("code")
    .describe("Campo para ordenação. Opções: id, code, name"),
  ascending: z
    .boolean()
    .default(true)
    .describe("Ordenar de forma crescente (true) ou decrescente (false)"),
});
