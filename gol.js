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
  // TBC : Properties
  this.gol;
  this.canvasManager;
  this.elements = { };

  // TBC : Methods
  this.initialize = function() {
    this.elements.btnNewGame        = $('#btn-newGame');
    this.elements.btnGameState      = $('#btn-gameState');
    this.elements.btnGroupInterval  = $('#btnGroup-interval');
    this.elements.btnGroupSize      = $('#btnGroup-size');
    this.elements.canvas            = $('#canvas');
    this.elements.statsTable        = $('#stats-table');

    this.elements.btnGameState.setToStart = function() { $(this).html('start'); };
    this.elements.btnGameState.setToPause = function() { $(this).html('pause'); };
    this.elements.btnGameState.setToResume = function() { $(this).html('resume'); };

    this.bindEventHandlers();
  }

  this.bindEventHandlers = function() {
    var app = this;

    // TBC : New Game loads new game instance and starts it
    this.elements.btnNewGame.on('click', function() {
      app.gol = new GameOfLife({
        interval: app.getInterval(),
        size: app.elements.canvas.width / app.getSize()
      });

      app.canvasManager = new CanvasManager({
        canvas: app.elements.canvas[0], // TBC : [0] removes jQuery wrapper
        size: app.getSize()
      });

      app.gol.newGame();
      app.elements.btnGameState.setToStart();
    });

    // TBC : Pause button should pause or resume game based on state
    this.elements.btnGameState.on('click', function() {
      if (app.gol.gameState === app.gol.GAME_STATES.NEW_GAME || app.gol.gameState === app.gol.GAME_STATES.PAUSED) {
        app.gol.run();
        app.elements.btnGameState.setToPause();
      } else {
        app.gol.pause();
        app.elements.btnGameState.setToResume();
      }
    });

    // TBC : Clicking an option in a button-group should set the appropriate button selected
    $(document).on('click', '.button-group button', function() {
      app.selectGroupButton($(this));
    });

    $(document).on('gol:newGame', function() {
      app.drawCells();
      app.reportStats();
    });

    $(document).on('gol:nextGeneration', function() {
      app.drawCells();
      app.reportStats();
    });
  }

  this.drawCells = function() {
    var app = this;

    app.canvasManager.clearCanvas();
    app.gol.rows.forEach(function(column, rowIdx) {
      column.forEach(function(cell, colIdx) {
        if (cell.isAlive) {
          app.canvasManager.drawCell(rowIdx, colIdx);
        }
      });
    });
  }

  this.reportStats = function() {
    this.elements.statsTable.empty();
    for(key in this.gol.statistics) {
      var statRow = $('<tr>'),
          label = this.gol.statistics[key].label,
          value = this.gol.statistics[key].value;

      statRow.append($('<td>').html(label + ':').addClass('text-right'));
      statRow.append($('<td>').html(value));

      this.elements.statsTable.append(statRow);
    }
  }

  this.selectGroupButton = function(button) {
    var btnGroup = button.closest('.button-group');
    var selected = btnGroup.find('.selected');

    selected.removeClass('selected');
    button.addClass('selected');
  }

  // TBC : Getters / Setters
  this.getInterval = function() {
    var selected = this.elements.btnGroupInterval.find('.selected');
    return Number.parseInt(selected.data('interval'));
  }

  this.getSize = function() {
    var selected = this.elements.btnGroupSize.find('.selected');
    return Number.parseInt(selected.data('size'));
  }
}

/*
  TBC : The CanvasManager will be responsible for all output to the canvas.

  This object will be responsible for handling the actual drawing of the game objects.
  The CanvasManager is the delegated worker for all actual drawing output.
*/

function CanvasManager(options) {
  this.canvas = options.canvas;
  this.context = this.canvas.getContext('2d');

  this.size = options.size;
  this.size === 1 ? this.cellOffset = 0 : this.cellOffset = this.size / 5;
  this.cellColor = options.cellColor || 'yellow';
  this.backgroundColor = options.backgroundColor || 'black';

  this.drawCell = function(row, column) {
    this.context.fillStyle = this.cellColor;
    var position = {
      x: column * this.size + this.cellOffset,
      y: row * this.size + this.cellOffset
    }

    this.context.moveTo(position.x, position.y);
    this.context.fillRect(
      position.x,
      position.y,
      this.size - this.cellOffset,
      this.size - this.cellOffset
    );
  }

  this.clearCanvas = function() {
    this.context.fillStyle = this.backgroundColor;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

/*
  TBC : The GameOfLife object will be responsible for the actual GameOfLife simulation.

  This object will be responsible for handling the actual game rules and serve as the
  underlying data respresentation of the game. Ultimately, the game should be portable
  and not be tied to the canvas or the GUI in any way. It should simply trigger
  events and serve as the game's logical manager.
*/
function GameOfLife(options) {
  this.GAME_STATES = {
    NEW_GAME: 'new-game',
    RUNNING: 'running',
    PAUSED: 'paused'
  }

  this.size = options.size || 600;
  this.interval = options.interval || 1000;
  this.gameState = this.GAME_STATES.NEW_GAME;
  this.rows = [];
  this.intervalId;
  this.statistics = {
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

  this.newGame = function() {
    for (var i = 0; i < this.size; i++) {
      var columns = [];

      for (var j = 0; j < this.size; j++) {
        var cell = new Cell();
        cell.randomizeInitialState();
        columns[j] = cell;
      }

      this.rows.push(columns);
    }

    $(document).trigger('gol:newGame');
  }

  this.run = function() {
    this.gameState = this.GAME_STATES.RUNNING
    this.intervalId = setInterval(this.nextGeneration, this.interval);
  }

  this.pause = function() {
    this.gameState = this.GAME_STATES.PAUSED;
    clearInterval(this.intervalId);
  }

  this.nextGeneration = function() {
    $(document).trigger('gol:nextGeneration');
  }
}

/*
  TBC : The Cell object will be an object that serves as a dependency to the GameOfLife object.

  Cell's have certain properties and behaviors that will be encapsulated in
  this class of objects.
*/
function Cell() {
  this.age = 0;
  this.isAlive = false;

  this.generate = function() {
    this.isAlive = true;
  }

  this.survive = function() {
    this.age++;
  }

  this.die = function() {
    this.age = 0;
    this.isAlive = false;
  }

  this.randomizeInitialState = function() {
    // TBC : percentChance represents what percent chance the cell has to become animated on inital load
    var percentChance = 10;
    var random = Math.floor(Math.random() * 100);
    random < percentChance ? this.generate() : this.die();
  }
}
