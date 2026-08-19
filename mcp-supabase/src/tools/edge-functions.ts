import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SupabaseClient } from "@supabase/supabase-js";
import { BaseSchema, validateBaseParams, GetContactsSchema, GetDealsEdgeFunctionSchema, GetMaviFAQSchema } from "../types/schemas.js";
import { logger } from "../utils/logger.js";

function createEdgeFunctionTool(server: McpServer, supabase: SupabaseClient, toolName: string, description: string, schema: any, paramMapper?: (params: any) => any, edgeFunctionName?: string) {
  server.tool(
    toolName,
    description,
    schema.shape,
    async (params: any) => {
      logger.info(`🚀 Executando edge function: ${toolName}`, params);
      const validation = validateBaseParams(params);
      if (!validation.valid) {
        logger.warn(`⚠️ Validação falhou para ${toolName}`, validation.error);
        return { content: [{ type: "text" as const, text: JSON.stringify(validation.error) }], isError: true };
      }

      try {
        const invokeArgs = paramMapper ? paramMapper(params) : params;
        const { data, error } = await supabase.functions.invoke(edgeFunctionName || toolName, {
          body: invokeArgs,
        });
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
        return { content: [{ type: "text" as const, text: JSON.stringify(validation.error) }], isError: true };
      }

      try {
        const { data, error } = await supabase.functions.invoke("example-function", {
          body: params,
        });

        if (error) throw new Error(error.message);
        
        logger.info(`✅ Sucesso na execução de example_edge_function`);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error(`❌ Erro na execução de example_edge_function`, error);
        return { content: [{ type: "text" as const, text: (error as Error).message }], isError: true };
      }
    }
  );

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

  createEdgeFunctionTool(server, supabase, "getContacts", "Lista e filtra contatos processando via server-side", GetContactsSchema, prefixP);
  createEdgeFunctionTool(server, supabase, "getDeals", "Recupera negócios do pipeline vinculados a um contato", GetDealsEdgeFunctionSchema, prefixP);
  createEdgeFunctionTool(server, supabase, "getMAVIFAQ", "Consolida respostas e logs da Inteligência Artificial Mavi", GetMaviFAQSchema);
}
