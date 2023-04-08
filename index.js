// Global Variables
var winningWord = '';
var currentRow = 1;
var guess = '';
// var gamesPlayed = [];
// var words = [];
var nextIndex;
var lastGame = {}

// Query Selectors
var inputs = document.querySelectorAll('input');
var guessButton = document.querySelector('#guess-button');
var keyLetters = document.querySelectorAll('span');
var errorMessage = document.querySelector('#error-message');
var viewRulesButton = document.querySelector('#rules-button');
var viewGameButton = document.querySelector('#play-button');
var viewStatsButton = document.querySelector('#stats-button');
var gameBoard = document.querySelector('#game-section');
var letterKey = document.querySelector('#key-section');
var rules = document.querySelector('#rules-section');
var stats = document.querySelector('#stats-section');
var gameOverBox = document.querySelector('#game-over-section');
var gameOverGuessCount = document.querySelector('#game-over-guesses-count');
var gameOverGuessGrammar = document.querySelector('#game-over-guesses-plural');
var gameOverMessage = document.querySelector('#game-over-message');
var winningDisplay = document.querySelector('#game-done')
var totalGames = document.querySelector('#stats-total-games')
var percentGamesWon = document.querySelector('#stats-percent-correct')
var averageGuessCount = document.querySelector('#stats-average-guesses')

// Event Listeners
window.addEventListener('load', setGame);

inputs.forEach((input) => input.addEventListener('keyup', function() { moveToNextInput(event) }));

keyLetters.forEach((key) => key.addEventListener('click', function() { clickLetter(event) }));

guessButton.addEventListener('click', submitGuess);

viewRulesButton.addEventListener('click', viewRules);

viewGameButton.addEventListener('click', viewGame);

viewStatsButton.addEventListener('click', viewStats);

// Functions
function setGame() {
  currentRow = 1;
  winningWord = getRandomWord();
  updateInputPermissions();
}

function getRandomWord() {
  fetch("http://localhost:3001/api/v1/words")
    .then(res => res.json())
    .then(data => {
      getGameData()
      words = data;
      let randInd = Math.floor(Math.random() * data.length);
      winningWord = data[randInd]
    })
}

