// --- 1. SUPABASE CONNECTION ---
// Paste your keys from the Supabase dashboard here inside the quotes!
const supabaseUrl = 'https://kolayolotgsejhwrsbyq.supabase.co';
const supabaseKey = 'sb_publishable_0g_gJHK8gJka59sAeJc7aw_1SQ58e0p';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- 2. DOM ELEMENTS ---
const wordsDisplay = document.getElementById('words-display');
const hiddenInput = document.getElementById('hidden-input');
const timerDisplay = document.getElementById('timer');
const wpmDisplay = document.getElementById('wpm');
const historyList = document.getElementById('history-list');
const restartBtn = document.getElementById('restart-btn');

// NEW FIX: Force focus on the hidden input anytime you click the screen
document.addEventListener('click', () => {
    hiddenInput.focus();
});
// Ensure it's focused right when the page loads too
hiddenInput.focus();


// --- 3. ANONYMOUS IDENTITY ---
// Check if they have an ID in their browser. If not, make one!
let userId = localStorage.getItem('type_user_id');
if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('type_user_id', userId);
}
document.getElementById('user-tag').innerText = "User ID: " + userId;

// --- 4. GAME VARIABLES ---
const testTime = 30;
let timeLeft = testTime;
let timerInterval = null;
let isPlaying = false;
let originalText = ""; // We will fill this randomly now

// Our mini-dictionary of 50 common English words
const wordsDictionary = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
    "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
    "so", "up", "out", "if", "about", "who", "get", "which", "go", "me"
];

// Function to pick 30 random words from the dictionary
function generateRandomText() {
    let randomWordsArray = [];
    for (let i = 0; i < 30; i++) {
        const randomIndex = Math.floor(Math.random() * wordsDictionary.length);
        randomWordsArray.push(wordsDictionary[randomIndex]);
    }
    return randomWordsArray.join(" "); // Joins them with spaces
}


// --- 5. INITIALIZATION ---
function setupGame() {
    wordsDisplay.innerHTML = '';
    hiddenInput.value = '';

    // Generate fresh random text every time we set up the game
    originalText = generateRandomText();

    originalText.split('').forEach(char => {
        const span = document.createElement('span');
        span.innerText = char;
        wordsDisplay.appendChild(span);
    });

    loadHistory();
}

// NEW: Restart button logic
restartBtn.addEventListener('click', () => {
    clearInterval(timerInterval); // Stop the clock if it's running
    timeLeft = testTime;          // Reset time back to 30
    timerDisplay.innerText = timeLeft;
    wpmDisplay.innerText = '0';
    isPlaying = false;
    hiddenInput.disabled = false; // Re-enable typing
    setupGame();                  // Setup a fresh random board
    hiddenInput.focus();          // Put the cursor back in the box
});

// --- 6. THE TYPING LOGIC ---
hiddenInput.addEventListener('input', () => {
    if (!isPlaying) {
        startTimer();
        isPlaying = true;
    }

    const spans = wordsDisplay.querySelectorAll('span');
    const typedArray = hiddenInput.value.split('');

    spans.forEach((span, index) => {
        const typedChar = typedArray[index];
        if (typedChar == null) {
            span.classList.remove('correct', 'incorrect');
        } else if (typedChar === span.innerText) {
            span.classList.add('correct');
            span.classList.remove('incorrect');
        } else {
            span.classList.add('incorrect');
            span.classList.remove('correct');
        }
    });

    if (typedArray.length === spans.length) endGame();
});

// --- 7. THE TIMER LOGIC ---
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft === 0) endGame();
    }, 1000);
}

// --- 8. ENDING THE GAME & DATABASE LOGIC ---
// Notice the "async" word here. This lets us talk to the database in the background!
async function endGame() {
    clearInterval(timerInterval);
    hiddenInput.disabled = true;

    // Math for WPM and Accuracy
    const correctChars = wordsDisplay.querySelectorAll('.correct').length;
    const totalTyped = hiddenInput.value.split('').length;

    const timeSpentMinutes = (testTime - timeLeft) / 60;
    const wpm = Math.round((correctChars / 5) / timeSpentMinutes);
    const accuracy = Math.round((correctChars / totalTyped) * 100);

    wpmDisplay.innerText = wpm;

    // Send the score to Supabase
    await saveScore(wpm, accuracy);

    // Refresh the history list on the screen
    await loadHistory();
}

// --- 9. DATABASE FUNCTIONS ---
async function saveScore(wpm, accuracy) {
    // FIX: Changed supabase to supabaseClient here
    const { error } = await supabaseClient
        .from('user_history')
        .insert([{ user_id: userId, wpm: wpm, accuracy: accuracy }]);

    if (error) console.error("Error saving to database:", error);
}

async function loadHistory() {
    // FIX: Changed supabase to supabaseClient here
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

    // Update the HTML list
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
// Start everything
setupGame();