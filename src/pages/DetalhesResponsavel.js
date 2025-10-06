import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "./Controle.css";

const colunasExibir = [
  "B.O",
  "Assunto",
  "Data",
  "Resp",
  "Centralizadora",
  // Adicione outras colunas que quiser
];

export default function DetalhesResponsavel() {
  const params = new URLSearchParams(window.location.search);
  const centralizadora = params.get("centralizadora");
  const responsabilidade = params.get("responsabilidade");
  const [dados, setDados] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const temp = localStorage.getItem("dadosResponsavel");
    if (temp) setDados(JSON.parse(temp));
    else setErro("Dados não encontrados.");
  }, []);

  const exportarXLSX = () => {
    const worksheetData = [
      colunasExibir,
      ...dados.map((item) => colunasExibir.map((col) => item[col])),
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
    link.download = `relatorio_${responsabilidade}.xlsx`;
    link.click();
  };

  return (
    <div className="detalhes-page">
      <div className="detalhes-header">
        <h2>
          Responsabilidade:{" "}
          <span className="detalhes-sigla">{responsabilidade}</span>
        </h2>
        <p>
          <span className="detalhes-label">Centralizadora:</span>{" "}
          {centralizadora}
        </p>
        <button className="exportar-btn" onClick={exportarXLSX}>
          Exportar Relatório
        </button>
      </div>
      <div className="detalhes-lista">
        {erro && <p className="popup-error">{erro}</p>}
        {dados.length > 0 ? (
          <table className="detalhes-tabela">
            <thead>
              <tr>
                {colunasExibir.map((chave) => (
                  <th key={chave}>{chave}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dados.map((item, i) => (
                <tr key={i}>
                  {colunasExibir.map((col, idx) => (
                    <td key={idx}>{item[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="popup-info">
            Nenhum B.O encontrado para esta responsabilidade.
          </p>
        )}
      </div>
    </div>
  );
}
