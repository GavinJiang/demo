var SEG_SIZE = 10;

var WIDTH = 800;
var HEIGHT = 400;

var MAX_X = WIDTH / SEG_SIZE - 1;
var MAX_Y = HEIGHT / SEG_SIZE - 1;

var SCORES_STORAGE_KEY = "scores";
var MAX_STORAGE_SCORE_COUNT = 6;

var GAME_UN_STARTED = {val: 1, msg: 'UNSTARTED'};
var GAME_STARTED = {val: 2, msg: 'STARTED'};
var GAME_PAUSED = {val: 3, msg: 'PAUSED'};
var GAME_OVER = {val: 4, msg: 'GAME OVER'};

var currentStatus;

var graphic;

function drawSeg(seg){
	var color = arguments[1];
	if(color == undefined)
		color = 'red';
	
	graphic.fillStyle = color;
	graphic.fillRect(seg.x * SEG_SIZE, seg.y * SEG_SIZE, SEG_SIZE, SEG_SIZE);
}

function clearSeg(seg){
	graphic.clearRect(seg.x * SEG_SIZE, seg.y * SEG_SIZE, SEG_SIZE, SEG_SIZE);
}

var segs = [{x:0, y:0}, {x:1, y:0}, {x:2, y:0}];

function drawSnake(){
	$.each(segs, function(index, seg){
		drawSeg(seg);
	});
}

function clearSnake(){
	$.each(segs, function(index, seg){
		clearSeg(seg);
	});
}

var LEFT = 37, RIGHT = 39, UP = 38, DOWN = 40;
var currentDirection = RIGHT;

function buildNextSegByDirection(seg){
	var direction = arguments[1];
	
	if(direction == undefined)
		direction = currentDirection;
	
	var nextSeg;
	switch(direction){
		case LEFT: nextSeg = {x: seg.x - 1, y: seg.y}; break;
		case RIGHT: nextSeg = {x: seg.x + 1, y: seg.y}; break;
		case UP: nextSeg = {x: seg.x, y: seg.y - 1}; break;
		case DOWN: nextSeg = {x: seg.x, y: seg.y + 1}; break;
		default: nextSeg = undefined;
	}
	
	if(nextSeg){
		if(nextSeg.x < 0) nextSeg.x = MAX_X;
		if(nextSeg.x > MAX_X) nextSeg.x = 0;
		if(nextSeg.y < 0) nextSeg.y = MAX_Y;
		if(nextSeg.y > MAX_Y) nextSeg.y = 0;
	}
	return nextSeg;
}

function getSegKey(x, y){
	return x + '_' + y;
}

var segMap;
function refreshCoordMap(){
	segMap = {};
	for(var i = 0; i < segs.length - 1; i++){
		var seg = segs[i];
		segMap[getSegKey(seg.x, seg.y)] = seg;
	}
}

var randomSeg;

function createRandomSeg(){
	var rx = Math.floor(Math.random() * MAX_X);
	var ry = Math.floor(Math.random() * MAX_Y);
	
	if(!segMap.hasOwnProperty(getSegKey(rx, ry))) {
		randomSeg = {x: rx, y: ry}; 
		drawSeg(randomSeg, 'green');
	} else {
		createRandomSeg();
	}
}

var intervalId = undefined;

function stopSnake(){
	clearInterval(intervalId);
}

var snakeDie;
var intervalTime;

function getStorageScores(){
	var scores = localStorage.getItem(SCORES_STORAGE_KEY);
	if(scores != null)
		scores = $.evalJSON(scores);
	else
		scores = [];
	
	return scores;
}

function getDateTimeString(){
	var now = new Date();
	return now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + ' ' + now.toLocaleTimeString();
}

function saveScore(){
	var scores = getStorageScores();
	
	var newScore = {time: getDateTimeString(), value: Number($score.text())};
	scores.push(newScore);
	scores.sort(function(a, b){
		return b.value - a.value;
	});
	
	if(scores.length > MAX_STORAGE_SCORE_COUNT){
		scores.splice(MAX_STORAGE_SCORE_COUNT, scores.length - MAX_STORAGE_SCORE_COUNT);
	}
	
	localStorage.setItem(SCORES_STORAGE_KEY, $.toJSON(scores));
	
	for(var i = 0; i < scores.length; i++){
		if(newScore.value == scores[i].value)
			return true;
	}
	return false;
}

function snakeFlash(count){
	var callback = arguments[1];
	
	if(count > 0){
		setTimeout(function(){
			if(this.flag == undefined)
				this.flag = true;
			else
				this.flag = !this.flag;
			
			this.flag ? clearSnake() : drawSnake();

			snakeFlash(count - 1, callback);
		}, 200);
	} else if(callback && $.isFunction(callback)){
		callback.call();
	}
}

function snakeAlive(){
	intervalId = setInterval(function(){
		var nextSeg = buildNextSegByDirection(segs[segs.length - 1]);
		
		snakeDie = segMap.hasOwnProperty(getSegKey(nextSeg.x, nextSeg.y));
		if(snakeDie) {
			stopSnake();
			
			snakeFlash(6, function(){
				refreshStatus(GAME_OVER);
				$pauseBtn.attr('disabled', true);
				
				if(saveScore()){
					alert('Congratulations! Record to be refreshed~');
					refreshScoreHistory();
				}
			});
		}
		
		clearSnake();
		
		segs.splice(0, 1);
		segs.push(nextSeg);
		
		if(nextSeg.x == randomSeg.x && nextSeg.y == randomSeg.y){
			segs.unshift(randomSeg);
			addScore();
			
			createRandomSeg();
		}
		drawSnake();
		
		refreshCoordMap();
	}, intervalTime);
}

