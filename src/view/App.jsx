import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import Tablero from "./Tablero";
import Juego from "./Juego";
import Ganaste from "./Ganaste";
import Perdiste from "./Perdiste";
import Multiplayer  from "./Multiplayer";
import CrearPartida from "./CrearPartida";
import UnirsePartida from "./UnirsePartida";
import './styles/App.css';

// Componente principal de la pantalla de inicio
const Home = () => {
  const navigate = useNavigate();

  const handlePlayMachine = () => {
    navigate("/tablero");
  };

  const handlePlayFriend = () => {
    navigate("/multiplayer"); 
  };

  return (
    <div className="home-page">
      <div className="container">
        <h1 className="title">BATALLA<br/>NAVAL</h1>
        <div className="buttons">
          <button onClick={handlePlayMachine} className="btn">
            PLAY WITH MACHINE
          </button>
          <button onClick={handlePlayFriend} className="btn">
            PLAY WITH A FRIEND
          </button>
        </div>
      </div>
    </div>
  );
};

// Enrutador principal
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tablero" element={<Tablero />} />
      <Route path="/multiplayer" element={<Multiplayer />} />
      <Route path="/juego" element={<Juego />} />
      <Route path="/ganaste" element={<Ganaste />} />
      <Route path="/crearPartida" element={<CrearPartida />} />
      <Route path="/unirsePartida" element={<UnirsePartida />} />
      <Route path="/perdiste" element={<Perdiste />} />
    </Routes>
  );
};

export default App;