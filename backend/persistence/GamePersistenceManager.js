// backend/persistence/GamePersistenceManager.js
/**
 * 🎯 PROPÓSITO: Manejar guardado y carga de partidas en tu estructura existente
 * 🔧 RESPONSABILIDAD: Solo persistencia, usar con tu GameController actual
 */

import fs from 'fs/promises';
import path from 'path';

class GamePersistenceManager {
  constructor() {
    // 📁 Usar tu carpeta 'data' existente
    this.dataDir = path.join(process.cwd(), 'data');
    
    // 📂 Subcarpetas dentro de tu estructura
    this.activeGamesDir = path.join(this.dataDir, 'active-games');    // Partidas en curso
    this.savedGamesDir = path.join(this.dataDir, 'saved-games');      // Guardados del usuario  
    this.finishedGamesDir = path.join(this.dataDir, 'finished-games'); // Partidas terminadas
    
    // 🚀 Inicializar al crear la instancia
    this.initializePersistence();
  }

  /**
   * 📁 Inicializar carpetas de persistencia
   * Se ejecuta automáticamente al iniciar
   */
  async initializePersistence() {
    try {
      // Crear subcarpetas dentro de tu data/ existente
      await fs.mkdir(this.activeGamesDir, { recursive: true });
      await fs.mkdir(this.savedGamesDir, { recursive: true });
      await fs.mkdir(this.finishedGamesDir, { recursive: true });
      
      console.log('💾 GamePersistenceManager inicializado');
      console.log(`   📂 Juegos activos: ${this.activeGamesDir}`);
      console.log(`   💾 Guardados: ${this.savedGamesDir}`);
      console.log(`   ✅ Terminados: ${this.finishedGamesDir}`);
    } catch (error) {
      console.error('❌ Error inicializando persistencia:', error);
    }
  }

