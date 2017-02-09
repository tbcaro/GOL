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
    this.elements.btnTogglePaused   = $('#btn-togglePaused');
    this.elements.btnGroupInterval  = $('#btnGroup-interval');
    this.elements.btnGroupSize      = $('#btnGroup-size');
    this.elements.canvas            = $('#canvas');
    this.elements.generations       = $('#stat-generations');
    this.elements.totalCells        = $('#stat-totalCells');
    this.elements.livingCells       = $('#stat-livingCells');

    this.elements.btnTogglePaused.setToPause = function() {
      $(this).html('pause');
    };

    this.elements.btnTogglePaused.setToResume = function() {
      $(this).html('resume');
    };


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
      app.elements.btnTogglePaused.setToPause();
    });

    // TBC : Pause button should pause or resume game based on state
    this.elements.btnTogglePaused.on('click', function() {
      if (app.gol.isPaused) {
        app.gol.resume();
        app.elements.btnTogglePaused.setToPause();
      } else {
        app.gol.pause();
        app.elements.btnTogglePaused.setToResume();
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
  this.isPaused = false;

  this.initialize = function() {

  }

  this.run = function() {

  }

  this.pause = function() { this.isPaused = true; }

  this.resume = function() { this.isPaused = false; }

  // TBC : Auto-execute on instantiation
  this.initialize();
  this.run();
}

/*
  TBC : The Cell object will be an object that serves as a dependency to the GameOfLife object.

  Cell's have certain properties and behaviors that will be encapsulated in
  this class of objects.
*/
function Cell() {

}
