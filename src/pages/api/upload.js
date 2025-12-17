import formidable from "formidable";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HF_TOKEN = process.env.HF_TOKEN;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function extractText(filePath, mimeType) {
  if (mimeType === "application/pdf") {
    const data = fs.readFileSync(filePath);
    const pdf = await pdfParse(data);
    return pdf.text;
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  if (mimeType.startsWith("text/")) {
    return fs.readFileSync(filePath, "utf8");
  }
  const { data: { text } } = await Tesseract.recognize(filePath, "por");
  return text;
}

async function createEmbedding(text) {
  const url = "https://api-inference.huggingface.co/embeddings/sentence-transformers/all-MiniLM-L6-v2";
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: text }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error("HF Embeddings error: " + t);
  }
  const j = await res.json();
  return j?.[0];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Erro no upload" });
    try {
      const file = files.file;
      const filePath = file.filepath || file.path;
      const mime = file.mimetype || file.type || "application/octet-stream";
      const originalName = file.originalFilename || file.name;

      // Validate file path exists and is accessible
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(400).json({ error: "Arquivo inválido" });
      }

      // Ensure the path is absolute to prevent directory traversal
      const absolutePath = path.resolve(filePath);
      
      const text = await extractText(absolutePath, mime);
      const chunks = text.match(/(.|[\r\n]){1,1200}/g) || [text];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const emb = await createEmbedding(chunk);
        const { error } = await supabase.from("documents").insert([
          {
            title: originalName,
            content: chunk,
            metadata: { filename: originalName, chunk_index: i },
            embedding: emb,
          },
        ]);
        if (error) console.error("Supabase insert error:", error);
      }

      return res.status(200).json({ ok: true, message: "Arquivo processado e indexado." });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  });
}
