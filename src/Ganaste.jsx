import React from "react";
import { useNavigate } from "react-router-dom";
import "./End.css"; 

const Ganaste = () => {
  const navigate = useNavigate();

  return (
    <div
      className="end-screen"
      style={{ backgroundImage: "url('/Captura%20de%20pantalla%202025-10-06%20214315.png')" }}
    >
      <h1 className="end-title victory">¡GANASTE!</h1>
      <img src="/trofeo.png" alt="Trofeo de victoria" className="end-image" />
      <button className="end-button" onClick={() => navigate("/")}>
        ▸ Nueva Partida
      </button>
    </div>
  );
};

export default Ganaste;
