import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import TopBar from "./components/TopBar";
import Header from "./components/Header";
import Home from "./components/Home";
import Footer from "./components/Footer";
import Noticias from "./pages/Noticias";
import Politicadeparceiros from "./pages/Politicadeparceiros";
import Documentos from "./pages/Documentos";
import Faq from "./pages/Faq";
import Quemsomos from "./pages/Quemsomos";
import Sobreoportal from "./pages/Sobreoportal";
import Contatos from "./pages/Contatos";
import Login from "./components/Login";
import Cadastro from "./components/Cadastro";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const usuarioLogado = localStorage.getItem("usuarioLogado");

  return (
    <Router>
      <TopBar />
      <Header />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route
            path="/dashboard"
            element={
              usuarioLogado ? <Dashboard /> : <Navigate to="/" replace />
            }
          />
          <Route path="/comunicacao/noticias" element={<Noticias />} />
          <Route path="/comunicacao/contatos" element={<Contatos />} />
          <Route
            path="/informacoes/politica"
            element={<Politicadeparceiros />}
          />
          <Route path="/informacoes/Documentos" element={<Documentos />} />
          <Route path="/informacoes/Faq" element={<Faq />} />
          <Route path="/institucional/sobre" element={<Sobreoportal />} />
          <Route path="/institucional/Quemsomos" element={<Quemsomos />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
