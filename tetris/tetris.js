/*
 * Square Structure: {col: , row: , img: }
 */

var $mainPanel;
var mainCtx;
var previewCtx;

function createImage(src){
	var img = new Image();
	img.src = src;
	return img;
}

var COLS = 10, ROWS = 20;

function initBackground(){
	$mainPanel = $('#main_panel');
	$mainPanel.append('<canvas id="main_bg"/>').append('<canvas id="main_canvas"/>');
	
	var mainCanvas = $('#main_canvas').get(0);
	mainCtx = mainCanvas.getContext('2d');
	
	var canvas = $('#main_bg').get(0);
	var ctx = canvas.getContext('2d');
	var img = createImage('./images/bg.png');
	img.onload = function(){
		mainCanvas.width = canvas.width = COLS * img.width + COLS * 2 + 2;
		mainCanvas.height = canvas.height = ROWS * img.height + (ROWS + 1) * 2;
			
		$mainPanel.width(canvas.width).height(canvas.height);
			
		for(var i = 0; i < COLS; i++){
			for(var j = 0; j < ROWS; j++){
				var x = 2 + i * img.width + i * 2;
				var y = 2 + j * img.height + j * 2;
				
				ctx.drawImage(img, x, y);
			}
		}
	};
}

var SQUARE_SIZE = 24;
var zImg, sImg, jImg, lImg, oImg, iImg, tImg;
var Z_SQUARE_SET, S_SQUARE_SET, J_SQUARE_SET, L_SQUARE_SET, O_SQUARE_SET, I_SQUARE_SET, T_SQUARE_SET;
var SQUARE_SET;

function initImages(){
	zImg = createImage('./images/z.png');
	Z_SQUARE_SET = {
			iniState: 1, // two states: 1, -1
			orig: {col: 3, row: -2},
			img: zImg,
			locations: [{col: 0, row: 0}, {col: 1, row: 0}, {col: 1, row: 1}, {col: 2, row: 1}]
	};
	
	oImg = createImage('./images/o.png');
	O_SQUARE_SET = {
		iniState: 0, // one state: 0
		orig: {col: 4, row: -2},
		img: oImg,
		locations: [{col: 0, row: 0}, {col: 1, row: 0}, {col: 0, row: 1}, {col: 1, row: 1}]
	};
	
	jImg = createImage('./images/j.png');
	J_SQUARE_SET = {
		iniState: 0, // four states: 0, 1, 2, 3
		orig: {col: 4, row: -3},
		img: jImg,
		locations: [{col: 1, row: 0}, {col: 1, row: 1}, {col: 1, row: 2}, {col: 0, row: 2}]
	};
	
	lImg = createImage('images/l.png');
	L_SQUARE_SET = {
			iniState: 0, // four states: 0, 1, 2, 3
			orig: {col: 4, row: -3},
			img: lImg,
			locations: [{col: 0, row: 0}, {col: 0, row: 1}, {col: 0, row: 2}, {col: 1, row: 2}]
	};
	
	sImg = createImage('./images/s.png');
	S_SQUARE_SET = {
		iniState: 1, // two states: 1, -1
		orig: {col: 3, row: -2},
		img: sImg,
		locations: [{col: 0, row: 1}, {col: 1, row: 1}, {col: 1, row: 0}, {col: 2, row: 0}]
	};
	
	iImg = createImage('./images/i.png');
	I_SQUARE_SET = {
		iniState: 1, // two states: 1, -1
		orig: {col: 4, row: -4},
		img: iImg,
		locations: [{col: 0, row: 0}, {col: 0, row: 1}, {col: 0, row: 2}, {col: 0, row: 3}]
	};
	
	tImg = createImage('./images/t.png');
	T_SQUARE_SET = {
			iniState: 0,
			orig: {col: 3, row: -2},
			img: tImg,
			locations: [{col: 0, row: 1}, {col: 1, row: 0}, {col: 1, row: 1}, {col: 2, row: 1}]
	}
	
	SQUARE_SET = [Z_SQUARE_SET, S_SQUARE_SET, I_SQUARE_SET, J_SQUARE_SET, L_SQUARE_SET, O_SQUARE_SET, T_SQUARE_SET];
}

