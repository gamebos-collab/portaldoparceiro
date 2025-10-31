import React, { useEffect, useRef, useState } from "react";

export default function ChatLayout() {
  const [messages, setMessages] = useState([
    { from: "system", text: "Bem-vindo — envie um arquivo (PDF/DOCX/PNG/JPG/TXT) ou digite sua pergunta." },
  ]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const messagesEnd = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e?.preventDefault();
    if (!text && !file) return;

    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await res.json();
      setMessages((m) => [...m, { from: "user", text: `Enviei arquivo: ${file.name}` }, { from: "ai", text: j.message }]);
      setFile(null);
      return;
    }

    setMessages((m) => [...m, { from: "user", text }]);
    setText("");
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const j = await res.json();
    setMessages((m) => [...m, { from: "ai", text: j.reply }]);
  }

  return (
    <div className="h-screen flex bg-gray-900 text-gray-200">
      <div className="w-20 bg-gray-800 p-4"></div>
      <div className="w-80 border-r border-gray-700 p-4">
        <h2 className="text-xl font-semibold mb-4">Chats</h2>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center">
          <div className="flex items-center gap-3">
            <img src="/logo192.png" className="w-10 h-10 rounded-full" alt="avatar" />
            <div>
              <div className="font-semibold">Assistente B.O.</div>
              <div className="text-sm text-gray-400">Chat</div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {messages.map((m, i) => (
            <div key={i} className={`mb-3 ${m.from === "user" ? "text-right" : "text-left"}`}>
              <div className={`inline-block p-3 rounded ${m.from === "user" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-200"}`} style={{ maxWidth: "75%" }}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={messagesEnd} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-gray-700 flex items-center gap-3">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 bg-gray-800 p-3 rounded" placeholder="Digite uma mensagem" />
          <button type="submit" className="bg-indigo-600 px-4 py-2 rounded">Enviar</button>
        </form>
      </div>
    </div>
  );
}
