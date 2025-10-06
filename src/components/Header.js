import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Header.css";

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [hoveredSubmenu, setHoveredSubmenu] = useState(null);
  const { usuarioLogado, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Monitoramento agora aponta para a página correta
  const menuItems = [
    {
      label: "Monitoramento",
      to: "/monitoramento",
    },
    {
      label: "Controle",
      to: "/controle",
    },
  ];

  if (usuarioLogado) {
    menuItems.push({
      label: "Dashboard",
      to: "/", // Home é o Dashboard agora
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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

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
              {/* Se for menu com link direto */}
              {item.to ? (
                <Link
                  to={item.to}
                  className="menu-link"
                  onClick={() => setOpenDropdown(null)}
                >
                  {item.label}
                </Link>
              ) : (
                <span className="menu-link">{item.label}</span>
              )}
              {/* Se for menu com submenu */}
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
          <button className="logout-button" onClick={handleLogout}>
            Sair
          </button>
        )}
      </nav>
    </header>
  );
}
