import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  validateBaseParams,
  ListUsersSchema,
  ListPipelinesSchema,
  ListSourcesSchema,
  ListCampaignsSchema,
  ListRolesSchema,
  ListLostReasonsSchema,
  ListNoshowReasonsSchema,
  ListPipelineDealMeetsSchema,
  ListPipelineDealLostsSchema,
  ListPipelineDealMeetNoshowSchema,
} from "../types/schemas.js";

export function registerTableTools(server: McpServer, supabase: SupabaseClient) {
  // ----------------------------------------------------------
  // TOOL: list_users
  // ----------------------------------------------------------
  server.tool(
    "list_users",
    "Lista os usuários da empresa (public.users).",
    ListUsersSchema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const { limit, offset, order_by, ascending, status_filter, is_ia } = params;
        let query = supabase
          .from("users")
          .select("id, created_at, updated_at, name, email, role, status, company_id, is_ia")
          .eq("company_id", params.company_id)
          .order(order_by, { ascending })
          .range(offset, offset + limit - 1);

        if (status_filter !== undefined) query = query.eq("status", status_filter);
        if (is_ia !== undefined) query = query.eq("is_ia", is_ia);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return { content: [{ type: "text", text: JSON.stringify({ success: true, data }, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
      }
    }
  );

  // ----------------------------------------------------------
  // TOOL: list_pipelines
  // ----------------------------------------------------------
  server.tool(
    "list_pipelines",
    "Lista os pipelines da empresa (public.pipelines).",
    ListPipelinesSchema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const { limit, offset, order_by, ascending, status_filter } = params;
        let query = supabase
          .from("pipelines")
          .select("id, name, status, settings, company_id, created_at, won_stage")
          .eq("company_id", params.company_id)
          .order(order_by, { ascending })
          .range(offset, offset + limit - 1);

        if (status_filter !== undefined) query = query.eq("status", status_filter);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return { content: [{ type: "text", text: JSON.stringify({ success: true, data }, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
      }
    }
  );

  // ----------------------------------------------------------
  // TOOL: list_sources
  // ----------------------------------------------------------
  server.tool(
    "list_sources",
    "Lista as origens de leads (public.sources).",
    ListSourcesSchema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const { limit, offset, order_by, ascending, status_filter } = params;
        let query = supabase
          .from("sources")
          .select("id, name, status, company_id")
          .eq("company_id", params.company_id)
          .order(order_by, { ascending })
          .range(offset, offset + limit - 1);

        if (status_filter !== undefined) query = query.eq("status", status_filter);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return { content: [{ type: "text", text: JSON.stringify({ success: true, data }, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
      }
    }
  );

  // ----------------------------------------------------------
  // TOOL: list_campaigns
  // ----------------------------------------------------------
  server.tool(
    "list_campaigns",
    "Lista as campanhas (public.campaigns).",
    ListCampaignsSchema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const { limit, offset, order_by, ascending, status_filter } = params;
        let query = supabase
          .from("campaigns")
          .select("id, name, status, company_id")
          .eq("company_id", params.company_id)
          .order(order_by, { ascending })
          .range(offset, offset + limit - 1);

        if (status_filter !== undefined) query = query.eq("status", status_filter);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return { content: [{ type: "text", text: JSON.stringify({ success: true, data }, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
      }
    }
  );

  // ----------------------------------------------------------
  // TOOL: list_roles
  // ----------------------------------------------------------
  server.tool(
    "list_roles",
    "Lista os papéis (public.roles).",
    ListRolesSchema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const { limit, offset, order_by, ascending, status_filter } = params;
        // roles não possui company_id, ignoramos o params.company_id na query
        let query = supabase
          .from("roles")
          .select("id, name, status")
          .order(order_by, { ascending })
          .range(offset, offset + limit - 1);

        if (status_filter !== undefined) query = query.eq("status", status_filter);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return { content: [{ type: "text", text: JSON.stringify({ success: true, data }, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
      }
    }
  );

  // ----------------------------------------------------------
  // TOOL: list_lost_reasons
  // ----------------------------------------------------------
  server.tool(
    "list_lost_reasons",
    "Lista os motivos de perda (public.lost_reasons).",
    ListLostReasonsSchema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const { limit, offset, order_by, ascending, status_filter } = params;
        let query = supabase
          .from("lost_reasons")
          .select("id, company_id, name, status, created_at")
          .eq("company_id", params.company_id)
          .order(order_by, { ascending })
          .range(offset, offset + limit - 1);

        if (status_filter !== undefined) query = query.eq("status", status_filter);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return { content: [{ type: "text", text: JSON.stringify({ success: true, data }, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
      }
    }
  );

  // ----------------------------------------------------------
  // TOOL: list_noshow_reasons
  // ----------------------------------------------------------
  server.tool(
    "list_noshow_reasons",
    "Lista os motivos de no-show (public.noshow_reasons).",
    ListNoshowReasonsSchema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const { limit, offset, order_by, ascending, status_filter } = params;
        let query = supabase
          .from("noshow_reasons")
          .select("id, company_id, name, status, created_at")
          .eq("company_id", params.company_id)
          .order(order_by, { ascending })
          .range(offset, offset + limit - 1);

        if (status_filter !== undefined) query = query.eq("status", status_filter);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return { content: [{ type: "text", text: JSON.stringify({ success: true, data }, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
      }
    }
  );

  // ----------------------------------------------------------
  // TOOL: list_pipeline_deal_meets
  // ----------------------------------------------------------
  server.tool(
    "list_pipeline_deal_meets",
    "Lista os agendamentos (public.pipeline_deal_meets).",
    ListPipelineDealMeetsSchema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const { limit, offset, order_by, ascending, status_filter, deal_id, user_id_filter } = params;
        // Tabela não possui company_id direto. O usuário deve informar se precisa buscar tudo.
        let query = supabase
          .from("pipeline_deal_meets")
          .select("id, bot_id, deal_id, user_id, type, title, event_id, created_at, start, end, status, attendees, link, description")
          .order(order_by, { ascending })
          .range(offset, offset + limit - 1);

        if (status_filter !== undefined) query = query.eq("status", status_filter);
        if (deal_id !== undefined) query = query.eq("deal_id", deal_id);
        if (user_id_filter !== undefined) query = query.eq("user_id", user_id_filter);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return { content: [{ type: "text", text: JSON.stringify({ success: true, data }, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
      }
    }
  );

  // ----------------------------------------------------------
  // TOOL: list_pipeline_deal_losts
  // ----------------------------------------------------------
  server.tool(
    "list_pipeline_deal_losts",
    "Lista os negócios perdidos (public.pipeline_deal_losts).",
    ListPipelineDealLostsSchema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const { limit, offset, order_by, ascending, deal_id, reason_id } = params;
        let query = supabase
          .from("pipeline_deal_losts")
          .select("id, deal_id, reason_id, description, created_at")
          .order(order_by, { ascending })
          .range(offset, offset + limit - 1);

        if (deal_id !== undefined) query = query.eq("deal_id", deal_id);
        if (reason_id !== undefined) query = query.eq("reason_id", reason_id);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return { content: [{ type: "text", text: JSON.stringify({ success: true, data }, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
      }
    }
  );

  // ----------------------------------------------------------
  // TOOL: list_pipeline_deal_meet_noshow
  // ----------------------------------------------------------
  server.tool(
    "list_pipeline_deal_meet_noshow",
    "Lista os no-shows de agendamentos (public.pipeline_deal_meet_noshow).",
    ListPipelineDealMeetNoshowSchema.shape,
    async (params) => {
      const validation = validateBaseParams(params);
      if (!validation.valid) return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };

      try {
        const { limit, offset, order_by, ascending, meet_id } = params;
        let query = supabase
          .from("pipeline_deal_meet_noshow")
          .select("id, meet_id, user_id, reason_id, description, created_at")
          .order(order_by, { ascending })
          .range(offset, offset + limit - 1);

        if (meet_id !== undefined) query = query.eq("meet_id", meet_id);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return { content: [{ type: "text", text: JSON.stringify({ success: true, data }, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: (error as Error).message }) }], isError: true };
      }
    }
  );
}
