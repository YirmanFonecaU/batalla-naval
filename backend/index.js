
import gameController from "./controllers/GameController.js";
import express from "express";
import cors from "cors";
const app = express();
const PORT = 3001; 


// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ 
    message: "API Batalla Naval funcionando 🚀", 
    version: "2.0.0",
    activeGames: gameController.games.size,
    endpoints: {
      info: [
        "GET / - Estado del servidor",
        "GET /api/status - Estado de la API",
        "GET /api/stats - Estadísticas del servidor"
      ],
      games: [
        "POST /api/games/create - Crear nueva partida",
        "POST /api/games/:gameId/join - Unirse a partida",
        "POST /api/games/:gameId/ships - Configurar barcos",
        "POST /api/games/:gameId/shot - Realizar disparo",
        "GET /api/games/:gameId/state - Estado del juego",
        "GET /api/games - Juegos activos"
      ]
    }
  });
});

// Rutas de la API del juego
app.get("/api/status", (req, res) => {
  res.json({ 
    status: "active", 
    message: "API Batalla Naval lista para jugar" 
  });
});

// 🎮 RUTAS DEL JUEGO (Conectadas al GameController)
app.post("/api/games/create", (req, res) => {
  gameController.createGame(req, res);
});

app.post("/api/games/:gameId/join", (req, res) => {
  gameController.joinGame(req, res);
});

app.post("/api/games/:gameId/ships", (req, res) => {
  gameController.setShips(req, res);
});

app.post("/api/games/:gameId/shot", (req, res) => {
  gameController.makeShot(req, res);
});

app.get("/api/games/:gameId/state", (req, res) => {
  gameController.getGameState(req, res);
});

app.get("/api/games", (req, res) => {
  gameController.getActiveGames(req, res);
});

app.get("/api/stats", (req, res) => {
  gameController.getServerStats(req, res);
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ 
    error: "Endpoint no encontrado", 
    path: req.originalUrl 
  });
});

// 🔌 WEBSOCKETS: Agregar sin cambiar lo existente
import { createServer } from 'http';
import { Server } from 'socket.io';
import SocketHandler from './websocket/SocketHandler.js';

// Crear servidor HTTP que envuelve Express
const server = createServer(app);

// Configurar Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Tu frontend Vite
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Inicializar manejador WebSocket
const socketHandler = new SocketHandler(io, gameController);

// Configurar eventos WebSocket
io.on('connection', (socket) => {
  socketHandler.handleConnection(socket);
});

// Iniciar servidor con HTTP + WebSockets
server.listen(PORT, () => {
  console.log(`🚀 Servidor API Batalla Naval corriendo en http://localhost:${PORT}`);
  console.log(`🔌 WebSockets habilitados en ws://localhost:${PORT}`);
  console.log(`📖 Documentación: http://localhost:${PORT}/`);
  console.log(`💾 Persistencia: Activada`);
  console.log(`🎮 Listo para multijugador en tiempo real!`);
});
