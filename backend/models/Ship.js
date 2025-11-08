class Ship {
  constructor(id, size, row = null, col = null, orientation = 'horizontal') {
    this.id = id;
    this.size = size;
    this.row = row;
    this.col = col;
    this.orientation = orientation; // 'horizontal' or 'vertical'
    this.hits = []; // Array de posiciones que han sido impactadas
    this.placed = false;
  }

  // Obtener todas las posiciones que ocupa el barco
  getPositions() {
    if (!this.placed || this.row === null || this.col === null) {
      return [];
    }

    const positions = [];
    for (let i = 0; i < this.size; i++) {
      if (this.orientation === 'horizontal') {
        positions.push({ row: this.row, col: this.col + i });
      } else {
        positions.push({ row: this.row + i, col: this.col });
      }
    }
    return positions;
  }

  // Verificar si el barco ocupa una posición específica
  occupiesPosition(row, col) {
    return this.getPositions().some(pos => pos.row === row && pos.col === col);
  }

  // Recibir un impacto en una posición
  receiveHit(row, col) {
    if (this.occupiesPosition(row, col)) {
      const hitPosition = { row, col };
      // Verificar si ya fue impactado en esta posición
      const alreadyHit = this.hits.some(hit => hit.row === row && hit.col === col);
      if (!alreadyHit) {
        this.hits.push(hitPosition);
      }
      return true;
    }
    return false;
  }

  // Verificar si el barco está hundido
  isSunk() {
    return this.placed && this.hits.length === this.size;
  }

  // Colocar el barco en el tablero
  place(row, col, orientation) {
    this.row = row;
    this.col = col;
    this.orientation = orientation;
    this.placed = true;
  }

  // Convertir a objeto JSON
  toJSON() {
    return {
      id: this.id,
      size: this.size,
      row: this.row,
      col: this.col,
      orientation: this.orientation,
      hits: this.hits,
      placed: this.placed,
      isSunk: this.isSunk()
    };
  }

  // Crear desde objeto JSON
  static fromJSON(data) {
    const ship = new Ship(data.id, data.size, data.row, data.col, data.orientation);
    ship.hits = data.hits || [];
    ship.placed = data.placed || false;
    return ship;
  }
}
export default Ship;
//module.exports = Ship;