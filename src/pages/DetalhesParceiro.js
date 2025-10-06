// Nova página para abrir em nova guia, ex: /detalhes-parceiro
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "./Controle.css";

export default function DetalhesParceiro() {
  const params = new URLSearchParams(window.location.search);
  const sigla = params.get("sigla");
  const estado = params.get("estado");
  const centralizadora = params.get("centralizadora");
  const [dados, setDados] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    // Busca os dados no localStorage (alternativamente, pode buscar via backend ou query param)
    const temp = localStorage.getItem("dadosParceiro");
    if (temp) setDados(JSON.parse(temp));
    else setErro("Dados não encontrados.");
  }, []);

  // Exportar XLSX
  const exportarXLSX = () => {
    const worksheetData = [
      Object.keys(dados[0] || {}).map((k) => k), // Cabeçalho
      ...dados.map((item) => Object.values(item)),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
    const xlsxBlob = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([xlsxBlob], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${sigla}.xlsx`;
    link.click();
  };

  return (
    <div className="detalhes-page">
      <div className="detalhes-header">
        <h2>
          Parceiro <span className="detalhes-sigla">{sigla}</span>
        </h2>
        <p>
          <span className="detalhes-label">Centralizadora:</span>{" "}
          {centralizadora} |&nbsp;
          <span className="detalhes-label">Estado:</span> {estado}
        </p>
        <button className="exportar-btn moderna" onClick={exportarXLSX}>
          Exportar Relatório
        </button>
      </div>
      <div className="detalhes-lista">
        {erro && <p className="popup-error">{erro}</p>}
        {dados.length > 0 ? (
          <table className="detalhes-tabela">
            <thead>
              <tr>
                {Object.keys(dados[0]).map((chave) => (
                  <th key={chave}>{chave}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dados.map((item, i) => (
                <tr key={i}>
                  {Object.values(item).map((valor, idx) => (
                    <td key={idx}>{valor}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="popup-info">
            Nenhum B.O encontrado para este parceiro.
          </p>
        )}
      </div>
    </div>
  );
}
