export type JsonRpcResult<T> = { jsonrpc: "2.0"; id: number; result?: T; error?: { code: number; message: string; data?: any } };

export async function bundlerRpc<T>(url: string, method: string, params: any[]): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params })
  });

  const json = (await res.json()) as JsonRpcResult<T>;
  if (json.error) throw new Error(`${method} failed: ${json.error.message}`);
  if (json.result === undefined) throw new Error(`${method} failed: empty result`);
  return json.result;
}

