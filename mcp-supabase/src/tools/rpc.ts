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
  GetConversationAndUserDataSchema,
  GetConversationsListSchema,
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

function mapPipelineSearchParams(params: any) {
  const rpcArgs: any = {
    p_company_id: params.company_id, // ensure company_id is mapped if required by some functions
    company_id: params.company_id, // keep original as fallback
  };
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
  };
  for (const [key, rpcKey] of Object.entries(mappings)) {
    const val = (params as any)[key];
    if (val !== undefined && val !== null && val !== "") {
      rpcArgs[rpcKey] = val;
    }
  }
  return rpcArgs;
}

// Helper genérico para tools RPC simples
function createSimpleRpcTool(server: McpServer, supabase: SupabaseClient, toolName: string, description: string, schema: any, rpcName?: string) {
  server.tool(
    toolName,
    description,
    schema.shape,
    async (params: any) => {
      logger.info(`🚀 Executando tool: ${toolName}`, params);
      const validation = validateBaseParams(params);
      if (!validation.valid) {
        logger.warn(`⚠️ Validação falhou para ${toolName}`, validation.error);
        return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };
      }

      try {
        const { data, error } = await supabase.rpc(rpcName || toolName, params);
        if (error) throw new Error(error.message);
        logger.info(`✅ Sucesso na execução de ${toolName}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error(`❌ Erro na execução de ${toolName}`, error);
        return { content: [{ type: "text", text: (error as Error).message }], isError: true };
      }
    }
  );
}

export function registerRpcTools(server: McpServer, supabase: SupabaseClient) {
  // ==========================================
  // MÓDULO 1: CONTATOS E CAIXA DE ENTRADA
  // ==========================================
  
  createSimpleRpcTool(server, supabase, "get_contact_full_context_v2", "Busca o contexto proativo e completo de um contato", GetContactFullContextSchema);
  createSimpleRpcTool(server, supabase, "get_conversation_and_user_data", "Valida a conversa e o usuário trazendo status da caixa de entrada", GetConversationAndUserDataSchema);
  createSimpleRpcTool(server, supabase, "get_conversations_list_v3", "Lista paginada de conversas com suporte a buscas de texto e filtros", GetConversationsListSchema);
  createSimpleRpcTool(server, supabase, "get_inboxes_unread_counts", "Retorna a volumetria de mensagens não lidas agrupada por caixa", GetInboxesUnreadCountsSchema);

  // ==========================================
  // MÓDULO 2: PIPELINE E OPORTUNIDADES
  // ==========================================

  server.tool(
    "get_pipeline_deals_search_v2",
    "Busca avançada de negócios com múltiplos filtros e paginação (v2).",
    GetPipelineDealsSearchV2Schema.shape,
    async (params) => {
      logger.info(`🚀 Executando tool: get_pipeline_deals_search_v2`, params);
      const validation = validateBaseParams(params);
      if (!validation.valid) {
        logger.warn(`⚠️ Validação falhou para get_pipeline_deals_search_v2`, validation.error);
        return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };
      }
      try {
        const rpcArgs = mapPipelineSearchParams(params);
        const { data, error } = await supabase.rpc("get_pipeline_deals_search_v2", rpcArgs);
        if (error) throw new Error(error.message);
        logger.info(`✅ Sucesso na execução de get_pipeline_deals_search_v2`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error(`❌ Erro na execução de get_pipeline_deals_search_v2`, error);
        return { content: [{ type: "text", text: (error as Error).message }], isError: true };
      }
    }
  );

  server.tool(
    "get_pipeline_deals_page_v7",
    "Busca as oportunidades com paginação e vasta gama de filtros (v7).",
    GetPipelineDealsSearchV2Schema.shape,
    async (params) => {
      logger.info(`🚀 Executando tool: get_pipeline_deals_page_v7`, params);
      const validation = validateBaseParams(params);
      if (!validation.valid) {
        logger.warn(`⚠️ Validação falhou para get_pipeline_deals_page_v7`, validation.error);
        return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };
      }
      try {
        const rpcArgs = mapPipelineSearchParams(params);
        const { data, error } = await supabase.rpc("get_pipeline_deals_page_v7", rpcArgs);
        if (error) throw new Error(error.message);
        logger.info(`✅ Sucesso na execução de get_pipeline_deals_page_v7`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error(`❌ Erro na execução de get_pipeline_deals_page_v7`, error);
        return { content: [{ type: "text", text: (error as Error).message }], isError: true };
      }
    }
  );

  server.tool(
    "get_pipeline_deals_totals_v7",
    "Calcula totais financeiros e contagem de cartões por etapa do pipeline.",
    GetPipelineDealsSearchV2Schema.shape,
    async (params) => {
      logger.info(`🚀 Executando tool: get_pipeline_deals_totals_v7`, params);
      const validation = validateBaseParams(params);
      if (!validation.valid) {
        logger.warn(`⚠️ Validação falhou para get_pipeline_deals_totals_v7`, validation.error);
        return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };
      }
      try {
        const rpcArgs = mapPipelineSearchParams(params);
        // Exclui page/limit dos totais
        delete rpcArgs.p_page;
        delete rpcArgs.p_limit;
        const { data, error } = await supabase.rpc("get_pipeline_deals_totals_v7", rpcArgs);
        if (error) throw new Error(error.message);
        logger.info(`✅ Sucesso na execução de get_pipeline_deals_totals_v7`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error(`❌ Erro na execução de get_pipeline_deals_totals_v7`, error);
        return { content: [{ type: "text", text: (error as Error).message }], isError: true };
      }
    }
  );

  server.tool(
    "export_pipeline_deals",
    "Gera carga linear de oportunidades para exportação.",
    GetPipelineDealsSearchV2Schema.shape,
    async (params) => {
      logger.info(`🚀 Executando tool: export_pipeline_deals`, params);
      const validation = validateBaseParams(params);
      if (!validation.valid) {
        logger.warn(`⚠️ Validação falhou para export_pipeline_deals`, validation.error);
        return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };
      }
      try {
        const rpcArgs = mapPipelineSearchParams(params);
        const { data, error } = await supabase.rpc("export_pipeline_deals", rpcArgs);
        if (error) throw new Error(error.message);
        logger.info(`✅ Sucesso na execução de export_pipeline_deals`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error(`❌ Erro na execução de export_pipeline_deals`, error);
        return { content: [{ type: "text", text: (error as Error).message }], isError: true };
      }
    }
  );

  // ==========================================
  // MÓDULO 3: REUNIÕES E ATIVIDADES
  // ==========================================
  
  createSimpleRpcTool(server, supabase, "get_pipeline_meets_filtered", "Retorna reuniões filtradas vinculadas ao pipeline", GetPipelineMeetsFilteredSchema);
  createSimpleRpcTool(server, supabase, "get_pipeline_deals_meet_search_v1", "Traz base de reuniões consolidada com dados de negócios", GetPipelineDealsMeetSearchSchema);
  createSimpleRpcTool(server, supabase, "get_inbox_webphone_calls_v4", "Busca logs de ligações efetuadas/recebidas", GetInboxWebphoneCallsSchema);

  // ==========================================
  // MÓDULO 4: RELATÓRIOS (WON, LOST, NOSHOW, ETC)
  // ==========================================

  createSimpleRpcTool(server, supabase, "get_conversation_repports", "Métricas de atendimentos (TMA, TME)", GetConversationReportsSchema);
  createSimpleRpcTool(server, supabase, "reports_revenue_details_v4", "Detalhamento financeiro da receita", ReportsRevenueDetailsSchema);
  
  // Atualizado para v4
  createSimpleRpcTool(server, supabase, "get_won_deals_reports_summary_v4", "Retorna resumo de negócios ganhos v4", GetWonDealsSummarySchema);
  
  createSimpleRpcTool(server, supabase, "get_won_deals_reports_by_user", "Ranking de vendedores/receita gerada", GetWonDealsReportsByUserSchema);
  
  // O graphic_v3 já existia, registramos usando helper
  createSimpleRpcTool(server, supabase, "get_won_deals_reports_graphic_v3", "Dados de gráficos para negócios ganhos", GetWonDealsGraphicSchema);

  createSimpleRpcTool(server, supabase, "get_lost_deals_reports_summary", "Resumo de relatórios de negócios perdidos", GetLostDealsSummarySchema);
  createSimpleRpcTool(server, supabase, "get_lost_deals_reports_details", "Lista cada negócio perdido e motivo", GetLostDealsReportsDetailsSchema);
  createSimpleRpcTool(server, supabase, "get_lost_deals_reports_graphic", "Gráficos de negócios perdidos", GetLostDealsGraphicSchema);

  createSimpleRpcTool(server, supabase, "get_noshow_deals_reports_summary", "Resumo de no-shows", GetNoShowDealsSummarySchema);
  createSimpleRpcTool(server, supabase, "get_noshow_deals_reports_details", "Lista cada no-show detalhado", GetNoshowDealsReportsDetailsSchema);
  createSimpleRpcTool(server, supabase, "get_noshow_deals_reports_graphics", "Gráficos de no-shows", GetNoShowDealsGraphicSchema);

  createSimpleRpcTool(server, supabase, "get_funnel_deals_reports_v2", "Taxas de conversão do funil do pipeline", GetFunnelDealsReportsSchema);

  // ==========================================
  // MÓDULO 5: UTMs
  // ==========================================

  createSimpleRpcTool(server, supabase, "get_utm_unique_counts", "Contabiliza total de UTMs únicas", GetUtmUniqueCountsSchema);
  createSimpleRpcTool(server, supabase, "get_utms_v1", "Lista valores UTM agrupados", GetUtmsSchema);
  createSimpleRpcTool(server, supabase, "get_deals_by_utm_v1", "Volumetria de leads gerados por UTM", GetDealsByUtmSchema);
  createSimpleRpcTool(server, supabase, "get_deals_won_by_utm_v1", "Conversão de vendas e receita originada por UTM", GetDealsWonByUtmSchema);

  // ----------------------------------------------------------
  // RPC: get_utm_deals_reports_summary (existente customizado)
  // ----------------------------------------------------------
  server.tool(
    "get_utm_deals_reports_summary",
    "Retorna o histórico de UTMs capturados nos negócios.",
    GetUtmDealsSummarySchema.shape,
    async (params) => {
      logger.info(`🚀 Executando tool: get_utm_deals_reports_summary`, params);
      const validation = validateBaseParams(params);
      if (!validation.valid) {
        logger.warn(`⚠️ Validação falhou para get_utm_deals_reports_summary`, validation.error);
        return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };
      }

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

        const { data, error } = await supabase.rpc("get_utm_deals_reports_summary", rpcArgs);

        if (error) throw new Error(error.message);
        logger.info(`✅ Sucesso na execução de get_utm_deals_reports_summary`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error(`❌ Erro na execução de get_utm_deals_reports_summary`, error);
        return { content: [{ type: "text", text: (error as Error).message }], isError: true };
      }
    }
  );
}
