import React from "react";
import { useNavigate } from "react-router-dom";
import "./End.css"; 

const Ganaste = () => {
  const navigate = useNavigate();

  return (
    <div className="end-screen">
      <h1 className="end-title victory">¡GANASTE!</h1>
      <button className="end-button" onClick={() => navigate("/")}>
        ▸ Nueva Partida
      </button>
    </div>
  );
};

export default Ganaste;
