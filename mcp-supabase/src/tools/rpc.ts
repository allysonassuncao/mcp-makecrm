import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SupabaseClient } from "@supabase/supabase-js";
import { validateBaseParams, GetWonDealsSummarySchema, GetWonDealsGraphicSchema, GetLostDealsSummarySchema, GetLostDealsGraphicSchema, GetUtmDealsSummarySchema, GetNoShowDealsSummarySchema, GetNoShowDealsGraphicSchema } from "../types/schemas.js";

export function registerRpcTools(server: McpServer, supabase: SupabaseClient) {
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
        const { data, error } = await supabase.rpc("get_utm_deals_reports_summary", {
          company_id: params.company_id,
          date_start: params.date_start,
          date_end: params.date_end,
          page: params.page,
          limit: params.limit,
          deal_id: params.deal_id,
          utm_id: params.utm_id,
          utm_term: params.utm_term,
          utm_medium: params.utm_medium,
          utm_source: params.utm_source,
          utm_content: params.utm_content,
          utm_campaign: params.utm_campaign,
        });

        if (error) throw new Error(error.message);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: (error as Error).message }], isError: true };
      }
    }
  );
}
