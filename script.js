// script.js

// --- 1. SUPABASE CONNECTION ---
const supabaseUrl = 'https://kolayolotgsejhwrsbyq.supabase.co';
const supabaseKey = 'sb_publishable_0g_gJHK8gJka59sAeJc7aw_1SQ58e0p';


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
// --- 3. GAME VARIABLES ---
let testTime = 30; // Changed from const to let so we can modify it
let timeLeft = testTime;
let timerInterval = null;
let isPlaying = false;
let isSoundOn = false; // NEW: Sound state
let isTabPressed = false; // NEW: Shortcut state

// --- WEB AUDIO API (SYNTH SOUNDS) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playClick() {
    if (!isSoundOn) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function playError() {
    if (!isSoundOn) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

// Our dictionary of words
const wordsList = ["the", "be", "to", "of", "and", "a", "in", "that", "have", "I", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me"];

let currentText = "";

// --- ANONYMOUS IDENTITY ---
let userId = localStorage.getItem('type_user_id');
if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('type_user_id', userId);
}

let wpmChartInstance = null; // NEW: Holds our chart so we can update it

let currentTestErrors = {}; // Tracks mistakes in the current test
let unlockedAchievementIds = []; // Stores what you've already won

// The 6 Starter Achievements
const ACHIEVEMENTS = [
    { id: 'first_steps', title: 'First Steps', desc: 'Complete your first test.' },
    { id: 'speed_demon', title: 'Speed Demon', desc: 'Reach 80+ WPM.' },
    { id: 'perfectionist', title: 'Perfectionist', desc: 'Get 100% accuracy.' },
    { id: 'marathon', title: 'Marathon', desc: 'Complete a 120s test.' },
    { id: 'night_owl', title: 'Night Owl', desc: 'Type in dark mode.' },
    { id: 'flash', title: 'The Flash', desc: 'Reach 100+ WPM.' }
];
let lastCompletedTestErrors = {}; // NEW: Remembers your last test even if you click away
let previousInputLength = 0; // NEW: Helps us stop duplicate counting


// --- 4. INITIALIZATION & RESTART LOGIC (Main Test) ---
function setupGame() {
    clearInterval(timerInterval);
    timeLeft = testTime;
    isPlaying = false;
    currentTestErrors = {};
    previousInputLength = 0;

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
    const currentLength = typedArray.length;

    // NEW: ACCURATE ERROR TRACKING & SOUNDS
    // Only count if they typed a new character (ignores backspace)
    if (currentLength > previousInputLength) {
        const currentIndex = currentLength - 1;
        const typedChar = typedArray[currentIndex];
        const expectedChar = spans[currentIndex]?.innerText;

        if (typedChar !== expectedChar && expectedChar) {
            // It's a mistake! Count it exactly ONCE.
            const lowerExpected = expectedChar.toLowerCase();
            if (lowerExpected.match(/[a-z]/)) {
                currentTestErrors[lowerExpected] = (currentTestErrors[lowerExpected] || 0) + 1;
            }
            if (typeof playError === 'function') playError();
        } else {
            // It's correct!
            if (typeof playClick === 'function') playClick();
        }
    }
    previousInputLength = currentLength; // Update the tracker

    // VISUAL COLOR UPDATE (This stays in the loop)
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
// --- 6. THE TIMER LOGIC (Main Test) ---
function startTimer() {
    const timerBar = document.getElementById('timer-bar');
    timerBar.className = ''; // Reset colors

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;

        // Timer Bar Math & Colors
        const percentage = (timeLeft / testTime) * 100;
        timerBar.style.width = `${percentage}%`;

        if (timeLeft <= 20 && timeLeft > 10) {
            timerBar.className = 'warning'; // Turns yellow
        } else if (timeLeft <= 10) {
            timerBar.className = 'danger'; // Turns red
        }

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

    // 1. Save standard score
    await saveScore(wpm, accuracy);

    // 2. Save Heatmap errors (if any)
    if (Object.keys(currentTestErrors).length > 0) {
        await fetch(`${supabaseUrl}/rest/v1/user_heatmap`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ user_id: userId, missed_keys: currentTestErrors })
        });
    }

    // 3. Check for Achievements
    await checkAchievements(wpm, accuracy);

    // 4. Reload UI
    await loadHistory();
    // Save a permanent backup of this test's errors before generating the heatmap
    lastCompletedTestErrors = { ...currentTestErrors };
    await loadAwardsAndHeatmap(lastCompletedTestErrors);

}

