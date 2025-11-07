package main.java.model;

public class Shot {
    private int fila;
    private int columna;
    private boolean acierto;

    public Shot(int fila, int columna, boolean acierto) {
        this.fila = fila;
        this.columna = columna;
        this.acierto = acierto;
    }

    public int getFila() { return fila; }
    public int getColumna() { return columna; }
    public boolean isAcierto() { return acierto; }
}
