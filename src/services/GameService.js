import { io } from 'socket.io-client';

class GameService {
  constructor() {
    this.socket = null;
    this.gameCode = null;
    this.gameId = null;
    this.playerId = null;
    this.playerName = null;
    this.isConnected = false;
  }

  // Conectar al servidor WebSocket
  connect() {
    if (this.socket && this.socket.connected) {
      console.log('⚠️ Ya hay una conexión activa');
      return Promise.resolve();
    }

<<<<<<< Updated upstream
    // Desconectar cualquier socket anterior
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    console.log('🔌 Intentando conectar a WebSocket...');

    this.socket = io('https://magnetically-predenial-memphis.ngrok-free.dev', {
      transports: ["websocket", "polling"],  // ✅ Agregar polling como fallback
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 10000  // ✅ Timeout de 10 segundos
    });

=======
    this.socket = io('https://magnetically-predenial-memphis.ngrok-free.dev', {
      transports: ["websocket"],
      reconnection: true,              // ✅ Habilitar reconexión automática
      reconnectionDelay: 1000,         // ✅ Esperar 1 segundo entre intentos
      reconnectionDelayMax: 5000,      // ✅ Máximo 5 segundos
      reconnectionAttempts: 5          // ✅ Intentar 5 veces
    });
>>>>>>> Stashed changes
    this.setupEventListeners();
    this.setupReconnectionHandlers();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout conectando al servidor'));
      }, 10000);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        this.isConnected = true;
        console.log('✅ Conectado al servidor WebSocket');
        console.log('🆔 Socket ID:', this.socket.id);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        this.isConnected = false;
        console.error('❌ Error conectando al servidor:', error.message);
        reject(error);
      });
    });
  }
  // ✅ NUEVO MÉTODO: Manejar reconexiones
  setupReconnectionHandlers() {
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Intento de reconexión #${attemptNumber}`);
      window.dispatchEvent(new CustomEvent('reconnecting', {
        detail: { attempt: attemptNumber }
      }));
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.isConnected = true;
      console.log(`✅ Reconectado después de ${attemptNumber} intentos`);
      window.dispatchEvent(new CustomEvent('reconnected', {
        detail: { attempts: attemptNumber }
      }));
    });

    this.socket.on('reconnect_failed', () => {
      this.isConnected = false;
      console.error('❌ Falló la reconexión después de todos los intentos');
      window.dispatchEvent(new CustomEvent('reconnectionFailed'));
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log(`🔌 Desconectado: ${reason}`);
      window.dispatchEvent(new CustomEvent('socketDisconnected', {
        detail: { reason }
      }));
    });
  }

  // ✅ Manejar reconexiones
  setupReconnectionHandlers() {
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Intento de reconexión #${attemptNumber}`);
      window.dispatchEvent(new CustomEvent('reconnecting', {
        detail: { attempt: attemptNumber }
      }));
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.isConnected = true;
      console.log(`✅ Reconectado después de ${attemptNumber} intentos`);
      window.dispatchEvent(new CustomEvent('reconnected', {
        detail: { attempts: attemptNumber }
      }));
    });

    this.socket.on('reconnect_failed', () => {
      this.isConnected = false;
      console.error('❌ Falló la reconexión después de todos los intentos');
      window.dispatchEvent(new CustomEvent('reconnectionFailed'));
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log(`🔌 Desconectado: ${reason}`);
      
      // Si fue desconexión del servidor, intentar reconectar
      if (reason === 'io server disconnect') {
        console.log('🔄 Reconectando...');
        this.socket.connect();
      }
      
      window.dispatchEvent(new CustomEvent('socketDisconnected', {
        detail: { reason }
      }));
    });
  }

  // Configurar listeners de eventos
  setupEventListeners() {
    this.socket.on('connected', (data) => {
      console.log('✅ Mensaje del servidor:', data.message);
      window.dispatchEvent(new CustomEvent('socketConnected', { detail: data }));
    });

    this.socket.on('game-created', (data) => {
      console.log('🎮 game-created recibido:', data);
      
      // ✅ CRÍTICO: Guardar TODOS los datos inmediatamente
      this.gameCode = data.gameCode;
      this.gameId = data.gameId;
      this.playerId = data.playerId || 1;  // ✅ Usar el playerId del servidor
      
      console.log('📝 GameService actualizado:');
      console.log('  - gameCode:', this.gameCode);
      console.log('  - gameId:', this.gameId);
      console.log('  - playerId:', this.playerId);
      
      window.dispatchEvent(new CustomEvent('gameCreated', { detail: data }));
    });

    this.socket.on('player-joined', (data) => {
      console.log('👥 player-joined recibido:', data);
      
      // ✅ Si somos el jugador 2, actualizar nuestros datos
      if (data.playerId === 2) {
        this.playerId = 2;
        this.gameId = data.gameId;
        console.log('📝 P2 - GameService actualizado:');
        console.log('  - gameId:', this.gameId);
        console.log('  - playerId:', this.playerId);
      }
      
      window.dispatchEvent(new CustomEvent('playerJoined', { detail: data }));
    });

    this.socket.on('ships-placed', (data) => {
      console.log('🚢 ships-placed recibido:', data);
      window.dispatchEvent(new CustomEvent('shipsPlaced', { detail: data }));
    });

    this.socket.on('game-ready', (data) => {
      console.log('🎮 game-ready recibido:', data);
      console.log('  - Status:', data.gameState?.status);
      console.log('  - Turno:', data.currentTurn);
      console.log('  - Es mi turno:', data.gameState?.isYourTurn);
      window.dispatchEvent(new CustomEvent('gameReady', { detail: data }));
    });

    this.socket.on('shot-result', (data) => {
      console.log('🎯 shot-result recibido:', data);
      window.dispatchEvent(new CustomEvent('shotResult', { detail: data }));
    });

    this.socket.on('game-over', (data) => {
      console.log('🏁 game-over recibido:', data);
      window.dispatchEvent(new CustomEvent('gameOver', { detail: data }));
    });

    this.socket.on('player-disconnected', (data) => {
      console.log('⚠️ player-disconnected recibido:', data);
      window.dispatchEvent(new CustomEvent('playerDisconnected', { detail: data }));
    });

    this.socket.on('error', (data) => {
      console.error('❌ error recibido del servidor:', data);
      window.dispatchEvent(new CustomEvent('gameError', { detail: data }));
    });
  }

  // Crear partida
  createGame(playerName) {
    if (!this.socket || !this.socket.connected) {
      console.error('❌ Socket no conectado');
      return;
    }

    console.log('📤 Enviando create-game:', { playerName });
    this.playerName = playerName;
    this.socket.emit('create-game', { playerName });
  }

  // Unirse a partida
  joinGame(gameCode, playerName) {
    if (!this.socket || !this.socket.connected) {
      console.error('❌ Socket no conectado');
      return;
    }

    console.log('📤 Enviando join-game:', { gameCode, playerName });
    this.gameCode = gameCode.toUpperCase();
    this.playerName = playerName;
    this.socket.emit('join-game', { gameCode: this.gameCode, playerName });
  }

  // Colocar barcos
  placeShips(ships) {
    if (!this.socket || !this.socket.connected) {
      console.error('❌ Socket no conectado');
      return;
    }

    if (!this.gameId) {
      console.error('❌ No hay gameId definido');
      console.error('📊 Estado actual:', {
        gameId: this.gameId,
        gameCode: this.gameCode,
        playerId: this.playerId
      });
      return;
    }

    console.log('📤 Enviando place-ships:');
    console.log('  - gameId:', this.gameId);
    console.log('  - ships:', ships);
    console.log('  - Cantidad de barcos:', ships.length);
    
    this.socket.emit('place-ships', {
      gameId: this.gameId,
      ships: ships
    });
  }

  // Realizar disparo
  makeShot(row, col) {
    if (!this.socket || !this.socket.connected) {
      console.error('❌ Socket no conectado');
      return;
    }

    if (!this.gameId) {
      console.error('❌ No hay gameId definido');
      return;
    }

    console.log('📤 Enviando make-shot:', {
      gameId: this.gameId,
      row,
      col
    });

    this.socket.emit('make-shot', {
      gameId: this.gameId,
      row: row,
      col: col
    });
  }

  // Desconectar
  disconnect() {
    console.log('🔌 Desconectando...');
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Limpiar datos
    this.isConnected = false;
    this.gameCode = null;
    this.gameId = null;
    this.playerId = null;
    this.playerName = null;
    
    console.log('✅ Desconectado y datos limpiados');
  }

  // Obtener estadísticas
  getStats() {
    if (!this.socket || !this.socket.connected) {
      console.error('❌ Socket no conectado');
      return;
    }

    this.socket.emit('get-stats');
  }

  // ✅ NUEVO: Método para debug
  logCurrentState() {
    console.log('📊 Estado actual de GameService:');
    console.log('  - Conectado:', this.isConnected);
    console.log('  - Socket ID:', this.socket?.id);
    console.log('  - gameCode:', this.gameCode);
    console.log('  - gameId:', this.gameId);
    console.log('  - playerId:', this.playerId);
    console.log('  - playerName:', this.playerName);
  }
}

export default new GameService();