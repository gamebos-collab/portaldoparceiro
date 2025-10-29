import React, { useEffect, useMemo, useState } from "react";

/**
 * Página: /detalhes-responsavel
 * Versão personalizada similar ao detalhes-centralizadora.
 *
 * Alteração solicitada: ordena os registros pela coluna "Faixa Score" (Critico > Alto > Medio > Baixo).
 * - A ordenação é aplicada ao conjunto final de dados exibidos.
 * - A detecção da coluna "Faixa Score" é case-insensitive e sem acentos.
 * - Se não houver "Faixa Score", usa valor vazio como fallback (será ordenado por último).
 *
 * Edite SELECTED_COLUMNS se quiser alterar as colunas exibidas.
 */

/* ----------------------
   Defina aqui as colunas que quer extrair e exibir (ordem)
   Ajuste os nomes conforme as chaves presentes nos objetos em localStorage.dadosResponsavel
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
  "Faixa Score": "Faixa Score",
};

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
  const dateCols = new Set([
    "Emissão",
    "Emissão Ct",
    "Dt Parecer",
    "Emissão Ct",
  ]);
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

/* Criticidade ordering helper (1 highest priority = Crítico) */
function criticidadeOrderValue(val) {
  if (val === null || val === undefined || String(val).trim() === "") return 99;
  const n = normalizeKey(String(val));
  if (n.includes("crit")) return 1; // crítico
  if (n.includes("alto")) return 2;
  if (n.includes("medi") || n.includes("medio") || n.includes("médio"))
    return 3;
  if (n.includes("baixo")) return 4;
  return 99;
}

/* ----------------------
   Componente
   ---------------------- */
