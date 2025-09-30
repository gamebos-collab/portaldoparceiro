import React from "react";
import logo from "../assets/logo.png"; // ajuste caminho se necessário
import "./TopBar.css";

const TopBar = () => (
  <div className="top-bar">
    <img src={logo} alt="Logo da empresa" className="top-bar-logo" />
    <span className="top-bar-title">
      <strong>Portal</strong> do Parceiro
    </span>
  </div>
);

export default TopBar;
