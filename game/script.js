// https://developer.mozilla.org/en-US/docs/Games/Tutorials/2D_Breakout_game_pure_JavaScript

// TODO add px to rem converter helper method
// TODO var or let - JS validator

// ----- OBJECTS -----
class Character {
   constructor(name, type, color, width, height, speed) {
        this.name = name;
        this.type = type;
        this.color = color;
        this.width = width; // tiles
        this.height = height; // tiles
        this.speed = speed; // timeout or interval in milliseconds
        this.left = 0; // tiles
        this.right = 0;
        this.top = 0; // tiles
        this.bottom = 0;
        this.colliding = false;
        this.queue = []; // list of queued moves
    }
    // TODO - player does not need list of queued moves, only ferrets (or maybe it will come in handy)

    move(deltaX, deltaY) {
        var newLeft = this.left + deltaX;
        var newRight = newLeft + this.width;
        var newTop = this.top + deltaY;
        var newBottom = newTop + this.height;

        // collision detection
        for (let i = 0; i < boundaries.length; i++) {
            let boundary = boundaries[i];

            if (this.name != boundary.name && ((((newLeft >= boundary.left && newLeft < boundary.right) || (newRight > boundary.left && newRight <= boundary.right)) &&
                ((newTop >= boundary.top && newTop < boundary.bottom) || (newBottom > boundary.top && newBottom <= boundary.bottom))) ||
                (((boundary.left >= newLeft && boundary.left < newRight) || (boundary.right > newLeft && boundary.right <= newRight)) &&
                ((boundary.top >= newTop && boundary.top < newBottom) || (boundary.bottom > newTop && boundary.bottom <= newBottom))))) {
                this.colliding = true;

                if (this.type == 'human') {
                    if (boundary.type == 'furniture') {
                        console.log('You stubbed your toe on the ' + boundary.name);
                    } else if (boundary.type == 'ferret') {
                        console.log('You ran into ' + boundary.name);
                    }
                    // TODO toe stub is based on top only (may want to correct later for accuracy)
                    // TODO lose points & add new dialog for consecutive toe stubs e.g. seriously dude why does this keep happening?! (toe stub counter)
                    // TODO slowed by toe stubs - three stubs within a certain time frame mean you need to sit down/stop for a few seconds
                    // TODO - you stepped in ferret poo (slowed?)
                } else if (this.type == 'ferret') {
                    if (boundary.type == 'furniture') {
                        console.log(this.name + ' bonked his nose on the ' + boundary.name);
                        // TODO - ferrets have different boundaries (e.g. can get in ball pit and litter boxes)

                    } else if (boundary.type == 'ferret') {
                        console.log(this.name + ' ran into ' + boundary.name);
                        // TODO - the ferrets temporarily speed up
                    } else if (boundary.type == 'human') {
                        // TODO - this slows the player
                        console.log(this.name + ' ran into ' + boundary.name + ', slowing you down.');
                    }
                }
                break;
            }
        }

        if (this.colliding == false) {
            // clear previous location - bug with clearing at negative values (should not encounter anyway)
            // (top left x, top left y, bottom right x, bottom right y)
            cxt.clearRect(px(this.left), px(this.top), px(this.left+this.width), px(this.top+this.height));

            // update location
            this.left = newLeft;
            this.right = newLeft + this.width;
            this.top = newTop;
            this.bottom = newTop + this.height;
            
            // redraw all objects
            for (let i = 0; i < characters.length; i++) {
                redraw(characters[i]);
            }
        }

        this.colliding = false;
    }
}

class Boundary {
    constructor(name, left, right, top, bottom) {
        this.name = name;
        this.type = 'furniture';
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
    }
}

class Move {
    constructor(axis, delta) {
        this.axis = axis;
        this.delta = delta;
    }
}

// ----- SETUP -----
document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

// ----- VARIABLES -----
// Game States
var ghostMovement;
var greyWindMovement;

