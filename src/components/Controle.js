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

// Colunas para exibir nas telas de detalhe
const colunasExibir = ["B.O", "Assunto", "Data", "Resp", "Centralizadora"];

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
    nome: "João Silva",
    email: "joao@empresa.com",
    telefone: "5551999999999",
  },
  POA: {
    nome: "Maria Souza",
    email: "maria@empresa.com",
    telefone: "5551998888888",
  },
  SMA: {
    nome: "Carlos Oliveira",
    email: "carlos@empresa.com",
    telefone: "5551998777666",
  },
  // Adicione todas as outras centralizadoras!
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

export default function Home() {
  const [dadosExcel, setDadosExcel] = useState([]);
  const [estadoSelecionado, setEstadoSelecionado] = useState(null); // Estado do mapa clicado
  const [centralizadoraSelecionada, setCentralizadoraSelecionada] =
    useState(null); // Só definida após escolher no popup
  const [erro, setErro] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("visao");

  useEffect(() => {
    const carregarExcel = async () => {
      try {
        const res = await fetch("/kpiparceiros.xlsx");
        if (!res.ok) {
          setErro("Não foi possível carregar o arquivo Excel.");
          return;
        }
        const data = await res.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, {
          range: "A1:K259",
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
    bos: bosParceiros.filter((item) => item.Resp === sigla).length,
    fill: barColors[idx % barColors.length],
  }));

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

  // Renderiza cards dos parceiros e centralizadora
  const renderCards = () => (
    <div className="parceiros-cards">
      {/* Card Centralizadora */}
      <div className="parceiro-card">
        <div className="sigla">{centralizadoraSelecionada}</div>
        <div className="bos-quantidade">{bosCentralizadora.length} B.O</div>
        <button className="detalhes-btn" onClick={abrirDetalhesCentralizadora}>
          Ver B.Os da Centralizadora
        </button>
      </div>
      {/* Cards Parceiros */}
      {parceirosDaCentralizadora.map((sigla, idx) => {
        const count = bosParceiros.filter((item) => item.Resp === sigla).length;
        return (
          <div className="parceiro-card" key={sigla}>
            <div className="sigla">{sigla}</div>
            <div className="bos-quantidade">{count} B.O</div>
            <button
              className="detalhes-btn"
              onClick={() => abrirDetalhes(sigla)}
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
      <div className="gerente-regional-info">
        <h3>Gerente Regional</h3>
        <div>
          <strong>Nome:</strong> {gerente.nome}
        </div>
        <div>
          <strong>Email:</strong>{" "}
          <a href={`mailto:${gerente.email}`} style={{ color: "#ffe200" }}>
            {gerente.email}
          </a>
        </div>
        <div>
          <strong>Telefone:</strong>{" "}
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
            <p className="popup-esc">Pressione ESC para fechar</p>
          </div>
        </div>
      );
    }
    // Etapa 2: Escolher parceiro
    if (centralizadoraSelecionada) {
      return (
        <div className="popup-modal">
          <button className="popup-close" onClick={closePopup} title="Fechar">
            <span aria-label="Fechar">&times;</span>
          </button>
          <div className="popup-content">
            <h2 className="popup-title">{centralizadoraSelecionada}</h2>
            {renderGerenteRegional()}
            <div className="abas">
              <button
                className={abaAtiva === "visao" ? "aba ativa" : "aba"}
                onClick={() => setAbaAtiva("visao")}
              >
                Visão Geral
              </button>
              <button
                className={abaAtiva === "grafico" ? "aba ativa" : "aba"}
                onClick={() => setAbaAtiva("grafico")}
              >
                Gráfico
              </button>
            </div>
            <div className="conteudo-aba">
              {abaAtiva === "visao" && renderCards()}
              {abaAtiva === "grafico" && (
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
              )}
            </div>
            <p className="popup-esc">Pressione ESC para fechar</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-top"></div>
      <div className="dashboard-bottom">
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
