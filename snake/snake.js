var INTERVAL_TIME = 100;

var CELL_SIZE = 10;
var LINE_OFFSIZE = 0.5;

var canvas;
var graphic;

var _WIDTH = 1000 + LINE_OFFSIZE;
var _HEIGHT = 500 + LINE_OFFSIZE;
var MAX_X = (_WIDTH - LINE_OFFSIZE) / CELL_SIZE;
var MAX_Y = (_HEIGHT - LINE_OFFSIZE) / CELL_SIZE;

function init(){
	canvas = $('#my_canvas').get(0);
	canvas.width = _WIDTH;
	canvas.height = _HEIGHT;
	
	graphic = canvas.getContext('2d');
}

function drawBackgroud(){
	graphic.fillStyle = 'white';
	graphic.fillRect(0, 0, _WIDTH, _HEIGHT);
	
	graphic.strokeStyle = 'black';
	graphic.rect(0, 0, _WIDTH, _HEIGHT);
	graphic.stroke();
}

function transXorY(val){
	return val * CELL_SIZE + LINE_OFFSIZE; 
}

function drawGrid() {
	graphic.strokeStyle = 'black';
	
	for(var i = 1, start = 0; start <= _HEIGHT; i++){
		start = transXorY(i);
		
		graphic.beginPath();
		graphic.moveTo(0, start);
		graphic.lineTo(_WIDTH, start);
		graphic.stroke();
	}
	
	for(var i = 1, start = 0; start <= _WIDTH; i++){
		start = transXorY(i);
		
		graphic.beginPath();
		graphic.moveTo(start, 0);
		graphic.lineTo(start, _HEIGHT);
		graphic.stroke();
	}
}

var INIT_LENGTH = 3;

