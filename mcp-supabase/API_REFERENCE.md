# Documentação de Integração - Supabase MCP Server

Este documento detalha como interagir com o servidor Model Context Protocol (MCP) do Supabase, cobrindo métodos de autenticação, endpoints, ferramentas disponíveis e schemas de dados.

## 1. Visão Geral

O servidor MCP suporta dois protocolos de comunicação:
1. **Stdio (Standard I/O):** Utilizado por clientes como Claude Desktop rodando o script localmente.
2. **HTTP (JSON-RPC 2.0):** Disponível via deploy na Vercel (ou `npm run dev:vercel`), ideal para integração via Postman, agentes externos e webhooks.

### Endpoint HTTP
**URL:** `https://SEU-DOMINIO.vercel.app/api/mcp` (ou `http://localhost:3000/api/mcp` em dev)  
**Método:** `POST`  
**Protocolo:** [JSON-RPC 2.0](https://www.jsonrpc.org/specification)

## 2. Autenticação

O servidor é flexível e permite duas abordagens de autenticação ao banco de dados Supabase:

### A. Autenticação Dinâmica (Recomendada via API)
Passe as credenciais nos **Headers** da requisição HTTP para que o servidor atue em nome daquele usuário/empresa.
*   `apikey`: Sua chave (Pública/Anon ou Service Role) do Supabase.
*   `Authorization`: `Bearer SEU_JWT_AQUI` (Opcional, para aplicar RLS com base no usuário logado).

### B. Fallback (Service Role via `.env`)
Se os headers `apikey` e `Authorization` não forem enviados, o servidor fará fallback para as credenciais definidas no ambiente da Vercel (`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`). **Aviso:** Isso ignora RLS (Row Level Security).

---

## 3. Estrutura da Requisição (JSON-RPC)

Toda requisição para executar uma ferramenta segue este formato base:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "NOME_DA_FERRAMENTA",
    "arguments": {
      "company_id": "uuid-da-empresa",
      "user_id": "uuid-do-usuario",
      "...": "outros-parametros"
    }
  },
  "id": 1
}
```

> ⚠️ **Regra de Ouro:** Todas as ferramentas exigem obrigatoriamente os parâmetros `company_id` (UUID) e `user_id` (UUID) nos `arguments`. Qualquer requisição sem eles retornará um `VALIDATION_ERROR`.

---

## 4. Ferramentas (Tools) Disponíveis

### 4.1. Listar Ferramentas
Você pode consultar dinamicamente as ferramentas suportadas.

*   **Ferramenta:** *(Método especial)*
*   **Method:** `tools/list`
*   **Parâmetros:** `{}`

### 4.2. Relatórios e RPCs

#### `get_won_deals_reports_summary`
Executa a procedure `public.get_won_deals_reports_summary_v3` para consolidar os resultados de vendas.

*   **Parâmetros (Arguments):**
    *   `company_id` (String/UUID) - **Obrigatório**
    *   `user_id` (String/UUID) - **Obrigatório**
    *   `date_start` (String/ISO8601) - *Opcional*. Ex: `"2024-01-01T00:00:00Z"`
    *   `date_end` (String/ISO8601) - *Opcional*. Ex: `"2024-12-31T23:59:59Z"`
*   **Retorno:**
    ```json
    [
      {
        "total_deals": 44686,
        "total_lost": 5,
        "total_won": 16,
        "avg_days_to_win": "17.36",
        "total_revenue_won": "13972",
        "total_revenue_forecast": "0",
        "total_revenue_lost": "11094"
      }
    ]
    ```

---

### 4.3. Consultas em Tabelas (Table Queries)

Todas as consultas de tabela suportam os seguintes **parâmetros base de paginação**:
*   `limit` (Integer): Máx registros (Padrão: 100, Máx: 500)
*   `offset` (Integer): Deslocamento (Padrão: 0)
*   `ascending` (Boolean): Ordenação (Padrão: `true`)

#### `list_users`
Consulta `public.users` com filtro rígido por `company_id`.

*   **Parâmetros Específicos:**
    *   `order_by` (Enum): `"name" | "email" | "created_at" | "updated_at" | "role" | "status"` (Padrão: `"name"`)
    *   `status_filter` (Boolean): *Opcional*. `true` para ativos, `false` para inativos.
    *   `is_ia` (Boolean): *Opcional*. Filtra humanos (`false`) ou IAs (`true`).
*   **Retorno:**
    Array com: `id, created_at, updated_at, name, email, role, status, company_id, is_ia`

#### `list_pipelines`
Consulta `public.pipelines` com filtro rígido por `company_id`.

*   **Parâmetros Específicos:**
    *   `order_by` (Enum): `"name" | "created_at" | "status"` (Padrão: `"name"`)
    *   `status_filter` (Boolean): *Opcional*. `true` para ativos, `false` para inativos.
*   **Retorno:**
    Array com: `id, name, status, settings, company_id, created_at, won_stage`

#### `list_campaigns`
Consulta `public.campaigns` com filtro rígido por `company_id`. *(Nota: Tabela sem coluna created_at)*

*   **Parâmetros Específicos:**
    *   `order_by` (Enum): `"name" | "status"` (Padrão: `"name"`)
    *   `status_filter` (Boolean): *Opcional*. `true` para ativas, `false` para inativas.
*   **Retorno:**
    Array com: `id, name, status, company_id`

#### `list_sources`
Consulta `public.sources` (Origens) com filtro rígido por `company_id`. *(Nota: Tabela sem coluna created_at)*

*   **Parâmetros Específicos:**
    *   `order_by` (Enum): `"name" | "status"` (Padrão: `"name"`)
    *   `status_filter` (Boolean): *Opcional*. `true` para ativas, `false` para inativas.
*   **Retorno:**
    Array com: `id, name, status, company_id`

#### `list_roles`
Consulta `public.roles`. *(Nota: Tabela sem coluna created_at e company_id)*

*   **Parâmetros Específicos:**
    *   `order_by` (Enum): `"id" | "name" | "status"` (Padrão: `"name"`)
    *   `status_filter` (Boolean): *Opcional*. `true` para ativas, `false` para inativas.
*   **Retorno:**
    Array com: `id, name, status`

#### `list_lost_reasons`
Consulta `public.lost_reasons` (Motivos de perda) com filtro rígido por `company_id`.

*   **Parâmetros Específicos:**
    *   `order_by` (Enum): `"name" | "created_at" | "status"` (Padrão: `"name"`)
    *   `status_filter` (Boolean): *Opcional*. `true` para ativas, `false` para inativas.
*   **Retorno:**
    Array com: `id, company_id, name, status, created_at`

#### `list_noshow_reasons`
Consulta `public.noshow_reasons` (Motivos de no-show) com filtro rígido por `company_id`.

*   **Parâmetros Específicos:**
    *   `order_by` (Enum): `"name" | "created_at" | "status"` (Padrão: `"name"`)
    *   `status_filter` (Boolean): *Opcional*. `true` para ativas, `false` para inativas.
*   **Retorno:**
    Array com: `id, company_id, name, status, created_at`

#### `list_pipeline_deal_meets`
Consulta `public.pipeline_deal_meets` (Agendamentos).

*   **Parâmetros Específicos:**
    *   `order_by` (Enum): `"title" | "created_at" | "start" | "end" | "status"` (Padrão: `"created_at"`)
    *   `ascending` (Boolean): Ordenação (Padrão: `false`)
    *   `status_filter` (Boolean): *Opcional*. `true` para ativas, `false` para inativas.
    *   `deal_id` (UUID): *Opcional*. Filtra por negócio específico.
    *   `user_id_filter` (UUID): *Opcional*. Filtra por responsável específico.
*   **Retorno:**
    Array com: `id, bot_id, deal_id, user_id, type, title, event_id, created_at, start, end, status, attendees, link, description`

#### `list_pipeline_deal_losts`
Consulta `public.pipeline_deal_losts` (Negócios perdidos).

*   **Parâmetros Específicos:**
    *   `order_by` (Enum): `"id" | "created_at"` (Padrão: `"created_at"`)
    *   `ascending` (Boolean): Ordenação (Padrão: `false`)
    *   `deal_id` (UUID): *Opcional*. Filtra por negócio específico.
    *   `reason_id` (UUID): *Opcional*. Filtra por motivo de perda.
*   **Retorno:**
    Array com: `id, deal_id, reason_id, description, created_at`

#### `list_pipeline_deal_meet_noshow`
Consulta `public.pipeline_deal_meet_noshow` (No-shows em agendamentos).

*   **Parâmetros Específicos:**
    *   `order_by` (Enum): `"id" | "created_at"` (Padrão: `"created_at"`)
    *   `ascending` (Boolean): Ordenação (Padrão: `false`)
    *   `meet_id` (UUID): *Opcional*. Filtra por agendamento específico.
*   **Retorno:**
    Array com: `id, meet_id, user_id, reason_id, description, created_at`

#### `list_pipeline_deal_utms`
Consulta `public.pipeline_deal_utms` (UTMs dos negócios) com filtro rígido por `company_id`.

*   **Parâmetros Específicos:**
    *   `order_by` (Enum): `"id" | "created_at" | "utm_source" | "utm_medium" | "utm_campaign"` (Padrão: `"created_at"`)
    *   `ascending` (Boolean): Ordenação (Padrão: `false`)
    *   `deal_id` (UUID): *Opcional*. Filtra por negócio específico.
*   **Retorno:**
    Array com: `id, company_id, deal_id, utm_id, utm_term, utm_medium, utm_source, utm_content, utm_campaign, created_at`

#### `list_pipeline_deal_quotes`
Consulta `public.pipeline_deal_quotes` (Cotações dos negócios).

*   **Parâmetros Específicos:**
    *   `order_by` (Enum): `"created_at" | "updated_at" | "quoted_price" | "closed_price"` (Padrão: `"created_at"`)
    *   `ascending` (Boolean): Ordenação (Padrão: `false`)
    *   `deal_id` (UUID): *Opcional*. Filtra por negócio específico.
    *   `user_id_filter` (UUID): *Opcional*. Filtra por vendedor específico.
*   **Retorno:**
    Array com: `id, deal_id, product_id, quoted_price, closed_price, user_id, created_at, updated_at, currency`

#### `list_pipeline_deal_quote_payments`
Consulta `public.pipeline_deal_quote_payments` (Pagamentos das cotações).

*   **Parâmetros Específicos:**
    *   `order_by` (Enum): `"created_at" | "value"` (Padrão: `"created_at"`)
    *   `ascending` (Boolean): Ordenação (Padrão: `false`)
    *   `quote_id` (UUID): *Opcional*. Filtra por cotação específica.
*   **Retorno:**
    Array com: `id, quote_id, value, created_at, currency`

#### `list_currencys`
Consulta `public.currencys` (Moedas).

*   **Parâmetros Específicos:**
    *   `order_by` (Enum): `"id" | "code" | "name"` (Padrão: `"code"`)
*   **Retorno:**
    Array com: `id, code, symbol, name`

---

## 5. Exemplo de Implementação (JavaScript / Node.js)

Como chamar a API a partir de outro serviço (ex: um webhook ou agente externo):

```javascript
const response = await fetch("https://mcp-makecrm.vercel.app/api/mcp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // Autenticação Dinâmica Supabase
    "apikey": "sua-anon-key-ou-service-role",
    "Authorization": "Bearer seu-jwt-token"
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "list_users",
      arguments: {
        company_id: "42588322-ece5-490a-b2d6-6e5bf44c8a2e",
        user_id: "059c7843-a23a-46cb-8a74-6a4e066e24ae",
        limit: 5,
        status_filter: true,
        order_by: "created_at",
        ascending: false
      }
    }
  })
});

const data = await response.json();
console.log(data.result.content[0].text); 
// Retorna a string JSON formatada com o array de usuários
```

## 6. Tratamento de Erros

O servidor retorna uma flag `isError: true` no bloco de resultado, ou um objeto de erro JSON-RPC caso haja falha severa.

**Exemplo de Erro de Validação (Schema):**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[\n  {\n    \"field\": \"company_id\",\n    \"message\": \"company_id deve ser um UUID válido\"\n  }\n]"
      }
    ],
    "isError": true
  },
  "id": 1
}
```

**Exemplo de Erro do Banco de Dados:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": false, \"error\": \"relation \\\"public.campaigns\\\" does not exist\"}"
      }
    ],
    "isError": true
  },
  "id": 1
}
```
