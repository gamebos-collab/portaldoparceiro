import React from "react";
import { FaDownload, FaFilePdf, FaEye } from "react-icons/fa";
import "./Documentos.css";

// Lista de documentos com URLs locais
const documentosData = [
  {
    id: 1,
    titulo: "Como Abrir B.O",
    descricao: "Instruções de como abrir um B.O corretamente.",
    tipo: "pdf",
    url: "/documentos/Abertura BO.pdf",
  },
  {
    id: 2,
    titulo: "Perfil de carga LTL",
    descricao:
      "Instruções e guia referente a perfil de carga adequado para transporte.",
    tipo: "pdf",
    url: "/documentos/LTL_Perfil de Carga.pdf",
  },
  {
    id: 3,
    titulo: "Manual de Protocolo",
    descricao: "manual de protocolo.",
    tipo: "pdf",
    url: "/documentos/Manual Protocolo.pdf",
  },
  {
    id: 3,
    titulo: "Procedimento",
    descricao: "guia basico de procedimento de B.O.",
    tipo: "pdf",
    url: "/documentos/Procedimento.pdf",
  },
  {
    id: 3,
    titulo: "Manual de B.O e Soft",
    descricao: "Termos e condições para parceiros.",
    tipo: "pdf",
    url: "/documentos/Manual BO's até Soft.pdf",
  },
  {
    id: 3,
    titulo: "Manual de Protocolo",
    descricao: "Termos e condições para parceiros.",
    tipo: "pdf",
    url: "/documentos/Manual Protocolo.pdf",
  },
  // Adicione mais documentos conforme necessário
];

export default function Documentos() {
  return (
    <div className="documentos-wrapper">
      <h1 className="documentos-titulo">Documentos Disponíveis</h1>
      <div className="documentos-grid">
        {documentosData.map((doc) => (
          <div key={doc.id} className="documento-card">
            <div className="documento-icones">
              <FaFilePdf className="doc-icon" />
            </div>
            <div className="documento-info">
              <h2 className="documento-nome">{doc.titulo}</h2>
              <p className="documento-descricao">{doc.descricao}</p>
              <div className="documento-actions">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="documento-btn view"
                  title="Consultar online"
                >
                  <FaEye /> Visualizar
                </a>
                <a
                  href={doc.url}
                  download
                  className="documento-btn download"
                  title="Baixar documento"
                >
                  <FaDownload /> Download
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
