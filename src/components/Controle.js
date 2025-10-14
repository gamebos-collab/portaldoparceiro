import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import MapaBrasil from "./MapaBrasil";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import "./Controle.css";

// Mapeamento das centralizadoras e seus parceiros
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

// Mapeia cada estado para as centralizadoras correspondentes
const estadoCentralizadoras = {
  "Rio Grande do Sul": ["CXS", "POA", "SMA"],
  "Santa Catarina": ["BLU", "JVL", "FLN"],
  "Minas Gerais": ["PPY", "BHZ"],
  Paraná: ["CWB", "LDA", "CAS"],
  "São Paulo": ["SOR", "RIP", "SUM", "SÃO", "GRU", "BAU", "CPN"],
  "Espírito Santo": ["VIX"],
  Ceará: ["CRA"],
};

// Gerentes regionais (exemplo)
const gerentesRegionais = {
  CXS: {
    nome: "Alexandre Azambuja",
    email: "alexandre.tavares@translovato.com.br",
    telefone: "55 (51) 99459-2562",
  },
  POA: {
    nome: "Alexandre Azambuja",
    email: "alexandre.tavares@translovato.com.br",
    telefone: "55 (51) 99459-2562",
  },
  SMA: {
    nome: "Reginaldo Petry",
    email: "reginaldo.petry@translovato.com.br",
    telefone: "55 (55) 99905-5949",
  },
  BLU: {
    nome: "Alessandro Cordero",
    email: "alessandro.cordero@translovato.com.br",
    telefone: "55 (47) 99286-1707",
  },
  JVL: {
    nome: "Alexandre Stimamiglio",
    email: "alexandre.stimamigli@translovato.com.br",
    telefone: "55 (55) 99905-5949",
  },
  FLN: {
    nome: "Alessandro Cordero",
    email: "alessandro.cordero@translovato.com.br",
    telefone: "55 (47) 99286-1707",
  },
  PPY: {
    nome: "Thiago Souza",
    email: "thiago.souza@translovato.com.br",
    telefone: "55 (55) 99905-5949",
  },
  BHZ: {
    nome: "Mayra de Aguiar",
    email: "mayra.aguiar@translovato.com.br",
    telefone: "55 (31) 9869-0100",
  },
  CWB: {
    nome: "Edson Motta",
    email: "edson.motta@translovato.com.br",
    telefone: "55 (41) 99202-7292",
  },
  LDA: {
    nome: "Guilherme Aguiar",
    email: "guilherme.aguiar@translovato.com.br",
    telefone: "55 (43) 3025-2777",
  },
  CAS: {
    nome: "Azemar Junior",
    email: "azemar.junior@translovato.com.br",
    telefone: "55 (41) 99147-3331",
  },
  SOR: {
    nome: "Samuel Sales",
    email: "samuel.sales@translovato.com.br",
    telefone: "55 (11) 95303-5666",
  },
  RIP: {
    nome: "Clesio Nunes",
    email: "clesio.nunes@translovato.com.br",
    telefone: "55 (54) 99613-5268",
  },
  SUM: {
    nome: "Samuel Sales",
    email: "samuel.sales@translovato.com.br",
    telefone: "55 (11) 95303-5666",
  },
  SAO: {
    nome: "Edcarlos Ferreira",
    email: "edcarlos.ferreira@translovato.com.br",
    telefone: "55 (11) 95028-4557",
  },
  GRU: {
    nome: "Antonio Bento",
    email: "antonio.bento@translovato.com.br",
    telefone: "55 (11) 94231-9986",
  },
  VIX: {
    nome: "Rafael Batista",
    email: "rafael.batista@translovato.com.br",
    telefone: "55 (27) 99228-1034",
  },
  BAU: {
    nome: "Marco da Silva",
    email: "marco.silva@translovato.com.br",
    telefone: "55 (14) 99829-8791",
  },
  CPN: {
    nome: "Samuel Sales",
    email: "samuel.sales@translovato.com.br",
    telefone: "55 (11) 95303-5666",
  },
  CRA: {
    nome: "Wagner de Lima",
    email: "wagner.lima@translovato.com.br",
    telefone: "55 21-99922-2720",
  },
};

const barColors = [
  "#3f51b5",
  "#1976d2",
  "#43e97b",
  "#38f9d7",
  "#e040fb",
  "#ff7043",
  "#7c4dff",
  "#00bcd4",
  "#8bc34a",
  "#ffd600",
  "#ff4081",
  "#00e676",
];

