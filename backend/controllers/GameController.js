
import Game from '../models/Game.js';
import GamePersistenceManager from '../persistence/GamePersistenceManager.js';



class GameController {
  constructor() {
    // En memoria para desarrollo. En producción usar base de datos
    this.games = new Map();
  }

  // Crear nueva partida
  createGame(req, res) {
    try {
      const { playerName, gameMode } = req.body; // gameMode: 'ai' o 'multiplayer'
      
      if (!playerName) {
        return res.status(400).json({ 
          error: 'Player name is required' 
        });
      }

      const gameId = this.generateGameId();
      const isVsAI = gameMode === 'ai';
      
      const game = new Game(
        gameId, 
        playerName, 
        isVsAI ? 'AI' : null, 
        isVsAI
      );

      this.games.set(gameId, game);

      res.status(201).json({
        success: true,
        gameId: gameId,
        message: 'Game created successfully',
        gameState: game.getGameState(1)
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to create game', 
        details: error.message 
      });
    }
  }

  // Unirse a partida existente (modo multijugador)
  joinGame(req, res) {
    try {
      const { gameId } = req.params;
      const { playerName } = req.body;

      const game = this.games.get(gameId);
      if (!game) {
        return res.status(404).json({ 
          error: 'Game not found' 
        });
      }

      if (game.isVsAI) {
        return res.status(400).json({ 
          error: 'Cannot join AI game' 
        });
      }

      if (game.player2.name !== null) {
        return res.status(400).json({ 
          error: 'Game is full' 
        });
      }

      // Actualizar segundo jugador
      game.player2.name = playerName;

      res.json({
        success: true,
        message: 'Joined game successfully',
        gameState: game.getGameState(2)
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to join game', 
        details: error.message 
      });
    }
  }

  // Configurar barcos del jugador
  setShips(req, res) {
    try {
      const { gameId } = req.params;
      const { playerId, ships } = req.body;

      const game = this.games.get(gameId);
      if (!game) {
        return res.status(404).json({ 
          error: 'Game not found' 
        });
      }

      if (!Array.isArray(ships) || ships.length !== 5) {
        return res.status(400).json({ 
          error: 'Must provide exactly 5 ships' 
        });
      }

      // Validar formato de barcos
      const expectedSizes = [5, 4, 3, 2, 2];
      const providedSizes = ships.map(s => s.size).sort((a, b) => b - a);
      
      if (JSON.stringify(expectedSizes) !== JSON.stringify(providedSizes)) {
        return res.status(400).json({ 
          error: 'Invalid ship sizes' 
        });
      }

      game.setPlayerShips(playerId, ships);

      res.json({
        success: true,
        message: 'Ships configured successfully',
        gameState: game.getGameState(playerId)
      });
    } catch (error) {
      res.status(400).json({ 
        error: 'Failed to set ships', 
        details: error.message 
      });
    }
  }

  // Realizar disparo
makeShot(req, res) {
  try {
    const { gameId } = req.params;
    const { playerId, row, col } = req.body;

    const game = this.games.get(gameId);
    if (!game) {
      return res.status(404).json({ 
        error: 'Game not found' 
      });
    }

    if (typeof row !== 'number' || typeof col !== 'number' || 
        row < 0 || row >= 10 || col < 0 || col >= 10) {
      return res.status(400).json({ 
        error: 'Invalid coordinates' 
      });
    }

    const result = game.makeShot(playerId, row, col);

    // 🔥 LOG TEMPORAL: Verificar que llega aquí
    console.log(`🎯 DISPARO RECIBIDO: ${playerId} -> [${row}, ${col}] en ${gameId}`);

    // Auto-guardar en segundo plano (no bloquea la respuesta)
    console.log(`💾 INICIANDO auto-guardado para ${gameId}...`);
    GamePersistenceManager.autoSaveGame(gameId, game.getGameState(playerId))
      .then(() => console.log(`✅ AUTO-GUARDADO EXITOSO: ${gameId}`))
      .catch(error => console.error(`❌ ERROR auto-guardando ${gameId}:`, error));

    res.json({
      success: true,
      shot: result,
      gameState: game.getGameState(playerId)
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Failed to make shot', 
      details: error.message 
    });
  }
}

  // Obtener estado del juego
  getGameState(req, res) {
    try {
      const { gameId } = req.params;
      const { playerId } = req.query;

      const game = this.games.get(gameId);
      if (!game) {
        return res.status(404).json({ 
          error: 'Game not found' 
        });
      }

      const playerIdNum = parseInt(playerId) || 1;
      const gameState = game.getGameState(playerIdNum);

      res.json({
        success: true,
        gameState
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get game state', 
        details: error.message 
      });
    }
  }

  // Obtener lista de partidas activas
  getActiveGames(req, res) {
    try {
      const activeGames = Array.from(this.games.values())
        .filter(game => game.status !== 'finished')
        .map(game => ({
          id: game.id,
          status: game.status,
          isVsAI: game.isVsAI,
          player1: game.player1.name,
          player2: game.player2.name,
          createdAt: game.createdAt
        }));

      res.json({
        success: true,
        games: activeGames
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get active games', 
        details: error.message 
      });
    }
  }

  // Eliminar partida
  deleteGame(req, res) {
    try {
      const { gameId } = req.params;

      const deleted = this.games.delete(gameId);
      if (!deleted) {
        return res.status(404).json({ 
          error: 'Game not found' 
        });
      }

      res.json({
        success: true,
        message: 'Game deleted successfully'
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to delete game', 
        details: error.message 
      });
    }
  }

  // Generar ID único para el juego
  generateGameId() {
    return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Obtener estadísticas del servidor
  getServerStats(req, res) {
    try {
      const totalGames = this.games.size;
      const activeGames = Array.from(this.games.values())
        .filter(game => game.status === 'playing').length;
      const finishedGames = Array.from(this.games.values())
        .filter(game => game.status === 'finished').length;

      res.json({
        success: true,
        stats: {
          totalGames,
          activeGames,
          finishedGames,
          setupGames: totalGames - activeGames - finishedGames
        }
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get server stats', 
        details: error.message 
      });
    }
  }
}

export default new GameController();