// Tile Dimensions
var tSize = 20; // pixels

// Board Dimensions
var can;
var cxt;
var bWidth = 32; // tiles
var bHeight = 26; // tiles

// Player Dimensions
var pWidth = 3; // tiles
var pHeight = 3; // tiles

// Ferret Dimensions
var fWidth = 1; // tiles
var fHeight = 3; // tiles

// Character Settings
var fMaxMove = 3; // tiles (inclusive)
var fBaseSpeed = 500;
var pBaseSlows = 0;

// Objects
var madison = new Character('Madison', 'human', '#5BFF33', pWidth, pHeight, 0);
//var madison = new Character('tester', 'human', '#FF00FF', 1, 1, 0); // 1x1 test character
var ghost = new Character('Ghost', 'ferret', '#FFFFFF', fWidth, fHeight, fBaseSpeed);
var greyWind = new Character('Grey Wind', 'ferret', '#7A4218', fWidth, fHeight, fBaseSpeed);
var characters = [madison, ghost, greyWind];
var ferrets = [ghost, greyWind];
// many of these boundaries should never be touched, but were created in separate pieces for the sake of debugging
var boundaries = [new Boundary('north border', 0, 32, 0, 1), // 0
                  new Boundary('east border', 31, 32, 1, 25), // 1
                  new Boundary('south border', 0, 32, 25, 26), // 2
                  new Boundary('west border', 0, 1, 1, 25), // 3
                  new Boundary('north wall', 1, 31, 1, 2), // 4
                  new Boundary('northeast wall', 30, 31, 2, 14), // 5
                  new Boundary('front door', 30, 31, 14, 19), // 6
                  new Boundary('southeast wall', 30, 31, 19, 25), // 7
                  new Boundary('laundry closet', 20, 30, 24, 25), // 8
                  new Boundary('south wall', 12, 20, 24, 25), // 9
                  new Boundary('bedroom pet gate', 7, 12, 24, 25), // 10
                  new Boundary('southwest wall', 1, 7, 24, 25), // 11
                  new Boundary('Smoke\'s hamster cage shelf', 1, 4, 17, 24), // 12
                  new Boundary('living room pet gate', 3, 4, 11, 17), // 13
                  new Boundary('Kilobyte\'s hamster cage shelf', 1, 4, 2, 11), // 14
                  new Boundary('northwest kitchen cabinets', 4, 13, 2, 6), // 15
                  new Boundary('oven', 13, 17, 2, 6), // 16
                  new Boundary('north kitchen cabinet', 17, 20, 2, 6), // 17
                  new Boundary('refrigerator', 21, 25, 2, 6), // 18
                  new Boundary('utility closet', 25, 30, 2, 11), // 19
                  new Boundary('blue litter box', 28, 30, 11, 13), // 20
                  new Boundary('rice dig box', 27, 30, 19, 24), // 21
                  new Boundary('cat condo', 20, 22, 22, 24), // 22
                  new Boundary('pellet litter bin', 18, 20, 21, 24), // 23
                  new Boundary('ferret cage', 12, 18, 20, 24), // 24
                  new Boundary('cat post', 14, 16, 19, 20), // 25
                  new Boundary('grey litter box', 4, 6, 21, 24), // 26
                  new Boundary('trash cans', 4, 6, 16, 21), // 27
                  new Boundary('ping pong ball pit', 4, 6, 9, 12), // 28
                  new Boundary('kitchen table', 12, 18, 10, 16), // 29
                  new Boundary('plastic ball pit', 22, 24, 15, 17), // 30
                  madison, ghost, greyWind] // must check against other characters as well

// Inputs
var upPressed = false; // W
var leftPressed = false; // A
var downPressed = false; // S
var rightPressed = false; // D