export default function DetalhesResponsavel() {
  const [raw, setRaw] = useState([]);
  const [responsabilidade, setResponsabilidade] = useState("");
  const [hoverCentral, setHoverCentral] = useState(null);

  useEffect(() => {
    try {
      const rawStr = localStorage.getItem("dadosResponsavel");
      if (rawStr) {
        const parsed = JSON.parse(rawStr);
        setRaw(Array.isArray(parsed) ? parsed : []);
      } else {
        const params = new URLSearchParams(window.location.search);
        const resp =
          params.get("responsabilidade") || params.get("responsavel");
        setResponsabilidade(resp || "");
        setRaw([]);
      }
    } catch (e) {
      console.error("Erro ler dadosResponsavel:", e);
      setRaw([]);
    }
  }, []);

  // mapa normalized -> realKey
  const keyMap = useMemo(() => {
    const map = {};
    (raw || []).forEach((row) => {
      if (!row || typeof row !== "object") return;
      Object.keys(row).forEach((rk) => {
        const nk = normalizeKey(rk);
        if (!map[nk]) map[nk] = rk;
      });
    });
    return map;
  }, [raw]);

  // real key para Faixa Score (se existir)
  const faixaScoreRealKey = useMemo(() => {
    const nk = normalizeKey("Faixa Score");
    return keyMap[nk] || null;
  }, [keyMap]);

  // map selected columns to real keys (se existirem)
  const selectedToRealKey = useMemo(() => {
    const map = {};
    SELECTED_COLUMNS.forEach((col) => {
      const nk = normalizeKey(col);
      map[col] = keyMap[nk] || null;
    });
    return map;
  }, [keyMap]);

  // monta dados finais (apenas SELECTED_COLUMNS) e aplica formatação
  // adiciona __faixaScore bruto para ordenação (prefere Faixa Score real key)
  const data = useMemo(() => {
    return (raw || []).map((row) => {
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
      // definir valor bruto de faixa score para ordenação
      let faixaVal = "";
      if (
        faixaScoreRealKey &&
        row &&
        Object.prototype.hasOwnProperty.call(row, faixaScoreRealKey)
      ) {
        faixaVal = row[faixaScoreRealKey];
      } else if (
        row &&
        selectedToRealKey["Criticidade"] &&
        Object.prototype.hasOwnProperty.call(
          row,
          selectedToRealKey["Criticidade"]
        )
      ) {
        faixaVal = row[selectedToRealKey["Criticidade"]];
      } else {
        // fallback: tentar encontrar qualquer chave que pareça ser criticidade
        const fallbackKeys = [
          "faixa",
          "faixa score",
          "criticidade",
          "criticidade score",
        ];
        for (const fk of fallbackKeys) {
          const rk = keyMap[normalizeKey(fk)];
          if (rk && row && Object.prototype.hasOwnProperty.call(row, rk)) {
            faixaVal = row[rk];
            break;
          }
        }
      }
      out.__faixaScore = faixaVal;
      return out;
    });
  }, [raw, selectedToRealKey, faixaScoreRealKey, keyMap]);

  // infer partner name: priority - query param > first non-empty Resp-like column value > hover
  const inferredPartnerName = useMemo(() => {
    if (responsabilidade) return responsabilidade;
    const candidateKeys = [
      "Resp",
      "Responsavel",
      "Responsável",
      "Resp CNO - BO",
      "Resp CNO",
    ];
    const realKeys = candidateKeys
      .map((k) => keyMap[normalizeKey(k)])
      .filter(Boolean);
    for (const row of raw || []) {
      for (const rk of realKeys) {
        if (row && typeof row === "object" && row[rk]) {
          const v = String(row[rk]).trim();
          if (v.length) return v;
        }
      }
    }
    return "";
  }, [responsabilidade, raw, keyMap]);

  const partnerName =
    responsabilidade || inferredPartnerName || hoverCentral || "";

  // Ordena pelo nível de criticidade (Faixa Score), escala Critico > Alto > Medio > Baixo
  const sortedData = useMemo(() => {
    const copy = [...(data || [])];
    copy.sort((a, b) => {
      const va = criticidadeOrderValue(a.__faixaScore);
      const vb = criticidadeOrderValue(b.__faixaScore);
      if (va !== vb) return va - vb;
      // tie-breaker: Dt Parecer mais recente primeiro
      const da = parseDateStringToDDMMYYYY(a["Dt Parecer"]);
      const db = parseDateStringToDDMMYYYY(b["Dt Parecer"]);
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

  // estilos (mesma estética do centralizadora)
  const containerStyle = { padding: 20 };
  const titleStyle = { marginBottom: 5, textAlign: "center", color: "#18304b" };
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
    fontSize: 11,
    lineHeight: 1.4,
    textAlign: "center",
  };

  const displayHeaders = SELECTED_COLUMNS.map((c) => DISPLAY_NAMES[c] || c);

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>B.Os do Parceiro {partnerName}</h2>
      <p style={infoStyle}>{sortedData.length} B.Os carregados do KPI.</p>

      {sortedData.length === 0 ? (
        <div style={{ padding: 20, background: "#18304b", borderRadius: 8 }}>
          Nenhum dado disponível. Verifique se a tela que abriu esta página
          executou:
          <pre style={{ whiteSpace: "normal", marginTop: 8 }}>
            {`localStorage.setItem('dadosResponsavel', JSON.stringify(...))`}
          </pre>
        </div>
      ) : (
        <div style={tableContainerStyle}>
          <table
            style={tableStyle}
            className="detalhes-table"
            aria-label="B.Os do Parceiro"
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
                const rowStyle = {
                  background: i % 2 === 0 ? "#f7faff" : "#eef3fb",
                  color: "#072d4d",
                  cursor: "pointer",
                };
                return (
                  <tr
                    key={i}
                    style={rowStyle}
                    onMouseEnter={() =>
                      setHoverCentral(row["Centralizadora"] || null)
                    }
                    onMouseLeave={() => setHoverCentral(null)}
                    title={
                      row.__faixaScore
                        ? `Faixa Score: ${String(row.__faixaScore)}`
                        : undefined
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
            @media (max-width: 1200px) {
              .detalhes-table th, .detalhes-table td { padding: 5px 6px !important; font-size: 10px !important; }
            }
            @media (max-width: 800px) {
              .detalhes-table th, .detalhes-table td { padding: 4px 5px !important; font-size: 9px !important; }
            }
            .detalhes-table tbody tr:hover { background: #a7a7a7ff !important; transform: translateY(-1px); transition: all 120ms ease; }
          `}</style>
        </div>
      )}
    </div>
  );
}
