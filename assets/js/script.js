'use strict';

import { wordBank } from './words.js';
import { listen, select } from './utils.js';

const dialog = select('dialog');
const frontModal = select('.modal-front');
const backModal = select('.modal-back');
const startButton = select('.start-button');
const countdownStart = select('.countdown-start');
const typingGame = select('.typing-game');
const gameButtons = select('.game-buttons');
const timer = select('.timer');
const playAgain = select('.play-again-button');
const viewScores = select('.view-scores-button');
const wordInput = select('.word-input');
const wordCount = select('.word-count span');
const gameResult = select('.game-result');
const gameDate = select('.game-date');
const gameScore = select('.game-score');
const toggleSidebar = select('.toggle-sidebar');
const highScoreSidebar = select('.high-scores');
const backgroundMusic = select('.game-music');
const buttonSound = select('.button-sound');

const MAX_HIGH_SCORES = 20;
let currentWordIndex = 0;
let correctWordCount = 0;
let countdownInterval;
let timerInterval;
let remainingSeconds;

function today(date) {
  return date instanceof Date ? date : new Date();
}

function generateHighScore(hits, percentage, date) {
  return { hits, percentage, date: today(date) };
}

function getHighScores() {
  const highScoresJSON = localStorage.getItem('highScores');
  return highScoresJSON ? JSON.parse(highScoresJSON) : [];
}

function saveHighScores(highScores, score) {
  const existingScoreIndex = highScores.findIndex(existingScore => 
    existingScore.hits === score.hits && existingScore.percentage === score.percentage
  );
  if (existingScoreIndex !== -1) {
    highScores[existingScoreIndex] = score;
  } else {
    highScores.push(score);
  }

  highScores.sort((a, b) => scoreCheck(b, 'hits', 0) - scoreCheck(a, 'hits', 0));
  highScores.splice(MAX_HIGH_SCORES);
  localStorage.setItem('highScores', JSON.stringify(highScores));
}

function displayHighScores() {
  const highScoresDiv = select('.high-scores ul');
  const highScores = getHighScores();
  let filteredScores = [];

  highScoresDiv.innerHTML = '';
  filteredScores = highScores.filter(score => score && score.hits > 0);

  if (filteredScores.length > 0) {
    const topScores = filteredScores
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10);

    for (let i = 0; i < topScores.length; i++) {
      const score = topScores[i];
      const listItem = document.createElement('li');
      listItem.textContent = `${formatDate(score.date)}: ${score.hits} hits (${score.percentage.toFixed(2)}%)`;
      highScoresDiv.appendChild(listItem);
    }
  } else {
    const noScoresMessage = document.createElement('li');
    noScoresMessage.textContent = 'No games played';
    highScoresDiv.appendChild(noScoresMessage);
  }

  const highScoreSidebar = select('.high-scores');
  highScoreSidebar.style.display = highScoreSidebar.classList.contains('open') ? 'block' : 'none';
}

function showBackDialog() {
  frontModal.classList.add('hidden');
  backModal.classList.remove('hidden');
  startModalCountdown();
}

function startModalCountdown() {
  let count = 3;
  countdownStart.textContent = count;

  countdownInterval = setInterval(() => {
    count--;

    if (count > 0) {
      countdownStart.textContent = count;
    } else if (count === 0) {
      countdownStart.textContent = 'GO!';
    } else {
      clearInterval(countdownInterval);
      dialog.close();
      startGame();
    }
  }, 1000);
}

function updateTimer() {
  remainingSeconds--;

  if (remainingSeconds >= 0) {
    timer.textContent = remainingSeconds;

  } else {
    clearInterval(timerInterval);
    endGame();
  }
}

function startGameTimer() {
  remainingSeconds = 20;
  timer.textContent = remainingSeconds;
  wordInput.focus();
  if (backgroundMusic.paused) {
    backgroundMusic.currentTime = 0;
    backgroundMusic.volume = 0.4;
    backgroundMusic.play();
  }
  timerInterval = setInterval(updateTimer, 1000);
}

function scoreCheck(obj, prop, defaultValue = null) {
  return obj && obj[prop] !== undefined && obj[prop] !== null ? obj[prop] : defaultValue;
}

