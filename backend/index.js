const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ 
    message: "API Batalla Naval funcionando 🚀", 
    version: "1.0.0",
    endpoints: [
      "GET / - Estado del servidor",
      "POST /api/game/create - Crear nueva partida",
      "POST /api/game/:gameId/shot - Realizar disparo"
    ]
  });
});

// Rutas de la API del juego
app.get("/api/status", (req, res) => {
  res.json({ 
    status: "active", 
    message: "API Batalla Naval lista para jugar" 
  });
});

// Placeholder para rutas futuras del juego
// TODO: Implementar estas rutas
app.post("/api/game/create", (req, res) => {
  res.json({ 
    message: "Endpoint para crear partida - Por implementar",
    gameId: "placeholder-" + Date.now()
  });
});

app.post("/api/game/:gameId/shot", (req, res) => {
  res.json({ 
    message: "Endpoint para disparos - Por implementar",
    gameId: req.params.gameId,
    shot: req.body
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ 
    error: "Endpoint no encontrado", 
    path: req.originalUrl 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor API Batalla Naval corriendo en http://localhost:${PORT}`);
  console.log(`📖 Documentación: http://localhost:${PORT}/`);
});