// --- 8. DATABASE FUNCTIONS ---
async function saveScore(wpm, accuracy) {
    const response = await fetch(`${supabaseUrl}/rest/v1/user_history`, {
        method: 'POST',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ user_id: userId, wpm: wpm, accuracy: accuracy })
    });
    if (!response.ok) console.error("Error saving to database:", await response.text());
}

// --- GAMIFICATION FUNCTIONS ---

function showToast(title) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `🏆 Achievement Unlocked: <br/><strong>${title}</strong>`;
    if (isSoundOn) playClick(); // Happy chime!
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

async function checkAchievements(wpm, accuracy) {
    const newUnlocks = [];

    // Evaluate rules
    if (!unlockedAchievementIds.includes('first_steps')) newUnlocks.push('first_steps');
    if (wpm >= 80 && !unlockedAchievementIds.includes('speed_demon')) newUnlocks.push('speed_demon');
    if (wpm >= 100 && !unlockedAchievementIds.includes('flash')) newUnlocks.push('flash');
    if (accuracy === 100 && wpm > 0 && !unlockedAchievementIds.includes('perfectionist')) newUnlocks.push('perfectionist');
    if (testTime === 120 && !unlockedAchievementIds.includes('marathon')) newUnlocks.push('marathon');
    if (!document.body.classList.contains('light-theme') && !unlockedAchievementIds.includes('night_owl')) newUnlocks.push('night_owl');

    // Save & Notify
    for (const id of newUnlocks) {
        unlockedAchievementIds.push(id);
        const achievement = ACHIEVEMENTS.find(a => a.id === id);
        showToast(achievement.title);

        await fetch(`${supabaseUrl}/rest/v1/user_achievements`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ user_id: userId, achievement_id: id })
        });
    }
}
// 1. Map every key to a specific human finger
const FINGER_MAP = {
    'q': 'Left Pinky', 'a': 'Left Pinky', 'z': 'Left Pinky',
    'w': 'Left Ring', 's': 'Left Ring', 'x': 'Left Ring',
    'e': 'Left Middle', 'd': 'Left Middle', 'c': 'Left Middle',
    'r': 'Left Index', 'f': 'Left Index', 'v': 'Left Index', 't': 'Left Index', 'g': 'Left Index', 'b': 'Left Index',
    'y': 'Right Index', 'h': 'Right Index', 'n': 'Right Index', 'u': 'Right Index', 'j': 'Right Index', 'm': 'Right Index',
    'i': 'Right Middle', 'k': 'Right Middle',
    'o': 'Right Ring', 'l': 'Right Ring',
    'p': 'Right Pinky'
};

