// https://developer.mozilla.org/en-US/docs/Games/Tutorials/2D_Breakout_game_pure_JavaScript

// ----- SETUP -----
document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

// ----- VARIABLES -----
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

// Objects
var madison;
var ghost;
var greyWind;
var boundaries = [];

// States
var colliding = false;

// Inputs
var upPressed = false; // W
var leftPressed = false; // A
var downPressed = false; // S
var rightPressed = false; // D

// ----- OBJECTS -----
class Character {
   constructor(name, color, x, y, width, height) {
        this.name = name;
        this.color = color;
        this.x = x; // tiles
        this.y = y; // tiles
        this.width = width; // tiles
        this.height = height; // tiles
    }

    move(deltaX, deltaY) {
        var newLeftX = this.x + deltaX;
        var newRightX = newLeftX + this.width;
        var newTopY = this.y + deltaY;
        var newBottomY = newTopY + this.height;

        // collision detection
        for (let i = 0; i < boundaries.length; i++) {
            let boundary = boundaries[i];

            // change the logic to: if the boundary is between any of the box points? - account for 1x1 blocks
            if (((newLeftX >= boundary.left && newLeftX < boundary.right) || (newRightX > boundary.left && newRightX <= boundary.right)) &&
                ((newTopY >= boundary.top && newTopY < boundary.bottom) || (newBottomY > boundary.top && newBottomY <= boundary.bottom))) {
                colliding = true;
                console.log('You stubbed your toe.'); // TODO - only show this when character is human ("X bonked his nose! for ferrets") & lose points & add new dialog for consecutive toe stubs e.g. seriously dude why does this keep happening?! (toe stub counter)
                // TODO - you stepped in ferret poo (slowed?)
                break;
            }
        }

        if (colliding == false) {
            // clear previous location - bug with clearing at negative values (should not encounter anyway)
            // (top left x, top left y, bottom right x, bottom right y)
            cxt.clearRect(px(this.x), px(this.y), px(this.x+this.width), px(this.y+this.height));

            // update location
            this.x = newLeftX;
            this.y = newTopY;
            
            // draw new location
            cxt.beginPath();
            cxt.rect(px(this.x), px(this.y), px(this.width), px(this.height)); // rect(x, y, width, height)
            cxt.fillStyle = this.color;
            cxt.fill();
            cxt.closePath();
        }

        colliding = false;
    }
}

class Boundary {
    constructor(left, right, top, bottom) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
    }
}

// ----- HELPER FUNCTIONS -----
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

// ----- GAME LOGIC -----
function startGame() {
    gameBoard.start();
}

var gameBoard = {
    canvas : document.createElement('canvas'),
    start : function() {
        can = this.canvas;
        cxt = this.context;

    // TODO - include pics of Grey destroying the dishwasher

    // CANVAS DIMENSIONS
    can.width = tSize * bWidth;
    can.height = tSize * bHeight;
    
    // LOAD BOARD
    cxt = can.getContext('2d');
    document.body.insertBefore(can, document.body.childNodes[0]);

    // create characters
    madison = new Character('Madison', '#5BFF33', 0, 0, pWidth, pHeight);
    ghost = new Character('Ghost', '#FFFFFF', 3, 0, fWidth, fHeight);
    greyWind = new Character('GreyWind', '#7A4218', 4, 0, fWidth, fHeight);

    // create boundaries
    boundaries.push(new Boundary(0, 20, 0, 6)); // 0 - kitchen counter
    boundaries.push(new Boundary(20, 32, 0, 2)); // 1 - top right wall
    boundaries.push(new Boundary(21, 25, 2, 6)); // 2 - refrigerator
    boundaries.push(new Boundary(25, 30, 2, 11)); // 3 - utility closet
    boundaries.push(new Boundary(28, 30, 11, 13)); // 4 - blue litterbox
    boundaries.push(new Boundary(30, 32, 2, 26)); // 5 - right wall
    boundaries.push(new Boundary(27, 30, 19, 26)); // 6 - rice box
    boundaries.push(new Boundary(0, 27, 24, 26)); // 7 - bottom wall
    boundaries.push(new Boundary(18, 20, 21, 23)); // 8 - pellet litter bin
    boundaries.push(new Boundary(12, 18, 20, 24)); // 9 - cage
    boundaries.push(new Boundary(14, 16, 19, 20)); // 10 - cat scratcher post
    boundaries.push(new Boundary(0, 4, 6, 24)); // 11 - hamsters
    boundaries.push(new Boundary(4, 6, 16, 23)); // 12 - trash cans
    boundaries.push(new Boundary(4, 6, 9, 12)); // 13 - ping pong ball pit
    boundaries.push(new Boundary(12, 18, 10, 16)); // 14 - table
    boundaries.push(new Boundary(22, 24, 15, 17)); // 15 - ball pit

    madison.move(8, 21); // place player on board

    // TODO ferretMovement(); - while loop until timer is 0 (or something like that)
}
}

// function ferretMovement() {
// } setInterval(ferretMovement, 1000);