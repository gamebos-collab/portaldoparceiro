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
  CartesianGrid,
  LabelList,
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

// Mapeia cada estado para as centralizadoras correspondentes
const estadoCentralizadoras = {
  "Rio Grande do Sul": ["CXS", "POA", "SMA"],
  "Santa Catarina": ["BLU", "JVL", "FLN"],
  "Minas Gerais": ["PPY", "BHZ"],
  Paraná: ["CWB", "LDA", "CAS"],
  "São Paulo": ["SOR", "RIP", "SUM", "SAO", "GRU", "BAU", "CPN"],
  "Espírito Santo": ["VIX"],
  Ceará: ["CRA"],
};

// Mensagens específicas para regiões onde "Centralizadora não atende"
// Preencha as mensagens desejadas por estado abaixo. Se deixar vazio, será exibida a mensagem padrão.
const MSGS_CENTRALIZADORA_NAO_ATENDE = {
  Amazonas: "REGIÃO ATENDIDA PELA\nCENTRALIZADORA GRU",
  Acre: "REGIÃO ATENDIDA PELA\nCENTRALIZADORA GRU",
  Roraima: "REGIÃO ATENDIDA PELA\nCENTRALIZADORA GRU",
  Pará: "REGIÃO ATENDIDA PELA\nCENTRALIZADORA GRU",
  Amapá: "REGIÃO ATENDIDA PELA\nCENTRALIZADORA GRU",
  Rondônia: "REGIÃO ATENDIDA PELA\nCENTRALIZADORA GRU",
  Maranhão: "REGIÃO ATENDIDA PELA\nCENTRALIZADORA GRU",
  Tocantins: "REGIÃO ATENDIDA PELA\nCENTRALIZADORA GRU",
  Piauí: "REGIÃO ATENDIDA PELA\nCENTRALIZADORA GRU",
  "Mato Grosso": "REGIÃO ATENDIDA PELA\nCENTRALIZADORA SAO",
  "Mato Grosso do Sul": "REGIÃO ATENDIDA PELA\nCENTRALIZADORA SAO",
  "Rio de Janeiro": "REGIÃO ATENDIDA PELA\nCENTRALIZADORA SAO",
  Goiás: "REGIÃO ATENDIDA PELA\nCENTRALIZADORA CPN",
  "Distrito Federal": "REGIÃO ATENDIDA PELA\nCENTRALIZADORA CPN",
  "Rio Grande do Norte": "REGIÃO ATENDIDA PELA\nCENTRALIZADORA CPN",
  Paraíba: "REGIÃO ATENDIDA PELA\nCENTRALIZADORA CPN",
  Pernambuco: "REGIÃO ATENDIDA PELA\nCENTRALIZADORA CPN",
  Alagoas: "REGIÃO ATENDIDA PELA\nCENTRALIZADORA CPN",
  Sergipe: "REGIÃO ATENDIDA PELA\nCENTRALIZADORA CPN",
  Bahia: "REGIÃO ATENDIDA PELA\nCENTRALIZADORA CPN",
  // ...outras mensagens
  default: "Centralizadora não atende",
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
    nome: "Alexandre Azambuja",
    email: "alexandre.tavares@translovato.com.br",
    telefone: "55 (51) 99459-2562",
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
  "#DAA520",
  "#DAA520",
  "#DAA520",
  "#DAA520",
  "#DAA520",
  "#DAA520",
  "#DAA520",
  "#DAA520",
  "#DAA520",
  "#DAA520",
  "#DAA520",
  "#DAA520",
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

  // Array de objetos para editar o nome das colunas facilmente
  // Edite 'label' para mudar o nome exibido, e mantenha 'field' igual ao nome da coluna nos dados
  const COLS = [
    { field: "Numero do BO", label: "B.O" },
    { field: "Cliente", label: "Cliente" },
    { field: "Ocorrência", label: "Ocorrência" },
    { field: "Data Alteração", label: "Data de Alteração" },
    { field: "Emp. Resp. Anterior", label: "Resp. Anterior" },
    { field: "Emp. Resp. Nova", label: "Resp. Novo" },
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
        padding: "5px 7px",
        fontSize: "0.8rem",
      }}
    >
      {loading ? (
        <div
          style={{
            color: "#072d4d",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "1.2rem",
            padding: "40px 0",
            animation: "pulse 1s infinite",
          }}
        >
          Carregando...
          <style>
            {`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1);}
          50% { opacity: 0.3; transform: scale(1.07);}
          100% { opacity: 1; transform: scale(1);}
        }
      `}
          </style>
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
              {/* Cabeçalho dinâmico com labels editáveis */}
              {COLS.map((col, i) => (
                <th
                  key={col.field}
                  style={{
                    padding: "5px 7px",
                    fontSize: "0.8rem",
                    borderRadius:
                      i === 0
                        ? "5px 0 0 0"
                        : i === COLS.length - 1
                        ? "0 5px 0 0"
                        : "0",
                  }}
                >
                  {col.label}
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
                    fontSize: "0.6rem",
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
                  {/* Células da linha, exibindo campo pelo nome field */}
                  {COLS.map((col) => (
                    <td
                      key={col.field}
                      style={{ padding: "5px 7px", textAlign: "center" }}
                    >
                      {item[col.field] || ""}
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

/*
 * Para editar o nome das colunas na tabela de B.Os Baixados,
 * basta alterar o valor do campo 'label' no array COLS abaixo.
 * Exemplo: { field: "BO", label: "B.O Editável" }
 */

// Componente para a tabela de B.Os Baixados
function TabelaBOsBaixados({
  centralizadoraSelecionada,
  parceirosDaCentralizadora,
  dadosExcel,
}) {
  // Situações que caracterizam baixados
  const PARECER_BAIXADOS = [
    "EM ANALISE / TRATATIVAS DA GESTAO",
    "AGUARDANDO ANALISE DO CLIENTE",
    "COBRANCA ENCAMINHADA FILIAL RESP ",
  ];

  // Array de objetos para fácil edição do nome das colunas
  // Edite o campo 'label' para mudar o nome exibido no cabeçalho da tabela
  // NÃO altere o campo 'field', pois ele corresponde ao nome da coluna nos seus dados
  const COLS = [
    { field: "BO", label: "B.O" },
    { field: "Nr Ct", label: "CT-e" },
    { field: "Ocorrência", label: "Ocorrência" },
    { field: "Parecer", label: "Situação" },
    { field: "Resp", label: "Responsável" },
    { field: "Centralizadora", label: "Centralizadora" },
    { field: "Dt Parecer", label: "Data do Parecer" },
  ];

  // Função para converter número Excel ou string data para "DD/MM/YYYY"
  const formatDtParecer = (val) => {
    if (!val) return "";
    // Se já vier como string
    if (typeof val === "string" && val.includes("/")) return val;
    // Se vier em formato número Excel
    if (typeof val === "number") {
      // Excel date to JS date:
      // Excel's day 0 is 1899-12-30, JS's is 1970-01-01
      const excelEpoch = new Date(1899, 11, 30);
      const jsDate = new Date(excelEpoch.getTime() + val * 24 * 60 * 60 * 1000);
      const dia = jsDate.getDate().toString().padStart(2, "0");
      const mes = (jsDate.getMonth() + 1).toString().padStart(2, "0");
      const ano = jsDate.getFullYear();
      return `${dia}/${mes}/${ano}`;
    }
    return "";
  };

  // Filtra B.Os baixados para a centralizadora:
  const bosBaixados = (dadosExcel || []).filter((item) => {
    const parecer = (item["Parecer"] || "").toString().trim().toUpperCase();
    const centralizadora = (item["Centralizadora"] || "")
      .toString()
      .trim()
      .toUpperCase();
    const resp = (item["Resp"] || "").toString().trim().toUpperCase();

    // Verifica se o parecer está em uma das situações baixadas
    const isBaixado = PARECER_BAIXADOS.some((val) => parecer.startsWith(val));

    // O registro pertence à centralizadora se:
    // 1. A centralizadora for igual à selecionada
    // 2. OU, o Resp for um parceiro da centralizadora selecionada
    const isDaCentralizadoraDireto =
      centralizadora === (centralizadoraSelecionada || "").toUpperCase();
    const isParceiro = (parceirosDaCentralizadora || []).includes(resp);

    return isBaixado && (isDaCentralizadoraDireto || isParceiro);
  });

  // Ordena pela data "Dt Parecer" (mais recente primeiro)
  const parseDate = (val) => {
    if (!val) return new Date(0);
    // Se for número Excel
    if (typeof val === "number") {
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + val * 24 * 60 * 60 * 1000);
    }
    // Se for string "dd/mm/yyyy"
    if (typeof val === "string" && val.includes("/")) {
      const [d, m, y] = val.split("/");
      if (d && m && y) return new Date(Number(y), Number(m) - 1, Number(d));
    }
    return new Date(val);
  };

  const bosBaixadosOrdenados = [...bosBaixados].sort((a, b) => {
    const dateA = parseDate(a["Dt Parecer"]);
    const dateB = parseDate(b["Dt Parecer"]);
    return dateB - dateA;
  });

  // Interatividade ao passar mouse: linha pulsante e negrito
  const handleMouseEnter = (e) => {
    e.currentTarget.style.background = "#ffe200";
    e.currentTarget.style.color = "#072d4d";
    e.currentTarget.style.fontWeight = "bold";
    e.currentTarget.style.animation = "pulse 1s infinite";
  };
  const handleMouseLeave = (e, idx) => {
    e.currentTarget.style.background = idx % 2 === 0 ? "#f7faff" : "#eef3fb";
    e.currentTarget.style.color = "#072d4d";
    e.currentTarget.style.fontWeight = "normal";
    e.currentTarget.style.animation = "none";
  };

  return (
    <div
      style={{
        marginTop: "16px",
        color: "#072d4d",
        textAlign: "center",
        background: "#fff",
        borderRadius: "8px",
        padding: "8px 4px",
        maxHeight: "270px",
        overflowY: "auto",
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
            {COLS.map((col, i) => (
              <th
                key={col.field}
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
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bosBaixadosOrdenados.length > 0 ? (
            bosBaixadosOrdenados.map((item, idx) => (
              <tr
                key={idx}
                style={{
                  background: idx % 2 === 0 ? "#f7faff" : "#eef3fb",
                  color: "#072d4d",
                  fontSize: "0.6rem",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "background 0.18s, color 0.18s",
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={(e) => handleMouseLeave(e, idx)}
              >
                {COLS.map((col) => (
                  <td
                    key={col.field}
                    style={{ padding: "5px 7px", textAlign: "center" }}
                  >
                    {col.field === "Dt Parecer"
                      ? formatDtParecer(item["Dt Parecer"])
                      : item[col.field] || ""}
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
                Nenhum B.O baixado encontrado para esta centralizadora.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {/* Pulse animation CSS inlined */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
        `}</style>
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

  // novo estado para controlar hover no gráfico
  const [activeBarIndex, setActiveBarIndex] = useState(null);

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

  // Funções para interatividade do mouse
  const handleMouseEnter = (e) => {
    e.currentTarget.style.background = "#ffe200";
    e.currentTarget.style.color = "#072d4d";
    e.currentTarget.style.fontWeight = "bold";
    e.currentTarget.style.animation = "pulse 1s infinite";
  };
  const handleMouseLeave = (e, idx, isCritico) => {
    e.currentTarget.style.background = idx % 2 === 0 ? "#f7faff" : "#eef3fb";
    e.currentTarget.style.color = isCritico ? "red" : "#072d4d";
    e.currentTarget.style.fontWeight = "normal";
    e.currentTarget.style.animation = "none";
  };

  // Renderiza tabela dos B.Os críticos com interatividade do mouse
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
              B.O
            </th>
            <th style={{ padding: "6px 8px" }}>CT-e</th>
            <th style={{ padding: "6px 8px" }}>Ocorrência</th>
            <th style={{ padding: "6px 8px" }}>Valor</th>
            <th style={{ padding: "6px 8px" }}>Resp.</th>
            <th style={{ padding: "6px 8px" }}>Nota Fiscal</th>
            <th style={{ padding: "6px 8px", borderRadius: "0 5px 0 0" }}>
              Nível
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
                    cursor: "pointer",
                    transition: "background 0.18s, color 0.18s",
                  }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={(e) => handleMouseLeave(e, idx, isCritico)}
                >
                  <td style={{ padding: "5px 7px", fontWeight: 700 }}>
                    {item["BO"] || ""}
                  </td>
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
      {/* Pulse animation CSS inlined */}
      <style>{`
      @keyframes pulse {
        0% { opacity: 1; }
      }
    `}</style>
    </div>
  );

  // ABA REVERSÕES
  const renderBOsRevercoes = () => (
    <TabelaReversoes centralizadoraSelecionada={centralizadoraSelecionada} />
  );

  // ABA B.O's BAIXADOS
  const renderBOsBaixados = () => (
    <TabelaBOsBaixados
      centralizadoraSelecionada={centralizadoraSelecionada}
      parceirosDaCentralizadora={parceirosDaCentralizadora}
      dadosExcel={dadosExcel}
    />
  );

  // Utility: shade or lighten a hex color by percent (-100 to 100)
  const shadeColor = (hex, percent) => {
    try {
      let h = hex.replace("#", "");
      if (h.length === 3) {
        h = h
          .split("")
          .map((c) => c + c)
          .join("");
      }
      const num = parseInt(h, 16);
      let r = (num >> 16) & 0xff;
      let g = (num >> 8) & 0xff;
      let b = num & 0xff;

      const amt = Math.round((percent / 100) * 255);
      r = Math.min(255, Math.max(0, r + amt));
      g = Math.min(255, Math.max(0, g + amt));
      b = Math.min(255, Math.max(0, b + amt));

      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    } catch (e) {
      return hex;
    }
  };

  // Custom tooltip para o gráfico, similar ao estilo aplicado no outro arquivo
  function CustomGraficoTooltip({ active, payload }) {
    if (active && payload && payload.length) {
      const p = payload[0].payload || {};
      return (
        <div
          style={{
            background: "rgba(255,255,255,0.98)",
            boxShadow: "0 6px 18px rgba(20,20,40,0.12)",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 13,
            color: "#111",
            border: "1px solid rgba(0,0,0,0.06)",
            minWidth: 140,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>{p.parceiro}</div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ color: "#444" }}>B.Os</div>
            <div style={{ fontWeight: 700 }}>{p.bos ?? 0}</div>
          </div>
        </div>
      );
    }
    return null;
  }

  // Render 3D-looking bar shape for Recharts
  const render3DBar = (props) => {
    const { x, y, width, height, fill } = props;
    // depth is how pronounced the 3D effect is
    const depth = Math.min(12, Math.round(width * 0.22));
    const rx = 6; // corner radius

    // Points for the right face (slanted to top-right)
    const x0 = x;
    const y0 = y;
    const x1 = x + width;
    const y1 = y + height;

    const rightFace = `${x1},${y0} ${x1 + depth},${Math.max(0, y0 - depth)} ${
      x1 + depth
    },${Math.max(0, y1 - depth)} ${x1},${y1}`;
    const topFace = `${x0},${y0} ${x0 + depth},${Math.max(0, y0 - depth)} ${
      x1 + depth
    },${Math.max(0, y0 - depth)} ${x1},${y0}`;

    const frontFill = fill || "#8884d8";
    const sideFill = shadeColor(frontFill, -22);
    const topFill = shadeColor(frontFill, 16);

    return (
      <g>
        {/* right side face */}
        <polygon points={rightFace} fill={sideFill} />
        {/* top face */}
        <polygon points={topFace} fill={topFill} />
        {/* front face with rounded corners */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={rx}
          ry={rx}
          fill={frontFill}
          style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.12))" }}
        />
      </g>
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
                  whiteSpace: "pre-line", // <-- faz a quebra no '\n'
                }}
              >
                {/* Exibe mensagem específica por região quando não houver centralizadora */}
                {MSGS_CENTRALIZADORA_NAO_ATENDE[estadoSelecionado] ||
                  MSGS_CENTRALIZADORA_NAO_ATENDE.default}
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
            <p
              className="popup-esc"
              style={{ textAlign: "center", marginTop: 16, fontSize: "0.9rem" }}
            >
              Pressione ESC para fechar
            </p>
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
        { key: "baixados", label: "B.O's Análises" },
      ];

      const renderAbaConteudo = () => {
        switch (abaAtiva) {
          case "visao":
            return renderCards();
          case "grafico":
            return (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={graficoData}
                  margin={{ top: 18, right: 12, left: 6, bottom: 18 }}
                  barCategoryGap="18%"
                  barGap={0}
                >
                  <defs>
                    <filter
                      id="barShadow"
                      x="-50%"
                      y="-50%"
                      width="200%"
                      height="200%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="6"
                        stdDeviation="8"
                        floodColor="#000"
                        floodOpacity="0.12"
                      />
                    </filter>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" opacity={0.6} />
                  <XAxis
                    dataKey="parceiro"
                    tick={{ fill: "#fff", fontWeight: 700 }}
                  />
                  <YAxis tick={{ fill: "#fff", fontWeight: 700 }} />
                  <Tooltip content={<CustomGraficoTooltip />} />
                  <Legend />

                  <Bar
                    dataKey="bos"
                    name="B.O"
                    isAnimationActive={true}
                    barSize={40}
                    radius={[8, 8, 0, 0]}
                    animationDuration={800}
                    shape={render3DBar} // apply 3D custom shape
                  >
                    {/* LabelList para exibir número em cima da barra */}
                    <LabelList
                      dataKey="bos"
                      position="top"
                      offset={15}
                      style={{
                        fill: "#ffffffff",
                        fontWeight: 1000,
                        fontSize: 17,
                      }}
                    />
                    {graficoData.map((entry, idx) => {
                      const isActive = idx === activeBarIndex;
                      return (
                        <Cell
                          key={`cell-${idx}`}
                          fill={entry.fill}
                          style={{
                            cursor: "pointer",
                            opacity: isActive ? 1 : 0.98,
                          }}
                          onMouseEnter={() => setActiveBarIndex(idx)}
                          onMouseLeave={() => setActiveBarIndex(null)}
                          onClick={() => abrirDetalhes(entry.parceiro)}
                        />
                      );
                    })}
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
                {[
                  { key: "visao", label: "Visão Geral" },
                  { key: "grafico", label: "Gráfico" },
                  { key: "criticos", label: "Criticidade" },
                  { key: "revercoes", label: "Reversões" },
                  { key: "baixados", label: "B.O's Análises" },
                ].map((aba) => (
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
                textAlign: "center",
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
