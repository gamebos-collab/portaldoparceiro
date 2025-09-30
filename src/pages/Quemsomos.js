import React from "react";
import "./Quemsomos.css";

export default function QuemSomos() {
  return (
    <div className="quem-wrapper">
      <h1 className="quem-titulo">Quem Somos</h1>
      <div className="quem-content">
        <p>
          Somos uma equipe dedicada à excelência e inovação, apaixonada por
          conectar pessoas, parceiros e resultados. Nosso objetivo é criar
          soluções que transformam o dia a dia dos nossos clientes e parceiros,
          promovendo crescimento sustentável e confiança mútua.
        </p>
        <p>
          Fundado por profissionais experientes, o{" "}
          <strong>Portal do Parceiro</strong> nasceu da necessidade de integrar
          informações, facilitar processos e gerar valor para todas as partes
          envolvidas.
        </p>
        <p>
          Trabalhamos com tecnologia, transparência e ética, sempre buscando o
          melhor atendimento e suporte para nossos parceiros. Junte-se a nós
          nessa jornada de evolução!
        </p>
      </div>
      <div className="quem-equipe">
        <h2>Nossa Equipe</h2>
        <ul>
          <li>
            <span className="quem-nome">Felipe Silva</span> - Diretor Executivo
          </li>
          <li>
            <span className="quem-nome">Ana Souza</span> - Coordenadora de
            Relacionamento
          </li>
          <li>
            <span className="quem-nome">Carlos Oliveira</span> - Analista de
            Sistemas
          </li>
          <li>
            <span className="quem-nome">Equipe de Suporte</span> - Atendimento
            ao Parceiro
          </li>
        </ul>
      </div>
    </div>
  );
}
