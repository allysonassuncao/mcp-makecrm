import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callRpc } from "../supabase-client.js";
import {
  validateBaseParams,
  GetWonDealsSummarySchema,
  type WonDealsSummaryRow,
} from "../types/schemas.js";

// ============================================================
// RPC TOOLS
//
// Cada tool neste arquivo chama uma função RPC do Supabase.
//
// REGRA: Todos os tools DEVEM validar user_id e company_id
// antes de qualquer operação.
//
// Para adicionar uma nova RPC:
// 1. Crie o schema em src/types/schemas.ts estendendo BaseSchema
// 2. Adicione o tipo de retorno em src/types/schemas.ts
// 3. Registre o tool aqui seguindo o padrão abaixo
// ============================================================

export function registerRpcTools(server: McpServer) {
  // ----------------------------------------------------------
  // RPC: public.get_won_deals_reports_summary_v3
  // Retorna o resumo de negócios: total, ganhos, perdidos,
  // receita e tempo médio de fechamento.
  // ----------------------------------------------------------
  server.tool(
    "get_won_deals_reports_summary",
    "Retorna o resumo de negócios (deals) da empresa: total de deals, " +
      "total ganhos, total perdidos, dias médios para fechar, receita total ganha, " +
      "receita prevista e receita perdida. Filtros opcionais por período (date_start / date_end).",
    GetWonDealsSummarySchema.shape,
    async (params) => {
      // 1. Validação obrigatória de user_id e company_id
      const validation = validateBaseParams({
        user_id: params.user_id,
        company_id: params.company_id,
      });

      if (!validation.valid) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(validation.error, null, 2),
            },
          ],
          isError: true,
        };
      }

      try {
        // 2. Monta os parâmetros para a RPC
        // A função Supabase aceita: company_id, date_start, date_end, user_id
        const rpcParams: Record<string, unknown> = {
          company_id: params.company_id,
          user_id: params.user_id,
        };

        if (params.date_start) rpcParams.date_start = params.date_start;
        if (params.date_end) rpcParams.date_end = params.date_end;

        // 3. Chama a RPC
        const result = await callRpc<WonDealsSummaryRow[]>(
          "get_won_deals_reports_summary_v3",
          rpcParams
        );

        // 4. Formata a resposta
        const summary = result?.[0] ?? null;

        if (!summary) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    data: null,
                    message:
                      "Nenhum dado encontrado para os filtros informados.",
                    filters: {
                      company_id: params.company_id,
                      date_start: params.date_start ?? "sem filtro",
                      date_end: params.date_end ?? "sem filtro",
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const response = {
          success: true,
          data: {
            total_deals: summary.total_deals,
            total_won: summary.total_won,
            total_lost: summary.total_lost,
            avg_days_to_win: parseFloat(summary.avg_days_to_win),
            revenue: {
              won: parseFloat(summary.total_revenue_won),
              lost: parseFloat(summary.total_revenue_lost),
              forecast: parseFloat(summary.total_revenue_forecast),
            },
          },
          filters_applied: {
            company_id: params.company_id,
            date_start: params.date_start ?? "sem filtro",
            date_end: params.date_end ?? "sem filtro",
          },
          raw: summary,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro desconhecido";
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: errorMessage,
                  rpc: "get_won_deals_reports_summary_v3",
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ----------------------------------------------------------
  // Adicione mais RPC tools abaixo seguindo o mesmo padrão
  // ----------------------------------------------------------
}
