import React, { useState } from "react";
import { FaChevronDown, FaChevronUp, FaQuestionCircle } from "react-icons/fa";
import "./Faq.css";

const faqData = [
  {
    pergunta: "Como faço para me cadastrar como parceiro?",
    resposta:
      "Clique na opção 'Cadastro de Parceiros' no menu principal, preencha todos os campos obrigatórios e envie sua documentação. Nossa equipe analisará e dará retorno em até 3 dias úteis.",
  },
  {
    pergunta: "Quais documentos são necessários para parceria?",
    resposta:
      "Você precisa enviar o CNPJ, comprovante de endereço, documentos fiscais e comprovante de treinamento da equipe. Consulte a página de Política de Parceiros para detalhes.",
  },
  {
    pergunta: "Como acesso meus documentos liberados?",
    resposta:
      "Na página 'Documentos', você pode consultar online ou baixar qualquer arquivo disponível conforme seu perfil de acesso.",
  },
  {
    pergunta: "Como recebo comunicados importantes?",
    resposta:
      "Todos os comunicados são postados na página de Notícias & Comunicados. Ative as notificações para ser informado por e-mail.",
  },
  {
    pergunta: "Posso atualizar meus dados cadastrais?",
    resposta:
      "Sim, acesse sua área de perfil e clique em 'Editar dados'. Após atualização, nossa equipe irá validar as alterações.",
  },
  // Adicione mais perguntas e respostas conforme necessário
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="faq-wrapper">
      <h1 className="faq-titulo">
        <FaQuestionCircle style={{ marginRight: 10 }} />
        Perguntas Frequentes (FAQ)
      </h1>
      <div className="faq-list">
        {faqData.map((item, idx) => (
          <div
            key={idx}
            className={`faq-card${openIndex === idx ? " open" : ""}`}
          >
            <button
              className="faq-pergunta"
              onClick={() => handleToggle(idx)}
              aria-expanded={openIndex === idx}
            >
              <span>{item.pergunta}</span>
              {openIndex === idx ? (
                <FaChevronUp className="faq-icon" />
              ) : (
                <FaChevronDown className="faq-icon" />
              )}
            </button>
            <div
              className="faq-resposta"
              style={{
                maxHeight: openIndex === idx ? "200px" : "0",
                opacity: openIndex === idx ? 1 : 0,
                padding: openIndex === idx ? "18px 16px" : "0 16px",
                transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
              }}
            >
              {openIndex === idx && <div>{item.resposta}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
