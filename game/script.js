// TODO add px to rem converter helper method
// TODO var or let - JS validator
// TODO can this section be moved down? dont think so

// ----- OBJECTS -----
class Character {
   constructor(name, type, width, height, speed, W, A, S, D) {
        this.name = name;
        this.type = type; // human, ferret, furniture
        this.width = width; // tiles
        this.height = height; // tiles
        this.speed = speed; // timeout or interval in milliseconds
        this.W = W; // file or URL
        this.A = A; // file or URL
        this.S = S; // file or URL
        this.D = D; // file or URL
        
        this.direction = 'W'; // all characters start pointing north
        this.left = 0; // tiles (x)
        this.right = 0; // tiles
        this.top = 0; // tiles (y)
        this.bottom = 0; // tiles
        this.image = new Image();
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
                    // TODO increase collision box of ball pit
                // TODO remove console messages for ferrets bonking their noses once ferret rotations work
                } else if (this.type == 'ferret') {
                    if (boundary.type == 'furniture') {
                        console.log(this.name + ' bonked his nose on the ' + boundary.name);
                        // TODO - ferrets have different boundaries (e.g. can get in ball pit and litter boxes, can run under table)
                        // TODO - ferrets are transparent when under the table and cage or inside rice box or cat condo to show their location
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

            // TODO move rotation to be done first?
            // absolute value of 1 means it is a normal WASD move and not a large board set-up translation

            // TODO only do this calculation if direction is different

            if (this.direction != lastInput) {
                if (Math.abs(deltaX) == 1) { // A & D
                    console.log('A or D pressed');
                    if (this.type == 'human') {
                        this.height = pWidth;
                        this.width = pHeight;
                    } else if (this.type == 'ferret') {
                        this.height = fHeight;
                        this.width = fWidth;
                    }

                    if (deltaX == -1) { // move left (X axis)
                        console.log('A pressed');
                        this.direction = 'A';
                    } else if (deltaX == 1) { // move right (X axis)
                        this.direction = 'D';
                    }
                } else if (Math.abs(deltaY) == 1) { // W & S
                    console.log('W or S pressed');
                    if (this.type == 'human') {
                        this.height = pHeight;
                        this.width = pWidth;
                    } else if (this.type == 'ferret') {
                        this.height = fWidth;
                        this.width = fHeight;
                    }

                    if (deltaY == -1) { // move up (Y axis)
                        console.log('W pressed');
                        this.direction = 'W';
                    } else if (deltaY == 1) { // move down (Y axis)
                        console.log('S pressed');
                        this.direction = 'S'
                    }
                }
            }

            // update location
            this.left = newLeft;
            this.right = newLeft + this.width;
            this.top = newTop;
            this.bottom = newTop + this.height;
            
            // redraw all objects - TODO move this logic to redraw method?
            for (let i = 0; i < actors.length; i++) {
                redraw(actors[i]);
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

// TODO come up with better name
class Move {
    constructor(axis, delta) {
        this.axis = axis;
        this.delta = delta;
    }
}

// TODO may be able to move this up

// ----- SETUP -----
document.addEventListener('keydown', keyDownHandler, false);

// ----- VARIABLES -----
// Game States
var ghostMovement; // setInterval
var greyWindMovement; // setInterval

// Tile Dimensions
var tSize = 20; // pixels

// Board Dimensions
var can; // canvas
var cxt; // context
var bWidth = 32; // tiles
var bHeight = 26; // tiles

// Player Settings
var pWidth = 3; // tiles
var pHeight = 2; // tiles
var pBaseSlows = 0; // milliseconds
var imgMadison = new Image();
var imgMadisonPath = '/Madison/Madison-';
var spritesMadison = [];

// Ferret Settings
var fWidth = 1; // tiles
var fHeight = 3; // tiles
var fMaxMove = 3; // tiles (inclusive)
var fBaseSpeed = 500; // milliseconds
var imgGhost = new Image();
var imgGhostPath = '/Ghost/Ghost-';
var spritesGhost = [];
var imgGreyWind = new Image();
var imgGreyWindPath = '/Grey-Wind/Grey-Wind-';
var spritesGreyWind = [];

// Image Paths
// imgPrefix + img_Path + direction[i]
// this is dynamic because it will be easier to edit in case the file structure is later changed
var imgPrefix = '../images';
var imgPaths = [imgMadisonPath, imgGhostPath, imgGreyWindPath];
var directions = ['W.png', 'A.png', 'S.png', 'D.png'];
var sprites = [spritesMadison, spritesGhost, spritesGreyWind];
/* I opted to have the sprites rotated in four directions to save myself from the hassle of
   calculating cnavas rotations each time an actor moves in order to make the game more efficient */

// Inputs
var upPressed = false; // W
var leftPressed = false; // A
var downPressed = false; // S
var rightPressed = false; // D
var lastInput = 'W'; // all characters start pointing north

// Objects
var madison, ghost, greyWind, actors, ferrets, boundaries;

// ----- HELPER METHODS -----
function keyDownHandler(e) {
    if (e.key == 'w' || e.key == 'Up' || e.key == 'ArrowUp') {
        lastInput = 'W';
        madison.move(0, -1);
    } else if (e.key == 'a' || e.key == 'Left' || e.key == 'ArrowLeft') {
        lastInput = 'A';
        madison.move(-1, 0);
    } else if (e.key == 's' || e.key == 'Down' || e.key == 'ArrowDown') {
        lastInput = 'S';
        madison.move(0, 1);
    } else if (e.key == 'd' || e.key == 'Right' || e.key == 'ArrowRight') {
         lastInput = 'D';
        madison.move(1, 0);
    }
}

function px(tile) { // convert tiles to pixels
    return tile * tSize;
}

function redraw() {
    // all game objects must redrawn after each move
    for (let i = 0; i < actors.length; i++) {
        actors[i].image.addEventListener('load', function() {
            // image, x, y, width, height
            cxt.drawImage(actors[i].image, px(actors[i].left), px(actors[i].top), px(actors[i].width), px(actors[i].height));
        }, false);
        if (actors[i].direction == 'W') {
            actors[i].image.src = actors[i].W;
        } else if (actors[i].direction == 'A') {
            actors[i].image.src = actors[i].A;
        } else if (actors[i].direction == 'S') {
            actors[i].image.src = actors[i].S;
        } else if (actors[i].direction == 'D') {
            actors[i].image.src = actors[i].D;
        }
    }
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
    gameBoard.load();
} // TODO put in one method

var gameBoard = {
    canvas : document.createElement('canvas'),
    load : function() {
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

        // CREATE GAME OBJECTS
        // create image file paths: imgPrefix + img_Path + direction[i]
        for (let i = 0; i < sprites.length; i++) {
            for (let j = 0; j < directions.length; j++) {
                sprites[i].push(imgPrefix + imgPaths[i] + directions[j]);
            }
        }
        
        // initialize all objects
        madison = new Character('Madison', 'human', pWidth, pHeight, pBaseSlows, spritesMadison[0], spritesMadison[1], spritesMadison[2], spritesMadison[3]);
        ghost = new Character('Ghost', 'ferret', fWidth, fHeight, fBaseSpeed, spritesGhost[0], spritesGhost[1], spritesGhost[2], spritesGhost[3]);
        greyWind = new Character('Grey Wind', 'ferret', fWidth, fHeight, fBaseSpeed, spritesGreyWind[0], spritesGreyWind[1], spritesGreyWind[2], spritesGreyWind[3]);
        actors = [madison, ghost, greyWind];
        ferrets = [ghost, greyWind];
        // many of these boundaries should never be touched, but were created in separate pieces for the sake of debugging
        boundaries = [new Boundary('north border', 0, 32, 0, 1), // 0
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
                      madison, ghost, greyWind] // must check against other actors as well

        // place actors on board
        madison.move(8, 22);
        ghost.move(14, 16);
        greyWind.move(15, 16);
        
        // TODO actors rotating in the direction they move
        // TODO random ferret pauses
        // TODO your speed debuffs
        // TODO score
    }
}

function startGame() {
    console.log('Game started');
    // TODO game timer
    // TODO cannot move actor until start has been pressed

    ghostMovement = setInterval(function() {
        ferretMovement(ghost);
    }, ghost.speed);

    greyWindMovement = setInterval(function() {
        ferretMovement(greyWind);
    }, greyWind.speed);

    // TODO wwhen timer is 0, clearInterval for both ferrets & freeze player
}

function pauseGame() {
    console.log('Game paused');
    clearInterval(ghostMovement);
    clearInterval(greyWindMovement);
}