package main.java.persistence;

import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import com.google.gson.Gson;

import main.java.model.CheckPoint;

public class PersistenceJason {

    private final Gson gson = new Gson();

    public PersistenceJason() {
        this.gson = new GsonBuilder().setPrettyPrinting().create();
    }

    public void guardar(CheckPoint checkpoint, String rutaArchivo) {
        try (FileWriter writer = new FileWriter(rutaArchivo)) {
            gson.toJson(checkpoint, writer);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public CheckPoint cargar(String rutaArchivo) {
        try (FileReader reader = new FileReader(rutaArchivo)) {
            return gson.fromJson(reader, CheckPoint.class);
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }
}
