import { useNavigate } from "react-router-dom"; 
import "./styles/Style.css";

export default function UnirsePartida() {
    const navigate = useNavigate();
    navigate("/unirsePartida");

    return (
        <div className="home-page">
            <div className="container">
                <div className="top-buttons">
                <button className="icon-btn" onClick={() => navigate("/")}>↩</button>
                </div>
                <h1 className="title">UNIRSE A PARTIDA</h1>
                <input type="text" id="nombre" name="nombre" placeholder="Ingresa tu nombre" style={{ fontSize: "20px", padding: "10px", width: "520px" }}></input>
                <input type="text" id="codigoPartida" name="codigoPartida" placeholder="Ingresa codigo de partida" style={{ fontSize: "20px", padding: "10px", width: "520px" }}></input>
                <button className="btn" onClick={() => navigate()}>Unirse a partida</button>
                 
            </div>
        </div>
    );
}