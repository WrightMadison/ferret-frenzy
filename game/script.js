// TODO add px to rem converter helper method
// TODO var or let - JS validator
// TODO add game favicon
// TODO test in other browsers

// ----- VARIABLES -----
// Tile Dimensions
var tSize = 20; // pixels

// Board Dimensions
var can; // canvas
var cxt; // context
var bWidth = 32; // tiles
var bHeight = 26; // tiles

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

// Score & Points
var score = 0;
var ptsPoopSquished = -50;
var ptsPoopCleaned = 100;
var ptsPoopRemaining = -75;
// TODO after a certain amount of time poop becomes smellier and less points are possible
// TODO poop pictures (fresh & not stepped on light brown, old & not stepped on, dark brown -> stepped on variants so 4 total)
// TODO balance points

// Player Settings
var hWidth = 3; // tiles
var hHeight = 2; // tiles
var hBaseSlows = 0; // milliseconds
var spritesMadison = [];

// Ferret Settings
var fWidth = 1; // tiles
var fHeight = 3; // tiles
var fMaxMove = 3; // tiles (inclusive)
var fBaseSpeed = 400; // milliseconds
var spritesGhost = []; // images
var spritesGreyWind = []; // images

// Poop Settings
var pWidth = 1; // tiles
var pHeight = 1; // tiles
var spritesPoop = []; // images

// Image Paths & Sprites
var imagePrefix = '../images';
var imagePaths = ['/Madison/Madison-', '/Ghost/Ghost-', '/Grey-Wind/Grey-Wind-'];
var imageDirections = ['W.png', 'A.png', 'S.png', 'D.png'];
var imagePoops = ['/poop.png', '/poop-squished.png'];
var sprites = [spritesMadison, spritesGhost, spritesGreyWind, spritesPoop];
/* Image paths are dynamic because it will be easier to edit in case the file structure is later changed.
   I opted to have the sprites rotated in four directions to save myself from the hassle of
   calculating canvas rotations each time an actor moves in order to make the game more efficient. */

// Objects
var madison, ghost, greyWind, actors, ferrets, poops, boundaries;

// ----- OBJECT CLASSES -----
class Actor {
   constructor(name, type, width, height, speed, startDirection, startX, startY, sprites) {
        this.name = name;
        this.type = type; // ferret*, furniture, human*, poop
        this.width = width; // tiles
        this.height = height; // tiles
        this.speed = speed; // timeout or interval in milliseconds
        this.startDirection = startDirection; // W, A, S, D
        this.startX = startX; // tile x-coordinate
        this.startY = startY; // tile y-coordinate
        this.sprites = sprites; // images
        
        this.direction = startDirection; // W, A, S, D
        this.lastInput = startDirection; // W, A, S, D
        this.moveSuccess = true;
        this.left = 0; // tiles (x)
        this.right = 0; // tiles
        this.top = 0; // tiles (y)
        this.bottom = 0; // tiles
        this.colliding = false;
        this.queue = []; // list of queued moves
    }
    // TODO - player does not need moveSuccess nor list of queued moves, only ferrets (or maybe it will come in handy)

    move(input, deltaX, deltaY) {
        // save current state
        var originalState = [this.width, this.height, this.direction, this.lastInput];
        // update state and undergo rotation
        this.lastInput = input;
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

            // TODO make this more efficient with a map?
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
                } else if (this.type == 'ferret') {
                    if (boundary.type == 'furniture') {
                        // TODO - ferrets have different boundaries (e.g. can get in ball pit and litter boxes, can run under table)
                        // TODO - ferrets are transparent when under the table and cage or inside rice box or cat condo to show their location
                        if (this.queue.length > 0) {
                            // if a ferret runs into furniture and has more of the same direction queued, the queue is cleared
                            this.queue.splice(0, this.queue.length);
                        } // TODO combine with above if (if there is only one)
                    } else if (boundary.type == 'ferret') {
                        console.log(this.name + ' ran into ' + boundary.name);
                        // TODO - the ferrets temporarily speed up
                    } else if (boundary.type == 'human') {
                        // TODO - this slows the player
                        console.log(this.name + ' attacked your shoes and slowed you down.');
                    }
                }
                // TODO ghost and grey wind ran into each other
                // TODO the more poops on a piddle pad or in a litter box, the more points for cleaning it (one tap to clean all)
                // TODO less points lost for poop left on piddle pad than on floor
                // TODO if litterbox or pad is full, points double but degrade quickly to a certain amount

