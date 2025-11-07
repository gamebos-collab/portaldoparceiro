// Atualizado para integrar com as rotas /api/upload e /api/chat
// ⚠️ Modo de Desenvolvimento: Exibe overlay que bloqueia toda a página exceto a barra de menus superior.
// Para liberar a barra, ajuste o valor do "top" para a altura exata da sua barra de menus (ex: 84px), e ajuste a transparência alterando o último número do rgba.
import React, { useEffect, useRef, useState } from "react";
import {
  FaPaperPlane,
  FaPaperclip,
  FaImage,
  FaFilePdf,
  FaTrashAlt,
  FaSpinner,
  FaUserCircle,
  FaEdit,
} from "react-icons/fa";
import "./Bbmassist.css";

/* keys/localStorage */
const STORAGE_KEY = "bbmassist_chat_history_v1";
const STORAGE_NAME_KEY = "bbm_user_name";

function formatTime(ts = Date.now()) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function initialsFromName(name) {
  if (!name) return "EU";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* Tenta detectar um nome do usuário do dispositivo / ambiente */
function detectDeviceUsername() {
  try {
    if (typeof window !== "undefined" && window.__BBM_USERNAME__) {
      const v = String(window.__BBM_USERNAME__);
      if (v && v.trim()) return v.trim();
    }

    if (typeof process !== "undefined" && process && process.env) {
      const env = process.env;
      const candidate = env.USERNAME || env.USER || env.LOGNAME;
      if (candidate && candidate.trim()) return String(candidate).trim();
    }

    if (
      typeof window !== "undefined" &&
      window.electronAPI &&
      window.electronAPI.username
    ) {
      return String(window.electronAPI.username).trim();
    }
  } catch (e) {}
  return null;
}

/* Modal para pedir o nome do usuário (caso não detectado) */
function NamePrompt({ defaultName, onSave, onCancel }) {
  const [val, setVal] = useState(defaultName || "");
  return (
    <div className="bbm-nameprompt-overlay" role="dialog" aria-modal="true">
      <div className="bbm-nameprompt">
        <h3>Como deseja ser chamado?</h3>
        <p>
          Para personalizar a conversa, informe seu nome (será salvo
          localmente).
        </p>
        <input
          aria-label="Seu nome"
          placeholder="Digite seu nome"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <div className="bbm-nameprompt-actions">
          <button className="btn-ghost" onClick={() => onCancel && onCancel()}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={() => onSave(val.trim() || "Você")}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Bbmassist() {
  // Overlay de "em desenvolvimento"
  const [developmentOverlay, setDevelopmentOverlay] = useState(true);

  useEffect(() => {
    if (developmentOverlay) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    // Limpa ao desmontar:
    return () => {
      document.body.style.overflow = "";
    };
  }, [developmentOverlay]);

  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
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

  const [userName, setUserName] = useState(() => {
    try {
      const detected = detectDeviceUsername();
      if (detected) return detected;
    } catch {}
    try {
      const ls = localStorage.getItem(STORAGE_NAME_KEY);
      if (ls) return ls;
    } catch {}
    return null;
  });
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  useEffect(() => {
    if (!userName) {
      const t = setTimeout(() => setShowNamePrompt(true), 600);
      return () => clearTimeout(t);
    }
  }, [userName]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        handleSend();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [input, messages, userName]);

  const pushMessage = (msg) => {
    setMessages((cur) => [...cur, msg]);
  };

  // APIs:
  const simulateAssistantReply = async (userText, attachments = []) => {
    setIsTyping(true);
    try {
      // 1) se existirem anexos, envie-os para /api/upload (em lote)
      if (attachments && attachments.length) {
        setUploading(true);
        try {
          const fd = new FormData();
          attachments.forEach((att) => {
            if (att.file) fd.append("file", att.file, att.name);
            else if (att instanceof File) fd.append("file", att, att.name);
          });
          const upResp = await fetch("/api/upload", {
            method: "POST",
            body: fd,
          });
          const upJson = await upResp.json();
          pushMessage({
            id: makeId(),
            role: "assistant",
            text: upJson?.message || "Arquivo processado e indexado.",
            time: Date.now(),
            attachments: [],
          });
        } catch (e) {
          pushMessage({
            id: makeId(),
            role: "assistant",
            text: "Falha ao enviar arquivo para indexação: " + e.message,
            time: Date.now(),
            attachments: [],
          });
        } finally {
          setUploading(false);
        }
      }

      // 2) chamar /api/chat para gerar a resposta com contexto
      const payload = { message: userText };
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await resp.json();
      const replyText =
        json?.reply || "Desculpe, não obtive resposta do serviço de IA.";
      pushMessage({
        id: makeId(),
        role: "assistant",
        text: replyText,
        time: Date.now(),
        attachments: [],
      });
    } catch (e) {
      pushMessage({
        id: makeId(),
        role: "assistant",
        text: "Erro ao contatar o serviço de AI: " + (e.message || e),
        time: Date.now(),
        attachments: [],
      });
    } finally {
      setIsTyping(false);
      setUploading(false);
    }
  };

  const generateAssistantReply = (userText, attachments) => {
    simulateAssistantReply(userText, attachments);
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
      senderName: userName || "Você",
    };
    pushMessage(msg);
    setInput("");
    await simulateAssistantReply(text, []);
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);

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

    const msg = {
      id: makeId(),
      role: "user",
      text:
        processed.length === 1 && !input
          ? `Enviei: ${processed[0].name}`
          : input.trim() || "",
      time: Date.now(),
      attachments: processed,
      senderName: userName || "Você",
    };
    pushMessage(msg);
    setInput("");
    await simulateAssistantReply(
      msg.text || "Analise os arquivos enviados.",
      processed
    );
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

  const saveUserName = (name) => {
    const final = name && name.trim() ? name.trim() : null;
    if (final) {
      setUserName(final);
      try {
        localStorage.setItem(STORAGE_NAME_KEY, final);
      } catch {}
    }
    setShowNamePrompt(false);
  };

  // ⚠️ Overlay de desenvolvimento: libera o topo (menu), bloqueia o resto com fundo translúcido
  // Para sua barra ficar acessível, ajuste o valor de "top" para a altura exata da sua barra.
  // Para alterar a transparência, ajuste o último valor do rgba abaixo.
  return (
    <div style={{ position: "relative" }}>
      {/* Overlay de desenvolvimento, cobrindo tudo menos a barra do topo */}
      {developmentOverlay && (
        <div
          style={{
            position: "fixed",
            zIndex: 9999,
            top: "150px", // <<< ajuste AQUI para altura exata da sua barra de menus
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255, 255, 255, 0.00)", // <<< ajuste AQUI valor de 0.0 até 1.0 (mais transparente/menos)
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "auto",
            userSelect: "none",
          }}
          aria-modal="true"
          role="dialog"
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
              padding: "40px 24px",
              maxWidth: 400,
              textAlign: "center",
              border: "2px solid #0057b3",
              opacity: 0.98,
            }}
          >
            <h2 style={{ color: "#0057b3", marginBottom: 12 }}>
              BBM Assist em desenvolvimento
            </h2>
            <p style={{ fontSize: 18, marginBottom: 28 }}>
              Esta funcionalidade ainda está em desenvolvimento e não pode ser
              utilizada no momento.
            </p>
            <p style={{ color: "#888", fontSize: 14 }}>
              Utilize o menu superior para navegar para outra página.
            </p>
          </div>
        </div>
      )}

      {/* Conteúdo normal do componente, bloqueado quando overlay estiver ativo */}
      <div
        style={
          developmentOverlay
            ? {
                filter: "blur(2px)",
                pointerEvents: "none",
                userSelect: "none",
                opacity: 0.5,
              }
            : {}
        }
        aria-hidden={developmentOverlay ? "true" : undefined}
      >
        {showNamePrompt && !userName && (
          <NamePrompt
            defaultName=""
            onSave={(v) => saveUserName(v || "Você")}
            onCancel={() => setShowNamePrompt(false)}
          />
        )}

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
              <div className="assistant-avatar">BBM</div>
              <div>
                <div className="assistant-name">BBM Assist</div>
                <div className="assistant-status">
                  <strong>{isTyping ? "Digitando..." : "Online"}</strong>
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
                <div
                  className="msg-avatar"
                  aria-hidden
                  title={
                    m.role === "user"
                      ? m.senderName || userName || "Você"
                      : "BBM Assist"
                  }
                >
                  {m.role === "user" ? (
                    <div className="avatar-user">
                      {initialsFromName(m.senderName || userName || "Você")}
                    </div>
                  ) : (
                    <div className="avatar-assistant">BBM</div>
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
                  <div className="avatar-assistant">BBM</div>
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
                accept="image/*,.pdf,.docx,.txt"
                multiple
                style={{ display: "none" }}
                onChange={handleFileInputChange}
              />
              <button
                className="composer-btn"
                onClick={() => {
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
                  {uploading ? (
                    <FaSpinner className="spin" />
                  ) : (
                    <FaPaperPlane />
                  )}
                </button>
              </div>
            </div>
          </footer>
        </section>

        <aside className="bbm-right">
          <div className="bbm-right-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h4>BBM Assist</h4>
              <button
                title="Editar nome de usuário"
                className="icon-edit"
                onClick={() => setShowNamePrompt(true)}
                aria-label="Editar nome"
              >
                <FaEdit />
              </button>
            </div>
            <p>
              BBM Assist é a inteligência artificial capaz de ajudar em análises
              de B.Os através do batepapo de envio de perguntas e respostas.
              Envie arquivos PDF, imagens e texto para que eu analise.
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
    </div>
  );
}
