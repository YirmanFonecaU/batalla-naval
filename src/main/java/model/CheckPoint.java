package main.java.model;

public class CheckPoint {
        private Game estadoJuego;



    public CheckPoint(Game estadoJuego) {
        this.estadoJuego = estadoJuego;
    }

    public Game getEstadoJuego() {
        return estadoJuego;
    }
}