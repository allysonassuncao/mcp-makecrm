import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSupabaseClient } from "../supabase-client.js";
import {
  validateBaseParams,
  ListUsersSchema,
  ListPipelinesSchema,
  ListSourcesSchema,
  ListCampaignsSchema,
  type UserRow,
  type PipelineRow,
  type SourceRow,
  type CampaignRow,
} from "../types/schemas.js";

// ============================================================
// TABLE TOOLS — Consultas SELECT diretas no Supabase
//
// REGRA: Todos os tools filtram por company_id e validam
// user_id + company_id obrigatoriamente antes de qualquer query.
//
// Cada tool aplica os filtros diretamente via Supabase client
// para suportar filtros extras (status, is_ia, etc.).
// ============================================================

export function registerTableTools(server: McpServer) {
  // ----------------------------------------------------------
  // TOOL: list_users
  // SELECT FROM public.users WHERE company_id = ?
  // Colunas: id, created_at, updated_at, name, email,
  //          role, status, company_id, is_ia
  // ----------------------------------------------------------
  server.tool(
    "list_users",
    "Lista os usuários da empresa (public.users filtrado por company_id). " +
      "Filtros opcionais: status_filter (ativo/inativo) e is_ia (usuário IA ou humano). " +
      "Suporta paginação e ordenação por name, email, created_at, updated_at, role ou status.",
    ListUsersSchema.shape,
    async (params) => {
      const validation = validateBaseParams({
        user_id: params.user_id,
        company_id: params.company_id,
      });
      if (!validation.valid) {
        return {
          content: [{ type: "text", text: JSON.stringify(validation.error, null, 2) }],
          isError: true,
        };
      }

      try {
        const supabase = getSupabaseClient();
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

        const rows = (data ?? []) as UserRow[];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  table: "public.users",
                  total_returned: rows.length,
                  pagination: { limit, offset },
                  order: { by: order_by, ascending },
                  filters: {
                    company_id: params.company_id,
                    status: status_filter ?? "todos",
                    is_ia: is_ia ?? "todos",
                  },
                  data: rows,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: false, error: msg, table: "public.users" }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ----------------------------------------------------------
  // TOOL: list_pipelines
  // SELECT FROM public.pipelines WHERE company_id = ?
  // Colunas: id, name, status, settings, company_id,
  //          created_at, won_stage
  // ----------------------------------------------------------
  server.tool(
    "list_pipelines",
    "Lista os pipelines da empresa (public.pipelines filtrado por company_id). " +
      "Filtro opcional: status_filter (ativo/inativo). " +
      "Suporta paginação e ordenação por name, created_at ou status.",
    ListPipelinesSchema.shape,
    async (params) => {
      const validation = validateBaseParams({
        user_id: params.user_id,
        company_id: params.company_id,
      });
      if (!validation.valid) {
        return {
          content: [{ type: "text", text: JSON.stringify(validation.error, null, 2) }],
          isError: true,
        };
      }

      try {
        const supabase = getSupabaseClient();
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

        const rows = (data ?? []) as PipelineRow[];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  table: "public.pipelines",
                  total_returned: rows.length,
                  pagination: { limit, offset },
                  order: { by: order_by, ascending },
                  filters: {
                    company_id: params.company_id,
                    status: status_filter ?? "todos",
                  },
                  data: rows,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: false, error: msg, table: "public.pipelines" }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ----------------------------------------------------------
  // TOOL: list_sources
  // SELECT FROM public.sources WHERE company_id = ?
  // Colunas: id, name, status, company_id
  // ATENÇÃO: sources NÃO tem coluna created_at
  // ----------------------------------------------------------
  server.tool(
    "list_sources",
    "Lista as origens/fontes de leads da empresa (public.sources filtrado por company_id). " +
      "Filtro opcional: status_filter (ativa/inativa). " +
      "Ordenação por name ou status. " +
      "ATENÇÃO: a tabela sources não possui coluna created_at.",
    ListSourcesSchema.shape,
    async (params) => {
      const validation = validateBaseParams({
        user_id: params.user_id,
        company_id: params.company_id,
      });
      if (!validation.valid) {
        return {
          content: [{ type: "text", text: JSON.stringify(validation.error, null, 2) }],
          isError: true,
        };
      }

      try {
        const supabase = getSupabaseClient();
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

        const rows = (data ?? []) as SourceRow[];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  table: "public.sources",
                  total_returned: rows.length,
                  pagination: { limit, offset },
                  order: { by: order_by, ascending },
                  filters: {
                    company_id: params.company_id,
                    status: status_filter ?? "todas",
                  },
                  data: rows,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: false, error: msg, table: "public.sources" }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ----------------------------------------------------------
  // TOOL: list_campaigns
  // SELECT FROM public.campaigns WHERE company_id = ?
  // Colunas: id, name, status, company_id
  // ATENÇÃO: campaigns NÃO tem coluna created_at
  // ----------------------------------------------------------
  server.tool(
    "list_campaigns",
    "Lista as campanhas da empresa (public.campaigns filtrado por company_id). " +
      "Filtro opcional: status_filter (ativa/inativa). " +
      "Ordenação por name ou status. " +
      "ATENÇÃO: a tabela campaigns não possui coluna created_at.",
    ListCampaignsSchema.shape,
    async (params) => {
      const validation = validateBaseParams({
        user_id: params.user_id,
        company_id: params.company_id,
      });
      if (!validation.valid) {
        return {
          content: [{ type: "text", text: JSON.stringify(validation.error, null, 2) }],
          isError: true,
        };
      }

      try {
        const supabase = getSupabaseClient();
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

        const rows = (data ?? []) as CampaignRow[];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  table: "public.campaigns",
                  total_returned: rows.length,
                  pagination: { limit, offset },
                  order: { by: order_by, ascending },
                  filters: {
                    company_id: params.company_id,
                    status: status_filter ?? "todas",
                  },
                  data: rows,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: false, error: msg, table: "public.campaigns" }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
