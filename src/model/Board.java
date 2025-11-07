package model;
import java.util.ArrayList;
import java.util.List;

public class Board {
    private int filas = 10;
    private int columnas = 10;
    private Cell[][] celdas;
    private List<Ship> barcos;

    public Board() {
        celdas = new Cell[filas][columnas];
        for (int i = 0; i < filas; i++) {
            for (int j = 0; j < columnas; j++) {
                celdas[i][j] = new Celda(i, j);
            }
        }
        barcos = new ArrayList<>();
    }

    public boolean colocarBarco(Ship barco, int fila, int columna, boolean horizontal) {
        if (horizontal && columna + barco.getPosiciones().size() > columnas) return false;
        if (!horizontal && fila + barco.getPosiciones().size() > filas) return false;
        // lógica de validación y colocación
        barcos.add(barco);
        return true;
    }

    public Celda obtenerCelda(int fila, int columna) {
        return celdas[fila][columna];
    }

    public List<Ship> getBarcos() {
        return barcos;
    }
}
