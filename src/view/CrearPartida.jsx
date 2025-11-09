import { useNavigate } from "react-router-dom"; 
import "./styles/Style.css";

export default function CrearPartida() {
    const navigate = useNavigate();
    navigate("/crearPartida");

    return (
        <div className="home-page">
            <div className="top-buttons">
                <button className="icon-btn" onClick={() => navigate("/")}>↩</button>
            </div>
            <div className="container">
                
                <h1 className="title">CREAR PARTIDA</h1>
                <label htmlFor="nombre">123456</label>
                <input 
                    type="text" 
                    id="nombre" 
                    name="nombre" 
                    placeholder="Ingresa tu nombre"
                    style={{ fontSize: "20px", padding: "10px", width: "500px" }}
                />
                <button className="btn" onClick={() => navigate()}>Crear partida</button>
            </div>
        </div>
    );
}
