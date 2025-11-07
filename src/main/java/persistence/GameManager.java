package main.java.persistence;
import main.java.model.CheckPoint;
import main.java.model.Game;
public class GameManager {
    private Game juego;
    private PersistenceJason persistence;
    public GameManager(Game juego) {
        this.juego = juego;
        this.persistence = new PersistenceJason();

    }
     public Game getGame() {
        return juego;
    }

    public void guardarCheckpoint(String ruta) {
        CheckPoint checkpoint = new CheckPoint(juego);
        persistence.guardar(checkpoint, ruta);
    }

    public void cargarCheckpoint(String ruta) {
        CheckPoint checkpoint = persistence.cargar(ruta);
        if (checkpoint != null) {
            this.juego = checkpoint.getEstadoJuego();
        }
    }
    
}
