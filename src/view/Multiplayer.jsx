import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Style.css";
import gameService from "../services/GameService"; // 👈 importa tu servicio

export default function Multiplayer() {
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Intentar conectar al backend (ngrok o localhost)
    gameService.connect()
      .then(() => {
        console.log("✅ Conectado al servidor WebSocket");
      })
      .catch(() => {
        alert("❌ No se pudo conectar al servidor. Verifica que esté corriendo el backend.");
      });
  }, []); // Solo se ejecuta una vez

  const handleCreate = () => {
    navigate("/crearPartida");
  };

  return (
    <div className="home-page">
      <div className="container">
        <div className="top-buttons">
          <button className="icon-btn" onClick={() => navigate("/")}>↩</button>
        </div>
        <h1 className="title">MULTIJUGADOR</h1>
        <div className="buttons">
          <button className="btn" onClick={handleCreate}>CREAR PARTIDA</button>
          <button className="btn" onClick={() => navigate("/unirsePartida")}>UNIRSE A PARTIDA</button>
        </div>
      </div>
    </div>
  );
}
