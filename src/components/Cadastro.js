import React, { useState } from "react";
import "./Cadastro.css";

export default function Cadastro() {
  const [formData, setFormData] = useState({
    nome: "",
    usuario: "",
    centralizadoraresp: "",
    email: "",
    senha: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        "https://portalbackend-3fzy.onrender.com/api/cadastro",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        alert(`Erro: ${data.message || "Erro ao cadastrar."}`);
      } else {
        alert(data.message || "Cadastro realizado com sucesso!");
        setFormData({
          nome: "",
          usuario: "",
          centralizadoraresp: "",
          email: "",
          senha: "",
        });
      }
    } catch (err) {
      alert("Erro ao cadastrar.");
      console.error("Erro no cadastro:", err);
    }
  };

  return (
    <div className="cadastro-wrapper">
      <h1>Cadastro de Usuário</h1>
      <form onSubmit={handleSubmit} className="cadastro-form">
        <input
          type="text"
          name="nome"
          placeholder="Nome"
          value={formData.nome}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="E-mail"
          value={formData.email}
          onChange={handleChange}
          required
        />
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
        <select
          name="centralizadoraresp"
          value={formData.centralizadoraresp}
          onChange={handleChange}
          required
        >
          <option value="">Selecione uma central</option>
          <option value="CPN - SSA">CPN - SSA</option>
          <option value="CPN - JDF">CPN - JDF</option>
          <option value="CPN - BSB">CPN - BSB</option>
          <option value="CPN - UNA">CPN - UNA</option>
          <option value="CPN - PTM">CPN - PTM</option>
        </select>
        <button type="submit">Cadastrar</button>
      </form>
    </div>
  );
}
