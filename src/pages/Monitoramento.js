import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { FiArrowUpRight, FiArrowDownRight, FiMinus } from "react-icons/fi";
import "./Monitoramento.css";

/*
  Ajuste solicitado:
  - Forçar que a coluna "Centralizadora" exibida no Ranking seja determinada
    pelo mapa oficial de centralizadoras <-> parceiros que você enviou.
    Ou seja: para cada parceiro encontrado, se existir no CENTRALIZADORA_MAP,
    exibe a centralizadora correspondente (chave do mapa). Se não existir no
    mapa, usa o valor da planilha como fallback.
  - Mantive a regra de ignorar MTZ permanentemente (FORCIBLE_IGNORE).
  - Mantive heurísticas robustas de detecção de colunas/parceiros/faixa.
  - Normalização (remoção de acentos / espaços / uppercase) para matching consistente.
*/

const CENTRALIZADORA_MAP = {
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
  SÃO: [
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
  VIX: ["ESI", "COL", "MAN", "SRR"],
  BAU: ["BIR", "MAR", "PRU", "TUP", "ARA", "AVR", "OUS", "PEN", "FER"],
  CRA: [],
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

// Códigos que sempre devem ser ignorados (normalize)
const FORCIBLE_IGNORE = ["MTZ"];

// normalize string (remove acentos, espaços e uppercase)
function normalizeCode(s) {
  if (s === undefined || s === null) return "";
  try {
    return String(s)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .toUpperCase();
  } catch (e) {
    return String(s).toUpperCase().replace(/\s+/g, "");
  }
}

// flattened normalized partner codes (from the provided map)
const PARTNER_CODES_NORM = new Set(
  Object.values(CENTRALIZADORA_MAP)
    .flat()
    .map((c) => normalizeCode(c))
    .filter(Boolean)
);

// normalized central keys
const CENTRAL_KEYS_NORM = new Set(
  Object.keys(CENTRALIZADORA_MAP).map((k) => normalizeCode(k))
);

// add forcible ignore into central keys so they're treated as central when detected
FORCIBLE_IGNORE.forEach((c) => CENTRAL_KEYS_NORM.add(normalizeCode(c)));

const IGNORE_SET = new Set(FORCIBLE_IGNORE.map((c) => normalizeCode(c)));

function sheetToJson(sheet) {
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
}

function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value ?? "--"}</div>
    </div>
  );
}

