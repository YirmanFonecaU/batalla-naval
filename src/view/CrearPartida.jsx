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

    useEffect(() => {
        console.log('🔌 Intentando conectar al servidor...');
        
        gameService.connect()
            .then(() => {
                console.log('✅ Conectado al servidor');
                setIsConnecting(false);
                setError('');
            })
            .catch(error => {
                console.error('❌ Error de conexión:', error);
                setError('No se pudo conectar al servidor. Verifica que el servidor esté corriendo en http://localhost:3001');
                setIsConnecting(false);
            });

        // Configurar event listeners
        const handleGameCreated = (event) => {
            console.log('🎮 Partida creada:', event.detail);
            setGameCode(event.detail.gameCode);
            setIsCreating(false);
            setError('');
        };

        const handleError = (event) => {
            console.error('❌ Error del servidor:', event.detail);
            setError(event.detail.message);
            setIsCreating(false);
        };

        window.addEventListener('gameCreated', handleGameCreated);
        window.addEventListener('gameError', handleError);

        return () => {
            window.removeEventListener('gameCreated', handleGameCreated);
            window.removeEventListener('gameError', handleError);
        };
    }, []);

    const handleCreateGame = () => {
        if (!playerName.trim()) {
            setError('Por favor ingresa tu nombre');
            return;
        }

        if (!gameService.isConnected) {
            setError('No hay conexión con el servidor');
            return;
        }

        setError('');
        setIsCreating(true);
        console.log('🎯 Creando partida para:', playerName);
        gameService.createGame(playerName);
    };

    const handleBack = () => {
        gameService.disconnect();
        navigate("/multiplayer");
    };

    return (
        <div className="home-page">
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
                        <input 
                            type="text" 
                            placeholder="Ingresa tu nombre"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            style={{ fontSize: "20px", padding: "10px", width: "500px" }}
                        />
                        
                        <button 
                            className="btn" 
                            onClick={handleCreateGame}
                            disabled={isCreating || !gameService.isConnected}
                        >
                            {isCreating ? 'Creando...' : 'Crear partida'}
                        </button>
                        
                        {error && (
                            <div className="error-message" style={{ 
                                color: 'red', 
                                marginTop: '10px',
                                padding: '10px',
                                backgroundColor: '#ffe6e6',
                                borderRadius: '5px',
                                textAlign: 'center'
                            }}>
                                {error}
                            </div>
                        )}
                        
                        {gameCode && (
                            <div className="game-code-section" style={{ marginTop: '20px', textAlign: 'center' }}>
                                <h3 style={{ color: '#4CAF50' }}>Código de partida:</h3>
                                <div style={{ 
                                    fontSize: '32px', 
                                    fontWeight: 'bold', 
                                    color: '#2196F3',
                                    margin: '10px 0'
                                }}>
                                    {gameCode}
                                </div>
                                <p style={{ color: '#666' }}>
                                    Comparte este código con tu amigo para que se una
                                </p>
                                
                                <div style={{ marginTop: '20px' }}>
                                    <div className="loading-dots">
                                        Esperando que se una otro jugador...
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}