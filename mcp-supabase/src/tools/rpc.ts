import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SupabaseClient } from "@supabase/supabase-js";
import { validateBaseParams, GetWonDealsSummarySchema, GetWonDealsGraphicSchema, GetLostDealsSummarySchema, GetLostDealsGraphicSchema, GetUtmDealsSummarySchema, GetNoShowDealsSummarySchema, GetNoShowDealsGraphicSchema, GetPipelineDealsSearchV2Schema } from "../types/schemas.js";

export function registerRpcTools(server: McpServer, supabase: SupabaseClient) {
  // ----------------------------------------------------------
  // RPC: get_pipeline_deals_search_v2
  // ----------------------------------------------------------
  server.tool(
    "get_pipeline_deals_search_v2",
    "Busca avançada de negócios com múltiplos filtros e paginação.",
    GetPipelineDealsSearchV2Schema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const rpcArgs: any = {};
        
        // Mapeamento de nomes de parâmetros do schema para a procedure (prefixo p_)
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

        const { data, error } = await supabase.rpc("get_pipeline_deals_search_v2", rpcArgs);

        if (error) throw new Error(error.message);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: (error as Error).message }], isError: true };
      }
    }
  );

  // ----------------------------------------------------------
  // RPC: get_won_deals_reports_summary
  // ----------------------------------------------------------
  server.tool(
    "get_won_deals_reports_summary",
    "Retorna um resumo de relatórios de negócios ganhos.",
    GetWonDealsSummarySchema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const { data, error } = await supabase.rpc("get_won_deals_reports_summary_v3", {
          company_id: params.company_id,
          date_start: params.date_start,
          date_end: params.date_end,
          user_id: params.user_id,
        });

        if (error) throw new Error(error.message);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: (error as Error).message }], isError: true };
      }
    }
  );

  // ----------------------------------------------------------
  // RPC: get_lost_deals_reports_summary
  // ----------------------------------------------------------
  server.tool(
    "get_lost_deals_reports_summary",
    "Retorna um resumo de relatórios de negócios perdidos.",
    GetLostDealsSummarySchema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const { data, error } = await supabase.rpc("get_lost_deals_reports_summary", {
          company_id: params.company_id,
          date_start: params.date_start,
          date_end: params.date_end,
          user_id: params.user_id,
        });

        if (error) throw new Error(error.message);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: (error as Error).message }], isError: true };
      }
    }
  );

  // ----------------------------------------------------------
  // RPC: get_noshow_deals_reports_summary
  // ----------------------------------------------------------
  server.tool(
    "get_noshow_deals_reports_summary",
    "Retorna um resumo de relatórios de no-shows (faltas em reuniões).",
    GetNoShowDealsSummarySchema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const { data, error } = await supabase.rpc("get_noshow_deals_reports_summary", {
          company_id: params.company_id,
          date_start: params.date_start,
          date_end: params.date_end,
          user_id: params.user_id,
        });

        if (error) throw new Error(error.message);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: (error as Error).message }], isError: true };
      }
    }
  );

  // ----------------------------------------------------------
  // RPC: get_won_deals_reports_graphic
  // ----------------------------------------------------------
  server.tool(
    "get_won_deals_reports_graphic",
    "Retorna dados consolidados para gráficos de negócios ganhos (Fontes, Campanhas e Produtos).",
    GetWonDealsGraphicSchema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const { data, error } = await supabase.rpc("get_won_deals_reports_graphic_v3", {
          company_id: params.company_id,
          start_date: params.start_date,
          end_date: params.end_date,
          user_id: params.user_id,
        });

        if (error) throw new Error(error.message);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: (error as Error).message }], isError: true };
      }
    }
  );

  // ----------------------------------------------------------
  // RPC: get_lost_deals_reports_graphic
  // ----------------------------------------------------------
  server.tool(
    "get_lost_deals_reports_graphic",
    "Retorna dados consolidados para gráficos de negócios perdidos (Fontes, Campanhas e Motivos).",
    GetLostDealsGraphicSchema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const { data, error } = await supabase.rpc("get_lost_deals_reports_graphic", {
          company_id: params.company_id,
          start_date: params.start_date,
          end_date: params.end_date,
          user_id: params.user_id,
        });

        if (error) throw new Error(error.message);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: (error as Error).message }], isError: true };
      }
    }
  );

  // ----------------------------------------------------------
  // RPC: get_noshow_deals_reports_graphics
  // ----------------------------------------------------------
  server.tool(
    "get_noshow_deals_reports_graphics",
    "Retorna dados consolidados para gráficos de no-shows (Fontes, Campanhas e Motivos).",
    GetNoShowDealsGraphicSchema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const { data, error } = await supabase.rpc("get_noshow_deals_reports_graphics", {
          company_id: params.company_id,
          start_date: params.start_date,
          end_date: params.end_date,
          user_id: params.user_id,
        });

        if (error) throw new Error(error.message);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: (error as Error).message }], isError: true };
      }
    }
  );

  // ----------------------------------------------------------
  // RPC: get_utm_deals_reports_summary
  // ----------------------------------------------------------
  server.tool(
    "get_utm_deals_reports_summary",
    "Retorna o histórico de UTMs capturados nos negócios.",
    GetUtmDealsSummarySchema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const rpcArgs: any = {
          company_id: params.company_id,
          date_start: params.date_start,
          date_end: params.date_end,
        };

        // Adiciona parâmetros opcionais apenas se não forem vazios/nulos
        const optionalParams = [
          "page",
          "limit",
          "deal_id",
          "utm_id",
          "utm_term",
          "utm_medium",
          "utm_source",
          "utm_content",
          "utm_campaign",
        ];

        for (const key of optionalParams) {
          const val = (params as any)[key];
          if (val !== undefined && val !== null && val !== "") {
            rpcArgs[key] = val;
          }
        }

        const { data, error } = await supabase.rpc("get_utm_deals_reports_summary", rpcArgs);

        if (error) throw new Error(error.message);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: (error as Error).message }], isError: true };
      }
    }
  );
}
