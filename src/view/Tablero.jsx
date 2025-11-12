import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import gameService from '../services/GameService';

export default function Tablero() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showRules, setShowRules] = useState(false);

  // ✅ OBTENER DATOS DE NAVEGACIÓN con valores por defecto
  const { 
    gameId = null, 
    gameCode = null, 
    playerId = null, 
    playerName = 'Jugador', 
    gameState = null, 
    opponent = null,
    isMultiplayer = false,
    isSetupPhase = false 
  } = location.state || {};

  console.log('📦 Tablero recibió:', {
    gameId,
    gameCode,
    playerId,
    playerName,
    isMultiplayer,
    hasGameState: !!gameState
  });

  // Estado para los barcos
  const [ships, setShips] = useState([
    { id: 1, size: 5, row: null, col: null, orientation: 'horizontal', placed: false },
    { id: 2, size: 4, row: null, col: null, orientation: 'horizontal', placed: false },
    { id: 3, size: 3, row: null, col: null, orientation: 'horizontal', placed: false },
    { id: 4, size: 2, row: null, col: null, orientation: 'horizontal', placed: false },
    { id: 5, size: 2, row: null, col: null, orientation: 'horizontal', placed: false },
  ]);

  const [draggedShip, setDraggedShip] = useState(null);
  const [dragPreview, setDragPreview] = useState({ row: null, col: null, valid: false });
  const [selectedShip, setSelectedShip] = useState(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);

  // ✅ ESCUCHAR EVENTOS DE JUEGO
  useEffect(() => {
    if (!isMultiplayer) return;

    const handleGameReady = (event) => {
      console.log('🎮 EVENTO game-ready recibido:', event.detail);
      
      const { gameState: newGameState, currentTurn } = event.detail;
      
      navigate('/juego', {
        state: {
          gameId: gameId,
          gameCode: gameCode,
          playerId: playerId,
          playerName: playerName,
          gameState: newGameState,
          opponent: opponent,
          isMultiplayer: true,
          currentTurn: currentTurn
        }
      });
    };

    const handleShipsPlaced = (event) => {
      console.log('🚢 EVENTO ships-placed recibido:', event.detail);
      setWaitingForOpponent(true);
    };

    window.addEventListener('gameReady', handleGameReady);
    window.addEventListener('shipsPlaced', handleShipsPlaced);

    return () => {
      window.removeEventListener('gameReady', handleGameReady);
      window.removeEventListener('shipsPlaced', handleShipsPlaced);
    };
  }, [isMultiplayer, gameId, gameCode, playerId, playerName, opponent, navigate]);

  const toggleRules = () => setShowRules(!showRules);

  // Verificar si una posición está ocupada
  const isPositionOccupied = (row, col, excludeShipId = null) => {
    return ships.some(ship => {
      if (!ship.placed || ship.id === excludeShipId) return false;

      for (let i = 0; i < ship.size; i++) {
        const shipRow = ship.orientation === 'horizontal' ? ship.row : ship.row + i;
        const shipCol = ship.orientation === 'horizontal' ? ship.col + i : ship.col;

        if (shipRow === row && shipCol === col) return true;
      }
      return false;
    });
  };

  // Verificar separación mínima
  const hasMinimumSeparation = (row, col, size, orientation, excludeShipId = null) => {
    for (let i = 0; i < size; i++) {
      const shipRow = orientation === 'horizontal' ? row : row + i;
      const shipCol = orientation === 'horizontal' ? col + i : col;

      for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
        for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
          const checkRow = shipRow + deltaRow;
          const checkCol = shipCol + deltaCol;

          if (checkRow >= 0 && checkRow < 10 && checkCol >= 0 && checkCol < 10) {
            if (isPositionOccupied(checkRow, checkCol, excludeShipId)) {
              return false;
            }
          }
        }
      }
    }
    return true;
  };

  // Verificar si se puede colocar un barco
  const canPlaceShip = (row, col, size, orientation, excludeShipId = null) => {
    if (orientation === 'horizontal') {
      if (col + size > 10) return false;
    } else {
      if (row + size > 10) return false;
    }

    for (let i = 0; i < size; i++) {
      const shipRow = orientation === 'horizontal' ? row : row + i;
      const shipCol = orientation === 'horizontal' ? col + i : col;

      if (isPositionOccupied(shipRow, shipCol, excludeShipId)) {
        return false;
      }
    }

    return hasMinimumSeparation(row, col, size, orientation, excludeShipId);
  };

  const handleDragStart = (e, ship) => {
    setDraggedShip(ship);
    setSelectedShip(null);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, row, col) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedShip) {
      const valid = canPlaceShip(row, col, draggedShip.size, draggedShip.orientation, draggedShip.id);
      setDragPreview({ row, col, valid });
    }
  };

  const handleDragLeave = () => {
    setDragPreview({ row: null, col: null, valid: false });
  };

  const handleDrop = (e, row, col) => {
    e.preventDefault();

    if (draggedShip && canPlaceShip(row, col, draggedShip.size, draggedShip.orientation, draggedShip.id)) {
      setShips(prevShips =>
        prevShips.map(ship =>
          ship.id === draggedShip.id
            ? { ...ship, row, col, placed: true }
            : ship
        )
      );
    }

    setDraggedShip(null);
    setDragPreview({ row: null, col: null, valid: false });
  };

  const getShipAtPosition = (row, col) => {
    return ships.find(ship => {
      if (!ship.placed) return false;
      for (let i = 0; i < ship.size; i++) {
        const shipRow = ship.orientation === 'horizontal' ? ship.row : ship.row + i;
        const shipCol = ship.orientation === 'horizontal' ? ship.col + i : ship.col;
        if (shipRow === row && shipCol === col) return true;
      }
      return false;
    });
  };

  const handleBoardDragStart = (e, ship) => {
    e.stopPropagation();
    setDraggedShip(ship);
    setSelectedShip(null);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.4';
  };

  const handleBoardDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  const handleCellClick = (e, row, col) => {
    if (draggedShip) return;
    
    const ship = getShipAtPosition(row, col);
    
    if (ship) {
      if (selectedShip && selectedShip.id === ship.id) {
        rotateShipInPlace(ship);
        setSelectedShip(null);
      } else {
        setSelectedShip(ship);
      }
    } else {
      setSelectedShip(null);
    }
  };

  const rotateShipInPlace = (ship) => {
    const newOrientation = ship.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    
    if (canPlaceShip(ship.row, ship.col, ship.size, newOrientation, ship.id)) {
      setShips(prevShips =>
        prevShips.map(s =>
          s.id === ship.id
            ? { ...s, orientation: newOrientation }
            : s
        )
      );
    }
  };

  const handleCellDoubleClick = (row, col) => {
    const ship = getShipAtPosition(row, col);
    if (ship) {
      setShips(prevShips =>
        prevShips.map(s =>
          s.id === ship.id
            ? { ...s, row: null, col: null, placed: false }
            : s
        )
      );
      setSelectedShip(null);
    }
  };

  const placeShipsRandomly = () => {
    const newShips = [...ships];

    newShips.forEach(ship => {
      ship.placed = false;
      ship.row = null;
      ship.col = null;
    });

    newShips.forEach(ship => {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 100) {
        const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        const maxRow = orientation === 'horizontal' ? 10 : 10 - ship.size;
        const maxCol = orientation === 'horizontal' ? 10 - ship.size : 10;

        const row = Math.floor(Math.random() * maxRow);
        const col = Math.floor(Math.random() * maxCol);

        if (canPlaceShip(row, col, ship.size, orientation)) {
          ship.row = row;
          ship.col = col;
          ship.orientation = orientation;
          ship.placed = true;
          placed = true;
        }
        attempts++;
      }
    });

    setShips(newShips);
    setSelectedShip(null);
  };

  // 🔥 REEMPLAZAR LA FUNCIÓN startGame EN Tablero.jsx (línea 280+)

