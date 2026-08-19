import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  validateBaseParams,
  GetWonDealsSummarySchema,
  GetWonDealsGraphicSchema,
  GetLostDealsSummarySchema,
  GetLostDealsGraphicSchema,
  GetUtmDealsSummarySchema,
  GetNoShowDealsSummarySchema,
  GetNoShowDealsGraphicSchema,
  GetPipelineDealsSearchV2Schema,
  GetContactFullContextSchema,
  GetInboxesUnreadCountsSchema,
  GetPipelineMeetsFilteredSchema,
  GetPipelineDealsMeetSearchSchema,
  GetInboxWebphoneCallsSchema,
  GetConversationReportsSchema,
  ReportsRevenueDetailsSchema,
  GetWonDealsReportsByUserSchema,
  GetLostDealsReportsDetailsSchema,
  GetNoshowDealsReportsDetailsSchema,
  GetFunnelDealsReportsSchema,
  GetUtmUniqueCountsSchema,
  GetUtmsSchema,
  GetDealsByUtmSchema,
  GetDealsWonByUtmSchema
} from "../types/schemas.js";
import { logger } from "../utils/logger.js";
import { stripTimezones } from "../utils/formatters.js";

function mapPipelineSearchParams(params: any) {
  const rpcArgs: any = {};
  const mappings: Record<string, string> = {
    pipeline_id: "p_pipeline_id",
    name: "p_name",
    pipeline_stage_id: "p_pipeline_stage_id",
    pipeline_deal_id: "p_pipeline_deal_id",
    pipeline_deal_status: "p_pipeline_deal_status",
    pipeline_deal_user_id: "p_pipeline_deal_user_id",
    pipeline_deal_sdr_id: "p_pipeline_deal_sdr_id",
    pipeline_deal_closer_id: "p_pipeline_deal_closer_id",
    pipeline_deal_source_id: "p_pipeline_deal_source_id",
    pipeline_deal_campaign_id: "p_pipeline_deal_campaign_id",
    pipeline_deal_value_min: "p_pipeline_deal_value_min",
    pipeline_deal_value_max: "p_pipeline_deal_value_max",
    pipeline_deal_created_at_start: "p_pipeline_deal_created_at_start",
    pipeline_deal_created_at_end: "p_pipeline_deal_created_at_end",
    pipeline_deal_probability: "p_pipeline_deal_probability",
    pipeline_deal_products: "p_pipeline_deal_products",
    pipeline_deal_activities: "p_pipeline_deal_activities",
    pipeline_deal_utm_source: "p_pipeline_deal_utm_source",
    pipeline_deal_utm_medium: "p_pipeline_deal_utm_medium",
    pipeline_deal_utm_campaign: "p_pipeline_deal_utm_campaign",
    pipeline_deal_utm_id: "p_pipeline_deal_utm_id",
    pipeline_deal_utm_term: "p_pipeline_deal_utm_term",
    pipeline_deal_utm_content: "p_pipeline_deal_utm_content",
    pipeline_deal_custom: "p_pipeline_deal_custom",
    page: "p_page",
    limit: "p_limit",
    sort_by: "p_sort_by",
    sort_order: "p_sort_order",
    // Funnel specific
    stages_select: "p_stages_select",
    status: "p_status",
    sdr_id: "p_sdr_id",
    closer_id: "p_closer_id",
    source_id: "p_source_id",
    campaign_id: "p_campaign_id",
    products_id: "p_products_id",
    value_min: "p_value_min",
    value_max: "p_value_max",
    created_at_start: "p_created_at_start",
    created_at_end: "p_created_at_end",
    utm_source: "p_utm_source",
    utm_medium: "p_utm_medium",
    utm_campaign: "p_utm_campaign",
    utm_id: "p_utm_id",
    utm_term: "p_utm_term",
    utm_content: "p_utm_content",
    custom_field: "p_custom_field",
    inbox_id: "p_inbox_id",
  };
  for (const [key, rpcKey] of Object.entries(mappings)) {
    const val = (params as any)[key];
    if (val !== undefined && val !== null && val !== "") {
      rpcArgs[rpcKey] = val;
    }
  }
  return rpcArgs;
}

// Helper genérico para prefixar p_
const prefixP = (params: any) => {
  const rpcArgs: any = {};
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "") {
      rpcArgs[`p_${key}`] = val;
    }
  }
  return rpcArgs;
};

