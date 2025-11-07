// API route Next.js - recebe pergunta -> gera embedding -> busca no Supabase (pgvector) -> compõe prompt -> chama HF text-generation
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const HF_TOKEN = process.env.HF_TOKEN;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createEmbedding(text) {
  const url =
    "https://api-inference.huggingface.co/embeddings/sentence-transformers/all-MiniLM-L6-v2";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });
  if (!res.ok) throw new Error("Erro embeddings HF");
  const j = await res.json();
  return j?.[0];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { message } = req.body;
    const qEmb = await createEmbedding(message);

    // Consulta vetor mais próximos no Supabase (pgvector)
    // Usamos RPC via SQL filter: order by embedding <-> ARRAY[...] limit 5
    const vectorStr = "[" + qEmb.join(",") + "]";
    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: qEmb,
      match_count: 5,
    });

    // Se preferir sem RPC, use raw SQL via supabase.from('documents').select(...).limit(...)
    // Vou assumir que você criou uma função RPC chamada match_documents no Supabase (instruções abaixo).

    let contexts = [];
    if (data && data.length) {
      contexts = data.map((r) => r.content).slice(0, 5);
    }

    const prompt = `Você é um assistente que ajuda em tratativas de boletins de ocorrência de transporte. Use as informações abaixo extraídas de documentos para responder:\n\n${contexts.join(
      "\n\n---\n\n"
    )}\n\nPergunta: ${message}\n\nResposta:`;

    // Chamar HF text-generation
    const hfUrl = "https://api-inference.huggingface.co/models/gpt2"; // exemplo simples; substitua por modelo HF apropriado
    const r = await fetch(hfUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 250 },
      }),
    });
    const jr = await r.json();
    const reply =
      jr?.[0]?.generated_text || "Desculpe, não consegui gerar resposta.";

    return res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
