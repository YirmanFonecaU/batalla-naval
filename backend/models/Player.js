const Board = require('./Board');

class Player {
  constructor(id, name, isAI = false) {
    this.id = id;
    this.name = name;
    this.isAI = isAI;
    this.board = new Board();
    this.targetBoard = null; // Referencia al tablero del oponente
    this.lastShots = []; // Historial de disparos realizados
  }

  // Establecer el tablero objetivo (del oponente)
  setTargetBoard(targetBoard) {
    this.targetBoard = targetBoard;
  }

  // Realizar un disparo
  makeShot(row, col) {
    if (!this.targetBoard) {
      throw new Error('No target board set');
    }

    // Verificar si ya disparó a esta posición
    const alreadyShot = this.lastShots.some(shot => shot.row === row && shot.col === col);
    if (alreadyShot) {
      return { success: false, error: 'Already shot at this position' };
    }

    // Realizar el disparo
    const result = this.targetBoard.receiveShot(row, col);
    
    // Registrar el disparo
    this.lastShots.push({ 
      row, 
      col, 
      isHit: result.isHit, 
      timestamp: new Date() 
    });

    return {
      success: true,
      row,
      col,
      isHit: result.isHit,
      sunkShip: result.sunkShip,
      alreadyShot: result.alreadyShot
    };
  }

  // IA: Realizar disparo inteligente
  makeAIShot() {
    if (!this.isAI) {
      throw new Error('This player is not AI');
    }

    const { row, col } = this.calculateBestShot();
    return this.makeShot(row, col);
  }

  // IA: Calcular mejor disparo
  calculateBestShot() {
    const boardSize = this.targetBoard.size;
    
    // Buscar disparos que fueron impactos pero el barco no está hundido
    const hits = this.lastShots.filter(shot => shot.isHit);
    const unfinishedHits = hits.filter(hit => {
      const ship = this.targetBoard.getShipAt(hit.row, hit.col);
      return ship && !ship.isSunk();
    });

    if (unfinishedHits.length > 0) {
      // Estrategia: Continuar atacando alrededor de impactos no finalizados
      return this.getAdjacentTarget(unfinishedHits);
    } else {
      // Estrategia: Disparo aleatorio con patrón de tablero de ajedrez
      return this.getRandomCheckerboardTarget();
    }
  }

  // Obtener objetivo adyacente a impactos previos
  getAdjacentTarget(hits) {
    for (const hit of hits) {
      const directions = [
        { row: -1, col: 0 }, // Arriba
        { row: 1, col: 0 },  // Abajo
        { row: 0, col: -1 }, // Izquierda
        { row: 0, col: 1 }   // Derecha
      ];

      for (const dir of directions) {
        const newRow = hit.row + dir.row;
        const newCol = hit.col + dir.col;

        if (this.targetBoard.isValidPosition(newRow, newCol)) {
          const alreadyShot = this.lastShots.some(shot => 
            shot.row === newRow && shot.col === newCol
          );
          
          if (!alreadyShot) {
            return { row: newRow, col: newCol };
          }
        }
      }
    }

    // Si no hay adyacentes disponibles, usar estrategia aleatoria
    return this.getRandomCheckerboardTarget();
  }

  // Obtener objetivo aleatorio con patrón de tablero de ajedrez
  getRandomCheckerboardTarget() {
    const availablePositions = [];
    
    for (let row = 0; row < this.targetBoard.size; row++) {
      for (let col = 0; col < this.targetBoard.size; col++) {
        // Patrón de tablero de ajedrez (más eficiente para encontrar barcos)
        if ((row + col) % 2 === 0) {
          const alreadyShot = this.lastShots.some(shot => 
            shot.row === row && shot.col === col
          );
          
          if (!alreadyShot) {
            availablePositions.push({ row, col });
          }
        }
      }
    }

    // Si no hay posiciones en patrón de ajedrez, usar cualquier posición
    if (availablePositions.length === 0) {
      for (let row = 0; row < this.targetBoard.size; row++) {
        for (let col = 0; col < this.targetBoard.size; col++) {
          const alreadyShot = this.lastShots.some(shot => 
            shot.row === row && shot.col === col
          );
          
          if (!alreadyShot) {
            availablePositions.push({ row, col });
          }
        }
      }
    }

    if (availablePositions.length === 0) {
      throw new Error('No available positions to shoot');
    }

    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    return availablePositions[randomIndex];
  }

  // Verificar si ha perdido (todos sus barcos hundidos)
  hasLost() {
    return this.board.areAllShipsSunk();
  }

  // Verificar si ha ganado (todos los barcos del oponente hundidos)
  hasWon() {
    return this.targetBoard && this.targetBoard.areAllShipsSunk();
  }

  // Obtener estadísticas
  getStats() {
    const totalShots = this.lastShots.length;
    const hits = this.lastShots.filter(shot => shot.isHit).length;
    const accuracy = totalShots > 0 ? (hits / totalShots) * 100 : 0;

    return {
      totalShots,
      hits,
      misses: totalShots - hits,
      accuracy: Math.round(accuracy * 100) / 100
    };
  }

  // Convertir a JSON
  toJSON(includeTargetBoard = false) {
    const data = {
      id: this.id,
      name: this.name,
      isAI: this.isAI,
      board: this.board.toJSON(),
      lastShots: this.lastShots,
      stats: this.getStats()
    };

    if (includeTargetBoard && this.targetBoard) {
      data.targetBoard = this.targetBoard.toJSON();
    }

    return data;
  }

  // Crear desde JSON
  static fromJSON(data) {
    const player = new Player(data.id, data.name, data.isAI);
    player.board = Board.fromJSON(data.board);
    player.lastShots = data.lastShots || [];
    return player;
  }
}

module.exports = Player;