// Componente para a tabela de reversões
function TabelaReversoes({ centralizadoraSelecionada }) {
  const [reversoes, setReversoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarReversoes = async () => {
      setLoading(true);
      try {
        const res = await fetch("/kpiparceiro.xlsm");
        if (!res.ok) {
          setReversoes([]);
          setLoading(false);
          return;
        }
        const data = await res.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets["Query Reversão"];
        if (!sheet) {
          setReversoes([]);
          setLoading(false);
          return;
        }
        const reversoesJson = XLSX.utils.sheet_to_json(sheet, {
          range: 6, // linha 7 zero based
          defval: "",
        });
        setReversoes(reversoesJson);
      } catch {
        setReversoes([]);
      }
      setLoading(false);
    };
    carregarReversoes();
  }, []);

  const COLS = [
    "Numero do BO",
    "BO",
    "Cliente",
    "Ocorrência",
    "Data Alteração",
    "Emp. Resp. Anterior",
    "Emp. Resp. Nova",
  ];

  // Função para converter "Data Alteração" em objeto Date (suporta formatos comuns brasileiros)
  const parseDate = (dataStr) => {
    if (!dataStr) return new Date(0);
    const [d, m, y] = dataStr.split("/");
    if (d && m && y) {
      const year = y.length === 2 ? "20" + y : y;
      return new Date(Number(year), Number(m) - 1, Number(d));
    }
    return new Date(dataStr);
  };

  // Filtra reversoes pela centralizadora (Emp. Resp. Nova)
  const reversoesFiltradas = reversoes.filter(
    (item) =>
      (item["Emp. Resp. Nova"] || "").toString().trim().toUpperCase() ===
      (centralizadoraSelecionada || "").toString().trim().toUpperCase()
  );

  // Ordena reversoes pela "Data Alteração" (mais recente primeiro)
  const reversoesOrdenadas = [...reversoesFiltradas].sort((a, b) => {
    const dateA = parseDate(a["Data Alteração"]);
    const dateB = parseDate(b["Data Alteração"]);
    return dateB - dateA;
  });

  return (
    <div
      style={{
        maxHeight: "270px",
        overflowY: "auto",
        marginTop: "16px",
        background: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 6px #0002",
        padding: "8px 4px",
      }}
    >
      {loading ? (
        <div
          style={{
            color: "#072d4d",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "1.1rem",
            padding: "40px 0",
          }}
        >
          Carregando...
        </div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.88rem",
          }}
        >
          <thead>
            <tr
              style={{
                fontSize: "0.8rem",
                background: "#18304b",
                color: "#ffe200",
              }}
            >
              {COLS.map((col, i) => (
                <th
                  key={col}
                  style={{
                    padding: "6px 8px",
                    borderRadius:
                      i === 0
                        ? "5px 0 0 0"
                        : i === COLS.length - 1
                        ? "0 5px 0 0"
                        : "0",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reversoesOrdenadas && reversoesOrdenadas.length > 0 ? (
              reversoesOrdenadas.map((item, idx) => (
                <tr
                  key={idx}
                  style={{
                    background: idx % 2 === 0 ? "#f7faff" : "#eef3fb",
                    color: "#072d4d",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    transition: "background 0.18s, color 0.18s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#ffe200";
                    e.currentTarget.style.color = "#072d4d";
                    e.currentTarget.style.fontWeight = "bold";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      idx % 2 === 0 ? "#f7faff" : "#eef3fb";
                    e.currentTarget.style.color = "#072d4d";
                    e.currentTarget.style.fontWeight = "normal";
                  }}
                >
                  {COLS.map((col) => (
                    <td
                      key={col}
                      style={{ padding: "5px 7px", textAlign: "center" }}
                    >
                      {item[col] || ""}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={COLS.length}
                  style={{ textAlign: "center", color: "#072d4d" }}
                >
                  Nenhuma reversão encontrada para esta centralizadora.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Home() {
  const [dadosExcel, setDadosExcel] = useState([]);
  const [estadoSelecionado, setEstadoSelecionado] = useState(null);
  const [centralizadoraSelecionada, setCentralizadoraSelecionada] =
    useState(null);
  const [erro, setErro] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("visao");

  // Impede scroll do fundo quando popup está ativo
  useEffect(() => {
    if (showPopup) {
      document.body.classList.add("body-popup-ativo");
    } else {
      document.body.classList.remove("body-popup-ativo");
    }
    return () => document.body.classList.remove("body-popup-ativo");
  }, [showPopup]);

  useEffect(() => {
    const carregarExcel = async () => {
      try {
        const res = await fetch("/kpiparceiro.xlsm");
        if (!res.ok) {
          setErro("Não foi possível carregar o arquivo Excel.");
          return;
        }
        const data = await res.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Começa da linha 10 (A10:L...), pega todas as colunas
        const json = XLSX.utils.sheet_to_json(sheet, {
          range: 9, // linha 10 é zero-based 9
          defval: "",
        });
        setDadosExcel(json);
      } catch (error) {
        setErro("Erro ao processar o arquivo Excel.");
      }
    };
    carregarExcel();
  }, []);

  // Ao clicar no estado do mapa, abre popup para escolher centralizadora
  const handleEstadoSelecionado = (estado) => {
    setEstadoSelecionado(estado);
    setCentralizadoraSelecionada(null);
    setShowPopup(true);
    setAbaAtiva("visao");
  };

  // Ao clicar em uma centralizadora no popup, mostra os parceiros
  const handleCentralizadoraSelecionada = (siglaCentralizadora) => {
    setCentralizadoraSelecionada(siglaCentralizadora);
    setAbaAtiva("visao");
  };

  const closePopup = useCallback(() => {
    setShowPopup(false);
    setCentralizadoraSelecionada(null);
    setEstadoSelecionado(null);
    setAbaAtiva("visao");
  }, []);

  useEffect(() => {
    if (!showPopup) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") closePopup();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [showPopup, closePopup]);

  // Parceiros da centralizadora
  const parceirosDaCentralizadora = centralizadoraSelecionada
    ? parceirosPorCentralizadora[centralizadoraSelecionada] || []
    : [];

  // Filtra B.O da centralizadora (próprios)
  const bosCentralizadora = dadosExcel.filter(
    (item) =>
      item.Centralizadora === centralizadoraSelecionada &&
      (item.Resp === centralizadoraSelecionada || !item.Resp)
  );

  // Filtra B.O dos parceiros
  const bosParceiros = dadosExcel.filter(
    (item) =>
      item.Centralizadora === centralizadoraSelecionada &&
      item.Resp &&
      parceirosDaCentralizadora.includes(item.Resp)
  );

  // Dados para o gráfico
  const graficoData = parceirosDaCentralizadora.map((sigla, idx) => ({
    parceiro: sigla,
    bos: dadosExcel.filter(
      (item) =>
        item.Centralizadora === centralizadoraSelecionada && item.Resp === sigla
    ).length,
    fill: barColors[idx % barColors.length],
  }));

  const contarBOsParceiro = (sigla) =>
    dadosExcel.filter(
      (item) =>
        item.Centralizadora === centralizadoraSelecionada && item.Resp === sigla
    ).length;

  // Detalhes do parceiro
  const abrirDetalhes = (responsabilidade) => {
    const dadosResponsavel = dadosExcel.filter(
      (item) =>
        item.Centralizadora === centralizadoraSelecionada &&
        item.Resp === responsabilidade
    );
    localStorage.setItem("dadosResponsavel", JSON.stringify(dadosResponsavel));
    window.open(
      `/detalhes-responsavel?centralizadora=${centralizadoraSelecionada}&responsabilidade=${responsabilidade}`,
      "_blank"
    );
  };

  // Detalhes da centralizadora
  const abrirDetalhesCentralizadora = () => {
    localStorage.setItem(
      "dadosCentralizadora",
      JSON.stringify(bosCentralizadora)
    );
    window.open(
      `/detalhes-centralizadora?centralizadora=${centralizadoraSelecionada}`,
      "_blank"
    );
  };

  // Renderiza cards dos parceiros e centralizadora (layout antigo)
  const renderCards = () => (
    <div
      className="parceiros-cards"
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
        marginTop: "2px",
      }}
    >
      {/* Card Centralizadora */}
      <div
        className="parceiro-card"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          border: "1px solid #ccc",
          width: "200px",
          height: "110px",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
          padding: "5px",
        }}
      >
        <div className="sigla" style={{ fontWeight: "bold", fontSize: "1rem" }}>
          {centralizadoraSelecionada}
        </div>
        <div
          className="bos-quantidade"
          style={{ margin: "8px 0", color: "#ffffffff", fontWeight: 700 }}
        >
          {
            dadosExcel.filter(
              (item) =>
                item.Centralizadora === centralizadoraSelecionada &&
                (item.Resp === centralizadoraSelecionada || !item.Resp)
            ).length
          }{" "}
          B.O
        </div>
        <button
          className="detalhes-btn"
          onClick={abrirDetalhesCentralizadora}
          style={{
            padding: "6px 12px",
            borderRadius: "4px",
            width: "120px",
            height: "40px",
            border: "none",
            backgroundColor: "#072d4d",
            color: "#072d4d",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Ver B.Os da Centralizadora
        </button>
      </div>

      {/* Cards Parceiros */}
      {parceirosDaCentralizadora.map((sigla, idx) => {
        const count = contarBOsParceiro(sigla);
        return (
          <div
            className="parceiro-card"
            key={sigla}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "5px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
              width: "200px",
              height: "110px",
            }}
          >
            <div
              className="sigla"
              style={{ fontWeight: "bold", fontSize: "1.2rem" }}
            >
              {sigla}
            </div>
            <div
              className="bos-quantidade"
              style={{
                margin: "5px 0",
                fontSize: "1rem",
                color: "#ffffffff",
                fontWeight: 700,
              }}
            >
              {count} B.O
            </div>
            <button
              className="detalhes-btn"
              onClick={() => abrirDetalhes(sigla)}
              style={{
                padding: "6px 12px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: "#072d4d",
                color: "#072d4d",
                cursor: "pointer",
                width: "120px",
                height: "40px",
                fontSize: "0.9rem",
              }}
            >
              Ver B.Os do Parceiro
            </button>
          </div>
        );
      })}
    </div>
  );

  // Renderiza informações do gerente regional
  const renderGerenteRegional = () => {
    const gerente = gerentesRegionais[centralizadoraSelecionada];
    if (!gerente) return null;

    return (
      <div
        className="gerente-regional-info"
        style={{
          textAlign: "center",
          color: "#fff",
          lineHeight: "1.6",
        }}
      >
        <h3>Gerente Regional</h3>
        <div>{gerente.nome}</div>
        <div>
          <a href={`mailto:${gerente.email}`} style={{ color: "#ffe200" }}>
            {gerente.email}
          </a>
        </div>
        <div>
          <a
            href={`https://wa.me/${gerente.telefone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#ffe200" }}
          >
            {gerente.telefone}
          </a>
        </div>
      </div>
    );
  };

  // ABA B.O's CRÍTICOS
  // Ordem customizada para criticidade: Crítico > Alto > Médio > Baixo
  const FAIXAS_CRITICAS = ["Crítico", "Alto", "Médio", "Baixo"];
  const criticidadeOrdem = {
    Crítico: 1,
    Alto: 2,
    Médio: 3,
    Baixo: 4,
  };
  const getFaixaColName = (item) => {
    if ("Faixa Score" in item) return "Faixa Score";
    if ("Faixa" in item) return "Faixa";
    return "Faixa Score";
  };

  // B.Os críticos: centralizadora + parceiros (todos juntos)
  const bosCriticos = dadosExcel.filter((item) => {
    if (item.Centralizadora !== centralizadoraSelecionada) return false;
    const respValida =
      item.Resp === centralizadoraSelecionada ||
      parceirosDaCentralizadora.includes(item.Resp);
    if (!respValida) return false;
    const faixaCol = getFaixaColName(item);
    return FAIXAS_CRITICAS.includes((item[faixaCol] || "").trim());
  });

  // Renderiza tabela dos B.Os críticos
  const renderBOsCriticos = () => (
    <div
      style={{
        maxHeight: "270px",
        overflowY: "auto",
        marginTop: "16px",
        background: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 6px #0002",
        padding: "8px 4px",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.8rem",
        }}
      >
        <thead>
          <tr style={{ background: "#18304b", color: "#ffe200" }}>
            <th style={{ padding: "6px 8px", borderRadius: "5px 0 0 0" }}>
              Unidade
            </th>
            <th style={{ padding: "6px 8px" }}>BO</th>
            <th style={{ padding: "6px 8px" }}>CT-e</th>
            <th style={{ padding: "6px 8px" }}>Ocorrência</th>
            <th style={{ padding: "6px 8px" }}>Valor</th>
            <th style={{ padding: "6px 8px" }}>Responsabilidade</th>
            <th style={{ padding: "6px 8px" }}>Notas Fiscais</th>
            <th style={{ padding: "6px 8px", borderRadius: "0 5px 0 0" }}>
              Faixa
            </th>
          </tr>
        </thead>
        <tbody>
          {[...bosCriticos]
            .sort((a, b) => {
              const getFaixa = (item) =>
                (item[getFaixaColName(item)] || "").trim();
              return (
                (criticidadeOrdem[getFaixa(a)] || 99) -
                (criticidadeOrdem[getFaixa(b)] || 99)
              );
            })
            .map((item, idx) => {
              const faixaCol = getFaixaColName(item);
              const isCritico =
                (item[faixaCol] || "").trim().toLowerCase() === "crítico";
              return (
                <tr
                  key={idx}
                  style={{
                    background: idx % 2 === 0 ? "#f7faff" : "#eef3fb",
                    color: isCritico ? "red" : "#072d4d",
                    fontSize: 10,
                    textAlign: "center",
                  }}
                >
                  <td style={{ padding: "5px 7px", fontWeight: 700 }}>
                    {item["Unidade"] || ""}
                  </td>
                  <td style={{ padding: "5px 7px" }}>{item["Nr BO"] || ""}</td>
                  <td style={{ padding: "5px 7px" }}>{item["Nr Ct"] || ""}</td>
                  <td style={{ padding: "5px 7px" }}>
                    {item["Ocorrência"] || ""}
                  </td>
                  <td style={{ padding: "5px 7px" }}>
                    {item["Vlr NF"] || item[" Vlr NF "]
                      ? `R$ ${(item["Vlr NF"] || item[" Vlr NF "])
                          .toString()
                          .replace(/[^\d.,]/g, "")
                          .trim()}`
                      : ""}
                  </td>
                  <td style={{ padding: "5px 7px" }}>{item["Resp"] || ""}</td>
                  <td style={{ padding: "5px 7px" }}>
                    {(item["Notas Fiscais"] || "").split("/")[0]}
                  </td>
                  <td
                    style={{
                      padding: "5px 7px",
                      fontWeight: 600,
                    }}
                  >
                    {item[faixaCol] || ""}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );

  // ABA REVERSÕES
  const renderBOsRevercoes = () => (
    <TabelaReversoes centralizadoraSelecionada={centralizadoraSelecionada} />
  );

  // ABA B.O's BAIXADOS (estrutura pronta para buscar por nome de coluna futuramente)
  const renderBOsBaixados = () => {
    return (
      <div
        style={{
          marginTop: "16px",
          color: "#072d4d",
          textAlign: "center",
          background: "#fff",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        Conteúdo de B.O's Baixados estará disponível em breve...
      </div>
    );
  };

  // Renderiza o popup
  const renderPopup = () => {
    // Etapa 1: Escolher centralizadora
    if (estadoSelecionado && !centralizadoraSelecionada) {
      const centralizadoras = estadoCentralizadoras[estadoSelecionado] || [];
      return (
        <div className="popup-modal">
          <button className="popup-close" onClick={closePopup} title="Fechar">
            <span aria-label="Fechar">&times;</span>
          </button>
          <div className="popup-content">
            <h2 className="popup-title">{estadoSelecionado}</h2>
            {centralizadoras.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#ffe200",
                  fontWeight: "bold",
                  margin: "36px 0 36px 0",
                  fontSize: "1.15rem",
                }}
              >
                Centralizadora não atende
              </div>
            ) : (
              <>
                <h3>Escolha a Centralizadora</h3>
                <div className="centralizadora-lista">
                  {centralizadoras.map((sigla) => (
                    <button
                      key={sigla}
                      className="centralizadora-btn"
                      onClick={() => handleCentralizadoraSelecionada(sigla)}
                    >
                      {sigla}
                    </button>
                  ))}
                </div>
              </>
            )}
            <p className="popup-esc">Pressione ESC para fechar</p>
          </div>
        </div>
      );
    }
    // Etapa 2: Escolher parceiro
    if (centralizadoraSelecionada) {
      const abas = [
        { key: "visao", label: "Visão Geral" },
        { key: "grafico", label: "Gráfico" },
        { key: "criticos", label: "Criticidade" },
        { key: "revercoes", label: "Reversões" },
        { key: "baixados", label: "B.O's Baixados" },
      ];

      const renderAbaConteudo = () => {
        switch (abaAtiva) {
          case "visao":
            return renderCards();
          case "grafico":
            return (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={graficoData}>
                  <XAxis
                    dataKey="parceiro"
                    tick={{ fill: "#fff", fontWeight: 700 }}
                  />
                  <YAxis tick={{ fill: "#fff", fontWeight: 700 }} />
                  <Tooltip
                    wrapperStyle={{ fontSize: "1rem" }}
                    contentStyle={{
                      background: "#072d4d",
                      border: "none",
                      color: "#fff",
                    }}
                    labelStyle={{ color: "#ffe200", fontWeight: 700 }}
                  />
                  <Legend />
                  <Bar
                    dataKey="bos"
                    name="B.O"
                    isAnimationActive={true}
                    label={{ position: "top", fill: "#ffe200" }}
                  >
                    {graficoData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            );
          case "criticos":
            return renderBOsCriticos();
          case "revercoes":
            return renderBOsRevercoes();
          case "baixados":
            return renderBOsBaixados();
          default:
            return null;
        }
      };
      return (
        <div
          className="popup-modal-direita"
          style={{
            position: "fixed",
            top: "61%",
            right: "-1%",
            width: "750px",
            maxWidth: "100vw",
            height: "450px",
            overflowY: "auto",
            overflowX: "hidden",
            padding: "15px",
            borderRadius: "13px",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            zIndex: 1000,
          }}
        >
          <div
            className="popup-content"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "750px",
              height: "450px",
              overflowY: "auto",
              overflowX: "hidden",
              backgroundColor: "#000c3b",
              borderRadius: "2px",
              padding: "10px",
            }}
          >
            {/* Botão de fechar dentro do conteúdo */}
            <button
              className="popup-close"
              onClick={closePopup}
              title="Fechar"
              style={{
                position: "absolute",
                top: "24px",
                right: "24px",
                background: "transparent",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#fff",
              }}
            >
              <span aria-label="Fechar">&times;</span>
            </button>

            {/* Título do popup */}
            <h2 className="popup-title">{centralizadoraSelecionada}</h2>

            {/* Container do gerente regional e menus juntos */}
            <div
              className="regional-container"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                marginBottom: "1px",
                width: "100%",
              }}
            >
              {renderGerenteRegional()}
              <div
                className="abas"
                style={{
                  marginTop: "1px",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: "25px",
                  width: "150%",
                  height: "40px",
                  position: "static",
                  background: "transparent",
                }}
              >
                {abas.map((aba) => (
                  <button
                    key={aba.key}
                    className={abaAtiva === aba.key ? "aba ativa" : "aba"}
                    onClick={() => setAbaAtiva(aba.key)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setAbaAtiva(aba.key);
                      }
                    }}
                    style={{
                      padding: "8px 18px",
                      backgroundColor:
                        abaAtiva === aba.key ? "#ffe200" : "#072d4d",
                      color: abaAtiva === aba.key ? "#18304b" : "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                      boxShadow:
                        abaAtiva === aba.key
                          ? "0 2px 8px rgba(255,226,0,0.1)"
                          : "none",
                      transition: "background 0.18s, color 0.18s",
                    }}
                  >
                    {aba.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Conteúdo da aba ativa */}
            <div className="conteudo-aba">{renderAbaConteudo()}</div>
            <p
              className="popup-esc"
              style={{
                marginTop: "16px",
                textAlign: "center",
                fontSize: "0.9rem",
                color: "#ffffffff",
              }}
            >
              Pressione ESC para fechar
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="dashboard-page"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <div className="dashboard-top"></div>
      <div className="dashboard-bottom" style={{ flex: 1 }}>
        <div className="mapa-container" style={{ position: "relative" }}>
          {showPopup && (
            <div>
              <div className="popup-overlay" onClick={closePopup} />
              {renderPopup()}
            </div>
          )}
          <div className="mapa-conteudo">
            <div className="mapa-visual">
              <MapaBrasil onEstadoSelecionado={handleEstadoSelecionado} />
            </div>
            <div className="mapa-dados"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