function cloneMovingSquares(){
	var clone = [];
	for(var i = 0; i < movingSquares.length; i++){
		var oldSquare = movingSquares[i];
		var newSquare = {col: oldSquare.col, row: oldSquare.row, img: oldSquare.img};
		clone.push(newSquare);
	}
	return clone;
}

var LEFT = 37, RIGHT = 39, UP = 38, DOWN = 40, SPACE = 32;

function controlHandler(){
	$(this).keyup(function(e){
		if(gameStatus != START_STATUS || checkShouldStop())
			return;
		
		var ch = e.which;
		if(ch == UP){
			refreshMovingSquare(function(){
				var oldMovingSquares = cloneMovingSquares();
				var oldMovingSate = movingState;
				transitMovingSuqares();
				
				var applyTransitResult = true;
				for(var i = 0; i < movingSquares.length && applyTransitResult; i++){
					var square = movingSquares[i];
					applyTransitResult = !stillSquareMap.hasOwnProperty(getStillSquareKey(square)); 
				}
				if(!applyTransitResult){
					movingSquares = oldMovingSquares;
					movingState = oldMovingSate;
				}
			});
		} else if(ch == SPACE){
			while(!checkShouldStop()){
				doMoveSquare(1, 'row');
			}
		}
	}).keydown(function(e){
		if(gameStatus != START_STATUS)
			return;
		
		var ch = e.which;
		if(ch == LEFT){
			doMoveSquare(0 - 1, 'col');
		} else if(ch == RIGHT){
			doMoveSquare(1, 'col');
		} else if(ch == DOWN && !checkShouldStop()){
			doMoveSquare(1, 'row');
		}
	});
}

var previewWidth, previewHeight;

function initPreviewCanvas(){
	var $canvas = $('#preview_canvas');
	var canvas = $canvas.get(0);
	previewWidth = canvas.width = $canvas.parent().width();
	previewHeight = canvas.height = $canvas.parent().height();
	previewCtx = canvas.getContext('2d');
}

function init(){
	initBackground();
	initImages();
	
	controlHandler();
	
	initPreviewCanvas();
}

var movingState;

function buildShape(squareSet){
	var orig = squareSet.orig;
	
	if(arguments[1])
		orig = {col: 0, row: 0};
	else
		movingState = squareSet.iniState;
	
	var img = squareSet.img;
	
	var squares = [];
	$.each(squareSet.locations, function(index, location){
		squares.push({col: location.col + orig.col, row: location.row + orig.row, img: img});
	});
	return squares;
}

function transXorY(val){
	return val * SQUARE_SIZE;
}

function drawMainPanelSquares(squares){
	$.each(squares, function(index, square){
		mainCtx.drawImage(square.img, transXorY(square.col), transXorY(square.row));
	});
}

function clearMainPanelSquares(squares){
	$.each(squares, function(index, square){
		mainCtx.clearRect(transXorY(square.col), transXorY(square.row), square.img.width, square.img.height);
	});
}

var movingSquares;

function refreshMovingSquare(caller){
	clearMainPanelSquares(movingSquares);
	if($.isFunction(caller)) caller.call();
	drawMainPanelSquares(movingSquares);
}

function transit_z(){
	movingSquares[0].col +=  2 * movingState;
	movingSquares[1].row +=  2 * movingState;
	movingState = 0 - movingState;
}

