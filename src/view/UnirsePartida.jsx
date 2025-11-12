import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gameService from '../services/GameService';
import "./styles/Style.css";

export default function UnirsePartida() {
    const navigate = useNavigate();
    const [playerName, setPlayerName] = useState('');
    const [gameCode, setGameCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState('');
    const [isConnecting, setIsConnecting] = useState(true);

    useEffect(() => {
        let mounted = true;

        // ✅ Limpiar estado anterior al cargar la página
        console.log('🧹 Limpiando estado anterior...');
        gameService.clearGameState();
        
        console.log('🔌 Verificando conexión al servidor...');
        
        // Conectar solo si no está conectado
        const connectToServer = async () => {
            if (gameService.isConnected) {
                console.log('✅ Ya conectado al servidor');
                if (mounted) {
                    setIsConnecting(false);
                }
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

        // ✅ Configurar event listeners
        const handlePlayerJoined = (event) => {
            console.log('👥 EVENTO playerJoined recibido en P2:', event.detail);
            
            const { gameState, opponent } = event.detail;
            
            if (!mounted) return;
            
            setIsJoining(false);
            
            // ✅ OBTENER nombre del input
            const currentPlayerName = document.querySelector('input[placeholder*="nombre"]')?.value || 'Jugador2';
            
            console.log('🚀 Navegando a tablero...');
            console.log('📦 Datos a enviar:', {
                gameId: gameService.gameId,
                gameCode: gameService.gameCode,
                playerId: gameService.playerId,
                playerName: currentPlayerName,
                opponent
            });
            
            // ✅ GUARDAR en sessionStorage como respaldo
            sessionStorage.setItem('gameData', JSON.stringify({
                gameId: gameService.gameId,
                gameCode: gameService.gameCode,
                playerId: gameService.playerId,
                playerName: currentPlayerName,
                gameState: gameState,
                opponent: opponent,
                isMultiplayer: true,
                isSetupPhase: true
            }));
            
            // ✅ NAVEGAR A TABLERO para colocar barcos
            navigate('/tablero', { 
                state: { 
                    gameId: gameService.gameId,
                    gameCode: gameService.gameCode,
                    playerId: gameService.playerId, // 2
                    playerName: currentPlayerName,
                    gameState: gameState,
                    opponent: opponent,
                    isMultiplayer: true,
                    isSetupPhase: true
                }
            });
        };

        const handleError = (event) => {
            console.error('❌ Error del servidor:', event.detail);
            if (mounted) {
                setError(event.detail.message || 'Error desconocido');
                setIsJoining(false);
            }
        };

        window.addEventListener('playerJoined', handlePlayerJoined);
        window.addEventListener('gameError', handleError);

        return () => {
            mounted = false;
            window.removeEventListener('playerJoined', handlePlayerJoined);
            window.removeEventListener('gameError', handleError);
        };
    }, []); // ✅ ARRAY VACÍO - Solo se ejecuta una vez

    const handleJoinGame = () => {
        console.log('🎯 handleJoinGame ejecutado');
        console.log('📝 Nombre:', playerName, 'Código:', gameCode);

        if (!playerName.trim()) {
            console.warn('⚠️ Nombre vacío');
            setError('Por favor ingresa tu nombre');
            return;
        }

        if (!gameCode.trim()) {
            console.warn('⚠️ Código vacío');
            setError('Por favor ingresa el código de partida');
            return;
        }

        if (!gameService.isConnected) {
            console.warn('⚠️ Sin conexión');
            setError('No hay conexión con el servidor');
            return;
        }

        setError('');
        setIsJoining(true);
        
        console.log('🎯 Uniéndose a partida:', gameCode.toUpperCase());
        gameService.joinGame(gameCode.toUpperCase(), playerName);
    };

    const handleBack = () => {
        navigate("/multiplayer");
    };

    return (
        <div className="black-page">
            <div className="container">
                <div className="top-buttons">
                    <button className="icon-btn" onClick={handleBack}>↩</button>
                </div>
                
                <h1 className="title">UNIRSE A PARTIDA</h1>
                
                {isConnecting ? (
                    <div className="loading-message">
                        <p>Conectando al servidor...</p>
                    </div>
                ) : (
                    <>
                        <input 
                            type="text" 
                            placeholder="Ingresa tu nombre"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    const codeInput = document.querySelector('input[placeholder*="código"]');
                                    if (codeInput) {
                                        codeInput.focus();
                                    }
                                }
                            }}
                            disabled={isJoining}
                            autoFocus
                            style={{ 
                                fontSize: "20px", 
                                padding: "10px", 
                                width: "520px", 
                                maxWidth: "90%",
                                marginBottom: '15px' 
                            }}
                        />
                        
                        <input 
                            type="text" 
                            placeholder="Ingresa código de partida (6 caracteres)"
                            value={gameCode}
                            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleJoinGame();
                                }
                            }}
                            disabled={isJoining}
                            maxLength={6}
                            style={{ 
                                fontSize: "20px", 
                                padding: "10px", 
                                width: "520px",
                                maxWidth: "90%",
                                textTransform: "uppercase",
                                letterSpacing: "3px",
                                fontFamily: "monospace"
                            }}
                        />
                        
                        <button 
                            className="btn" 
                            onClick={handleJoinGame}
                            disabled={isJoining || !gameService.isConnected}
                            style={{
                                opacity: (isJoining || !gameService.isConnected) ? 0.5 : 1,
                                cursor: (isJoining || !gameService.isConnected) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isJoining ? '⏳ Uniéndose...' : '✅ Unirse a partida'}
                        </button>
                        
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
                        
                        {isJoining && (
                            <div style={{
                                marginTop: '20px',
                                textAlign: 'center',
                                color: '#2196F3',
                                fontSize: '18px'
                            }}>
                                <div className="loading-dots">
                                    Buscando partida...
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}