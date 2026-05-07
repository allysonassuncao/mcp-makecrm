#!/usr/bin/env node

import { config } from "dotenv";
config(); // Carrega variáveis do .env
config({ path: ".env.local" }); // Sobreescreve com .env.local se existir

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getSupabaseClient } from "./src/supabase-client.js";
import { registerEdgeFunctionTools } from "./src/tools/edge-functions.js";
import { registerRpcTools } from "./src/tools/rpc.js";
import { registerTableTools } from "./src/tools/tables.js";

async function main() {
  try {
    console.error("🚀 Iniciando Supabase MCP Server...");
    console.error("📋 Checando variáveis de ambiente:");
    console.error(`   NODE_VERSION: ${process.version}`);
    console.error(
      `   SUPABASE_URL: ${process.env.SUPABASE_URL ? "✅ Presente" : "❌ Ausente"}`
    );
    console.error(
      `   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Presente" : "❌ Ausente"}`
    );

    // Valida a conexão com o Supabase ao iniciar
    console.error("🔐 Inicializando cliente Supabase...");
    const supabase = getSupabaseClient();
    console.error("✅ Cliente Supabase criado com sucesso");

    // Testa a conexão com o Supabase
    console.error("🔍 Testando conexão com o Supabase...");
    const { error: pingError } = await supabase
      .from("_mcp_health_check_nonexistent")
      .select("*")
      .limit(1)
      .maybeSingle();

    // Esperamos um erro 42P01 (tabela não existe) — isso confirma que a conexão funciona
    if (pingError && pingError.code !== "42P01" && pingError.code !== "PGRST116") {
      console.error(
        `⚠️  Aviso na verificação de conexão (código ${pingError.code}): ${pingError.message}`
      );
      console.error(
        "💡 Se o código for 42P01 ou PGRST116, a conexão está funcionando corretamente."
      );
    } else {
      console.error("✅ Conexão com o Supabase verificada com sucesso");
    }

    // Inicializa o servidor MCP
    console.error("🔧 Inicializando servidor MCP...");
    const server = new McpServer({
      name: process.env.MCP_SERVER_NAME || "Supabase MCP Server",
      version: process.env.MCP_SERVER_VERSION || "1.0.0",
    });
    console.error("✅ Instância do servidor MCP criada");

    // Registra todos os tools
    console.error("🛠️  Registrando tools...");
    const supabase = getSupabaseClient();
    
    registerEdgeFunctionTools(server, supabase);
    console.error("   ✅ Edge Function tools registradas");
    registerRpcTools(server, supabase);
    console.error("   ✅ RPC tools registradas");
    registerTableTools(server, supabase);
    console.error("   ✅ Table query tools registradas");

    // Tool de health check
    server.tool(
      "health_check",
      "Verifica a saúde e status do Supabase MCP Server.",
      {},
      async () => {
        try {
          const supabase = getSupabaseClient();
          const { error } = await supabase
            .from("_mcp_health_check_nonexistent")
            .select("*")
            .limit(1)
            .maybeSingle();

          const connected =
            !error || error.code === "42P01" || error.code === "PGRST116";

          const response = {
            status: connected ? "healthy" : "degraded",
            server_name: process.env.MCP_SERVER_NAME || "Supabase MCP Server",
            version: process.env.MCP_SERVER_VERSION || "1.0.0",
            timestamp: new Date().toISOString(),
            supabase_connection: connected ? "connected" : "error",
            supabase_url: process.env.SUPABASE_URL,
            validation_rules: {
              user_id: "UUID obrigatório em todas as operações",
              company_id: "UUID obrigatório em todas as operações",
            },
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
                    status: "unhealthy",
                    error: errorMessage,
                    timestamp: new Date().toISOString(),
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

    // Tool de capabilities
    server.tool(
      "get_capabilities",
      "Retorna as capacidades e tools disponíveis neste servidor MCP.",
      {},
      async () => {
        const capabilities = {
          server_info: {
            name: process.env.MCP_SERVER_NAME || "Supabase MCP Server",
            version: process.env.MCP_SERVER_VERSION || "1.0.0",
            description:
              "MCP Server para integração com Supabase — Edge Functions e RPCs",
          },
          authentication: {
            required_in_all_tools: ["user_id (UUID)", "company_id (UUID)"],
            server_credentials: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
          },
          tools_available: [
            // Edge Functions
            "example_edge_function",
            // RPCs
            "get_won_deals_reports_summary",
            // Table queries
            "list_users",
            "list_pipelines",
            "list_sources",
            "list_campaigns",
            // Utility
            "health_check",
            "get_capabilities",
          ],
          validation_rules: {
            description:
              "Todos os tools exigem user_id e company_id como UUIDs válidos",
            format: "UUID v4 (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)",
            error_handling:
              "Erros de validação retornam VALIDATION_ERROR com detalhes do campo",
          },
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(capabilities, null, 2),
            },
          ],
        };
      }
    );

    console.error("🔗 Conectando ao transporte MCP...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("✅ Conexão com o transporte estabelecida");

    console.error("✅ Supabase MCP Server iniciado com sucesso");
    console.error("🎯 Aguardando requisições dos clientes MCP...");
  } catch (error) {
    console.error("❌ Falha ao iniciar o Supabase MCP Server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.error("Recebido SIGINT, encerrando servidor...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.error("Recebido SIGTERM, encerrando servidor...");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("Exceção não capturada:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Rejeição não tratada em:", promise, "razão:", reason);
  process.exit(1);
});

// Inicia o servidor
main().catch((error) => {
  console.error("Falha ao iniciar o servidor:", error);
  process.exit(1);
});
