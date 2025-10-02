import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import bbmBackground from "../assets/bbm.png";
import Cadastro from "./Cadastro";
import "./Home.css";

export default function Home() {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [formData, setFormData] = useState({ usuario: "", senha: "" });
  const [erroLogin, setErroLogin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setErroLogin("");

    if (!formData.usuario || !formData.senha) {
      setErroLogin("Preencha todos os campos.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(
        "https://portalbackend-i9xy.onrender.com/api/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (res.ok && data.usuario) {
        login(data.usuario);
        navigate("/dashboard");
      } else {
        setErroLogin(data.message || "Usuário ou senha inválidos.");
      }
    } catch (err) {
      console.error("❌ Erro no login:", err);
      setErroLogin("Erro ao conectar com o servidor.");
    } finally {
      setIsLoading(false);
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
            onKeyDown={handleKeyPress}
            required
          />
          <input
            type="password"
            name="senha"
            placeholder="Senha"
            value={formData.senha}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
            required
          />
          <button
            className="login-button"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? <div className="spinner"></div> : "Entrar"}
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
