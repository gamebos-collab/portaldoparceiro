import React, { useEffect, useMemo, useState } from "react";

/**
 * Página: /detalhes-centralizadora
 * Atualizada:
 * - Ordena criticidade a partir da coluna "Faixa Score" (quando existir) com fallback para "Criticidade".
 * - Escala: Crítico > Alto > Médio > Baixo.
 * - Pinta linha inteira em vermelho quando nível for Crítico.
 * - Título dinâmico com nome da centralizadora (muda ao passar mouse sobre a linha).
 * - Texto centralizado; coluna Cliente sem quebra (ellipsis + tooltip).
 * - Datas formatadas e Notas Fiscais cortadas até '/'.
 */

/* ----------------------
   Colunas a extrair (ordem de exibição)
   Ajuste os nomes conforme as chaves esperadas no localStorage
   ---------------------- */
const SELECTED_COLUMNS = [
  "BO",
  "Nr Ct",
  "Emissão Ct",
  "Ocorrência",
  "Parecer",
  "Dt Parecer",
  "Dias Aberto",
  "Resp",
  "Centralizadora",
  "Vlr NF",
  "Cliente",
  "Notas Fiscais",
  "Faixa Score",
];

/* ----------------------
   Rótulos exibidos (personalizáveis)
   ---------------------- */
const DISPLAY_NAMES = {
  BO: "B.O",
  "Nr Ct": "CT-e",
  "Emissão Ct": "Emissão CT",
  Ocorrência: "Ocorrência",
  Parecer: "Parecer",
  "Dt Parecer": "Data Parecer",
  "Dias Aberto": "Dias Aberto",
  Resp: "Responsável",
  Centralizadora: "Centralizadora",
  "Vlr NF": "Valor NF",
  Cliente: "Cliente",
  "Notas Fiscais": "Notas Fiscais",
  FaixaScore: "Criticidade",
};

/* ----------------------
   Nome da coluna no banco que contém a criticidade preferencial
   ---------------------- */
const FAIXA_SCORE_FIELD = "Faixa Score";

/* ----------------------
   Utilitários
   ---------------------- */
