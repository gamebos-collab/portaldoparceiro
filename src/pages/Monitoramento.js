import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import "./Monitoramento.css";

// ======= DADOS MANUAIS DE B.Os E CARGA MENSAL =======
const B_OS_MANUAL_MENSAL = {
  JANEIRO: 6015,
  FEVEIRO: 8897,
  MARÇO: 6174,
  ABRIL: 7408,
  MAIO: 7445,
  JUNHO: 6494,
  JULHO: 8374,
  AGOSTO: 9068,
  SETEMBRO: 8908,
  OUTUBRO: 6895,
  NOVEMBRO: 0,
  DEZEMBRO: 0,
};

const CARGA_MANUAL_MENSAL = {
  JANEIRO: 0,
  FEVEIRO: 0,
  MARÇO: 0,
  ABRIL: 0,
  MAIO: 0,
  JUNHO: 0,
  JULHO: 0,
  AGOSTO: 0,
  SETEMBRO: 0,
  OUTUBRO: 0,
  NOVEMBRO: 0,
  DEZEMBRO: 0,
};

const MESES = [
  { nome: "Jan", chave: "JANEIRO" },
  { nome: "Fev", chave: "FEVEIRO" },
  { nome: "Mar", chave: "MARÇO" },
  { nome: "Abr", chave: "ABRIL" },
  { nome: "Mai", chave: "MAIO" },
  { nome: "Jun", chave: "JUNHO" },
  { nome: "Jul", chave: "JULHO" },
  { nome: "Ago", chave: "AGOSTO" },
  { nome: "Set", chave: "SETEMBRO" },
  { nome: "Out", chave: "OUTUBRO" },
  { nome: "Nov", chave: "NOVEMBRO" },
  { nome: "Dez", chave: "DEZEMBRO" },
];

const riscoColors = ["#fffbe7", "#fff0b3", "#ffd98a", "#ff4242"];

const parceirosPorCentralizadora = {
  CXS: ["ERE", "PFU", "VAC", "VER", "LGV"],
  POA: ["PEL", "NHA", "CMQ", "OSO", "PO2", "RIG", "LAJ", "CBN", "CAI", "GRA"],
  SMA: [
    "ALE",
    "BAG",
    "FRW",
    "IJU",
    "QUI",
    "LIV",
    "SRO",
    "SGB",
    "SNT",
    "SAR",
    "URU",
    "TPS",
    "SCS",
    "IBA",
  ],
  BLU: ["BRQ", "CHA", "JBA", "CRI", "RDS", "IBM", "TUB", "SMO"],
  JVL: ["JGS", "SBS"],
  FLN: [],
  PPY: ["VAG"],
  BHZ: ["GVR", "MOC", "JAN", "DIV", "STL", "JML", "CVL", "IPN", "TEO"],
  CWB: [
    "LGS",
    "FBL",
    "FOZ",
    "GVA",
    "MGA",
    "LPR",
    "PTB",
    "PTG",
    "RNG",
    "UVT",
    "ADR",
    "MCR",
  ],
  LDA: ["NPR", "LDI", "PVI", "UMU"],
  CAS: [],
  SOR: ["ITP"],
  RIP: ["FCA", "PTF", "OCA", "PSS"],
  SUM: [],
  SAO: [
    "REG",
    "SAN",
    "SJK",
    "RIO",
    "NOF",
    "BRM",
    "TRS",
    "GDR",
    "CAW",
    "SPD",
    "CGR",
    "CGB",
  ],
  GRU: [
    "AUX",
    "GPI",
    "PMW",
    "PSO",
    "RBR",
    "PVH",
    "MAO",
    "BVB",
    "BEL",
    "MCP",
    "FOR",
    "PNZ",
    "QBX",
    "THE",
    "SLZ",
    "IMP",
  ],
  BAU: ["BIR", "MAR", "PRU", "TUP", "ARA", "AVR", "OUS", "PEN", "FER"],
  CRA: [],
  MTZ: ["MTZ"],
  VIX: ["ESI", "COL", "MAN", "SRR"],
  CPN: [
    "JDF",
    "ITR",
    "SJP",
    "PIR",
    "CAT",
    "UBE",
    "CW3",
    "VAL",
    "BSB",
    "LCE",
    "GYN",
    "NWF",
    "RAD",
    "RIT",
    "DEL",
    "LUZ",
    "USE",
    "SPR",
    "ALL",
    "AJU",
    "MCZ",
    "REC",
    "JPA",
    "NAT",
    "VDC",
    "SSA",
    "FEC",
    "PTM",
    "UNA",
  ],
};

