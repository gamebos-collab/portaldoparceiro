import React, { useEffect } from "react";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import brasilEstados from "../data/brasil-estados.json";
import "./MapaBrasil.css";

export default function MapaBrasil({ onEstadoSelecionado }) {
  const estiloPadrao = {
    fillColor: "#acacacff",
    weight: 1,
    color: "#ffffff",
    fillOpacity: 0.8,
  };

  const estiloHover = {
    fillColor: "#3498db",
    weight: 2,
    color: "#ffffff",
    fillOpacity: 0.9,
  };

  const onEachFeature = (feature, layer) => {
    const estado = feature.properties.name;

    layer.setStyle(estiloPadrao);

    layer.on({
      mouseover: () => layer.setStyle(estiloHover),
      mouseout: () => layer.setStyle(estiloPadrao),
      click: () => {
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
      map.dragging.disable(); // 🔒 Desativa o arraste do mapa
    }, [map]);
    return null;
  };

  return (
    <div className="mapa-container">
      <MapContainer
        center={[-15.78, -47.93]}
        zoom={4}
        style={{ width: "100%", height: "100vh" }}
        scrollWheelZoom={false}
        zoomControl={false}
        doubleClickZoom={false}
        dragging={false} // 🔒 Garante que o mapa não seja arrastável
      >
        <GeoJSON data={brasilEstados} onEachFeature={onEachFeature} />
        <AjustarMapaAoBrasil />
      </MapContainer>
    </div>
  );
}