function transit_j(){
	if(movingState == 0){
		movingSquares[0].col -= 2;
		movingSquares[0].row += 1;
		movingSquares[1].col -= 2;
		movingSquares[1].row += 1;
		
		movingState = 1;
	} else if(movingState == 1){
		movingSquares[2].col -= 1;
		movingSquares[2].row -= 2;
		movingSquares[3].col -= 1;
		movingSquares[3].row -= 2;
		
		movingState = 2;
	} else if(movingState == 2){
		movingSquares[0].col += 2;
		movingSquares[0].row -= 1;
		movingSquares[1].col += 2;
		movingSquares[1].row -= 1;
		
		movingState = 3;
	} else if(movingState == 3){
		movingSquares[2].col += 1;
		movingSquares[2].row += 2;
		movingSquares[3].col += 1;
		movingSquares[3].row += 2;
		
		movingState = 0;
	}
}

function transit_l(){
	if(movingState == 0){
		movingSquares[2].col += 1;
		movingSquares[2].row -= 2;
		movingSquares[3].col += 1;
		movingSquares[3].row -= 2;
		
		movingState = 1;
	} else if(movingState == 1){
		movingSquares[0].col += 2;
		movingSquares[0].row += 1;
		movingSquares[1].col += 2;
		movingSquares[1].row += 1;
		
		movingState = 2;
	} else if(movingState == 2){
		movingSquares[2].col -= 1;
		movingSquares[2].row += 2;
		movingSquares[3].col -= 1;
		movingSquares[3].row += 2;
		
		movingState = 3;
	} else if(movingState == 3){
		movingSquares[0].col -= 2;
		movingSquares[0].row -= 1;
		movingSquares[1].col -= 2;
		movingSquares[1].row -= 1;
		
		movingState = 0;
	}
}

function transit_s(){
	movingSquares[0].col +=  2 * movingState;
	movingSquares[3].row +=  2 * movingState;
	movingState = 0 - movingState;
}

function transit_i(){
	movingSquares[0].col += 2 * movingState;
	movingSquares[0].row += 2 * movingState;
	movingSquares[1].col += 1 * movingState;
	movingSquares[1].row += 1 * movingState;
	movingSquares[3].col -= 1 * movingState;
	movingSquares[3].row -= 1 * movingState;
	
	movingState = 0 - movingState;
}

function transit_t(){
	if(movingState == 0){
		movingSquares[2].col -= 1;
		movingSquares[2].row -= 1;
		movingSquares[3].col -= 2;
		movingSquares[3].row -= 2;
		
		movingState = 1;
	} else if(movingState == 1){
		movingSquares[0].col += 2;
		movingSquares[0].row -= 2;
		movingSquares[2].col += 1;
		movingSquares[2].row -= 1;
		
		movingState = 2;
	} else if(movingState == 2){
		movingSquares[2].col += 1;
		movingSquares[2].row += 1;
		movingSquares[3].col += 2;
		movingSquares[3].row += 2;
		
		movingState = 3;
	} else if(movingState == 3){
		movingSquares[0].col -= 2;
		movingSquares[0].row += 2;
		movingSquares[2].col -= 1;
		movingSquares[2].row += 1;
		
		movingState = 0;
	}
}

function transitMovingSuqares(){
	var img = movingSquares[0].img;
	if(img == zImg){
		transit_z();
	} else if(img == jImg){
		transit_j();
	} else if(img == lImg){
		transit_l();
	} else if(img == sImg){
		transit_s();
	} else if(img == iImg){
		transit_i();
	} else if(img == tImg){
		transit_t();
	}
	
	var amendedCol = 0;
	for(var i = 0; i < movingSquares.length; i++){
		var col = movingSquares[i].col; 
		if(col < 0){
			amendedCol = 1;
			break;
		} else if(col > COLS - 1){
			amendedCol = img == iImg ? -2 : -1;
			break;
		}
	}
	$.each(movingSquares, function(index, square){
		square.col += amendedCol;
	});
}

