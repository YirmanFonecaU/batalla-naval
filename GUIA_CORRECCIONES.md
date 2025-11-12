# 🔧 Guía de Correcciones - Batalla Naval

## CORRECCIÓN 1: Eliminar archivo duplicado innecesario

**Archivo**: `backend/service/GameService.js`

**Acción**: **ELIMINAR COMPLETAMENTE**

Este archivo no se está usando en el backend (ver `backend/index.js`), solo causa confusión porque intenta usar WebSocket puro cuando el backend usa Socket.io.

---

## CORRECCIÓN 2: Arreglar respuesta de joinGame

**Archivo**: `backend/controllers/GameController.js`

**Método**: `joinGame()`

**Cambio**: Reemplazar la respuesta final de esta línea:

```javascript
// ANTES (INCORRECTO):
return res.status(200).json({
  message: 'Player joined successfully',
  game: game.toJSON ? game.toJSON() : game
});

// DESPUÉS (CORRECTO):
return res.status(200).json({
  success: true,
  message: 'Player joined successfully',
  gameId: gameId,
  gameState: game.getGameState(2)  // Estado para jugador 2
});
```

**Por qué**: El cliente espera `success` y `gameState` para actualizar correctamente el estado del juego.

---

## CORRECCIÓN 3: Sincronizar Jugador 1 en handleJoinGame

**Archivo**: `backend/websocket/SocketHandler.js`

**Método**: `handleJoinGame()`

**Ubicación**: Al final del método (antes del catch), agregar:

```javascript
// AGREGAR ESTAS LÍNEAS ANTES DEL CATCH:

// ✅ Notificar también al jugador 1 que se unió alguien
const player1SocketId = gameSockets.player1Socket;
if (player1SocketId) {
  this.io.to(player1SocketId).emit('player-joined-update', {
    message: `${playerName} se unió a la partida`,
    gameState: game.getGameState(1),
    players: {
      player1: game.player1.name,
      player2: playerName
    }
  });
}
```

**Por qué**: El Jugador 1 debe saber que se unió alguien para poder ver el gameState actualizado.

---

## CORRECCIÓN 4: Agregar gameState a game-created event

**Archivo**: `backend/websocket/SocketHandler.js`

**Método**: `handleCreateGame()`

**Cambio**: En el mockRes.status().json() del socket.emit, cambiar:

```javascript
// ANTES (INCORRECTO):
socket.emit('game-created', {
  success: true,
  gameCode: gameCode,
  gameId: gameId,
  message: 'Partida creada exitosamente'
});

// DESPUÉS (CORRECTO):
socket.emit('game-created', {
  success: true,
  gameCode: gameCode,
  gameId: gameId,
  gameState: game.getGameState(1),  // ← AGREGAR ESTO
  message: 'Partida creada exitosamente'
});
```

**Por qué**: El frontend necesita el gameState inicial para mostrar los tableros correctamente.

---

## CORRECCIÓN 5: Mejorar handleShotResult en Juego.jsx

**Archivo**: `src/view/Juego.jsx`

**Ubicación**: En el useEffect de inicialización multijugador, mejorar el listener:

```javascript
// ANTES:
const handleShotResult = (event) => {
  console.log('🎯 Disparo procesado:', event.detail);
  
  setGameState(prevState => {
    const newState = event.detail.gameState;
    console.log(`📊 Jugador ${gameService.playerId} - Disparos recibidos: ${newState.yourBoard.shots.length}`);
    console.log(`Es mi turno: ${newState.isYourTurn}`);
    return newState;
  });
};

// DESPUÉS (MEJORADO):
const handleShotResult = (event) => {
  console.log('🎯 Disparo procesado:', event.detail);
  
  setGameState(prevState => {
    const newState = event.detail.gameState;
    
    // ✅ Validar integridad del estado
    if (!newState || !newState.yourBoard || !newState.opponentBoard) {
      console.error('❌ Estado incompleto recibido', newState);
      return prevState;
    }
    
    // ✅ Validar que tiene datos críticos
    if (!Array.isArray(newState.yourBoard.shots)) {
      console.error('❌ yourBoard.shots no es array', newState.yourBoard);
      return prevState;
    }
    
    console.log(`📊 Jugador ${gameService.playerId}:`);
    console.log(`  - Disparos recibidos: ${newState.yourBoard.shots.length}`);
    console.log(`  - Es mi turno: ${newState.isYourTurn}`);
    console.log(`  - Turno actual: ${newState.currentTurn}`);
    console.log(`  - Estado: ${newState.status}`);
    
    return newState;
  });
};
```