// 2. Map fingers to your specific Lessons from lessons.js
const FINGER_LESSON_MAP = {
    'Left Pinky': 1, 'Left Ring': 1, 'Left Middle': 1, 'Left Index': 1, // Lesson 1: ASDF
    'Right Index': 2, 'Right Middle': 2, 'Right Ring': 2, 'Right Pinky': 2 // Lesson 2: JKL;
};
// Add 'lastTestErrors' as an argument here!
async function loadAwardsAndHeatmap(lastTestErrors = {}) {
    // 1. Load Achievements (Antigravity's fetch code is fine here!)
    try {
        const response = await fetch(`https://kolayolotgsejhwrsbyq.supabase.co/rest/v1/user_achievements?select=achievement_id&user_id=eq.${userId}`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const achData = await response.json();
        if (achData && achData.length > 0) {
            unlockedAchievementIds = achData.map(a => a.achievement_id);
        }
    } catch (e) { console.error("Achievement load error", e); }

    const grid = document.getElementById('achievements-grid');
    grid.innerHTML = '';
    ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = unlockedAchievementIds.includes(ach.id);
        grid.innerHTML += `
            <div class="badge ${isUnlocked ? 'unlocked' : ''}">
                <h4>${ach.title}</h4>
                <p>${ach.desc}</p>
            </div>
        `;
    });

    // 2. HEATMAP MATH (Using local memory, completely bypasses database errors!)
    let fingerErrors = {
        'Left Pinky': 0, 'Left Ring': 0, 'Left Middle': 0, 'Left Index': 0,
        'Right Index': 0, 'Right Middle': 0, 'Right Ring': 0, 'Right Pinky': 0
    };

    let totalMistakesInLastTest = 0;

    // Safely parse the memory object
    if (typeof lastTestErrors === 'string') lastTestErrors = JSON.parse(lastTestErrors);

    for (const [key, count] of Object.entries(lastTestErrors)) {
        totalMistakesInLastTest += parseInt(count); // Force it to be a number
        if (FINGER_MAP[key]) {
            fingerErrors[FINGER_MAP[key]] += parseInt(count);
        }
    }

    // 3. Render A-Z Keyboard
    const kbContainer = document.getElementById('keyboard-heatmap');
    kbContainer.innerHTML = '';
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

    alphabet.forEach(letter => {
        const errCount = lastTestErrors[letter] || 0;
        let colorClass = 'good';
        if (errCount >= 3) colorClass = 'danger';
        else if (errCount >= 1) colorClass = 'warning';

        kbContainer.innerHTML += `<div class="key-box ${colorClass}" title="Missed ${errCount} times in last test">${letter}</div>`;
    });

    // 4. Biomechanics Analysis Engine
    const diagnosticPanel = document.getElementById('diagnostic-panel');
    const perfectPanel = document.getElementById('perfect-test-panel');

    let weakestFinger = "Left Index"; // Safe default so it NEVER says 'null'
    let maxErrors = 0;

    for (const [finger, errors] of Object.entries(fingerErrors)) {
        if (errors > maxErrors) {
            maxErrors = errors;
            weakestFinger = finger;
        }
    }

    // Toggle Panels based on performance
    if (totalMistakesInLastTest === 0) {
        diagnosticPanel.style.display = 'none';
        perfectPanel.style.display = 'block';
    } else {
        perfectPanel.style.display = 'none';
        diagnosticPanel.style.display = 'block';

        document.getElementById('weakest-finger-name').innerText = weakestFinger;
        document.getElementById('weakest-finger-stats').innerText = `You missed keys with your ${weakestFinger} ${maxErrors} times in the last test.`;

        const recommendedLessonId = FINGER_LESSON_MAP[weakestFinger] || 1;
        const btn = document.getElementById('recommended-lesson-btn');

        // Clone button to reset clicks
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.innerText = `Practice ${weakestFinger} (Lesson ${recommendedLessonId})`;
        newBtn.addEventListener('click', () => {
            document.getElementById('awards-section').style.display = 'none';
            document.getElementById('lessons-section').style.display = 'block';
            document.getElementById('lessons-menu-display').style.display = 'none';

            if (typeof startLesson === 'function') startLesson(recommendedLessonId);
        });
    }
}
// --- 8. DATABASE & CHART FUNCTIONS ---
async function loadHistory() {
    // 1. Fetch the last 20 scores instead of 5
    const response = await fetch(`${supabaseUrl}/rest/v1/user_history?user_id=eq.${userId}&order=created_at.desc&limit=20`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });

    if (!response.ok) {
        console.error("Error loading history:", await response.text());
        return;
    }
    const data = await response.json();

    historyList.innerHTML = '';
    if (data.length === 0) {
        historyList.innerHTML = '<li>No history yet. Take a test!</li>';
        return;
    }

    // 2. Update the Text List (We still only show the top 5 here so it doesn't get too long)
    const recentFive = data.slice(0, 5);
    recentFive.forEach(row => {
        const li = document.createElement('li');
        const dateString = new Date(row.created_at).toLocaleDateString();
        li.innerText = `${row.wpm} WPM | ${row.accuracy}% Acc | ${dateString}`;
        historyList.appendChild(li);
    });

    // 3. Update the Chart (We use all 20 results)
    // Supabase returns newest first. For a left-to-right chart, we must reverse the array.
    const chartData = [...data].reverse();

    // Create an array for the X-axis (e.g., "1, 2, 3...") and Y-axis (WPM scores)
    const labels = chartData.map((row, index) => `Test ${index + 1}`);
    const wpmValues = chartData.map(row => row.wpm);

    renderChart(labels, wpmValues);
}

