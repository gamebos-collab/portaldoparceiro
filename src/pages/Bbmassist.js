import React, { useMemo, useState, useEffect } from "react";
import {
  FaSearch,
  FaEnvelope,
  FaPhone,
  FaMobileAlt,
  FaStar,
  FaUsers,
  FaBuilding,
  FaRegSmile,
  FaMoon,
  FaSun,
  FaRegCopy,
} from "react-icons/fa";
import "./Bbmassist.css";

/**
 * ContatosTeams - Interface estilo "Microsoft Teams"
 *
 * Arquivo ajustado e pronto para colar:
 * - corrigi o import do CSS (ContatosTeams.css)
 * - adicionei ação de copiar com feedback não intrusivo (toast)
 * - pequenas melhorias de acessibilidade (aria-labels)
 *
 * Substitua/adicione também o arquivo ContatosTeams.css (se ainda não estiver).
 */

// Exemplo de dados — substitua/importe conforme sua fonte real
const contatosData = [
  {
    UNIDADE: "BAU",
    UF: "SP",
    Nome: "Marco Roberto Alves da Silva",
    "CARGO/SETOR": "Gerência",
    "E-MAIL": "marco.silva@translovato.com.br",
    FONE: "(14) 3312-2632",
    CELULAR: "14 99829-8791",
    OBS: "Responsável por operações na região Sul do estado.",
  },
  {
    UNIDADE: "BAU",
    UF: "SP",
    Nome: "Ana Flavia P. Gonçalves Maia",
    "CARGO/SETOR": "Coordenador Adm",
    "E-MAIL": "flavia.maia@translovato.com.br",
    FONE: "(14) 3312-2621",
    CELULAR: "14 99760-4634",
    OBS: "Atendimento administrativo e suporte local.",
  },
  {
    UNIDADE: "CXS",
    UF: "RS",
    Nome: "João Pedro Santos",
    "CARGO/SETOR": "Supervisor",
    "E-MAIL": "joao.santos@translovato.com.br",
    FONE: "(51) 3344-2200",
    CELULAR: "51 99988-7766",
    OBS: "Supervisor de rota - atende POA e região metropolitana.",
  },
  {
    UNIDADE: "POA",
    UF: "RS",
    Nome: "Mariana Lopes",
    "CARGO/SETOR": "Analista",
    "E-MAIL": "mariana.lopes@translovato.com.br",
    FONE: "(51) 3344-2211",
    CELULAR: "51 98877-6655",
    OBS: "Contato para questões de faturamento.",
  },
];