function postGameData() {
  fetch('http://localhost:3001/api/v1/games', {
    method: 'POST',
    body: JSON.stringify(
      lastGame
    ),
    headers: {
  	  'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(json => console.log(json))
  .catch(err => "Did not send");
}

function getGameData() {
  fetch('http://localhost:3001/api/v1/games')
  .then(res => res.json())
  .then(data => {
    let gamesWon = data.filter(game => game.solved);
    let sumOfGuesses = data.reduce((acc, guess) => {
      acc += guess.numGuesses;
      return acc;
    }, 0);
  
    totalGames.innerText = `${data.length}`;
    percentGamesWon.innerText = `${Math.floor((gamesWon.length / data.length) * 100)}`;
    averageGuessCount.innerText = `${Math.ceil(sumOfGuesses / data.length)}`;
  });
}

function updateInputPermissions() {
  
    inputs.forEach(input => {
      if(!input.id.includes(`-${currentRow}-`)) {
      input.disabled = true;
      } else {
      input.disabled = false;
      }
    });

  inputs[0].focus();
}

function moveToNextInput(e) {
  var key = e.keyCode || e.charCode;
  if( key >= 65 && key <= 90 || key === 39) {
    nextIndex = parseInt(e.target.id.split('-')[2]) + 1;
    inputs[nextIndex].focus();
  } else if (key === 8 || key === 37) {
    var indexOfPrev = parseInt(e.target.id.split('-')[2]) - 1;
    inputs[indexOfPrev].focus();
  }
}

function clickLetter(e) {
  var activeInput = null;
  var activeIndex = null;

  inputs.forEach((input, index) => {
    if(input.id.includes(`-${currentRow}-`) && !input.value && !activeInput) {
      activeInput = input;
      activeIndex = index;
    }
  });

  activeInput.value = e.target.innerText;
  inputs[activeIndex + 1].focus();
}

function submitGuess() {
  if (checkIsWord()) {
    errorMessage.innerText = '';
    compareGuess();
    if (checkForWin()) {
      setTimeout(declareWinner, 1000);
    } else if (!checkForWin() && currentRow === 6) {
      setTimeout(declareWinner, 1000)
      setTimeout(resetText, 5000)
    } else {
      changeRow();
    }
  } else {
    errorMessage.innerText = 'Not a valid word. Try again!';
  }

  inputs[nextIndex].focus();
}

function checkIsWord() {
  guess = '';

  inputs.forEach(input => {
    if(input.id.includes(`-${currentRow}-`)) {
      guess += input.value;
    }
  });

  return words.includes(guess);
}

function compareGuess() {
  var guessLetters = guess.split('');

  guessLetters.forEach((letter, index) => {
    if (winningWord.includes(letter) && winningWord.split('')[index] !== letter) {
      updateBoxColor(index, 'wrong-location');
      updateKeyColor(letter, 'wrong-location-key');
    } else if (winningWord.split('')[index] === letter) {
      updateBoxColor(index, 'correct-location');
      updateKeyColor(letter, 'correct-location-key');
    } else {
      updateBoxColor(index, 'wrong');
      updateKeyColor(letter, 'wrong-key');
    }
  });
}

function updateBoxColor(letterLocation, className) {
  var row = [];

  inputs.forEach(input => {
    if(input.id.includes(`-${currentRow}-`)) {
      row.push(input);
    }
  });

  row[letterLocation].classList.add(className);
}

function updateKeyColor(letter, className) {
  var keyLetter = null;

  keyLetters.forEach(key => {
    if (key.innerText === letter) {
      keyLetter = key;
    }
  });

  keyLetter.classList.add(className);
}

function checkForWin() {
  return guess === winningWord;
}

function changeRow() {
  currentRow++;
  updateInputPermissions();
}

function declareWinner() {
  recordGameStats();
  changeGameOverText();
  viewGameOverMessage();
  setTimeout(startNewGame, 4000);
}

function resetText() {
  gameOverMessage.innerText = "Yay!"
  winningDisplay.classList.remove('collapsed')
}

function recordGameStats() {
  if (checkForWin()) {
    lastGame = { solved: true, guesses: currentRow }
  } else {
    lastGame = { solved: false, guesses: currentRow }
  }

  postGameData()
}

function changeGameOverText() {
  gameOverGuessCount.innerText = currentRow;

  if (!checkForWin()) {
    gameOverMessage.innerText = "You lost"
    winningDisplay.classList.add('collapsed')
  } else if (currentRow < 2) {
    gameOverGuessGrammar.classList.add('collapsed');
  } else {
    gameOverGuessGrammar.classList.remove('collapsed');
  }
}

function startNewGame() {
  clearGameBoard();
  clearKey();
  setGame();
  viewGame();
  inputs[0].focus();
}

function clearGameBoard() {
  inputs.forEach(input => {
    input.value = '';
    input.classList.remove('correct-location', 'wrong-location', 'wrong');
  });
}

function clearKey() {
  keyLetters.forEach(key => key.classList.remove('correct-location-key', 'wrong-location-key', 'wrong-key'));
}

// Change Page View Functions

function viewRules() {
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
  rules.classList.remove('collapsed');
  stats.classList.add('collapsed');
  viewGameButton.classList.remove('active');
  viewRulesButton.classList.add('active');
  viewStatsButton.classList.remove('active');
}

function viewGame() {
  letterKey.classList.remove('hidden');
  gameBoard.classList.remove('collapsed');
  rules.classList.add('collapsed');
  stats.classList.add('collapsed');
  gameOverBox.classList.add('collapsed')
  viewGameButton.classList.add('active');
  viewRulesButton.classList.remove('active');
  viewStatsButton.classList.remove('active');
}

function viewStats() {
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
  rules.classList.add('collapsed');
  stats.classList.remove('collapsed');
  viewGameButton.classList.remove('active');
  viewRulesButton.classList.remove('active');
  viewStatsButton.classList.add('active');
}

function viewGameOverMessage() {
  gameOverBox.classList.remove('collapsed')
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
}
