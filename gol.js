$(document).ready(function() {
  var app = new App();
  app.initialize();
});

/*
  TBC : The App object will be responsible for managing the application.

  Its roles consist of:
  - Managing all page elements
  - Managing event listeners
  - Managing drawing to the canvas / output from the GOL object
*/
function App(gol) {
  // TBC : Self object for public methods / properties
  var self = { };

  // TBC : Public properties
  self.gol;
  self.elements = { };
  self.context = { };
  self.colors = {
    cell: {
      r: 255,
      g: 255,
      b: 0,
      a: 1
    },
    background: {
      r: 0,
      g: 0,
      b: 0,
      a: 0
    }
  };

  // TBC : Map elements to formal object and setup context / vars
  self.initialize = function() {
    self.elements.btnNewGame        = $('#btn-newGame');
    self.elements.btnGameState      = $('#btn-gameState');
    self.elements.btnGroupInterval  = $('#btnGroup-interval');
    self.elements.btnGroupSize      = $('#btnGroup-size');
    self.elements.canvas            = $('#canvas');
    self.elements.statsTable        = $('#stats-table');
    self.elements.cellDetailsTable  = $('#cell-details-table');

    self.elements.btnGameState.setToStart = function() { $(this).html('start'); };
    self.elements.btnGameState.setToPause = function() { $(this).html('pause'); };
    self.elements.btnGameState.setToResume = function() { $(this).html('resume'); };

    self.context = self.elements.canvas[0].getContext('2d');

    self.bindEventHandlers();
  }

  // TBC : Bind event handlers to page elements and operations
  self.bindEventHandlers = function() {

    // TBC : New Game loads new game instance and seeds it
    self.elements.btnNewGame.on('click', function() {
      self.gol = new GameOfLife();

      self.gol.seed({
        interval: self.getInterval(),
        size: self.elements.canvas[0].width / self.getSize(),
        cellGenerationChance: 50
      });
      self.elements.btnGameState.setToStart();
    });

    // TBC : Game state button logic changes on whether game is a 'new-game', the game is 'paused', or the game is 'running'
    // TBC : This button should ultimately change the state of the game.
    self.elements.btnGameState.on('click', function() {
      if (self.gol.gameState === self.gol.GAME_STATES.NEW_GAME || self.gol.gameState === self.gol.GAME_STATES.PAUSED) {
        self.gol.run();
        self.elements.btnGameState.setToPause();
      } else {
        self.gol.pause();
        self.elements.btnGameState.setToResume();
      }
    });

    // TBC : Gather cell info for cell under mouse click and report details
    self.elements.canvas.on('click', function(event) {
      var canvasPosition = self.toCanvasPos(event.clientX, event.clientY);

      if (self.gol) {
        var gridPosition = self.toGridPos(canvasPosition.x, canvasPosition.y),
            cell = self.gol.rows[gridPosition.row][gridPosition.col];

        self.reportCellDetails(cell, canvasPosition);
      } else {
        alert('Please start a game');
      }
    });

    // TBC : Clicking an option in a button-group should set the appropriate button selected
    $(document).on('click', '.button-group button', function() {
      self.selectGroupButton($(this));
    });

    // TBC : When game is seeded, draw grid to canvas and report stats
    $(document).on('gol:seed', function() {
      self.clearCanvas();
      self.drawLivingCells();
      self.reportStats();
    });

    // TBC : When game ticks, draw grid to canvas and report stats
    $(document).on('gol:tick', function() {
      self.clearCanvas();
      self.drawLivingCells();
      self.reportStats();
    });
  }

  // TBC : Draw GOL grid to canvas
  self.drawLivingCells = function() {
    var cellOffset = 0,
        size = self.getSize();

    // TBC : Offset creates a slight gap between cells.
    cellOffset = size / 5;

    self.context.beginPath();
    self.gol.eachCell(function(cell) {
      var color = self.clone(self.colors.cell);

      // TBC : Subtract the green from the yellow, leading to a redder color as cell ages
      color.g -= cell.age;
      self.context.fillStyle = self.toRGBAString(color);

      // TBC : Draw if alive
      if(cell.isAlive()) {
        self.context.fillRect(
          cell.position.col * size + cellOffset,
          cell.position.row * size + cellOffset,
          size - cellOffset,
          size - cellOffset
        );
      }
    });
    self.context.closePath();
  }

  // TBC : clear canvas
  self.clearCanvas = function() {
    self.context.fillStyle = self.toRGBAString(self.colors.background);
    self.context.clearRect(0, 0, self.elements.canvas[0].width, self.elements.canvas[0].height);
  }

  // TBC : Write stats to stats table
  self.reportStats = function() {
    self.elements.statsTable.empty();
    for(key in self.gol.stats) {
      var statRow = $('<tr>'),
          label = self.gol.stats[key].label,
          value = self.gol.stats[key].value;

      // TBC : Add thousands seperator if number
      if (typeof value === 'number') {
        value = value.toLocaleString();
      }
      statRow.append($('<td>').html(label + ':').addClass('text-right'));
      statRow.append($('<td>').html(value).addClass('text-left'));

      self.elements.statsTable.append(statRow);
    }
  }

  // TBC : Write cell details to cell details table
  self.reportCellDetails = function(cell, canvasPosition) {
    self.elements.cellDetailsTable.empty();

    var details = {
      canvasPosition: {
        label: 'Canvas Position',
        value: 'x:' + canvasPosition.x + ', y:' + canvasPosition.y
      },
      gridPosition: {
        label: 'Grid Position',
        value: '[' + cell.position.row + ',' + cell.position.col + ']'
      },
      age: {
        label: 'Age',
        value: cell.age.toString()
      },
      state: {
        label: 'State',
        value: (cell.state === cell.STATES.ALIVE) ? 'ALIVE' : 'DEAD'
      },
      nextState: {
        label: 'Next State',
        value: (cell.nextState === cell.STATES.ALIVE) ? 'ALIVE' : 'DEAD'
      }
    }

    for(key in details) {
      var row = $('<tr>'),
          label = details[key].label,
          value = details[key].value;

      row.append($('<td>').html(label + ':').addClass('text-right'));
      row.append($('<td>').html(value).addClass('text-left'));

      self.elements.cellDetailsTable.append(row);
    }
  }

  // TBC : 'Select' the button in the button group that was clicked
  self.selectGroupButton = function(button) {
    var btnGroup = button.closest('.button-group');
    var selected = btnGroup.find('.selected');

    selected.removeClass('selected');
    button.addClass('selected');
  }

  // TBC : Map mouse coordinates to canvas coords
  self.toCanvasPos = function(x, y) {
    var canvasBoundary = self.elements.canvas[0].getBoundingClientRect();

    return {
      x: x - canvasBoundary.left,
      y: y - canvasBoundary.top
    }
  }

  // TBC : Map canvas coordinates to cell location in grid
  self.toGridPos = function(x, y) {
    return {
      row: Math.floor(y / self.getSize()),
      col: Math.floor(x / self.getSize())
    }
  }

  // TBC : Convert 'color' object to rgba string
  self.toRGBAString = function(color) {
    return 'RGBA(' + color.r + ',' + color.g + ',' + color.b + ',' + color.a + ')';
  }

  // TBC : Deep copy an element
  self.clone = function(o) {
    // TBC : Call constructor of original object to create a new copy
    var copy = o.constructor();

    // TBC : Map all properties and values of original to copy
    for (var key in o) {
        if (o.hasOwnProperty(key)) copy[key] = o[key];
    }
    return copy;
  }

  // TBC : Get interval from selected DOM element
  self.getInterval = function() {
    var selected = self.elements.btnGroupInterval.find('.selected');
    return Number.parseInt(selected.data('interval'));
  }

  // TBC : Get size from selected DOM element
  self.getSize = function() {
    var selected = self.elements.btnGroupSize.find('.selected');
    return Number.parseInt(selected.data('size'));
  }

  return self;
}

