import React, { useEffect } from "react";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import brasilEstados from "../data/brasil-estados.json";
import "./MapaBrasil.css";
import logo from "../assets/background.png";

// Mapeia cada estado para as centralizadoras correspondentes
const estadoCentralizadoras = {
  "Rio Grande do Sul": ["CXS", "POA", "SMA"],
  "Santa Catarina": ["BLU", "JVL", "FLN"],
  "Minas Gerais": ["PPY", "BHZ"],
  Paraná: ["CWB", "LDA", "CAS"],
  "São Paulo": ["SOR", "RIP", "SUM", "SÃO", "GRU", "BAU", "CPN"],
  "Espírito Santo": ["VIX"],
  Ceará: ["CRA"],
  // Adicione outros estados se necessário
};
{
  /* Marca d'água atrás do mapa */
}

// REGIÕES QUE VÃO TER COR DIFERENCIADA
const regioesColoridas = {
  "Rio Grande do Sul": "#a1a1a1ff", // vermelho
  "São Paulo": "#a1a1a1ff", // amarelo
  Paraná: "#a1a1a1ff", // azul
  "Santa Catarina": "#a1a1a1ff", // vermelho
  "Minas Gerais": "#a1a1a1ff", // amarelo
  "Espírito Santo": "#a1a1a1ff", // azul
  Ceará: "#a1a1a1ff", // vermelho
  // Adicione outros estados e cores conforme necessário
};

export default function MapaBrasil({ onEstadoSelecionado }) {
  const estiloPadrao = {
    fillColor: "#575757ff",
    weight: 1,
    color: "#ffffff",
    fillOpacity: 0.8,
  };

  const estiloHover = {
    fillColor: "#ffe200",
    weight: 5,
    color: "#ffe200",
    fillOpacity: 1.9,
  };

  const onEachFeature = (feature, layer) => {
    const estado = feature.properties.name;
    // Se a região estiver na lista de coloridas, use a cor dela
    const corEstado = regioesColoridas[estado]
      ? regioesColoridas[estado]
      : estiloPadrao.fillColor;

    layer.setStyle({ ...estiloPadrao, fillColor: corEstado });

    layer.on({
      mouseover: () => layer.setStyle({ ...estiloHover, fillColor: corEstado }),
      mouseout: () => layer.setStyle({ ...estiloPadrao, fillColor: corEstado }),
      click: () => {
        // Permite selecionar mesmo se não houver centralizadora cadastrada!
        if (onEstadoSelecionado) {
          onEstadoSelecionado(estado);
        }
      },
    });
  };

  const AjustarMapaAoBrasil = () => {
    const map = useMap();
    useEffect(() => {
      const bounds = L.geoJSON(brasilEstados).getBounds();
      map.fitBounds(bounds);
      map.dragging.disable();
    }, [map]);
    return null;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        position: "relative",
        width: "100%",
        height: "100vh",
      }}
      className="mapa-bg-container"
    >
      {/* Marca d'água atrás do mapa */}
      <img
        src={logo}
        alt="Marca d'água"
        style={{
          position: "absolute",
          top: "50%",
          left: "125%",
          transform: "translate(-50%, -50%)",
          opacity: 0.09,
          maxHeight: "100vh",
          maxWidth: "500vw",
          zIndex: 0,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      {/* Mapa em cima da marca d'água */}
      <div
        className="mapa-container"
        style={{
          width: "100%",
          height: "100vh",
          position: "relative",
          zIndex: 1,
        }}
      >
        <MapContainer
          center={[-15.78, -47.93]}
          zoom={4}
          style={{ width: "100%", height: "100vh" }}
          scrollWheelZoom={false}
          zoomControl={false}
          doubleClickZoom={false}
          dragging={false}
        >
          <GeoJSON data={brasilEstados} onEachFeature={onEachFeature} />
          <AjustarMapaAoBrasil />
        </MapContainer>
      </div>
    </div>
  );
}
