// backend/websocket/SocketHandler.js
/**
 * 🎯 PROPÓSITO: Manejar conexiones WebSocket para multijugador
 * 📍 UBICACIÓN: backend/websocket/ (carpeta que ya tienes)  
 * 🔧 RESPONSABILIDAD: Solo WebSockets, usar con tu GameController actual
 */

class SocketHandler {
  constructor(io, gameController) {
    this.io = io;
    this.gameController = gameController;
    this.connectedClients = new Map(); // Seguimiento de clientes conectados
    
    console.log('🔌 SocketHandler inicializado (básico)');
    console.log('   📡 WebSocket server listo');
  }

  /**
   * 🔌 MANEJAR nueva conexión de cliente
   * @param {Object} socket - Socket del cliente conectado
   */
  handleConnection(socket) {
    console.log(`🔌 Cliente conectado: ${socket.id}`);
    
    // Registrar cliente
    this.connectedClients.set(socket.id, {
      socketId: socket.id,
      connectedAt: new Date(),
      gameId: null
    });

    // Enviar mensaje de bienvenida
    socket.emit('connected', {
      message: '🎮 Conectado al servidor Batalla Naval',
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    // 📝 EVENTO: Cliente se desconecta
    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`);
      this.connectedClients.delete(socket.id);
    });

    // 🎮 EVENTOS DEL JUEGO (básicos por ahora)
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // 📊 EVENTO: Solicitar estadísticas
    socket.on('get-stats', () => {
      socket.emit('stats', {
        connectedClients: this.connectedClients.size,
        activeGames: this.gameController.games.size
      });
    });
  }

  /**
   * 📊 OBTENER estadísticas del servidor
   */
  getServerStats() {
    return {
      connectedClients: this.connectedClients.size,
      activeGames: this.gameController.games.size,
      uptime: process.uptime()
    };
  }
}

export default SocketHandler;