import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { invokeEdgeFunction } from "../supabase-client.js";
import { validateBaseParams, ExampleEdgeFunctionSchema } from "../types/schemas.js";

// ============================================================
// EDGE FUNCTIONS TOOLS
//
// Cada tool neste arquivo chama uma Edge Function do Supabase.
//
// REGRA: Todos os tools DEVEM validar user_id e company_id
// antes de qualquer operação.
//
// Para adicionar uma nova edge function:
// 1. Crie o schema em src/types/schemas.ts estendendo BaseSchema
// 2. Registre o tool aqui seguindo o padrão abaixo
// ============================================================

export function registerEdgeFunctionTools(server: McpServer) {
  // ----------------------------------------------------------
  // EXEMPLO: Placeholder de Edge Function
  // Substitua "example_edge_function" pelo nome real da sua edge function
  // e atualize o schema em src/types/schemas.ts
  // ----------------------------------------------------------
  server.tool(
    "example_edge_function",
    "Exemplo de tool que invoca uma Edge Function do Supabase. " +
      "Substitua pelo nome e descrição real da sua função.",
    ExampleEdgeFunctionSchema.shape,
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
        // 2. Invocar a Edge Function passando user_id e company_id no payload
        const result = await invokeEdgeFunction("nome-da-sua-edge-function", {
          user_id: params.user_id,
          company_id: params.company_id,
          // ...outros parâmetros específicos
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  data: result,
                },
                null,
                2
              ),
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
  // Adicione mais edge function tools abaixo seguindo o mesmo padrão
  // ----------------------------------------------------------
}
