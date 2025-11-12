/**
 * 🛠️ SOCKETHANDLER.JS - VERSIÓN CORREGIDA COMPLETA
 */

class SocketHandler {
  constructor(io, gameController) {
    this.io = io;
    this.gameController = gameController;
    this.connectedClients = new Map();
    this.gameCodes = new Map();
    this.playerGames = new Map();
    this.startTime = Date.now();

    console.log('✅ SocketHandler inicializado para multijugador');
  }

  handleConnection(socket) {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    this.connectedClients.set(socket.id, {
      socket: socket,
      playerName: null,
      gameId: null,
      playerId: null,
      connectedAt: new Date()
    });

    socket.emit('connected', {
      message: '✅ Conectado al servidor Batalla Naval',
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    socket.on('create-game', (data) => this.handleCreateGame(socket, data));
    socket.on('join-game', (data) => this.handleJoinGame(socket, data));
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    socket.on('place-ships', (data) =>{ 
        console.log('🚢 EVENTO place-ships RECIBIDO:', data);  // ✅ AGREGAR

      this.handlePlaceShips(socket, data)});
=======
    socket.on('place-ships', (data) => this.handlePlaceShips(socket, data));
>>>>>>> Stashed changes
=======
    socket.on('place-ships', (data) => this.handlePlaceShips(socket, data));
>>>>>>> Stashed changes
    socket.on('make-shot', (data) => this.handleMakeShot(socket, data));
    socket.on('get-stats', () => socket.emit('stats', this.getServerStats()));
    socket.on('disconnect', () => this.handleDisconnect(socket));
    socket.on('ping', () => socket.emit('pong', { timestamp: new Date().toISOString() }));
  }

  /**
   * ✅ CREAR PARTIDA (sin cambios necesarios)
   */
  async handleCreateGame(socket, data) {
    try {
      const { playerName } = data;

      if (!playerName) {
        socket.emit('error', { message: 'El nombre de jugador es requerido' });
        return;
      }

      const gameCode = this.generateGameCode();

      const mockReq = {
        body: { playerName, gameMode: 'multiplayer' }
      };

      const mockRes = {
        status: () => ({
          json: (responseData) => {
            if (responseData.success) {
              const gameId = responseData.gameId;

              this.gameCodes.set(gameCode, gameId);
              this.playerGames.set(gameId, { player1Socket: socket.id, player2Socket: null });

              const clientData = this.connectedClients.get(socket.id);
              clientData.playerName = playerName;
              clientData.gameId = gameId;
              clientData.playerId = 1;

              socket.join(gameId);

              console.log(`🎮 Partida creada: ${gameCode} -> ${gameId} por ${playerName}`);

              socket.emit('game-created', {
                success: true,
                gameCode: gameCode,
                gameId: gameId,
                playerId: 1,
                gameState: responseData.gameState,
                message: 'Partida creada exitosamente'
              });
            } else {
              socket.emit('error', { message: responseData.error });
            }
          }
        })
      };

      await this.gameController.createGame(mockReq, mockRes);

    } catch (error) {
      console.error('❌ Error creando partida:', error);
      socket.emit('error', { message: 'Error al crear partida' });
    }
  }

  /**
   * ✅ UNIRSE A PARTIDA
   */
  async handleJoinGame(socket, data) {
    try {
      console.log('🔍 handleJoinGame INICIO:', data); // ✅ AGREGAR

      const { gameCode, playerName } = data;

      if (!gameCode || !playerName) {
        console.log('❌ Falta gameCode o playerName'); // ✅ AGREGAR
        socket.emit('error', { message: 'Código y nombre de jugador son requeridos' });
        return;
      }

      const gameId = this.gameCodes.get(gameCode.toUpperCase());
      console.log('🔍 gameId encontrado:', gameId); // ✅ AGREGAR

      if (!gameId) {
        console.log('❌ Código inválido:', gameCode); // ✅ AGREGAR
        socket.emit('error', { message: 'Código de partida inválido' });
        return;
      }

      const game = this.gameController.games.get(gameId);
      console.log('🔍 Game encontrado:', !!game); // ✅ AGREGAR
      console.log('🔍 Game.player2:', game?.player2); // ✅ AGREGAR

      // ... resto del código

      const gameSockets = this.playerGames.get(gameId);
      if (gameSockets && gameSockets.player2Socket) {
        socket.emit('error', { message: 'La partida ya está llena' });
        return;
      }

      const mockReq = {
        params: { gameId },
        body: { playerName }
      };

      const mockRes = {
        status: () => ({
          json: (responseData) => {
            if (responseData.success) {
              gameSockets.player2Socket = socket.id;

              const clientData = this.connectedClients.get(socket.id);
              clientData.playerName = playerName;
              clientData.gameId = gameId;
              clientData.playerId = 2;

              socket.join(gameId);

              // Notificar al jugador 1
              if (gameSockets.player1Socket) {
                this.io.to(gameSockets.player1Socket).emit('player-joined', {
                  message: `${playerName} se unió a la partida`,
                  opponent: {
                    name: playerName,
                    id: 2
                  }
                });
              }

              // Notificar al jugador 2
              socket.emit('player-joined', {
                success: true,
                message: 'Te uniste a la partida',
                gameState: responseData.gameState,
                gameId: gameId,
                playerId: 2,
                opponent: {
                  name: game.player1.name,
                  id: 1
                }
              });

              console.log(`✅ ${playerName} se unió a la partida ${gameCode}`);
            } else {
              socket.emit('error', { message: responseData.error });
            }
          }
        })
      };

      await this.gameController.joinGame(mockReq, mockRes);

    } catch (error) {
      console.error('❌ Error uniéndose a partida:', error);
      socket.emit('error', { message: 'Error al unirse a la partida' });
    }
  }

  /**
   * 🔥 COLOCAR BARCOS - CORRECCIÓN CRÍTICA
   */
<<<<<<< Updated upstream
  /**
 * 🔥 COLOCAR BARCOS - VERSIÓN CORREGIDA SIN MOCK
 */
async handlePlaceShips(socket, data) {
  try {
    console.log('🚢 handlePlaceShips recibido:', data);
    console.log('🔍 ships:', JSON.stringify(data.ships, null, 2));

    const { gameId, ships } = data;
    const clientData = this.connectedClients.get(socket.id);

    if (!clientData || !clientData.playerId) {
      console.log('❌ Cliente no identificado');
      socket.emit('error', { message: 'Jugador no identificado' });
      return;
    }

    console.log('✅ Cliente identificado:', {
      playerId: clientData.playerId,
      playerName: clientData.playerName
    });

    // 🔥 LLAMAR DIRECTAMENTE AL GAME SIN MOCK
    const game = this.gameController.games.get(gameId);
    
    if (!game) {
      console.log('❌ Game no encontrado:', gameId);
      socket.emit('error', { message: 'Partida no encontrada' });
      return;
    }

    console.log('✅ Game encontrado');

    // Validar barcos
    if (!Array.isArray(ships) || ships.length !== 5) {
      console.log('❌ Cantidad de barcos inválida:', ships?.length);
      socket.emit('error', { message: 'Debe proporcionar exactamente 5 barcos' });
      return;
    }

    const expectedSizes = [5, 4, 3, 2, 2];
    const providedSizes = ships.map(s => s.size).sort((a, b) => b - a);

    if (JSON.stringify(expectedSizes) !== JSON.stringify(providedSizes)) {
      console.log('❌ Tamaños de barcos inválidos');
      console.log('  Esperados:', expectedSizes);
      console.log('  Recibidos:', providedSizes);
      socket.emit('error', { message: 'Tamaños de barcos inválidos' });
      return;
    }

    console.log('✅ Validaciones pasadas, colocando barcos...');

    // 🔥 COLOCAR BARCOS DIRECTAMENTE
=======
  async handlePlaceShips(socket, data) {
    try {
      const { gameId, ships } = data;
      const clientData = this.connectedClients.get(socket.id);

      if (!clientData || !clientData.playerId) {
        socket.emit('error', { message: 'Jugador no identificado' });
        return;
      }

      const mockReq = {
        params: { gameId },
        body: {
          playerId: clientData.playerId,
          ships: ships
        }
      };

      const mockRes = {
        status: () => ({
          json: (responseData) => {
            if (responseData.success) {
              const game = this.gameController.games.get(gameId);

              // Notificar al jugador que colocó los barcos
              socket.emit('ships-placed', {
                message: 'Barcos colocados exitosamente',
                gameState: responseData.gameState
              });

              // 🔥 CAMBIO CRÍTICO: Usar areAllShipsPlaced() en lugar de areAllPlayersReady()
              if (game && game.areAllShipsPlaced()) {
                const gameSockets = this.playerGames.get(gameId);

                if (gameSockets) {
                  // Obtener estados específicos para cada jugador
                  const player1State = game.getGameState(1);
                  const player2State = game.getGameState(2);

                  // ✅ Agregar nombres de jugadores al estado
                  player1State.players = {
                    player1: game.player1.name,
                    player2: game.player2.name
                  };
                  player2State.players = {
                    player1: game.player1.name,
                    player2: game.player2.name
                  };

                  // Enviar a jugador 1
                  if (gameSockets.player1Socket) {
                    this.io.to(gameSockets.player1Socket).emit('game-ready', {
                      message: '¡Ambos jugadores están listos! El juego comienza.',
                      gameState: player1State,
                      currentTurn: game.currentTurn
                    });
                  }

                  // Enviar a jugador 2
                  if (gameSockets.player2Socket) {
                    this.io.to(gameSockets.player2Socket).emit('game-ready', {
                      message: '¡Ambos jugadores están listos! El juego comienza.',
                      gameState: player2State,
                      currentTurn: game.currentTurn
                    });
                  }

                  console.log(`🎮 Partida ${gameId} INICIADA - Status: ${game.status} - Turno: ${game.currentTurn}`);
                }
              } else {
                console.log(`⏳ Esperando al otro jugador en ${gameId}`);
              }
            } else {
              socket.emit('error', { message: responseData.error });
            }
          }
        })
      };

      await this.gameController.setShips(mockReq, mockRes);

    } catch (error) {
      console.error('❌ Error colocando barcos:', error);
      socket.emit('error', { message: 'Error al colocar barcos' });
    }
  }

  /**
   * ✅ REALIZAR DISPARO (sin cambios necesarios)
   */
  async handleMakeShot(socket, data) {
>>>>>>> Stashed changes
    try {
      game.setPlayerShips(clientData.playerId, ships);
      console.log(`✅ Barcos colocados para jugador ${clientData.playerId}`);
    } catch (shipError) {
      console.error('❌ Error al colocar barcos:', shipError.message);
      socket.emit('error', { message: `Error al colocar barcos: ${shipError.message}` });
      return;
    }

    // Obtener estado del juego
    const gameState = game.getGameState(clientData.playerId);

    // Notificar al jugador que colocó los barcos
    socket.emit('ships-placed', {
      message: 'Barcos colocados exitosamente',
      gameState: gameState
    });

    console.log(`✅ Notificación ships-placed enviada a jugador ${clientData.playerId}`);

    // 🔥 VERIFICAR SI AMBOS JUGADORES ESTÁN LISTOS
    console.log('🔍 Verificando si ambos jugadores están listos...');
    console.log('  Player1 ships placed:', game.player1.board.ships.every(s => s.placed));
    console.log('  Player2 ships placed:', game.player2.board.ships.every(s => s.placed));
    console.log('  areAllShipsPlaced():', game.areAllShipsPlaced());

    if (game.areAllShipsPlaced()) {
      console.log('🎮 ¡AMBOS JUGADORES LISTOS! Iniciando juego...');
      
      const gameSockets = this.playerGames.get(gameId);

      if (gameSockets) {
        // Obtener estados específicos para cada jugador
        const player1State = game.getGameState(1);
        const player2State = game.getGameState(2);

        // ✅ Agregar nombres de jugadores al estado
        player1State.players = {
          player1: game.player1.name,
          player2: game.player2.name
        };
        player2State.players = {
          player1: game.player1.name,
          player2: game.player2.name
        };

        console.log('📤 Enviando game-ready a ambos jugadores...');

        // Enviar a jugador 1
        if (gameSockets.player1Socket) {
          this.io.to(gameSockets.player1Socket).emit('game-ready', {
            message: '¡Ambos jugadores están listos! El juego comienza.',
            gameState: player1State,
            currentTurn: game.currentTurn
          });
          console.log('  ✅ game-ready enviado a P1');
        }

        // Enviar a jugador 2
        if (gameSockets.player2Socket) {
          this.io.to(gameSockets.player2Socket).emit('game-ready', {
            message: '¡Ambos jugadores están listos! El juego comienza.',
            gameState: player2State,
            currentTurn: game.currentTurn
          });
          console.log('  ✅ game-ready enviado a P2');
        }

        console.log(`🎮 Partida ${gameId} INICIADA - Status: ${game.status} - Turno: ${game.currentTurn}`);
      } else {
        console.error('❌ No se encontraron sockets de la partida');
      }
    } else {
      console.log(`⏳ Esperando al otro jugador en ${gameId}`);
    }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
  } catch (error) {
    console.error('❌❌❌ ERROR EN handlePlaceShips:', error);
    console.error('📋 Stack:', error.stack);
    socket.emit('error', { message: 'Error al colocar barcos' });
  }
}
  /**
   * ✅ REALIZAR DISPARO (sin cambios necesarios)
   */
  /**
 * 🔥 REALIZAR DISPARO - VERSIÓN CORREGIDA SIN MOCK
 */
async handleMakeShot(socket, data) {
  try {
    console.log('🎯 handleMakeShot recibido:', data);
    
    const { gameId, row, col } = data;
    const clientData = this.connectedClients.get(socket.id);

    if (!clientData || !clientData.playerId) {
      console.log('❌ Cliente no identificado');
      socket.emit('error', { message: 'Jugador no identificado' });
      return;
    }

    console.log('✅ Cliente identificado:', {
      playerId: clientData.playerId,
      playerName: clientData.playerName,
      disparo: { row, col }
    });

    // Validar coordenadas
    if (typeof row !== 'number' || typeof col !== 'number' ||
        row < 0 || row >= 10 || col < 0 || col >= 10) {
      console.log('❌ Coordenadas inválidas:', { row, col });
      socket.emit('error', { message: 'Coordenadas inválidas' });
      return;
    }

    // 🔥 OBTENER EL JUEGO DIRECTAMENTE
    const game = this.gameController.games.get(gameId);
    
    if (!game) {
      console.log('❌ Game no encontrado:', gameId);
      socket.emit('error', { message: 'Partida no encontrada' });
      return;
    }

    console.log('✅ Game encontrado');
    console.log('🔍 Estado del juego:', {
      status: game.status,
      currentTurn: game.currentTurn,
      playerId: clientData.playerId
    });

    // Verificar que sea el turno del jugador
    if (game.status !== 'playing') {
      console.log('❌ El juego no está en estado playing:', game.status);
      socket.emit('error', { message: 'El juego no está en curso' });
      return;
    }

    if (game.currentTurn !== clientData.playerId) {
      console.log('❌ No es el turno del jugador:', {
        currentTurn: game.currentTurn,
        playerId: clientData.playerId
      });
      socket.emit('error', { message: 'No es tu turno' });
      return;
    }

    console.log('✅ Validaciones pasadas, realizando disparo...');

    // 🔥 REALIZAR DISPARO DIRECTAMENTE
    let result;
    try {
      result = game.makeShot(clientData.playerId, row, col);
      console.log('✅ Disparo realizado:', result);
    } catch (shotError) {
      console.error('❌ Error al realizar disparo:', shotError.message);
      socket.emit('error', { message: `Error al disparar: ${shotError.message}` });
      return;
    }

    // Obtener estados específicos de cada jugador
    const gameSockets = this.playerGames.get(gameId);
    
    if (gameSockets) {
      // Enviar estado específico al jugador 1
      if (gameSockets.player1Socket) {
        const player1State = game.getGameState(1);
        player1State.players = {
          player1: game.player1.name,
          player2: game.player2.name
        };

        this.io.to(gameSockets.player1Socket).emit('shot-result', {
=======
=======
>>>>>>> Stashed changes
      const mockReq = {
        params: { gameId },
        body: {
>>>>>>> Stashed changes
          playerId: clientData.playerId,
          playerName: clientData.playerName,
          row: row,
          col: col,
          result: result,
          gameState: player1State
        });
        console.log('  ✅ shot-result enviado a P1');
      }

<<<<<<< Updated upstream
      // Enviar estado específico al jugador 2
      if (gameSockets.player2Socket) {
        const player2State = game.getGameState(2);
        player2State.players = {
          player1: game.player1.name,
          player2: game.player2.name
        };

        this.io.to(gameSockets.player2Socket).emit('shot-result', {
          playerId: clientData.playerId,
          playerName: clientData.playerName,
          row: row,
          col: col,
          result: result,
          gameState: player2State
        });
        console.log('  ✅ shot-result enviado a P2');
      }
=======
      const mockRes = {
        status: () => ({
          json: (responseData) => {
            if (responseData.success) {
              const gameSockets = this.playerGames.get(gameId);
              const game = this.gameController.games.get(gameId);

              if (gameSockets && game) {
                // Enviar estado específico al jugador 1
                if (gameSockets.player1Socket) {
                  const player1State = game.getGameState(1);
                  player1State.players = {
                    player1: game.player1.name,
                    player2: game.player2.name
                  };

                  this.io.to(gameSockets.player1Socket).emit('shot-result', {
                    playerId: clientData.playerId,
                    playerName: clientData.playerName,
                    row: row,
                    col: col,
                    result: responseData.shot,
                    gameState: player1State
                  });
                }

                // Enviar estado específico al jugador 2
                if (gameSockets.player2Socket) {
                  const player2State = game.getGameState(2);
                  player2State.players = {
                    player1: game.player1.name,
                    player2: game.player2.name
                  };

                  this.io.to(gameSockets.player2Socket).emit('shot-result', {
                    playerId: clientData.playerId,
                    playerName: clientData.playerName,
                    row: row,
                    col: col,
                    result: responseData.shot,
                    gameState: player2State
                  });
                }
              }

              // Verificar si el juego terminó
              if (game && game.status === 'finished') {
                this.io.to(gameId).emit('game-over', {
                  winner: game.winner,
                  winnerName: game.winner === 1 ? game.player1.name : game.player2.name,
                  message: `¡${game.winner === 1 ? game.player1.name : game.player2.name} ha ganado!`
                });

                this.cleanupGame(gameId);
              }
            } else {
              socket.emit('error', { message: responseData.error });
            }
          }
        })
      };

      await this.gameController.makeShot(mockReq, mockRes);

    } catch (error) {
      console.error('❌ Error realizando disparo:', error);
      socket.emit('error', { message: 'Error al realizar disparo' });
>>>>>>> Stashed changes
    }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
    // Verificar si el juego terminó
    if (game.status === 'finished') {
      console.log('🏁 ¡Juego terminado! Ganador:', game.winner);
      
      this.io.to(gameId).emit('game-over', {
        winner: game.winner,
        winnerName: game.winner === 1 ? game.player1.name : game.player2.name,
        message: `¡${game.winner === 1 ? game.player1.name : game.player2.name} ha ganado!`
      });

      this.cleanupGame(gameId);
    }

    console.log('✅ Disparo procesado correctamente');

  } catch (error) {
    console.error('❌❌❌ ERROR EN handleMakeShot:', error);
    console.error('📋 Stack:', error.stack);
    socket.emit('error', { message: 'Error al procesar disparo' });
  }
}

=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  handleDisconnect(socket) {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);

    const clientData = this.connectedClients.get(socket.id);
    if (clientData && clientData.gameId) {
      const gameSockets = this.playerGames.get(clientData.gameId);
      if (gameSockets) {
        const otherPlayerSocket = clientData.playerId === 1 ?
          gameSockets.player2Socket : gameSockets.player1Socket;

        if (otherPlayerSocket) {
          this.io.to(otherPlayerSocket).emit('player-disconnected', {
            message: `${clientData.playerName} se desconectó`
          });
        }

        this.cleanupGame(clientData.gameId);
      }
    }

    this.connectedClients.delete(socket.id);
  }

  cleanupGame(gameId) {
    for (const [gameCode, id] of this.gameCodes.entries()) {
      if (id === gameId) {
        this.gameCodes.delete(gameCode);
        break;
      }
    }

    this.playerGames.delete(gameId);
  }

  generateGameCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
  }

  getServerStats() {
    return {
      connectedClients: this.connectedClients.size,
      activeGames: this.gameController.games.size,
      waitingGames: this.gameCodes.size,
      uptime: Date.now() - this.startTime
    };
  }
}

export default SocketHandler;