function startGame() {
  currentWordIndex = 0;
  correctWordCount = 0;
  wordCount.textContent = correctWordCount;
  playAgain.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Reset';
  gameButtons.style.justifyContent = 'center';
  viewScores.style.display = 'none';
  gameResult.style.display = 'none';
  wordInput.removeAttribute('disabled');
  wordInput.focus();

  clearInterval(timerInterval);
  displayCurrentWord();
  displayInput();
  startGameTimer();
}

function displayCurrentWord() {
  const wordOutput = select('.typing-word');
  const shuffledWords = shuffleArray(wordBank);

  wordOutput.textContent = shuffledWords[currentWordIndex];
}

function shuffleArray(array) {
  let currentIndex = array.length, randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

function displayInput() {
  wordInput.focus();
}

function checkUserInput() {
  const userInput = wordInput.value.toLowerCase().trim();
  const currentWord = wordBank[currentWordIndex].toLowerCase();

  if (userInput === currentWord) {
    correctWordCount++;
    buttonSound.play();
    if (currentWordIndex < wordBank.length - 1) {
      currentWordIndex++;
    } else {
      endGame();
      return;
    }

    displayCurrentWord();

    wordInput.value = '';
    wordCount.textContent = correctWordCount;
  }
}

function endGame() {
  clearInterval(countdownInterval);
  backgroundMusic.pause();
  playAgain.innerHTML = ' <i class="fa-solid fa-rotate-left"></i> Play again';
  viewScores.style.display = 'inline-block';
  wordInput.value = '';
  const hits = correctWordCount;
  const percentage = (hits / wordBank.length) * 100;

  if (hits > 0) {
    const score = generateHighScore(hits, percentage, new Date());

    const highScores = getHighScores();
    highScores.push(score);
      highScores.sort((a, b) => scoreCheck(a, 'percentage', 0) - scoreCheck(b, 'percentage', 0));
    saveHighScores(highScores, score);
    wordInput.setAttribute('disabled', true);
    showEndGame(score);
  } else {
    showEndGame();
  }
}

function showEndGame(score) {
  gameResult.classList.remove('hidden');
  typingGame.classList.add('hidden');
  gameResult.style.display = 'flex';
  gameButtons.style.justifyContent = 'space-between';

  if (score) {
    gameDate.textContent = formatDate(score.date ? score.date : today());
    gameScore.textContent = `${score.hits} hits (${score.percentage.toFixed(2)}%)`;
  } else {
    gameDate.textContent = formatDate(today());
    gameScore.textContent = 'No score';
  }
}


function formatDate(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }

  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

toggleSidebar.addEventListener('click', () => {
  highScoreSidebar.classList.toggle('open');
  updateToggle();
});

function updateToggle() {
  const sidebarIsOpen = highScoreSidebar.classList.contains('open');
  toggleSidebar.style.left = sidebarIsOpen ? '290px' : '25px';
  toggleSidebar.classList.toggle('fa-circle-chevron-right', !sidebarIsOpen);
  toggleSidebar.classList.toggle('fa-circle-chevron-left', sidebarIsOpen);
  toggleSidebar.style.color = sidebarIsOpen ? '#61cce5' : '#61cce5';
}


function openSideBar() {
  highScoreSidebar.classList.add('open');
  updateToggle();
  displayHighScores();
}

function closeSideBar() {
  highScoreSidebar.classList.remove('open');
  updateToggle();
}

// Event listeners
listen('click', playAgain, () => {
  clearInterval(countdownInterval);
  clearInterval(timerInterval);

  countdownStart.textContent = '';
  timer.textContent = '';
  timer.style.backgroundColor = '';


  frontModal.classList.add('hidden');
  backModal.classList.remove('hidden');
  gameResult.classList.add('hidden');
  typingGame.classList.add('hidden');

  dialog.showModal();
  startModalCountdown();
  closeSideBar();
});


listen('click', document, () => wordInput.focus());
listen('click', startButton, showBackDialog);
listen('click', viewScores, () => {
  const sidebarIsOpen = highScoreSidebar.classList.contains('open');
  if (sidebarIsOpen) {
    closeSideBar();
  } else {
    openSideBar();
  }
});

listen('input', wordInput, checkUserInput);

setTimeout(() => {
  dialog.showModal();
}, 100);