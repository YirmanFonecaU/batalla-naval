import Player from './Player.js';
import Board from './Board.js';

class Game {
  constructor(gameId, player1Name, player2Name = null, isVsAI = false) {
    this.id = gameId;
    this.status = 'setup'; // 'setup', 'playing', 'finished'
    this.currentTurn = 1; // 1 o 2
    this.winner = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();

    // Crear jugadores
    this.player1 = new Player(1, player1Name, false);
    this.player2 = new Player(2, player2Name || 'AI', isVsAI);

    // Configurar referencias cruzadas de tableros
    this.player1.setTargetBoard(this.player2.board);
    this.player2.setTargetBoard(this.player1.board);

    this.isVsAI = isVsAI;
    this.moveHistory = [];
  }

  // Configurar barcos del jugador
  setPlayerShips(playerId, ships) {
    const player = playerId === 1 ? this.player1 : this.player2;

    if (!player) {
      throw new Error('Player not found');
    }

    // Reinicializar el tablero
    player.board = new Board();

    // Colocar cada barco
    for (const shipData of ships) {
      const success = player.board.placeShip(
        shipData.id,
        shipData.row,
        shipData.col,
        shipData.orientation
      );

      if (!success) {
        throw new Error(`Cannot place ship ${shipData.id} at position (${shipData.row}, ${shipData.col})`);
      }
    }

    // Si es contra IA y se configuró el jugador 1, configurar IA automáticamente
    if (this.isVsAI && playerId === 1) {
      this.player2.board.placeShipsRandomly();
      this.status = 'playing';
    }

    // Si es multijugador y ambos jugadores configuraron sus barcos
    if (!this.isVsAI && this.areAllShipsPlaced()) {
      this.status = 'playing';
    }

    this.updatedAt = new Date();
    return true;
  }

  // Verificar si todos los barcos están colocados
  areAllShipsPlaced() {
    const player1Ready = this.player1.board.ships.every(ship => ship.placed);
    const player2Ready = this.player2.board.ships.every(ship => ship.placed);
    return player1Ready && player2Ready;
  }

  // Realizar un disparo
  makeShot(playerId, row, col) {
    if (this.status !== 'playing') {
      throw new Error('Game is not in playing state');
    }

    if (playerId !== this.currentTurn) {
      throw new Error('Not your turn');
    }

    const shooter = playerId === 1 ? this.player1 : this.player2;
    const result = shooter.makeShot(row, col);

    if (!result.success) {
      throw new Error(result.error);
    }

    // Registrar el movimiento
    this.moveHistory.push({
      playerId,
      row,
      col,
      isHit: result.isHit,
      sunkShip: result.sunkShip,
      timestamp: new Date()
    });

    // Verificar condición de victoria
    if (this.player1.hasLost()) {
      this.status = 'finished';
      this.winner = 2;
    } else if (this.player2.hasLost()) {
      this.status = 'finished';
      this.winner = 1;
    }

    // Cambiar turno solo si no hundió un barco
    if (!result.isHit) {
      this.switchTurn();
    }

    this.updatedAt = new Date();

    // Si es turno de la IA, hacer disparo automático
    if (this.isVsAI && this.currentTurn === 2 && this.status === 'playing') {
      setTimeout(() => {
        try {
          const aiResult = this.makeAIShot();

          // Si existe un callback registrado (desde el frontend)
          if (typeof this.onAIShotComplete === "function") {
            this.onAIShotComplete(aiResult, this.getGameState(1));
            // Enviamos también el nuevo estado para actualizar React
          }

        } catch (error) {
          console.error("AI shot error:", error);
        }
      }, 1000);
    }


    return result;
  }

  // Realizar disparo de IA
  makeAIShot() {
    if (!this.isVsAI || this.currentTurn !== 2) {
      throw new Error('Invalid AI shot attempt');
    }

    const result = this.player2.makeAIShot();

    // Registrar el movimiento
    this.moveHistory.push({
      playerId: 2,
      row: result.row,
      col: result.col,
      isHit: result.isHit,
      sunkShip: result.sunkShip,
      timestamp: new Date()
    });

    // Verificar condición de victoria
    if (this.player2.hasWon()) {
      this.status = 'finished';
      this.winner = 2;
    }

    // Cambiar turno solo si no hundió un barco
    if (!result.isHit || result.sunkShip) {
      this.switchTurn();
    }

    this.updatedAt = new Date();
    return result;
  }

  // Cambiar turno
  switchTurn() {
    this.currentTurn = this.currentTurn === 1 ? 2 : 1;
  }

  // Obtener estado del juego para un jugador específico
  getGameState(playerId) {
    const player = playerId === 1 ? this.player1 : this.player2;
    const opponent = playerId === 1 ? this.player2 : this.player1;

    return {
      gameId: this.id,
      status: this.status,
      currentTurn: this.currentTurn,
      isYourTurn: this.currentTurn === playerId,
      winner: this.winner,
      isVsAI: this.isVsAI,

      // Tu tablero (con barcos visibles)
      yourBoard: {
        ships: player.board.ships.map(ship => ship.toJSON()),
        shots: player.board.shots
      },

      // Tablero oponente (barcos ocultos, solo disparos visibles)
      opponentBoard: {
        shots: opponent.board.shots,
        // Solo mostrar barcos hundidos
        sunkShips: opponent.board.ships
          .filter(ship => ship.isSunk())
          .map(ship => ship.toJSON())
      },

      // Estadísticas
      yourStats: player.getStats(),
      opponentStats: opponent.getStats(),

      // Historial reciente
      recentMoves: this.moveHistory.slice(-10),

      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Obtener estado completo (para administrador)
  getFullState() {
    return {
      id: this.id,
      status: this.status,
      currentTurn: this.currentTurn,
      winner: this.winner,
      isVsAI: this.isVsAI,
      player1: this.player1.toJSON(true),
      player2: this.player2.toJSON(true),
      moveHistory: this.moveHistory,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Convertir a JSON
  toJSON() {
    return {
      id: this.id,
      status: this.status,
      currentTurn: this.currentTurn,
      winner: this.winner,
      isVsAI: this.isVsAI,
      player1: this.player1.toJSON(),
      player2: this.player2.toJSON(),
      moveHistory: this.moveHistory,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Crear desde JSON
  static fromJSON(data) {
    const game = new Game(data.id, data.player1.name, data.player2.name, data.isVsAI);
    game.status = data.status;
    game.currentTurn = data.currentTurn;
    game.winner = data.winner;
    game.moveHistory = data.moveHistory || [];
    game.createdAt = new Date(data.createdAt);
    game.updatedAt = new Date(data.updatedAt);

    // Restaurar jugadores
    game.player1 = Player.fromJSON(data.player1);
    game.player2 = Player.fromJSON(data.player2);

    // Restaurar referencias cruzadas
    game.player1.setTargetBoard(game.player2.board);
    game.player2.setTargetBoard(game.player1.board);

    return game;
  }
}

export default Game;