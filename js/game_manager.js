function GameManager(size, InputManager, Actuator, ScoreManager) {
    this.size = size; // Size of the grid
    this.inputManager = new InputManager;
    this.scoreManager = new ScoreManager;
    this.actuator = new Actuator;

    this.startTiles = 2;

    this.inputManager.on("move", this.move.bind(this));
    this.inputManager.on("restart", this.restart.bind(this));
    this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

    this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
    this.actuator.
    continue ();
    this.setup();
};

// Keep playing after winning
GameManager.prototype.keepPlaying = function () {
    this.keepPlaying = true;
    this.actuator.
    continue ();
};

GameManager.prototype.isGameTerminated = function () {
    if (this.over || (this.won && !this.keepPlaying)) {
        return true;
    } else {
        return false;
    }
};

// Set up the game
GameManager.prototype.setup = function () {
    this.grid = new Grid(this.size);

    this.score = 0;
    this.over = false;
    this.won = false;
    this.keepPlaying = false;

    // Add the initial tiles
    this.addStartTiles();

    // Update the actuator
    this.actuate();
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
    for (var i = 0; i < this.startTiles; i++) {
        this.addRandomTile();
    }
};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
    if (this.grid.cellsAvailable()) {
        var value = Math.random() < 0.9 ? 1 : 5;
        var tile = new Tile(this.grid.randomAvailableCell(), value);

        this.grid.insertTile(tile);
    }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
    if (this.scoreManager.get() < this.score) {
        this.scoreManager.set(this.score);
    }

    this.actuator.actuate(this.grid, {
        score: this.score,
        over: this.over,
        won: this.won,
        bestScore: this.scoreManager.get(),
        terminated: this.isGameTerminated()
    });

};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function () {
    this.grid.eachCell(function (x, y, tile) {
        if (tile) {
            tile.mergedFrom = null;
            tile.savePosition();
        }
    });
};

// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (direction) {
    // 0: up, 1: right, 2:down, 3: left
    var self = this;

    if (this.isGameTerminated()) return; // Don't do anything if the game's over
    var cell, tile;

    var vector = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved = false;

    // Save the current tile positions and remove merger information
    this.prepareTiles();

    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach(function (x) {
        traversals.y.forEach(function (y) {
            cell = {
                x: x,
                y: y
            };
            tile = self.grid.cellContent(cell);

            if (tile && tile.merged) {
                self.grid.removeTile(tile);
            } else if (tile) {
                var positions = self.findFarthestPosition(cell, vector);
                var next = self.grid.cellContent(positions.next);
                var pos2 = null;
                var next2 = null;
                if (next) {
                    pos2 = self.findFarthestPosition({
                        x: next.x,
                        y: next.y
                    }, vector);
                    next2 = self.grid.cellContent(pos2.next);
                }
                // Only one merger per row traversal?
                 if (next && next2 && !next.mergedFrom && next != next2 && (
((tile.value==1)&&(next.value==2)&&(next2.value==2))||
((tile.value==2)&&(next.value==1)&&(next2.value==2))||
((tile.value==2)&&(next.value==2)&&(next2.value==1))||
((tile.value==10)&&(next.value==20)&&(next2.value==20))||
((tile.value==20)&&(next.value==10)&&(next2.value==20))||
((tile.value==20)&&(next.value==20)&&(next2.value==10))||
((tile.value==100)&&(next.value==200)&&(next2.value==200))||
((tile.value==200)&&(next.value==100)&&(next2.value==200))||
((tile.value==200)&&(next.value==200)&&(next2.value==100))||
((tile.value==1000)&&(next.value==2000)&&(next2.value==2000))||
((tile.value==2000)&&(next.value==1000)&&(next2.value==2000))||
((tile.value==2000)&&(next.value==2000)&&(next2.value==1000))||
((tile.value==10000)&&(next.value==20000)&&(next2.value==20000))||
((tile.value==20000)&&(next.value==10000)&&(next2.value==20000))||
((tile.value==20000)&&(next.value==20000)&&(next2.value==10000))||
((tile.value==5)&&(next.value==10)&&(next2.value==5))||
((tile.value==50)&&(next.value==100)&&(next2.value==50))||
((tile.value==500)&&(next.value==1000)&&(next2.value==500))||
((tile.value==5000)&&(next.value==10000)&&(next2.value==5000)))) {
                    var merged = new Tile(pos2.next, tile.value+next.value+next2.value);
                    merged.mergedFrom = [next2, next, tile];
                    tile.merged = true;
                    next.merged = true;
                    next2.merged = true;

                    self.grid.removeTile(tile);
                    self.grid.removeTile(next);
                    self.grid.removeTile(next2);

                    self.grid.insertTile(merged);
                    // Converge the two tiles' positions
                    tile.updatePosition(pos2.next);
                    next.updatePosition(pos2.next);
                    // Update the score
                    self.score += merged.value;

                    // The mighty 20 Euro tile
                    if (merged.value === 2000) self.won = true;
                } else if (next && next.value === tile.value && !next.mergedFrom && next.value!=2 && next.value!=20 && next.value!=200 && next.value!=2000 && next.value!=20000 && next.value!=50000) {
                    var merged = new Tile(positions.next, tile.value * 2);
                    merged.mergedFrom = [tile, next];
                    tile.merged = true;
                    next.merged = true;

                    self.grid.insertTile(merged);
                    self.grid.removeTile(tile);

                    // Converge the two tiles' positions
                    tile.updatePosition(positions.next);

                    // Update the score
                    self.score += merged.value;

                    // The mighty 20 Euro tile
                    if (merged.value === 2000) self.won = true;
                } else if (!tile.merged) {
                    self.moveTile(tile, positions.farthest);
                }

                if (tile && !self.positionsEqual(cell, tile)) {
                    moved = true; // The tile moved from its original cell!
                }
            }

        });
    });

    if (moved) {
        this.addRandomTile();

        if (!this.movesAvailable()) {
            this.over = true; // Game over!
        }

        this.actuate();
    }
};

// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (direction) {
    // Vectors representing tile movement
    var map = {
        0: {
            x: 0,
            y: -1
        },
        // up
        1: {
            x: 1,
            y: 0
        },
        // right
        2: {
            x: 0,
            y: 1
        },
        // down
        3: {
            x: -1,
            y: 0
        } // left
    };

    return map[direction];
};

// Build a list of positions to traverse in the right order
GameManager.prototype.buildTraversals = function (vector) {
    var traversals = {
        x: [],
        y: []
    };

    for (var pos = 0; pos < this.size; pos++) {
        traversals.x.push(pos);
        traversals.y.push(pos);
    }

    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();

    return traversals;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
    var previous;

    // Progress towards the vector direction until an obstacle is found
    do {
        previous = cell;
        cell = {
            x: previous.x + vector.x,
            y: previous.y + vector.y
        };
    } while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell));

    return {
        farthest: previous,
        next: cell // Used to check if a merge is required
    };
};

GameManager.prototype.movesAvailable = function () {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles(more expensive check)
GameManager.prototype.tileMatchesAvailable = function () {
    var self = this;

    var tile;
    var i = 0;
    while (i < 4) {
        for (var x = 0; x < this.size; x++) {
            for (var y = 0; y < this.size; y++) {
                var vector = this.getVector(i);
                tile = this.grid.cellContent({
                    x: x,
                    y: y
                });

                cell = {
                    x: x,
                    y: y
                };
                tile = self.grid.cellContent(cell);

                if (tile) {
                    var positions = self.findFarthestPosition(cell, vector);
                    var next = self.grid.cellContent(positions.next);
                    var pos2 = self.findFarthestPosition({
                        x: cell.x + vector.x,
                        y: cell.y + vector.y
                    }, vector);
                    var next2 = self.grid.cellContent(pos2.next);
                    // Only one merger per row traversal?
                                    if (next && next2 && next != next2 && (
((tile.value==1)&&(next.value==2)&&(next2.value==2))||
((tile.value==2)&&(next.value==1)&&(next2.value==2))||
((tile.value==2)&&(next.value==2)&&(next2.value==1))||
((tile.value==10)&&(next.value==20)&&(next2.value==20))||
((tile.value==20)&&(next.value==10)&&(next2.value==20))||
((tile.value==20)&&(next.value==20)&&(next2.value==10))||
((tile.value==100)&&(next.value==200)&&(next2.value==200))||
((tile.value==200)&&(next.value==100)&&(next2.value==200))||
((tile.value==200)&&(next.value==200)&&(next2.value==100))||
((tile.value==1000)&&(next.value==2000)&&(next2.value==2000))||
((tile.value==2000)&&(next.value==1000)&&(next2.value==2000))||
((tile.value==2000)&&(next.value==2000)&&(next2.value==1000))||
((tile.value==10000)&&(next.value==20000)&&(next2.value==20000))||
((tile.value==20000)&&(next.value==10000)&&(next2.value==20000))||
((tile.value==20000)&&(next.value==20000)&&(next2.value==10000))||
((tile.value==5)&&(next.value==10)&&(next2.value==5))||
((tile.value==50)&&(next.value==100)&&(next2.value==50))||
((tile.value==500)&&(next.value==1000)&&(next2.value==500))||
((tile.value==5000)&&(next.value==10000)&&(next2.value==5000)))) {
                        return true;
                    }
             if (next && next.value === tile.value && next.value!=2 && next.value!=20 && next.value!=200 && next.value!=2000 && next.value!=20000 &&               next.value!=50000) {
        return true;
            }

                }
            }
        }
        i += 1;
    }

    return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
    return first.x === second.x && first.y === second.y;
};