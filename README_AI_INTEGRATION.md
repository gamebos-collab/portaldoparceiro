# Integração AI - POC (instruções rápidas)

1. Adicione variáveis em .env.local (na raiz do projeto, NÃO comitar):
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - SUPABASE_ANON_KEY
   - HF_TOKEN

2. Instale dependências:
   npm install pdf-parse mammoth tesseract.js @supabase/supabase-js node-fetch form-data

3. Rodar em dev:
   npm run dev

4. Acesse /chat para testar UI.
5. Ajuste a função RPC match_documents no Supabase (veja instruções no painel SQL).