**Por qué**: Esto detecta problemas en la comunicación del estado antes de que causen errores.

---

## CORRECCIÓN 6: Arreglar visualización de barcos hundidos del rival

**Archivo**: `src/view/Juego.jsx`

**Ubicación**: Sección de "BARCOS RIVALES" (alrededor de línea 350)

```javascript
// ANTES (INCORRECTO):
{gameState.opponentBoard.allShips && gameState.opponentBoard.allShips.length > 0
  ? gameState.opponentBoard.allShips.map((ship) => {
      const allHit = ship.segments.every(seg => seg.isHit);
      return (
        <div key={ship.id} className={`ship-status ${allHit ? 'sunk' : 'alive'}`}>
          {ship.segments.map((seg, i) => (
            <div key={i} className={`ship-segment-status ${seg.isHit ? 'hit' : 'intact'}`} />
          ))}
        </div>
      );
    })
  : [5, 4, 3, 2, 2].map((size, idx) => (
      <div key={idx} className="ship-status alive">
        {Array.from({ length: size }, (_, i) => (
          <div key={i} className="ship-segment-status intact" />
        ))}
      </div>
    ))}

// DESPUÉS (CORRECTO):
{gameState.opponentBoard.sunkShips && gameState.opponentBoard.sunkShips.length > 0
  ? gameState.opponentBoard.sunkShips.map((ship) => {
      // Contar hits en este barco
      const shipHits = gameState.opponentBoard.shots.filter(shot => {
        if (!shot.isHit) return false;
        // Verificar si el hit está en posición del barco
        for (let i = 0; i < ship.size; i++) {
          const shipRow = ship.orientation === 'horizontal' ? ship.row : ship.row + i;
          const shipCol = ship.orientation === 'horizontal' ? ship.col + i : ship.col;
          if (shot.row === shipRow && shot.col === shipCol) return true;
        }
        return false;
      }).length;
      
      return (
        <div key={ship.id} className="ship-status sunk">
          {Array.from({ length: ship.size }, (_, i) => (
            <div 
              key={i} 
              className={`ship-segment-status ${i < shipHits ? 'hit' : 'intact'}`} 
            />
          ))}
        </div>
      );
    })
  : [5, 4, 3, 2, 2].map((size, idx) => (
      <div key={idx} className="ship-status alive">
        {Array.from({ length: size }, (_, i) => (
          <div key={i} className="ship-segment-status intact" />
        ))}
      </div>
    ))}
```

**Por qué**: El servidor solo envía `sunkShips` (barcos hundidos), no todos los barcos del rival.

---

## CORRECCIÓN 7: Mejorar GameService.js del frontend

**Archivo**: `src/services/GameService.js`

**Método**: `connect()`