function normalizeKey(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function excelSerialToDateString(serial) {
  try {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(
      excelEpoch.getTime() + Math.round(serial) * 24 * 60 * 60 * 1000
    );
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return String(serial);
  }
}

function parseDateStringToDDMMYYYY(s) {
  if (!s) return null;
  const str = String(s).trim();
  const ddmmyyyy = /^(\d{1,2})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{2,4})$/;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/;
  let m = str.match(ddmmyyyy);
  if (m) {
    let d = m[1].padStart(2, "0");
    let mo = m[2].padStart(2, "0");
    let yy = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${d}/${mo}/${yy}`;
  }
  m = str.match(iso);
  if (m) {
    return `${m[3]}/${m[2]}/${m[1]}`;
  }
  const dt = new Date(str);
  if (!isNaN(dt.getTime())) {
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return null;
}

function extractBeforeSlash(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  const i = s.indexOf("/");
  if (i === -1) return s.trim();
  return s.slice(0, i).trim();
}

function formatCellValueByColumn(col, rawValue) {
  if (rawValue === null || rawValue === undefined) return "";
  const dateCols = new Set(["Emissão", "Emissão Ct", "Dt Parecer"]);
  if (dateCols.has(col)) {
    if (typeof rawValue === "number") {
      return excelSerialToDateString(rawValue);
    }
    if (typeof rawValue === "string") {
      const parsed = parseDateStringToDDMMYYYY(rawValue);
      if (parsed) return parsed;
      return rawValue.trim();
    }
    return String(rawValue);
  }

  if (col === "Notas Fiscais") {
    return extractBeforeSlash(rawValue);
  }

  return String(rawValue).trim();
}

/* Criticidade ordering helper (1 best/critical) */
function criticidadeOrderValue(val) {
  if (!val && val !== 0) return 99;
  const n = normalizeKey(String(val));
  if (n.includes("crit")) return 1; // crítico
  if (n.includes("alto")) return 2;
  if (n.includes("medi") || n.includes("medio") || n.includes("médio"))
    return 3;
  if (n.includes("baixo")) return 4;
  return 99;
}

/* ----------------------
   Componente principal
   ---------------------- */
export default function DetalhesCentralizadora() {
  const [dataRaw, setDataRaw] = useState([]);
  const [centralParam, setCentralParam] = useState("");
  const [hoverCentral, setHoverCentral] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dadosCentralizadora");
      if (raw) {
        const parsed = JSON.parse(raw);
        setDataRaw(Array.isArray(parsed) ? parsed : []);
      } else {
        const params = new URLSearchParams(window.location.search);
        const central = params.get("centralizadora");
        setCentralParam(central || "");
        setDataRaw([]);
      }
    } catch (e) {
      console.error("Erro ao ler dadosCentralizadora do localStorage:", e);
      setDataRaw([]);
    }
  }, []);

  // mapa normalized -> realKey
  const keyMap = useMemo(() => {
    const map = {};
    (dataRaw || []).forEach((row) => {
      if (!row || typeof row !== "object") return;
      Object.keys(row).forEach((rk) => {
        const nk = normalizeKey(rk);
        if (!map[nk]) map[nk] = rk;
      });
    });
    return map;
  }, [dataRaw]);

  // real key for Faixa Score if exists
  const faixaScoreRealKey = useMemo(() => {
    const nk = normalizeKey(FAIXA_SCORE_FIELD);
    return keyMap[nk] || null;
  }, [keyMap]);

  // map selected columns to real keys (if possible)
  const selectedToRealKey = useMemo(() => {
    const map = {};
    const missing = [];
    SELECTED_COLUMNS.forEach((col) => {
      const nk = normalizeKey(col);
      if (keyMap[nk]) {
        map[col] = keyMap[nk];
      } else {
        // fallback: try direct equal normalized match
        let found = null;
        for (const k of Object.keys(keyMap)) {
          if (k === nk) {
            found = keyMap[k];
            break;
          }
        }
        if (found) map[col] = found;
        else {
          map[col] = null;
          missing.push(col);
        }
      }
    });
    if (missing.length) {
      console.warn(
        "[DetalhesCentralizadora] Colunas não encontradas no localStorage:",
        missing
      );
    }
    return map;
  }, [keyMap]);

  // prepare mapped data and keep hidden faixaScore value per row
  const data = useMemo(() => {
    return (dataRaw || []).map((row) => {
      const out = {};
      SELECTED_COLUMNS.forEach((col) => {
        const realKey = selectedToRealKey[col];
        if (
          realKey &&
          row &&
          Object.prototype.hasOwnProperty.call(row, realKey)
        ) {
          out[col] = formatCellValueByColumn(col, row[realKey]);
        } else {
          out[col] = "";
        }
      });
      // attach faixaScore raw value (not formatted) for ordering: prefer Faixa Score real key, else fallback to Criticidade column if present
      let faixaVal = "";
      if (
        faixaScoreRealKey &&
        row &&
        Object.prototype.hasOwnProperty.call(row, faixaScoreRealKey)
      ) {
        faixaVal = row[faixaScoreRealKey];
      } else if (
        row &&
        Object.prototype.hasOwnProperty.call(
          row,
          selectedToRealKey["Criticidade"]
        )
      ) {
        faixaVal = row[selectedToRealKey["Criticidade"]];
      } else {
        faixaVal = out["Criticidade"] || "";
      }
      out.__faixaScore = faixaVal;
      return out;
    });
  }, [dataRaw, selectedToRealKey, faixaScoreRealKey]);

  // Determine central default name from data if available, else from query param
  const centralDefaultName = useMemo(() => {
    if (centralParam) return centralParam;
    if (data && data.length > 0 && data[0]["Centralizadora"])
      return data[0]["Centralizadora"];
    return "";
  }, [centralParam, data]);

  // Sort data by Faixa Score (or Criticidade fallback) --> Crítico(1), Alto(2), Médio(3), Baixo(4)
  const sortedData = useMemo(() => {
    const copy = [...(data || [])];
    copy.sort((a, b) => {
      const va = criticidadeOrderValue(a.__faixaScore);
      const vb = criticidadeOrderValue(b.__faixaScore);
      if (va !== vb) return va - vb;
      // tie-breaker: Dt Parecer descending (most recent first) if available
      const da = parseDateStringToDDMMYYYY(a["Dt Parecer"]);
      const db = parseDateStringToDDMMYYYY(b["Dt Parecer"]);
      // convert dd/mm/yyyy to timestamp
      const toTs = (dstr) => {
        if (!dstr) return 0;
        const [dd, mm, yyyy] = dstr.split("/");
        const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
        return date.getTime();
      };
      return toTs(db) - toTs(da);
    });
    return copy;
  }, [data]);

  // styles
  const containerStyle = { padding: 20 };
  const infoStyle = { color: "#666", marginTop: 0, textAlign: "center" };
  const tableContainerStyle = { overflowX: "hidden", marginTop: 12 };
  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    tableLayout: "fixed",
  };

  const thBase = {
    padding: "6px 8px",
    textAlign: "center",
    fontSize: 10,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const tdBase = {
    padding: "6px 8px",
    verticalAlign: "top",
    whiteSpace: "normal",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    fontSize: 10,
    lineHeight: 1.5,
    textAlign: "center",
  };

  // Cliente: no wrap + ellipsis
  const thCliente = { ...thBase, maxWidth: 420 };
  const tdCliente = {
    padding: "6px 8px",
    verticalAlign: "top",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 420,
    fontSize: 10,
    lineHeight: 1.5,
    textAlign: "center",
  };

  const displayHeaders = SELECTED_COLUMNS.map((c) => DISPLAY_NAMES[c] || c);

  return (
    <div style={containerStyle}>
      <h2
        style={{
          marginBottom: 5,
          textAlign: "center",
          color: "#18304b",
        }}
      >
        B.Os da Centralizadora {hoverCentral || centralDefaultName || ""}
      </h2>

      <p style={infoStyle}>{sortedData.length} B.Os carregados do KPI.</p>

      {sortedData.length === 0 ? (
        <div
          style={{
            padding: 20,
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
          }}
        >
          Nenhum dado disponível. Verifique se a tela que abriu esta página
          executou:
          <pre
            style={{ whiteSpace: "normal", marginTop: 8 }}
          >{`localStorage.setItem('dadosCentralizadora', JSON.stringify(...))`}</pre>
          Observação: as colunas exibidas são as definidas diretamente no código
          (const SELECTED_COLUMNS).
        </div>
      ) : (
        <div style={tableContainerStyle}>
          <table
            style={tableStyle}
            className="detalhes-table"
            aria-label="Tabela de B.Os"
          >
            <thead>
              <tr style={{ background: "#18304b", color: "#ffe200" }}>
                {SELECTED_COLUMNS.map((col, idx) => {
                  const thStyle = col === "Cliente" ? thCliente : thBase;
                  return (
                    <th key={col} style={thStyle} title={displayHeaders[idx]}>
                      {displayHeaders[idx]}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {sortedData.map((row, i) => {
                const critVal = row.__faixaScore ?? row["Criticidade"] ?? "";
                const isCritico = criticidadeOrderValue(critVal) === 1;
                const rowStyle = {
                  background: i % 2 === 0 ? "#f7faff" : "#eef3fb",
                  color: isCritico ? "#a70000" : "#072d4d",
                  cursor: "pointer",
                };
                return (
                  <tr
                    key={i}
                    style={rowStyle}
                    onMouseEnter={() => {
                      setHoverCentral(row["Centralizadora"] || null);
                    }}
                    onMouseLeave={() => setHoverCentral(null)}
                    title={
                      isCritico ? `Criticidade: ${String(critVal)}` : undefined
                    }
                  >
                    {SELECTED_COLUMNS.map((col) => {
                      const tdStyle = col === "Cliente" ? tdCliente : tdBase;
                      return (
                        <td key={col} style={tdStyle} title={row[col] ?? ""}>
                          {row[col] ?? ""}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <style>{`
            /* responsivo: reduz padding/font em telas menores */
            @media (max-width: 1200px) {
              .detalhes-table th, .detalhes-table td { padding: 5px 6px !important; font-size: 11px !important; }
            }
            @media (max-width: 800px) {
              .detalhes-table th, .detalhes-table td { padding: 4px 5px !important; font-size: 10px !important; }
            }
            /* hover visual */
            .detalhes-table tbody tr:hover { background: #a7a7a7ff !important; filter: brightness(0.98); transform: translateY(-5px); transition: all 120ms ease; }
          `}</style>
        </div>
      )}
    </div>
  );
}