const startGame = () => {
  const allPlaced = ships.every(ship => ship.placed);
  
  if (!allPlaced) {
    alert('¡Debes colocar todos los barcos antes de iniciar!');
    return;
  }

  if (isMultiplayer && gameId) {
    console.log('📤 Enviando barcos al servidor...');
    console.log('🎮 gameId:', gameId);
    console.log('👤 playerId:', playerId);
    
    // ✅ FORMATO CORRECTO: Incluir ID y todos los campos necesarios
    const formattedShips = ships.map(ship => ({
      id: ship.id,           // ✅ CRÍTICO: Agregar ID
      size: ship.size,
      row: ship.row,
      col: ship.col,
      orientation: ship.orientation
    }));

    console.log('🚢 Barcos formateados:', formattedShips);

    // ✅ Asegurarse de que gameService tenga el gameId correcto
    if (!gameService.gameId) {
      console.warn('⚠️ gameService.gameId es null, asignando:', gameId);
      gameService.gameId = gameId;
    }
    if (!gameService.playerId) {
      console.warn('⚠️ gameService.playerId es null, asignando:', playerId);
      gameService.playerId = playerId;
    }

    gameService.placeShips(formattedShips);
    setWaitingForOpponent(true);
    
  } else {
    // Modo IA
    localStorage.setItem('playerShips', JSON.stringify(ships));
    navigate("/juego");
  }
};

  const shouldShowPreview = (row, col) => {
    if (!draggedShip || dragPreview.row === null) return false;
    
    const startRow = dragPreview.row;
    const startCol = dragPreview.col;
    
    if (draggedShip.orientation === 'horizontal') {
      return row === startRow && col >= startCol && col < startCol + draggedShip.size;
    } else {
      return col === startCol && row >= startRow && row < startRow + draggedShip.size;
    }
  };

  return (
    <div style={{
      backgroundColor: '#000',
      minHeight: '100vh',
      color: '#fff',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button onClick={() => navigate("/")} style={{
            background: '#6a0dad',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '18px'
          }}>↩</button>
          <button onClick={toggleRules} style={{
            background: '#6a0dad',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '18px'
          }}>?</button>
        </div>

        {isMultiplayer && (
          <div style={{
            textAlign: 'center',
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#2196F3',
            borderRadius: '8px'
          }}>
            <p style={{ margin: '5px 0', fontWeight: 'bold', fontSize: '18px' }}>
              🎮 Modo: Multijugador | Jugador: {playerId} | Código: {gameCode}
            </p>
            {opponent && (
              <p style={{ margin: '5px 0' }}>
                vs {opponent.name}
              </p>
            )}
          </div>
        )}

        {showRules && (
          <div style={{
            backgroundColor: '#222',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '2px solid #6a0dad'
          }}>
            <ol style={{ paddingLeft: '20px' }}>
              <li>Arrastra los barcos desde la caja al tablero.</li>
              <li>Arrastra un barco ya colocado para moverlo a otra posición.</li>
              <li>Click en un barco para seleccionarlo (brillo dorado).</li>
              <li>Click nuevamente en el barco seleccionado para rotarlo.</li>
              <li>Doble click en un barco para removerlo del tablero.</li>
              <li>Los barcos deben estar separados por al menos un cuadro.</li>
            </ol>
          </div>
        )}

        {waitingForOpponent && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '10px',
              textAlign: 'center',
              color: '#000'
            }}>
              <h2 style={{ color: '#2196F3', marginBottom: '20px' }}>
                ✅ Barcos colocados
              </h2>
              <div style={{ fontSize: '24px' }}>
                ⏳ Esperando a {opponent?.name || 'tu oponente'}...
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <div style={{ flex: '0 0 200px' }}>
            <button style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#6a0dad',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              marginBottom: '10px'
            }}>NUESTROS BARCOS</button>
            
            <div>
              {ships.filter(ship => !ship.placed).map(ship => (
                <div
                  key={ship.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, ship)}
                  style={{
                    display: 'flex',
                    gap: '2px',
                    marginBottom: '10px',
                    cursor: 'grab',
                    padding: '5px',
                    backgroundColor: '#333',
                    borderRadius: '5px'
                  }}
                >
                  {Array.from({ length: ship.size }, (_, i) => (
                    <div key={i} style={{
                      width: '30px',
                      height: '30px',
                      backgroundColor: '#8a2be2',
                      borderRadius: '3px'
                    }}></div>
                  ))}
                </div>
              ))}
              {ships.filter(ship => !ship.placed).length === 0 && (
                <p style={{ color: '#4CAF50', textAlign: 'center' }}>
                  Todos los barcos colocados
                </p>
              )}
            </div>
          </div>

          <div>
            <table style={{
              borderCollapse: 'collapse',
              backgroundColor: '#1a1a1a'
            }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px', color: '#fff' }}></th>
                  {Array.from({ length: 10 }, (_, i) => (
                    <th key={i} style={{ padding: '10px', color: '#fff' }}>
                      {String.fromCharCode(65 + i)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }, (_, row) => (
                  <tr key={row}>
                    <th style={{ padding: '10px', color: '#fff' }}>{row + 1}</th>
                    {Array.from({ length: 10 }, (_, col) => {
                      const isOccupied = isPositionOccupied(row, col);
                      const showPreview = shouldShowPreview(row, col);
                      const ship = getShipAtPosition(row, col);
                      const isSelected = selectedShip && ship && ship.id === selectedShip.id;
                      const isShipStart = ship && ship.row === row && ship.col === col;

                      let bgColor = '#0a3d62';
                      if (isOccupied) bgColor = '#8a2be2';
                      if (showPreview) bgColor = dragPreview.valid ? '#4CAF50' : '#f44336';
                      if (isSelected) bgColor = '#FFD700';

                      return (
                        <td
                          key={col}
                          draggable={isOccupied && isShipStart}
                          onDragStart={isShipStart ? (e) => handleBoardDragStart(e, ship) : undefined}
                          onDragEnd={isShipStart ? handleBoardDragEnd : undefined}
                          onDragOver={(e) => handleDragOver(e, row, col)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, row, col)}
                          onClick={(e) => handleCellClick(e, row, col)}
                          onDoubleClick={() => handleCellDoubleClick(row, col)}
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: bgColor,
                            border: '1px solid #444',
                            cursor: isOccupied ? (isShipStart ? 'grab' : 'pointer') : 'default',
                            transition: 'all 0.2s'
                          }}
                        ></td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '20px',
              justifyContent: 'center'
            }}>
              <button
                onClick={placeShipsRandomly}
                style={{
                  padding: '12px 30px',
                  backgroundColor: '#FF9800',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🎲 Random
              </button>
              <button
                onClick={startGame}
                disabled={!ships.every(ship => ship.placed)}
                style={{
                  padding: '12px 30px',
                  backgroundColor: ships.every(ship => ship.placed) ? '#4CAF50' : '#666',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  cursor: ships.every(ship => ship.placed) ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                ▶️ Play
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}