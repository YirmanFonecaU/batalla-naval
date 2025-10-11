import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Style.css";

export default function Juego() {
  const navigate = useNavigate();
  
  // Estado para nuestros barcos (viene del tablero anterior) - configuración correcta
  const [ourShips, setOurShips] = useState([
    { id: 1, size: 5, row: 9, col: 4, orientation: 'horizontal', placed: true, hits: [] }, // Portaaviones (5 casillas)
    { id: 2, size: 4, row: 1, col: 5, orientation: 'vertical', placed: true, hits: [] },   // Crucero (4 casillas)
    { id: 3, size: 3, row: 5, col: 1, orientation: 'horizontal', placed: true, hits: [] }, // Submarino (3 casillas)
    { id: 4, size: 2, row: 6, col: 6, orientation: 'horizontal', placed: true, hits: [] }, // Destructor 1 (2 casillas)
    { id: 5, size: 2, row: 7, col: 2, orientation: 'vertical', placed: true, hits: [] },   // Destructor 2 (2 casillas)
  ]);

  // Estado para los barcos enemigos (simulados) - configuración correcta
  const [enemyShips, setEnemyShips] = useState([
    { id: 1, size: 5, row: 1, col: 1, orientation: 'horizontal', hits: [] }, // Portaaviones (5 casillas)
    { id: 2, size: 4, row: 4, col: 7, orientation: 'vertical', hits: [] },   // Crucero (4 casillas)
    { id: 3, size: 3, row: 8, col: 2, orientation: 'horizontal', hits: [] }, // Submarino (3 casillas)
    { id: 4, size: 2, row: 0, col: 8, orientation: 'vertical', hits: [] },   // Destructor 1 (2 casillas)
    { id: 5, size: 2, row: 6, col: 0, orientation: 'horizontal', hits: [] }, // Destructor 2 (2 casillas)
  ]);

  // Estado para los ataques del enemigo en nuestro tablero
  const [enemyAttacks, setEnemyAttacks] = useState([]);
  
  // Estado para nuestros ataques en el tablero enemigo
  const [ourAttacks, setOurAttacks] = useState([]);
  
  // Estado para el turno (true = nuestro turno, false = turno enemigo)
  const [isOurTurn, setIsOurTurn] = useState(true);

  // Estado para casillas de agua marcadas automáticamente
  const [autoWaterMarks, setAutoWaterMarks] = useState([]);

  // Función para validar configuración de barcos
  const validateShipConfiguration = (ships) => {
    const sizes = ships.map(ship => ship.size).sort((a, b) => b - a);
    const expectedSizes = [5, 4, 3, 2, 2].sort((a, b) => b - a);
    
    console.log('Configuración actual de barcos:', sizes);
    console.log('Configuración esperada:', expectedSizes);
    
    return JSON.stringify(sizes) === JSON.stringify(expectedSizes);
  };

  // Validar configuración al cargar
  useEffect(() => {
    if (!validateShipConfiguration(enemyShips)) {
      console.warn('⚠️ Configuración de barcos enemigos incorrecta');
    }
    if (!validateShipConfiguration(ourShips)) {
      console.warn('⚠️ Configuración de nuestros barcos incorrecta');
    }
  }, []);

  // Función para obtener todas las posiciones que ocupa un barco
  const getShipPositions = (ship) => {
    const positions = [];
    for (let i = 0; i < ship.size; i++) {
      const row = ship.orientation === 'horizontal' ? ship.row : ship.row + i;
      const col = ship.orientation === 'horizontal' ? ship.col + i : ship.col;
      positions.push({ row, col });
    }
    return positions;
  };

  // Función para obtener casillas alrededor de un barco
  const getSurroundingPositions = (ship) => {
    const positions = [];
    const shipPositions = getShipPositions(ship);
    
    shipPositions.forEach(({ row, col }) => {
      // Verificar las 8 direcciones alrededor de cada segmento
      for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
        for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
          if (deltaRow === 0 && deltaCol === 0) continue; // Skip la posición del barco
          
          const newRow = row + deltaRow;
          const newCol = col + deltaCol;
          
          // Verificar límites del tablero
          if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
            // No agregar si ya está en la lista
            if (!positions.some(pos => pos.row === newRow && pos.col === newCol)) {
              // No agregar si es posición de otro barco
              if (!shipPositions.some(pos => pos.row === newRow && pos.col === newCol)) {
                positions.push({ row: newRow, col: newCol });
              }
            }
          }
        }
      }
    });
    
    return positions;
  };

  // Función para verificar si un barco está completamente hundido
  const isShipSunk = (ship) => {
    return ship.hits.length === ship.size;
  };

  // Función para marcar agua alrededor de barcos hundidos
  const markWaterAroundSunkShip = (ship) => {
    const surroundingPositions = getSurroundingPositions(ship);
    setAutoWaterMarks(prev => {
      const newMarks = [...prev];
      surroundingPositions.forEach(pos => {
        if (!newMarks.some(mark => mark.row === pos.row && mark.col === pos.col)) {
          newMarks.push(pos);
        }
      });
      return newMarks;
    });
  };

  // Función para verificar si una posición está ocupada por barcos enemigos
  const isEnemyShipAt = (row, col) => {
    return enemyShips.some(ship => {
      const positions = getShipPositions(ship);
      return positions.some(pos => pos.row === row && pos.col === col);
    });
  };

  // Función para verificar si una posición está ocupada por nuestros barcos
  const isOurShipAt = (row, col) => {
    return ourShips.some(ship => {
      const positions = getShipPositions(ship);
      return positions.some(pos => pos.row === row && pos.col === col);
    });
  };

  // Función para verificar si una posición ha sido atacada
  const isPositionAttacked = (row, col, attacksArray) => {
    return attacksArray.some(attack => attack.row === row && attack.col === col);
  };

  // Función para realizar un ataque en el tablero enemigo
  const handleAttack = (row, col) => {
    if (!isOurTurn || isPositionAttacked(row, col, ourAttacks)) return;

    // Verificar si hay un barco enemigo en esta posición
    const isHit = isEnemyShipAt(row, col);
    
    const newAttack = { row, col, isHit };
    setOurAttacks(prev => [...prev, newAttack]);
    
    if (isHit) {
      // Actualizar hits del barco enemigo
      setEnemyShips(prev => prev.map(ship => {
        const positions = getShipPositions(ship);
        const hitPosition = positions.find(pos => pos.row === row && pos.col === col);
        
        if (hitPosition) {
          const newHits = [...ship.hits, { row, col }];
          const updatedShip = { ...ship, hits: newHits };
          
          // Verificar si el barco se hundió
          if (isShipSunk(updatedShip)) {
            // Marcar agua alrededor del barco hundido
            setTimeout(() => markWaterAroundSunkShip(updatedShip), 500);
          }
          
          return updatedShip;
        }
        return ship;
      }));
      
      // Si acierta, puede atacar de nuevo (no cambiar turno)
      return;
    }
    
    // Si falla, cambiar turno
    setIsOurTurn(false);
    
    // Simular ataque enemigo después de un delay
    setTimeout(() => {
      simulateEnemyAttack();
    }, 1500);
  };

  // Función para simular ataque enemigo
  const simulateEnemyAttack = () => {
    let row, col;
    do {
      row = Math.floor(Math.random() * 10);
      col = Math.floor(Math.random() * 10);
    } while (isPositionAttacked(row, col, enemyAttacks));

    const isHit = isOurShipAt(row, col);
    const newAttack = { row, col, isHit };
    setEnemyAttacks(prev => [...prev, newAttack]);
    
    if (isHit) {
      // Actualizar hits de nuestros barcos
      setOurShips(prev => prev.map(ship => {
        const positions = getShipPositions(ship);
        const hitPosition = positions.find(pos => pos.row === row && pos.col === col);
        
        if (hitPosition) {
          const newHits = [...ship.hits, { row, col }];
          return { ...ship, hits: newHits };
        }
        return ship;
      }));
      
      // Si el enemigo acierta, puede atacar de nuevo
      setTimeout(() => {
        simulateEnemyAttack();
      }, 1000);
    } else {
      setIsOurTurn(true);
    }
  };

  // Función para obtener el estado de una celda en nuestro tablero
  const getOurCellState = (row, col) => {
    const attack = enemyAttacks.find(a => a.row === row && a.col === col);
    const hasShip = isOurShipAt(row, col);
    
    if (attack) {
      return attack.isHit ? 'hit' : 'miss';
    }
    return hasShip ? 'ship' : 'empty';
  };

  // Función para obtener el estado de una celda en el tablero enemigo
  const getEnemyCellState = (row, col) => {
    const attack = ourAttacks.find(a => a.row === row && a.col === col);
    const isAutoWater = autoWaterMarks.some(mark => mark.row === row && mark.col === col);
    
    if (attack) {
      return attack.isHit ? 'hit' : 'miss';
    }
    if (isAutoWater) {
      return 'auto-water';
    }
    return 'empty';
  };

  return (
    <div className="game-container">
      <div className="top-buttons">
        <button className="icon-btn" onClick={() => navigate("/tablero")}>↩</button>
      </div>

      <div className="game-boards">
        {/* Tablero izquierdo - Nuestros barcos */}
        <div className="board-section">
          <h2 className="board-title">NUESTROS BARCOS</h2>
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
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tablero derecho - Ataques enemigos */}
        <div className="board-section">
          <h2 className="board-title">
            {isOurTurn ? "Tu Turno" : "Turno Enemigo"}
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
                    const isClickable = isOurTurn && cellState === 'empty';
                    
                    return (
                      <td 
                        key={col}
                        className={`game-cell ${cellState} ${isClickable ? 'clickable' : ''}`}
                        onClick={() => isClickable && handleAttack(row, col)}
                      >
                        {cellState === 'hit' && '💥'}
                        {cellState === 'miss' && '💧'}
                        {cellState === 'auto-water' && '💧'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Botones centrados debajo de los tableros */}
      <div className="board-buttons">
        <button className="action-btn" onClick={() => navigate("/ganaste")}>
          Pantalla de Ganaste
        </button>
        <button className="action-btn" onClick={() => navigate("/perdiste")}>
          Pantalla de Perdiste
        </button>
      </div>

      <div className="game-status">
        <p>{isOurTurn ? "¡Tu turno! Haz clic en una casilla para atacar" : "Turno del enemigo..."}</p>
      </div>
    </div>
  );
}