function controlHandler(){
	$(this).keydown(function(e){
		var which = e.which;
		
		var headSeg = segs[segs.length - 1];
		var nextSeg = buildNextSegByDirection(headSeg, which);
		if(nextSeg != undefined){
			var sndSeg = segs[segs.length - 2];
			if(sndSeg.x != nextSeg.x && sndSeg.y != nextSeg.y)
				currentDirection = which;
		}
	});
}

var $canvas;

var GAME_STATUS_KEY = "game_status";

function initSnake(){
	$canvas = $('#my_canvas');
	var canvas = $canvas.get(0);
	canvas.width = WIDTH;
	canvas.height = HEIGHT;
	
	graphic = canvas.getContext('2d');
	
	var gameStatus = $.evalJSON(localStorage.getItem(GAME_STATUS_KEY));
	if(gameStatus != null){
		segs = gameStatus.segs;
		randomSeg = gameStatus.randomSeg; 
		drawSeg(randomSeg, 'green');
		
		currentDirection = gameStatus.direction;
	} 
	refreshCoordMap();
	drawSnake();
	controlHandler();
	
	if(randomSeg == undefined)
		createRandomSeg();
}

var $startBtn;
var $pauseBtn;
var $resetBtn;
var $levelSelect;
var $saveGameStatus;
var $resetGameStatus;

var LEVEL_STORAGE_KEY = "level";

function getStorageLevel(){
	return localStorage.getItem(LEVEL_STORAGE_KEY); 
}

function setStorageLevel(val){
	localStorage.setItem(LEVEL_STORAGE_KEY, val);
}

function resetGameStatusHanlder(){
	localStorage.removeItem(GAME_STATUS_KEY);
}

function initControlPanel(){
	$startBtn = $('#startBtn');
	$pauseBtn = $('#pauseBtn');
	$resetBtn = $('#resetBtn');
	$levelSelect = $('#level_select');
	$saveGameStatus = $('#save_game_status');
	$resetGameStatus = $('#reset_game_status');
	
	$startBtn.attr('disabled', true);
	$pauseBtn.attr('disabled', true);
	$levelSelect.attr('disabled', true);
	$saveGameStatus.attr('disabled', true);
	$resetGameStatus.attr('disabled', true);
	
	var storageLevel = getStorageLevel();
	if(storageLevel != null)
		$levelSelect.val(storageLevel);
	
	intervalTime = $levelSelect.val();
	
	$startBtn.click(function(){
		if(intervalId == undefined){
			snakeAlive();
			$canvas.focus();
			
			$startBtn.attr('disabled', true);
			$levelSelect.attr('disabled', true);
			$pauseBtn.attr('disabled', false);
			$saveGameStatus.attr('disabled', true);
			$resetGameStatus.attr('disabled', true);
			
			refreshStatus(GAME_STARTED);
		}
	});
	
	$pauseBtn.click(function(){
		if(!snakeDie){
			stopSnake();
			intervalId = undefined;
			
			$startBtn.attr('disabled', false);
			$levelSelect.attr('disabled', false);
			$pauseBtn.attr('disabled', true);
			$saveGameStatus.attr('disabled', false);
			$resetGameStatus.attr('disabled', false);
			
			refreshStatus(GAME_PAUSED);
		}
	});
	
	$resetBtn.click(function(){
		location.reload();
	});
	
	$levelSelect.change(function(){
		intervalTime = $levelSelect.val();
		refreshSelectedLevel();
		setStorageLevel(intervalTime);
	});
	
	$saveGameStatus.click(function(){
		localStorage.setItem(GAME_STATUS_KEY, $.toJSON({segs: segs, randomSeg: randomSeg, direction: currentDirection}));
		alert('游戏状态已保存！');
	});
	
	$resetGameStatus.click(function(){
		resetGameStatusHanlder();
		alert('游戏状态已重置！');
	});
}

var $status;
var $selectedLevel;
var $score;

function refreshSelectedLevel(){
	$selectedLevel.text($levelSelect.find('option[value=' + $levelSelect.val() + ']').text());
}

function refreshStatus(status){
	$status.text(status.msg);
	currentStatus = status;
}

function addScore(){
	$score.text(Number($score.text()) + 1);
}

var $scoreHistoryTable;

function refreshScoreHistory(){
	$scoreHistoryTable.children().remove();
	var scores = getStorageScores();
	console.log(scores);
	if($.isArray(scores) && scores.length > 0){
		$scoreHistoryTable.append('<tr><th>SN</th><th>TIME</th><th>SCORE</th></tr>');
		$.each(scores, function(index, score){
			$scoreHistoryTable.append('<tr><td class="sn">' + (index + 1) + '</td>'
					+ '<td class="time">' + score.time + '</td><td class="value last">' + score.value + '</td></tr>');	
		});
	}
}

function initMessage(){
	$status = $('#status');
	$selectedLevel = $('#selected_level');
	$score = $('#score');
	$scoreHistoryTable = $('#score_history');
	
	refreshStatus(GAME_UN_STARTED);
	refreshSelectedLevel();
	$score.text('0');
	
	refreshScoreHistory();
}

$(function(){
	initSnake();
	
	initControlPanel();
	
	initMessage();
	
	snakeFlash(6, function(){
		$startBtn.attr('disabled', false);
		$levelSelect.attr('disabled', false);
		$saveGameStatus.attr('disabled', false);
		$resetGameStatus.attr('disabled', false);
	});
});