import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import MapaBrasil from "./MapaBrasil";
import "./Dashboard.css";

export default function Dashboard() {
  const [dadosExcel, setDadosExcel] = useState([]);
  const [estadoSelecionado, setEstadoSelecionado] = useState(null);
  const [centralizadoraSelecionada, setCentralizadoraSelecionada] =
    useState(null);
  const [erro, setErro] = useState("");
  const [showPopup, setShowPopup] = useState(false);

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

  // Ao clicar no estado, abre popup e reseta centralizadora
  const handleEstadoSelecionado = (estado) => {
    setEstadoSelecionado(estado);
    setCentralizadoraSelecionada(null);
    setShowPopup(true);
  };

  // Fecha popup
  const closePopup = useCallback(() => {
    setShowPopup(false);
    // Mantém estadoSelecionado para continuar exibindo a área à direita caso a centralizadora já esteja selecionada
  }, []);

  // ESC fecha popup
  useEffect(() => {
    if (!showPopup) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") closePopup();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [showPopup, closePopup]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-top">
        <h1>Portal do Parceiro</h1>
      </div>
      <div className="dashboard-bottom">
        <div
          className="mapa-container"
          style={{ position: "relative", display: "flex" }}
        >
          <div
            className="mapa-conteudo"
            style={{ position: "relative", width: "40vw", minWidth: 350 }}
          >
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
                    {estadoSelecionado ? (
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
                                  closePopup();
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
                        <button className="popup-back" onClick={closePopup}>
                          Voltar
                        </button>
                        <p
                          style={{ fontSize: 12, color: "#bbb", marginTop: 6 }}
                        >
                          Pressione ESC para fechar
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Lado direito livre para exibir os detalhes */}
          <div className="mapa-dados" style={{ flex: 1, padding: 32 }}>
            {estadoSelecionado && centralizadoraSelecionada ? (
              <div className="dados-centralizadora">
                <h2>{estadoSelecionado}</h2>
                <h3>Centralizadora: {centralizadoraSelecionada}</h3>
                {dadosFiltrados.length > 0 ? (
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
                ) : (
                  <p style={{ color: "#fff" }}>
                    Nenhum parceiro encontrado para esta centralizadora.
                  </p>
                )}
              </div>
            ) : (
              <p style={{ color: "#888" }}>
                Selecione um estado no mapa e escolha uma centralizadora para
                ver os parceiros.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
