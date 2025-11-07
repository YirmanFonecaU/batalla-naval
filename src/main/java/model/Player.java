package main.java.model;
import java.util.ArrayList;
import java.util.List;
import Board;

public class Player {
    private String nombre;
    private Board tableroPropio;
    private List<Shot> disparosRealizados;

    public Player(String nombre) {
        this.nombre = nombre;
        this.tableroPropio = new Board();
        this.disparosRealizados = new ArrayList<>();
    }

    public void registrarDisparo(Shot disparo) {
        disparosRealizados.add(disparo);
    }

    public String getNombre() { return nombre; }
    public Board getTablero() { return tableroPropio; }
    public List<Shot> getDisparosRealizados() { return disparosRealizados; }
}
