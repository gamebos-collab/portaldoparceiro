import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import "./Monitoramento.css";

const COLORS = ["#3f51b5", "#ff9800", "#4caf50", "#f44336", "#00bcd4"];
const riscoColors = ["#fffbe7", "#fff0b3", "#ffd98a", "#ff4242"];

// Centralizadoras e seus parceiros (para identificar)
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
        const sheet = workbook.Sheets["Dados"];
        if (!sheet) {
          setErro("A aba 'Dados' não foi encontrada no Excel.");
          setLoading(false);
          return;
        }
        // CABEÇALHO NA LINHA 10, dados começam na linha 11 (base 1 - Excel)
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
        if (json.length) console.log("Primeira linha dos dados:", json[0]);
        setDados(json);
      } catch (err) {
        setErro("Erro ao processar o arquivo Excel.");
      } finally {
        setLoading(false);
      }
    };
    carregarExcel();
  }, []);

  const hojeStr = getTodayStr();
  // Colunas do Excel
  const COL_EMISSAO = "Emissão";
  const COL_DT_PARECER = "Dt Parecer";
  const COL_OCORRENCIA = "Ocorrência";
  const COL_DIAS_SEM_ACOMP = "Dias sem acompanhamento";
  const COL_RESP = "Resp";
  const COL_CENTRALIZADORA = "Centralizadora";
  const COL_5 = "0 a 5";
  const COL_10 = "6 a 10";
  const COL_15 = "11 a 15";
  const COL_MAIS15 = "> 15";

  // Total de B.Os (cada linha é um B.O.)
  const totalBOs = dados.length;

  // B.Os abertos hoje (Emissão == hoje)
  const totalAbertosHoje = dados.filter((d) => {
    const dataAbertura = normalizaData(d[COL_EMISSAO]);
    return dataAbertura === hojeStr;
  }).length;

  // B.Os fechados hoje (Dt Parecer == hoje)
  const totalFechadosHoje = dados.filter((d) => {
    const dataFechamento = normalizaData(d[COL_DT_PARECER]);
    return dataFechamento === hojeStr;
  }).length;

  // B.Os sem parecer (Dias sem acompanhamento == "Sem Acompanhamento")
  const totalSemParecer = dados.filter(
    (d) =>
      (d[COL_DIAS_SEM_ACOMP] || "").toString().trim().toLowerCase() ===
      "sem acompanhamento"
  ).length;

  // B.Os Falta Total (Ocorrência == "FALTA TOTAL")
  const totalFaltaTotal = dados.filter(
    (d) =>
      (d[COL_OCORRENCIA] || "").toString().trim().toUpperCase() ===
      "FALTA TOTAL"
  ).length;

  // B.Os Avaria Total (Ocorrência == "AVARIA TOTAL")
  const totalAvariaTotal = dados.filter(
    (d) =>
      (d[COL_OCORRENCIA] || "").toString().trim().toUpperCase() ===
      "AVARIA TOTAL"
  ).length;

  // Veja todos os valores que estão vindo da coluna Emissão
  console.log("Todos os valores da coluna Emissão:");
  dados.forEach((d, i) => {
    if (d.Emissão) console.log(`[${i}]`, d.Emissão, typeof d.Emissão);
  });

  // ======= TOP 10 PARCEIROS MAIS OFENSORES =======
  function getSum(n) {
    return isNaN(Number(n)) ? 0 : Number(n);
  }
  if (dados.length) console.log(dados[0]);
  const parceirosRanking = {};
  dados.forEach((d) => {
    const parceiro = d[COL_RESP];
    if (!parceiro) return;
    // Descobrir a centralizadora do parceiro:
    let centralizadora = "";
    Object.entries(parceirosPorCentralizadora).forEach(([cent, parceiros]) => {
      if (parceiros.includes(parceiro)) centralizadora = cent;
    });
    // Pular se este é uma centralizadora (não parceiro)
    if (Object.keys(parceirosPorCentralizadora).includes(parceiro)) return;
    if (!parceirosRanking[parceiro]) {
      parceirosRanking[parceiro] = {
        parceiro,
        centralizadora,
        dias5: 0,
        dias10: 0,
        dias15: 0,
        mais15: 0,
        totalBOs: 0, // Soma das 4 faixas
        status: "up",
        oldRank: null,
      };
    }
    parceirosRanking[parceiro].dias5 += getSum(d[COL_5]);
    parceirosRanking[parceiro].dias10 += getSum(d[COL_10]);
    parceirosRanking[parceiro].dias15 += getSum(d[COL_15]);
    parceirosRanking[parceiro].mais15 += getSum(d[COL_MAIS15]);
    // Soma total dos B.Os abertos (todas as faixas)
    parceirosRanking[parceiro].totalBOs =
      parceirosRanking[parceiro].dias5 +
      parceirosRanking[parceiro].dias10 +
      parceirosRanking[parceiro].dias15 +
      parceirosRanking[parceiro].mais15;
  });

  // Pega o ranking anterior do localStorage para desenhar a seta de ranking
  const [rankingAnterior, setRankingAnterior] = useState([]);
  useEffect(() => {
    const lastRanking = localStorage.getItem("parceirosRanking");
    if (lastRanking) setRankingAnterior(JSON.parse(lastRanking));
  }, []);
  // Calcula ranking atual (agora ordenando por totalBOs)
  const rankingAtual = Object.values(parceirosRanking)
    .sort((a, b) => b.totalBOs - a.totalBOs)
    .slice(0, 10);
  // Atualiza o ranking no localStorage para próxima visualização
  useEffect(() => {
    localStorage.setItem(
      "parceirosRanking",
      JSON.stringify(rankingAtual.map((x) => x.parceiro))
    );
  }, [dados.length]); // só salva quando mudar os dados

  // Adiciona status de subida/descida
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

  // DADOS FICTÍCIOS PARA CLIENTES EM RISCO
  const clientesRiscoFicticio = [
    {
      risco: 3,
      clientes: [
        { nome: "Cliente Alfa", dias5: 2, dias10: 1, dias15: 0, acima15: 1 },
        { nome: "Cliente Beta", dias5: 0, dias10: 0, dias15: 2, acima15: 2 },
      ],
    },
    {
      risco: 2,
      clientes: [
        { nome: "Cliente Gama", dias5: 1, dias10: 2, dias15: 0, acima15: 0 },
        { nome: "Cliente Delta", dias5: 0, dias10: 2, dias15: 1, acima15: 0 },
      ],
    },
    {
      risco: 1,
      clientes: [
        { nome: "Cliente Epsilon", dias5: 3, dias10: 0, dias15: 1, acima15: 0 },
        { nome: "Cliente Zeta", dias5: 2, dias10: 1, dias15: 1, acima15: 0 },
      ],
    },
  ];

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
    const valor = d["Emissão"];
    if (!valor) return;

    let dataStr = "";
    if (typeof valor === "number") {
      dataStr = XLSX.SSF.format("yyyy-mm-dd", valor);
      console.log("Linha convertida:", valor, "->", dataStr);
    } else if (typeof valor === "string") {
      dataStr = valor;
    }

    if (!dataStr) return;
    const [ano, mes] = dataStr.split("-");
    if (ano !== ANO_GRAFICO) return;
    const mesIdx = Number(mes) - 1;
    if (mesIdx >= 0 && mesIdx <= 11) bosPorMes[mesIdx].bos++;
  });

  // Veja o array do gráfico no console
  console.log("bosPorMes final:", bosPorMes);
  // Gráfico por filial
  const bosPorFilial = Object.entries(
    dados.reduce((acc, curr) => {
      acc[curr.Filial] = (acc[curr.Filial] || 0) + 1;
      return acc;
    }, {})
  ).map(([filial, total]) => ({ filial, total }));

  // Gráfico por parceiro
  const bosPorParceiro = Object.entries(
    dados.reduce((acc, curr) => {
      acc[curr.Parceiro] = (acc[curr.Parceiro] || 0) + 1;
      return acc;
    }, {})
  ).map(([parceiro, total]) => ({ parceiro, total }));

  // Gráfico de status
  const statusData = [
    { name: "Abertos Hoje", value: totalAbertosHoje },
    { name: "Fechados Hoje", value: totalFechadosHoje },
  ];

  const [hoveredOfensora, setHoveredOfensora] = useState(null);

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
          <br />
          <br />
          <br />
          {/* PARTE INFERIOR */}
          <div className="monitoramento-section monitoramento-inferior">
            <div className="monitoramento-graficos-e-tabela">
              <div className="monitoramento-graficos">
                <div className="grafico-card">
                  <h3>B.Os por Filial</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bosPorFilial}>
                      <XAxis dataKey="filial" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#3f51b5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grafico-card">
                  <h3>B.Os por Parceiro</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bosPorParceiro}>
                      <XAxis dataKey="parceiro" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#ff9800" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grafico-card">
                  <h3>Status dos B.Os</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="clientes-risco-cards-coluna">
                {clientesRiscoFicticio.map((riscoItem) => (
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