// Helper genérico para tools RPC simples
function createSimpleRpcTool(
  server: McpServer,
  supabase: SupabaseClient,
  toolName: string,
  description: string,
  schema: any,
  paramMapper?: (params: any) => any,
  rpcName?: string
) {
  server.tool(
    toolName,
    description,
    schema.shape,
    async (params: any) => {
      logger.info(`🚀 Executando tool: ${toolName}`, params);
      const validation = validateBaseParams(params);
      if (!validation.valid) {
        logger.warn(`⚠️ Validação falhou para ${toolName}`, validation.error);
        return { content: [{ type: "text" as const, text: JSON.stringify(validation.error) }], isError: true };
      }

      params = stripTimezones(params);

      try {
        const rpcArgs = paramMapper ? paramMapper(params) : params;
        logger.info(`📡 Enviando para o Supabase (RPC ${rpcName || toolName}):`, rpcArgs);
        const { data, error } = await supabase.rpc(rpcName || toolName, rpcArgs);
        if (error) throw new Error(error.message);
        logger.info(`✅ Sucesso na execução de ${toolName}`);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error(`❌ Erro na execução de ${toolName}`, error);
        return { content: [{ type: "text" as const, text: (error as Error).message }], isError: true };
      }
    }
  );
}

export function registerRpcTools(server: McpServer, supabase: SupabaseClient) {
  // ==========================================
  // MÓDULO 1: CONTATOS E CAIXA DE ENTRADA
  // ==========================================

  createSimpleRpcTool(server, supabase, "get_contact_full_context_v2", "Busca o contexto proativo e completo de um contato", GetContactFullContextSchema, prefixP);

  createSimpleRpcTool(server, supabase, "get_inboxes_unread_counts", "Retorna a volumetria de mensagens não lidas agrupada por caixa", GetInboxesUnreadCountsSchema, prefixP);

  // ==========================================
  // MÓDULO 2: PIPELINE E OPORTUNIDADES
  // ==========================================

  server.tool(
    "get_pipeline_deals_search_v2",
    "Busca avançada de negócios com múltiplos filtros e paginação (v2).",
    GetPipelineDealsSearchV2Schema.shape,
    async (params: any) => {
      logger.info(`🚀 Executando tool: get_pipeline_deals_search_v2`, params);
      const validation = validateBaseParams(params);
      if (!validation.valid) {
        logger.warn(`⚠️ Validação falhou para get_pipeline_deals_search_v2`, validation.error);
        return { content: [{ type: "text" as const, text: JSON.stringify(validation.error) }], isError: true };
      }
      params = stripTimezones(params);
      try {
        const rpcArgs = mapPipelineSearchParams(params);
        logger.info(`📡 Enviando para o Supabase (RPC get_pipeline_deals_search_v2):`, rpcArgs);
        const { data, error } = await supabase.rpc("get_pipeline_deals_search_v2", rpcArgs);
        if (error) throw new Error(error.message);
        logger.info(`✅ Sucesso na execução de get_pipeline_deals_search_v2`);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error(`❌ Erro na execução de get_pipeline_deals_search_v2`, error);
        return { content: [{ type: "text" as const, text: (error as Error).message }], isError: true };
      }
    }
  );

  server.tool(
    "get_pipeline_deals_page_v7",
    "Busca as oportunidades com paginação e vasta gama de filtros (v7).",
    GetPipelineDealsSearchV2Schema.shape,
    async (params: any) => {
      logger.info(`🚀 Executando tool: get_pipeline_deals_page_v7`, params);
      const validation = validateBaseParams(params);
      if (!validation.valid) {
        logger.warn(`⚠️ Validação falhou para get_pipeline_deals_page_v7`, validation.error);
        return { content: [{ type: "text" as const, text: JSON.stringify(validation.error) }], isError: true };
      }
      params = stripTimezones(params);
      try {
        const rpcArgs = mapPipelineSearchParams(params);
        logger.info(`📡 Enviando para o Supabase (RPC get_pipeline_deals_page_v7):`, rpcArgs);
        const { data, error } = await supabase.rpc("get_pipeline_deals_page_v7", rpcArgs);
        if (error) throw new Error(error.message);
        logger.info(`✅ Sucesso na execução de get_pipeline_deals_page_v7`);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error(`❌ Erro na execução de get_pipeline_deals_page_v7`, error);
        return { content: [{ type: "text" as const, text: (error as Error).message }], isError: true };
      }
    }
  );

  server.tool(
    "get_pipeline_deals_totals_v7",
    "Calcula totais financeiros e contagem de cartões por etapa do pipeline.",
    GetPipelineDealsSearchV2Schema.shape,
    async (params: any) => {
      logger.info(`🚀 Executando tool: get_pipeline_deals_totals_v7`, params);
      const validation = validateBaseParams(params);
      if (!validation.valid) {
        logger.warn(`⚠️ Validação falhou para get_pipeline_deals_totals_v7`, validation.error);
        return { content: [{ type: "text" as const, text: JSON.stringify(validation.error) }], isError: true };
      }
      params = stripTimezones(params);
      try {
        const rpcArgs = mapPipelineSearchParams(params);
        // Exclui page/limit dos totais
        delete rpcArgs.p_page;
        delete rpcArgs.p_limit;
        logger.info(`📡 Enviando para o Supabase (RPC get_pipeline_deals_totals_v7):`, rpcArgs);
        const { data, error } = await supabase.rpc("get_pipeline_deals_totals_v7", rpcArgs);
        if (error) throw new Error(error.message);
        logger.info(`✅ Sucesso na execução de get_pipeline_deals_totals_v7`);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error(`❌ Erro na execução de get_pipeline_deals_totals_v7`, error);
        return { content: [{ type: "text" as const, text: (error as Error).message }], isError: true };
      }
    }
  );

  server.tool(
    "export_pipeline_deals",
    "Gera carga linear de oportunidades para exportação.",
    GetPipelineDealsSearchV2Schema.shape,
    async (params: any) => {
      logger.info(`🚀 Executando tool: export_pipeline_deals`, params);
      const validation = validateBaseParams(params);
      if (!validation.valid) {
        logger.warn(`⚠️ Validação falhou para export_pipeline_deals`, validation.error);
        return { content: [{ type: "text" as const, text: JSON.stringify(validation.error) }], isError: true };
      }
      params = stripTimezones(params);
      try {
        const rpcArgs = mapPipelineSearchParams(params);
        rpcArgs.p_company_id = params.company_id;
        rpcArgs.p_user_id = params.user_id;
        delete rpcArgs.p_page; // não usa paginação page
        logger.info(`📡 Enviando para o Supabase (RPC export_pipeline_deals):`, rpcArgs);
        const { data, error } = await supabase.rpc("export_pipeline_deals", rpcArgs);
        if (error) throw new Error(error.message);
        logger.info(`✅ Sucesso na execução de export_pipeline_deals`);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error(`❌ Erro na execução de export_pipeline_deals`, error);
        return { content: [{ type: "text" as const, text: (error as Error).message }], isError: true };
      }
    }
  );

  // ==========================================
  // MÓDULO 3: REUNIÕES E ATIVIDADES
  // ==========================================

  createSimpleRpcTool(server, supabase, "get_pipeline_meets_filtered", "Retorna reuniões filtradas vinculadas ao pipeline", GetPipelineMeetsFilteredSchema, (p) => ({
    user_id_input: p.user_id,
    user_email_input: p.user_email,
    company_id_input: p.company_id,
    date_start_input: p.date_start,
  }));
  
  createSimpleRpcTool(server, supabase, "get_pipeline_deals_meet_search_v1", "Traz base de reuniões consolidada com dados de negócios", GetPipelineDealsMeetSearchSchema, (p) => {
    const args = mapPipelineSearchParams(p);
    if (p.owner_meet) args.p_owner_meet = p.owner_meet;
    if (p.attendees_meet) args.p_attendees_meet = p.attendees_meet;
    if (p.noshow_reason) args.p_noshow_reason = p.noshow_reason;
    return args;
  });

  createSimpleRpcTool(server, supabase, "get_inbox_webphone_calls_v4", "Busca logs de ligações efetuadas/recebidas", GetInboxWebphoneCallsSchema, prefixP);

  // ==========================================
  // MÓDULO 4: RELATÓRIOS (WON, LOST, NOSHOW, ETC)
  // ==========================================

  createSimpleRpcTool(server, supabase, "get_conversation_repports", "Métricas de atendimentos (TMA, TME)", GetConversationReportsSchema, prefixP);
  
  createSimpleRpcTool(server, supabase, "reports_revenue_details_v4", "Detalhamento financeiro da receita", ReportsRevenueDetailsSchema, (p) => ({
    in_company_id: p.company_id,
    in_date_start: p.date_start,
    in_date_end: p.date_end,
    in_user_id: p.user_id,
  }));
  
  createSimpleRpcTool(server, supabase, "get_won_deals_reports_summary_v4", "Retorna resumo de negócios ganhos v4", GetWonDealsSummarySchema); // mantem params normais
  createSimpleRpcTool(server, supabase, "get_won_deals_reports_by_user", "Ranking de vendedores/receita gerada", GetWonDealsReportsByUserSchema); // mantem params normais
  
  // Gráficos usam start_date e end_date ao inves de date_start
  createSimpleRpcTool(server, supabase, "get_won_deals_reports_graphic_v3", "Dados de gráficos para negócios ganhos", GetWonDealsGraphicSchema, (p) => ({
    company_id: p.company_id,
    user_id: p.user_id,
    start_date: p.date_start, // schema receives date_start, mapped to start_date
    end_date: p.date_end
  }));

  createSimpleRpcTool(server, supabase, "get_lost_deals_reports_summary", "Resumo de relatórios de negócios perdidos", GetLostDealsSummarySchema);
  createSimpleRpcTool(server, supabase, "get_lost_deals_reports_details", "Lista cada negócio perdido e motivo", GetLostDealsReportsDetailsSchema);
  createSimpleRpcTool(server, supabase, "get_lost_deals_reports_graphic", "Gráficos de negócios perdidos", GetLostDealsGraphicSchema, (p) => ({
    company_id: p.company_id,
    user_id: p.user_id,
    start_date: p.date_start,
    end_date: p.date_end
  }));

  createSimpleRpcTool(server, supabase, "get_noshow_deals_reports_summary", "Resumo de no-shows", GetNoShowDealsSummarySchema);
  createSimpleRpcTool(server, supabase, "get_noshow_deals_reports_details", "Lista cada no-show detalhado", GetNoshowDealsReportsDetailsSchema);
  createSimpleRpcTool(server, supabase, "get_noshow_deals_reports_graphics", "Gráficos de no-shows", GetNoShowDealsGraphicSchema, (p) => ({
    company_id: p.company_id,
    user_id: p.user_id,
    start_date: p.date_start,
    end_date: p.date_end
  }));

  createSimpleRpcTool(server, supabase, "get_funnel_deals_reports_v2", "Taxas de conversão do funil do pipeline", GetFunnelDealsReportsSchema, mapPipelineSearchParams);

  // ==========================================
  // MÓDULO 5: UTMs
  // ==========================================

  createSimpleRpcTool(server, supabase, "get_utm_unique_counts", "Contabiliza total de UTMs únicas", GetUtmUniqueCountsSchema); // (assumindo param normais sem p_ para uniqueness ou o q quer q seja. n documentado, vou manter sem p_ pra n quebrar as padronizadas)
  createSimpleRpcTool(server, supabase, "get_utms_v1", "Lista valores UTM agrupados", GetUtmsSchema, (p) => {
    const args: any = { p_company_id: p.company_id };
    if (p.date_start !== undefined) args.date_start = p.date_start;
    if (p.date_end !== undefined) args.date_end = p.date_end;
    return args;
  });
  createSimpleRpcTool(server, supabase, "get_deals_by_utm_v1", "Volumetria de leads gerados por UTM", GetDealsByUtmSchema); // Param exatos do doc
  createSimpleRpcTool(server, supabase, "get_deals_won_by_utm_v1", "Conversão de vendas e receita originada por UTM", GetDealsWonByUtmSchema); // Param exatos

  // ----------------------------------------------------------
  // RPC: get_utm_deals_reports_summary (existente customizado)
  // ----------------------------------------------------------
  server.tool(
    "get_utm_deals_reports_summary",
    "Retorna o histórico de UTMs capturados nos negócios.",
    GetUtmDealsSummarySchema.shape,
    async (params: any) => {
      logger.info(`🚀 Executando tool: get_utm_deals_reports_summary`, params);
      const validation = validateBaseParams(params);
      if (!validation.valid) {
        logger.warn(`⚠️ Validação falhou para get_utm_deals_reports_summary`, validation.error);
        return { content: [{ type: "text" as const, text: JSON.stringify(validation.error) }], isError: true };
      }

      params = stripTimezones(params);

      try {
        const rpcArgs: any = {
          company_id: params.company_id,
          date_start: params.date_start,
          date_end: params.date_end,
        };

        const optionalParams = ["page", "limit", "deal_id", "utm_id", "utm_term", "utm_medium", "utm_source", "utm_content", "utm_campaign"];
        for (const key of optionalParams) {
          const val = (params as any)[key];
          if (val !== undefined && val !== null && val !== "") {
            rpcArgs[key] = val;
          }
        }

        logger.info(`📡 Enviando para o Supabase (RPC get_utm_deals_reports_summary):`, rpcArgs);
        const { data, error } = await supabase.rpc("get_utm_deals_reports_summary", rpcArgs);

        if (error) throw new Error(error.message);
        logger.info(`✅ Sucesso na execução de get_utm_deals_reports_summary`);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error(`❌ Erro na execução de get_utm_deals_reports_summary`, error);
        return { content: [{ type: "text" as const, text: (error as Error).message }], isError: true };
      }
    }
  );
}