function normalizaData(d) {
  if (!d) return "";
  if (!isNaN(d) && typeof d !== "string") {
    return XLSX.SSF.format("yyyy-mm-dd", d);
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
    const [dia, mes, ano] = d.split("/");
    return `${ano}-${mes}-${dia}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
    const [dia, mes, ano] = d.split("-");
    return `${ano}-${mes}-${dia}`;
  }
  return d.slice(0, 10);
}
function getTodayStr() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = ("0" + (now.getMonth() + 1)).slice(-2);
  const dd = ("0" + now.getDate()).slice(-2);
  return `${yyyy}-${mm}-${dd}`;
}

export default function GestaoParceiros() {
  const [dados, setDados] = useState([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [clientesRiscoReais, setClientesRiscoReais] = useState([]);
  const [rankingAnterior, setRankingAnterior] = useState([]);
  const [hoveredOfensora, setHoveredOfensora] = useState(null);
  const [clientesOnboarding, setClientesOnboarding] = useState([]);
  const [activeBar, setActiveBar] = useState(-1);
  const [selectedBar, setSelectedBar] = useState(null);
  const chartRef = useRef(null);

  // estados para valores vindos das células
  const [totalBOsCellValue, setTotalBOsCellValue] = useState(null); // será obtido como "última célula não vazia" na coluna P (Diário CD)
  const [totalSemParecerCellValue, setTotalSemParecerCellValue] =
    useState(null); // X15

  // parse robusto de números vindos do Excel (string com pontos/vírgulas, espaços, CPFs, etc.)
  function parseExcelNumber(val) {
    if (val === null || val === undefined || val === "") return null;
    if (typeof val === "number") return val;
    let s = String(val).trim();
    if (!s) return null;
    s = s.replace(/\u00A0/g, " ").trim();
    // remove tudo que não seja dígito, vírgula, ponto ou sinal de menos
    const cleaned = s.replace(/[^\d\-,.]/g, "");
    if (!cleaned) return null;
    let normalized = cleaned;
    if (cleaned.indexOf(",") > -1 && cleaned.indexOf(".") > -1) {
      // Ex.: "1.648,00" -> "1648.00"
      normalized = cleaned.replace(/\./g, "").replace(/,/g, ".");
    } else if (cleaned.indexOf(",") > -1 && cleaned.indexOf(".") === -1) {
      // Ex.: "352,33" -> "352.33"
      normalized = cleaned.replace(/,/g, ".");
    } else {
      // Ex.: "1.648" -> "1648"
      normalized = cleaned.replace(/\./g, "");
    }
    const n = Number(normalized);
    return isNaN(n) ? null : n;
  }

  // busca valor de célula em todas as abas (fallback para X15 se necessário)
  function findCellValueInWorkbook(workbook, cellAddr) {
    for (const name of workbook.SheetNames) {
      const sh = workbook.Sheets[name];
      if (
        sh &&
        sh[cellAddr] &&
        sh[cellAddr].v !== undefined &&
        sh[cellAddr].v !== null &&
        String(sh[cellAddr].v).trim() !== ""
      ) {
        return { value: sh[cellAddr].v, sheetName: name };
      }
    }
    return null;
  }

  // encontra a última célula não-vazia em uma coluna (colLetter, ex: 'P') dentro de uma sheet
  function findLastNonEmptyInColumn(sheet, colLetter) {
    if (!sheet || !sheet["!ref"]) return null;
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    // iterar de baixo para cima
    for (let r = range.e.r + 1; r >= 1; r--) {
      const addr = `${colLetter}${r}`;
      const cell = sheet[addr];
      if (
        cell &&
        cell.v !== undefined &&
        cell.v !== null &&
        String(cell.v).trim() !== ""
      ) {
        return { value: cell.v, row: r };
      }
    }
    return null;
  }

  // procura a última célula não-vazia em uma coluna por toda a workbook;
  // prioriza a aba "Diário CD" se existir, senão busca entre todas e retorna a que tiver maior número de linha (mais "abaixo")
  function findLastNonEmptyInColumnAcrossWorkbook(
    workbook,
    colLetter,
    preferredSheetName
  ) {
    // try preferred first
    if (
      preferredSheetName &&
      workbook.SheetNames.includes(preferredSheetName)
    ) {
      const sh = workbook.Sheets[preferredSheetName];
      const found = findLastNonEmptyInColumn(sh, colLetter);
      if (found) return { ...found, sheetName: preferredSheetName };
    }
    // otherwise search all and pick the one with the largest row index
    let best = null;
    for (const name of workbook.SheetNames) {
      const sh = workbook.Sheets[name];
      if (!sh || !sh["!ref"]) continue;
      const found = findLastNonEmptyInColumn(sh, colLetter);
      if (found) {
        if (!best || (found.row && found.row > best.row)) {
          best = { ...found, sheetName: name };
        }
      }
    }
    return best;
  }

  useEffect(() => {
    const carregarExcel = async () => {
      try {
        const res = await fetch("/kpiparceiro.xlsm");
        if (!res.ok) {
          setErro("Não foi possível carregar o arquivo Excel.");
          setLoading(false);
          return;
        }
        const data = await res.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });

        // monta dados da aba "Dados"
        const sheetDados = workbook.Sheets["Dados"];
        if (!sheetDados) {
          setErro("A aba 'Dados' não foi encontrada no Excel.");
          setLoading(false);
          return;
        }
        const allRows = XLSX.utils.sheet_to_json(sheetDados, {
          header: 1,
          defval: "",
        });
        const headerRow = allRows[9];
        const dataRows = allRows.slice(10);
        const json = dataRows
          .filter((row) => row.some((cell) => cell !== ""))
          .map((row) => {
            const obj = {};
            headerRow.forEach((col, i) => {
              obj[col] = row[i];
            });
            return obj;
          });
        setDados(json);

        // -------- Total de B.Os: encontrar ÚLTIMA célula com conteúdo na coluna P da aba "Diário CD"
        const diarioSheetName = "Diário CD";
        const columnP = "P";

        const foundLastP = findLastNonEmptyInColumnAcrossWorkbook(
          workbook,
          columnP,
          diarioSheetName
        );
        if (foundLastP) {
          const parsed = parseExcelNumber(foundLastP.value);
          if (parsed !== null && Number.isFinite(parsed)) {
            setTotalBOsCellValue(Math.round(parsed));
            console.debug(
              `Total (col ${columnP}) lido da aba "${foundLastP.sheetName}" na linha ${foundLastP.row}:`,
              foundLastP.value
            );
          } else {
            // ainda tenta usar raw value como fallback se for string exibível
            if (
              foundLastP.value !== null &&
              foundLastP.value !== undefined &&
              String(foundLastP.value).trim() !== ""
            ) {
              // exibir como fallback se não for parseável, mas preferimos número
              setTotalBOsCellValue(foundLastP.value);
              console.debug(
                `Valor encontrado na coluna ${columnP} (não numérico após parse):`,
                foundLastP.value,
                "na aba",
                foundLastP.sheetName,
                "linha",
                foundLastP.row
              );
            } else {
              setTotalBOsCellValue(null);
            }
          }
        } else {
          console.debug(
            `Nenhuma célula não-vazia encontrada na coluna ${columnP} em todo o workbook.`
          );
          setTotalBOsCellValue(null);
        }

        // -------- B.Os Sem Parecer: manter leitura da célula X15 na aba "Diário CD" (fallback em todo workbook)
        const diarioSheet = workbook.Sheets[diarioSheetName];
        if (diarioSheet) {
          try {
            const cellX15 = diarioSheet["X15"] ? diarioSheet["X15"].v : null;
            const parsedX15 = parseExcelNumber(cellX15);
            if (parsedX15 !== null && Number.isFinite(parsedX15)) {
              setTotalSemParecerCellValue(Math.round(parsedX15));
              console.debug(`X15 lida da aba "${diarioSheetName}":`, cellX15);
            } else {
              console.debug(
                `X15 encontrada na aba "${diarioSheetName}" mas não é numérica:`,
                cellX15
              );
              setTotalSemParecerCellValue(null);
            }
          } catch (e) {
            console.debug("Erro lendo X15 da aba Diário CD:", e);
            setTotalSemParecerCellValue(null);
          }
        } else {
          // fallback: procurar X15 em qualquer aba
          const foundX15 = findCellValueInWorkbook(workbook, "X15");
          if (foundX15) {
            const parsed = parseExcelNumber(foundX15.value);
            if (parsed !== null && Number.isFinite(parsed)) {
              setTotalSemParecerCellValue(Math.round(parsed));
              console.debug(
                `X15 lida da aba "${foundX15.sheetName}":`,
                foundX15.value
              );
            } else {
              console.debug(
                `X15 encontrada na aba "${foundX15.sheetName}" porém parse retornou nulo:`,
                foundX15.value
              );
              setTotalSemParecerCellValue(null);
            }
          } else {
            console.debug("X15 não encontrada em nenhuma aba do workbook.");
            setTotalSemParecerCellValue(null);
          }
        }

        // CLIENTES EM RISCO (aba "Clientes em Risco")
        const abaRisco = workbook.Sheets["Clientes em Risco"];
        if (abaRisco) {
          const ref = abaRisco["!ref"];
          const range = ref ? XLSX.utils.decode_range(ref) : null;

          let onboardingStart = null;
          if (range) {
            for (let r = 1; r <= range.e.r + 1; r++) {
              const cellD = abaRisco[`D${r}`];
              if (
                cellD &&
                String(cellD.v).toLowerCase().includes("clientes omboarding")
              ) {
                onboardingStart = r + 1;
                break;
              }
            }
          } else {
            // fallback with sheet_to_json
            const allRisco = XLSX.utils.sheet_to_json(abaRisco, {
              header: 1,
              defval: "",
            });
            for (let r = 0; r < allRisco.length; r++) {
              if (
                allRisco[r] &&
                allRisco[r][3] &&
                String(allRisco[r][3])
                  .toLowerCase()
                  .includes("clientes omboarding")
              ) {
                onboardingStart = r + 2;
                break;
              }
            }
          }

          let onboardingClientes = [];
          if (onboardingStart && range) {
            for (let r = onboardingStart; r <= range.e.r + 1; r++) {
              const cellD = abaRisco[`D${r}`];
              const nome = cellD ? String(cellD.v).trim() : "";
              if (!nome || nome.toLowerCase().includes("total geral")) break;
              onboardingClientes.push({
                nome,
                dias5: abaRisco[`E${r}`]?.v || "",
                dias10: abaRisco[`F${r}`]?.v || "",
                dias15: abaRisco[`G${r}`]?.v || "",
                acima15: abaRisco[`H${r}`]?.v || "",
                total: abaRisco[`I${r}`]?.v || "",
              });
            }
          }
          setClientesOnboarding(onboardingClientes);

          let riscos = [
            { risco: 3, clientes: [] },
            { risco: 2, clientes: [] },
            { risco: 1, clientes: [] },
          ];
          let riscoAtual = null;
          if (range) {
            for (let r = 7; r <= range.e.r; r++) {
              const celulaD = abaRisco[`D${r + 1}`];
              const celulaE = abaRisco[`E${r + 1}`];
              const celulaF = abaRisco[`F${r + 1}`];
              const celulaG = abaRisco[`G${r + 1}`];
              const celulaH = abaRisco[`H${r + 1}`];

              const valorD = celulaD ? String(celulaD.v).trim() : "";
              if (valorD.toLowerCase().startsWith("total")) break;
              if (/^risco\s*3$/i.test(valorD)) {
                riscoAtual = 3;
                continue;
              }
              if (/^risco\s*2$/i.test(valorD)) {
                riscoAtual = 2;
                continue;
              }
              if (/^risco\s*1$/i.test(valorD)) {
                riscoAtual = 1;
                continue;
              }
              if (!valorD || !riscoAtual) continue;
              if (valorD.toLowerCase().includes("clientes omboarding")) break;
              const idx = 3 - riscoAtual;
              riscos[idx].clientes.push({
                nome: valorD,
                dias5: Number(celulaE ? celulaE.v : 0) || 0,
                dias10: Number(celulaF ? celulaF.v : 0) || 0,
                dias15: Number(celulaG ? celulaG.v : 0) || 0,
                acima15: Number(celulaH ? celulaH.v : 0) || 0,
              });
            }
            setClientesRiscoReais(riscos);
          }
        }
      } catch (err) {
        setErro("Erro ao processar o arquivo Excel.");
      } finally {
        setLoading(false);
      }
    };
    carregarExcel();
  }, []);

  // Colunas do Excel
  const COL_EMISSAO = "Emissão";
  const COL_DT_PARECER = "Dt Parecer";
  const COL_OCORRENCIA = "Ocorrência";
  const COL_DIAS_SEM_ACOMP = "Dias sem acompanhamento";
  const COL_RESP = "Resp";
  const COL_5 = "0 a 5";
  const COL_10 = "6 a 10";
  const COL_15 = "11 a 15";
  const COL_MAIS15 = "> 15";

  // totalBOs prioriza valor lido na coluna P (última célula não vazia)
  const totalBOsFallback = dados.length;
  const totalBOsValue =
    totalBOsCellValue !== null && totalBOsCellValue !== undefined
      ? totalBOsCellValue
      : totalBOsFallback;

  const hojeStr = getTodayStr();

  // B.Os Abertos (mantém a lógica atual: contabiliza pela data de emissão e zera todo dia)
  const totalAbertosHoje = dados.filter((d) => {
    const dataAbertura = normalizaData(d[COL_EMISSAO]);
    return dataAbertura === hojeStr;
  }).length;

  const totalFechadosHoje = dados.filter((d) => {
    const dataFechamento = normalizaData(d[COL_DT_PARECER]);
    return dataFechamento === hojeStr;
  }).length;

  // totalSemParecer prioriza X15 quando disponível
  const totalSemParecerFallback = dados.filter(
    (d) =>
      (d[COL_DIAS_SEM_ACOMP] || "").toString().trim().toLowerCase() ===
      "sem acompanhamento"
  ).length;
  const totalSemParecerValue = Number.isFinite(totalSemParecerCellValue)
    ? totalSemParecerCellValue
    : totalSemParecerFallback;

  const totalFaltaTotal = dados.filter(
    (d) =>
      (d[COL_OCORRENCIA] || "").toString().trim().toUpperCase() ===
      "FALTA TOTAL"
  ).length;

  const totalAvariaTotal = dados.filter(
    (d) =>
      (d[COL_OCORRENCIA] || "").toString().trim().toUpperCase() ===
      "AVARIA TOTAL"
  ).length;

  function getSum(n) {
    return isNaN(Number(n)) ? 0 : Number(n);
  }
  const parceirosRanking = {};
  dados.forEach((d) => {
    const parceiro = d[COL_RESP];
    if (!parceiro) return;
    let centralizadora = "";
    Object.entries(parceirosPorCentralizadora).forEach(([cent, parceiros]) => {
      if (parceiros.includes(parceiro)) centralizadora = cent;
    });
    if (Object.keys(parceirosPorCentralizadora).includes(parceiro)) return;
    if (!parceirosRanking[parceiro]) {
      parceirosRanking[parceiro] = {
        parceiro,
        centralizadora,
        dias5: 0,
        dias10: 0,
        dias15: 0,
        mais15: 0,
        totalBOs: 0,
        status: "up",
        oldRank: null,
      };
    }
    parceirosRanking[parceiro].dias5 += getSum(d[COL_5]);
    parceirosRanking[parceiro].dias10 += getSum(d[COL_10]);
    parceirosRanking[parceiro].dias15 += getSum(d[COL_15]);
    parceirosRanking[parceiro].mais15 += getSum(d[COL_MAIS15]);
    parceirosRanking[parceiro].totalBOs =
      parceirosRanking[parceiro].dias5 +
      parceirosRanking[parceiro].dias10 +
      parceirosRanking[parceiro].dias15 +
      parceirosRanking[parceiro].mais15;
  });

  const rankingAtual = Object.values(parceirosRanking)
    .sort((a, b) => b.totalBOs - a.totalBOs)
    .slice(0, 10);

  useEffect(() => {
    localStorage.setItem(
      "parceirosRanking",
      JSON.stringify(rankingAtual.map((x) => x.parceiro))
    );
  }, [dados.length]); // eslint-disable-line

  rankingAtual.forEach((item, idx) => {
    if (!rankingAnterior.length) {
      item.status = "up";
    } else {
      const posAnterior = rankingAnterior.indexOf(item.parceiro);
      if (posAnterior === -1 || posAnterior > idx) {
        item.status = "up";
      } else if (posAnterior < idx) {
        item.status = "down";
      } else {
        item.status = "same";
      }
    }
  });

  // Gráfico: sempre renderiza (dados manuais de B.Os e carga)
  const graficoDados = MESES.map(({ nome, chave }) => ({
    mes: nome,
    bos: B_OS_MANUAL_MENSAL[chave] ?? 0,
    carga: CARGA_MANUAL_MENSAL[chave] ?? 0,
  }));

  const handleBarClick = (data, idx) => {
    setSelectedBar({
      ...data,
      idx,
    });
    setActiveBar(idx);
    if (chartRef.current) {
      chartRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "rgba(30,30,40,0.97)",
            border: "1.5px solid #ff9100",
            borderRadius: 9,
            color: "#fff",
            padding: 12,
            boxShadow: "0 2px 16px #222a",
          }}
        >
          <div style={{ fontWeight: 700, color: "#ffd700", fontSize: 18 }}>
            {label}
          </div>
          <div style={{ color: "#ffd9b0", fontWeight: 500, fontSize: 15 }}>
            Total B.Os: {payload[0]?.value.toLocaleString("pt-BR")}
          </div>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (idx, key) => {
    if (selectedBar && selectedBar.idx === idx) {
      return key === "bos" ? "url(#bosActiveBar)" : "url(#cargaActiveBar)";
    }
    return key === "bos" ? "url(#boBar)" : "url(#cargaBar)";
  };

  return (
    <div className="monitoramento-page">
      <div className="monitoramento-header"></div>
      {loading && (
        <div className="monitoramento-loading">Carregando dados...</div>
      )}
      {erro && <div className="monitoramento-erro">{erro}</div>}

      {!loading && !erro && (
        <div className="monitoramento-content-split">
          <div className="monitoramento-section monitoramento-superior">
            <div className="monitoramento-metricas">
              <div className="metrica-card">
                <h4>Total de B.Os</h4>
                <span>
                  {String(Number(totalBOsValue).toLocaleString("pt-BR"))}
                </span>
              </div>
              <div className="metrica-card">
                <h4>B.Os Abertos</h4>
                <span>{totalAbertosHoje}</span>
              </div>
              <div className="metrica-card">
                <h4>B.Os Fechados</h4>
                <span>{totalFechadosHoje}</span>
              </div>
              <div className="metrica-card">
                <h4>B.Os Sem Parecer</h4>
                <span>
                  {Number(totalSemParecerValue).toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="metrica-card">
                <h4>B.Os Falta Total</h4>
                <span>{totalFaltaTotal}</span>
              </div>
              <div className="metrica-card">
                <h4>B.Os Avaria Total</h4>
                <span>{totalAvariaTotal}</span>
              </div>
            </div>

            <div className="monitoramento-superior-row">
              {/* TOP 10 PARCEIROS MAIS OFENSORES */}
              <div className="unidades-ofensoras-wrapper">
                <h3 className="unidades-ofensoras-titulo">
                  <i>PARCEIROS MAIS OFENSORES</i>
                </h3>
                <div className="unidades-ofensoras-table-container">
                  <table className="unidades-ofensoras-table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Parceiro</th>
                        <th>Centralizadora</th>
                        <th>5 dias</th>
                        <th>10 dias</th>
                        <th>15 dias</th>
                        <th>Acima 15 dias</th>
                        <th>Total B.O's</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingAtual.map((item, idx) => (
                        <tr
                          key={item.parceiro}
                          className={
                            hoveredOfensora === idx ? "ofensora-hovered" : ""
                          }
                          onMouseEnter={() => setHoveredOfensora(idx)}
                          onMouseLeave={() => setHoveredOfensora(null)}
                        >
                          <td>
                            {item.status === "up" ? (
                              <span
                                className="arrow-up"
                                title="Subiu no ranking"
                              >
                                &#9650;
                              </span>
                            ) : item.status === "down" ? (
                              <span
                                className="arrow-down"
                                title="Desceu no ranking"
                              >
                                &#9660;
                              </span>
                            ) : (
                              <span style={{ color: "#ccc" }}>–</span>
                            )}
                          </td>
                          <td>{item.parceiro}</td>
                          <td>{item.centralizadora}</td>
                          <td>{item.dias5}</td>
                          <td>{item.dias10}</td>
                          <td>{item.dias15}</td>
                          <td>{item.mais15}</td>
                          <td>{item.totalBOs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Evolução mensal */}
              <div className="evolucao-mensal-card" ref={chartRef}>
                <h3 className="evolucao-mensal-titulo">
                  Evolução Mensal de B.Os
                </h3>
                <div className="evolucao-mensal-grafico-container">
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart
                      data={graficoDados}
                      margin={{ top: 36, right: 40, left: 30, bottom: 32 }}
                      barCategoryGap="18%"
                      barGap={5}
                    >
                      <CartesianGrid
                        stroke="#fff"
                        strokeOpacity={0.17}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="mes"
                        axisLine={false}
                        tickLine={false}
                        style={{
                          fontWeight: "bold",
                          fontSize: 16,
                          fill: "#fff",
                        }}
                        tick={{ fill: "#fff", fontSize: 15 }}
                        interval={0}
                      />
                      <YAxis
                        allowDecimals={false}
                        domain={[0, 8500]}
                        ticks={[
                          0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000,
                          4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000,
                        ]}
                        tickFormatter={(v) => v.toLocaleString("pt-BR")}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#fff", fontSize: 15 }}
                      />
                      <defs>
                        <linearGradient id="boBar" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="#ff9100ff"
                            stopOpacity={0.85}
                          />
                          <stop
                            offset="100%"
                            stopColor="#ffe100ff"
                            stopOpacity={0.85}
                          />
                        </linearGradient>
                        <linearGradient
                          id="cargaBar"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#de3a3a04"
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="100%"
                            stopColor="#8bc7f707"
                            stopOpacity={0.85}
                          />
                        </linearGradient>
                        <linearGradient
                          id="bosActiveBar"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#ffd700"
                            stopOpacity={0.93}
                          />
                          <stop
                            offset="100%"
                            stopColor="#ff9100"
                            stopOpacity={1}
                          />
                        </linearGradient>
                        <linearGradient
                          id="cargaActiveBar"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#00eafd"
                            stopOpacity={0.93}
                          />
                          <stop
                            offset="100%"
                            stopColor="#3a8dde"
                            stopOpacity={1}
                          />
                        </linearGradient>
                      </defs>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{
                          paddingTop: 10,
                          color: "#fff",
                          fontWeight: "bold",
                          fontSize: 15,
                        }}
                        iconType="rect"
                      />
                      <Bar
                        dataKey="bos"
                        stackId="a"
                        name="Total B.Os"
                        fill="url(#boBar)"
                        barSize={32}
                        radius={[1, 100, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={800}
                        onClick={(data, idx) => handleBarClick(data, idx)}
                        onMouseOver={(_, idx) => setActiveBar(idx)}
                        onMouseOut={() => setActiveBar(-1)}
                      >
                        {graficoDados.map((entry, idx) => (
                          <Cell
                            key={`cell-bos-${idx}`}
                            fill={getBarColor(idx, "bos")}
                            cursor="pointer"
                            style={{
                              transition: "filter 0.63s",
                              filter:
                                activeBar === idx
                                  ? "drop-shadow(0 0 10px #ffffffda)"
                                  : "none",
                            }}
                          />
                        ))}
                      </Bar>
                      <Bar
                        dataKey=""
                        stackId="a"
                        name=""
                        fill="url(#cargaBar)"
                        barSize={32}
                        radius={[10, 10, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={900}
                        onClick={(data, idx) => handleBarClick(data, idx)}
                        onMouseOver={(_, idx) => setActiveBar(idx)}
                        onMouseOut={() => setActiveBar(-1)}
                      >
                        {graficoDados.map((entry, idx) => (
                          <Cell
                            key={`cell-carga-${idx}`}
                            fill={getBarColor(idx, "carga")}
                            cursor="pointer"
                            style={{
                              transition: "filter 0.23s",
                              filter:
                                activeBar === idx
                                  ? "drop-shadow(0 0 14px)"
                                  : "none",
                            }}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {selectedBar && (
                    <div
                      style={{
                        position: "fixed",
                        left: "70%",
                        top: "33%",
                        transform: "translate(-50%, 0)",
                        zIndex: 1002,
                        background: "rgba(0,0,0,0.97)",
                        border: "2px solid #ff9100",
                        borderRadius: 14,
                        color: "#fff",
                        textAlign: "center",
                        padding: "22px 24px 16px 24px",
                        fontSize: 18,
                        boxShadow:
                          "0 6px 28px #222a, 0 0 0 9999px rgba(0,0,0,0.3)",
                        minWidth: 320,
                        maxWidth: "90vw",
                        maxHeight: "80vh",
                        overflowY: "auto",
                      }}
                    >
                      <b style={{ color: "#ffd700", fontSize: 24 }}>
                        {selectedBar.mes}
                      </b>
                      <div
                        style={{
                          color: "#ffd9b0",
                          fontWeight: 500,
                          fontSize: 18,
                          marginBottom: 8,
                        }}
                      >
                        Total B.Os no mês:{" "}
                        {selectedBar.bos.toLocaleString("pt-BR")}
                      </div>
                      <div
                        style={{
                          color: "#ff9100",
                          fontWeight: 400,
                          fontSize: 16,
                          margin: "12px 0 4px 0",
                        }}
                      >
                        {selectedBar.mes === "Jan" &&
                          "Aproximadamente 1,16% da carga transportada tiveram algum tipo de B.O."}
                        {selectedBar.mes === "Fev" &&
                          "Aproximadamente 1,47% da carga transportada tiveram algum tipo de B.O."}
                        {selectedBar.mes === "Mar" &&
                          "Aproximadamente 0,91% da carga transportada tiveram algum tipo de B.O."}
                        {selectedBar.mes === "Abri" &&
                          "Aproximadamente 1,09% da carga transportada tiveram algum tipo de B.O."}
                        {selectedBar.mes === "Mai" &&
                          "Aproximadamente 1,15% da carga transportada tiveram algum tipo de B.O."}
                        {selectedBar.mes === "Jun" &&
                          "Aproximadamente 1,10% da carga transportada tiveram algum tipo de B.O."}
                        {selectedBar.mes === "Jul" &&
                          "Aproximadamente 1,19% da carga transportada tiveram algum tipo de B.O."}
                        {selectedBar.mes === "Ago" &&
                          "Aproximadamente 1,18% da carga transportada tiveram algum tipo de B.O."}
                        {selectedBar.mes === "Set" &&
                          "Aproximadamente 1,19% da carga transportada tiveram algum tipo de B.O."}
                        {selectedBar.mes === "Out" &&
                          "Aproximadamente 1,83% da carga transportada até o momento, tiveram algum tipo de B.O."}
                      </div>
                      <button
                        style={{
                          background: "#ffe200",
                          color: "#222",
                          border: "none",
                          borderRadius: 8,
                          marginTop: 10,
                          padding: "7px 26px",
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: 16,
                          boxShadow: "0 2px 8px #0002",
                        }}
                        onClick={() => setSelectedBar(null)}
                      >
                        Fechar
                      </button>
                    </div>
                  )}
                </div>
                <div className="evolucao-mensal-explicacao">
                  <span>
                    <br />
                  </span>
                </div>

                <div
                  className="clientes-risco-cards-linha"
                  style={{ marginTop: 32 }}
                >
                  <div className="clientes-risco-card risco3">
                    <div className="clientes-risco-titulo risco3">
                      Clientes Omboarding
                    </div>
                    <table className="clientes-risco-tabela">
                      <thead>
                        <tr>
                          <th>Nome do Cliente</th>
                          <th style={{ background: riscoColors[0] }}>
                            até 5 dias
                          </th>
                          <th style={{ background: riscoColors[1] }}>
                            até 10 dias
                          </th>
                          <th style={{ background: riscoColors[2] }}>
                            até 15 dias
                          </th>
                          <th style={{ background: riscoColors[3] }}>
                            acima de 15 dias
                          </th>
                          <th style={{ background: "#ffe200" }}>Total Geral</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientesOnboarding.map((cli, idx) => (
                          <tr key={cli.nome + idx}>
                            <td className="cliente-nome">{cli.nome}</td>
                            <td style={{ background: riscoColors[0] }}>
                              {cli.dias5}
                            </td>
                            <td style={{ background: riscoColors[1] }}>
                              {cli.dias10}
                            </td>
                            <td style={{ background: riscoColors[2] }}>
                              {cli.dias15}
                            </td>
                            <td style={{ background: riscoColors[3] }}>
                              {cli.acima15}
                            </td>
                            <td style={{ background: "#ffe200" }}>
                              {cli.total}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {/* FIM evolucao mensal */}
            </div>
          </div>

          <h1 className="titulo-clientes-risco"></h1>

          {/* PARTE INFERIOR */}
          <div className="monitoramento-section monitoramento-inferior">
            <div className="monitoramento-graficos-e-tabela">
              <div className="clientes-risco-cards-linha">
                {clientesRiscoReais.map((riscoItem) => (
                  <div
                    key={riscoItem.risco}
                    className={`clientes-risco-card risco${riscoItem.risco}`}
                  >
                    <div
                      className={`clientes-risco-titulo risco${riscoItem.risco}`}
                    >
                      Risco {riscoItem.risco}
                    </div>
                    <table className="clientes-risco-tabela">
                      <thead>
                        <tr>
                          <th>Nome do Cliente</th>
                          <th style={{ background: riscoColors[0] }}>
                            até 5 dias
                          </th>
                          <th style={{ background: riscoColors[1] }}>
                            até 10 dias
                          </th>
                          <th style={{ background: riscoColors[2] }}>
                            até 15 dias
                          </th>
                          <th style={{ background: riscoColors[3] }}>
                            acima de 15 dias
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {riscoItem.clientes.map((cli, idx) => (
                          <tr key={cli.nome + idx}>
                            <td className="cliente-nome">{cli.nome}</td>
                            <td style={{ background: riscoColors[0] }}>
                              {cli.dias5}
                            </td>
                            <td style={{ background: riscoColors[1] }}>
                              {cli.dias10}
                            </td>
                            <td style={{ background: riscoColors[2] }}>
                              {cli.dias15}
                            </td>
                            <td style={{ background: riscoColors[3] }}>
                              {cli.acima15}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