  /**
   * 💾 AUTO-GUARDAR partida activa (se ejecuta automáticamente cada disparo)
   * @param {string} gameId - ID único de la partida 
   * @param {Object} gameState - Estado completo del juego desde tu GameController
   */
  async autoSaveGame(gameId, gameState) {
    try {
      // 🏷️ Crear estructura del auto-guardado
      const autoSaveData = {
        gameId: gameId,
        type: 'auto-save',
        timestamp: new Date().toISOString(),
        gameState: gameState,
        metadata: {
          version: '1.0',
          source: 'GameController',
          autoSave: true
        }
      };

      // 💾 Guardar en carpeta de juegos activos
      const filename = `${gameId}_autosave.json`;
      const filepath = path.join(this.activeGamesDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(autoSaveData, null, 2));
      
      console.log(`💾 Auto-guardado: ${gameId}`);
      return { success: true, type: 'auto-save', filepath };

    } catch (error) {
      console.error(`❌ Error en auto-guardado ${gameId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🎮 GUARDAR partida manual (cuando el jugador quiere guardar)
   * @param {string} gameId - ID de la partida
   * @param {Object} gameState - Estado actual del juego
   * @param {string} saveName - Nombre que le da el jugador al guardado
   */
  async saveGameManually(gameId, gameState, saveName = null) {
    try {
      // 🏷️ Generar nombre del guardado
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const finalSaveName = saveName || `save_${timestamp}`;
      
      const manualSaveData = {
        gameId: gameId,
        saveName: finalSaveName,
        type: 'manual-save',
        timestamp: new Date().toISOString(),
        gameState: gameState,
        metadata: {
          version: '1.0',
          source: 'Player',
          userSave: true
        }
      };

      // 💾 Guardar en carpeta de guardados manuales
      const filename = `${gameId}_${finalSaveName}.json`;
      const filepath = path.join(this.savedGamesDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(manualSaveData, null, 2));
      
      console.log(`💾 Guardado manual: ${gameId} - ${finalSaveName}`);
      return { 
        success: true, 
        type: 'manual-save', 
        saveName: finalSaveName,
        filepath 
      };

    } catch (error) {
      console.error(`❌ Error guardando manualmente ${gameId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📂 CARGAR partida (auto-guardado o manual)
   * @param {string} gameId - ID de la partida
   * @param {string} loadType - 'auto' o 'manual'  
   * @param {string} saveName - Nombre específico del guardado (solo para manual)
   */
  async loadGame(gameId, loadType = 'auto', saveName = null) {
    try {
      let filepath;
      
      if (loadType === 'auto') {
        // Cargar el auto-guardado más reciente
        filepath = path.join(this.activeGamesDir, `${gameId}_autosave.json`);
      } else if (loadType === 'manual' && saveName) {
        // Cargar guardado manual específico
        filepath = path.join(this.savedGamesDir, `${gameId}_${saveName}.json`);
      } else {
        throw new Error('Tipo de carga no válido o falta nombre del guardado');
      }

      // 📖 Leer archivo
      const data = await fs.readFile(filepath, 'utf8');
      const saveData = JSON.parse(data);

      console.log(`📂 Partida cargada: ${gameId} (${loadType})`);
      return {
        success: true,
        gameState: saveData.gameState,
        metadata: saveData.metadata,
        saveName: saveData.saveName || 'auto-save',
        timestamp: saveData.timestamp
      };

    } catch (error) {
      console.error(`❌ Error cargando ${gameId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📋 LISTAR guardados disponibles para una partida
   * @param {string} gameId - ID de la partida
   */
  async listAvailableSaves(gameId) {
    try {
      const saves = {
        autoSave: null,
        manualSaves: []
      };

      // 🔍 Buscar auto-guardado
      try {
        const autoSavePath = path.join(this.activeGamesDir, `${gameId}_autosave.json`);
        const autoSaveStats = await fs.stat(autoSavePath);
        saves.autoSave = {
          type: 'auto-save',
          lastModified: autoSaveStats.mtime,
          size: autoSaveStats.size,
          filepath: autoSavePath
        };
      } catch {
        // No hay auto-guardado, normal en partidas nuevas
      }

      // 🔍 Buscar guardados manuales
      try {
        const files = await fs.readdir(this.savedGamesDir);
        const gameFiles = files.filter(file => 
          file.startsWith(`${gameId}_`) && file.endsWith('.json')
        );

        for (const file of gameFiles) {
          try {
            const filepath = path.join(this.savedGamesDir, file);
            const stats = await fs.stat(filepath);
            
            // Extraer nombre del guardado del filename
            const saveName = file.replace(`${gameId}_`, '').replace('.json', '');
            
            saves.manualSaves.push({
              saveName: saveName,
              type: 'manual-save',
              lastModified: stats.mtime,
              size: stats.size,
              filepath: filepath
            });
          } catch (fileError) {
            console.warn(`⚠️ Archivo corrupto: ${file}`);
          }
        }

        // Ordenar por fecha (más reciente primero)
        saves.manualSaves.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

      } catch {
        // No hay guardados manuales
      }

      console.log(`📋 Guardados encontrados para ${gameId}:`);
      console.log(`   🔄 Auto-guardado: ${saves.autoSave ? 'Sí' : 'No'}`);
      console.log(`   💾 Guardados manuales: ${saves.manualSaves.length}`);
      
      return { success: true, saves };

    } catch (error) {
      console.error(`❌ Error listando guardados ${gameId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ✅ ARCHIVAR partida terminada
   * @param {string} gameId - ID de la partida terminada
   * @param {Object} finalGameState - Estado final del juego
   * @param {string} winner - Ganador de la partida
   */
  async archiveFinishedGame(gameId, finalGameState, winner) {
    try {
      const archiveData = {
        gameId: gameId,
        type: 'finished-game',
        timestamp: new Date().toISOString(),
        winner: winner,
        finalGameState: finalGameState,
        metadata: {
          version: '1.0',
          archived: true,
          gameCompleted: true
        }
      };

      // 📦 Guardar en carpeta de terminados
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${gameId}_finished_${timestamp}.json`;
      const filepath = path.join(this.finishedGamesDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(archiveData, null, 2));
      
      // 🗑️ Limpiar auto-guardado (ya no es necesario)
      try {
        const autoSavePath = path.join(this.activeGamesDir, `${gameId}_autosave.json`);
        await fs.unlink(autoSavePath);
        console.log(`🗑️ Auto-guardado eliminado para ${gameId}`);
      } catch {
        // No había auto-guardado, está bien
      }

      console.log(`✅ Partida archivada: ${gameId} - Ganador: ${winner}`);
      return { success: true, winner, filepath };

    } catch (error) {
      console.error(`❌ Error archivando ${gameId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📊 VERIFICAR si existe una partida
   * @param {string} gameId - ID de la partida
   */
  async gameExists(gameId) {
    try {
      const autoSavePath = path.join(this.activeGamesDir, `${gameId}_autosave.json`);
      await fs.access(autoSavePath);
      return true;
    } catch {
      return false;
    }
  }
}

// 🎯 Exportar instancia única para usar en toda tu aplicación
export default new GamePersistenceManager();