```javascript
// ANTES:
connect() {
  if (this.socket) {
    this.socket.disconnect();
  }

  this.socket = io('https://magnetically-predenial-memphis.ngrok-free.dev', {
    transports: ["websocket"],
  });
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

// DESPUÉS (MEJORADO):
connect() {
  // ✅ Evitar conexiones duplicadas
  if (this.socket?.connected) {
    console.log('ℹ️ Ya conectado al servidor');
    return Promise.resolve();
  }

  if (this.socket) {
    this.socket.disconnect();
  }

  // ✅ Usar variable de entorno si está disponible
  const backendURL = import.meta.env.VITE_BACKEND_URL || 
                     'https://magnetically-predenial-memphis.ngrok-free.dev';

  console.log(`🔌 Conectando a: ${backendURL}`);

  this.socket = io(backendURL, {
    transports: ["websocket"],
    reconnection: true,           // ✅ Reintentar automáticamente
    reconnectionDelay: 1000,      // ✅ Esperar 1s antes de reintentar
    reconnectionDelayMax: 5000,   // ✅ Máximo 5s entre reintentos
    reconnectionAttempts: 5       // ✅ Máximo 5 intentos
  });

  this.setupEventListeners();

  return new Promise((resolve, reject) => {
    // ✅ Timeout de seguridad
    const timeout = setTimeout(() => {
      reject(new Error('⏱️ Timeout de conexión (10s)'));
    }, 10000);

    this.socket.on('connect', () => {
      clearTimeout(timeout);
      this.isConnected = true;
      console.log('✅ Conectado al servidor WebSocket');
      resolve();
    });

    this.socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      this.isConnected = false;
      console.error('❌ Error conectando al servidor:', error.message);
      reject(error);
    });

    // ✅ Manejar desconexión inesperada
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.warn(`⚠️ Desconectado del servidor: ${reason}`);
      window.dispatchEvent(new CustomEvent('socketDisconnected', { detail: { reason } }));
    });
  });
}
```

**Por qué**: Previene múltiples conexiones y maneja desconexiones gracefully.

---

## CORRECCIÓN 8: Actualizar Vite Config

**Archivo**: `vite.config.js`

```javascript
// ANTES:
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      '*.ngrok-free.dev',
      'localhost',
      '127.0.0.1'
    ],
  },
})

// DESPUÉS (MÁS FLEXIBLE PARA DESARROLLO):
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',              // ✅ Escuchar en todas las interfaces
    port: 5173,                    // ✅ Puerto explícito
    allowedHosts: 'all',           // ✅ Permitir todos los hosts en desarrollo
    cors: true,                    // ✅ Habilitar CORS
  },
})
```

**Por qué**: Hace el desarrollo más flexible con ngrok y previene problemas de CORS.

---

## 📋 Orden de Implementación Recomendado

```
1. CRÍTICA - Eliminar backend/service/GameService.js
   └─ Causa confusión y no se usa

2. CRÍTICA - Arreglar joinGame response (Corrección 2)
   └─ Afecta multijugador inmediatamente

3. CRÍTICA - Mejorar handleShotResult (Corrección 5)
   └─ Previene errores en gameplay

4. ALTA - Sincronizar P1 en handleJoinGame (Corrección 3)
   └─ Completa la sincronización multijugador

5. ALTA - Agregar gameState a game-created (Corrección 4)
   └─ Inicializa correctamente

6. MEDIA - Arreglar visualización barcos (Corrección 6)
   └─ Mejora UX

7. MEDIA - Mejorar GameService connect (Corrección 7)
   └─ Aumenta confiabilidad

8. BAJA - Actualizar Vite (Corrección 8)
   └─ Mejora experiencia desarrollo
```

---

## ✅ Verificación Post-Correcciones

Después de aplicar todas las correcciones, prueba esto:

```javascript
// En la consola del navegador, cuando estés en el juego multijugador:

// 1. Verifica la conexión
gameService.isConnected  // Debe ser true

// 2. Verifica el gameId
gameService.gameId  // Debe tener un valor como "game_173..."

// 3. Verifica el código de partida
gameService.gameCode  // Debe tener 6 caracteres

// 4. Verifica que los eventos llegan correctamente
window.dispatchEvent(new CustomEvent('test'))
// Abre DevTools Network → WS → debería ver comunicación en tiempo real
```

