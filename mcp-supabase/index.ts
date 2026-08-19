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
import { logger } from "./src/utils/logger.js";

async function main() {
  try {
    logger.info("🚀 Iniciando Supabase MCP Server...");
    logger.info("📋 Checando variáveis de ambiente:", {
      NODE_VERSION: process.version,
      SUPABASE_URL: process.env.SUPABASE_URL ? "✅ Presente" : "❌ Ausente",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Presente" : "❌ Ausente"
    });

    // Valida a conexão com o Supabase ao iniciar
    logger.info("🔐 Inicializando cliente Supabase...");
    const supabase = getSupabaseClient();
    logger.info("✅ Cliente Supabase criado com sucesso");

    // Testa a conexão com o Supabase
    logger.info("🔍 Testando conexão com o Supabase...");
    const { error: pingError } = await supabase
      .from("_mcp_health_check_nonexistent")
      .select("*")
      .limit(1)
      .maybeSingle();

    // Esperamos um erro 42P01 (tabela não existe) — isso confirma que a conexão funciona
    if (pingError && pingError.code !== "42P01" && pingError.code !== "PGRST116") {
      logger.warn(
        `⚠️  Aviso na verificação de conexão (código ${pingError.code}): ${pingError.message}`
      );
      logger.warn(
        "💡 Se o código for 42P01 ou PGRST116, a conexão está funcionando corretamente."
      );
    } else {
      logger.info("✅ Conexão com o Supabase verificada com sucesso");
    }

    // Inicializa o servidor MCP
    logger.info("🔧 Inicializando servidor MCP...");
    const server = new McpServer({
      name: process.env.MCP_SERVER_NAME || "Supabase MCP Server",
      version: process.env.MCP_SERVER_VERSION || "1.0.0",
    });
    logger.info("✅ Instância do servidor MCP criada");

    // Registra todos os tools
    logger.info("🛠️  Registrando tools...");
    const supabaseClient = getSupabaseClient();
    
    registerEdgeFunctionTools(server, supabaseClient);
    logger.info("   ✅ Edge Function tools registradas");
    registerRpcTools(server, supabaseClient);
    logger.info("   ✅ RPC tools registradas");
    registerTableTools(server, supabaseClient);
    logger.info("   ✅ Table query tools registradas");

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
            "getContacts",
            "getDeals",
            "getMAVIFAQ",
            
            // RPCs - Contatos
            "get_contact_full_context_v2",
            "get_inboxes_unread_counts",
            
            // RPCs - Pipeline
            "get_pipeline_deals_page_v7",
            "get_pipeline_deals_totals_v7",
            
            // RPCs - Reuniões
            "get_pipeline_meets_filtered",
            "get_pipeline_deals_meet_search_v1",
            
            // RPCs - Relatórios
            "get_conversation_repports",
            "reports_revenue_details_v4",
            "get_won_deals_reports_summary_v4",
            "get_won_deals_reports_by_user",
            "get_won_deals_reports_graphic_v3",
            "get_lost_deals_reports_summary",
            "get_lost_deals_reports_details",
            "get_lost_deals_reports_graphic",
            "get_noshow_deals_reports_summary",
            "get_noshow_deals_reports_details",
            "get_noshow_deals_reports_graphics",
            "get_funnel_deals_reports_v2",
            
            // RPCs - UTMs
            "get_utm_unique_counts",
            "get_utms_v1",
            "get_deals_by_utm_v1",
            "get_deals_won_by_utm_v1",
            "get_utm_deals_reports_summary",
            
            // Table queries
            "list_users",
            "list_pipelines",
            "list_sources",
            "list_campaigns",
            "list_products",
            "list_roles",
            "list_lost_reasons",
            "list_noshow_reasons",
            "list_pipeline_deal_meets",
            "list_pipeline_deal_losts",
            "list_pipeline_deal_meet_noshow",
            "list_pipeline_deal_quotes",
            "list_pipeline_deal_quote_payments",
            "list_currencys",
            
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

    logger.info("🔗 Conectando ao transporte MCP...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info("✅ Conexão com o transporte estabelecida");

    logger.info("✅ Supabase MCP Server iniciado com sucesso");
    logger.info("🎯 Aguardando requisições dos clientes MCP...");
  } catch (error) {
    logger.error("❌ Falha ao iniciar o Supabase MCP Server", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  logger.info("Recebido SIGINT, encerrando servidor...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Recebido SIGTERM, encerrando servidor...");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  logger.error("Exceção não capturada", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Rejeição não tratada em promise", { promise, reason });
  process.exit(1);
});

// Inicia o servidor
main().catch((error) => {
  logger.error("Falha ao iniciar o servidor", error);
  process.exit(1);
});
