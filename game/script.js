// TODO add px to rem converter helper method
// TODO var or let - JS validator

// ----- VARIABLES -----
// Game States
var ghostMovement; // TODO setInterval
var greyWindMovement; // TODO setInterval
var gameTimer; // setInterval

// Timer
var totalTime = 60000; // milliseconds
var gameTime = totalTime; // milliseconds
var timeElapsed = 0; // milliseconds
var timeRemaining = totalTime; // milliseconds
var timeInterval = 100; // milliseconds
var timerStarted; // Date.now()

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

// Objects
var madison, ghost, greyWind, actors, ferrets, boundaries;

// ----- OBJECT CLASSES -----
class Character {
   constructor(name, type, width, height, speed, xStart, yStart, W, A, S, D) {
        this.name = name;
        this.type = type; // human, ferret, furniture
        this.width = width; // tiles
        this.height = height; // tiles
        this.speed = speed; // timeout or interval in milliseconds
        this.xStart = xStart;
        this.yStart = yStart;
        this.W = W; // file or URL
        this.A = A; // file or URL
        this.S = S; // file or URL
        this.D = D; // file or URL
        
        this.lastInput = 'W'; // all characters start pointing north
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
        // temporary test rotation
        // save current state
        var originalState = [this.height, this.width, this.lastInput, this.direction];

        // undergo rotation
        this.rotate();

        // TODO test this rotation logic
        // new location
        var newLeft = this.left + deltaX;
        var newRight = newLeft + this.width;
        var newTop = this.top + deltaY;
        var newBottom = newTop + this.height;

        // collision detection
        for (let i = 0; i < boundaries.length; i++) {
            let boundary = boundaries[i];

            if (this.name != boundary.name &&
                ((((newLeft >= boundary.left && newLeft < boundary.right) || (newRight > boundary.left && newRight <= boundary.right)) &&
                 ((newTop >= boundary.top && newTop < boundary.bottom) || (newBottom > boundary.top && newBottom <= boundary.bottom))) ||
                (((boundary.left >= newLeft && boundary.left < newRight) || (boundary.right > newLeft && boundary.right <= newRight)) &&
                ((boundary.top >= newTop && boundary.top < newBottom) || (boundary.bottom > newTop && boundary.bottom <= newBottom))))) {
                this.colliding = true;


                if (this.type == 'human') {
                    if (boundary.type == 'furniture') {
                        console.log('You stubbed your toe on the ' + boundary.name);
                    } else if (boundary.type == 'ferret') {
                        console.log('You tripped over ' + boundary.name + ', slowing you down.');
                    }
                    // TODO lose points & add new dialog for consecutive toe stubs e.g. seriously dude why does this keep happening?! (toe stub counter)
                    // TODO slowed by toe stubs - three stubs within a certain time frame mean you need to sit down/stop for a few seconds
                    // TODO - you stepped in ferret poo (slowed?)
                    // TODO increase collision box of ball pit
                // TODO remove console messages for ferrets bonking their noses once ferret rotations work
                } else if (this.type == 'ferret') {
                    if (boundary.type == 'furniture') {
                        // TODO - ferrets have different boundaries (e.g. can get in ball pit and litter boxes, can run under table)
                        // TODO - ferrets are transparent when under the table and cage or inside rice box or cat condo to show their location
                    } else if (boundary.type == 'ferret') {
                        console.log(this.name + ' ran into ' + boundary.name);
                        // TODO - the ferrets temporarily speed up
                    } else if (boundary.type == 'human') {
                        // TODO - this slows the player
                        console.log(this.name + ' attacked your shoes and slowed you down.');
                    }
                }
                // TODO ghost and grey wind ran into each other

                // rotate back
                this.height = originalState[0];
                this.width = originalState[1];
                this.lastInput = originalState[2];
                this.direction = originalState[3];
                break;
            }
        }

        if (this.colliding == false) {
            // clear previous location - bug with clearing at negative values (should not encounter anyway)
            // (top left x, top left y, bottom right x, bottom right y)
            cxt.clearRect(px(this.left), px(this.top), px(this.left+this.width), px(this.top+this.height));

            // permanent rotation
            this.rotate();

            // update location
            this.left = newLeft;
            this.right = newLeft + this.width;
            this.top = newTop;
            this.bottom = newTop + this.height;
            
            // redraw all actors
            redrawActors();
        }

        this.colliding = false;
    }

