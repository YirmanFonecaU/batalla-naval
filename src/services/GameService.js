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
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io('http://localhost:3001');
    this.setupEventListeners();
    
    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('🔌 Conectado al servidor WebSocket');
        resolve();
      });
      
      this.socket.on('connect_error', (error) => {
        this.isConnected = false;
        console.error('❌ Error conectando al servidor:', error);
        reject(error);
      });
    });
  }

  // Configurar listeners de eventos
  setupEventListeners() {
    this.socket.on('connected', (data) => {
      console.log('✅ Conectado:', data.message);
      window.dispatchEvent(new CustomEvent('socketConnected', { detail: data }));
    });

    this.socket.on('game-created', (data) => {
      this.gameCode = data.gameCode;
      this.gameId = data.gameId;
      this.playerId = 1;
      window.dispatchEvent(new CustomEvent('gameCreated', { detail: data }));
    });

    this.socket.on('player-joined', (data) => {
      window.dispatchEvent(new CustomEvent('playerJoined', { detail: data }));
    });

    this.socket.on('ships-placed', (data) => {
      window.dispatchEvent(new CustomEvent('shipsPlaced', { detail: data }));
    });

    this.socket.on('game-ready', (data) => {
      window.dispatchEvent(new CustomEvent('gameReady', { detail: data }));
    });

    this.socket.on('shot-result', (data) => {
      window.dispatchEvent(new CustomEvent('shotResult', { detail: data }));
    });

    this.socket.on('game-over', (data) => {
      window.dispatchEvent(new CustomEvent('gameOver', { detail: data }));
    });

    this.socket.on('player-disconnected', (data) => {
      window.dispatchEvent(new CustomEvent('playerDisconnected', { detail: data }));
    });

    this.socket.on('error', (data) => {
      window.dispatchEvent(new CustomEvent('gameError', { detail: data }));
    });
  }

  // Crear partida
  createGame(playerName) {
    this.playerName = playerName;
    this.socket.emit('create-game', { playerName });
  }

  // Unirse a partida
  joinGame(gameCode, playerName) {
    this.gameCode = gameCode;
    this.playerName = playerName;
    this.socket.emit('join-game', { gameCode, playerName });
  }

  // Colocar barcos
  placeShips(ships) {
    this.socket.emit('place-ships', {
      gameId: this.gameId,
      ships: ships
    });
  }

  // Realizar disparo
  makeShot(row, col) {
    this.socket.emit('make-shot', {
      gameId: this.gameId,
      row: row,
      col: col
    });
  }

  // Desconectar
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  // Obtener estadísticas
  getStats() {
    this.socket.emit('get-stats');
  }
}

export default new GameService();