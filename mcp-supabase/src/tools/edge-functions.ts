import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SupabaseClient } from "@supabase/supabase-js";
import { BaseSchema, validateBaseParams } from "../types/schemas.js";
import { logger } from "../utils/logger.js";

export function registerEdgeFunctionTools(server: McpServer, supabase: SupabaseClient) {
  server.tool(
    "example_edge_function",
    "Exemplo de chamada de Edge Function.",
    BaseSchema.shape,
    async (params) => {
      logger.info(`🚀 Executando tool: example_edge_function`, params);
      const validation = validateBaseParams(params);
      if (!validation.valid) {
        logger.warn(`⚠️ Validação falhou para example_edge_function`, validation.error);
        return { content: [{ type: "text", text: JSON.stringify(validation.error) }], isError: true };
      }

      try {
        const { data, error } = await supabase.functions.invoke("example-function", {
          body: params,
        });

        if (error) throw new Error(error.message);
        
        logger.info(`✅ Sucesso na execução de example_edge_function`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error(`❌ Erro na execução de example_edge_function`, error);
        return { content: [{ type: "text", text: (error as Error).message }], isError: true };
      }
    }
  );
}
