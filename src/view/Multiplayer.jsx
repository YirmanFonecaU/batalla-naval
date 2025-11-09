import React from "react";
import { useNavigate } from "react-router-dom"; 
import "./styles/Style.css";
import CrearPartida from "./CrearPartida";
import UnirsePartida from "./UnirsePartida";

export default function Multiplayer() {
    const navigate = useNavigate();
    navigate("/multiplayer");
    const handleCreate = () => {
        navigate("/crearPartida");
    }
  
  return (
    <div className="home-page">
      <div className="container">
        <div className="top-buttons">
        <button className="icon-btn" onClick={() => navigate("/")}>↩</button>
        </div>
        <h1 className="title">MULTIJUGADOR</h1>
        <div className="buttons">
            <button className="btn" onClick={handleCreate}>CREAR PARTIDA </button>
            <button className="btn"onClick={() => navigate("/unirsePartida")}>UNIRSE A PARTIDA</button>
        </div>

      </div>
    </div>
  );
};


