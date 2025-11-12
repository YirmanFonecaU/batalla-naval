import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gameService from '../services/GameService';
import "./styles/Style.css";

export default function CrearPartida() {
    const navigate = useNavigate();
    const [playerName, setPlayerName] = useState('');
    const [gameCode, setGameCode] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');
    const [isConnecting, setIsConnecting] = useState(true);
    const [waitingForPlayer, setWaitingForPlayer] = useState(false);
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    const [opponentName, setOpponentName] = useState(''); // ✅ AGREGAR ESTA LÍNEA

    useEffect(() => {
        let mounted = true;

        console.log('🔌 Verificando conexión al servidor...');

        const connectToServer = async () => {
            if (gameService.isConnected) {
                console.log('✅ Ya conectado al servidor');
                setIsConnecting(false);
                return;
            }

            try {
                await gameService.connect();
                if (mounted) {
                    console.log('✅ Conectado al servidor');
                    setIsConnecting(false);
                    setError('');
                }
            } catch (error) {
                if (mounted) {
                    console.error('❌ Error de conexión:', error);
                    setError('No se pudo conectar al servidor. Verifica que el servidor esté corriendo.');
                    setIsConnecting(false);
                }
            }
        };

        connectToServer();

        // ✅ Event Handlers
=======

    useEffect(() => {
        let mounted = true;

        console.log('🔌 Verificando conexión al servidor...');

        const connectToServer = async () => {
            if (gameService.isConnected) {
                console.log('✅ Ya conectado al servidor');
                setIsConnecting(false);
                return;
            }

            try {
                await gameService.connect();
                if (mounted) {
                    console.log('✅ Conectado al servidor');
                    setIsConnecting(false);
                    setError('');
                }
            } catch (error) {
                if (mounted) {
                    console.error('❌ Error de conexión:', error);
                    setError('No se pudo conectar al servidor. Verifica que el servidor esté corriendo.');
                    setIsConnecting(false);
                }
            }
        };

        connectToServer();

        // 🔥 SECCIÓN A ACTUALIZAR EN CrearPartida.jsx
        // Busca donde manejas el evento 'gameCreated' y actualiza así:

>>>>>>> Stashed changes
=======

    useEffect(() => {
        let mounted = true;

        console.log('🔌 Verificando conexión al servidor...');

        const connectToServer = async () => {
            if (gameService.isConnected) {
                console.log('✅ Ya conectado al servidor');
                setIsConnecting(false);
                return;
            }

            try {
                await gameService.connect();
                if (mounted) {
                    console.log('✅ Conectado al servidor');
                    setIsConnecting(false);
                    setError('');
                }
            } catch (error) {
                if (mounted) {
                    console.error('❌ Error de conexión:', error);
                    setError('No se pudo conectar al servidor. Verifica que el servidor esté corriendo.');
                    setIsConnecting(false);
                }
            }
        };

        connectToServer();

        // 🔥 SECCIÓN A ACTUALIZAR EN CrearPartida.jsx
        // Busca donde manejas el evento 'gameCreated' y actualiza así:

>>>>>>> Stashed changes
        const handleGameCreated = (event) => {
            console.log('🎮 EVENTO gameCreated recibido:', event.detail);

            const { gameCode, gameId, playerId, gameState } = event.detail;

            setGameCode(gameCode);
<<<<<<< Updated upstream
<<<<<<< Updated upstream
            setWaitingForPlayer(true); // ✅ CORREGIDO: era setIsWaiting
            setIsCreating(false);
=======
            setIsWaiting(true);
>>>>>>> Stashed changes
=======
            setIsWaiting(true);
>>>>>>> Stashed changes

            // ✅ Asegurarse de que GameService tenga todos los datos
            gameService.gameId = gameId;
            gameService.gameCode = gameCode;
            gameService.playerId = playerId;

            console.log('✅ gameCode:', gameCode);
            console.log('✅ gameId:', gameId);
            console.log('✅ playerId:', playerId);
        };

        const handlePlayerJoined = (event) => {
            console.log('👥 EVENTO playerJoined recibido:', event.detail);

<<<<<<< Updated upstream
<<<<<<< Updated upstream
            setOpponentName(event.detail.opponent?.name || 'Oponente'); // ✅ AHORA SÍ EXISTE
=======
            setOpponentName(event.detail.opponent?.name || 'Oponente');
>>>>>>> Stashed changes
=======
            setOpponentName(event.detail.opponent?.name || 'Oponente');
>>>>>>> Stashed changes

            console.log('🚀 Navegando a tablero para colocar barcos...');

            // ✅ PASAR TODOS LOS DATOS NECESARIOS
            navigate('/tablero', {
                state: {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
                    gameId: gameService.gameId,
=======
                    gameId: gameService.gameId,        // ✅ Usar el gameId de gameService
>>>>>>> Stashed changes
=======
                    gameId: gameService.gameId,        // ✅ Usar el gameId de gameService
>>>>>>> Stashed changes
                    gameCode: gameService.gameCode,
                    playerId: gameService.playerId,
                    playerName: gameService.playerName,
                    opponent: event.detail.opponent,
                    isMultiplayer: true,
                    isSetupPhase: true
                }
            });
        };

        const handleError = (event) => {
            console.error('❌ Error del servidor:', event.detail);
            setError(event.detail.message || 'Error desconocido');
            setIsCreating(false);
            setWaitingForPlayer(false);
        };

        window.addEventListener('gameCreated', handleGameCreated);
        window.addEventListener('playerJoined', handlePlayerJoined);
        window.addEventListener('gameError', handleError);

        return () => {
            mounted = false;
            window.removeEventListener('gameCreated', handleGameCreated);
            window.removeEventListener('playerJoined', handlePlayerJoined);
            window.removeEventListener('gameError', handleError);
        };
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    }, [navigate]); // ✅ Agregar navigate como dependencia
=======
    }, []); // ✅ ARRAY VACÍO
>>>>>>> Stashed changes
=======
    }, []); // ✅ ARRAY VACÍO
>>>>>>> Stashed changes

    const handleCreateGame = () => {
        console.log('🎯 handleCreateGame ejecutado');
        console.log('📝 Nombre ingresado:', playerName);
        console.log('🔌 Conectado:', gameService.isConnected);

        if (!playerName.trim()) {
            console.warn('⚠️ Nombre vacío');
            setError('Por favor ingresa tu nombre');
            return;
        }

        if (!gameService.isConnected) {
            console.warn('⚠️ Sin conexión');
            setError('No hay conexión con el servidor');
            return;
        }

        setError('');
        setIsCreating(true);

        console.log('🎯 Creando partida para:', playerName);
        console.log('🎯 Llamando a gameService.createGame...');

        gameService.createGame(playerName);
    };

    const handleBack = () => {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        // ✅ Limpiar estado si cancela
        if (waitingForPlayer && gameService.gameId) {
            gameService.disconnect();
        }
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        navigate("/multiplayer");
    };

    return (
        <div className="black-page">
            <div className="container">
                <div className="top-buttons">
                    <button className="icon-btn" onClick={handleBack}>↩</button>
                </div>

                <h1 className="title">CREAR PARTIDA</h1>

                {isConnecting ? (
                    <div className="loading-message">
                        <p>Conectando al servidor...</p>
                    </div>
                ) : (
                    <>
                        {!waitingForPlayer ? (
                            <>
                                <input
                                    type="text"
                                    placeholder="Ingresa tu nombre"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleCreateGame();
                                        }
                                    }}
                                    disabled={isCreating}
                                    style={{
                                        fontSize: "20px",
                                        padding: "10px",
                                        width: "500px",
                                        maxWidth: "90%"
                                    }}
                                />

                                <button
                                    className="btn"
                                    onClick={handleCreateGame}
                                    disabled={isCreating || !gameService.isConnected}
                                    style={{
                                        opacity: (isCreating || !gameService.isConnected) ? 0.5 : 1
                                    }}
                                >
                                    {isCreating ? 'Creando...' : 'Crear partida'}
                                </button>
                            </>
                        ) : null}

                        {error && (
                            <div className="error-message" style={{
                                color: '#ff4444',
                                backgroundColor: '#ffeeee',
                                border: '2px solid #ff4444',
                                borderRadius: '8px',
                                marginTop: '20px',
                                padding: '15px',
                                textAlign: 'center',
                                fontWeight: 'bold'
                            }}>
                                ⚠️ {error}
                            </div>
                        )}

                        {gameCode && (
                            <div className="game-code-section" style={{
                                marginTop: '30px',
                                textAlign: 'center',
                                animation: 'fadeIn 0.5s'
                            }}>
                                <h3 style={{
                                    color: '#4CAF50',
                                    fontSize: '24px',
                                    marginBottom: '15px'
                                }}>
                                    ✅ Partida creada exitosamente
                                </h3>

                                <div style={{
                                    fontSize: '48px',
                                    fontWeight: 'bold',
                                    color: '#2196F3',
                                    margin: '20px 0',
                                    letterSpacing: '8px',
                                    fontFamily: 'monospace',
                                    backgroundColor: '#e3f2fd',
                                    padding: '20px',
                                    borderRadius: '10px',
                                    border: '3px solid #2196F3'
                                }}>
                                    {gameCode}
                                </div>

                                <p style={{
                                    color: '#666',
                                    fontSize: '18px',
                                    marginBottom: '30px'
                                }}>
                                    📋 Comparte este código con tu amigo
                                </p>

                                <div style={{ marginTop: '30px' }}>
                                    <div className="loading-dots" style={{
                                        fontSize: '20px',
                                        color: '#FF9800'
                                    }}>
                                        ⏳ Esperando que se una otro jugador...
                                    </div>
                                </div>

                                <button
                                    className="btn"
                                    onClick={handleBack}
                                    style={{
                                        marginTop: '30px',
                                        backgroundColor: '#f44336',
                                        border: 'none'
                                    }}
                                >
                                    ❌ Cancelar partida
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}