function checkBoundary(increment){
	for(var i = 0; i < movingSquares.length; i++){
		var square = movingSquares[i];
		if((square.col == 0 && increment < 0) || (square.col == (COLS - 1) && increment > 0))
			return true;
		
		var key1 = getStillSquareKey({col: square.col + 1, row: square.row});
		var key2 = getStillSquareKey({col: square.col - 1, row: square.row});
		if((stillSquareMap.hasOwnProperty(key1) && increment > 0)|| 
				(stillSquareMap.hasOwnProperty(key2) && increment < 0))
			return true;
	}
	
	return false;
}

function doMoveSquare(increment, colOrrow){
	if(colOrrow == 'col' && checkBoundary(increment)) return;
	
	refreshMovingSquare(function(){
		$.each(movingSquares, function(index, movingSquare){
			movingSquare[colOrrow] += increment;
		});
	});
}

var previewSquares;
var previewSquaresIndex;

function drawPreviewSquares(){
	previewCtx.clearRect(0, 0, previewWidth, previewHeight);
	
	previewSquares = randomCreateSquare(true);
	
	var l_right = l_down = 0;
	for(var i = 0; i < previewSquares.length; i++){
		var square = previewSquares[i];
		var x = transXorY(square.col);
		var y = transXorY(square.row);
		if(l_right < x) l_right = x;
		if(l_down < y) l_down = y;
	}
	l_right += SQUARE_SIZE;
	l_down += SQUARE_SIZE;
	
	var offsizeX = (previewWidth - l_right) / 2;
	var offsizeY = (previewHeight - l_down) / 2
	$.each(previewSquares, function(index, square){
		previewCtx.drawImage(square.img, transXorY(square.col) + offsizeX, transXorY(square.row) + offsizeY);
	});
}

function randomCreateSquare(){
	var rIndex = Math.floor(Math.random() * SQUARE_SET.length);
	
	if(arguments[0]) previewSquaresIndex = rIndex;
	
	return buildShape(SQUARE_SET[rIndex], arguments[0]);
}

function checkShouldStop(){
	for(var i = 0; i < movingSquares.length; i++){
		var square = movingSquares[i];
		var key = getStillSquareKey({col: square.col, row: square.row + 1});
		if(stillSquareMap.hasOwnProperty(key))
			return true;
	}
	for(i = 0; i < movingSquares.length; i++){
		if(movingSquares[i].row >= ROWS - 1){
			return true;
		}
	}
	return false;
}

var stillSquareMap = {};

function getStillSquareKey(square){
	return square.col + '_' + square.row;
}

function refreshStillSquareMap(squares){
	$.each(squares, function(index, square){
		stillSquareMap[getStillSquareKey(square)] = square;
	});
}

function squaresFlash(count, squares){
	var callback = arguments[2];
	
	if(count > 0){
		setTimeout(function(){
			if(this.flag == undefined)
				this.flag = true;
			else
				this.flag = !this.flag;
			
			this.flag ? clearMainPanelSquares(squares) : drawMainPanelSquares(squares);
			
			squaresFlash(count - 1, squares, callback);
		}, 100);
	} else if(callback && $.isFunction(callback)){
		callback.call();
	}
}

function scrapeHandler(){
	var scrapingRows = [];
	for(var row = ROWS - 1; row >= 0; row--){
		var shouldScrape = true;
		for(var col = 0; col < COLS && shouldScrape; col++){
			var key = getStillSquareKey({col: col, row: row});
			shouldScrape = stillSquareMap.hasOwnProperty(key);
		}
		if(shouldScrape) scrapingRows.push(row);
	}
	
	if(scrapingRows.length == 0)
		return;
	
	var stillSquares = [];
	for(key in stillSquareMap){
		var square = stillSquareMap[key];
		stillSquares.push(square);
	}
	
	var scrapeSquares = [];
	for(var i = 0; i < scrapingRows.length; i++){
		row = scrapingRows[i];
		for(var col = 0; col < COLS; col++){
			var key = getStillSquareKey({col: col, row: row});
			scrapeSquares.push(stillSquareMap[key])
			delete stillSquareMap[key];
		}
	}
	
	squaresFlash(4, scrapeSquares, function(){
		refreshScore(scrapingRows.length);
		
		clearMainPanelSquares(stillSquares);
		
		var remainSquares = [];
		for(key in stillSquareMap){
			var square = stillSquareMap[key];
			var incrementRow = 0;
			for(i = 0; i < scrapingRows.length; i++){
				if(square.row < scrapingRows[i])
					incrementRow++;
			}
			square.row += incrementRow;
			remainSquares.push(square);
		}
		drawMainPanelSquares(remainSquares);
		
		stillSquareMap = {};
		refreshStillSquareMap(remainSquares);
	});
}

