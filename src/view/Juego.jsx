import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./styles/Style.css";

// Importar las clases de backend
import Game from "../../backend/models/Game.js";
import gameService from "../services/GameService.js";

export default function Juego() {
  const navigate = useNavigate();
  const location = useLocation();
  const [game, setGame] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState('');

  // Inicializar el juego cuando se monta el componente
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    try {
      // Verificar si es modo multijugador
      const locationState = location.state || {};
      const multiplayerMode = locationState.isMultiplayer;
      
      setIsMultiplayer(multiplayerMode);

      if (multiplayerMode) {
        // Modo multijugador - usar WebSocket
        initializeMultiplayerGame();
      } else {
        // Modo IA - usar lógica existente
        initializeAIGame();
      }

    } catch (error) {
      console.error('Error al inicializar el juego:', error);
      alert('Error al iniciar el juego. Volviendo a configuración...');
      navigate('/tablero');
    }
  };

  const initializeMultiplayerGame = () => {
    // Conectar al servicio WebSocket si no está conectado
    if (!gameService.isConnected) {
      gameService.connect().catch(error => {
        console.error('Error conectando al servidor:', error);
        alert('Error de conexión. Volviendo al menú...');
        navigate('/multiplayer');
      });
    }

    // Configurar event listeners para multijugador
    const handleGameReady = (event) => {
      setGameState(event.detail.gameState);
      setWaitingMessage('');
      setIsLoading(false);
      console.log('🎮 Juego listo para comenzar');
    };

    const handleShotResult = (event) => {
      setGameState(event.detail.gameState);
      console.log('🎯 Disparo procesado:', event.detail);
    };

    const handleGameOver = (event) => {
      setGameState(prev => ({ ...prev, status: 'finished', winner: event.detail.winner }));
      
      setTimeout(() => {
        if (event.detail.winner === gameService.playerId) {
          navigate('/ganaste');
        } else {
          navigate('/perdiste');
        }
      }, 2000);
    };

    const handlePlayerDisconnected = (event) => {
      alert(`El otro jugador se desconectó: ${event.detail.message}`);
      navigate('/multiplayer');
    };

    const handleShipsPlaced = (event) => {
      setGameState(event.detail.gameState);
      setWaitingMessage('Esperando que el otro jugador coloque sus barcos...');
    };

    const handleError = (event) => {
      alert(`Error: ${event.detail.message}`);
      navigate('/multiplayer');
    };

    // Registrar event listeners
    window.addEventListener('gameReady', handleGameReady);
    window.addEventListener('shotResult', handleShotResult);
    window.addEventListener('gameOver', handleGameOver);
    window.addEventListener('playerDisconnected', handlePlayerDisconnected);
    window.addEventListener('shipsPlaced', handleShipsPlaced);
    window.addEventListener('gameError', handleError);

    // Si tenemos un estado inicial del juego (al unirse a partida)
    if (location.state?.gameState) {
      setGameState(location.state.gameState);
      setIsLoading(false);
      
      // Si es el jugador 1 y no ha colocado barcos, cargarlos del localStorage
      if (gameService.playerId === 1 && location.state.gameState.status === 'setup') {
        placeShipsFromLocalStorage();
      } else if (location.state.gameState.status === 'setup') {
        setWaitingMessage('Esperando que el otro jugador coloque sus barcos...');
      }
    } else if (gameService.playerId === 1) {
      // Si es el creador de la partida, colocar barcos automáticamente
      placeShipsFromLocalStorage();
    }

    // Cleanup function
    return () => {
      window.removeEventListener('gameReady', handleGameReady);
      window.removeEventListener('shotResult', handleShotResult);
      window.removeEventListener('gameOver', handleGameOver);
      window.removeEventListener('playerDisconnected', handlePlayerDisconnected);
      window.removeEventListener('shipsPlaced', handleShipsPlaced);
      window.removeEventListener('gameError', handleError);
    };
  };

  const placeShipsFromLocalStorage = () => {
    try {
      const savedShips = localStorage.getItem('playerShips');
      if (!savedShips) {
        alert('No se encontraron barcos guardados. Volviendo a configuración...');
        navigate('/tablero');
        return;
      }

      const playerShips = JSON.parse(savedShips);
      gameService.placeShips(playerShips);
      setWaitingMessage('Barcos colocados. Esperando al otro jugador...');
    } catch (error) {
      console.error('Error colocando barcos:', error);
      alert('Error al colocar barcos');
    }
  };

  const initializeAIGame = () => {
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

    // Para modo IA
    if (!isMultiplayer) {
      setTimeout(() => {
        if (gameState.winner === 1) {
          navigate('/ganaste');
        } else {
          navigate('/perdiste');
        }
      }, 1000);
    }
  }, [gameState, navigate, isMultiplayer]);

  const handleAttackClick = (row, col) => {
    if (!gameState) return;
    if (gameState.status !== 'playing') return;
    if (!gameState.isYourTurn) return;

    const alreadyShot = gameState.opponentBoard.shots.some(
      shot => shot.row === row && shot.col === col
    );

    if (alreadyShot) return;

    if (isMultiplayer) {
      // Modo multijugador - usar WebSocket
      gameService.makeShot(row, col);
    } else {
      // Modo IA - usar lógica existente
      try {
        game.makeShot(1, row, col);
        const newState = game.getGameState(1);
        setGameState(newState);
      } catch (error) {
        console.error('Error al realizar disparo:', error);
      }
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

  const handleBack = () => {
    if (isMultiplayer) {
      gameService.disconnect();
    }
    navigate("/multiplayer");
  };

  if (isLoading || !gameState) {
    return (
      <div className="game-container">
        <div className="loading">
          {waitingMessage || 'Cargando juego...'}
          {isMultiplayer && <div className="loading-dots">Conectando...</div>}
        </div>
      </div>
    );
  }

  // Mostrar mensaje de espera en modo multijugador
  if (isMultiplayer && gameState.status === 'setup') {
    return (
      <div className="game-container">
        <div className="top-buttons">
          <button className="icon-btn" onClick={handleBack}>↩</button>
        </div>
        <div className="waiting-container">
          <h2>Esperando al otro jugador</h2>
          <div className="loading-dots">{waitingMessage || 'El otro jugador debe colocar sus barcos...'}</div>
          <div className="game-info">
            <p><strong>Modo:</strong> Multijugador</p>
            <p><strong>Jugador:</strong> {gameService.playerId === 1 ? '1 (Creador)' : '2'}</p>
            <p><strong>Código:</strong> {gameService.gameCode}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="top-buttons">
        <button className="icon-btn" onClick={handleBack}>↩</button>
      </div>
      
      {/* Información del juego */}
      {isMultiplayer && (
        <div className="multiplayer-info">
          <div className="game-mode-badge">MULTIJUGADOR</div>
          <div className="player-info">
            Jugador {gameService.playerId} - {gameService.playerName}
            {gameState.players && ` vs ${gameState.players.player1 === gameService.playerName ? gameState.players.player2 : gameState.players.player1}`}
          </div>
        </div>
      )}
      
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
              <h2 className="board-title">
                Tablero Enemigo - Tu Turno 🎯
                {isMultiplayer && ` (Jugador ${gameService.playerId})`}
              </h2>
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
                            onClick={() => isClickable ? handleAttackClick(row, col) : null}
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
              <h2 className="board-title">
                Tu Tablero - Turno del Rival ⏳
                {isMultiplayer && ` (Jugador ${gameService.playerId === 1 ? 2 : 1})`}
              </h2>
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
        {isMultiplayer && (
          <div className="stat-box">
            <strong>Modo:</strong> Multijugador
          </div>
        )}
      </div>

      {/* Estado del juego */}
      {gameState.status === 'finished' && (
        <div className="game-over-message">
          <h2>¡Juego Terminado!</h2>
          <p>El ganador es: {gameState.winner === 1 ? gameState.players?.player1 : gameState.players?.player2}</p>
        </div>
      )}
    </div>
  );
}