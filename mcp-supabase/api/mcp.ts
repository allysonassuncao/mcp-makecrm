import { createMcpHandler } from "@vercel/mcp-adapter";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDynamicSupabaseClient, getSupabaseClient } from "../src/supabase-client.js";
import { registerEdgeFunctionTools } from "../src/tools/edge-functions.js";
import { registerRpcTools } from "../src/tools/rpc.js";
import { registerTableTools } from "../src/tools/tables.js";

const handler = async (req: Request) => {
  const allowedOrigins = [
    "http://localhost:8080",
    "https://usermakecrm.com.br",
    "https://app.usermakecrm.com.br",
  ];

  const origin = req.headers.get("origin");
  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[1];

  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, Accept",
    "Vary": "Origin",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 1. Captura as credenciais dos headers
  const apiKey = req.headers.get("apikey");
  const authHeader = req.headers.get("authorization");

  // Cria o cliente baseado no que recebeu (ou usa o padrão do .env se não vier nada)
  const supabase = apiKey 
    ? createDynamicSupabaseClient(apiKey, authHeader || undefined)
    : getSupabaseClient();

  const acceptHeader = req.headers.get("accept") || "";

  // 2. Lógica para POST simples (Postman)
  if (req.method === "POST" && !acceptHeader.includes("text/event-stream")) {
    try {
      const body = await req.json();
      const server = new McpServer({ name: "supabase-mcp", version: "1.0.0" });

      registerEdgeFunctionTools(server, supabase);
      registerRpcTools(server, supabase);
      registerTableTools(server, supabase);

      if (body.method === "tools/list") {
        const tools = Object.entries((server as any)._registeredTools).map(([name, tool]: [string, any]) => ({
          name, description: tool.description, inputSchema: tool.inputSchema,
        }));
        return new Response(JSON.stringify({ jsonrpc: "2.0", result: { tools }, id: body.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (body.method === "tools/call") {
        const toolName = body.params?.name;
        const tool = (server as any)._registeredTools[toolName];
        if (!tool) throw new Error(`Tool não encontrado: ${toolName}`);

        const args = tool.inputSchema.parse(body.params?.arguments || {});
        const result = await tool.handler(args);
        return new Response(JSON.stringify({ jsonrpc: "2.0", result, id: body.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      throw new Error(`Método ${body.method} não suportado.`);
    } catch (error) {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: error instanceof Error ? error.message : "Erro" },
        id: null
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // 3. Fluxo SSE (Claude)
  return createMcpHandler(
    (server) => {
      registerEdgeFunctionTools(server, supabase);
      registerRpcTools(server, supabase);
      registerTableTools(server, supabase);
    },
    {},
    { basePath: "/api/mcp" }
  )(req);
};

export { handler as GET, handler as POST, handler as OPTIONS };
