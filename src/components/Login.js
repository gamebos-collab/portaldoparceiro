import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [formData, setFormData] = useState({ usuario: "", senha: "" });
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
        alert(`Erro: ${data.message}`);
      } else {
        localStorage.setItem("usuarioLogado", JSON.stringify(data.usuario));
        navigate("/dashboard"); // ✅ redireciona corretamente
      }
    } catch (err) {
      alert("Erro ao realizar login.");
    }
  };

  return (
    <div className="login-area">
      <h2>Login</h2>
      <input
        type="text"
        name="usuario"
        placeholder="Usuário"
        value={formData.usuario}
        onChange={handleChange}
      />
      <input
        type="password"
        name="senha"
        placeholder="Senha"
        value={formData.senha}
        onChange={handleChange}
      />
      <button onClick={handleLogin}>Entrar</button>
    </div>
  );
}
