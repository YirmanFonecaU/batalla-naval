
import Game from '../models/Game.js';
import GamePersistenceManager from '../persistence/GamePersistenceManager.js';
import Player from '../models/Player.js';



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

      console.log('🎮 joinGame llamado:', { gameId, playerName });

      // Buscar la partida
      const game = this.games.get(gameId);
      if (!game) {
        console.log('❌ Partida no encontrada:', gameId);
        return res.status(404).json({
          error: 'Game not found'
        });
      }

      // Evitar unirse a partidas contra IA
      if (game.isVsAI) {
        console.log('❌ Intento de unirse a partida contra IA');
        return res.status(400).json({
          error: 'Cannot join AI game'
        });
      }

      // ✅ VALIDACIÓN CORREGIDA: Verificar si player2 YA TIENE un nombre válido
      const player2HasName = game.player2 &&
        game.player2.name !== null &&
        game.player2.name !== undefined &&
        typeof game.player2.name === 'string' &&
        game.player2.name.trim() !== '';

      if (player2HasName) {
        console.log('❌ La partida ya está llena. Player2:', game.player2.name);
        return res.status(400).json({
          error: 'Game is full'
        });
      }

      // ✅ Verificar que el jugador 1 no intente unirse de nuevo
      // PERO permitir reconexión si la sesión se perdió
      if (
        game.player1 &&
        game.player1.name &&
        game.player1.name.trim().toLowerCase() === playerName.trim().toLowerCase()
      ) {
        console.log('⚠️ Player1 intentando unirse de nuevo - permitiendo reconexión:', playerName);
        // En lugar de rechazar, devolver el estado actual del jugador 1
        return res.status(200).json({
          success: true,
          message: 'Reconnected as player 1',
          gameState: game.getGameState(1),
          gameId: gameId,
          playerId: 1
        });
      }

      // ✅ CORRECCIÓN CRÍTICA: Asignar nombre al player2 existente
      if (game.player2) {
        game.player2.name = playerName.trim();
        console.log('✅ Nombre asignado a player2 existente:', playerName);
      } else {
        // Por si acaso player2 no existe (no debería pasar)
        console.warn('⚠️ player2 no existía, creándolo...');
        game.player2 = new Player(2, playerName.trim(), false);
      }

      // ✅ Configurar tableros
      if (game.player1 && game.player2) {
        game.player1.setTargetBoard(game.player2.board);
        game.player2.setTargetBoard(game.player1.board);
        console.log('✅ Tableros configurados para ambos jugadores');
      }

      console.log('✅ Player2 unido exitosamente:', {
        player1: game.player1.name,
        player2: game.player2.name
      });

      // ✅ Confirmar unión exitosa
      return res.status(200).json({
        success: true,
        message: 'Player joined successfully',
        gameState: game.getGameState(2),
        gameId: gameId,
        playerId: 2
      });

    } catch (error) {
      console.error('❌ Error in joinGame:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: error.message
      });
    }
  }


  // Configurar barcos del jugador
  // 🔥 REEMPLAZAR EL MÉTODO setShips EN GameController.js

  setShips(req, res) {
    try {
      console.log('🚢 setShips llamado'); // ✅ LOG 1

      const { gameId } = req.params;
      const { playerId, ships } = req.body;

      console.log('🔍 Datos recibidos:', { gameId, playerId, shipsCount: ships?.length }); // ✅ LOG 2

      const game = this.games.get(gameId);
      if (!game) {
        console.log('❌ Game no encontrado:', gameId); // ✅ LOG 3
        return res.status(404).json({
          error: 'Game not found'
        });
      }

      console.log('✅ Game encontrado'); // ✅ LOG 4

      if (!Array.isArray(ships) || ships.length !== 5) {
        console.log('❌ Cantidad de barcos inválida:', ships?.length); // ✅ LOG 5
        return res.status(400).json({
          error: 'Must provide exactly 5 ships'
        });
      }

      console.log('✅ Cantidad de barcos correcta'); // ✅ LOG 6

      // Validar formato de barcos
      const expectedSizes = [5, 4, 3, 2, 2];
      const providedSizes = ships.map(s => s.size).sort((a, b) => b - a);

      console.log('🔍 Tamaños esperados:', expectedSizes); // ✅ LOG 7
      console.log('🔍 Tamaños recibidos:', providedSizes); // ✅ LOG 8

      if (JSON.stringify(expectedSizes) !== JSON.stringify(providedSizes)) {
        console.log('❌ Tamaños de barcos inválidos'); // ✅ LOG 9
        return res.status(400).json({
          error: 'Invalid ship sizes'
        });
      }

      console.log('✅ Tamaños de barcos correctos'); // ✅ LOG 10
      console.log('🚀 Llamando a game.setPlayerShips...'); // ✅ LOG 11

      game.setPlayerShips(playerId, ships);

      console.log('✅ Barcos configurados exitosamente para jugador', playerId); // ✅ LOG 12
      console.log('🔍 Estado del juego:', game.status); // ✅ LOG 13
      console.log('🔍 Player1 ships placed:', game.player1.board.ships.every(s => s.placed)); // ✅ LOG 14
      console.log('🔍 Player2 ships placed:', game.player2.board.ships.every(s => s.placed)); // ✅ LOG 15

      const gameState = game.getGameState(playerId);
      console.log('✅ GameState generado'); // ✅ LOG 16

      res.json({
        success: true,
        message: 'Ships configured successfully',
        gameState: gameState
      });

      console.log('✅ Respuesta enviada correctamente'); // ✅ LOG 17

    } catch (error) {
      console.error('❌❌❌ ERROR EN setShips:', error); // ✅ LOG ERROR
      console.error('📋 Stack:', error.stack); // ✅ STACK TRACE
      res.status(400).json({
        error: 'Failed to set ships',
        details: error.message
      });
    }
  }

  // Realizar disparo
  makeShot(req, res) {
    try {
      console.log('🎯 makeShot llamado'); // ✅ AGREGAR
      const { gameId } = req.params;
      const { playerId, row, col } = req.body;
      console.log('🔍 Disparo:', { gameId, playerId, row, col }); // ✅ AGREGAR

      const game = this.games.get(gameId);
      if (!game) {
        console.log('❌ Game no encontrado'); // ✅ AGREGAR
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