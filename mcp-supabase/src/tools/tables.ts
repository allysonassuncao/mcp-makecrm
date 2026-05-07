import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  validateBaseParams,
  ListUsersSchema,
  ListPipelinesSchema,
  ListSourcesSchema,
  ListCampaignsSchema,
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
}
