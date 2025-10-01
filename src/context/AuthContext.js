import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  useEffect(() => {
    const usuario = localStorage.getItem("usuarioLogado");
    if (usuario) {
      setUsuarioLogado(JSON.parse(usuario));
    }
  }, []);

  const login = (usuario) => {
    localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
    setUsuarioLogado(usuario);
  };

  const logout = () => {
    localStorage.removeItem("usuarioLogado");
    setUsuarioLogado(null);
  };

  return (
    <AuthContext.Provider value={{ usuarioLogado, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
