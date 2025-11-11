/**
 *  PROPÓSITO: Manejar conexiones WebSocket para multijugador
 */

class SocketHandler {
  constructor(io, gameController) {
    this.io = io;
    this.gameController = gameController;
    this.connectedClients = new Map(); // socket.id -> {socket, playerName, gameId, playerId}
    this.gameCodes = new Map(); // gameCode -> gameId
    this.playerGames = new Map(); // gameId -> {player1Socket, player2Socket}
    this.startTime = Date.now();

    console.log(' SocketHandler inicializado para multijugador');
  }

  /**
   * 🔌 MANEJAR nueva conexión de cliente
   */
  handleConnection(socket) {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // Registrar cliente
    this.connectedClients.set(socket.id, {
      socket: socket,
      playerName: null,
      gameId: null,
      playerId: null,
      connectedAt: new Date()
    });

    // Enviar mensaje de bienvenida
    socket.emit('connected', {
      message: ' Conectado al servidor Batalla Naval',
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    //  EVENTOS DEL JUEGO MULTIJUGADOR

    //  Crear partida
    socket.on('create-game', (data) => {
      this.handleCreateGame(socket, data);
    }); 

    //  Unirse a partida
    socket.on('join-game', (data) => {
      this.handleJoinGame(socket, data);
    });

    //  Colocar barcos
    socket.on('place-ships', (data) => {
      this.handlePlaceShips(socket, data);
    });

    //  Realizar disparo
    socket.on('make-shot', (data) => {
      this.handleMakeShot(socket, data);
    });

    //  EVENTO: Solicitar estadísticas
    socket.on('get-stats', () => {
      socket.emit('stats', {
        connectedClients: this.connectedClients.size,
        activeGames: this.gameController.games.size,
        waitingGames: this.gameCodes.size
      });
    });

    //  EVENTO: Cliente se desconecta
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });

    //  EVENTO: Ping/Pong
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });
  }

  /**
   *  CREAR PARTIDA
   */
  async handleCreateGame(socket, data) {
    try {
      const { playerName } = data;

      if (!playerName) {
        socket.emit('error', { message: 'El nombre de jugador es requerido' });
        return;
      }

      // Generar código de partida único
      const gameCode = this.generateGameCode();

      // Crear partida usando el GameController
      const mockReq = {
        body: { playerName, gameMode: 'multiplayer' }
      };

      const mockRes = {
        status: () => ({
          json: (responseData) => {
            if (responseData.success) {
              const gameId = responseData.gameId;

              // Registrar la partida con código
              this.gameCodes.set(gameCode, gameId);
              this.playerGames.set(gameId, { player1Socket: socket.id, player2Socket: null });

              // Actualizar información del cliente
              const clientData = this.connectedClients.get(socket.id);
              clientData.playerName = playerName;
              clientData.gameId = gameId;
              clientData.playerId = 1;

              // Unir socket a la sala del juego
              socket.join(gameId);

              console.log(` Partida creada: ${gameCode} -> ${gameId} por ${playerName}`);

              socket.emit('game-created', {
                success: true,
                gameCode: gameCode,
                gameId: gameId,
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
      console.error('Error creando partida:', error);
      socket.emit('error', { message: 'Error al crear partida' });
    }
  }

  /**
   *  UNIRSE A PARTIDA
   */
  async handleJoinGame(socket, data) {
    try {
      const { gameCode, playerName } = data;

      if (!gameCode || !playerName) {
        socket.emit('error', { message: 'Código y nombre de jugador son requeridos' });
        return;
      }

      const gameId = this.gameCodes.get(gameCode.toUpperCase());
      if (!gameId) {
        socket.emit('error', { message: 'Código de partida inválido' });
        return;
      }

      // Verificar si la partida existe en el GameController
      const game = this.gameController.games.get(gameId);
      if (!game) {
        socket.emit('error', { message: 'Partida no encontrada' });
        return;
      }

      // Verificar si ya hay dos jugadores
      const gameSockets = this.playerGames.get(gameId);
      if (gameSockets && gameSockets.player2Socket) {
        socket.emit('error', { message: 'La partida ya está llena' });
        return;
      }

      // Unirse a la partida usando el GameController
      const mockReq = {
        params: { gameId },
        body: { playerName }
      };

      const mockRes = {
        status: () => ({
          json: (responseData) => {
            if (responseData.success) {
              // Actualizar información de la partida
              gameSockets.player2Socket = socket.id;

              // Actualizar información del cliente
              const clientData = this.connectedClients.get(socket.id);
              clientData.playerName = playerName;
              clientData.gameId = gameId;
              clientData.playerId = 2;

              // Unir socket a la sala del juego
              socket.join(gameId);

              // Notificar a ambos jugadores
              this.io.to(gameId).emit('player-joined', {
                message: `${playerName} se unió a la partida`,
                gameState: responseData.gameState,
                players: {
                  player1: game.player1.name,
                  player2: playerName
                }
              });

              console.log(` ${playerName} se unió a la partida ${gameCode}`);
            } else {
              socket.emit('error', { message: responseData.error });
            }
          }
        })
      };

      await this.gameController.joinGame(mockReq, mockRes);

    } catch (error) {
      console.error('Error uniéndose a partida:', error);
      socket.emit('error', { message: 'Error al unirse a la partida' });
    }
  }

  /**
   *  COLOCAR BARCOS
   */
  async handlePlaceShips(socket, data) {
    try {
      const { gameId, ships } = data;
      const clientData = this.connectedClients.get(socket.id);

      if (!clientData || !clientData.playerId) {
        socket.emit('error', { message: 'Jugador no identificado' });
        return;
      }

      // Colocar barcos usando el GameController
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

              // Notificar al jugador
              socket.emit('ships-placed', {
                message: 'Barcos colocados exitosamente',
                gameState: responseData.gameState
              });

              // Si ambos jugadores están listos, comenzar el juego
              if (game && game.areAllPlayersReady()) {
                this.io.to(gameId).emit('game-ready', {
                  message: '¡Ambos jugadores están listos!',
                  gameState: responseData.gameState,
                  currentTurn: game.currentTurn
                });

                console.log(` Partida ${gameId} lista para comenzar`);
              }
            } else {
              socket.emit('error', { message: responseData.error });
            }
          }
        })
      };

      await this.gameController.setShips(mockReq, mockRes);

    } catch (error) {
      console.error('Error colocando barcos:', error);
      socket.emit('error', { message: 'Error al colocar barcos' });
    }
  }

  /**
   *  REALIZAR DISPARO
   */
  async handleMakeShot(socket, data) {
    try {
      const { gameId, row, col } = data;
      const clientData = this.connectedClients.get(socket.id);

      if (!clientData || !clientData.playerId) {
        socket.emit('error', { message: 'Jugador no identificado' });
        return;
      }

      // Realizar disparo usando el GameController
      const mockReq = {
        params: { gameId },
        body: {
          playerId: clientData.playerId,
          row: row,
          col: col
        }
      };

      const mockRes = {
        status: () => ({
          json: (responseData) => {
            if (responseData.success) {
              // Notificar a ambos jugadores con sus estados específicos
              const gameSockets = this.playerGames.get(gameId);
              const game = this.gameController.games.get(gameId);

              if (gameSockets && game) {
                // Enviar estado específico al jugador 1
                if (gameSockets.player1Socket) {
                  this.io.to(gameSockets.player1Socket).emit('shot-result', {
                    playerId: clientData.playerId,
                    playerName: clientData.playerName,
                    row: row,
                    col: col,
                    result: responseData.shot,
                    gameState: game.getGameState(1)
                  });
                }

                // Enviar estado específico al jugador 2
                if (gameSockets.player2Socket) {
                  this.io.to(gameSockets.player2Socket).emit('shot-result', {
                    playerId: clientData.playerId,
                    playerName: clientData.playerName,
                    row: row,
                    col: col,
                    result: responseData.shot,
                    gameState: game.getGameState(2)
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

                // Limpiar recursos de la partida
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
      console.error('Error realizando disparo:', error);
      socket.emit('error', { message: 'Error al realizar disparo' });
    }
  }

  /**
   *  MANEJAR DESCONEXIÓN
   */
  handleDisconnect(socket) {
    console.log(` Cliente desconectado: ${socket.id}`);

    const clientData = this.connectedClients.get(socket.id);
    if (clientData && clientData.gameId) {
      // Notificar al otro jugador si está en una partida
      const gameSockets = this.playerGames.get(clientData.gameId);
      if (gameSockets) {
        const otherPlayerSocket = clientData.playerId === 1 ?
          gameSockets.player2Socket : gameSockets.player1Socket;

        if (otherPlayerSocket) {
          this.io.to(otherPlayerSocket).emit('player-disconnected', {
            message: `${clientData.playerName} se desconectó`
          });
        }

        // Limpiar la partida
        this.cleanupGame(clientData.gameId);
      }
    }

    this.connectedClients.delete(socket.id);
  }

  /**
   *  LIMPIAR PARTIDA
   */
  cleanupGame(gameId) {
    // Encontrar y eliminar el código de la partida
    for (const [gameCode, id] of this.gameCodes.entries()) {
      if (id === gameId) {
        this.gameCodes.delete(gameCode);
        break;
      }
    }

    this.playerGames.delete(gameId);
  }

  /**
   *  GENERAR CÓDIGO DE PARTIDA
   */
  generateGameCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
  }

  /**
   *  OBTENER ESTADÍSTICAS DEL SERVIDOR
   */
  /**
 *  OBTENER ESTADÍSTICAS DEL SERVIDOR
 */
  getServerStats() {
    return {
      connectedClients: this.connectedClients.size,
      activeGames: this.gameController.games.size,
      waitingGames: this.gameCodes.size,
      uptime: Date.now() - this.startTime // ← Cambio aquí
    };
  }
}

export default SocketHandler;