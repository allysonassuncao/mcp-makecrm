export const config = {
  runtime: 'edge',
};

export default async function handler() {
  const healthData = {
    status: 'online',
    server: 'Supabase MCP Server',
    endpoints: {
      mcp: '/api/mcp'
    },
    message: 'Este é um servidor MCP (Model Context Protocol). Use o endpoint /api/mcp para requisições JSON-RPC.'
  };

  return new Response(JSON.stringify(healthData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
