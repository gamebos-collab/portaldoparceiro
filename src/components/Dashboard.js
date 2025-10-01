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
} from "recharts";
import "./Dashboard.css";

export default function Dashboard() {
  const [dadosExcel, setDadosExcel] = useState([]);
  const [estadoSelecionado, setEstadoSelecionado] = useState(null);
  const [centralizadoraSelecionada, setCentralizadoraSelecionada] =
    useState(null);
  const [erro, setErro] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("visao");

  useEffect(() => {
    const carregarExcel = async () => {
      try {
        const res = await fetch("/kpiparceiro.xlsx");
        if (!res.ok) {
          setErro("Não foi possível carregar o arquivo Excel.");
          return;
        }
        const data = await res.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const dadosLimpos = json.map((item) => ({
          Estado: item.Estado?.toString().trim(),
          Centralizadora: item.Centralizadora?.toString().trim(),
          Parceiro: item.Parceiro?.toString().trim(),
          BOS: item.BOS,
        }));

        setDadosExcel(dadosLimpos);
      } catch (error) {
        console.error("❌ Erro ao carregar Excel:", error);
        setErro("Erro ao processar o arquivo Excel.");
      }
    };

    carregarExcel();
  }, []);

  const normalize = (str) =>
    str
      ?.trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const centralizadorasDoEstado = [
    ...new Set(
      dadosExcel
        .filter(
          (item) => normalize(item.Estado) === normalize(estadoSelecionado)
        )
        .map((item) => item.Centralizadora)
    ),
  ];

  const dadosFiltrados = dadosExcel.filter(
    (item) =>
      normalize(item.Estado) === normalize(estadoSelecionado) &&
      item.Centralizadora === centralizadoraSelecionada
  );

  const handleEstadoSelecionado = (estado) => {
    setEstadoSelecionado(estado);
    setCentralizadoraSelecionada(null);
    setShowPopup(true);
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

  const exportarXLSX = () => {
    const worksheetData = [
      ["Parceiro", "BOS"],
      ...dadosFiltrados.map((item) => [item.Parceiro, item.BOS]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");

    const xlsxBlob = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([xlsxBlob], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dados_${centralizadoraSelecionada}.xlsx`;
    link.click();
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-top"></div>
      <div className="dashboard-bottom">
        <div className="mapa-container" style={{ position: "relative" }}>
          <div className="mapa-conteudo">
            <div className="mapa-visual">
              <MapaBrasil onEstadoSelecionado={handleEstadoSelecionado} />
              {showPopup && (
                <div>
                  <div className="popup-overlay" onClick={closePopup} />
                  <div className="popup-modal">
                    <button
                      className="popup-close"
                      onClick={closePopup}
                      title="Fechar"
                    >
                      ✖
                    </button>
                    {erro && <p style={{ color: "red" }}>{erro}</p>}
                    {estadoSelecionado && (
                      <div>
                        <h2>{estadoSelecionado}</h2>
                        <h3>Centralizadoras:</h3>
                        {centralizadorasDoEstado.length > 0 ? (
                          <div className="centralizadora-lista">
                            {centralizadorasDoEstado.map((cent) => (
                              <button
                                key={cent}
                                className={`centralizadora-btn ${
                                  cent === centralizadoraSelecionada
                                    ? "ativa"
                                    : ""
                                }`}
                                onClick={() => {
                                  setCentralizadoraSelecionada(cent);
                                  setShowPopup(false);
                                }}
                              >
                                {cent}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: "#fff" }}>
                            Nenhuma centralizadora encontrada para este estado.
                          </p>
                        )}
                        <p
                          style={{ fontSize: 12, color: "#bbb", marginTop: 6 }}
                        >
                          Pressione ESC para fechar
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Painel lateral com abas */}
            <div className="mapa-dados">
              {centralizadoraSelecionada && dadosFiltrados.length > 0 && (
                <div className="painel-lateral">
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
                    <button
                      className={abaAtiva === "exportar" ? "aba ativa" : "aba"}
                      onClick={() => setAbaAtiva("exportar")}
                    >
                      Exportar
                    </button>
                  </div>

                  <div className="conteudo-aba">
                    {abaAtiva === "visao" && (
                      <div>
                        <h4>Parceiros em {centralizadoraSelecionada}</h4>
                        <ul>
                          {dadosFiltrados.map((item, index) => (
                            <li key={index}>
                              {item.Parceiro} — B.Os: {item.BOS}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {abaAtiva === "grafico" && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dadosFiltrados}>
                          <XAxis dataKey="Parceiro" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="BOS" fill="#3f51b5" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}

                    {abaAtiva === "exportar" && (
                      <div>
                        <p>Exportar dados da centralizadora para CSV:</p>
                        <button className="exportar-btn" onClick={exportarXLSX}>
                          Baixar XLSX
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