// NEW: Render the Chart.js Graph
function renderChart(labels, wpmData) {
    const ctx = document.getElementById('wpmChart').getContext('2d');

    // Check if we are in light or dark mode to set the grid/text colors
    const isLight = document.body.classList.contains('light-theme');
    const gridColor = isLight ? '#ddd' : '#444';
    const textColor = isLight ? '#333' : '#d1d0c5';

    // If the chart already exists, just update the data (don't redraw the whole thing)
    if (wpmChartInstance) {
        wpmChartInstance.data.labels = labels;
        wpmChartInstance.data.datasets[0].data = wpmData;

        wpmChartInstance.options.scales.x.grid.color = gridColor;
        wpmChartInstance.options.scales.y.grid.color = gridColor;
        wpmChartInstance.options.scales.x.ticks.color = textColor;
        wpmChartInstance.options.scales.y.ticks.color = textColor;

        wpmChartInstance.update();
    } else {
        // If it doesn't exist yet, create it!
        wpmChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'WPM',
                    data: wpmData,
                    borderColor: '#e2b714', // Our accent yellow
                    backgroundColor: 'rgba(226, 183, 20, 0.2)', // Faded yellow fill
                    borderWidth: 2,
                    tension: 0.3, // Makes the line curved instead of jagged
                    fill: true,
                    pointBackgroundColor: '#e2b714'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }, // Hides the top label
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    }
                }
            }
        });
    }
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

    // --- NEW DEPLOYMENT 1 EVENT LISTENERS ---

    // 1. Theme Toggle
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-theme');
        themeToggleBtn.innerText = '🌙';
    }
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        if (document.body.classList.contains('light-theme')) {
            localStorage.setItem('theme', 'light');
            themeToggleBtn.innerText = '🌙';
        } else {
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.innerText = '☀️';
        }
        // NEW: Update chart colors when theme changes
        if (wpmChartInstance) loadHistory();
    });

    // 2. Sound Toggle
    const soundToggleBtn = document.getElementById('sound-toggle');
    soundToggleBtn.addEventListener('click', () => {
        isSoundOn = !isSoundOn;
        soundToggleBtn.innerText = isSoundOn ? '🔊' : '🔇';
    });

    // 3. Time Selectors
    const timeBtns = document.querySelectorAll('.time-btn');
    timeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            timeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            testTime = parseInt(e.target.getAttribute('data-time'));
            setupGame(); // Instantly restart with new time
            document.getElementById('timer-bar').style.width = '100%';
            document.getElementById('timer-bar').className = '';
        });
    });

    // 4. Tab + Enter Shortcut
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            isTabPressed = true;
            e.preventDefault(); // Stops tab from highlighting random buttons
        }
        if (e.key === 'Enter' && isTabPressed) {
            if (mainTestSection.style.display !== 'none') setupGame();
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Tab') isTabPressed = false;
    });

    // Inside DOMContentLoaded: Grab elements
    const navAwards = document.getElementById('nav-awards');
    const awardsSection = document.getElementById('awards-section');

    // Inside DOMContentLoaded: Setup Nav logic
    navAwards.addEventListener('click', (e) => {
        e.preventDefault();
        mainTestSection.style.display = 'none';
        if (typeof lessonsSection !== 'undefined') lessonsSection.style.display = 'none';
        awardsSection.style.display = 'block';

        // Pass the backup memory here! Now it won't disappear!
        loadAwardsAndHeatmap(lastCompletedTestErrors);
    });

    // *Important:* Go to your navMainTest click listener and add:
    // awardsSection.style.display = 'none';



    // Start everything initially for the main test
    setupGame();
    loadHistory();
});