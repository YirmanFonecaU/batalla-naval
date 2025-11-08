const Ship = require('./Ship');

class Board {
  constructor() {
    this.size = 10; // Tablero 10x10
    this.ships = [];
    this.shots = []; // Array de disparos recibidos { row, col, isHit }
    this.initializeShips();
  }

  // Inicializar barcos estándar de batalla naval
  initializeShips() {
    this.ships = [
      new Ship(1, 5), // Portaaviones
      new Ship(2, 4), // Crucero
      new Ship(3, 3), // Submarino
      new Ship(4, 2), // Destructor 1
      new Ship(5, 2)  // Destructor 2
    ];
  }

  // Verificar si una posición está dentro del tablero
  isValidPosition(row, col) {
    return row >= 0 && row < this.size && col >= 0 && col < this.size;
  }

  // Verificar si una posición está ocupada por algún barco
  isPositionOccupied(row, col, excludeShipId = null) {
    return this.ships.some(ship => {
      if (!ship.placed || ship.id === excludeShipId) return false;
      return ship.occupiesPosition(row, col);
    });
  }

  // Verificar separación mínima entre barcos
  hasMinimumSeparation(row, col, size, orientation, excludeShipId = null) {
    for (let i = 0; i < size; i++) {
      const shipRow = orientation === 'horizontal' ? row : row + i;
      const shipCol = orientation === 'horizontal' ? col + i : col;

      // Verificar las 8 casillas alrededor
      for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
        for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
          const checkRow = shipRow + deltaRow;
          const checkCol = shipCol + deltaCol;

          if (this.isValidPosition(checkRow, checkCol)) {
            if (this.isPositionOccupied(checkRow, checkCol, excludeShipId)) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }

  // Verificar si un barco puede ser colocado
  canPlaceShip(row, col, size, orientation, excludeShipId = null) {
    // Verificar límites
    if (orientation === 'horizontal') {
      if (col + size > this.size) return false;
    } else {
      if (row + size > this.size) return false;
    }

    // Verificar superposición
    for (let i = 0; i < size; i++) {
      const shipRow = orientation === 'horizontal' ? row : row + i;
      const shipCol = orientation === 'horizontal' ? col + i : col;

      if (this.isPositionOccupied(shipRow, shipCol, excludeShipId)) {
        return false;
      }
    }

    // Verificar separación mínima
    return this.hasMinimumSeparation(row, col, size, orientation, excludeShipId);
  }

  // Colocar un barco
  placeShip(shipId, row, col, orientation) {
    const ship = this.ships.find(s => s.id === shipId);
    if (!ship) return false;

    if (this.canPlaceShip(row, col, ship.size, orientation, shipId)) {
      ship.place(row, col, orientation);
      return true;
    }
    return false;
  }

  // Colocar barcos aleatoriamente
  placeShipsRandomly() {
    // Resetear barcos
    this.ships.forEach(ship => {
      ship.placed = false;
      ship.row = null;
      ship.col = null;
      ship.hits = [];
    });

    // Colocar cada barco
    this.ships.forEach(ship => {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 100) {
        const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        const maxRow = orientation === 'horizontal' ? this.size : this.size - ship.size;
        const maxCol = orientation === 'horizontal' ? this.size - ship.size : this.size;

        const row = Math.floor(Math.random() * maxRow);
        const col = Math.floor(Math.random() * maxCol);

        if (this.canPlaceShip(row, col, ship.size, orientation)) {
          ship.place(row, col, orientation);
          placed = true;
        }
        attempts++;
      }
    });
  }

  // Recibir un disparo
  receiveShot(row, col) {
    // Verificar si ya se disparó a esta posición
    const existingShot = this.shots.find(shot => shot.row === row && shot.col === col);
    if (existingShot) {
      return { isHit: existingShot.isHit, alreadyShot: true };
    }

    // Verificar si impacta algún barco
    let isHit = false;
    let sunkShip = null;

    for (const ship of this.ships) {
      if (ship.receiveHit(row, col)) {
        isHit = true;
        if (ship.isSunk()) {
          sunkShip = ship;
        }
        break;
      }
    }

    // Registrar el disparo
    this.shots.push({ row, col, isHit });

    return { isHit, sunkShip, alreadyShot: false };
  }

  // Verificar si todos los barcos están hundidos
  areAllShipsSunk() {
    return this.ships.every(ship => ship.isSunk());
  }

  // Obtener barco en posición
  getShipAt(row, col) {
    return this.ships.find(ship => ship.occupiesPosition(row, col));
  }

  // Convertir a JSON
  toJSON() {
    return {
      size: this.size,
      ships: this.ships.map(ship => ship.toJSON()),
      shots: this.shots
    };
  }

  // Crear desde JSON
  static fromJSON(data) {
    const board = new Board();
    board.size = data.size || 10;
    board.ships = data.ships ? data.ships.map(shipData => Ship.fromJSON(shipData)) : [];
    board.shots = data.shots || [];
    return board;
  }
}

module.exports = Board;