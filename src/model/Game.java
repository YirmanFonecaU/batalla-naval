package com.batallaNaval.model;

public class Game {
    private Player jugador1;
    private Player jugador2;
    private boolean turnoJugador1;
    private boolean terminado;

    public Game(String nombreJ1, String nombreJ2) {
        this.jugador1 = new Player(nombreJ1);
        this.jugador2 = new Player(nombreJ2);
        this.turnoJugador1 = true;
        this.terminado = false;
    }

    public boolean realizarDisparo(String jugador, int fila, int columna) {
        Player atacante = jugador.equals(jugador1.getNombre()) ? jugador1 : jugador2;
        Player defensor = jugador.equals(jugador1.getNombre()) ? jugador2 : jugador1;

        Cell objetivo = defensor.getTablero().obtenerCelda(fila, columna);
        objetivo.setAtacada(true);

        boolean acierto = objetivo.isOcupada();
        atacante.registrarDisparo(new Shot(fila, columna, acierto));

        if (acierto) {
            for (Ship barco : defensor.getTablero().getBarcos()) {
                if (barco.getPosiciones().contains(objetivo)) {
                    barco.recibirImpacto();
                    if (barco.estaHundido()) verificarFin();
                    break;
                }
            }
        }

        turnoJugador1 = !turnoJugador1;
        return acierto;
    }

    private void verificarFin() {
        boolean todosHundidosJ1 = jugador1.getTablero().getBarcos().stream().allMatch(Barco::estaHundido);
        boolean todosHundidosJ2 = jugador2.getTablero().getBarcos().stream().allMatch(Barco::estaHundido);
        if (todosHundidosJ1 || todosHundidosJ2) terminado = true;
    }

    // Getters
    public boolean isTerminado() { return terminado; }
    public boolean isTurnoJugador1() { return turnoJugador1; }
}
