import React, { useEffect, useRef, useState } from "react";
import {
  FaPaperPlane,
  FaPaperclip,
  FaImage,
  FaFilePdf,
  FaSmile,
  FaTrashAlt,
  FaSpinner,
  FaUserCircle,
} from "react-icons/fa";
import "./Bbmassist.css";

/**
 * Bbmassist Chat (UI inspirado no Microsoft Teams)
 *
 * Recursos implementados:
 * - Janela de conversa com cabeçalho (BBM Assist), histórico de mensagens
 * - Enviar mensagens de texto
 * - Enviar arquivos: imagens (preview in-line) e PDFs (link / thumbnail)
 * - Drag & drop de arquivos sobre a área de mensagem
 * - Rascunho persistido no localStorage (por aba)
 * - Simulação de resposta da IA (com "digitando..." e resposta por setTimeout) — substitua pela sua API
 * - Acessibilidade básica e visual fiel à paleta azul/amarelo já usada no projeto
 *
 * Uso: cole como src/pages/Bbmassist.js e o CSS (arquivo abaixo) como src/pages/Bbmassist.css
 */

const STORAGE_KEY = "bbmassist_chat_history_v1";

function formatTime(ts = Date.now()) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function Bbmassist() {
  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    // seed: welcome from assistant
    return [
      {
        id: makeId(),
        role: "assistant",
        text: "Olá! Eu sou o BBM Assist — como posso ajudar hoje? Você pode enviar texto, PDFs ou imagens.",
        time: Date.now(),
        attachments: [],
      },
    ];
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // persist chat
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
    // scroll to bottom on update
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  useEffect(() => {
    // keyboard shortcut: Ctrl+Enter to send
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        handleSend();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [input]);

  const pushMessage = (msg) => {
    setMessages((cur) => [...cur, msg]);
  };

  const simulateAssistantReply = (userText, attachments = []) => {
    setIsTyping(true);
    // simulate "thinking/typing" time based on length
    const delay = Math.min(2200 + userText.length * 20, 6000);

    setTimeout(() => {
      // simple echo + metadata; replace with API call to AI
      const replyText = generateAssistantReply(userText, attachments);
      pushMessage({
        id: makeId(),
        role: "assistant",
        text: replyText,
        time: Date.now(),
        attachments: [],
      });
      setIsTyping(false);
    }, delay);
  };

  const generateAssistantReply = (userText, attachments) => {
    // Basic simulated reply; customize or replace with real AI integration.
    let r = "";
    if (attachments && attachments.length) {
      const types = attachments.map((a) => a.type).join(", ");
      r += `Recebi ${attachments.length} anexo(s) (${types}). `;
    }
    if (userText && userText.trim()) {
      r += `Você escreveu: "${userText.trim().slice(0, 240)}". `;
    }
    r +=
      "Posso procurar informações, gerar relatórios e anexar links úteis. Quer que eu envie um resumo por e-mail ou deseja continuar aqui?";
    return r;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    const msg = {
      id: makeId(),
      role: "user",
      text,
      time: Date.now(),
      attachments: [],
    };
    pushMessage(msg);
    setInput("");
    simulateAssistantReply(text, []);
  };

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);

    // process files (image preview or pdf blob)
    const processed = files.map((file) => {
      const isImage = file.type.startsWith("image/");
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      const id = makeId();
      const url = URL.createObjectURL(file);
      return {
        id,
        name: file.name,
        size: file.size,
        type: isImage ? "image" : isPdf ? "pdf" : "file",
        file,
        url,
      };
    });

    // create a user message containing attachments
    const msg = {
      id: makeId(),
      role: "user",
      text:
        processed.length === 1 && !input
          ? `Enviei: ${processed[0].name}`
          : input.trim() || "",
      time: Date.now(),
      attachments: processed,
    };
    pushMessage(msg);
    setInput("");
    setUploading(false);

    // simulate assistant reading attachments
    simulateAssistantReply(msg.text, processed);
  };

  const onDrop = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    setDragOver(false);
    const dt = ev.dataTransfer;
    if (dt && dt.files && dt.files.length) {
      handleFiles(dt.files);
    }
  };

  const onDragOver = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    setDragOver(true);
  };

  const onDragLeave = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    setDragOver(false);
  };

  const handlePickFile = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileInputChange = (ev) => {
    const files = ev.target.files;
    if (files && files.length) {
      handleFiles(files);
    }
    // reset so same file can be picked again
    ev.target.value = "";
  };

  const handleClearConversation = () => {
    if (!window.confirm("Limpar todo o histórico de conversa?")) return;
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const removeAttachmentFromMessage = (msgId, attId) => {
    setMessages((cur) =>
      cur.map((m) =>
        m.id === msgId
          ? { ...m, attachments: m.attachments.filter((a) => a.id !== attId) }
          : m
      )
    );
  };

  const renderAttachment = (att) => {
    if (att.type === "image") {
      return (
        <div className="bbm-attachment-image" key={att.id}>
          <img src={att.url} alt={att.name} />
          <div className="bbm-attachment-meta">
            <div className="bbm-attachment-name">{att.name}</div>
            <a
              href={att.url}
              download={att.name}
              className="bbm-attachment-download"
            >
              Baixar
            </a>
          </div>
        </div>
      );
    }
    if (att.type === "pdf") {
      return (
        <div className="bbm-attachment-file" key={att.id}>
          <div className="pdf-icon">
            <FaFilePdf />
          </div>
          <div className="bbm-attachment-meta">
            <div className="bbm-attachment-name">{att.name}</div>
            <a
              href={att.url}
              target="_blank"
              rel="noreferrer"
              className="bbm-attachment-download"
            >
              Abrir
            </a>
          </div>
        </div>
      );
    }
    // generic fallback
    return (
      <div className="bbm-attachment-file" key={att.id}>
        <div className="pdf-icon">📎</div>
        <div className="bbm-attachment-meta">
          <div className="bbm-attachment-name">{att.name}</div>
          <a
            href={att.url}
            download={att.name}
            className="bbm-attachment-download"
          >
            Baixar
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="bbmassist-page">
      <aside className="bbm-left">
        <div className="bbm-left-header">
          <div className="bbm-left-title">BBM Assist</div>
          <div className="bbm-left-sub">Assistente Inteligente</div>
        </div>

        <div className="bbm-conversations">
          <div className="conv-item active">
            <div className="conv-avatar">
              <FaUserCircle />
            </div>
            <div className="conv-meta">
              <div className="conv-name">BBM Assist</div>
              <div className="conv-last">
                Estou aqui para ajudar — clique e mande sua pergunta.
              </div>
            </div>
          </div>
        </div>

        <div className="bbm-left-footer">
          <button
            className="btn-ghost"
            onClick={handleClearConversation}
            title="Limpar conversa"
          >
            <FaTrashAlt /> Limpar conversa
          </button>
        </div>
      </aside>

      <section
        className={`bbm-chat ${dragOver ? "drag-over" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <header className="bbm-chat-header">
          <div className="assistant-info">
            <div className="assistant-avatar">BB</div>
            <div>
              <div className="assistant-name">BBM Assist</div>
              <div className="assistant-status">
                {isTyping ? "Digitando..." : "Online"}
              </div>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={() => alert("Compartilhar conversa (em breve)")}
            >
              Compartilhar
            </button>
          </div>
        </header>

        <div className="bbm-messages" aria-live="polite">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`bbm-message ${
                m.role === "user" ? "from-user" : "from-assistant"
              }`}
            >
              <div className="msg-avatar" aria-hidden>
                {m.role === "user" ? (
                  <div className="avatar-user">EU</div>
                ) : (
                  <div className="avatar-assistant">BB</div>
                )}
              </div>

              <div className="msg-body">
                <div className="msg-bubble">
                  {m.text && <div className="msg-text">{m.text}</div>}

                  {m.attachments && m.attachments.length > 0 && (
                    <div className="msg-attachments">
                      {m.attachments.map((att) => (
                        <div key={att.id} className="msg-attachment">
                          {renderAttachment(att)}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="msg-meta">
                    <span className="msg-time">{formatTime(m.time)}</span>
                    <button
                      className="small-icon"
                      title="Remover anexo"
                      onClick={() => {
                        // remove the first attachment in the message (example)
                        if (m.attachments && m.attachments.length)
                          removeAttachmentFromMessage(
                            m.id,
                            m.attachments[0].id
                          );
                      }}
                      aria-hidden
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="bbm-message from-assistant typing">
              <div className="msg-avatar">
                <div className="avatar-assistant">BB</div>
              </div>
              <div className="msg-body">
                <div className="msg-bubble">
                  <div className="typing-dots" aria-hidden>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <footer className="bbm-composer">
          <div className="composer-actions">
            <button
              className="composer-btn"
              onClick={handlePickFile}
              title="Anexar arquivo (imagens / pdf)"
            >
              <FaPaperclip /> <span className="composer-label">Anexar</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              style={{ display: "none" }}
              onChange={handleFileInputChange}
            />
            <button
              className="composer-btn"
              onClick={() => {
                // quick insert example image (demo)
                alert(
                  "Inserir imagem de demo (use anexar para enviar arquivos reais)."
                );
              }}
              title="Inserir exemplo"
            >
              <FaImage /> <span className="composer-label">Imagem</span>
            </button>
          </div>

          <div className="composer-input-wrap">
            <textarea
              aria-label="Escreva sua mensagem"
              placeholder="Escreva uma mensagem para o BBM Assist (Ctrl/Cmd+Enter para enviar)…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  handleSend();
                }
              }}
            />
            <div className="composer-actions-right">
              <button
                className="send-btn"
                onClick={handleSend}
                title="Enviar (Ctrl/Cmd+Enter)"
                aria-label="Enviar mensagem"
                disabled={!input.trim() && !uploading}
              >
                {uploading ? <FaSpinner className="spin" /> : <FaPaperPlane />}
              </button>
            </div>
          </div>
        </footer>
      </section>

      <aside className="bbm-right">
        <div className="bbm-right-card">
          <h4>BBM Assist</h4>
          <p>
            BBM Assist é a inteligência artificial capaz de ajudar em análises
            de B.Os através do batepapo de envio de perguntas e respostas. Envie
            arquivos PDF, imagens e texto para que eu analise.
          </p>
          <dl>
            <dt>Suporta:</dt>
            <dd>Mensagens de texto, imagens (jpg/png) e PDFs</dd>
            <dt>Atalhos:</dt>
            <dd>Ctrl/Cmd + Enter para enviar</dd>
          </dl>
          <div className="bbm-right-actions">
            <button
              className="btn-primary"
              onClick={() => alert("Instruções rápidas: escreva e envie.")}
            >
              Como usar
            </button>
            <button
              className="btn-ghost"
              onClick={() => alert("Exportar conversa (em breve)")}
            >
              Exportar
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
