import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import "./Monitoramento.css";

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

export default function Monitoramento() {
  const [dados, setDados] = useState([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [clientesRiscoReais, setClientesRiscoReais] = useState([]);
  const [rankingAnterior, setRankingAnterior] = useState([]);
  const [hoveredOfensora, setHoveredOfensora] = useState(null);

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

        // DADOS GERAIS
        const sheet = workbook.Sheets["Dados"];
        if (!sheet) {
          setErro("A aba 'Dados' não foi encontrada no Excel.");
          setLoading(false);
          return;
        }
        const allRows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        });
        const headerRow = allRows[9];
        const dataRows = allRows.slice(10);
        const json = dataRows
          .filter((row) => row.some((cell) => cell !== "")) // remove linhas completamente vazias
          .map((row) => {
            const obj = {};
            headerRow.forEach((col, i) => {
              obj[col] = row[i];
            });
            return obj;
          });
        setDados(json);

        // CLIENTES EM RISCO (aba "Clientes em Risco")
        const abaRisco = workbook.Sheets["Clientes em Risco"];
        if (abaRisco) {
          const ref = abaRisco["!ref"];
          const range = XLSX.utils.decode_range(ref);
          let riscos = [
            { risco: 3, clientes: [] },
            { risco: 2, clientes: [] },
            { risco: 1, clientes: [] },
          ];
          let riscoAtual = null;
          for (let r = 7; r <= range.e.r; r++) {
            // linha 8 no Excel = index 7
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
      } catch (err) {
        console.error("Erro ao processar o arquivo Excel:", err);
        setErro("Erro ao processar o arquivo Excel.");
      } finally {
        setLoading(false);
      }
    };
    carregarExcel();
  }, []);

  useEffect(() => {
    const lastRanking = localStorage.getItem("parceirosRanking");
    if (lastRanking) setRankingAnterior(JSON.parse(lastRanking));
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

  // Total de B.Os
  const totalBOs = dados.length;
  const hojeStr = getTodayStr();

  const totalAbertosHoje = dados.filter((d) => {
    const dataAbertura = normalizaData(d[COL_EMISSAO]);
    return dataAbertura === hojeStr;
  }).length;

  const totalFechadosHoje = dados.filter((d) => {
    const dataFechamento = normalizaData(d[COL_DT_PARECER]);
    return dataFechamento === hojeStr;
  }).length;

  const totalSemParecer = dados.filter(
    (d) =>
      (d[COL_DIAS_SEM_ACOMP] || "").toString().trim().toLowerCase() ===
      "sem acompanhamento"
  ).length;

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
    // eslint-disable-next-line
  }, [dados.length]);

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

  function nomeMes(num) {
    const nomes = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    return nomes[num - 1];
  }

  const ANO_GRAFICO = "2025";
  const bosPorMes = Array.from({ length: 12 }, (_, idx) => ({
    mes: nomeMes(idx + 1),
    bos: 0,
  }));

  dados.forEach((d) => {
    const valor = d[COL_EMISSAO];
    if (!valor) return;
    let dataStr = "";
    if (typeof valor === "number") {
      dataStr = XLSX.SSF.format("yyyy-mm-dd", valor);
    } else if (typeof valor === "string") {
      dataStr = valor;
    }
    if (!dataStr) return;
    const [ano, mes] = dataStr.split("-");
    if (ano !== ANO_GRAFICO) return;
    const mesIdx = Number(mes) - 1;
    if (mesIdx >= 0 && mesIdx <= 11) bosPorMes[mesIdx].bos++;
  });

  // --- CSS para exibir os quadros lado a lado ---
  const clientesRiscoQuadrosStyle = {
    display: "flex",
    flexDirection: "row",
    gap: "16px",
    justifyContent: "center",
    alignItems: "flex-start",
    flexWrap: "wrap",
  };

  return (
    <div className="monitoramento-page">
      <div className="monitoramento-header">
        <h1>Monitoramento de B.Os</h1>
        <span className="monitoramento-desc">
          Visualize as métricas e situações dos B.Os extraídas do banco de dados
          (Excel).
        </span>
      </div>
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
                <span>{totalBOs}</span>
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
                <span>{totalSemParecer}</span>
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
              {/* FIM Top 10 Parceiros */}

              {/* Evolução mensal */}
              <div className="evolucao-mensal-card">
                <h3 className="evolucao-mensal-titulo">
                  Evolução Mensal de B.Os
                </h3>
                <div className="evolucao-mensal-grafico-container">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart
                      data={bosPorMes}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="bos" fill="#f0f0f0ff" barSize={22} />
                      <Line
                        type="monotone"
                        dataKey="bos"
                        stroke="#ff9100ff"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#ff1100ff" }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="evolucao-mensal-explicacao">
                  <span>
                    Este gráfico demonstra a evolução mensal da quantidade de
                    B.Os registrados, permitindo visualizar tendências, picos e
                    quedas ao longo do ano e facilitando a tomada de decisões
                    para melhorar os resultados.
                  </span>
                </div>
              </div>
              {/* FIM Card de evolução por mês */}
            </div>
          </div>
          {/* PARTE INFERIOR */}
          <div className="monitoramento-section monitoramento-inferior">
            <div className="monitoramento-graficos-e-tabela">
              <div
                className="clientes-risco-cards-linha"
                style={clientesRiscoQuadrosStyle}
              >
                {clientesRiscoReais.map((riscoItem) => (
                  <div
                    key={riscoItem.risco}
                    className="clientes-risco-card clientes-risco-margin"
                  >
                    <h3>Clientes em Risco</h3>
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
                          <th
                            style={{
                              background: riscoColors[3],
                              color: "#fff",
                            }}
                          >
                            acima de 15 dias
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {riscoItem.clientes.map((cli, idx) => (
                          <tr key={cli.nome + idx}>
                            <td>{cli.nome}</td>
                            <td style={{ background: riscoColors[0] }}>
                              {cli.dias5}
                            </td>
                            <td style={{ background: riscoColors[1] }}>
                              {cli.dias10}
                            </td>
                            <td style={{ background: riscoColors[2] }}>
                              {cli.dias15}
                            </td>
                            <td
                              style={{
                                background: riscoColors[3],
                                color: "#fff",
                              }}
                            >
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
