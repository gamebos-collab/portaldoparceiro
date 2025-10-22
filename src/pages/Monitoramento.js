import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import "./Monitoramento.css";

/*
  Layout ajustado conforme solicitado:
  - CARDS (linha superior)
  - Em seguida: duas colunas lado a lado:
      * Esquerda: Tabela "PARCEIROS MAIS OFENSORES"
      * Direita: Coluna com (em ordem vertical)
          - Gráfico "Evolução Mensal de B.Os"
          - Tabela "Clientes Omboarding" (abaixo do gráfico)
  - Abaixo (em uma linha horizontal) os três cards de risco lado a lado
      sequência: Risco 3 | Risco 2 | Risco 1
  Mantive somente o que é necessário para esses elementos.
  Comentários // === START ... // === END marcando blocos.
*/

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

const COL_EMISSAO = "Emissão";
const COL_DT_PARECER = "Dt Parecer";
const COL_OCORRENCIA = "Ocorrência";
const COL_DIAS_SEM_ACOMP = "Dias sem acompanhamento";
const COL_RESP = "Resp";
const COL_5 = "0 a 5";
const COL_10 = "6 a 10";
const COL_15 = "11 a 15";
const COL_MAIS15 = "> 15";

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
  return String(d).slice(0, 10);
}

function getTodayStr() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = ("0" + (now.getMonth() + 1)).slice(-2);
  const dd = ("0" + now.getDate()).slice(-2);
  return `${yyyy}-${mm}-${dd}`;
}

