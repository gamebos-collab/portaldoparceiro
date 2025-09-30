import React from "react";
import { FaCheckCircle, FaUserTie, FaRegFolderOpen } from "react-icons/fa";
import "./Politicadeparceiros.css";

const requisitos = [
  "CNPJ ativo e regularizado",
  "Cumprir todas as normas legais e fiscais",
  "Aceitar os valores e princípios da empresa",
  "Comprometimento com prazos e qualidade",
  "Documentação completa",
  "Equipe treinada e capacitada",
];

const etapas = [
  {
    icon: <FaUserTie />,
    titulo: "Cadastro",
    descricao:
      "O parceiro deve preencher o cadastro com todas as informações necessárias, incluindo documentação fiscal, dados bancários e contatos comerciais.",
  },
  {
    icon: <FaRegFolderOpen />,
    titulo: "Análise e Validação",
    descricao:
      "Nossa equipe irá analisar todos os requisitos, documentos e adequação às normas internas e legais. O parceiro será informado sobre eventuais pendências.",
  },
  {
    icon: <FaCheckCircle />,
    titulo: "Aprovação",
    descricao:
      "Após a validação, o parceiro estará apto para iniciar os trabalhos, seguindo as diretrizes e políticas de relacionamento.",
  },
];

export default function PoliticaParceiros() {
  return (
    <div className="politica-wrapper">
      <h1 className="politica-titulo">Política de Parceiros</h1>
      <section className="politica-intro">
        <p>
          Nossos parceiros são fundamentais para o sucesso e qualidade de nossos
          serviços. Esta página apresenta como funciona a parceria, os
          requisitos necessários e as etapas para se tornar um parceiro
          aprovado.
        </p>
      </section>
      <section className="politica-requisitos">
        <h2>Requisitos para Parceria</h2>
        <ul>
          {requisitos.map((item, idx) => (
            <li key={idx}>
              <FaCheckCircle className="check-icon" />
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section className="politica-etapas">
        <h2>Etapas do Processo</h2>
        <div className="etapas-grid">
          {etapas.map((etapa, idx) => (
            <div className="etapa-card" key={idx}>
              <div className="etapa-icon">{etapa.icon}</div>
              <h3>{etapa.titulo}</h3>
              <p>{etapa.descricao}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="politica-final">
        <h2>Compromisso e Relacionamento</h2>
        <p>
          Prezamos por parcerias transparentes, éticas e de longo prazo. Todos
          os parceiros devem seguir as políticas de compliance, segurança e
          qualidade, mantendo o respeito aos nossos valores e clientes.
        </p>
      </section>
    </div>
  );
}
