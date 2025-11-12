# 🔧 Correcciones de Código - Listos para Implementar

## Corrección 1: Arreglar joinGame en GameController.js

**Archivo**: `backend/controllers/GameController.js`

**Buscar esta línea (alrededor de línea 95)**:
```javascript
    // ✅ Confirmar unión exitosa
    return res.status(200).json({
      message: 'Player joined successfully',
      game: game.toJSON ? game.toJSON() : game
    });
```

**Reemplazar por**:
```javascript
    // ✅ Confirmar unión exitosa
    return res.status(200).json({
      success: true,
      message: 'Player joined successfully',
      gameId: gameId,
      gameState: game.getGameState(2)  // Estado para jugador 2
    });
```

---

## Corrección 2: Mejorar handleJoinGame en SocketHandler.js

**Archivo**: `backend/websocket/SocketHandler.js`

**Buscar el método `handleJoinGame` (alrededor de línea 180)**

**Reemplazar TODA la función por**:
```javascript
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

              // ✅ NOTIFICAR A JUGADOR 2
              socket.emit('player-joined', {
                message: `${playerName} se unió a la partida`,
                gameState: responseData.gameState,
                players: {
                  player1: game.player1.name,
                  player2: playerName
                }
              });

              // ✅ NOTIFICAR TAMBIÉN A JUGADOR 1
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
```

---

## Corrección 3: Agregar gameState a game-created

**Archivo**: `backend/websocket/SocketHandler.js`

**Buscar en el método `handleCreateGame` esta línea (alrededor de línea 145)**:
```javascript
              socket.emit('game-created', {
                success: true,
                gameCode: gameCode,
                gameId: gameId,
                message: 'Partida creada exitosamente'
              });
```

**Reemplazar por**:
```javascript
              socket.emit('game-created', {
                success: true,
                gameCode: gameCode,
                gameId: gameId,
                gameState: game.getGameState(1),  // ✅ AGREGAR ESTO
                message: 'Partida creada exitosamente'
              });
```

---

## Corrección 4: Mejorar handleShotResult en Juego.jsx

**Archivo**: `src/view/Juego.jsx`

**Buscar el listener de shotResult (alrededor de línea 90)**:
```javascript
    const handleShotResult = (event) => {
      console.log('🎯 Disparo procesado:', event.detail);
      
      setGameState(prevState => {
        const newState = event.detail.gameState;
        
        // Log simple para debug
        console.log(`📊 Jugador ${gameService.playerId} - Disparos recibidos: ${newState.yourBoard.shots.length}`);
        console.log(`Es mi turno: ${newState.isYourTurn}`);
        
        return newState;
      });
    };
```