export default function GestaoParceiros() {
  // states
  const [dados, setDados] = useState([]);
  const [clientesOnboarding, setClientesOnboarding] = useState([]);
  const [clientesRiscoReais, setClientesRiscoReais] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const chartRef = useRef(null);

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

        // === START: ler aba Dados ===
        const sheetDados = workbook.Sheets["Dados"];
        if (sheetDados) {
          const allRows = XLSX.utils.sheet_to_json(sheetDados, {
            header: 1,
            defval: "",
          });
          const headerRow = allRows[9] || [];
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
        }
        // === END: ler aba Dados ===

        // === START: ler aba Clientes em Risco (onboarding + riscos) ===
        const abaRisco = workbook.Sheets["Clientes em Risco"];
        if (abaRisco) {
          const ref = abaRisco["!ref"];
          const range = ref ? XLSX.utils.decode_range(ref) : null;

          // onboarding
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
          }
          const onboarding = [];
          if (onboardingStart && range) {
            for (let r = onboardingStart; r <= range.e.r + 1; r++) {
              const cellD = abaRisco[`D${r}`];
              const nome = cellD ? String(cellD.v).trim() : "";
              if (!nome || nome.toLowerCase().includes("total geral")) break;
              onboarding.push({
                nome,
                dias5: abaRisco[`E${r}`]?.v || "",
                dias10: abaRisco[`F${r}`]?.v || "",
                dias15: abaRisco[`G${r}`]?.v || "",
                acima15: abaRisco[`H${r}`]?.v || "",
                total: abaRisco[`I${r}`]?.v || "",
              });
            }
          }
          setClientesOnboarding(onboarding);

          // riscos
          const riscos = [
            { risco: 3, clientes: [] },
            { risco: 2, clientes: [] },
            { risco: 1, clientes: [] },
          ];
          let riscoAtual = null;
          if (range) {
            for (let r = 7; r <= range.e.r; r++) {
              const celD = abaRisco[`D${r + 1}`];
              const celE = abaRisco[`E${r + 1}`];
              const celF = abaRisco[`F${r + 1}`];
              const celG = abaRisco[`G${r + 1}`];
              const celH = abaRisco[`H${r + 1}`];
              const valorD = celD ? String(celD.v).trim() : "";
              if (!valorD) continue;
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
              if (!riscoAtual) continue;
              if (valorD.toLowerCase().includes("clientes omboarding")) break;
              const idx = 3 - riscoAtual;
              riscos[idx].clientes.push({
                nome: valorD,
                dias5: Number(celE ? celE.v : 0) || 0,
                dias10: Number(celF ? celF.v : 0) || 0,
                dias15: Number(celG ? celG.v : 0) || 0,
                acima15: Number(celH ? celH.v : 0) || 0,
              });
            }
          }
          setClientesRiscoReais(riscos);
        }
        // === END: ler aba Clientes em Risco ===
      } catch (err) {
        console.error(err);
        setErro("Erro ao processar o arquivo Excel.");
      } finally {
        setLoading(false);
      }
    };

    carregarExcel();
  }, []);

  // === Cálculos para cards ===
  const totalBOs = dados.length || 0;
  const hojeStr = getTodayStr();
  const totalAbertosHoje = dados.filter(
    (d) => normalizaData(d[COL_EMISSAO]) === hojeStr
  ).length;
  const totalFechadosHoje = dados.filter(
    (d) => normalizaData(d[COL_DT_PARECER]) === hojeStr
  ).length;
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

  // === Ranking parceiros ===
  const parceirosRanking = {};
  const getSum = (n) => (isNaN(Number(n)) ? 0 : Number(n));
  dados.forEach((d) => {
    const parceiro = d[COL_RESP];
    if (!parceiro) return;
    if (!parceirosRanking[parceiro]) {
      parceirosRanking[parceiro] = {
        parceiro,
        dias5: 0,
        dias10: 0,
        dias15: 0,
        mais15: 0,
        totalBOs: 0,
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
  useEffect(() => setRanking(rankingAtual), [JSON.stringify(rankingAtual)]);

  // === Dados do gráfico ===
  const graficoDados = MESES.map(({ nome, chave }) => ({
    mes: nome,
    bos: B_OS_MANUAL_MENSAL[chave] ?? 0,
  }));

  // Helper: garantir ordem risco 3,2,1
  const riscosOrdenados = [...clientesRiscoReais].sort(
    (a, b) => b.risco - a.risco
  );

  // === RENDER ===
  return (
    <div className="monitoramento-page">
      {/* === START: CARDS DE MÉTRICAS (superior) === */}
      <div className="monitoramento-metricas">
        <div className="metrica-card">
          <h4>Total de B.Os</h4>
          <span>{Number(totalBOs).toLocaleString("pt-BR")}</span>
        </div>
        <div className="metrica-card">
          <h4>B.Os Abertos</h4>
          <span>{Number(totalAbertosHoje).toLocaleString("pt-BR")}</span>
        </div>
        <div className="metrica-card">
          <h4>B.Os Fechados</h4>
          <span>{Number(totalFechadosHoje).toLocaleString("pt-BR")}</span>
        </div>
        <div className="metrica-card">
          <h4>B.Os Sem Parecer</h4>
          <span>{Number(totalSemParecer).toLocaleString("pt-BR")}</span>
        </div>
        <div className="metrica-card">
          <h4>B.Os Falta Total</h4>
          <span>{Number(totalFaltaTotal).toLocaleString("pt-BR")}</span>
        </div>
        <div className="metrica-card">
          <h4>B.Os Avaria Total</h4>
          <span>{Number(totalAvariaTotal).toLocaleString("pt-BR")}</span>
        </div>
      </div>
      {/* === END: CARDS DE MÉTRICAS === */}

      {/* loading / error */}
      {loading && (
        <div className="monitoramento-loading">Carregando dados...</div>
      )}
      {erro && <div className="monitoramento-erro">{erro}</div>}

      {!loading && !erro && (
        <>
          {/* === START: DUAL COLUMN AREA (PARCEIROS | GRÁFICO + ONBOARDING) === */}
          <div
            className="monitoramento-top-columns"
            style={{
              display: "flex",
              gap: 24,
              alignItems: "flex-start",
              marginTop: 16,
              flexWrap: "wrap",
            }}
          >
            {/* === START: LEFT COLUMN - PARCEIROS MAIS OFENSORES === */}
            <div style={{ flex: "1 1 420px", minWidth: 320 }}>
              <div className="unidades-ofensoras-wrapper">
                <h3 className="unidades-ofensoras-titulo">
                  PARCEIROS MAIS OFENSORES
                </h3>
                <div className="unidades-ofensoras-table-container">
                  <table className="unidades-ofensoras-table">
                    <thead>
                      <tr>
                        <th style={{ width: 30 }}></th>
                        <th>Parceiro</th>
                        <th>5 dias</th>
                        <th>10 dias</th>
                        <th>15 dias</th>
                        <th>Acima 15 dias</th>
                        <th>Total B.O's</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((item, idx) => (
                        <tr key={item.parceiro}>
                          <td style={{ width: 30 }}>{idx + 1}</td>
                          <td>{item.parceiro}</td>
                          <td>{item.dias5}</td>
                          <td>{item.dias10}</td>
                          <td>{item.dias15}</td>
                          <td>{item.mais15}</td>
                          <td>{item.totalBOs}</td>
                        </tr>
                      ))}
                      {ranking.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            style={{ textAlign: "center", padding: 12 }}
                          >
                            Nenhum parceiro encontrado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* === END: LEFT COLUMN === */}

            {/* === START: RIGHT COLUMN - GRÁFICO em cima e ONBOARDING abaixo === */}
            <div
              style={{
                flex: "1 1 560px",
                minWidth: 320,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* === START: GRÁFICO === */}
              <div className="evolucao-mensal-card" ref={chartRef}>
                <h3 className="evolucao-mensal-titulo">
                  Evolução Mensal de B.Os
                </h3>
                <div
                  className="evolucao-mensal-grafico-container"
                  style={{ height: 320 }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={graficoDados}
                      margin={{ top: 12, right: 12, left: 0, bottom: 16 }}
                    >
                      <CartesianGrid
                        stroke="#fff"
                        strokeOpacity={0.06}
                        vertical={false}
                      />
                      <XAxis dataKey="mes" tick={{ fill: "#fff" }} />
                      <YAxis tick={{ fill: "#fff" }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="bos" name="Total B.Os" fill="#ff9100" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* === END: GRÁFICO === */}

              {/* === START: TABELA - CLIENTES ONBOARDING (abaixo do gráfico, na mesma coluna) === */}
              <div className="clientes-risco-card onboarding-card">
                <div className="clientes-risco-titulo">Clientes Omboarding</div>
                <div className="onboarding-scroll">
                  <table className="clientes-risco-tabela">
                    <thead>
                      <tr>
                        <th>Nome do Cliente</th>
                        <th className="risco-col-0">até 5 dias</th>
                        <th className="risco-col-1">até 10 dias</th>
                        <th className="risco-col-2">até 15 dias</th>
                        <th className="risco-col-3">acima de 15 dias</th>
                        <th className="total-col-4">Total Geral</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientesOnboarding.map((cli, idx) => (
                        <tr key={cli.nome + idx}>
                          <td className="cliente-nome">{cli.nome}</td>
                          <td className="risco-col-0">{cli.dias5}</td>
                          <td className="risco-col-1">{cli.dias10}</td>
                          <td className="risco-col-2">{cli.dias15}</td>
                          <td className="risco-col-3">{cli.acima15}</td>
                          <td className="total-col-4">{cli.total}</td>
                        </tr>
                      ))}
                      {clientesOnboarding.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            style={{ textAlign: "center", padding: 12 }}
                          >
                            Nenhum cliente onboarding encontrado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* === END: CLIENTES ONBOARDING === */}
            </div>
            {/* === END: RIGHT COLUMN === */}
          </div>
          {/* === END: DUAL COLUMN AREA === */}

          {/* === START: LINHA DE RISCOS (Risco 3 | Risco 2 | Risco 1) === */}
          <div
            className="clientes-risco-cards-linha"
            style={{
              display: "flex",
              gap: 18,
              marginTop: 28,
              alignItems: "stretch", // <- garante altura igual entre cards
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {riscosOrdenados.map((riscoItem) => (
              <div
                key={riscoItem.risco}
                className={`clientes-risco-card risco${riscoItem.risco}`}
                style={{
                  flex: "1 1 30%",
                  minWidth: 260,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  className={`clientes-risco-titulo risco${riscoItem.risco}`}
                >
                  <br />
                  Risco {riscoItem.risco}
                </div>

                {/* table wrapper para controlar scroll interno e alinhamento */}
                <div
                  className="table-wrapper"
                  style={{ flex: "1 1 auto", overflow: "hidden" }}
                >
                  <table
                    className="clientes-risco-tabela"
                    style={{ width: "100%", display: "block" }}
                  >
                    <thead
                      style={{
                        display: "table",
                        width: "100%",
                        tableLayout: "fixed",
                      }}
                    >
                      <tr>
                        <th style={{ width: "40%" }}>Nome do Cliente</th>
                        <th className="risco-col-0">5 dias</th>
                        <th className="risco-col-1">10 dias</th>
                        <th className="risco-col-2">15 dias</th>
                        <th className="risco-col-3">acima de 15</th>
                      </tr>
                    </thead>

                    <tbody
                      style={{
                        display: "block",
                        maxHeight: "260px",
                        overflow: "auto",
                        width: "100%",
                      }}
                    >
                      {riscoItem.clientes.map((cli, idx) => (
                        <tr
                          key={cli.nome + idx}
                          style={{
                            display: "table",
                            width: "100%",
                            tableLayout: "fixed",
                          }}
                        >
                          <td className="cliente-nome">
                            {/* .truncate limita visual e adiciona title para ver completo ao passar o mouse */}
                            <div className="truncate" title={cli.nome}>
                              {cli.nome}
                            </div>
                          </td>
                          <td className="risco-col-0">{cli.dias5}</td>
                          <td className="risco-col-1">{cli.dias10}</td>
                          <td className="risco-col-2">{cli.dias15}</td>
                          <td className="risco-col-3">{cli.acima15}</td>
                        </tr>
                      ))}

                      {riscoItem.clientes.length === 0 && (
                        <tr
                          style={{
                            display: "table",
                            width: "100%",
                            tableLayout: "fixed",
                          }}
                        >
                          <td
                            colSpan={5}
                            style={{ textAlign: "center", padding: 12 }}
                          >
                            Nenhum cliente neste nível de risco
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
          {/* === END: LINHA DE RISCOS === */}
        </>
      )}
    </div>
  );
}
