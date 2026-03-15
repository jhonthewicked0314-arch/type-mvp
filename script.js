// script.js

// --- 1. SUPABASE CONNECTION ---
const supabaseUrl = 'https://kolayolotgsejhwrsbyq.supabase.co';
const supabaseKey = 'sb_publishable_0g_gJHK8gJka59sAeJc7aw_1SQ58e0p';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- 2. DOM ELEMENTS ---
// Declared globally, assigned inside DOMContentLoaded
let wordsDisplay;
let hiddenInput;
let timerDisplay;
let wpmDisplay;
let historyList;
let restartBtn;
let userTag;
let mainTestSection; // NEW: Declare mainTestSection here

// --- 3. GAME VARIABLES ---
const testTime = 30;
let timeLeft = testTime;
let timerInterval = null;
let isPlaying = false;

// Our dictionary of words
const wordsList = ["the", "be", "to", "of", "and", "a", "in", "that", "have", "I", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me"];

let currentText = "";

// --- ANONYMOUS IDENTITY ---
let userId = localStorage.getItem('type_user_id');
if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('type_user_id', userId);
}

// --- 4. INITIALIZATION & RESTART LOGIC (Main Test) ---
function setupGame() {
    clearInterval(timerInterval);
    timeLeft = testTime;
    isPlaying = false;
    hiddenInput.disabled = false;
    hiddenInput.value = '';
    wordsDisplay.innerHTML = '';
    timerDisplay.innerText = timeLeft;
    wpmDisplay.innerText = 0;

    let randomWordsArray = [];
    for (let i = 0; i < 30; i++) {
        const randomIndex = Math.floor(Math.random() * wordsList.length);
        randomWordsArray.push(wordsList[randomIndex]);
    }
    currentText = randomWordsArray.join(' ');

    currentText.split('').forEach(char => {
        const span = document.createElement('span');
        span.innerText = char;
        wordsDisplay.appendChild(span);
    });

    hiddenInput.focus();
}

// --- 5. THE TYPING LOGIC (Main Test) ---
function handleInputLogic() {
    if (!isPlaying) {
        startTimer();
        isPlaying = true;
    }

    const spans = wordsDisplay.querySelectorAll('span');
    const typedArray = hiddenInput.value.split('');

    let correctCount = 0;

    spans.forEach((span, index) => {
        const typedChar = typedArray[index];
        if (typedChar == null) {
            span.classList.remove('correct', 'incorrect');
        } else if (typedChar === span.innerText) {
            span.classList.add('correct');
            span.classList.remove('incorrect');
            correctCount++;
        } else {
            span.classList.add('incorrect');
            span.classList.remove('correct');
        }
    });

    if (typedArray.length === spans.length) endGame();
}


// --- 6. THE TIMER LOGIC (Main Test) ---
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft === 0) endGame();
    }, 1000);
}

// --- 7. ENDING THE GAME & DATABASE LOGIC (Main Test) ---
async function endGame() {
    clearInterval(timerInterval);
    hiddenInput.disabled = true;

    const correctChars = wordsDisplay.querySelectorAll('.correct').length;
    const totalTyped = hiddenInput.value.split('').length;

    let wpm = 0;
    let accuracy = 0;

    if (totalTyped > 0) {
        const timeSpentMinutes = (testTime - timeLeft) / 60;
        if (timeSpentMinutes > 0) {
            wpm = Math.round((correctChars / 5) / timeSpentMinutes);
        }
        accuracy = Math.round((correctChars / totalTyped) * 100);
    }

    wpmDisplay.innerText = wpm;

    await saveScore(wpm, accuracy);
    await loadHistory();
}

// --- 8. DATABASE FUNCTIONS ---
async function saveScore(wpm, accuracy) {
    const { error } = await supabaseClient
        .from('user_history')
        .insert([{ user_id: userId, wpm: wpm, accuracy: accuracy }]);
    if (error) console.error("Error saving to database:", error);
}

async function loadHistory() {
    const { data, error } = await supabaseClient
        .from('user_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error loading history:", error);
        return;
    }

    historyList.innerHTML = '';
    if (data.length === 0) {
        historyList.innerHTML = '<li>No history yet. Take a test!</li>';
        return;
    }

    data.forEach(row => {
        const li = document.createElement('li');
        const dateString = new Date(row.created_at).toLocaleDateString();
        li.innerText = `${row.wpm} WPM | ${row.accuracy}% Acc | ${dateString}`;
        historyList.appendChild(li);
    });
}


// --- MAIN SCRIPT EXECUTION - ENSURE DOM IS LOADED ---
document.addEventListener('DOMContentLoaded', () => {
    // --- 2. DOM ELEMENTS (DEFINED AFTER DOM IS READY) ---
    wordsDisplay = document.getElementById('words-display');
    hiddenInput = document.getElementById('hidden-input');
    timerDisplay = document.getElementById('timer');
    wpmDisplay = document.getElementById('wpm');
    historyList = document.getElementById('history-list');
    restartBtn = document.getElementById('restart-btn');
    userTag = document.getElementById('user-tag');
    mainTestSection = document.getElementById('main-test-section'); // NEW: Assign here

    // Set User ID tag
    userTag.innerText = "User ID: " + userId;

    // --- EVENT LISTENERS (ATTACHED AFTER DOM IS READY) ---
    // Force focus on the hidden input anytime you click the main test section
    mainTestSection.addEventListener('click', () => { // Use the assigned variable
        hiddenInput.focus();
    });

    // Listen for the main test restart button click
    restartBtn.addEventListener('click', () => {
        setupGame();
    });

    // The main test typing input listener
    hiddenInput.addEventListener('input', handleInputLogic);

    // Start everything initially for the main test
    setupGame();
    loadHistory();
});