function RankingTable({ rankingData, previousRanks }) {
  const sorted = [...rankingData].sort((a, b) => b.total - a.total);
  const top10 = sorted.slice(0, 10);

  return (
    <div className="ranking-wrapper">
      <h3>Ranking de Parceiros (pior no topo)</h3>
      <table className="ranking-table">
        <thead>
          <tr>
            <th>Parceiro</th>
            <th>Centralizadora</th>
            <th>Até 5 Dias</th>
            <th>Até 10 Dias</th>
            <th>Até 15 Dias</th>
            <th>15 +</th>
            <th>Total Geral</th>
          </tr>
        </thead>
        <tbody>
          {top10.map((r, idx) => {
            const prevPos = previousRanks?.[r.parceiro];
            const currPos = idx + 1;
            let Icon = FiMinus;
            let iconClass = "neutral";
            if (prevPos) {
              if (currPos < prevPos) {
                Icon = FiArrowUpRight;
                iconClass = "up";
              } else if (currPos > prevPos) {
                Icon = FiArrowDownRight;
                iconClass = "down";
              }
            }
            return (
              <tr key={r.parceiro || idx}>
                <td className="partner-cell">
                  <div className="partner-name">
                    <Icon className={`movement-icon ${iconClass}`} />
                    <span>{r.parceiro}</span>
                  </div>
                </td>
                <td>{r.centralizadora}</td>
                <td>{r.faixaCounts["Até 5 Dias"] ?? 0}</td>
                <td>{r.faixaCounts["Até 10 Dias"] ?? 0}</td>
                <td>{r.faixaCounts["Até 15 Dias"] ?? 0}</td>
                <td>{r.faixaCounts["Acima 15 Dias"] ?? 0}</td>
                <td>{r.total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="ranking-legend">
        Observação: quanto maior o Total Geral mais no topo (pior). Movimentação
        considera Total Geral.
      </div>
    </div>
  );
}

export default function Monitoramento() {
  const [wbData, setWbData] = useState(null);
  const [cards, setCards] = useState({
    totalHoje: null,
    abertosHoje: null,
    fechadosHoje: null,
    semParecer: null,
    faltaTotal: null,
    avariaTotal: null,
  });
  const [rankingData, setRankingData] = useState([]);
  const [previousRanks, setPreviousRanks] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [showMonthPopup, setShowMonthPopup] = useState(null);
  const [onboardingHeaders, setOnboardingHeaders] = useState([]);
  const [onboardingRows, setOnboardingRows] = useState([]);
  const [riskHeaders, setRiskHeaders] = useState([]);
  const [riscoRows, setRiscoRows] = useState({
    risco3: [],
    risco2: [],
    risco1: [],
  });
  const [activeBarIndex, setActiveBarIndex] = useState(null);

  // carregar workbook (tenta xlsm e xlsx)
  useEffect(() => {
    async function loadWorkbook() {
      const fileCandidates = ["/kpiparceiro.xlsm", "/kpiparceiro.xlsx"];
      for (const url of fileCandidates) {
        try {
          const fetchUrl = url + "?_=" + Date.now();
          const res = await fetch(fetchUrl, { cache: "no-store" });
          console.log(
            "Fetch",
            url,
            "=>",
            res.status,
            res.headers.get("content-type")
          );
          if (!res.ok) {
            console.warn(`Resposta ${res.status} ao buscar ${url}`);
            continue;
          }
          const ct = (res.headers.get("content-type") || "").toLowerCase();
          if (
            ct.includes("text/html") ||
            ct.includes("application/xhtml+xml")
          ) {
            const html = await res.text();
            console.error(
              `A resposta para ${url} é HTML (ct: ${ct}). Trecho:\n`,
              html.slice(0, 800)
            );
            continue;
          }
          const ab = await res.arrayBuffer();
          try {
            const wb = XLSX.read(ab, { type: "array" });
            console.log("Workbook carregado:", wb.SheetNames);
            setWbData(wb);
            return;
          } catch (err) {
            console.error("Falha ao parsear como XLSX:", err);
            try {
              const snippet = new TextDecoder().decode(
                new Uint8Array(ab.slice(0, 800))
              );
              console.log(
                "Trecho do conteúdo (bytes->texto):",
                snippet.slice(0, 800)
              );
            } catch (e) {}
            continue;
          }
        } catch (err) {
          console.warn("Erro fetch", url, err);
        }
      }
      console.error(
        "Não foi possível carregar kpiparceiro (.xlsm/.xlsx) automaticamente. Verifique public/ e nome do arquivo."
      );
    }
    loadWorkbook();
  }, []);

  // processa workbook e popula estados
  useEffect(() => {
    if (!wbData) return;

    // ---------- CARDS ----------
    try {
      const names = wbData.SheetNames || [];
      console.log("Sheets disponíveis:", names);
      const targetName =
        names.find((n) => n && n.trim().toLowerCase() === "kpiparceiro") ||
        names[0];
      console.log("Usando sheet para cards:", targetName);
      const s = wbData.Sheets[targetName];

      function readCellValue(sheet, addr) {
        if (!sheet) return null;
        const cell = sheet[addr];
        if (cell && (cell.v !== undefined || cell.w !== undefined))
          return cell.v ?? cell.w;
        if (sheet["!merges"]) {
          const merges = sheet["!merges"];
          const decoded = XLSX.utils.decode_cell(addr);
          for (const m of merges) {
            if (
              decoded.r >= m.s.r &&
              decoded.r <= m.e.r &&
              decoded.c >= m.s.c &&
              decoded.c <= m.e.c
            ) {
              const topLeft = XLSX.utils.encode_cell({ r: m.s.r, c: m.s.c });
              const topCell = sheet[topLeft];
              if (
                topCell &&
                (topCell.v !== undefined || topCell.w !== undefined)
              )
                return topCell.v ?? topCell.w;
            }
          }
        }
        try {
          const rows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            raw: false,
          });
          const dec = XLSX.utils.decode_cell(addr);
          const r = rows[dec.r];
          if (r) return r[dec.c] ?? null;
        } catch (e) {}
        return null;
      }

      // Células dos cards (ajuste se necessário)
      const cellsMap = {
        totalHoje: "BJ11",
        abertosHoje: "BK11",
        fechadosHoje: "BL11",
        semParecer: "BM11",
        faltaTotal: "BN11",
        avariaTotal: "BO11",
      };

      const newCards = {};
      for (const key of Object.keys(cellsMap)) {
        const addr = cellsMap[key];
        const raw = readCellValue(s, addr);

        // IGNORAR MTZ em cards
        const rawNorm = normalizeCode(raw);
        if (IGNORE_SET.has(rawNorm)) {
          newCards[key] = null;
          console.log(`Ignorado MTZ na célula ${addr} para ${key}`);
          continue;
        }

        let value = raw;
        if (typeof value === "string") {
          const only = value.trim().replace(/[^\d,.\-]/g, "");
          if (/^[\d.,\-]+$/.test(only)) {
            if (only.indexOf(",") > -1 && only.indexOf(".") > -1) {
              const num = Number(only.replace(/\./g, "").replace(",", "."));
              if (!Number.isNaN(num)) value = num;
            } else if (only.indexOf(",") > -1) {
              const num = Number(only.replace(",", "."));
              if (!Number.isNaN(num)) value = num;
            } else {
              const num = Number(only);
              if (!Number.isNaN(num)) value = num;
            }
          }
        }
        newCards[key] = value ?? null;
        console.log(`Leu ${key} (${addr}) =`, value);
      }
      setCards((prev) => ({ ...prev, ...newCards }));
    } catch (err) {
      console.error("Erro ao montar cards:", err);
    }

    // ---------- RANKING (aba "dados") ----------
    try {
      const sheetNameCandidate = wbData.SheetNames.find((n) =>
        /dados/i.test(n)
      );
      const sheet = wbData.Sheets[sheetNameCandidate || wbData.SheetNames[0]];
      const rows = sheetToJson(sheet || {});
      if (!rows || rows.length === 0) {
        console.warn(
          "Aba 'dados' vazia ou não encontrada; não será possível montar ranking."
        );
        return;
      }

      // encontrar header
      let headerIndex = -1;
      for (let i = 0; i < Math.min(20, rows.length); i++) {
        const row = rows[i] || [];
        const joined = row.join(" ").toLowerCase();
        if (
          joined.includes("resp") ||
          joined.includes("respons") ||
          joined.includes("parceiro")
        ) {
          headerIndex = i;
          break;
        }
      }
      if (headerIndex === -1) headerIndex = rows.length > 8 ? 8 : 0;
      const headerRow = rows[headerIndex] || [];
      console.log(
        "Header row index detectada para 'dados':",
        headerIndex,
        "headerRow:",
        headerRow.slice(0, 30)
      );

      const findColByHeader = (keywords) => {
        const low = headerRow.map((h) => String(h || "").toLowerCase());
        for (const k of keywords) {
          const idx = low.findIndex((x) => x.includes(k));
          if (idx !== -1) return idx;
        }
        return -1;
      };

      let parceiroCol = findColByHeader([
        "resp",
        "respons",
        "parceiro",
        "parceiros",
      ]);
      let centralizadoraCol = findColByHeader([
        "centraliz",
        "centralizada",
        "centralizadora",
      ]);
      let faixaCol = findColByHeader([
        "faixa",
        "dias",
        "prazo",
        "até 5",
        "até 10",
        "até 15",
        "acima 15",
      ]);

      // detect partner column by content (score penaliza centrais)
      const detectPartnerColByContent = () => {
        const maxCols = Math.max(30, headerRow.length || 30);
        const rowsToScan = Math.min(100, rows.length - (headerIndex + 1));
        let bestCol = -1;
        let bestRatio = 0;
        for (let c = 0; c < maxCols; c++) {
          let samples = 0,
            partnerMatches = 0,
            centralMatches = 0;
          for (
            let r = headerIndex + 1;
            r < Math.min(rows.length, headerIndex + 1 + rowsToScan);
            r++
          ) {
            const cellRaw = String((rows[r] || [])[c] ?? "");
            const cell = normalizeCode(cellRaw);
            if (!cell) continue;
            samples++;
            if (PARTNER_CODES_NORM.has(cell)) partnerMatches++;
            if (CENTRAL_KEYS_NORM.has(cell)) centralMatches++;
          }
          if (samples > 0) {
            const ratio = (partnerMatches - 0.6 * centralMatches) / samples;
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestCol = c;
            }
          }
        }
        if (bestRatio > 0.05) return bestCol;
        return -1;
      };

      if (parceiroCol === -1) {
        const detected = detectPartnerColByContent();
        if (detected !== -1) parceiroCol = detected;
      } else {
        // validate
        let samples = 0,
          partnerMatches = 0,
          centralMatches = 0;
        for (
          let r = headerIndex + 1;
          r < Math.min(rows.length, headerIndex + 1 + 40);
          r++
        ) {
          const cellRaw = String((rows[r] || [])[parceiroCol] ?? "");
          const cell = normalizeCode(cellRaw);
          if (!cell) continue;
          samples++;
          if (PARTNER_CODES_NORM.has(cell)) partnerMatches++;
          if (CENTRAL_KEYS_NORM.has(cell)) centralMatches++;
        }
        const score =
          samples > 0 ? (partnerMatches - 0.6 * centralMatches) / samples : 0;
        if (score <= 0.05) {
          const detected = detectPartnerColByContent();
          if (detected !== -1) parceiroCol = detected;
        }
      }

      // detect centralizadora col if missing
      if (centralizadoraCol === -1) {
        const centralKeys = Array.from(CENTRAL_KEYS_NORM);
        const maxCols = Math.max(20, headerRow.length || 20);
        for (let c = 0; c < maxCols; c++) {
          let samples = 0,
            matches = 0;
          for (
            let r = headerIndex + 1;
            r < Math.min(rows.length, headerIndex + 1 + 60);
            r++
          ) {
            const cell = normalizeCode((rows[r] || [])[c] ?? "");
            if (!cell) continue;
            samples++;
            if (centralKeys.includes(cell)) matches++;
          }
          if (samples > 0 && matches / samples >= 0.35) {
            centralizadoraCol = c;
            break;
          }
        }
      }

      // avoid same column
      if (parceiroCol !== -1 && centralizadoraCol === parceiroCol) {
        console.warn(
          "ParceiroCol e CentralizadoraCol detectados iguais. CentralizadoraCol será ignorada para evitar sobreposição."
        );
        centralizadoraCol = -1;
      }

      if (parceiroCol === -1) parceiroCol = 11; // fallback L
      if (faixaCol === -1) faixaCol = 5;

      console.log(
        "Detecção colunas (parceiroCol, centralizadoraCol, faixaCol):",
        parceiroCol,
        centralizadoraCol,
        faixaCol
      );
      console.log(
        "Amostra rows (headerIndex..headerIndex+4):",
        rows.slice(headerIndex, headerIndex + 5).map((r) => r.slice(0, 30))
      );

      // categorize faixa
      function categorizeFaixa(val) {
        if (val === null || val === undefined) return "Acima 15 Dias";
        const s = String(val).trim().toLowerCase();
        if (s.includes("até 5")) return "Até 5 Dias";
        if (s.includes("até 10")) return "Até 10 Dias";
        if (s.includes("até 15")) return "Até 15 Dias";
        if (s.includes("acima 15") || s.includes("mais"))
          return "Acima 15 Dias";
        const m = s.match(/(\d{1,3})/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (!Number.isNaN(n)) {
            if (n <= 5) return "Até 5 Dias";
            if (n <= 10) return "Até 10 Dias";
            if (n <= 15) return "Até 15 Dias";
            return "Acima 15 Dias";
          }
        }
        return "Acima 15 Dias";
      }

      // infer centralizadora from partner using the authoritative map
      function inferCentralizadoraFromPartner(part) {
        if (!part) return "";
        const code = normalizeCode(part);
        for (const key of Object.keys(CENTRALIZADORA_MAP)) {
          const arr = CENTRALIZADORA_MAP[key].map((c) => normalizeCode(c));
          if (arr.includes(code)) return key;
        }
        return "";
      }

      // build counts, enforcing authoritative mapping for centralizadora when available
      const map = {};
      for (let r = headerIndex + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        // read parceiro
        const rawParceiro = row[parceiroCol];
        const parceiroRawStr =
          rawParceiro !== undefined && rawParceiro !== null
            ? String(rawParceiro).trim()
            : "";
        if (!parceiroRawStr) continue;
        const parceiroNorm = normalizeCode(parceiroRawStr);

        // ignore forcible codes (e.g., MTZ)
        if (IGNORE_SET.has(parceiroNorm)) continue;

        // determine centralizadora by authoritative map FIRST
        let centralFromMap = inferCentralizadoraFromPartner(parceiroRawStr); // returns key or ""
        let centralizadora =
          centralFromMap ||
          (centralizadoraCol !== -1
            ? String(row[centralizadoraCol] ?? "").trim()
            : "");
        // If sheet centralizadora is in IGNORE_SET, drop it
        if (
          normalizeCode(centralizadora) &&
          IGNORE_SET.has(normalizeCode(centralizadora))
        )
          centralizadora = "";

        // if centralFromMap exists but is in FORCIBLE_IGNORE (unlikely), avoid showing it
        if (centralFromMap && IGNORE_SET.has(normalizeCode(centralFromMap)))
          centralizadora = "";

        // faixa
        const faixaRaw = row[faixaCol] ?? "";
        const faixaCat = categorizeFaixa(faixaRaw);

        const parceiroDisplay = String(parceiroRawStr).trim();

        if (!map[parceiroDisplay]) {
          map[parceiroDisplay] = {
            parceiro: parceiroDisplay,
            centralizadora: centralizadora || "",
            faixaCounts: {
              "Até 5 Dias": 0,
              "Até 10 Dias": 0,
              "Até 15 Dias": 0,
              "Acima 15 Dias": 0,
            },
            total: 0,
          };
        }

        map[parceiroDisplay].faixaCounts[faixaCat] =
          (map[parceiroDisplay].faixaCounts[faixaCat] || 0) + 1;
        map[parceiroDisplay].total = (map[parceiroDisplay].total || 0) + 1;

        // ensure centralizadora is filled (prefer map value)
        if (
          (!map[parceiroDisplay].centralizadora ||
            map[parceiroDisplay].centralizadora === "") &&
          centralizadora
        ) {
          map[parceiroDisplay].centralizadora = centralizadora;
        }
      }

      const rankingArray = Object.values(map);
      console.log(
        "Ranking construído (amostra 30):",
        rankingArray.slice(0, 30)
      );
      setRankingData(rankingArray);
    } catch (err) {
      console.error("Erro ao montar ranking:", err);
    }

    // ---------- GRÁFICO: (manualmente preenchido por enquanto) ----------
    const manualChart = [
      { month: "Jan", value: 10, info: "Detalhes Jan" },
      { month: "Fev", value: 8, info: "Detalhes Fev" },
      { month: "Mar", value: 12, info: "Detalhes Mar" },
      { month: "Abr", value: 6, info: "Detalhes Abr" },
      { month: "Mai", value: 9, info: "Detalhes Mai" },
      { month: "Jun", value: 7, info: "Detalhes Jun" },
      { month: "Jul", value: 14, info: "Detalhes Jul" },
      { month: "Ago", value: 11, info: "Detalhes Ago" },
      { month: "Set", value: 5, info: "Detalhes Set" },
      { month: "Out", value: 4, info: "Detalhes Out" },
      { month: "Nov", value: 3, info: "Detalhes Nov" },
      { month: "Dez", value: 1, info: "Detalhes Dez" },
    ];
    setChartData(manualChart);

    // ---------- CLIENTES ONBOARDING e RISCO (mantido, mas ignorando MTZ) ----------
    try {
      const sheet =
        wbData.Sheets["Clientes em Risco"] ||
        wbData.Sheets["Clientes em risco"] ||
        wbData.Sheets["CLIENTES EM RISCO"] ||
        wbData.Sheets[wbData.SheetNames.find((n) => /clientes/i.test(n))];
      const rows = sheetToJson(sheet);
      const headerIndex = 6; // linha 7
      const headers = (rows[headerIndex] || []).slice(3, 9).map((h) => h ?? "");
      setOnboardingHeaders(headers);
      setRiskHeaders(headers);

      let onboardingStart = -1;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        const joined = (row || []).join(" ").toLowerCase();
        if (
          joined.includes("clientes omboarding") ||
          joined.includes("clientes onboarding")
        ) {
          onboardingStart = i + 1;
          break;
        }
      }
      const onboarding = [];
      if (onboardingStart !== -1) {
        for (let r = onboardingStart; r < rows.length; r++) {
          const row = rows[r];
          if (!row) break;
          const joined = (row || []).join(" ").toLowerCase();
          if (
            joined.includes("risco 3") ||
            joined.includes("risco 2") ||
            joined.includes("risco 1") ||
            /total geral|total/i.test(joined)
          )
            break;
          const slice = [];
          for (let c = 3; c <= 8; c++) slice.push(row[c] ?? "");
          if (slice.every((v) => v === "")) continue;
          // ignore rows that contain MTZ anywhere
          const anyContainsMTZ = slice.some((val) =>
            IGNORE_SET.has(normalizeCode(val))
          );
          if (anyContainsMTZ) continue;
          onboarding.push(slice);
        }
      } else {
        for (let r = headerIndex + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row) break;
          const slice = [];
          for (let c = 3; c <= 8; c++) slice.push(row[c] ?? "");
          if (slice.every((v) => v === "")) continue;
          const joined = (row || []).join(" ").toLowerCase();
          if (/total geral|total/i.test(joined)) break;
          const anyContainsMTZ = slice.some((val) =>
            IGNORE_SET.has(normalizeCode(val))
          );
          if (anyContainsMTZ) continue;
          onboarding.push(slice);
        }
      }
      setOnboardingRows(onboarding);

      // riscos
      const risco3 = [];
      const risco2 = [];
      const risco1 = [];
      let currentRisk = null;
      for (let r = headerIndex + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row) continue;
        const joined = (row || []).join(" ").toLowerCase();
        if (joined.includes("risco 3")) {
          currentRisk = 3;
          continue;
        }
        if (joined.includes("risco 2")) {
          currentRisk = 2;
          continue;
        }
        if (joined.includes("risco 1")) {
          currentRisk = 1;
          continue;
        }
        if (
          joined.includes("clientes omboarding") ||
          joined.includes("clientes onboarding")
        )
          break;
        if (currentRisk) {
          const slice = [];
          for (let c = 3; c <= 8; c++) slice.push(row[c] ?? "");
          if (slice.every((v) => v === "")) continue;
          const anyContainsMTZ = slice.some((val) =>
            IGNORE_SET.has(normalizeCode(val))
          );
          if (anyContainsMTZ) continue;
          if (currentRisk === 3) risco3.push(slice);
          if (currentRisk === 2) risco2.push(slice);
          if (currentRisk === 1) risco1.push(slice);
        }
      }
      setRiscoRows({ risco3, risco2, risco1 });
    } catch (err) {
      console.error("Erro ao montar tabelas de risco/onboarding:", err);
    }
  }, [wbData]);

  function handleBarClick(data, index) {
    setShowMonthPopup({ ...data, index });
    setTimeout(() => setShowMonthPopup(null), 4000);
  }

  return (
    <div className="home-container">
      <div className="top-cards">
        <StatCard title="Total de B.Os hoje" value={cards.totalHoje} />
        <StatCard title="B.Os abertos hoje" value={cards.abertosHoje} />
        <StatCard title="B.Os Fechados hoje" value={cards.fechadosHoje} />
        <StatCard title="B.Os sem parecer" value={cards.semParecer} />
        <StatCard title="B.Os Falta total" value={cards.faltaTotal} />
        <StatCard title="B.Os avaria Total" value={cards.avariaTotal} />
      </div>

      <div className="middle-row">
        <div className="ranking-column">
          <RankingTable
            rankingData={rankingData}
            previousRanks={previousRanks}
          />
        </div>

        <div className="chart-column">
          <div className="chart-card">
            <h3>Gráfico Mês a Mês</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 12, left: 0, bottom: 10 }}
                onMouseLeave={() => setActiveBarIndex(null)}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="value"
                  onClick={(d, idx) => handleBarClick(d.payload, idx)}
                  onMouseEnter={(_, idx) => setActiveBarIndex(idx)}
                >
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={idx === activeBarIndex ? "#a28ef0" : "#8884d8"}
                      className="chart-bar-cell"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {showMonthPopup && (
              <div className="month-popup">
                <strong>{showMonthPopup.month}</strong>: {showMonthPopup.value}{" "}
                itens
                <div className="popup-info">{showMonthPopup.info}</div>
              </div>
            )}
          </div>

          {/* Onboarding abaixo do gráfico */}
          <div className="onboarding-card">
            <h3>Clientes Onboarding</h3>
            <div className="onboarding-table-wrapper">
              <table className="onboarding-table">
                <thead>
                  <tr>
                    {(onboardingHeaders || []).map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(onboardingRows || []).map((r, i) => (
                    <tr key={i}>
                      {(onboardingHeaders || []).map((_, j) => (
                        <td key={j}>{r[j] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Riscos 3/2/1 em linha */}
      <div className="lower-section">
        <div className="three-risks">
          <div className="risk-col">
            <h4>Clientes em Risco 3</h4>
            <table className="risk-table">
              <thead>
                <tr>
                  {(riskHeaders || []).map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(riscoRows.risco3 || []).map((r, i) => (
                  <tr key={i}>
                    {(riskHeaders || []).map((_, j) => (
                      <td key={j}>{r[j] ?? ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="risk-col">
            <h4>Clientes em Risco 2</h4>
            <table className="risk-table">
              <thead>
                <tr>
                  {(riskHeaders || []).map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(riscoRows.risco2 || []).map((r, i) => (
                  <tr key={i}>
                    {(riskHeaders || []).map((_, j) => (
                      <td key={j}>{r[j] ?? ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="risk-col">
            <h4>Clientes em Risco 1</h4>
            <table className="risk-table">
              <thead>
                <tr>
                  {(riskHeaders || []).map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(riscoRows.risco1 || []).map((r, i) => (
                  <tr key={i}>
                    {(riskHeaders || []).map((_, j) => (
                      <td key={j}>{r[j] ?? ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
