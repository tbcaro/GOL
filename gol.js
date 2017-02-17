$(document).ready(function() {
  var app = new App();
  app.initialize();
});

/*
  TBC : The App object will be responsible for managing the application.

  It will be responsible for handling page inputs and handling page elements.
  It will also be responsible for handling events or data from the GameOfLife object,
  and correlating the underlying game respresentation to the GUI.
*/
function App(gol) {
  var self = { };

  // TBC : Properties
  self.gol;
  self.elements = { };
  self.context = { };
  self.colors = { cell: 'yellow', background: 'black' };

  // TBC : Methods
  self.initialize = function() {
    self.elements.btnNewGame        = $('#btn-newGame');
    self.elements.btnGameState      = $('#btn-gameState');
    self.elements.btnGroupInterval  = $('#btnGroup-interval');
    self.elements.btnGroupSize      = $('#btnGroup-size');
    self.elements.canvas            = $('#canvas');
    self.elements.statsTable        = $('#stats-table');

    self.elements.btnGameState.setToStart = function() { $(this).html('start'); };
    self.elements.btnGameState.setToPause = function() { $(this).html('pause'); };
    self.elements.btnGameState.setToResume = function() { $(this).html('resume'); };

    self.context = self.elements.canvas[0].getContext('2d');

    self.bindEventHandlers();
  }

  self.bindEventHandlers = function() {
    // TBC : New Game loads new game instance and starts it
    self.elements.btnNewGame.on('click', function() {
      self.gol = new GameOfLife();

      self.gol.seed({
        interval: self.getInterval(),
        size: self.elements.canvas[0].width / self.getSize(),
        cellGenerationChance: 50
      });
      self.elements.btnGameState.setToStart();
    });

    // TBC : Pause button should pause or resume game based on state
    self.elements.btnGameState.on('click', function() {
      if (self.gol.gameState === self.gol.GAME_STATES.NEW_GAME || self.gol.gameState === self.gol.GAME_STATES.PAUSED) {
        self.gol.run();
        self.elements.btnGameState.setToPause();
      } else {
        self.gol.pause();
        self.elements.btnGameState.setToResume();
      }
    });

    // TBC : Clicking an option in a button-group should set the appropriate button selected
    $(document).on('click', '.button-group button', function() {
      self.selectGroupButton($(this));
    });

    $(document).on('gol:seed', function() {
      self.clearCanvas();
      self.drawLivingCells();
      self.reportStats();
    });

    $(document).on('gol:tick', function() {
      self.clearCanvas();
      self.drawLivingCells();
      self.reportStats();
    });
  }

  self.drawLivingCells = function() {
    var cellOffset = 0,
        size = self.getSize();

    if (size !== 1) {
      cellOffset = size / 5;
    }

    self.context.fillStyle = self.colors.cell;
    self.context.beginPath();
    self.gol.eachCell(function(cell) {
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

  self.clearCanvas = function() {
    self.context.fillStyle = self.colors.background;
    self.context.clearRect(0, 0, self.elements.canvas[0].width, self.elements.canvas[0].height);
  }

  self.reportStats = function() {
    self.elements.statsTable.empty();
    for(key in self.gol.stats) {
      var statRow = $('<tr>'),
          label = self.gol.stats[key].label,
          value = self.gol.stats[key].value;

      if (typeof value === 'number') {
        value = value.toLocaleString();
      }
      statRow.append($('<td>').html(label + ':').addClass('text-right'));
      statRow.append($('<td>').html(value).addClass('text-left'));

      self.elements.statsTable.append(statRow);
    }
  }

  self.selectGroupButton = function(button) {
    var btnGroup = button.closest('.button-group');
    var selected = btnGroup.find('.selected');

    selected.removeClass('selected');
    button.addClass('selected');
  }

  // TBC : Getters / Setters
  self.getInterval = function() {
    var selected = self.elements.btnGroupInterval.find('.selected');
    return Number.parseInt(selected.data('interval'));
  }

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
  self.livingCells = { };
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

  self.eachCell = function(callback) {
    for (var i = 1; i < self.size - 1; i++) {
      for (var j = 1; j < self.size - 1; j++) {
        var cell = self.rows[i][j];
        callback(cell);
      }
    }
  }

  self.seed = function(options) {
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
        if (i === 0 || j === 0 || i === self.size || j === self.size) {
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

  self.randomizeInitialCellState = function(cell) {
    var random = Math.floor(Math.random() * 100);
    random < self.cellGenerationChance ? cell.live() : cell.die();
  }

  self.run = function() {
    self.gameState = self.GAME_STATES.RUNNING
    self.intervalId = setInterval(self.tick, self.interval);
  }

  self.pause = function() {
    self.gameState = self.GAME_STATES.PAUSED;
    clearInterval(self.intervalId);
  }

  self.tick = function() {
    self.eachCell(function(cell){
      self.updateCellState(cell);
    });

    self.eachCell(function(cell){
      self.determineNextCellState(cell);
    });

    self.stats.generations.value++;
    $(document).trigger('gol:tick');
  }

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

  self.updateCellState = function(cell) {
    self.stats.livingCells.value = 0;
    cell.state = cell.nextState;
    if (cell.isAlive()) self.stats.livingCells.value++;
  }

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
  TBC : The Cell object will be an object that serves as a dependency to the GameOfLife object.

  Cell's have certain properties and behaviors that will be encapsulated in
  this class of objects.
*/
function Cell() {
  var self = { };

  self.STATES = { ALIVE: 1, DEAD: 0 };

  self.position = { row: 0, col: 0 };
  self.age = 0;
  self.state = self.STATES.DEAD;
  self.nextState = self.STATES.DEAD;

  self.isAlive = function() { return (self.state === self.STATES.ALIVE) ? true : false }

  self.live = function() { self.state = self.STATES.ALIVE; }

  self.liveNext = function() { self.nextState = self.STATES.ALIVE; }

  self.age = function() { self.age++; }

  self.dieNext = function() { self.nextState = self.STATES.DEAD; }

  self.survive = function() {
    self.liveNext();
    self.age();
  }

  self.die = function() {
    self.state = self.STATES.DEAD;
    self.age = 0;
  }

  return self;
}
