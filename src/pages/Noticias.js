import React from "react";
import "./Noticias.css";

// Exemplo de lista de notícias/comunicados
const noticiasData = [
  {
    id: 1,
    titulo: "Novo Projeto Iniciado",
    data: "29/09/2025",
    resumo:
      "Estamos felizes em anunciar o início de um novo projeto estratégico para aprimorar nossos processos internos.",
    imagem: "https://source.unsplash.com/400x220/?business,office",
    link: "#",
  },
  {
    id: 2,
    titulo: "Atualização de Políticas",
    data: "27/09/2025",
    resumo:
      "A política de home office foi revisada. Confira os novos procedimentos e orientações para colaboradores.",
    imagem: "https://source.unsplash.com/400x220/?policy,document",
    link: "#",
  },
  {
    id: 3,
    titulo: "Comunicado Importante",
    data: "25/09/2025",
    resumo:
      "Informamos que o sistema estará indisponível para manutenção programada no próximo sábado, das 8h às 12h.",
    imagem: "https://source.unsplash.com/400x220/?maintenance,technology",
    link: "#",
  },
  // ...adicione mais notícias/comunicados conforme necessário
];

export default function NoticiasComunicados() {
  return (
    <div className="noticias-wrapper">
      <h1 className="noticias-titulo"> </h1>
      <div className="noticias-grid">
        {noticiasData.map((noticia) => (
          <div key={noticia.id} className="noticia-card">
            {noticia.imagem && (
              <div className="noticia-img-wrapper">
                <img
                  src={noticia.imagem}
                  alt={noticia.titulo}
                  className="noticia-img"
                />
              </div>
            )}
            <div className="noticia-content">
              <span className="noticia-data">{noticia.data}</span>
              <h2 className="noticia-titulo-card">{noticia.titulo}</h2>
              <p className="noticia-resumo">{noticia.resumo}</p>
              <a href={noticia.link} className="noticia-btn">
                Ler mais
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
