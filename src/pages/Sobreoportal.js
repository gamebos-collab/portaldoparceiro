import React from "react";
import "./Sobreoportal.css";

export default function SobrePortal() {
  return (
    <div className="sobre-wrapper">
      <h1 className="sobre-titulo">Sobre o Portal do Parceiro</h1>
      <div className="sobre-content">
        <p>
          O <strong>Portal do Parceiro</strong> é uma plataforma digital
          desenvolvida para facilitar o relacionamento, comunicação e integração
          entre nossos parceiros e colaboradores.
        </p>
        <p>
          Através do portal, você tem acesso a notícias, comunicados, documentos
          importantes, política de parceria e recursos exclusivos para o seu
          perfil.
        </p>
        <p>
          Nosso foco é proporcionar agilidade, transparência e eficiência,
          tornando a experiência do parceiro mais simples, segura e inovadora.
        </p>
        <ul className="sobre-lista">
          <li>✔ Comunicação direta e rápida</li>
          <li>✔ Consulta de documentos e políticas</li>
          <li>✔ Notícias e atualizações em tempo real</li>
          <li>✔ Ambiente seguro e personalizado</li>
        </ul>
        <p>
          Seja bem-vindo e aproveite todos os recursos que o Portal do Parceiro
          oferece para impulsionar sua atuação!
        </p>
      </div>
    </div>
  );
}