var snakeAlive = (function(){
	var RANDOM_CRITICAL_POINT = MAX_X * MAX_Y / 3;
	
	var LEFT = 37, RIGHT = 39, UP = 38, DOWN = 40;
	var coords = [{x:1, y:0}, {x:2, y:0}, {x:3, y:0}];
	var coordMap = {};
	var randoOptionArray = [];
	var currentDirection, nextDirection;
	var randomSeg;
	var intervalId;

	function drawSeg(seg){
		var color;
		if(arguments[1])
			color = arguments[1];
		else
			color = 'red';
		graphic.fillStyle = color;
		graphic.fillRect(transXorY(seg.x), transXorY(seg.y), CELL_SIZE, CELL_SIZE);
	}
	
	function drawSegBG(x, y){
		graphic.fillStyle = 'white';
		graphic.fillRect(transXorY(x), transXorY(y), CELL_SIZE, CELL_SIZE);
		
		graphic.strokeStyle = 'black';
		graphic.rect(transXorY(x), transXorY(y), CELL_SIZE, CELL_SIZE);
		graphic.stroke();
	}
	
	function initEvent(){
		$(this).keydown(function(e){
			switch(e.which){
				case LEFT:
					if(nextDirection != RIGHT) nextDirection = e.which;
					break;
				case RIGHT:
					if(nextDirection != LEFT) nextDirection = e.which;
					break;
				case UP:
					if(nextDirection != DOWN) nextDirection = e.which;
					break;
				case DOWN:
					if(nextDirection != UP) nextDirection = e.which;
					break;
			}
			
			var headSeg = coords[coords.length - 1];
			var shouldStop = 
				(headSeg.x <= 0 && currentDirection != LEFT && nextDirection == LEFT)
				|| (headSeg.x >= MAX_X - 1 && currentDirection != RIGHT && nextDirection == RIGHT)
				|| (headSeg.y <= 0 && currentDirection != UP && nextDirection == UP)
				|| (headSeg.y >= MAX_Y - 1 && currentDirection != DOWN && nextDirection == DOWN);
			if(shouldStop)
				clearInterval(intervalId);
		});
	}
	
	function initSnake(){
		nextDirection = currentDirection = RIGHT;
		
		graphic.fillStyle = 'red';
		for(var i = 0; i < coords.length; i++){
			var coord = coords[i];
			
			drawSeg(coord);

			var key = coord.x + '_' + coord.y;
			coordMap[key] = coord;
		}
	}
	
	function clearSeg(seg){
		graphic.clearRect(transXorY(seg.x), transXorY(seg.y), CELL_SIZE, CELL_SIZE);
		drawSegBG(seg.x, seg.y);
	}
	
	function transSegByDirection(seg){
		switch(nextDirection){
			case LEFT:
				return {x: seg.x - 1, y: seg.y};
			case RIGHT:
				return {x: seg.x + 1, y: seg.y};
			case UP:
				return {x: seg.x, y: seg.y - 1};
			case DOWN:
				return {x: seg.x, y: seg.y + 1};
		}
	}
	
	function createKey(x, y){
		return x + '_' + y;
	}
	
	function refreshCoordMap(removeSegs, addSegs){
		for(var i = 0; i < removeSegs.length; i++){
			var seg = removeSegs[i];
			var key = createKey(seg.x, seg.y);
			delete coordMap[key];
		}
		for(i = 0; i < addSegs.length; i++){
			var seg = addSegs[i];
			var key = createKey(seg.x, seg.y);
			
			if(coordMap.hasOwnProperty(key)){
				clearInterval(intervalId);
				break;
			}
			
			coordMap[key] = seg;
		}
	}
	
	function refreshRandomOptionArray(){
		randoOptionArray = [];
		for(var x = 0; x < MAX_X; x++){
			for(var y = 0; y < MAX_Y; y++){
				var key = createKey(x, y);
				if(!coordMap.hasOwnProperty(key))
					randoOptionArray.push({x: x, y: y});
			}
		}
	}
	
	function snakeMove(){
		var removeSegs = [], addSegs = [];
		
		function addSegArray(seg){
			addSegs.push(seg);
			coords.push(seg);
			drawSeg(seg);
		}
		
		var tailSeg = coords[0];
		var headSeg = coords[coords.length - 1];
		
		coords.splice(0, 1);
		removeSegs.push(tailSeg);
		clearSeg(tailSeg);
		
		newHeadSeg = transSegByDirection(headSeg);
		if(newHeadSeg.x == randomSeg.x && newHeadSeg.y == randomSeg.y){
			addSegArray(randomSeg);
			newHeadSeg = transSegByDirection(randomSeg);
			
			createRandomNut();
		}
		
		addSegArray(newHeadSeg);
		
		currentDirection = nextDirection;	
		
		refreshCoordMap(removeSegs, addSegs);
	}
	
	function createRandomNut(){
		refreshRandomOptionArray();
		
		var random = Math.random();
		var index = Number(random * randoOptionArray.length).toFixed(0);
		randomSeg = randoOptionArray[index];
		drawSeg({x: randomSeg.x, y: randomSeg.y}, 'green');
	}
	
	function animateHandler(){
		snakeMove();
		
		var headSeg = coords[coords.length - 1];
		function shouldStop(){
			return (headSeg.x <= 0 && nextDirection == LEFT)
				|| (headSeg.x >= MAX_X - 1 && nextDirection == RIGHT)
				|| (headSeg.y <= 0 && nextDirection == UP)
				|| (headSeg.y >= MAX_Y - 1 && nextDirection == DOWN);
		}
		
		if(shouldStop())
		{
			setTimeout(function(){
				if(shouldStop())
					clearInterval(intervalId);
			}, INTERVAL_TIME * 0.9);
		}
	}
	
	return function(){
		initEvent();
		initSnake();
		
		refreshCoordMap([], []);
		createRandomNut();
		
		intervalId = setInterval(animateHandler, INTERVAL_TIME);
	}
})();

function draw(){
	drawBackgroud();
	drawGrid();
	
	snakeAlive();
}

$(function(){
	init();
	
	draw();
})