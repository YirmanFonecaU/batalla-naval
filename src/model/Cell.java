package model;

public class Cell {
    private int fila;
    private int columna;
    private boolean ocupada;
    private boolean atacada;

    public Cell(int fila, int columna) {
        this.fila = fila;
        this.columna = columna;
        this.ocupada = false;
        this.atacada = false;
    }

    // Getters y Setters
    public int getFila() { return fila; }
    public int getColumna() { return columna; }
    public boolean isOcupada() { return ocupada; }
    public boolean isAtacada() { return atacada; }
    public void setOcupada(boolean ocupada) { this.ocupada = ocupada; }
    public void setAtacada(boolean atacada) { this.atacada = atacada; }
}
