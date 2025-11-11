import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Style.css";

export default function Tablero() {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);

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
  const [selectedShip, setSelectedShip] = useState(null); // Para rotación con click

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

  // Manejar inicio de arrastre
  const handleDragStart = (e, ship) => {
    setDraggedShip(ship);
    setSelectedShip(null); // Limpiar selección al arrastrar
    e.dataTransfer.effectAllowed = 'move';
  };

  // Manejar arrastre sobre celda
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

  // Manejar soltar barco
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

  // Obtener el barco en una posición específica
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

  // Manejar inicio de arrastre desde el tablero
  const handleBoardDragStart = (e, ship) => {
    e.stopPropagation();
    setDraggedShip(ship);
    setSelectedShip(null);
    e.dataTransfer.effectAllowed = 'move';
    
    // Hacer que el barco sea semi-transparente mientras se arrastra
    e.currentTarget.style.opacity = '0.4';
  };

  // Restaurar opacidad al terminar el arrastre
  const handleBoardDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  // Manejar click en celda del tablero
  const handleCellClick = (e, row, col) => {
    // Evitar que el click se active si estamos arrastrando
    if (draggedShip) return;
    
    const ship = getShipAtPosition(row, col);
    
    if (ship) {
      if (selectedShip && selectedShip.id === ship.id) {
        // Si el barco ya está seleccionado, rotarlo
        rotateShipInPlace(ship);
        setSelectedShip(null);
      } else {
        // Seleccionar el barco
        setSelectedShip(ship);
      }
    } else {
      setSelectedShip(null);
    }
  };

  // Rotar barco en su posición actual
  const rotateShipInPlace = (ship) => {
    const newOrientation = ship.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    
    // Verificar si la rotación es válida
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

  // Remover barco del tablero (doble click)
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

  // Colocar barcos aleatoriamente
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

  // Iniciar juego
  const startGame = () => {
    const allPlaced = ships.every(ship => ship.placed);
    
    if (!allPlaced) {
      alert('¡Debes colocar todos los barcos antes de iniciar!');
      return;
    }

    localStorage.setItem('playerShips', JSON.stringify(ships));
    navigate("/juego");
  };

  // Verificar si una celda debe mostrar preview
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
    <div className="tablero-container">
      <div className="top-buttons">
        <button className="icon-btn" onClick={() => navigate("/")}>↩</button>
        <button className="icon-btn" onClick={toggleRules}>?</button>
      </div>

      {showRules && (
        <div className="rules-box">
          <ol>
            <li>Arrastra los barcos desde la caja al tablero.</li>
            <li>Arrastra un barco ya colocado para moverlo a otra posición.</li>
            <li>Click en un barco para seleccionarlo (brillo dorado).</li>
            <li>Click nuevamente en el barco seleccionado para rotarlo.</li>
            <li>Doble click en un barco para removerlo del tablero.</li>
            <li>Los barcos deben estar separados por al menos un cuadro.</li>
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
                style={{ cursor: 'grab' }}
              >
                {Array.from({ length: ship.size }, (_, i) => (
                  <div key={i} className="ship-segment-status intact"></div>
                ))}
              </div>
            ))}
            {ships.filter(ship => !ship.placed).length === 0 && (
              <p className="all-placed">Todos los barcos colocados</p>
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
                      const showPreview = shouldShowPreview(row, col);
                      const ship = getShipAtPosition(row, col);
                      const isSelected = selectedShip && ship && ship.id === selectedShip.id;

                      let cellClasses = 'game-cell';
                      if (isOccupied) cellClasses += ' occupied';
                      if (showPreview) cellClasses += dragPreview.valid ? ' preview-valid' : ' preview-invalid';
                      if (isSelected) cellClasses += ' selected-ship';

                      // Determinar si esta celda es la primera del barco (para arrastre)
                      const isShipStart = ship && ship.row === row && ship.col === col;

                      return (
                        <td
                          key={col}
                          className={cellClasses}
                          draggable={isOccupied && isShipStart}
                          onDragStart={isShipStart ? (e) => handleBoardDragStart(e, ship) : undefined}
                          onDragEnd={isShipStart ? handleBoardDragEnd : undefined}
                          onDragOver={(e) => handleDragOver(e, row, col)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, row, col)}
                          onClick={(e) => handleCellClick(e, row, col)}
                          onDoubleClick={() => handleCellDoubleClick(row, col)}
                          style={{ cursor: isOccupied ? (isShipStart ? 'grab' : 'pointer') : 'default' }}
                          title={
                            isOccupied 
                              ? isShipStart
                                ? "Arrastrar para mover | Click: seleccionar | Click x2: rotar | Doble click: remover"
                                : "Click: seleccionar | Click x2: rotar | Doble click: remover"
                              : ""
                          }
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
            <button className="action-btn" onClick={placeShipsRandomly}>Random</button>
            <button className="action-btn" onClick={startGame}>Play</button>
          </div>
        </div>
      </div>
    </div>
  );
}