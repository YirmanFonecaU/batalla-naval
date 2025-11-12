import Player from './Player.js';
import Board from './Board.js';

class Game {
  constructor(gameId, player1Name, player2Name = null, isVsAI = false) {
    this.id = gameId;
    this.status = 'setup'; // 'setup', 'playing', 'finished'
    this.currentTurn = 1;
    this.winner = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.isVsAI = isVsAI;
    this.moveHistory = [];

    // Crear jugador 1
    this.player1 = new Player(1, player1Name, false);

    // 🔹 CORRECCIÓN AQUÍ:
    if (isVsAI) {
      // Si es contra la IA
      this.player2 = new Player(2, 'AI', true);
    } else {
      // Si es multijugador, jugador 2 empieza vacío
      this.player2 = new Player(2, null, false);
    }

    // Configurar tableros
    this.player1.setTargetBoard(this.player2.board);
    this.player2.setTargetBoard(this.player1.board);
  }

  // (todo lo demás igual)
  setPlayerShips(playerId, ships) {
    const player = playerId === 1 ? this.player1 : this.player2;

    if (!player) throw new Error('Player not found');

    player.board = new Board();

    for (const shipData of ships) {
      const success = player.board.placeShip(
        shipData.id,
        shipData.row,
        shipData.col,
        shipData.orientation
      );

      if (!success) {
        throw new Error(
          `Cannot place ship ${shipData.id} at position (${shipData.row}, ${shipData.col})`
        );
      }
    }

    this.player1.setTargetBoard(this.player2.board);
    this.player2.setTargetBoard(this.player1.board);

    if (this.isVsAI && playerId === 1) {
      this.player2.board.placeShipsRandomly();
      this.status = 'playing';
    }

    if (!this.isVsAI && this.areAllShipsPlaced()) {
      this.status = 'playing';
    }

    this.updatedAt = new Date();
    return true;
  }

  areAllShipsPlaced() {
    const player1Ready = this.player1.board.ships.every(ship => ship.placed);
    const player2Ready = this.player2.board.ships.every(ship => ship.placed);
    return player1Ready && player2Ready;
  }

  makeShot(playerId, row, col) {
    if (this.status !== 'playing') throw new Error('Game is not in playing state');
    if (playerId !== this.currentTurn) throw new Error('Not your turn');

    const shooter = playerId === 1 ? this.player1 : this.player2;
    const result = shooter.makeShot(row, col);

    if (!result.success) throw new Error(result.error);

    this.moveHistory.push({
      playerId,
      row,
      col,
      isHit: result.isHit,
      sunkShip: result.sunkShip,
      timestamp: new Date()
    });

    if (this.player1.hasLost()) {
      this.status = 'finished';
      this.winner = 2;
    } else if (this.player2.hasLost()) {
      this.status = 'finished';
      this.winner = 1;
    }

    if (!result.isHit) this.switchTurn();

    this.updatedAt = new Date();

    if (this.isVsAI && this.currentTurn === 2 && this.status === 'playing') {
      setTimeout(() => {
        try {
          const aiResult = this.makeAIShot();
          if (typeof this.onAIShotComplete === 'function') {
            this.onAIShotComplete(aiResult, this.getGameState(1));
          }
        } catch (error) {
          console.error('AI shot error:', error);
        }
      }, 3000);
    }

    return result;
  }

  makeAIShot() {
    if (!this.isVsAI || this.currentTurn !== 2)
      throw new Error('Invalid AI shot attempt');

    const result = this.player2.makeAIShot();

    this.moveHistory.push({
      playerId: 2,
      row: result.row,
      col: result.col,
      isHit: result.isHit,
      sunkShip: result.sunkShip,
      timestamp: new Date()
    });

    if (this.player2.hasWon()) {
      this.status = 'finished';
      this.winner = 2;
    }

    if (!result.isHit) this.switchTurn();

    this.updatedAt = new Date();
    return result;
  }

  switchTurn() {
    this.currentTurn = this.currentTurn === 1 ? 2 : 1;
  }

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
      yourBoard: {
        ships: player.board.ships.map(ship => ship.toJSON()),
        shots: player.board.shots
      },
      opponentBoard: {
        shots: opponent.board.shots,
        sunkShips: opponent.board.ships
          .filter(ship => ship.isSunk())
          .map(ship => ship.toJSON())
      },
      yourStats: player.getStats(),
      opponentStats: opponent.getStats(),
      recentMoves: this.moveHistory.slice(-10),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(data) {
    const game = new Game(data.id, data.player1.name, data.player2.name, data.isVsAI);
    game.status = data.status;
    game.currentTurn = data.currentTurn;
    game.winner = data.winner;
    game.moveHistory = data.moveHistory || [];
    game.createdAt = new Date(data.createdAt);
    game.updatedAt = new Date(data.updatedAt);
    game.player1 = Player.fromJSON(data.player1);
    game.player2 = Player.fromJSON(data.player2);
    game.player1.setTargetBoard(game.player2.board);
    game.player2.setTargetBoard(game.player1.board);
    return game;
  }
}

export default Game;
