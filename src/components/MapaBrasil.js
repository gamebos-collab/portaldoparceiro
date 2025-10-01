import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import "./MapaBrasil.css";

const geoUrl =
  "https://raw.githubusercontent.com/codeforgermany/click_that_hood/master/public/data/brazil-states.geojson";

export default function MapaBrasil({ onEstadoSelecionado }) {
  return (
    <div className="mapa-container">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1000,
          center: [-52, -15],
        }}
        width={980}
        height={600}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const estado = geo.properties.name;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => onEstadoSelecionado?.(estado)}
                  style={{
                    default: {
                      fill: "#2c3e50",
                      stroke: "#ffffff",
                      strokeWidth: 0.8,
                      outline: "none",
                      transition: "transform 0.3s ease",
                      transformOrigin: "center center",
                    },
                    hover: {
                      fill: "#3498db",
                      stroke: "#ffffff",
                      strokeWidth: 1.2,
                      transform: "scale(1.08)",
                      transformOrigin: "center center",
                      transition: "transform 1s ease",
                      outline: "none",
                    },
                    pressed: {
                      fill: "#2980b9",
                      stroke: "#ffffff",
                      strokeWidth: 1.2,
                      outline: "none",
                    },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
