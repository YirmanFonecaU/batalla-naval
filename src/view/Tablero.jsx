import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Style.css";

export default function Tablero() {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);

  // Estado para los barcos - inicialmente todos sin colocar
  const [ships, setShips] = useState([
    { id: 1, size: 5, row: null, col: null, orientation: 'horizontal', placed: false }, // Portaaviones
    { id: 2, size: 4, row: null, col: null, orientation: 'horizontal', placed: false }, // Crucero
    { id: 3, size: 3, row: null, col: null, orientation: 'horizontal', placed: false }, // Submarino
    { id: 4, size: 2, row: null, col: null, orientation: 'horizontal', placed: false }, // Destructor 1
    { id: 5, size: 2, row: null, col: null, orientation: 'horizontal', placed: false }, // Destructor 2
  ]);

  const [draggedShip, setDraggedShip] = useState(null);
  const [dragPreview, setDragPreview] = useState({ row: null, col: null, valid: false });

  const toggleRules = () => setShowRules(!showRules);

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

  const handleShipRightClick = (e, shipId) => {
    e.preventDefault();
    setShips(prevShips =>
      prevShips.map(ship =>
        ship.id === shipId
          ? {
            ...ship,
            orientation: ship.orientation === 'horizontal' ? 'vertical' : 'horizontal',
            placed: ship.placed ? canPlaceShip(ship.row, ship.col, ship.size,
              ship.orientation === 'horizontal' ? 'vertical' : 'horizontal', shipId) : ship.placed
          }
          : ship
      )
    );
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
  };

  const removeShipFromBoard = (shipId) => {
    setShips(prevShips =>
      prevShips.map(ship =>
        ship.id === shipId
          ? { ...ship, row: null, col: null, placed: false }
          : ship
      )
    );
  };

  // Función para iniciar el juego
  const startGame = () => {
    // Verificar que todos los barcos estén colocados
    const allPlaced = ships.every(ship => ship.placed);
    
    if (!allPlaced) {
      alert('¡Debes colocar todos los barcos antes de iniciar!');
      return;
    }

    // Guardar los barcos en localStorage para usarlos en el juego
    localStorage.setItem('playerShips', JSON.stringify(ships));
    
    // Navegar a la pantalla de juego
    navigate("/juego");
  };

  return (
    <div className="tablero-container">
      <div className="top-buttons">
        <button className="icon-btn" onClick={() => navigate("/")}>↩</button>
        <button className="icon-btn" onClick={toggleRules}>?</button>
      </div>

      {showRules && (
        <div className="rules-box">
          <ol>
            <li>Para decidir quién empieza a jugar es aleatorio.</li>
            <li>
              Los barcos se colocan únicamente de manera horizontal o vertical,
              sin sobreponerse, y deben mantenerse separados por al menos un cuadro de distancia.
            </li>
            <li>Los barcos no se pueden mover una vez iniciado el juego.</li>
            <li>
              Si aciertas puedes disparar de nuevo y si fallas pasa el turno al otro jugador.
            </li>
          </ol>
        </div>
      )}

      <div className="game-layout">
        <div className="ships-section">
          <button className="ships-header-btn">NUESTROS BARCOS</button>
          <div className="ships-status-grid">
            {ships.filter(ship => !ship.placed).map(ship => (
              <div
                key={ship.id}
                className="ship-status alive"
                draggable
                onDragStart={(e) => handleDragStart(e, ship)}
                onContextMenu={(e) => handleShipRightClick(e, ship.id)}
              >
                {Array.from({ length: ship.size }, (_, i) => (
                  <div key={i} className="ship-segment-status intact"></div>
                ))}
              </div>
            ))}
            {ships.filter(ship => !ship.placed).length === 0 && (
              <p className="all-placed">✅ Todos los barcos colocados</p>
            )}
          </div>
        </div>

        <div className="board-section">
          <div className="grid-container">
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
                      const isOccupied = isPositionOccupied(row, col);
                      const isPreview = dragPreview.row === row && dragPreview.col === col;

                      let cellClasses = 'game-cell';
                      if (isOccupied) cellClasses += ' occupied';
                      if (isPreview) cellClasses += dragPreview.valid ? ' preview-valid' : ' preview-invalid';

                      return (
                        <td
                          key={col}
                          className={cellClasses}
                          onDragOver={(e) => handleDragOver(e, row, col)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, row, col)}
                          onDoubleClick={() => {
                            if (isOccupied) {
                              const ship = ships.find(ship => {
                                if (!ship.placed) return false;
                                for (let i = 0; i < ship.size; i++) {
                                  const shipRow = ship.orientation === 'horizontal' ? ship.row : ship.row + i;
                                  const shipCol = ship.orientation === 'horizontal' ? ship.col + i : ship.col;
                                  if (shipRow === row && shipCol === col) return true;
                                }
                                return false;
                              });
                              if (ship) removeShipFromBoard(ship.id);
                            }
                          }}
                          onContextMenu={(e) => {
                            if (isOccupied) {
                              e.preventDefault();
                              const ship = ships.find(ship => {
                                if (!ship.placed) return false;
                                for (let i = 0; i < ship.size; i++) {
                                  const shipRow = ship.orientation === 'horizontal' ? ship.row : ship.row + i;
                                  const shipCol = ship.orientation === 'horizontal' ? ship.col + i : ship.col;
                                  if (shipRow === row && shipCol === col) return true;
                                }
                                return false;
                              });
                              if (ship) handleShipRightClick(e, ship.id);
                            }
                          }}
                          title={isOccupied ? "Doble clic: remover | Clic derecho: rotar" : ""}
                        >
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="board-buttons">
            <button className="action-btn" onClick={placeShipsRandomly}>🎲 Random</button>
            <button className="action-btn" onClick={startGame}>▶️ Play</button>
          </div>
        </div>
      </div>
    </div>
  );
}