/*
  TBC : The GameOfLife object will be responsible for the actual GameOfLife simulation.

  This object will be responsible for handling the actual game rules and serve as the
  underlying data respresentation of the game. Ultimately, the game should be portable
  and not be tied to the canvas or the GUI in any way. It should simply trigger
  events and serve as the game's logical manager.
*/
function GameOfLife() {
  var DEFAULT_SIZE = 600,
      DEFAULT_INTERVAL = 1000,
      DEFAULT_PERCENT_CELL_GENERATION_CHANCE = 10;

  var self = { };

  self.GAME_STATES = {
    NEW_GAME: 'new-game',
    RUNNING: 'running',
    PAUSED: 'paused'
  }

  self.size = DEFAULT_SIZE;
  self.interval = DEFAULT_INTERVAL;
  self.cellGenerationChance = DEFAULT_PERCENT_CELL_GENERATION_CHANCE;
  self.gameState = self.GAME_STATES.NEW_GAME;

  self.rows = [];
  self.intervalId;
  self.stats = {
    generations: {
      label: 'generations',
      value: 0
    },
    totalCells:  {
      label: 'total cells',
      value: 0
    },
    livingCells:  {
      label: 'living cells',
      value: 0
    }
  }

  // TBC : Utility method to iterate through valid section of array (inside dead border) and execute callback
  self.eachCell = function(callback) {
    for (var i = 1; i < self.size - 1; i++) {
      for (var j = 1; j < self.size - 1; j++) {
        var cell = self.rows[i][j];
        callback(cell);
      }
    }
  }

  // TBC : Initial seed of game
  self.seed = function(options) {

    // TBC : Setup properties based on configurable options
    self.size = options.size || DEFAULT_SIZE;
    self.interval = options.interval || DEFAULT_INTERVAL;
    self.cellGenerationChance = options.cellGenerationChance || DEFAULT_PERCENT_CELL_GENERATION_CHANCE;

    for (var i = 0; i < self.size; i++) {
      var columns = [];

      for (var j = 0; j < self.size; j++) {
        var cell = new Cell();
        cell.position.row = i;
        cell.position.col = j;

        // TBC : Seed dead cell border
        if (i === 0 || j === 0 || i === self.size - 1 || j === self.size - 1) {
          cell.die();
        } else {
          self.randomizeInitialCellState(cell);

          if (cell.isAlive()) self.stats.livingCells.value++;
        }
        columns[j] = cell;
      }
      self.rows[i] = columns;
    }

    self.eachCell(function(cell) {
      self.determineNextCellState(cell);
    });

    self.stats.totalCells.value = self.size * self.size;
    $(document).trigger('gol:seed');
  }

  // TBC : Randomize cell state based on 'cellGenerationChance'
  self.randomizeInitialCellState = function(cell) {
    var random = Math.floor(Math.random() * 100);
    random < self.cellGenerationChance ? cell.live() : cell.die();
  }

  // TBC : Setup and run game loop, change game state to 'RUNNING'
  self.run = function() {
    self.gameState = self.GAME_STATES.RUNNING
    self.intervalId = setInterval(self.tick, self.interval);
  }

  // TBC : Pause game
  self.pause = function() {
    self.gameState = self.GAME_STATES.PAUSED;
    clearInterval(self.intervalId);
  }

  // TBC : Iterate one generation of simulation
  self.tick = function() {
    self.stats.livingCells.value = 0;

    // TBC : Update all cells based on their calculated 'Next State'
    self.eachCell(function(cell){
      self.updateCellState(cell);
    });

    // TBC : Determine each cell's next state based on neighbors
    self.eachCell(function(cell){
      self.determineNextCellState(cell);
    });

    self.stats.generations.value++;
    $(document).trigger('gol:tick');
  }

  // TBC : Return list of neighbor cells
  self.getCellNeighbors = function(cell) {
    var p = cell.position,
        neighbors = [];

    neighbors.push( self.rows[ p.row - 1 ][ p.col - 1 ] ); // NW
    neighbors.push( self.rows[ p.row - 1 ][ p.col ] );     // N
    neighbors.push( self.rows[ p.row - 1 ][ p.col + 1 ] ); // NE
    neighbors.push( self.rows[ p.row ][ p.col + 1 ] );     // E
    neighbors.push( self.rows[ p.row + 1 ][ p.col + 1 ] ); // SE
    neighbors.push( self.rows[ p.row + 1 ][ p.col ] );     // S
    neighbors.push( self.rows[ p.row + 1 ][ p.col - 1 ] ); // SW
    neighbors.push( self.rows[ p.row ][ p.col - 1 ] );     // W

    return neighbors;
  }

  // TBC : Set current state based on future state and calcuate livingCells
  self.updateCellState = function(cell) {
    if (cell.isAlive() && cell.doesLiveNext()) {
       cell.incrementAge();
       self.stats.livingCells.value++;
    } else if (cell.doesLiveNext()){
      cell.live();
      self.stats.livingCells.value++;
    } else {
      cell.die();
    }
  }

  // TBC : Determine next state based on neighbors and rules ( implemented as B3S23 )
  self.determineNextCellState = function(cell) {
    var neighbors = self.getCellNeighbors(cell),
        count = 0;

    neighbors.forEach(function(neighbor) {
      if (neighbor.isAlive()) count++;

      if (count > 3) {
        cell.dieNext();
        return;
      }
    });

    if (cell.isAlive()) {
      (count === 2 || count === 3) ? cell.liveNext() : cell.dieNext()
    } else if (count === 3) {
      cell.liveNext();
    }
  }

  return self;
}

