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

    useEffect(() => {
        // Conectar al servicio WebSocket
        gameService.connect().catch(error => {
            setError('Error conectando al servidor');
            console.error('Connection error:', error);
        });

        // Configurar event listeners
        const handlePlayerJoined = (event) => {
            setIsJoining(false);
            // Navegar a la pantalla de juego
            navigate('/juego', { 
                state: { 
                    isMultiplayer: true,
                    gameState: event.detail.gameState
                }
            });
        };

        const handleError = (event) => {
            setError(event.detail.message);
            setIsJoining(false);
        };

        window.addEventListener('playerJoined', handlePlayerJoined);
        window.addEventListener('gameError', handleError);

        return () => {
            window.removeEventListener('playerJoined', handlePlayerJoined);
            window.removeEventListener('gameError', handleError);
        };
    }, [navigate]);

    const handleJoinGame = () => {
        if (!playerName.trim() || !gameCode.trim()) {
            setError('Por favor ingresa tu nombre y el código de partida');
            return;
        }

        setError('');
        setIsJoining(true);
        gameService.joinGame(gameCode.toUpperCase(), playerName);
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
                
                <h1 className="title">UNIRSE A PARTIDA</h1>
                
                <input 
                    type="text" 
                    placeholder="Ingresa tu nombre"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    style={{ fontSize: "20px", padding: "10px", width: "520px", marginBottom: '15px' }}
                />
                
                <input 
                    type="text" 
                    placeholder="Ingresa código de partida"
                    value={gameCode}
                    onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                    style={{ fontSize: "20px", padding: "10px", width: "520px" }}
                />
                
                <button 
                    className="btn" 
                    onClick={handleJoinGame}
                    disabled={isJoining}
                >
                    {isJoining ? 'Uniéndose...' : 'Unirse a partida'}
                </button>
                
                {error && (
                    <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}