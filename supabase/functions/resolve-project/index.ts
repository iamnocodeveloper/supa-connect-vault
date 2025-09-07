import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function fetchJSON(url: string, token: string) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }
  return res.json();
}

function extractAnonKey(data: any): string | null {
  if (Array.isArray(data)) {
    const anon = data.find((k: any) => (k?.name || "").toLowerCase() === "anon");
    if (anon?.api_key) return String(anon.api_key);
  }
  if (typeof data?.anon === "string") return data.anon;
  if (data?.API?.anon) return String(data.API.anon);
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action, ref } = await req.json().catch(() => ({ token: undefined }));
    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ success: false, error: "Missing token" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action === "keys") {
      if (!ref) {
        return new Response(JSON.stringify({ success: false, error: "Missing project ref" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const keys = await fetchJSON(`https://api.supabase.com/v1/projects/${ref}/api-keys`, token);
      const anonKey = extractAnonKey(keys);
      if (!anonKey) {
        return new Response(JSON.stringify({ success: false, error: "Could not retrieve anon key" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      return new Response(JSON.stringify({ success: true, project: { ref, anonKey } }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // default action: list projects
    const projects = await fetchJSON("https://api.supabase.com/v1/projects", token);
    const simplified = Array.isArray(projects)
      ? projects.map((p: any) => ({ ref: p?.ref || p?.project_ref, name: p?.name, status: p?.status }))
      : [];

    return new Response(JSON.stringify({ success: true, projects: simplified }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
