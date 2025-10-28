import React, { useEffect, useMemo, useState } from "react";

/**
 * Página: /detalhes-responsavel
 * Usa localStorage.dadosResponsavel para popular os dados (array de objetos).
 * Permite selecionar colunas a mostrar; seleção é salva em localStorage.detalhesResponsavelCols.
 */

export default function DetalhesResponsavel() {
  const [data, setData] = useState([]);
  const [responsabilidade, setResponsabilidade] = useState("");
  const [selectedCols, setSelectedCols] = useState([]);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dadosResponsavel");
      if (raw) {
        const parsed = JSON.parse(raw);
        setData(Array.isArray(parsed) ? parsed : []);
      } else {
        const params = new URLSearchParams(window.location.search);
        const resp =
          params.get("responsabilidade") || params.get("responsavel");
        setResponsabilidade(resp || "");
        setData([]);
      }

      const colRaw = localStorage.getItem("detalhesResponsavelCols");
      if (colRaw) {
        try {
          setSelectedCols(JSON.parse(colRaw));
        } catch {
          setSelectedCols([]);
        }
      }
    } catch (e) {
      console.error("Erro ler dadosResponsavel:", e);
      setData([]);
    }
  }, []);

  const allColumns = useMemo(() => {
    const keys = new Set();
    data.forEach((row) => {
      if (row && typeof row === "object") {
        Object.keys(row).forEach((k) => keys.add(k));
      }
    });
    return Array.from(keys).sort();
  }, [data]);

  useEffect(() => {
    if (selectedCols && selectedCols.length > 0) return;
    if (allColumns.length === 0) return;
    const preferred = [
      "BO",
      "Numero do BO",
      "Cliente",
      "Ocorrência",
      "Parecer",
      "Resp",
      "Dt Parecer",
    ];
    const defaultCols = allColumns.filter((c) => preferred.includes(c));
    setSelectedCols(defaultCols.length ? defaultCols : allColumns.slice(0, 6));
  }, [allColumns, selectedCols]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "detalhesResponsavelCols",
        JSON.stringify(selectedCols)
      );
    } catch {}
  }, [selectedCols]);

  const toggleCol = (col) => {
    setSelectedCols((prev) => {
      if (prev.includes(col)) return prev.filter((c) => c !== col);
      return [...prev, col];
    });
  };

  const selectAll = () => setSelectedCols(allColumns.slice());
  const clearAll = () => setSelectedCols([]);

  const filteredData = useMemo(() => {
    if (!filterText) return data;
    const t = filterText.toLowerCase();
    return data.filter((row) =>
      Object.values(row || {}).some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(t)
      )
    );
  }, [data, filterText]);

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginBottom: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>
            B.Os do Parceiro {responsabilidade || ""}
          </h2>
          <div style={{ color: "#666", marginTop: 4 }}>
            {data.length} registro(s) carregado(s) do localStorage.
          </div>
        </div>

        <div style={{ marginLeft: "auto" }}>
          <input
            placeholder="Pesquisar (todas colunas)"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid #ccc",
              minWidth: 220,
              background: "#fff",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <aside
          style={{
            width: 300,
            background: "#0f1724",
            color: "#fff",
            padding: 12,
            borderRadius: 8,
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <strong>Colunas</strong>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={selectAll} style={buttonStyle}>
                Tudo
              </button>
              <button onClick={clearAll} style={buttonStyle}>
                Limpar
              </button>
            </div>
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto", marginTop: 8 }}>
            {allColumns.length === 0 ? (
              <div style={{ color: "#d1d5db" }}>Sem colunas disponíveis</div>
            ) : (
              allColumns.map((col) => {
                const checked = selectedCols.includes(col);
                return (
                  <label
                    key={col}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCol(col)}
                    />
                    <span style={{ color: "#fff" }}>{col}</span>
                  </label>
                );
              })
            )}
          </div>

          <div style={{ marginTop: 12, color: "#cbd5e1", fontSize: 13 }}>
            A seleção é salva localmente para sua próxima visita.
          </div>
        </aside>

        <main style={{ flex: 1 }}>
          {filteredData.length === 0 ? (
            <div style={{ padding: 20, background: "#fff", borderRadius: 8 }}>
              Nenhum dado disponível. Verifique se a tela que abriu esta página
              executou localStorage.setItem('dadosResponsavel',
              JSON.stringify(...))
            </div>
          ) : selectedCols.length === 0 ? (
            <div style={{ padding: 20, background: "#fff", borderRadius: 8 }}>
              Nenhuma coluna selecionada. Marque ao menos uma coluna para
              visualizar os dados.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "#fff",
                }}
              >
                <thead>
                  <tr style={{ background: "#18304b", color: "#ffe200" }}>
                    {selectedCols.map((col) => (
                      <th
                        key={col}
                        style={{ padding: "8px 10px", textAlign: "left" }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, i) => (
                    <tr
                      key={i}
                      style={{
                        background: i % 2 === 0 ? "#f7faff" : "#eef3fb",
                        color: "#072d4d",
                      }}
                    >
                      {selectedCols.map((col) => (
                        <td
                          key={col}
                          style={{ padding: "8px 10px", verticalAlign: "top" }}
                        >
                          {String(row[col] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "6px 8px",
  borderRadius: 6,
  border: "none",
  background: "#ffe200",
  color: "#072d4d",
  cursor: "pointer",
  fontWeight: 700,
};
