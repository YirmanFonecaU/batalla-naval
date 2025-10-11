import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Style.css";

export default function Tablero() {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);

  // Estado para los barcos - inicialmente todos sin colocar
  const [ships, setShips] = useState([
    { id: 1, size: 5, row: null, col: null, orientation: 'horizontal', placed: false }, // Portaaviones (5 casillas)
    { id: 2, size: 4, row: null, col: null, orientation: 'horizontal', placed: false }, // Crucero (4 casillas)
    { id: 3, size: 3, row: null, col: null, orientation: 'horizontal', placed: false }, // Submarino (3 casillas)
    { id: 4, size: 2, row: null, col: null, orientation: 'horizontal', placed: false }, // Destructor 1 (2 casillas)
    { id: 5, size: 2, row: null, col: null, orientation: 'horizontal', placed: false }, // Destructor 2 (2 casillas)
  ]);

  // Estado para el barco que se está arrastrando
  const [draggedShip, setDraggedShip] = useState(null);

  // Estado para mostrar preview durante el drag
  const [dragPreview, setDragPreview] = useState({ row: null, col: null, valid: false });

  const toggleRules = () => setShowRules(!showRules);

  // Función para verificar si una posición está ocupada por algún barco
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

  // Función para verificar si hay separación mínima (1 casilla) entre barcos
  const hasMinimumSeparation = (row, col, size, orientation, excludeShipId = null) => {
    for (let i = 0; i < size; i++) {
      const shipRow = orientation === 'horizontal' ? row : row + i;
      const shipCol = orientation === 'horizontal' ? col + i : col;

      // Verificar las 8 casillas alrededor de cada segmento del barco
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

  // Función para validar si un barco puede ser colocado en una posición
  const canPlaceShip = (row, col, size, orientation, excludeShipId = null) => {
    // Verificar límites del tablero
    if (orientation === 'horizontal') {
      if (col + size > 10) return false;
    } else {
      if (row + size > 10) return false;
    }

    // Verificar que no se sobreponga con otros barcos
    for (let i = 0; i < size; i++) {
      const shipRow = orientation === 'horizontal' ? row : row + i;
      const shipCol = orientation === 'horizontal' ? col + i : col;

      if (isPositionOccupied(shipRow, shipCol, excludeShipId)) {
        return false;
      }
    }

    // Verificar separación mínima
    return hasMinimumSeparation(row, col, size, orientation, excludeShipId);
  };

  // Funciones para manejar el drag and drop
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

  // Función para rotar un barco (clic derecho)
  const handleShipRightClick = (e, shipId) => {
    e.preventDefault();
    setShips(prevShips =>
      prevShips.map(ship =>
        ship.id === shipId
          ? {
            ...ship,
            orientation: ship.orientation === 'horizontal' ? 'vertical' : 'horizontal',
            // Si el barco está colocado, verificar que siga siendo válido después de rotar
            // Si no está colocado, mantener el estado actual (false para barcos en la caja)
            placed: ship.placed ? canPlaceShip(ship.row, ship.col, ship.size,
              ship.orientation === 'horizontal' ? 'vertical' : 'horizontal', shipId) : ship.placed
          }
          : ship
      )
    );
  };

  // Función para colocar barcos aleatoriamente
  const placeShipsRandomly = () => {
    const newShips = [...ships];

    // Resetear todos los barcos
    newShips.forEach(ship => {
      ship.placed = false;
      ship.row = null;
      ship.col = null;
    });

    // Colocar cada barco aleatoriamente
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

  // Función para remover un barco del tablero y devolverlo a la caja
  const removeShipFromBoard = (shipId) => {
    setShips(prevShips =>
      prevShips.map(ship =>
        ship.id === shipId
          ? { ...ship, row: null, col: null, placed: false }
          : ship
      )
    );
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
  {/* Caja de barcos a la izquierda */}
  <div className="ships-section">
    <button className="ships-header-btn">NUESTROS BARCOS</button>
    <div className="ships-dock">
      {ships.filter(ship => !ship.placed).map(ship => (
        <div
          key={ship.id}
          className={`ship-item ${ship.orientation}`}
          draggable
          onDragStart={(e) => handleDragStart(e, ship)}
          onContextMenu={(e) => handleShipRightClick(e, ship.id)}
          data-ship-size={ship.size}
        >
          <div className="ship-segments">
            {Array.from({ length: ship.size }, (_, i) => (
              <div key={i} className="ship-segment"></div>
            ))}
          </div>
        </div>
      ))}
      {ships.filter(ship => !ship.placed).length === 0 && (
        <p className="all-placed">Todos los barcos colocados</p>
      )}
    </div>
  </div>


        {/* Tablero en el centro con botones debajo */}
        <div className="board-section">
          <div className="grid-container">
            <table className="board">
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
                      // Verificar si esta casilla está ocupada por un barco
                      const isOccupied = isPositionOccupied(row, col);

                      // Verificar si esta casilla está en el preview de drag
                      const isPreview = dragPreview.row === row && dragPreview.col === col;

                      // Crear clases CSS dinámicas
                      let cellClasses = '';
                      if (isOccupied) cellClasses += ' occupied';
                      if (isPreview) cellClasses += dragPreview.valid ? ' preview-valid' : ' preview-invalid';

                      return (
                        <td
                          key={col}
                          className={cellClasses}
                          onDragOver={(e) => handleDragOver(e, row, col)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, row, col)}
                        >
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Barcos colocados en el tablero */}
            {/* Barcos colocados en el tablero */}
            <div className="ships-overlay">
              {ships.map(ship => {
                if (!ship.placed) return null;

                // Calcular posición pixel basada en la posición del grid
                const cellSize = 34; // 32px de celda + 2px de border-spacing
                const boardStartX = 32; // Ajuste para las etiquetas de fila (ancho del th)
                const boardStartY = 32; // Ajuste para las etiquetas de columna (altura del th)

                const pixelX = boardStartX + ship.col * cellSize + 1;
                const pixelY = boardStartY + ship.row * cellSize + 1;

                const width = ship.orientation === 'horizontal' ? ship.size * cellSize - 2 : cellSize - 2;
                const height = ship.orientation === 'horizontal' ? cellSize - 2 : ship.size * cellSize - 2;

                return (
                  <div
                    key={ship.id}
                    className={`ship-placed ship-${ship.orientation}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ship)}
                    onContextMenu={(e) => handleShipRightClick(e, ship.id)}
                    onDoubleClick={() => removeShipFromBoard(ship.id)}
                    style={{
                      left: `${pixelX}px`,
                      top: `${pixelY}px`,
                      width: `${width}px`,
                      height: `${height}px`,
                    }}
                    title="Doble clic para remover | Clic derecho para rotar"
                  />
                );
              })}
            </div>
          </div>

          {/* Botones debajo del tablero */}
          <div className="board-buttons">
            <button className="action-btn" onClick={placeShipsRandomly}>► Random</button>
            <button className="action-btn" onClick={() => navigate("/juego")}>► Play</button>
          </div>
        </div>
      </div>
    </div>
  );
}