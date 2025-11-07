package main.java.model;
import java.util.ArrayList;
import java.util.List;

public class Ship {
    private String nombre;
    private int tamaño;
    private List<Cell> posiciones;
    private int impactos;

    public Cell(String nombre, int tamaño) {
        this.nombre = nombre;
        this.tamaño = tamaño;
        this.posiciones = new ArrayList<>();
        this.impactos = 0;
    }

    public void agregarCelda(Celda celda) {
        posiciones.add(celda);
        celda.setOcupada(true);
    }

    public boolean estaHundido() {
        return impactos >= tamaño;
    }

    public void recibirImpacto() {
        impactos++;
    }

    // Getters
    public String getNombre() { return nombre; }
    public List<Cell> getPosiciones() { return posiciones; }
}
