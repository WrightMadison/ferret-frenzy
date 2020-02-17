// https://developer.mozilla.org/en-US/docs/Games/Tutorials/2D_Breakout_game_pure_JavaScript

// TODO add px to rem converter helper method

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
var madison = new Character('tester', true, '#FF00FF', 0, 0, 1, 1); // 1x1 test character
// var madison = new Character('Madison', true, '#5BFF33', 0, 0, pWidth, pHeight);
var ghost = new Character('Ghost', false, '#FFFFFF', 3, 0, fWidth, fHeight);
var greyWind = new Character('GreyWind', false, '#7A4218', 4, 0, fWidth, fHeight);
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
                  new Boundary('plastic ball pit', 22, 24, 15, 17)] // 30;

// States
var colliding = false;

// Inputs
var upPressed = false; // W
var leftPressed = false; // A
var downPressed = false; // S
var rightPressed = false; // D

// ----- OBJECTS -----
class Character {
   constructor(name, human, color, x, y, width, height) {
        this.name = name;
        this.human = human;
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

            if ((((newLeftX >= boundary.left && newLeftX < boundary.right) || (newRightX > boundary.left && newRightX <= boundary.right)) &&
                ((newTopY >= boundary.top && newTopY < boundary.bottom) || (newBottomY > boundary.top && newBottomY <= boundary.bottom))) ||
                (((boundary.left >= newLeftX && boundary.left < newRightX) || (boundary.right > newLeftX && boundary.right <= newRightX)) &&
                ((boundary.top >= newTopY && boundary.top < newBottomY) || (boundary.bottom > newTopY && boundary.bottom <= newBottomY)))) {
                colliding = true;

                if (this.human == true) {
                    console.log('You stubbed your toe on the ' + boundary.name);
                    // TODO toe stub is based on top only (may want to correct later for accuracy)
                    // TODO lose points & add new dialog for consecutive toe stubs e.g. seriously dude why does this keep happening?! (toe stub counter)
                    // TODO slowed by toe stubs - three stubs within a certain time frame mean you need to sit down/stop for a few seconds
                    // TODO - you stepped in ferret poo (slowed?)
                } else if (this.human == false) {
                    console.log(this.name + ' bonked his nose on the ' + boundary.name);
                }
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
    constructor(name, left, right, top, bottom) {
        this.name = name;
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

        // TODO - include pics of Grey after tearing up the dishwasher insulation and Ghost ripping up a piddle pad
        // "this game is dedicated to my well-behaved ferrets Ghost & Grey Wind"

        // CANVAS DIMENSIONS
        can.width = tSize * bWidth;
        can.height = tSize * bHeight;

        // LOAD BOARD
        cxt = can.getContext('2d');
        document.body.insertBefore(can, document.body.childNodes[0]);

        madison.move(8, 21); // place player on board

        // TODO ferretMovement(); - while loop until timer is 0 (or something like that)
        // TODO game timer
    }
}

// function ferretMovement() {
// } setInterval(ferretMovement, 1000);