**Reemplazar por**:
```javascript
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

---

## Corrección 5: Arreglar visualización de barcos hundidos

**Archivo**: `src/view/Juego.jsx`

**Buscar la sección BARCOS RIVALES (alrededor de línea 330)**

**Buscar este código**:
```jsx
          {/* Barcos rivales */}
          <div className="ships-status-section">
            <div className="ships-header-btn">BARCOS RIVALES</div>
            <div className="ships-status-grid">
              {gameState.opponentBoard.allShips && gameState.opponentBoard.allShips.length > 0
                ? gameState.opponentBoard.allShips.map((ship) => {
                    const allHit = ship.segments.every(seg => seg.isHit);
                    
                    return (
                      <div key={ship.id} className={`ship-status ${allHit ? 'sunk' : 'alive'}`}>
                        {ship.segments.map((seg, i) => (
                          <div 
                            key={i} 
                            className={`ship-segment-status ${seg.isHit ? 'hit' : 'intact'}`}
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
            </div>
          </div>
```

**Reemplazar por**:
```jsx
          {/* Barcos rivales */}
          <div className="ships-status-section">
            <div className="ships-header-btn">BARCOS RIVALES</div>
            <div className="ships-status-grid">
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
            </div>
          </div>
```

---

## Corrección 6: Mejorar GameService.connect()

**Archivo**: `src/services/GameService.js`

**Reemplazar TODA la función `connect()`**:

```javascript
  // Conectar al servidor WebSocket
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

---

## Corrección 7: Agregar listener para player-joined-update

**Archivo**: `src/view/Juego.jsx`

**En el `useEffect` de inicialización multijugador, agregar este listener**:

**Buscar donde están registrados los listeners (alrededor de línea 110)**

**Agregar después de `handlePlayerJoined`**:

```javascript
    const handlePlayerJoinedUpdate = (event) => {
      console.log('👥 Otro jugador se unió, actualizando estado:', event.detail);
      setGameState(event.detail.gameState);
      setWaitingMessage("El otro jugador está colocando sus barcos...");
    };
```

**Luego agregar el event listener (alrededor de línea 160)**:
```javascript
    window.addEventListener('playerJoinedUpdate', handlePlayerJoinedUpdate);
```

**Y en el cleanup (alrededor de línea 170)**:
```javascript
    window.removeEventListener('playerJoinedUpdate', handlePlayerJoinedUpdate);
```

---

## Corrección 8: Actualizar Vite Config

**Archivo**: `vite.config.js`

**Reemplazar COMPLETAMENTE por**:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Configuración mejorada para permitir acceso desde ngrok y localhost
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

---

## 🗑️ Eliminación de Archivo

**Eliminar completamente**: `backend/service/GameService.js`

Este archivo no se usa en el backend y solo causa confusión. El backend ya usa `SocketHandler.js` para manejar WebSockets.

**Instrucciones de eliminación**:
1. En el File Explorer de VS Code
2. Click derecho en `backend/service/GameService.js`
3. Seleccionar "Delete" o "Move to Recycle Bin"

O en terminal:
```powershell
Remove-Item "c:\Users\YIRMAN FONSECA\batalla-naval\backend\service\GameService.js" -Force
```

---

## ✅ VERIFICACIÓN POST-CORRECCIONES

Después de aplicar todas las correcciones, prueba estos pasos:

### 1. **Verificar conexión**
```javascript
// En consola del navegador
gameService.isConnected  // Debe ser true
gameService.socket.id    // Debe tener un ID
```

### 2. **Crear partida y verificar código**
```javascript
// El código debe mostrarse en 6 caracteres (ej: ABC123)
gameService.gameCode  // "ABC123"
gameService.gameId    // "game_1234_xyz"
```

### 3. **Unirse a partida y verificar estado**
```javascript
// Abrir navegador del otro jugador
// Debe mostrar mensaje "Otro jugador se unió"
```

### 4. **Verificar gameState completo**
```javascript
// En consola, en la pantalla de juego
// Abrir Elements/Inspector y buscar en React DevTools
// El gameState debe tener:
// - yourBoard.shots (array)
// - opponentBoard.shots (array)
// - isYourTurn (boolean)
// - currentTurn (número)
// - status: "playing"
```

### 5. **Verificar comunicación WebSocket**
```javascript
// DevTools → Network → WS
// Debe haber un socket conectado a ngrok
// Al disparar, debe haber mensajes bidireccionales
```

---

## 📞 Soporte - Preguntas Frecuentes

**P: ¿Cómo sé si los cambios funcionan?**
R: Abre 2 navegadores diferentes, crea partida en uno, únete en otro. Ambos deberían ver la información del otro en tiempo real.

**P: ¿Qué pasa si la conexión falla?**
R: Ahora reintentar automáticamente 5 veces (con delay de 1-5 segundos). Si sigue fallando, verificar que el backend esté corriendo en ngrok.

**P: ¿Cómo verifico que el backend usa ngrok correctamente?**
R: En la terminal del backend, debería ver algo como:
```
🚀 Servidor API Batalla Naval corriendo en http://localhost:3001
🔌 WebSockets habilitados en ws://localhost:3001
📖 Documentación: http://localhost:3001/
```

Y si usas ngrok, ejecuta:
```powershell
ngrok http 3001
```

**P: ¿Debo cambiar la URL de ngrok en el código?**
R: No después de las correcciones. Está hardcodeado, pero puedes crear un `.env` con `VITE_BACKEND_URL`.

