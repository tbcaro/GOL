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
    this.elements.generations       = $('#stat-generations');
    this.elements.totalCells        = $('#stat-totalCells');
    this.elements.livingCells       = $('#stat-livingCells');

    this.elements.btnGameState.setToStart = function() { $(this).html('start'); };
    this.elements.btnGameState.setToPause = function() { $(this).html('pause'); };
    this.elements.btnGameState.setToResume = function() { $(this).html('resume'); };


    this.canvasManager = new CanvasManager({
      canvas: this.elements.canvas[0] // TBC : [0] removes jQuery wrapper
    });

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
  this.context.fillStyle = options.color || 'yellow';

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

  this.size = options.size || 300;
  this.interval = options.interval || 1000;
  this.gameState = this.GAME_STATES.NEW_GAME;
  this.grid = [];
  this.intervalId;

  this.newGame = function() {
    for (var i = 0; i < this.size; i++) {
      var columns = [];

      for (var j = 0; j < this.size; j++) {
        var cell = columns[j];
        cell = new Cell();
        cell = randomizeInitialState();
      }

      this.grid.push(columns);
    }
  }

  this.run = function() {
    this.gameState = this.GAME_STATES.RUNNING
    this.intervalId = setInterval(this.simulate, this.interval);
  }

  this.pause = function() {
    this.gameState = this.GAME_STATES.PAUSED;
    clearInterval(this.intervalId);
  }

  this.simulate = function() {
    console.log('simulate occurred...');
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
    Math.random() % 2 == 0 ? this.generate() : this.die();
  }
}
