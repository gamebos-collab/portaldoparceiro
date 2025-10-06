import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import TopBar from "./components/TopBar";
import Header from "./components/Header";
import Controle from "./components/Controle";
import Footer from "./components/Footer";
import Noticias from "./pages/Noticias";
import Politicadeparceiros from "./pages/Politicadeparceiros";
import Documentos from "./pages/Documentos";
import Faq from "./pages/Faq";
import Quemsomos from "./pages/Quemsomos";
import Sobreoportal from "./pages/Sobreoportal";
import Contatos from "./pages/Contatos";
import Monitoramento from "./pages/Monitoramento";
import "./App.css";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Monitoramento />} />
      <Route path="/monitoramento" element={<Monitoramento />} />
      <Route path="/controle" element={<Controle />} />
      <Route path="/comunicacao/noticias" element={<Noticias />} />
      <Route path="/comunicacao/contatos" element={<Contatos />} />
      <Route path="/informacoes/politica" element={<Politicadeparceiros />} />
      <Route path="/informacoes/documentos" element={<Documentos />} />
      <Route path="/informacoes/faq" element={<Faq />} />
      <Route path="/institucional/sobre" element={<Sobreoportal />} />
      <Route path="/institucional/quemsomos" element={<Quemsomos />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <TopBar />
        <Header />
        <div className="main-content">
          <AppRoutes />
        </div>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