                // rotation failed - restore previous state
                this.width = originalState[0];
                this.height = originalState[1];
                this.direction = originalState[2];
                this.lastInput = originalState[3];
                this.moveSuccess = false;

                break;
            }
        }

        if (this.colliding == false) {
            // clear previous location - bug with clearing at negative values (should not encounter anyway)
            // (top left x, top left y, bottom right x, bottom right y)
            cxt.clearRect(px(this.left), px(this.top), px(this.left+this.width), px(this.top+this.height));

            // rotation succeeded - update location
            this.left = newLeft;
            this.right = newRight;
            this.top = newTop;
            this.bottom = newBottom;
            this.moveSuccess = true;

            for (let i = 0; i < poops.length; i++) {
                let poop = poops[i];

                if (this.type == "human" && poop.squished == false &&
                    (((poop.left >= newLeft && poop.left < newRight) || (poop.right > newLeft && poop.right <= newRight)) &&
                     ((poop.top >= newTop && poop.top < newBottom) || (poop.bottom > newTop && poop.bottom <= newBottom)))) {
                    poop.squished = true;
                    updateScore(ptsPoopSquished);
                    console.log("You stepped in poop!");
                }
            }

            // redraw all actors
            redrawObjects();
        }

        this.colliding = false;
    }

    rotate() {
        // only rotate if last direction is different from new one
        if (this.direction != this.lastInput) {
            if (this.lastInput == 'W' || this.lastInput == 'S') {
                if (this.type == 'human') {
                    this.height = hHeight;
                    this.width = hWidth;
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
                    this.height = hWidth;
                    this.width = hHeight;
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
        var deltaX = this.startX - this.left;
        var deltaY = this.startY - this.top;
        this.move(this.startDirection, deltaX, deltaY);
    }
}

class Boundary {
    constructor(name, left, right, top, bottom) {
        this.name = name;
        this.type = 'furniture'; // ferret, furniture*, human, poop
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
    }
}

// TODO may not need the type listed since poop is not a boundary
class Poop {
    constructor(left, top) {
        this.type = 'poop'; // ferret, furniture, human, poop*
        this.width = pWidth; // tiles
        this.height = pHeight; // tiles

        this.left = left;
        this.right = left + 1;
        this.top = top;
        this.bottom = top + 1;

        this.squished = false;
        this.created = Date.now();
    }

    clean(index) {
        //poops = poops.splice(index, 1);
        // (top left x, top left y, bottom right x, bottom right y)
        cxt.clearRect(px(this.left), px(this.top), px(this.left+this.width), px(this.top+this.height));
        // TODO might need redrawObjects
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

// TODO press button to clean shoe
// TODO JKL (right-handed mode) or ZXC (left-handed mode) to clean poo (in keydown event) if poo is directly in front
// TODO make controller map for game
//the custom movements account for the player not being a perfect square
function keyDownHandler(e) {
    if (e.key == 'w' || e.key == 'W' || e.key == 'Up' || e.key == 'ArrowUp') {
        if (madison.lastInput == 'A') {
            madison.move('W', 0, 0);
        } else if (madison.lastInput == 'D') {
            madison.move('W', -1, 0);
        } else {
            madison.move('W', 0, -1);
        }
    } else if (e.key == 'a' || e.key == 'A' || e.key == 'Left' || e.key == 'ArrowLeft') {
        if (madison.lastInput == 'W') {
            madison.move('A', 0, 0);
        } else if (madison.lastInput == 'S') {
            madison.move('A', 0, -1);
        } else {
            madison.move('A', -1, 0);
        }
    } else if (e.key == 's' || e.key == 'S' || e.key == 'Down' || e.key == 'ArrowDown') {
        if (madison.lastInput == 'D') {
            madison.move('S', -1, 1);
        } else {
            madison.move('S', 0, 1);
        }
    } else if (e.key == 'd' || e.key == 'D' || e.key == 'Right' || e.key == 'ArrowRight') {
        if (madison.lastInput == 'S') {
            madison.move('D', 1, -1);
        } else {
            madison.move('D', 1, 0);
        }
    }
}

// TODO allow ferrets to rotate when directly next to a boundary
function ferretMovement(ferret) {
    if (ferret.queue.length == 0) {
        var randDirection = getRandomInt(4); // 1 = W, 2 = A, 3 = S, 4 = D
        var direction;
        var distance = getRandomInt(5);

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
            ferret.move('W', 0, -1);
        } else if (ferret.lastInput == 'A' || ferret.lastInput == 'D') {
            ferret.move('W', 1, -1);
        } else if (ferret.lastInput == 'S') {
            ferret.move('W', 0, 0);
        }
    } else if (nextMove == 'A') {
        if (ferret.lastInput == 'W' || ferret.lastInput == 'S') {
            ferret.move('A', -1, 1);
        } else if (ferret.lastInput == 'A') {
            ferret.move('A', -1, 0);
        } else if (ferret.lastInput == 'D') {
            ferret.move('A', 0, 0);
        }
    } else if (nextMove == 'S') {
        if (ferret.lastInput == 'W') {
            ferret.move('S', 0, 0);
        } else if (ferret.lastInput == 'A' || ferret.lastInput == 'D') {
            ferret.move('S', 1, -1);
        } else if (ferret.lastInput == 'S') {
            ferret.move('S', 0, 1);
        }
    } else if (nextMove == 'D') {
        if (ferret.lastInput == 'W' || ferret.lastInput == 'S') {
            ferret.move('D', -1, 1);
        } else if (ferret.lastInput == 'A') {
            ferret.move('D', 0, 0);
        } else if (ferret.lastInput == 'D') {
            ferret.move('D', 1, 0);
        }
    }

    // TODO make this more efficient with a map?
    if (ferret.moveSuccess == true && getRandomInt(10) == 1) {
        var emptyTile = true;
        var poopLeft = ferret.left;
        var poopTop = ferret.top;

        if (ferret.lastInput == 'W') {
            poopTop = poopTop + 2;
        } else if (ferret.lastInput == 'A') {
            poopLeft = poopLeft + 2;
        }

        // checks if poop already exists at a particular tile
        for (let i = 0; i < poops.length; i++) {
            if (poopLeft == poops[i].left && poopTop == poops[i].top) {
                emptyTile = false;
                break;
            }
        }

        if (emptyTile == true) {
            var newPoop = new Poop(poopLeft, poopTop);
            poops.push(newPoop);
            redrawObjects();
        }
    }
}

function preloadSprites(callback) {
    var imagePath;
    var image;
    var loadedCounter = 0;

    // TODO make this code less repetitive
    for (let i = 0; i < sprites.length; i++) {
        // create image file path
        if (i != 3) {
            for (let j = 0; j < imageDirections.length; j++) {
                // create image
                image = new Image();
                imagePath = imagePrefix + imagePaths[i] + imageDirections[j];
                image.src = imagePath;

                // store the image in its respective array
                sprites[i].push(image);
            }
        } else {
            for (let j = 0; j < imagePoops.length; j++) {
                // create image
                image = new Image();
                imagePath = imagePrefix + imagePoops[j];
                image.src = imagePath;

                // store the image in its respective array
                sprites[i].push(image);

                // synchronizes the images loading with actors being placed on the board
                if (j == imagePoops.length - 1) {
                    image.onload = callback;
                }
            }
        }
    }
}

// all game objects must redrawn after each move
// TODO poops have slight feathering between frames - are multiple being drawn at each location?
function redrawObjects() {
    var sprite;

    // poops must be redrawn first so that actors appear on top of them when they overlap
    for (let i = 0; i < poops.length; i++) {
        if (poops[i].squished == false) {
            sprite = spritesPoop[0];
        } else if (poops[i].squished == true) {
            sprite = spritesPoop[1];
        }

        // image, x, y, width, height
        cxt.drawImage(sprite, px(poops[i].left), px(poops[i].top), px(poops[i].width), px(poops[i].height));
    }

    for (let i = 0; i < actors.length; i++) {
        if (actors[i].direction == 'W') {
            sprite = actors[i].sprites[0];
        } else if (actors[i].direction == 'A') {
            sprite = actors[i].sprites[1];
        } else if (actors[i].direction == 'S') {
            sprite = actors[i].sprites[2];
        } else if (actors[i].direction == 'D') {
            sprite = actors[i].sprites[3];
        }

        // image, x, y, width, height
        cxt.drawImage(sprite, px(actors[i].left), px(actors[i].top), px(actors[i].width), px(actors[i].height));
    }
}

function timePrecision(timestamp) {
  return (timestamp/1000).toFixed(2);
}

function updateScore(deltaPoints) {
    score = score + deltaPoints;
    document.getElementById('score').innerHTML = score;
}

// ----- GAME LOGIC -----
function loadBoard() {
    can = document.createElement('canvas');
    cxt = this.context;

    // TODO title screen "Ferret Frenzy"
    // TODO - include pics of Grey after tearing up the dishwasher insulation and Ghost ripping up a piddle pad
    // 'this game is dedicated to my well-behaved ferrets Ghost & Grey Wind'

    // CANVAS DIMENSIONS
    can.width = tSize * bWidth;
    can.height = tSize * bHeight;

    // LOAD BOARD
    cxt = can.getContext('2d');
    document.body.insertBefore(can, document.body.childNodes[0]);

    // CREATE GAME OBJECTS
    preloadSprites(function() {
        // initialize all objects
        madison = new Actor('Madison', 'human', hWidth, hHeight, hBaseSlows, 'W', 8, 21, spritesMadison);
        ghost = new Actor('Ghost', 'ferret', fWidth, fHeight, fBaseSpeed, 'S', 7, 9, spritesGhost);
        greyWind = new Actor('Grey Wind', 'ferret', fHeight, fWidth, fBaseSpeed, 'A', 23, 20, spritesGreyWind);
        actors = [madison, ghost, greyWind];
        ferrets = [ghost, greyWind];
        poops = [];
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
    });    
    
    // TODO add dishwasher boundary (and include it in final board drawing)
    // TODO player speed debuffs
    // TODO score
    // TODO include time remaining when an event occurs in dialog box
    // TODO textbox of recent actions (8-bit font?)
    // TODO include description of points
    // TODO make a faint outline around final grid so boundaries are easy to identify
    // TODO create poop sprites (replace placeholders)
}

function startGame() {
    // disable this button and enable its opposite
    document.getElementById('start').disabled = true;
    document.getElementById('pause').disabled = false;
    document.getElementById('reset').disabled = true;

    // enable player movement
    document.addEventListener('keydown', keyDownHandler, false);
    
    // begin ferret movement
    ghostMovement = setInterval(function() {
        ferretMovement(ghost);
    }, ghost.speed);
    greyWindMovement = setInterval(function() {
        ferretMovement(greyWind);
    }, greyWind.speed);

    // begin timer
    timerStarted = Date.now();
    updateTimer();

    // TODO user can click on items to display what they are (probably not worth the time investment for now)
}

function pauseGame() {
    // stop the timer and record remaining time
    clearInterval(gameTimer);
    gameTime = gameTime - timeElapsed;

    // disable this button and enable its opposite
    document.getElementById('start').disabled = false;
    document.getElementById('pause').disabled = true;
    document.getElementById('reset').disabled = false;

    // disable player movement
    document.removeEventListener('keydown', keyDownHandler, false);

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

    // reset the score
    updateScore(score*-1);

    // TODO scoreboard

    // stop ferret movement
    clearInterval(ghostMovement);
    clearInterval(greyWindMovement);

    // clear all poop from the board; this is faster than using clean() on each object
    cxt.clearRect(0, 0, can.width, can.height);
    poops.splice(0, poops.length);

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

            // TODO deduction for remaining poops/tasks on board
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