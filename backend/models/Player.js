import Board from './Board.js';
class Player {
  constructor(id, name, isAI = false) {
    this.id = id;
    this.name = name;
    this.isAI = isAI;
    this.board = new Board();
    this.targetBoard = null; // Referencia al tablero del oponente
    this.lastShots = []; // Historial de disparos realizados
    
    // Estado de la IA mejorada
    if (this.isAI) {
      this.aiState = {
        targetMode: false, // Modo de persecución de barco
        currentTarget: null, // Barco que está siendo perseguido
        targetQueue: [], // Cola de posiciones a atacar
        hitSequence: [], // Secuencia de impactos del barco actual
        probableDirection: null // 'horizontal' o 'vertical'
      };
    }
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
    const result = this.makeShot(row, col);
    
    // Actualizar estado de la IA basado en el resultado
    this.updateAIState(result);
    
    return result;
  }

  // IA: Actualizar estado después de un disparo
  updateAIState(result) {
    const { row, col, isHit, sunkShip } = result;

    if (isHit) {
      // Agregar a la secuencia de impactos
      this.aiState.hitSequence.push({ row, col });
      this.aiState.targetMode = true;

      if (sunkShip) {
        // Barco hundido - resetear modo de persecución
        this.resetAITargetMode();
      } else {
        // Impacto pero no hundido - determinar dirección y agregar objetivos
        this.determineDirection();
        this.updateTargetQueue(row, col);
      }
    } else {
      // Fallo - si estábamos persiguiendo, intentar otra dirección
      if (this.aiState.targetMode && this.aiState.targetQueue.length === 0) {
        this.tryAlternativeDirection();
      }
    }
  }

  // IA: Resetear modo de persecución
  resetAITargetMode() {
    this.aiState.targetMode = false;
    this.aiState.currentTarget = null;
    this.aiState.targetQueue = [];
    this.aiState.hitSequence = [];
    this.aiState.probableDirection = null;
  }

  // IA: Determinar dirección del barco
  determineDirection() {
    if (this.aiState.hitSequence.length < 2) {
      return; // Necesitamos al menos 2 impactos para determinar dirección
    }

    const hits = this.aiState.hitSequence;
    const lastHit = hits[hits.length - 1];
    const prevHit = hits[hits.length - 2];

    if (lastHit.row === prevHit.row) {
      this.aiState.probableDirection = 'horizontal';
    } else if (lastHit.col === prevHit.col) {
      this.aiState.probableDirection = 'vertical';
    }
  }

  // IA: Actualizar cola de objetivos
  updateTargetQueue(row, col) {
    // Limpiar cola actual
    this.aiState.targetQueue = [];

    if (this.aiState.probableDirection === 'horizontal') {
      // Atacar en línea horizontal
      this.addDirectionalTargets(row, col, 0, 1);  // Derecha
      this.addDirectionalTargets(row, col, 0, -1); // Izquierda
    } else if (this.aiState.probableDirection === 'vertical') {
      // Atacar en línea vertical
      this.addDirectionalTargets(row, col, 1, 0);  // Abajo
      this.addDirectionalTargets(row, col, -1, 0); // Arriba
    } else {
      // Primer impacto - agregar todas las direcciones
      this.addAdjacentTargets(row, col);
    }
  }

  // IA: Agregar objetivos direccionales
  addDirectionalTargets(row, col, deltaRow, deltaCol) {
    const hits = this.aiState.hitSequence;
    
    // Encontrar el extremo de la secuencia de impactos en esta dirección
    let currentRow = row;
    let currentCol = col;
    
    // Moverse a través de los impactos en esta dirección
    while (true) {
      const nextRow = currentRow + deltaRow;
      const nextCol = currentCol + deltaCol;
      
      // Verificar si la siguiente posición es un impacto conocido
      const isKnownHit = hits.some(hit => hit.row === nextRow && hit.col === nextCol);
      
      if (isKnownHit) {
        currentRow = nextRow;
        currentCol = nextCol;
      } else {
        break;
      }
    }
    
    // Agregar la siguiente posición en esta dirección
    const targetRow = currentRow + deltaRow;
    const targetCol = currentCol + deltaCol;
    
    if (this.isValidTarget(targetRow, targetCol)) {
      this.aiState.targetQueue.push({ row: targetRow, col: targetCol });
    }
  }

