const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Ejemplo de ruta de prueba
app.get("/", (req, res) => {
  res.send("Servidor backend funcionando 🚀");
});

// Aquí puedes agregar tus rutas del juego
// app.post("/api/disparar", (req, res) => {...});

app.listen(3001, () => {
  console.log("Servidor backend corriendo en http://localhost:3001");
});
