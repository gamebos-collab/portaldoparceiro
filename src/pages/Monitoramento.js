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

// DADOS FICTÍCIOS PARA UNIDADES MAIS OFENSORAS
const unidadesOfensorasFicticio = [
  {
    centralizadora: "CPN",
    parceiro: "SSA",
    bos: 35,
    dias5: 10,
    dias10: 8,
    dias15: 7,
    mais15: 10,
    status: "up",
  },
  {
    centralizadora: "JDF",
    parceiro: "SSA",
    bos: 28,
    dias5: 12,
    dias10: 8,
    dias15: 4,
    mais15: 4,
    status: "down",
  },
  {
    centralizadora: "NAT",
    parceiro: "SSA",
    bos: 22,
    dias5: 8,
    dias10: 5,
    dias15: 4,
    mais15: 5,
    status: "down",
  },
  {
    centralizadora: "CPN",
    parceiro: "JDF",
    bos: 19,
    dias5: 7,
    dias10: 2,
    dias15: 3,
    mais15: 7,
    status: "up",
  },
];

// DADOS FICTÍCIOS PARA GRÁFICO MENSAL (pode ser substituído pelo Excel depois)
const bosPorMesFicticio = [
  { mes: "Jan", bos: 17 },
  { mes: "Fev", bos: 22 },
  { mes: "Mar", bos: 35 },
  { mes: "Abr", bos: 20 },
  { mes: "Mai", bos: 29 },
  { mes: "Jun", bos: 32 },
  { mes: "Jul", bos: 31 },
  { mes: "Ago", bos: 27 },
  { mes: "Set", bos: 15 },
  { mes: "Out", bos: 25 },
  { mes: "Nov", bos: 19 },
  { mes: "Dez", bos: 23 },
];

export default function Monitoramento() {
  const [dados, setDados] = useState([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarExcel = async () => {
      try {
        const res = await fetch("/kpiparceiro.xlsx");
        if (!res.ok) {
          setErro("Não foi possível carregar o arquivo Excel.");
          setLoading(false);
          return;
        }
        const data = await res.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        setDados(json);
      } catch (err) {
        setErro("Erro ao processar o arquivo Excel.");
      } finally {
        setLoading(false);
      }
    };
    carregarExcel();
  }, []);

  // Geração de métricas
  const totalBOs = dados.length;
  const totalAbertos = dados.filter((d) => d.Status === "Aberto").length;
  const totalFechados = dados.filter((d) => d.Status === "Fechado").length;

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
    { name: "Abertos", value: totalAbertos },
    { name: "Fechados", value: totalFechados },
  ];

  // Interatividade da lista de unidades mais ofensoras
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
          {/* PARTE SUPERIOR */}
          <div className="monitoramento-section monitoramento-superior">
            <div className="monitoramento-metricas">
              <div className="metrica-card">
                <h4>Total de B.Os</h4>
                <span>{totalBOs}</span>
              </div>
              <div className="metrica-card">
                <h4>B.Os Abertos</h4>
                <span>{totalAbertos}</span>
              </div>
              <div className="metrica-card">
                <h4>B.Os Fechados</h4>
                <span>{totalFechados}</span>
              </div>
              <div className="metrica-card">
                <h4>B.Os Sem Parecer</h4>
                <span>{totalFechados}</span>
              </div>
              <div className="metrica-card">
                <h4>B.Os Falta Total</h4>
                <span>{totalFechados}</span>
              </div>
              <div className="metrica-card">
                <h4>B.Os Falta Total</h4>
                <span>{totalFechados}</span>
              </div>
            </div>

            <div className="monitoramento-superior-row">
              {/* Lista interativa: Unidades mais Ofensoras */}
              <div className="unidades-ofensoras-wrapper">
                <h3 className="unidades-ofensoras-titulo">
                  Unidades mais ofensoras
                </h3>
                <div className="unidades-ofensoras-table-container">
                  <table className="unidades-ofensoras-table">
                    <thead>
                      <tr>
                        <th className="th-centralizadora"></th>
                        <th>Centralizadora</th>
                        <th>Parceiro</th>
                        <th>B.Os</th>
                        <th>5 dias</th>
                        <th>10 dias</th>
                        <th>15 dias</th>
                        <th>Mais de 15 dias</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unidadesOfensorasFicticio.map((item, idx) => (
                        <tr
                          key={idx}
                          className={
                            hoveredOfensora === idx ? "ofensora-hovered" : ""
                          }
                          onMouseEnter={() => setHoveredOfensora(idx)}
                          onMouseLeave={() => setHoveredOfensora(null)}
                        >
                          <td className="td-arrow">
                            {item.status === "up" ? (
                              <span className="arrow-up">&#9650;</span>
                            ) : (
                              <span className="arrow-down">&#9660;</span>
                            )}
                          </td>
                          <td className="td-centralizadora">
                            {item.centralizadora}
                          </td>
                          <td>{item.parceiro}</td>
                          <td>{item.bos}</td>
                          <td>{item.dias5}</td>
                          <td>{item.dias10}</td>
                          <td>{item.dias15}</td>
                          <td>{item.mais15}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* FIM Lista unidades mais ofensoras */}

              {/* NOVO: Card de evolução por mês */}
              <div className="evolucao-mensal-card">
                <h3 className="evolucao-mensal-titulo">
                  Evolução Mensal de B.Os
                </h3>
                <div className="evolucao-mensal-grafico-container">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart
                      data={bosPorMesFicticio}
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