// Helper: cria iniciais para avatar
const initials = (name) => {
  if (!name) return "";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Helper: cor randômica consistente por string (para avatar color)
const stringToColor = (s) => {
  if (!s) return "#445"; // fallback
  let hash = 0;
  for (let i = 0; i < s.length; i++)
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 60% 50%)`;
};

export default function ContatosTeams() {
  const [query, setQuery] = useState("");
  const [filterUF, setFilterUF] = useState("");
  const [filterUnidade, setFilterUnidade] = useState("");
  const [selected, setSelected] = useState(null);
  const [favorite, setFavorite] = useState({}); // map nome -> true
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState(null);

  // valores distintos para filtros
  const ufs = useMemo(() => [...new Set(contatosData.map((c) => c.UF))], []);
  const unidades = useMemo(
    () => [...new Set(contatosData.map((c) => c.UNIDADE))],
    []
  );

  // pesquisa simples
  const resultados = useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    return contatosData
      .filter((c) => (filterUF ? c.UF === filterUF : true))
      .filter((c) => (filterUnidade ? c.UNIDADE === filterUnidade : true))
      .filter((c) => {
        if (!q) return true;
        return (
          c.Nome.toLowerCase().includes(q) ||
          (c["CARGO/SETOR"] || "").toLowerCase().includes(q) ||
          (c["E-MAIL"] || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // favoritos no topo
        const fa = favorite[a.Nome] ? 0 : 1;
        const fb = favorite[b.Nome] ? 0 : 1;
        if (fa !== fb) return fa - fb;
        return a.Nome.localeCompare(b.Nome);
      });
  }, [query, filterUF, filterUnidade, favorite]);

  const toggleFav = (nome) => {
    setFavorite((p) => ({ ...p, [nome]: !p[nome] }));
  };

  // actions
  const handleCall = (phone) => {
    try {
      window.location.href = `tel:${phone.replace(/\D/g, "")}`;
    } catch {
      // ignore
    }
  };
  const handleMail = (email) => {
    try {
      window.location.href = `mailto:${email}`;
    } catch {
      // ignore
    }
  };
  const handleCopy = async (text, label = "Texto copiado") => {
    try {
      await navigator.clipboard.writeText(String(text || ""));
      setToast(label);
    } catch {
      setToast("Falha ao copiar");
    }
  };

  // auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div
      className={`teams-wrap ${dark ? "dark" : ""}`}
      data-theme={dark ? "dark" : "light"}
    >
      {/* Toast */}
      {toast && (
        <div className="ct-toast" role="status">
          {toast}
        </div>
      )}

      {/* LEFT: Sidebar */}
      <aside className="teams-sidebar" aria-label="Navegação">
        <div className="teams-brand">
          <div className="teams-logo" aria-hidden>
            T
          </div>
          <div className="teams-title">
            KPI Parceiro
            <div className="teams-sub">Contatos</div>
          </div>
        </div>

        <nav className="teams-nav" aria-label="Menu principal">
          <button className="nav-item active" aria-pressed="true">
            <FaUsers aria-hidden /> Equipe
          </button>
          <button className="nav-item" aria-pressed="false">
            <FaStar aria-hidden /> Favoritos
          </button>
          <button className="nav-item" aria-pressed="false">
            <FaBuilding aria-hidden /> Unidades
          </button>
        </nav>

        <div className="teams-footer">
          <button
            className="theme-toggle"
            onClick={() => setDark((d) => !d)}
            title="Alternar tema"
            aria-label="Alternar tema"
          >
            {dark ? <FaSun /> : <FaMoon />}
          </button>
          <div className="help-chip" role="button" tabIndex={0}>
            <FaRegSmile /> Ajuda
          </div>
        </div>
      </aside>

      {/* CENTER: Lista de contatos */}
      <main className="teams-main" aria-live="polite">
        <div className="teams-searchbar">
          <div className="search-left">
            <FaSearch className="search-icon" aria-hidden />
            <input
              aria-label="Pesquisar contatos"
              placeholder="Pesquisar por nome, cargo ou e-mail"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                className="clear-query"
                onClick={() => setQuery("")}
                title="Limpar pesquisa"
                aria-label="Limpar pesquisa"
              >
                ✕
              </button>
            )}
          </div>

          <div className="filters-right">
            <select
              aria-label="Filtrar por UF"
              value={filterUF}
              onChange={(e) => setFilterUF(e.target.value)}
            >
              <option value="">Todas UFs</option>
              {ufs.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtrar por Unidade"
              value={filterUnidade}
              onChange={(e) => setFilterUnidade(e.target.value)}
            >
              <option value="">Todas Unidades</option>
              {unidades.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="teams-list" role="list">
          {resultados.length === 0 ? (
            <div className="teams-empty">
              <div className="teams-empty-emoji" aria-hidden>
                🔍
              </div>
              <div className="teams-empty-text">Nenhum contato encontrado</div>
            </div>
          ) : (
            resultados.map((c, i) => (
              <div
                key={c.Nome + i}
                className={`contact-card ${
                  selected && selected.Nome === c.Nome ? "selected" : ""
                }`}
                onClick={() => setSelected(c)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelected(c)}
                style={{ animationDelay: `${i * 45}ms` }}
                title={`${c.Nome} — ${c["CARGO/SETOR"]}`}
                aria-label={`Contato ${c.Nome}`}
              >
                <div
                  className="avatar"
                  style={{ backgroundColor: stringToColor(c.Nome) }}
                  aria-hidden
                >
                  {initials(c.Nome)}
                </div>
                <div className="contact-meta">
                  <div className="contact-top">
                    <div className="contact-name">{c.Nome}</div>
                    <div className="contact-unidade" aria-hidden>
                      {c.UNIDADE}
                    </div>
                  </div>
                  <div className="contact-bottom">
                    <div className="contact-role">{c["CARGO/SETOR"]}</div>
                    <div className="contact-uf" aria-hidden>
                      {c.UF}
                    </div>
                  </div>
                </div>

                <div className="contact-actions" aria-hidden>
                  <button
                    className={`fav-btn ${favorite[c.Nome] ? "fav" : ""}`}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      toggleFav(c.Nome);
                    }}
                    title="Favoritar"
                    aria-label={`Favoritar ${c.Nome}`}
                  >
                    <FaStar />
                  </button>

                  <button
                    className="action"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleMail(c["E-MAIL"]);
                    }}
                    title="Enviar e-mail"
                    aria-label={`Enviar e-mail para ${c["E-MAIL"]}`}
                  >
                    <FaEnvelope />
                  </button>

                  <button
                    className="action"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleCall(c.CELULAR);
                    }}
                    title="Ligar"
                    aria-label={`Ligar para ${c.CELULAR}`}
                  >
                    <FaPhone />
                  </button>

                  <button
                    className="action copy-btn"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleCopy(c["E-MAIL"], "E-mail copiado");
                    }}
                    title="Copiar e-mail"
                    aria-label={`Copiar e-mail ${c["E-MAIL"]}`}
                  >
                    <FaRegCopy />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* RIGHT: Detalhes do contato */}
      <aside className="teams-details" aria-label="Detalhes do contato">
        {selected ? (
          <div className="details-card">
            <div className="details-top">
              <div
                className="avatar-large"
                style={{ backgroundColor: stringToColor(selected.Nome) }}
                aria-hidden
              >
                {initials(selected.Nome)}
              </div>
              <div className="details-meta">
                <h3>{selected.Nome}</h3>
                <div className="details-role">{selected["CARGO/SETOR"]}</div>
                <div className="details-sub">
                  {selected.UNIDADE} • {selected.UF}
                </div>
              </div>
            </div>

            <div className="details-actions">
              <button
                onClick={() => handleMail(selected["E-MAIL"])}
                className="primary"
                aria-label={`Enviar email para ${selected["E-MAIL"]}`}
              >
                <FaEnvelope /> Enviar e-mail
              </button>
              <button
                onClick={() => handleCall(selected.CELULAR)}
                className="outline"
                aria-label={`Ligar para ${selected.CELULAR}`}
              >
                <FaMobileAlt /> Ligar (celular)
              </button>
              <button
                onClick={() => handleCall(selected.FONE)}
                className="outline"
                aria-label={`Ligar para ${selected.FONE}`}
              >
                <FaPhone /> Ligar (fixo)
              </button>
            </div>

            <div className="details-info" aria-live="polite">
              <div className="info-row">
                <div className="label">E-mail</div>
                <div className="value">{selected["E-MAIL"]}</div>
              </div>
              <div className="info-row">
                <div className="label">Telefone</div>
                <div className="value">{selected.FONE}</div>
              </div>
              <div className="info-row">
                <div className="label">Celular</div>
                <div className="value">{selected.CELULAR}</div>
              </div>
              <div className="info-row">
                <div className="label">Observações</div>
                <div className="value">{selected.OBS || "—"}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="details-empty">
            <div className="empty-illustr" aria-hidden>
              👥
            </div>
            <div className="empty-title">Selecione um contato</div>
            <div className="empty-sub">
              Clique em qualquer contato para ver os detalhes aqui.
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
