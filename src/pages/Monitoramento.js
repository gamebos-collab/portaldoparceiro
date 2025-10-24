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

/* -------------------------
   Centralizadora / parceiros
   ------------------------- */
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

// Always-ignored codes (normalized) — usado apenas para ranking/cards
const FORCIBLE_IGNORE = ["MTZ"];

/* -------------------------
   Utilities
   ------------------------- */
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

const PARTNER_CODES_NORM = new Set(
  Object.values(CENTRALIZADORA_MAP)
    .flat()
    .map((c) => normalizeCode(c))
);

const CENTRAL_KEYS_NORM = new Set(
  Object.keys(CENTRALIZADORA_MAP).map((k) => normalizeCode(k))
);

FORCIBLE_IGNORE.forEach((c) => CENTRAL_KEYS_NORM.add(normalizeCode(c)));

const IGNORE_SET = new Set(FORCIBLE_IGNORE.map((c) => normalizeCode(c)));

const PARTNER_TO_CENTRAL = {};
Object.keys(CENTRALIZADORA_MAP).forEach((central) => {
  const partners = CENTRALIZADORA_MAP[central] || [];
  partners.forEach((p) => {
    const pn = normalizeCode(p);
    if (pn) PARTNER_TO_CENTRAL[pn] = central;
  });
});

function sheetToJson(sheet) {
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
}

/* -------------------------
   StatCard
   ------------------------- */
function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value ?? "--"}</div>
    </div>
  );
}

/* -------------------------
   Modified RankingTable (somente exibição)
   - buckets: "0 a 5", "6 a 10", "11 a 15", "> 15"
   - limita para 12 linhas
   ------------------------- */