  // IA: Agregar objetivos adyacentes (todas direcciones)
  addAdjacentTargets(row, col) {
    const directions = [
      { row: -1, col: 0 },  // Arriba
      { row: 1, col: 0 },   // Abajo
      { row: 0, col: -1 },  // Izquierda
      { row: 0, col: 1 }    // Derecha
    ];

    for (const dir of directions) {
      const newRow = row + dir.row;
      const newCol = col + dir.col;
      
      if (this.isValidTarget(newRow, newCol)) {
        this.aiState.targetQueue.push({ row: newRow, col: newCol });
      }
    }
  }

  // IA: Intentar dirección alternativa
  tryAlternativeDirection() {
    if (this.aiState.hitSequence.length === 0) {
      this.resetAITargetMode();
      return;
    }

    // Volver al primer impacto y probar otras direcciones
    const firstHit = this.aiState.hitSequence[0];
    this.addAdjacentTargets(firstHit.row, firstHit.col);
  }

  // IA: Verificar si un objetivo es válido
  isValidTarget(row, col) {
    if (!this.targetBoard.isValidPosition(row, col)) {
      return false;
    }
    
    const alreadyShot = this.lastShots.some(shot => 
      shot.row === row && shot.col === col
    );
    
    return !alreadyShot;
  }

  // IA: Calcular mejor disparo
  calculateBestShot() {
    // Prioridad 1: Usar cola de objetivos si estamos en modo persecución
    if (this.aiState.targetMode && this.aiState.targetQueue.length > 0) {
      // Obtener el siguiente objetivo de la cola
      return this.aiState.targetQueue.shift();
    }

    // Prioridad 2: Buscar impactos sin finalizar
    const unfinishedHits = this.findUnfinishedHits();
    if (unfinishedHits.length > 0) {
      // Reactivar modo persecución
      this.aiState.targetMode = true;
      this.aiState.hitSequence = [unfinishedHits[0]];
      this.updateTargetQueue(unfinishedHits[0].row, unfinishedHits[0].col);
      
      if (this.aiState.targetQueue.length > 0) {
        return this.aiState.targetQueue.shift();
      }
    }

    // Prioridad 3: Patrón de tablero de ajedrez
    const checkerboardShot = this.getCheckerboardTarget();
    if (checkerboardShot) {
      return checkerboardShot;
    }

    // Prioridad 4: Cualquier posición disponible
    return this.getRandomTarget();
  }

  // IA: Encontrar impactos sin finalizar
  findUnfinishedHits() {
    const hits = this.lastShots.filter(shot => shot.isHit);
    
    return hits.filter(hit => {
      const ship = this.targetBoard.getShipAt(hit.row, hit.col);
      return ship && !ship.isSunk();
    });
  }

  // IA: Obtener objetivo con patrón de tablero de ajedrez
  getCheckerboardTarget() {
    const availablePositions = [];
    
    for (let row = 0; row < this.targetBoard.size; row++) {
      for (let col = 0; col < this.targetBoard.size; col++) {
        // Patrón de tablero de ajedrez
        if ((row + col) % 2 === 0) {
          if (this.isValidTarget(row, col)) {
            availablePositions.push({ row, col });
          }
        }
      }
    }

    if (availablePositions.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    return availablePositions[randomIndex];
  }

  // IA: Obtener objetivo aleatorio
  getRandomTarget() {
    const availablePositions = [];
    
    for (let row = 0; row < this.targetBoard.size; row++) {
      for (let col = 0; col < this.targetBoard.size; col++) {
        if (this.isValidTarget(row, col)) {
          availablePositions.push({ row, col });
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
    
    // Restaurar estado de IA si es necesario
    if (player.isAI && data.aiState) {
      player.aiState = data.aiState;
    }
    
    return player;
  }
}

export default Player;