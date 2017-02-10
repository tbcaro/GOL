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
  self.canvasManager;
  self.elements = { };

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

    self.bindEventHandlers();
  }

  self.bindEventHandlers = function() {
    // TBC : New Game loads new game instance and starts it
    self.elements.btnNewGame.on('click', function() {
      self.gol = new GameOfLife({
        interval: self.getInterval(),
        size: self.elements.canvas[0].width / self.getSize()
      });

      self.canvasManager = new CanvasManager({
        canvas: self.elements.canvas[0], // TBC : [0] removes jQuery wrselfer
        size: self.getSize()
      });

      self.gol.seed();
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
      self.drawCells();
      self.reportStats();
    });

    $(document).on('gol:tick', function() {
      self.drawCells();
      self.reportStats();
    });
  }

  self.drawCells = function() {
    self.canvasManager.clearCanvas();
    self.gol.rows.forEach(function(column, rowIdx) {
      column.forEach(function(cell, colIdx) {
        if (cell.isAlive) {
          self.canvasManager.drawCell(rowIdx, colIdx);
        }
      });
    });
  }

  self.reportStats = function() {
    self.elements.statsTable.empty();
    for(key in self.gol.statistics) {
      var statRow = $('<tr>'),
          label = self.gol.statistics[key].label,
          value = self.gol.statistics[key].value;

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
  TBC : The CanvasManager will be responsible for all output to the canvas.

  This object will be responsible for handling the actual drawing of the game objects.
  The CanvasManager is the delegated worker for all actual drawing output.
*/

function CanvasManager(options) {
  var self = { };

  self.canvas = options.canvas;
  self.context = self.canvas.getContext('2d');

  self.size = options.size;
  self.size === 1 ? self.cellOffset = 0 : self.cellOffset = self.size / 5;
  self.cellColor = options.cellColor || 'yellow';
  self.backgroundColor = options.backgroundColor || 'black';

  self.drawCell = function(row, column) {
    self.context.fillStyle = self.cellColor;
    var position = {
      x: column * self.size + self.cellOffset,
      y: row * self.size + self.cellOffset
    }

    self.context.moveTo(position.x, position.y);
    self.context.fillRect(
      position.x,
      position.y,
      self.size - self.cellOffset,
      self.size - self.cellOffset
    );
  }

  self.clearCanvas = function() {
    self.context.fillStyle = self.backgroundColor;
    self.context.fillRect(0, 0, self.canvas.width, self.canvas.height);
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
function GameOfLife(options) {
  var self = { };

  self.GAME_STATES = {
    NEW_GAME: 'new-game',
    RUNNING: 'running',
    PAUSED: 'paused'
  }

  self.size = options.size || 600;
  self.interval = options.interval || 1000;
  self.gameState = self.GAME_STATES.NEW_GAME;
  self.rows = [];
  self.intervalId;
  self.statistics = {
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

  self.seed = function() {
    for (var i = 0; i < self.size; i++) {
      var columns = [];

      for (var j = 0; j < self.size; j++) {
        var cell = new Cell();
        cell.randomizeInitialState();

        if (cell.isAlive) {
          self.statistics.livingCells.value++;
        }

        columns[j] = cell;
      }

      self.rows.push(columns);
    }

    self.statistics.totalCells.value = self.size * self.size;
    $(document).trigger('gol:seed');
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
    self.statistics.livingCells.value = 0;

    self.rows.forEach(function(columns, rowIdx) {
      columns.forEach(function(cell, colIdx) {
        var livingNeighbors = self.countLivingNeighbors(rowIdx, colIdx);

        if (cell.isAlive) {
          if (livingNeighbors < 2 || livingNeighbors > 3) {
            cell.die();
          } else {
            cell.survive();
          }
        } else if (livingNeighbors === 3) {
          cell.generate();
        }

        if (cell.isAlive) {
          self.statistics.livingCells.value++;
        }
      });
    });

    self.statistics.generations.value++;
    $(document).trigger('gol:tick');
  }

  self.countLivingNeighbors = function(rowIdx, colIdx) {
    var offsets = {
          NW: { rowOffset: -1, colOffset: -1 },
          N: { rowOffset: -1, colOffset: 0 },
          NE: { rowOffset: -1, colOffset: 1 },
          E: { rowOffset: 0, colOffset: 1 },
          SE: { rowOffset: 1, colOffset: 1 },
          S: { rowOffset: 1, colOffset: 0 },
          SW: { rowOffset: 1, colOffset: -1 },
          W: { rowOffset: 0, colOffset: -1 }
        },
        count = 0;

    for (direction in offsets) {
      var rowOffset = offsets[direction].rowOffset,
          colOffset = offsets[direction].colOffset;

      if (
        rowIdx + rowOffset >= 0 &&
        colIdx + colOffset >= 0 &&
        rowIdx + rowOffset < self.size &&
        colIdx + colOffset < self.size
      ) {
          var neighbor = self.rows[rowIdx + rowOffset][colIdx + colOffset];

          if (neighbor.isAlive) {
            count++;
          }
      }
    }

    return count;
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

  self.age = 0;
  self.isAlive = false;

  self.generate = function() {
    self.isAlive = true;
  }

  self.survive = function() {
    self.age++;
  }

  self.die = function() {
    self.age = 0;
    self.isAlive = false;
  }

  self.randomizeInitialState = function() {
    // TBC : percentChance represents what percent chance the cell has to become animated on inital load
    var percentChance = 10;
    var random = Math.floor(Math.random() * 100);
    random < percentChance ? self.generate() : self.die();
  }

  return self;
}