    rotate() {
        // only rotate if last direction is different from new one
        if (this.direction != this.lastInput) {
            if (this.lastInput == 'W' || this.lastInput == 'S') {
                if (this.type == 'human') {
                    this.height = pHeight;
                    this.width = pWidth;
                } else if (this.type == 'ferret') {
                    this.height = fHeight;
                    this.width = fWidth;
                }

                if (this.lastInput == 'W') { // move up (Y axis)
                    this.direction = 'W';
                } else if (this.lastInput == 'S') { // move down (Y axis)
                    this.direction = 'S'
                }
            } else if (this.lastInput == 'A' || this.lastInput == 'D') {
                if (this.type == 'human') {
                    this.height = pWidth;
                    this.width = pHeight;
                } else if (this.type == 'ferret') {
                    this.height = fWidth;
                    this.width = fHeight;
                }

                if (this.lastInput == 'A') { // move left (X axis)
                    this.direction = 'A';
                } else if (this.lastInput == 'D') { // move right (X axis)
                    this.direction = 'D';
                }
            }
        }
    }

    reset() {
        this.lastInput = 'W';
        this.rotate();
        var deltaX = this.xStart - this.left;
        var deltaY = this.yStart - this.top;
        this.move(deltaX, deltaY);
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

// ----- HELPER METHODS -----
function px(tile) { // convert tiles to pixels
    return tile * tSize;
}

function getRandomInt(max) {
    // returns a random number between 1 and max (inclusive)
    return Math.floor(Math.random() * max) + 1;
}

// // the custom movements account for the player not being a perfect square
function keyDownHandler(e) {
    if (e.key == 'w' || e.key == 'W' || e.key == 'Up' || e.key == 'ArrowUp') {
        if (madison.lastInput == 'A') {
            madison.lastInput = 'W';
            madison.move(0, 0);
        } else if (madison.lastInput == 'D') {
            madison.lastInput = 'W';
            madison.move(-1, 0);
        } else {
            madison.lastInput = 'W';
            madison.move(0, -1);
        }
    } else if (e.key == 'a' || e.key == 'A' || e.key == 'Left' || e.key == 'ArrowLeft') {
        if (madison.lastInput == 'W') {
            madison.lastInput = 'A';
            madison.move(0, 0);
        } else if (madison.lastInput == 'S') {
            madison.lastInput = 'A';
            madison.move(0, -1);
        } else {
            madison.lastInput = 'A';
            madison.move(-1, 0);
        }
    } else if (e.key == 's' || e.key == 'S' || e.key == 'Down' || e.key == 'ArrowDown') {
        if (madison.lastInput == 'D') {
            madison.lastInput = 'S';
            madison.move(-1, 1);
        } else {
            madison.lastInput = 'S';
            madison.move(0, 1);
        }
    } else if (e.key == 'd' || e.key == 'D' || e.key == 'Right' || e.key == 'ArrowRight') {
        if (madison.lastInput == 'S') {
            madison.lastInput = 'D';
            madison.move(1, -1);
        } else {
            madison.lastInput = 'D';
            madison.move(1, 0);
        }
    }
}

function ferretMovement(ferret) {
    if (ferret.queue.length == 0) {
        var randDirection = getRandomInt(4); // 1 = W, 2 = A, 3 = S, 4 = D
        var direction;
        var distance = getRandomInt(3);

        if (randDirection == 1) {
            direction = 'W';
        } else if (randDirection == 2) {
            direction = 'A';
        } else if (randDirection == 3) {
            direction = 'S';
        } else if (randDirection == 4) {
            direction = 'D';
        }

        for (let i = 0; i < distance; i++) {
            ferret.queue.push(direction);
        }
    }

    var nextMove = ferret.queue.pop();

    // the custom movements account for the ferrets not being perfect squares
    if (nextMove == 'W') {
        if (ferret.lastInput == 'W') {
            ferret.lastInput = 'W';
            ferret.move(0, -1);
        } else if (ferret.lastInput == 'A' || ferret.lastInput == 'D') {
            ferret.lastInput = 'W';
            ferret.move(1, -1);
        } else if (ferret.lastInput == 'S') {
            ferret.lastInput = 'W';
            ferret.move(0, 0);
        }
    } else if (nextMove == 'A') {
        if (ferret.lastInput == 'W' || ferret.lastInput == 'S') {
            ferret.lastInput = 'A';
            ferret.move(-1, 1);
        } else if (ferret.lastInput == 'A') {
            ferret.lastInput = 'A';
            ferret.move(-1, 0);
        } else if (ferret.lastInput == 'D') {
            ferret.lastInput = 'A';
            ferret.move(0, 0);
        }
    } else if (nextMove == 'S') {
        if (ferret.lastInput == 'W') {
            ferret.lastInput = 'S';
            ferret.move(0, 0);
        } else if (ferret.lastInput == 'A' || ferret.lastInput == 'D') {
            ferret.lastInput = 'S';
            ferret.move(1, -1);
        } else if (ferret.lastInput == 'S') {
            ferret.lastInput = 'S';
            ferret.move(0, 1);
        }
    } else if (nextMove == 'D') {
        if (ferret.lastInput == 'W' || ferret.lastInput == 'S') {
            ferret.lastInput = 'D';
            ferret.move(-1, 1);
        } else if (ferret.lastInput == 'A') {
            ferret.lastInput = 'D';
            ferret.move(0, 0);
        } else if (ferret.lastInput == 'D') {
            ferret.lastInput = 'D';
            ferret.move(1, 0);
        }
    }
}

function redrawActors() {
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

function timePrecision(timestamp) {
  return (timestamp/1000).toFixed(2);
}

// ----- GAME LOGIC -----
function loadBoard() {
    can = document.createElement('canvas');
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
    madison = new Character('Madison', 'human', pWidth, pHeight, pBaseSlows, 8, 22, spritesMadison[0], spritesMadison[1], spritesMadison[2], spritesMadison[3]);
    ghost = new Character('Ghost', 'ferret', fWidth, fHeight, fBaseSpeed, 7, 9, spritesGhost[0], spritesGhost[1], spritesGhost[2], spritesGhost[3]);
    greyWind = new Character('Grey Wind', 'ferret', fWidth, fHeight, fBaseSpeed, 24, 20, spritesGreyWind[0], spritesGreyWind[1], spritesGreyWind[2], spritesGreyWind[3]);
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
                  new Boundary('cat post', 14, 16, 18, 20), // 25
                  new Boundary('grey litter box', 4, 6, 21, 24), // 26
                  new Boundary('trash cans', 4, 6, 16, 21), // 27
                  new Boundary('ping pong ball pit', 4, 6, 9, 12), // 28
                  new Boundary('kitchen table', 12, 17, 10, 15), // 29
                  new Boundary('plastic ball pit', 20, 21, 15, 17), // 30
                  new Boundary('plastic ball pit', 21, 23, 14, 18), // 31
                  new Boundary('plastic ball pit', 23, 24, 15, 17), // 32
                  madison, ghost, greyWind] // must check against other actors as well

    resetGame();
    
    // TODO fix image flickering
    // TODO ferrets rotate on top of each other sometimes
    // TODO player speed debuffs
    // TODO score
    // TODO make a faint outline around final grid so boundaries are easy to identify
}

function startGame() {
    // enable player movement
    document.addEventListener('keydown', keyDownHandler, false);

    // disable this button and enable its opposite
    document.getElementById('start').disabled = true;
    document.getElementById('pause').disabled = false;
    document.getElementById('reset').disabled = true;

    // begin timer
    timerStarted = Date.now();
    updateTimer();
    
    // begin ferret movement
    ghostMovement = setInterval(function() {
        ferretMovement(ghost);
    }, ghost.speed);

    greyWindMovement = setInterval(function() {
        ferretMovement(greyWind);
    }, greyWind.speed);

    // TODO user can click on items to display what they are
}

function pauseGame() {
    // disable player movement
    document.removeEventListener('keydown', keyDownHandler, false);

    // disable this button and enable its opposite
    document.getElementById('start').disabled = false;
    document.getElementById('pause').disabled = true;
    document.getElementById('reset').disabled = false;

    // stop the timer and record remaining time
    clearInterval(gameTimer);
    gameTime = gameTime - timeElapsed;

    // stop ferret movement
    clearInterval(ghostMovement);
    clearInterval(greyWindMovement);
}

function resetGame() {
    // reset buttons
    document.getElementById('start').disabled = false;
    document.getElementById('pause').disabled = true;
    document.getElementById('reset').disabled = true;

    // reset the timer
    clearInterval(gameTimer);
    gameTime = totalTime;
    document.getElementById('timer').innerHTML = timePrecision(gameTime);

    // stop ferret movement
    clearInterval(ghostMovement);
    clearInterval(greyWindMovement);

    // put actors in their starting positions
    for (let i = 0; i < actors.length; i++) {
        actors[i].reset();
    }
}

function updateTimer() {
    gameTimer = setInterval(function() {
        timeElapsed = Math.floor((Date.now() - timerStarted));
        timeRemaining = timePrecision(gameTime - timeElapsed);
        document.getElementById('timer').innerHTML = timeRemaining;

        // TODO this sneaks into negative values, try to fix
        if (timeRemaining <= 0) {
            pauseGame();
            document.getElementById('timer').innerHTML = timePrecision(0);
            document.getElementById('start').disabled = true;
        }
    }, timeInterval);

    /* 1. when the game starts, the time it was started is logged in timerStarted (see startGame)
       2. the current time minus time the game started is continuously updated in timeElapsed
       3. gameTime minus timeElapsed is displayed
       4. when the game is paused, gameTime minus timeElapsed is saved for when the game is unpaused (see pauseGame)
       5. when the game is reset, the game time is reset to the totalTime (see resetGame)
       
       WHY: This must be done because setInterval does not continue to count down if the player tabs out. Date.now() is
       a solution to this, but will maintain the time the game was originally started if it is not updated each time the
       game is started. In addition to needing to update Date.now() every time the game is started, the final timeElapsed
       value must subtracted from the gameTime when the game is paused. */
}