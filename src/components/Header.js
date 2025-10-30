import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Header.css";
import bbmLogo from "../assets/bbm-assist.jpg"; // coloque a imagem anexada em src/assets/bbm-assist.png

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [hoveredSubmenu, setHoveredSubmenu] = useState(null);
  const { usuarioLogado, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Menu principal ajustado conforme especificado (sem o item de BBM Assist - agora é o botão flutuante)
  const menuItems = [
    {
      label: "Monitoramento",
      to: "/", // Home, exibido com o rótulo "Monitoramento"
    },
    {
      label: "Controle",
      to: "/controle",
    },
    {
      label: "Comunicação",
      submenu: [
        { label: "Noticias e Comunicados", to: "/comunicacao/noticias" },
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
      to: "/Sobre", // abre a página "Sobre" diretamente (sem submenu)
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleOpenBbmassist = () => {
    // abre a rota do BBM Assist - ajuste a rota se necessário
    navigate("/Bbmassist");
  };

  return (
    <>
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

      {/* BBM Assist Floating Button - colado à margem direita da página */}
      <button
        className="bbmassist-fab"
        onClick={handleOpenBbmassist}
        aria-label="BBM Assist"
        title="BBM Assist"
      >
        <img src={bbmLogo} alt="BBM Assist" className="bbmassist-img" />
        <span className="bbmassist-glow" aria-hidden />
      </button>
    </>
  );
}
