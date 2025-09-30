import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import bbmBackground from "../assets/bbm.png";
import Cadastro from "./Cadastro";
import "./Home.css";

export default function Home() {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [formData, setFormData] = useState({
    usuario: "",
    senha: "",
  });
  const [erroLogin, setErroLogin] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setErroLogin(data.message || "Erro ao realizar login.");
      } else {
        localStorage.setItem("usuarioLogado", JSON.stringify(data.usuario));
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("❌ Erro no login:", err);
      setErroLogin("Erro ao conectar com o servidor.");
    }
  };

  const backgroundImage = `
    linear-gradient(to bottom, rgba(0, 22, 69, 0.48) 0%, rgba(0, 22, 69, 0) 5%),
    linear-gradient(to top, rgba(0, 22, 69, 0.48) 0%, rgba(0, 22, 69, 0) 5%),
    linear-gradient(to left, rgba(0, 22, 69, 0.48) 0%, rgba(0, 22, 69, 0) 5%),
    linear-gradient(to right, rgba(0, 22, 69, 0.48) 0%, rgba(0, 22, 69, 0) 5%),
    url(${bbmBackground})
  `.replace(/\s+/g, " ");

  return (
    <div
      className="home"
      style={{
        backgroundImage,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundBlendMode: "overlay",
        minHeight: "82vh",
        width: "100%",
      }}
    >
      <div className="home-container">
        <h1>Portal do Parceiro</h1>
        <div className="login-area">
          {erroLogin && <div className="erro-login">{erroLogin}</div>}
          <input
            type="text"
            name="usuario"
            placeholder="Usuário"
            value={formData.usuario}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="senha"
            placeholder="Senha"
            value={formData.senha}
            onChange={handleChange}
            required
          />
          <button className="login-button" onClick={handleLogin}>
            Entrar
          </button>
          <span className="cadastro-link" onClick={() => setMostrarModal(true)}>
            Faça seu cadastro
          </span>
        </div>
      </div>

      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setMostrarModal(false)}
            >
              ✖
            </button>
            <Cadastro />
          </div>
        </div>
      )}
    </div>
  );
}
