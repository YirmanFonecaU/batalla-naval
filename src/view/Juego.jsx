import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Style.css";

// Importar las clases de backend
import Game from "../../backend/models/Game.js";

export default function Juego() {
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar el juego cuando se monta el componente
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    try {
      const savedShips = localStorage.getItem('playerShips');
      
      if (!savedShips) {
        console.error('No se encontraron barcos guardados');
        navigate('/tablero');
        return;
      }

      const playerShips = JSON.parse(savedShips);
      const newGame = new Game('game-' + Date.now(), 'Jugador', null, true);

      const shipsData = playerShips.map(ship => ({
        id: ship.id,
        row: ship.row,
        col: ship.col,
        orientation: ship.orientation
      }));

      newGame.setPlayerShips(1, shipsData);

      newGame.onAIShotComplete = (aiResult, newGameState) => {
        setGameState(newGameState);
      };

      setGame(newGame);
      setGameState(newGame.getGameState(1));
      setIsLoading(false);

    } catch (error) {
      console.error('Error al inicializar el juego:', error);
      alert('Error al iniciar el juego. Volviendo a configuración...');
      navigate('/tablero');
    }
  };

  useEffect(() => {
    
    if (!gameState || gameState.status !== 'finished') return;

    setTimeout(() => {
      if (gameState.winner === 1) {
        navigate('/ganaste');
      } else {
        navigate('/perdiste');
      }
    }, 1000);
  }, [gameState, navigate]);

  const handleAttackClick = (row, col) => {
    if (!game || !gameState) return;
    if (gameState.status !== 'playing') return;
    if (!gameState.isYourTurn) return;

    const alreadyShot = gameState.opponentBoard.shots.some(
      shot => shot.row === row && shot.col === col
    );

    if (alreadyShot) return;

    try {
      game.makeShot(1, row, col);
      const newState = game.getGameState(1);
      setGameState(newState);
    } catch (error) {
      console.error('Error al realizar disparo:', error);
    }
  };

  const getEnemyCellState = (row, col) => {
    if (!gameState) return 'empty';

    const shot = gameState.opponentBoard.shots.find(
      s => s.row === row && s.col === col
    );

    if (shot) {
      return shot.isHit ? 'hit' : 'miss';
    }

    return 'empty';
  };

  const isEnemySunkShipCell = (row, col) => {
    if (!gameState || !gameState.opponentBoard.sunkShips) return false;

    return gameState.opponentBoard.sunkShips.some(ship => {
      for (let i = 0; i < ship.size; i++) {
        const shipRow = ship.orientation === 'horizontal' ? ship.row : ship.row + i;
        const shipCol = ship.orientation === 'horizontal' ? ship.col + i : ship.col;
        
        if (shipRow === row && shipCol === col) return true;
      }
      return false;
    });
  };

  const getOurCellState = (row, col) => {
    if (!gameState) return 'empty';

    const shot = gameState.yourBoard.shots.find(
      s => s.row === row && s.col === col
    );

    if (shot) {
      return shot.isHit ? 'hit' : 'miss';
    }

    const hasShip = gameState.yourBoard.ships.some(ship => {
      if (!ship.placed) return false;
      
      for (let i = 0; i < ship.size; i++) {
        const shipRow = ship.orientation === 'horizontal' ? ship.row : ship.row + i;
        const shipCol = ship.orientation === 'horizontal' ? ship.col + i : ship.col;
        
        if (shipRow === row && shipCol === col) return true;
      }
      return false;
    });

    return hasShip ? 'ship' : 'empty';
  };

  const getShipSegments = (ship, isPlayer = true) => {
    const shots = isPlayer ? gameState.yourBoard.shots : gameState.opponentBoard.shots;
    const segments = [];

    for (let i = 0; i < ship.size; i++) {
      const segRow = ship.orientation === 'horizontal' ? ship.row : ship.row + i;
      const segCol = ship.orientation === 'horizontal' ? ship.col + i : ship.col;

      const isHit = shots.some(
        shot => shot.row === segRow && shot.col === segCol && shot.isHit
      );

      segments.push({ isHit });
    }

    return segments;
  };

  if (isLoading || !gameState) {
    return (
      <div className="game-container">
        <div className="loading">Cargando juego...</div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="top-buttons">
        <button className="icon-btn" onClick={() => navigate("/tablero")}>↩</button>
      </div>
      
      <div className="game-layout-with-ships">
        {/* Sección de barcos (izquierda) */}
        <div className="ships-container-left">
          {/* Nuestros barcos */}
          <div className="ships-status-section">
            <div className="ships-header-btn">NUESTROS BARCOS</div>
            <div className="ships-status-grid">
              {gameState.yourBoard.ships.map(ship => {
                const segments = getShipSegments(ship, true);
                const allHit = segments.every(seg => seg.isHit);
                
                return (
                  <div key={ship.id} className={`ship-status ${allHit ? 'sunk' : 'alive'}`}>
                    {segments.map((seg, i) => (
                      <div 
                        key={i} 
                        className={`ship-segment-status ${seg.isHit ? 'hit' : 'intact'}`}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Barcos rivales */}
          <div className="ships-status-section">
            <div className="ships-header-btn">BARCOS RIVALES</div>
            <div className="ships-status-grid">
              {gameState.opponentBoard.sunkShips && gameState.opponentBoard.sunkShips.length > 0 ? (
                gameState.opponentBoard.sunkShips.map(ship => {
                  const segments = getShipSegments(ship, false);
                  
                  return (
                    <div key={ship.id} className="ship-status sunk">
                      {segments.map((seg, i) => (
                        <div 
                          key={i} 
                          className="ship-segment-status hit"
                        />
                      ))}
                    </div>
                  );
                })
              ) : (
                [5, 4, 3, 2, 2].map((size, idx) => (
                  <div key={idx} className="ship-status alive">
                    {Array.from({ length: size }, (_, i) => (
                      <div key={i} className="ship-segment-status intact" />
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Tablero central - AHORA ALTERNA SEGÚN EL TURNO */}
        <div className="boards-wrapper">
          {gameState.isYourTurn ? (
            /* TU TURNO: Mostrar tablero enemigo para disparar */
            <div className="board-section">
              <h2 className="board-title">Tablero Enemigo - Tu Turno 🎯</h2>
              <table className="game-board">
                <thead>
                  <tr>
                    <th></th>
                    {Array.from({ length: 10 }, (_, i) => (
                      <th key={i}>{String.fromCharCode(65 + i)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }, (_, row) => (
                    <tr key={row}>
                      <th>{row + 1}</th>
                      {Array.from({ length: 10 }, (_, col) => {
                        const cellState = getEnemyCellState(row, col);
                        const isSunk = isEnemySunkShipCell(row, col);
                        const isClickable = cellState === 'empty';
                        
                        return (
                          <td
                            key={col}
                            className={`game-cell ${cellState} ${isSunk ? 'sunk-ship' : ''} ${isClickable ? 'clickable' : ''}`}
                            onClick={() => handleAttackClick(row, col)}
                          >
                            {cellState === 'hit' && '💥'}
                            {cellState === 'miss' && '💧'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* TURNO RIVAL: Mostrar tu tablero siendo atacado */
            <div className="board-section">
              <h2 className="board-title">Tu Tablero - Turno del Rival ⏳</h2>
              <table className="game-board">
                <thead>
                  <tr>
                    <th></th>
                    {Array.from({ length: 10 }, (_, i) => (
                      <th key={i}>{String.fromCharCode(65 + i)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }, (_, row) => (
                    <tr key={row}>
                      <th>{row + 1}</th>
                      {Array.from({ length: 10 }, (_, col) => {
                        const cellState = getOurCellState(row, col);
                        
                        return (
                          <td
                            key={col}
                            className={`game-cell ${cellState}`}
                          >
                            {cellState === 'hit' && '💥'}
                            {cellState === 'miss' && '💧'}
                            {cellState === 'ship' && '🚢'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Estadísticas */}
      <div className="stats-section">
        <div className="stat-box">
          <strong>Tus disparos:</strong> {gameState.yourStats.totalShots}
        </div>
        <div className="stat-box">
          <strong>Precisión:</strong> {gameState.yourStats.accuracy}%
        </div>
        <div className="stat-box">
          <strong>Impactos:</strong> {gameState.yourStats.hits}
        </div>
      </div>
    </div>
  );
 
}