// Supabase Edge Function: resolve-project
// Purpose: Accepts a Supabase experimental token (PAT) from the client,
// queries the Supabase Management API to find the user's projects and
// returns a chosen project's ref and anon key so the client can connect
// to the REST API using public credentials. No secrets are stored.

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
  // Try multiple possible shapes from Management API responses
  // 1) keys array: [{ name: 'anon', api_key: '...' }, ...]
  if (Array.isArray(data?.keys)) {
    const anon = data.keys.find((k: any) => (k?.name || "").toLowerCase() === "anon");
    if (anon?.api_key) return String(anon.api_key);
  }
  // 2) direct fields
  if (typeof data?.anon === "string") return data.anon;
  if (data?.API?.anon) return String(data.API.anon);
  // 3) search recursively for a property named 'anon'
  try {
    const stack = [data];
    while (stack.length) {
      const node = stack.pop();
      if (node && typeof node === "object") {
        for (const [k, v] of Object.entries(node)) {
          if (k.toLowerCase() === "anon" && typeof v === "string") return v;
          if (v && typeof v === "object") stack.push(v as any);
        }
      }
    }
  } catch (_) {
    // ignore
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...corsHeaders } });
  }

  try {
    const { token } = await req.json().catch(() => ({ token: undefined }));
    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Missing token" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 1) List projects for this token
    const projects = await fetchJSON("https://api.supabase.com/v1/projects", token);
    if (!Array.isArray(projects) || projects.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No projects found for this token" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Prefer active projects; else fallback to first.
    const active = projects.find((p: any) => (p?.status || "").toLowerCase() === "active") || projects[0];
    const ref = String(active?.ref || active?.project_ref || "");
    const name = String(active?.name || "");

    if (!ref) {
      return new Response(
        JSON.stringify({ success: false, error: "Project ref not found in response" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2) Fetch API keys for the chosen project
    let anonKey: string | null = null;
    try {
      const keys = await fetchJSON(`https://api.supabase.com/v1/projects/${ref}/api-keys`, token);
      anonKey = extractAnonKey(keys);
    } catch (_) {
      // fallback to try settings
      try {
        const settings = await fetchJSON(`https://api.supabase.com/v1/projects/${ref}/settings`, token);
        anonKey = extractAnonKey(settings);
      } catch (_) {
        // keep null
      }
    }

    if (!anonKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Could not retrieve anon key for project" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, project: { ref, name, anonKey } }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