var intervalId;
var intervalTime = 1000;

function showGameFrame(newSquares){
	if(newSquares){
		movingSquares = previewSquares ? buildShape(SQUARE_SET[previewSquaresIndex]) : randomCreateSquare();
		drawMainPanelSquares(movingSquares);
		
		drawPreviewSquares();
	}
	
	intervalId = setInterval(function(){
		if(checkShouldStop()){
			clearInterval(intervalId);
			
			refreshStillSquareMap(movingSquares);
			scrapeHandler();
			showGameFrame(true);
		}
		
		judgeGameOver();
		
		refreshMovingSquare(function(){
			$.each(movingSquares, function(index, square){
				square.row++;
			});
		});
	}, intervalTime);
}

var $startPauseBtn;
var START_TEXT = 'Start', PAUSE_TEXT = 'Pause', GAME_OVER_TEXT = 'Game Over';

var INIT_STATUS = 'init_status', PAUSE_STATUS = 'pause_status', START_STATUS = 'start_status', GAME_OVER = 'game_over';
var gameStatus = INIT_STATUS;

function initGameStatusPanel(){
	$startPauseBtn = $('#start_pause_btn');
	$startPauseBtn.text(START_TEXT).click(function(){
		var text = $startPauseBtn.text();
		if(text == START_TEXT){
			if(intervalId == undefined)
				showGameFrame(gameStatus == INIT_STATUS);
			
			gameStatus = START_STATUS;
			$startPauseBtn.text(PAUSE_TEXT);
		} else if(text == PAUSE_TEXT){
			clearInterval(intervalId);
			intervalId = undefined;
			
			gameStatus = PAUSE_STATUS;
			$startPauseBtn.text(START_TEXT);
		}
	});
	$('#restart_btn').click(function(){
		location.reload();
	});
}

var TOP_SCORE_KEY = 'top_score_key';

var $topScore;
var $score;
var $level;

function initVariables(){
	$topScore = $('#top_score');
	$score = $('#score');
	$level = $('#level');
	
	var topScore = localStorage.getItem(TOP_SCORE_KEY);
	if(topScore) $topScore.text(topScore);
}

function refreshScore(score){
	var score = Number($score.text()) + score;
	$score.text(score);
	
	refreshLevel(score);
	
	var topScore = Number($topScore.text());
	if(topScore < score){
		topScore = score;
		$topScore.text(topScore);
		
		localStorage.setItem(TOP_SCORE_KEY, topScore);
	}
}

function refreshLevel(score){
	if(intervalTime <= 200)
		return;
	
	var level = Math.floor(score / 50);
	intervalTime = 1000 - level * 100;
	clearInterval(intervalId);
	showGameFrame(false);
	
	$level.text(level + 1);
}

function judgeGameOver(){
	for(var key in stillSquareMap){
		var square = stillSquareMap[key];
		if(square.row == 0){
			clearInterval(intervalId);
			gameStatus = GAME_OVER;
			
			$startPauseBtn.text(GAME_OVER_TEXT).attr('disabled', true)
			alert(GAME_OVER_TEXT);
			return true;
		}
	}
	return false;
}

$(function(){
	initVariables();
	
	init();
	
	initGameStatusPanel();
});