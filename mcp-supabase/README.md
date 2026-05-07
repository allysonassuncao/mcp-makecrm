# Supabase MCP Server

Servidor MCP (Model Context Protocol) para integração com o Supabase — expondo **Edge Functions** e **funções RPC** como tools para agentes de IA.

## Estrutura do Projeto

```
mcp-supabase/
├── src/
│   ├── index.ts                  # Entrada do servidor MCP
│   ├── supabase-client.ts        # Cliente Supabase + helpers invokeEdgeFunction / callRpc
│   ├── types/
│   │   └── schemas.ts            # Schemas Zod — BaseSchema com user_id e company_id
│   └── tools/
│       ├── edge-functions.ts     # Tools que invocam Edge Functions
│       └── rpc.ts                # Tools que chamam funções RPC
├── .env.example                  # Template de variáveis de ambiente
├── package.json
├── tsconfig.json
└── vercel.json                   # Configuração de deploy na Vercel
```

## Regra de Validação Global

> ⚠️ **Todos os tools** deste servidor exigem obrigatoriamente:
> - `user_id` — UUID v4 do usuário autenticado
> - `company_id` — UUID v4 da empresa

A validação é feita via `validateBaseParams()` no início de cada handler. Se os parâmetros estiverem ausentes ou inválidos, o tool retorna um erro `VALIDATION_ERROR` com detalhes do campo problemático.

## Configuração

1. Copie o `.env.example` para `.env`:

```bash
cp .env.example .env
```

2. Preencha as variáveis:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

MCP_SERVER_NAME=Supabase MCP Server
MCP_SERVER_VERSION=1.0.0
```

## Executar em modo desenvolvimento

```bash
npm run dev:mcp
```

## Build para produção

```bash
npm run build
```

## Como adicionar uma nova Edge Function como tool

### 1. Defina o schema em `src/types/schemas.ts`

```typescript
export const GetConversationsSchema = BaseSchema.extend({
  status: z.enum(["open", "closed"]).optional().describe("Filtrar por status"),
  limit: z.number().int().min(1).max(100).default(20).describe("Quantidade de resultados"),
});
```

### 2. Registre o tool em `src/tools/edge-functions.ts`

```typescript
import { GetConversationsSchema } from "../types/schemas.js";

// Dentro de registerEdgeFunctionTools:
server.tool(
  "get_conversations",
  "Retorna as conversas da empresa filtradas por status.",
  GetConversationsSchema.shape,
  async (params) => {
    const validation = validateBaseParams(params);
    if (!validation.valid) {
      return { content: [{ type: "text", text: JSON.stringify(validation.error, null, 2) }], isError: true };
    }

    try {
      const result = await invokeEdgeFunction("get-conversations", {
        user_id: params.user_id,
        company_id: params.company_id,
        status: params.status,
        limit: params.limit,
      });
      return { content: [{ type: "text", text: JSON.stringify({ success: true, data: result }, null, 2) }] };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: msg }, null, 2) }], isError: true };
    }
  }
);
```

## Como adicionar uma nova função RPC como tool

### 1. Defina o schema em `src/types/schemas.ts`

```typescript
export const GetFaqDataSchema = BaseSchema.extend({
  category: z.string().optional().describe("Categoria do FAQ"),
});
```

### 2. Registre o tool em `src/tools/rpc.ts`

```typescript
import { GetFaqDataSchema } from "../types/schemas.js";

// Dentro de registerRpcTools:
server.tool(
  "get_faq_data",
  "Busca dados de FAQ por categoria.",
  GetFaqDataSchema.shape,
  async (params) => {
    const validation = validateBaseParams(params);
    if (!validation.valid) {
      return { content: [{ type: "text", text: JSON.stringify(validation.error, null, 2) }], isError: true };
    }

    try {
      const result = await callRpc("get_faq_data", {
        p_user_id: params.user_id,
        p_company_id: params.company_id,
        p_category: params.category,
      });
      return { content: [{ type: "text", text: JSON.stringify({ success: true, data: result }, null, 2) }] };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: msg }, null, 2) }], isError: true };
    }
  }
);
```

## Tools Disponíveis

| Tool | Tipo | Descrição |
|------|------|-----------|
| `example_edge_function` | Edge Function | Placeholder — substituir pelo real |
| `example_rpc` | RPC | Placeholder — substituir pelo real |
| `health_check` | Utilitário | Verifica a saúde do servidor |
| `get_capabilities` | Utilitário | Lista as capacidades do servidor |

## Deploy na Vercel

```bash
vercel deploy
```

Adicione as variáveis de ambiente na Vercel:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