function RankingTable({ rankingData, previousRanks }) {
  const toBucketValue = (r, key) => {
    if (!r) return 0;
    if (r.counts && Object.prototype.hasOwnProperty.call(r.counts, key)) {
      return r.counts[key] ?? 0;
    }
    const legacyMap = {
      "0 a 5": "Até 5 Dias",
      "6 a 10": "Até 10 Dias",
      "11 a 15": "Até 15 Dias",
      "> 15": "Acima 15 Dias",
    };
    if (
      r.faixaCounts &&
      legacyMap[key] &&
      Object.prototype.hasOwnProperty.call(r.faixaCounts, legacyMap[key])
    ) {
      return r.faixaCounts[legacyMap[key]] ?? 0;
    }
    return 0;
  };

  const sorted = [...(rankingData || [])].sort(
    (a, b) => (b.total || 0) - (a.total || 0)
  );
  const top = sorted.slice(0, 20); // apenas 20 linhas exibidas

  return (
    <div className="ranking-wrapper">
      <h3 style={{ textAlign: "center" }}>
        <i>PARCEIROS MAIS OFENSORES</i>
      </h3>

      <table className="ranking-table">
        <thead>
          <tr>
            <th>Parceiro</th>
            <th>Centralizadora</th>
            <th>0 a 5</th>
            <th>6 a 10</th>
            <th>11 a 15</th>
            <th>&gt; 15</th>
            <th>Total Geral</th>
          </tr>
        </thead>
        <tbody>
          {top.map((r, idx) => {
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

            const v0 = toBucketValue(r, "0 a 5");
            const v1 = toBucketValue(r, "6 a 10");
            const v2 = toBucketValue(r, "11 a 15");
            const v3 = toBucketValue(r, "> 15");

            const computedTotal =
              (Number(v0) || 0) +
              (Number(v1) || 0) +
              (Number(v2) || 0) +
              (Number(v3) || 0);
            const total =
              r.total !== undefined && r.total !== null
                ? r.total
                : computedTotal;

            let central = r.centralizadora || "";
            if (!central && r.parceiro) {
              const pn = normalizeCode(r.parceiro);
              if (PARTNER_TO_CENTRAL[pn]) central = PARTNER_TO_CENTRAL[pn];
            }
            if (central && IGNORE_SET.has(normalizeCode(central))) central = "";

            return (
              <tr key={r.parceiro || idx}>
                <td className="partner-cell">
                  <div className="partner-name">
                    <Icon className={`movement-icon ${iconClass}`} />
                    <span>{r.parceiro}</span>
                  </div>
                </td>
                <td>{central}</td>
                <td>{v0}</td>
                <td>{v1}</td>
                <td>{v2}</td>
                <td>{v3}</td>
                <td>{total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------
   Main component
   ------------------------- */
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
          console.log("Fetch", url, "=>", res.status);
          if (!res.ok) continue;
          const ct = (res.headers.get("content-type") || "").toLowerCase();
          if (ct.includes("text/html") || ct.includes("application/xhtml+xml"))
            continue;
          const ab = await res.arrayBuffer();
          try {
            const wb = XLSX.read(ab, { type: "array" });
            console.log("Workbook carregado:", wb.SheetNames);
            setWbData(wb);
            return;
          } catch (err) {
            console.warn("Falha parsear xlsx:", err);
            continue;
          }
        } catch (err) {
          console.warn("Erro fetch", url, err);
        }
      }
      console.error("Não foi possível carregar kpiparceiro (.xlsm/.xlsx).");
    }
    loadWorkbook();
  }, []);

  // processa workbook e popula estados
  useEffect(() => {
    if (!wbData) return;

    // ---------- CARDS ----------
    try {
      const names = wbData.SheetNames || [];
      const targetName =
        names.find((n) => n && n.trim().toLowerCase() === "kpiparceiro") ||
        names[0];
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

      const cellsMap = {
        totalHoje: "BJ11",
        abertosHoje: "BM11",
        fechadosHoje: "BK11",
        semParecer: "BR11",
        faltaTotal: "BO11",
        avariaTotal: "BQ11",
      };

      const newCards = {};
      for (const key of Object.keys(cellsMap)) {
        const addr = cellsMap[key];
        const raw = readCellValue(s, addr);
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

    // ---------- RANKING (aba "Dados") ----------
    try {
      // find sheet named "dados" (case-insensitive)
      const sheetNameCandidate =
        wbData.SheetNames.find((n) => /^dados$/i.test(n)) ||
        wbData.SheetNames.find((n) => /dados/i.test(n));
      const sheet = wbData.Sheets[sheetNameCandidate || wbData.SheetNames[0]];
      const rows = sheetToJson(sheet || {});
      if (!rows || rows.length === 0) {
        console.warn(
          "Aba 'Dados' vazia ou não encontrada; não será possível montar ranking."
        );
        return;
      }

      // The user indicated "Resp" header starts at line 10 (1-based), i.e., index 9.
      // We'll search for a header row containing 'resp' in the first 20 rows, else default to row 9.
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
      if (headerIndex === -1) {
        // default to row 10 => index 9
        headerIndex = rows.length > 9 ? 9 : 0;
      }

      const headerRow = rows[headerIndex] || [];
      console.log(
        "Header row index detectada para 'Dados':",
        headerIndex,
        headerRow.slice(0, 30)
      );

      const findColByHeaderNames = (names) => {
        const low = headerRow.map((h) => String(h || "").toLowerCase());
        for (const n of names) {
          const idx = low.findIndex((x) => x.includes(n));
          if (idx !== -1) return idx;
        }
        return -1;
      };

      // Identify columns
      let parceiroCol = findColByHeaderNames([
        "resp",
        "respons",
        "parceiro",
        "parceiros",
      ]);
      let centralizadoraCol = findColByHeaderNames([
        "centraliz",
        "centralizada",
        "centralizadora",
        "central",
      ]);
      let faixa0Col = findColByHeaderNames([
        "0 a 5",
        "0a5",
        "até 5",
        "ate 5",
        "0-5",
      ]);
      let faixa1Col = findColByHeaderNames([
        "6 a 10",
        "6a10",
        "6-10",
        "até 10",
        "ate 10",
      ]);
      let faixa2Col = findColByHeaderNames([
        "11 a 15",
        "11a15",
        "11-15",
        "até 15",
        "ate 15",
      ]);
      let faixa3Col = findColByHeaderNames([
        "> 15",
        ">15",
        "acima 15",
        "maior 15",
        "acima de 15",
      ]);

      // Fallbacks: sometimes the faixa columns are grouped in a single "faixa" column or different labels.
      // We'll also attempt to find any column headers that look like numeric ranges if above failed.
      if (parceiroCol === -1) {
        // try to detect by content (partners are known codes)
        const maxCols = Math.max(30, headerRow.length || 30);
        const rowsToScan = Math.min(100, rows.length - (headerIndex + 1));
        let bestCol = -1,
          bestRatio = 0;
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
        if (bestRatio > 0.05) parceiroCol = bestCol;
      }

      // If central not found, we'll still allow it to be empty and infer later from partner
      if (centralizadoraCol === -1) {
        // try a heuristic: any column containing many central keys
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
            if (CENTRAL_KEYS_NORM.has(cell)) matches++;
          }
          if (samples > 0 && matches / samples >= 0.35) {
            centralizadoraCol = c;
            break;
          }
        }
      }

      // If faixa columns missing, attempt to detect columns that contain small integers (0..big) and maybe column headers nearby saying "faixa" or "dias".
      const tryDetectFaixaByNearby = (aroundNames, preferOffset) => {
        // look for header that mentions 'faixa' or 'dias', then try nearby columns
        for (let i = 0; i < headerRow.length; i++) {
          const h = String(headerRow[i] || "").toLowerCase();
          if (/faixa|dias|prazo|ate|até/.test(h)) {
            // try offsets
            for (let off = 1; off <= 4; off++) {
              const idx = i + off;
              if (idx < headerRow.length) {
                const label = String(headerRow[idx] || "").toLowerCase();
                if (label && (/\d/.test(label) || /[0-9]/.test(label)))
                  return idx;
              }
            }
          }
        }
        // general scan: find a column where most values are small integers (0..100)
        const maxCols = Math.max(headerRow.length, 20);
        for (let c = 0; c < maxCols; c++) {
          let samples = 0,
            smallInts = 0;
          for (
            let r = headerIndex + 1;
            r < Math.min(rows.length, headerIndex + 1 + 200);
            r++
          ) {
            const val = (rows[r] || [])[c];
            if (val === undefined || val === null || String(val).trim() === "")
              continue;
            samples++;
            const s = String(val).replace(/\s/g, "").replace(",", ".");
            const m = s.match(/^-?\d+/);
            if (m) {
              const n = Number(m[0]);
              if (!Number.isNaN(n) && Math.abs(n) <= 100) smallInts++;
            }
          }
          if (samples > 0 && smallInts / samples > 0.6) {
            return c;
          }
        }
        return -1;
      };

      if (
        faixa0Col === -1 ||
        faixa1Col === -1 ||
        faixa2Col === -1 ||
        faixa3Col === -1
      ) {
        // try to find a starting column that contains faixa data and then assume 4 consecutive columns
        const candidateStart = tryDetectFaixaByNearby();
        if (candidateStart !== -1) {
          if (faixa0Col === -1) faixa0Col = candidateStart;
          if (faixa1Col === -1) faixa1Col = candidateStart + 1;
          if (faixa2Col === -1) faixa2Col = candidateStart + 2;
          if (faixa3Col === -1) faixa3Col = candidateStart + 3;
        }
      }

      // Last resort fallbacks: reasonable defaults
      if (parceiroCol === -1) parceiroCol = 11; // as before
      if (faixa0Col === -1) faixa0Col = 5;
      if (faixa1Col === -1) faixa1Col = faixa0Col + 1;
      if (faixa2Col === -1) faixa2Col = faixa0Col + 2;
      if (faixa3Col === -1) faixa3Col = faixa0Col + 3;

      console.log(
        "Detecção colunas (parceiroCol, centralizadoraCol, faixa0..3):",
        parceiroCol,
        centralizadoraCol,
        faixa0Col,
        faixa1Col,
        faixa2Col,
        faixa3Col
      );
      console.log(
        "Amostra rows (headerIndex..headerIndex+4):",
        rows.slice(headerIndex, headerIndex + 5).map((r) => r.slice(0, 30))
      );

      // helper to parse numeric counts (tolerant)
      const parseCount = (v) => {
        if (v === undefined || v === null) return 0;
        if (typeof v === "number") return Math.max(0, Math.trunc(v));
        const s = String(v).trim();
        if (s === "") return 0;
        // try to extract first integer
        const m = s.replace(/\./g, "").replace(",", ".").match(/-?\d+/);
        if (m) {
          const n = Number(m[0]);
          return Number.isNaN(n) ? 0 : Math.max(0, Math.trunc(n));
        }
        return 0;
      };

      // check hidden rows via sheet['!rows'] (if available)
      const sheetRowsInfo = sheet && sheet["!rows"] ? sheet["!rows"] : null;

      // build counts map: keys are partner display name (raw string from sheet)
      const map = {};
      for (let r = headerIndex + 1; r < rows.length; r++) {
        // skip hidden rows if info present. Note: sheet['!rows'] is 0-based, aligns with rows[] indexes
        if (sheetRowsInfo && sheetRowsInfo[r] && sheetRowsInfo[r].hidden)
          continue;

        const row = rows[r];
        if (!row || row.length === 0) continue;

        const rawParceiro = row[parceiroCol];
        const parceiroRawStr =
          rawParceiro !== undefined && rawParceiro !== null
            ? String(rawParceiro).trim()
            : "";
        if (!parceiroRawStr) continue;
        const parceiroNorm = normalizeCode(parceiroRawStr);

        // accept only known partners (exact list provided)
        if (!PARTNER_CODES_NORM.has(parceiroNorm)) continue;

        // ignore forcible codes (e.g., MTZ) and any central keys (safety)
        if (IGNORE_SET.has(parceiroNorm) || CENTRAL_KEYS_NORM.has(parceiroNorm))
          continue;

        // centralizadora prefer authoritative mapping by partner -> central; else from sheet column if present
        let centralFromMap = PARTNER_TO_CENTRAL[parceiroNorm] || "";
        let centralizadora = centralFromMap;
        if (!centralizadora && centralizadoraCol !== -1) {
          centralizadora = String(row[centralizadoraCol] ?? "").trim();
        }
        if (centralizadora && IGNORE_SET.has(normalizeCode(centralizadora)))
          centralizadora = "";

        // read faixa counts from the detected columns (0 a 5, 6 a 10, 11 a 15, > 15)
        const v0 = parseCount(row[faixa0Col]);
        const v1 = parseCount(row[faixa1Col]);
        const v2 = parseCount(row[faixa2Col]);
        const v3 = parseCount(row[faixa3Col]);
        const total = v0 + v1 + v2 + v3;

        const parceiroDisplay = String(parceiroRawStr).trim();

        if (!map[parceiroDisplay]) {
          map[parceiroDisplay] = {
            parceiro: parceiroDisplay,
            centralizadora: centralizadora || "",
            counts: {
              "0 a 5": 0,
              "6 a 10": 0,
              "11 a 15": 0,
              "> 15": 0,
            },
            total: 0,
          };
        }

        // aggregate values (in case multiple rows for the same partner)
        map[parceiroDisplay].counts["0 a 5"] =
          (map[parceiroDisplay].counts["0 a 5"] || 0) + v0;
        map[parceiroDisplay].counts["6 a 10"] =
          (map[parceiroDisplay].counts["6 a 10"] || 0) + v1;
        map[parceiroDisplay].counts["11 a 15"] =
          (map[parceiroDisplay].counts["11 a 15"] || 0) + v2;
        map[parceiroDisplay].counts["> 15"] =
          (map[parceiroDisplay].counts["> 15"] || 0) + v3;
        map[parceiroDisplay].total = (map[parceiroDisplay].total || 0) + total;

        // if we didn't have a centralizadora yet, try to fill with detected one
        if (
          (!map[parceiroDisplay].centralizadora ||
            map[parceiroDisplay].centralizadora === "") &&
          centralizadora
        ) {
          map[parceiroDisplay].centralizadora = centralizadora;
        }
      }

      const rankingArray = Object.values(map);

      // final safety: ensure numeric totals consistent with counts
      rankingArray.forEach((r) => {
        const computed =
          (Number(r.counts["0 a 5"]) || 0) +
          (Number(r.counts["6 a 10"]) || 0) +
          (Number(r.counts["11 a 15"]) || 0) +
          (Number(r.counts["> 15"]) || 0);
        if (!r.total || r.total !== computed) r.total = computed;
      });

      console.log(
        "Ranking construído (amostra 30):",
        rankingArray.slice(0, 30)
      );
      setRankingData(rankingArray);
    } catch (err) {
      console.error("Erro ao montar ranking:", err);
    }

    // ---------- GRÁFICO: (placeholder) ----------
    setChartData([
      { month: "Jan", value: 10, info: "Detalhes Janeiro" },
      { month: "Fev", value: 8, info: "Detalhes Fevereiro" },
      { month: "Mar", value: 12, info: "Detalhes Março" },
      { month: "Abr", value: 6, info: "Detalhes Abril" },
      { month: "Mai", value: 6, info: "Detalhes Maio" },
      { month: "Jun", value: 6, info: "Detalhes Junho" },
      { month: "Jul", value: 6, info: "Detalhes Julho" },
      { month: "Ago", value: 6, info: "Detalhes Agosto" },
      { month: "Set", value: 6, info: "Detalhes Setembro" },
      { month: "Out", value: 6, info: "Detalhes Outubro" },
      { month: "Nov", value: 6, info: "Detalhes Novembro" },
      { month: "Dez", value: 6, info: "Detalhes Dezembro" },
    ]);

    // ---------- CLIENTES ONBOARDING e RISCO (mantidos sem filtragem MTZ) ----------
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
          onboarding.push(slice);
        }
      }
      setOnboardingRows(onboarding);

      // riscos (mantido como antes, sem filtro MTZ)
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
            <h3 style={{ textAlign: "center" }}>Acompanhamento Mês a Mês</h3>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 12, left: 0, bottom: 10 }}
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
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {showMonthPopup && (
              <div className="month-popup">
                <strong>{showMonthPopup.month}</strong>: {showMonthPopup.value}{" "}
                itens<div className="popup-info">{showMonthPopup.info}</div>
              </div>
            )}
          </div>

          <div className="onboarding-card">
            <h3 style={{ textAlign: "center" }}>
              <i>CLIENTES ONBOARDING</i>
            </h3>
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

      <div className="lower-section">
        <div className="three-risks">
          <div className="risk-col">
            <h3 style={{ textAlign: "center", color: "#ff0000ff" }}>
              <i>CLIENTES EM RISCO 3</i>
            </h3>
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
            <h3 style={{ textAlign: "center", color: "#ffe600ff" }}>
              <i>CLIENTES EM RISCO 2</i>
            </h3>
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
            <h3 style={{ textAlign: "center", color: "#09ff00ff" }}>
              <i>CLIENTES EM RISCO 1</i>
            </h3>
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
