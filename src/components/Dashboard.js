import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "./Dashboard.css";

const mockData = {
  totalAberto: 28,
  totalFalta: 10,
  totalAvaria: 6,
  porFilial: [
    { filial: "Matriz", bos: 15 },
    { filial: "Filial A", bos: 8 },
    { filial: "Filial B", bos: 9 },
    { filial: "Filial C", bos: 5 },
  ],
  porParceiro: [
    { parceiro: "Transp. Silva", bos: 12 },
    { parceiro: "Carga+Log", bos: 6 },
    { parceiro: "Expresso Sul", bos: 4 },
    { parceiro: "Via Rápida", bos: 2 },
  ],
  porTipo: [
    { tipo: "Em Aberto", quantidade: 28 },
    { tipo: "Falta", quantidade: 10 },
    { tipo: "Avaria", quantidade: 6 },
  ],
};

const COLORS = ["#3f51b5", "#ef5350", "#ffa726", "#66bb6a"];

export default function Dashboard() {
  const data = mockData;

  const topFilial = data.porFilial.reduce(
    (max, curr) => (curr.bos > max.bos ? curr : max),
    data.porFilial[0]
  );
  const topParceiro = data.porParceiro.reduce(
    (max, curr) => (curr.bos > max.bos ? curr : max),
    data.porParceiro[0]
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard de B.Os</h1>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card aberto">
          <span className="card-title">B.Os em Aberto</span>
          <span className="card-value">{data.totalAberto}</span>
        </div>
        <div className="dashboard-card falta">
          <span className="card-title">B.Os de Falta</span>
          <span className="card-value">{data.totalFalta}</span>
        </div>
        <div className="dashboard-card avaria">
          <span className="card-title">B.Os de Avaria</span>
          <span className="card-value">{data.totalAvaria}</span>
        </div>
      </div>

      <div className="dashboard-highlights">
        <div className="highlight">
          <h3>Filial com mais B.Os</h3>
          <p>
            {topFilial.filial} <span>({topFilial.bos})</span>
          </p>
        </div>
        <div className="highlight">
          <h3>Parceiro com mais B.Os</h3>
          <p>
            {topParceiro.parceiro} <span>({topParceiro.bos})</span>
          </p>
        </div>
      </div>

      <div className="dashboard-graphs">
        <div className="dashboard-graph">
          <h3>B.Os por Filial</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.porFilial}>
              <XAxis dataKey="filial" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bos" fill="#3f51b5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dashboard-graph">
          <h3>B.Os por Parceiro</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.porParceiro}>
              <XAxis dataKey="parceiro" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bos" fill="#66bb6a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dashboard-graph">
          <h3>Distribuição por Tipo</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.porTipo}
                dataKey="quantidade"
                nameKey="tipo"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {data.porTipo.map((entry, index) => (
                  <Cell key={entry.tipo} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
