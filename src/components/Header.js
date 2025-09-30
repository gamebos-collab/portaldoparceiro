import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Header.css";

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [hoveredSubmenu, setHoveredSubmenu] = useState(null);

  const usuarioLogado = localStorage.getItem("usuarioLogado");

  const menuItems = [];

  if (usuarioLogado) {
    menuItems.push({
      label: "Dashboard",
      to: "/dashboard",
    });
  }

  menuItems.push(
    {
      label: "Comunicação",
      submenu: [
        { label: "Notícias e Comunicado", to: "/comunicacao/noticias" },
        { label: "Contatos", to: "/comunicacao/contatos" },
      ],
    },
    {
      label: "Informações",
      submenu: [
        { label: "Politica de Parceiros", to: "/informacoes/politica" },
        { label: "Documentos", to: "/informacoes/documentos" },
        { label: "FAQ", to: "/informacoes/faq" },
      ],
    },
    {
      label: "Institucional",
      submenu: [
        { label: "Sobre o Portal", to: "/institucional/sobre" },
        { label: "Quem Somos", to: "/institucional/quemsomos" },
      ],
    }
  );

  return (
    <header className="header">
      <nav className="nav-bar">
        <ul className="menu">
          {menuItems.map((item, idx) => (
            <li
              key={item.label}
              className={`menu-item${hoveredMenu === idx ? " hovered" : ""}`}
              onMouseEnter={() => {
                if (item.submenu) setOpenDropdown(idx);
                setHoveredMenu(idx);
              }}
              onMouseLeave={() => {
                if (item.submenu) setOpenDropdown(null);
                setHoveredMenu(null);
              }}
              style={{ position: "relative" }}
            >
              <Link to={item.to || "#"} className="menu-link">
                {item.label}
              </Link>
              {item.submenu && openDropdown === idx && (
                <ul className="submenu">
                  {item.submenu.map((sub, subIdx) => (
                    <li
                      key={sub.label}
                      className={`submenu-item${
                        hoveredSubmenu === subIdx ? " hovered" : ""
                      }`}
                      onMouseEnter={() => setHoveredSubmenu(subIdx)}
                      onMouseLeave={() => setHoveredSubmenu(null)}
                    >
                      <Link
                        to={sub.to}
                        className="submenu-link"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {sub.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        {usuarioLogado && (
          <button
            className="logout-button"
            onClick={() => {
              localStorage.removeItem("usuarioLogado");
              window.location.href = "/";
            }}
          >
            Sair
          </button>
        )}
      </nav>
    </header>
  );
}