// ----- HELPER METHODS -----
function keyDownHandler(e) {
    if (e.key == 'w' || e.key == 'Up' || e.key == 'ArrowUp') {
        madison.move(0, -1);
    } else if (e.key == 'a' || e.key == 'Left' || e.key == 'ArrowLeft') {
        madison.move(-1, 0);
    } else if (e.key == 's' || e.key == 'Down' || e.key == 'ArrowDown') {
        madison.move(0, 1);
    } else if (e.key == 'd' || e.key == 'Right' || e.key == 'ArrowRight') {
        madison.move(1, 0);
    }
}

function keyUpHandler(e) {
    if (e.key == 'w' || e.key == 'Up' || e.key == 'ArrowUp') {
        upPressed = false;
    } else if (e.key == 'a' || e.key == 'Left' || e.key == 'ArrowLeft') {
        leftPressed = false;
    } else if (e.key == 's' || e.key == 'Down' || e.key == 'ArrowDown') {
        downPressed = false;
    } else if (e.key == 'd' || e.key == 'Right' || e.key == 'ArrowRight') {
        rightPressed = false;
    }
}

function px(tile) { // convert tiles to pixels
    return tile * tSize;
}

function redraw(character) {
    // all game objects must redrawn after each move
    cxt.beginPath();
    cxt.rect(px(character.left), px(character.top), px(character.width), px(character.height)); // rect(x, y, width, height)
    cxt.fillStyle = character.color;
    cxt.fill();
    cxt.closePath();
}

function getRandomInt(max) {
    // returns a random number between 1 and max (inclusive)
    return Math.floor(Math.random() * max) + 1;
}

function getRandomDirection() {
    // TODO more efficient code for this?
    var direction = Math.floor(Math.random() * Math.floor(2));

    if (direction == 0) { // negative
        direction = -1;
    }

    return direction;
}

function ferretMovement(ferret) {
    // TODO find more efficient way to do this
    if (ferret.queue.length == 0) {
        var axis = getRandomInt(2); // 1 = X, 2 = Y
        var absValue = getRandomInt(fMaxMove);
        var delta = 1 * getRandomDirection();

        if (axis == 1) { // move along the X axis
            for (let x = 0; x < absValue; x++) {
                ferret.queue.push(new Move('X', delta));
            }
        } else if (axis == 2) { // move along the Y axis
            for (let y = 0; y < absValue; y++) {
                ferret.queue.push(new Move('Y', delta));
            }
        }
    }

    var move = ferret.queue.pop();

    if (move.axis == 'X') {
        ferret.move(move.delta, 0);
    } else if (move.axis == 'Y') {
        ferret.move(0, move.delta);
    }
}

// ----- GAME LOGIC -----
function loadBoard() {
    gameBoard.start();
}

var gameBoard = {
    canvas : document.createElement('canvas'),
    start : function() {
        can = this.canvas;
        cxt = this.context;

        // TODO - include pics of Grey after tearing up the dishwasher insulation and Ghost ripping up a piddle pad
        // 'this game is dedicated to my well-behaved ferrets Ghost & Grey Wind'

        // CANVAS DIMENSIONS
        can.width = tSize * bWidth;
        can.height = tSize * bHeight;

        // LOAD BOARD
        cxt = can.getContext('2d');
        document.body.insertBefore(can, document.body.childNodes[0]);

        // place characters on board
        madison.move(8, 21);
        ghost.move(14, 16);
        greyWind.move(15, 16);

        // TODO character collision detection
        // TODO characters rotating in the direction they move
        // TODO random ferret pauses
        // TODO your speed debuffs
        // TODO score
    }
}

function startGame() {
    //console.log('Game started');
    // TODO game timer
    // TODO cannot move character until start has been pressed

    ghostMovement = setInterval(function() {
        ferretMovement(ghost);
    }, ghost.speed);

    greyWindMovement = setInterval(function() {
        ferretMovement(greyWind);
    }, greyWind.speed);

    // TODO wwhen timer is 0, clearInterval for both ferrets & freeze player
}

function pauseGame() {
    clearInterval(ghostMovement);
    clearInterval(greyWindMovement);
}