/*
  TBC : The Cell object will represent the data for a single cell in the GOL grid
*/
function Cell() {
  var self = { };

  self.STATES = { ALIVE: 1, DEAD: 0 };

  self.position = { row: 0, col: 0 };
  self.age = 0;
  self.state = self.STATES.DEAD;
  self.nextState = self.STATES.DEAD;

  // TBC : Return true if cell is currently living
  self.isAlive = function() { return (self.state === self.STATES.ALIVE) ? true : false }

  // TBC : Return true if cell is going to be ALIVE in the next generation
  self.doesLiveNext = function() { return (self.nextState === self.STATES.ALIVE) ? true : false }

  // TBC : Set current state as ALIVE
  self.live = function() { self.state = self.STATES.ALIVE; }

  // TBC : Set next state to ALIVE
  self.liveNext = function() { self.nextState = self.STATES.ALIVE; }

  // TBC : Set next state to DEAD
  self.dieNext = function() { self.nextState = self.STATES.DEAD; }

  // TBC : Set current state to DEAD and reset cell age
  self.die = function() {
    self.state = self.STATES.DEAD;
    self.resetAge();
  }

  // TBC : Bump age by 1
  self.incrementAge = function() { self.age++; }

  // TBC : Reset age to 0
  self.resetAge = function() { self.age = 0; }

  return self;
}
