// GameService.js
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
      this.socket.close();
    }

    this.socket = new WebSocket("ws://localhost:3001"); // <-- Cambia el puerto/URL si es necesario

    this.setupEventListeners();

    return new Promise((resolve, reject) => {
      this.socket.onopen = () => {
        this.isConnected = true;
        console.log("🔌 Conectado al servidor WebSocket");
        resolve();
      };

      this.socket.onerror = (error) => {
        this.isConnected = false;
        console.error("❌ Error conectando al servidor:", error);
        reject(error);
      };
    });
  }

  // Configurar listeners de eventos
  setupEventListeners() {
    this.socket.onmessage = (messageEvent) => {
      try {
        const data = JSON.parse(messageEvent.data);
        const { event, payload } = data;

        switch (event) {
          case "connected":
            console.log("✅ Conectado:", payload.message);
            window.dispatchEvent(new CustomEvent("socketConnected", { detail: payload }));
            break;

          case "game-created":
            this.gameCode = payload.gameCode;
            this.gameId = payload.gameId;
            this.playerId = 1;
            window.dispatchEvent(new CustomEvent("gameCreated", { detail: payload }));
            break;

          case "player-joined":
            window.dispatchEvent(new CustomEvent("playerJoined", { detail: payload }));
            break;

          case "ships-placed":
            window.dispatchEvent(new CustomEvent("shipsPlaced", { detail: payload }));
            break;

          case "game-ready":
            window.dispatchEvent(new CustomEvent("gameReady", { detail: payload }));
            break;

          case "shot-result":
            window.dispatchEvent(new CustomEvent("shotResult", { detail: payload }));
            break;

          case "game-over":
            window.dispatchEvent(new CustomEvent("gameOver", { detail: payload }));
            break;

          case "player-disconnected":
            window.dispatchEvent(new CustomEvent("playerDisconnected", { detail: payload }));
            break;

          case "error":
            window.dispatchEvent(new CustomEvent("gameError", { detail: payload }));
            break;

          default:
            console.warn("Evento desconocido:", event, payload);
        }
      } catch (err) {
        console.error("Error procesando mensaje WS:", err);
      }
    };
  }

  // Enviar mensajes al servidor
  send(event, payload = {}) {
    if (!this.isConnected) {
      console.warn("⚠️ No conectado al servidor WebSocket");
      return;
    }

    const message = JSON.stringify({ event, payload });
    this.socket.send(message);
  }

  // Crear partida
  createGame(playerName) {
    this.playerName = playerName;
    this.send("create-game", { playerName });
  }

  // Unirse a partida
  joinGame(gameCode, playerName) {
    this.gameCode = gameCode;
    this.playerName = playerName;
    this.send("join-game", { gameCode, playerName });
  }

  // Colocar barcos
  placeShips(ships) {
    this.send("place-ships", {
      gameId: this.gameId,
      ships,
    });
  }

  // Realizar disparo
  makeShot(row, col) {
    this.send("make-shot", {
      gameId: this.gameId,
      row,
      col,
    });
  }

  // Obtener estadísticas
  getStats() {
    this.send("get-stats");
  }

  // Desconectar
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.isConnected = false;
      console.log("🔌 Desconectado del servidor WebSocket");
    }
  }
}

export default new GameService();
