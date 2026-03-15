// lessons.js

// --- 1. LESSON DATA (Frontend Only) ---
const lessons = [
    {
        id: 1,
        title: "Lesson 1: Home Keys - ASDF",
        instructions: "Practice 'ASDF' keys. Type random combinations of these characters, including spaces. Focus on accuracy and returning to home row.",
        chars: "asdf",
        wordLength: 5, // INCREASED: Longer "words"
        numWords: 30   // INCREASED: More "words"
    },
    {
        id: 2,
        title: "Lesson 2: Home Keys - JKL;",
        instructions: "Practice 'JKL;' keys. Type random combinations of these characters, including spaces. Focus on accuracy and returning to home row.",
        chars: "jkl;",
        wordLength: 5,
        numWords: 30
    },
    {
        id: 3,
        title: "Lesson 3: Home Keys - ASDF JKL;",
        instructions: "Combine 'ASDF' and 'JKL;' keys. Type random combinations of these characters, including spaces. Focus on smooth transitions.",
        chars: "asdfjkl;",
        wordLength: 7, // Longer words
        numWords: 30
    },
    {
        id: 4,
        title: "Lesson 4: Home Keys + G and H",
        instructions: "Practice 'ASDFG' and 'HJKL;'. Type random combinations, including spaces. Keep your index fingers reaching for G and H.",
        chars: "asdfghjkl;",
        wordLength: 7,
        numWords: 30
    },
    {
        id: 5,
        title: "Lesson 5: Full Home Row + Apostrophe",
        instructions: "Practice 'ASDFGHJKL;' and the apostrophe. Type random combinations, including spaces. Ensure smooth finger movements.",
        chars: "asdfghjkl;'",
        wordLength: 8, // Longer words
        numWords: 30
    },
    // Placeholders for future lessons
    { id: 6, title: "Lesson 6: Top Row - E and I", instructions: "Coming Soon" },
    { id: 7, title: "Lesson 7: Top Row - R and U", instructions: "Coming Soon" },
    { id: 8, title: "Lesson 8: Top Row - T and Y", instructions: "Coming Soon" },
    { id: 9, title: "Lesson 9: Top Row - W and O", instructions: "Coming Soon" },
    { id: 10, title: "Lesson 10: Top Row - Q and P", instructions: "Coming Soon" },
    { id: 11, title: "Lesson 11: Bottom Row", instructions: "Coming Soon" },
    { id: 12, title: "Lesson 12: Numbers", instructions: "Coming Soon" },
    { id: 13, title: "Lesson 13: Capitals", instructions: "Coming Soon" },
    { id: 14, title: "Lesson 14: Punctuation", instructions: "Coming Soon" },
    { id: 15, title: "Final Test", instructions: "Coming Soon" },
];

let currentActiveLessonId = null;
let lessonTimerInterval = null;
let lessonTimeLeft = 60;
const LESSON_TEST_TIME = 60;
let lessonIsPlaying = false;

// --- 2. DOM ELEMENTS for Lessons Page ---
let lessonsSection;
let navMainTest;
let navLessons;

let lessonsMenuDisplay;
let lessonListUl;

let lessonTestAreaDiv;
let lessonTitleH3;
let lessonInstructionsP;
let lessonWordsDisplayP;
let lessonInput;
let lessonResultsDiv;
let lessonWpmSpan;
let lessonAccuracySpan;
let lessonRestartBtn;
let backToLessonsMenuBtn;
let lessonTimerDisplay;

// --- 3. LESSON GAME VARIABLES ---
let currentLessonTextForTyping = "";

// --- 4. FUNCTIONS for Lessons Logic ---

// Function to generate and shuffle lesson words based on character set
function generateLessonText(chars, wordLength, numWords) {
    let generatedWords = [];
    const availableChars = chars; // Chars *without* space for word generation itself

    for (let i = 0; i < numWords; i++) {
        let word = "";
        for (let j = 0; j < wordLength; j++) {
            const randomIndex = Math.floor(Math.random() * availableChars.length);
            word += availableChars[randomIndex];
        }
        // Ensure words don't start or end with a space if not desired, or have multiple spaces
        // Trim and push the word. Spaces will be added by join(' ')
        if (word.length > 0) {
            generatedWords.push(word);
        }
    }
    // Join with a single space to create sentences, mimicking the typingme.com style
    return generatedWords.join(' ');
}


// Renders the list of lessons in the menu
function renderLessonsList() {
    lessonListUl.innerHTML = '';
    lessons.forEach(lesson => {
        const li = document.createElement('li');
        li.innerText = lesson.title;
        li.dataset.lessonId = lesson.id;

        if (lesson.id <= 5) {
            li.classList.add('active-lesson-link');
            li.addEventListener('click', () => startLesson(lesson.id));
        } else {
            li.classList.add('disabled-lesson-link');
            li.title = lesson.instructions;
        }
        lessonListUl.appendChild(li);
    });
}

// Starts a specific lesson
function startLesson(lessonId) {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) {
        console.error("Lesson not found:", lessonId);
        return;
    }

    currentActiveLessonId = lessonId;
    lessonTitleH3.innerText = lesson.title;
    lessonInstructionsP.innerText = lesson.instructions;

    // --- CRITICAL CHANGE: Generate text based on lesson config ---
    if (lesson.chars && lesson.wordLength && lesson.numWords) {
        currentLessonTextForTyping = generateLessonText(lesson.chars, lesson.wordLength, lesson.numWords);
    } else {
        currentLessonTextForTyping = "No generated text for this lesson. Coming soon!";
        lessonInput.disabled = true;
    }

    lessonWordsDisplayP.innerHTML = '';
    currentLessonTextForTyping.split('').forEach(char => {
        const span = document.createElement('span');
        span.innerText = char;
        lessonWordsDisplayP.appendChild(span);
    });

    // Reset game state for the lesson
    clearInterval(lessonTimerInterval);
    lessonTimeLeft = LESSON_TEST_TIME;
    lessonIsPlaying = false;
    lessonInput.value = '';
    lessonInput.disabled = false; // Ensure input is NOT disabled at start
    lessonInput.style.display = 'block'; // Ensure input is visible
    lessonResultsDiv.style.display = 'none';
    lessonWpmSpan.innerText = '0';
    lessonAccuracySpan.innerText = '0%';
    if (lessonTimerDisplay) lessonTimerDisplay.innerText = lessonTimeLeft;

    lessonsMenuDisplay.style.display = 'none';
    lessonTestAreaDiv.style.display = 'block';
    lessonInput.focus();
}

// Handles input for the lesson typing area
function handleLessonInput() {
    if (!lessonIsPlaying && lessonInput.value.length === 1) {
        startLessonTimer();
        lessonIsPlaying = true;
    }

    const spans = lessonWordsDisplayP.querySelectorAll('span');
    const typedArray = lessonInput.value.split('');

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

    // If all characters are typed (or time runs out)
    if (typedArray.length === spans.length) {
        endLesson();
    }
}

// Starts the timer for a lesson
function startLessonTimer() {
    lessonTimerInterval = setInterval(() => {
        lessonTimeLeft--;
        if (lessonTimerDisplay) lessonTimerDisplay.innerText = lessonTimeLeft;
        if (lessonTimeLeft <= 0) {
            endLesson();
        }
    }, 1000);
}


// Ends the current lesson and displays results
function endLesson() {
    clearInterval(lessonTimerInterval);
    lessonInput.disabled = true; // Disable input AFTER lesson ends
    lessonInput.style.display = 'none'; // HIDE input after lesson ends
    lessonIsPlaying = false;

    const spans = lessonWordsDisplayP.querySelectorAll('span');
    const typedValue = lessonInput.value;

    const correctChars = Array.from(spans).filter((span, index) => {
        return typedValue[index] === span.innerText && typedValue[index] !== undefined;
    }).length;

    const totalTyped = typedValue.length;

    let wpm = 0;
    let accuracy = 0;

    const timeSpentSeconds = LESSON_TEST_TIME - lessonTimeLeft;
    const timeSpentMinutes = timeSpentSeconds / 60;

    if (totalTyped > 0 && timeSpentMinutes > 0) {
        wpm = Math.round((correctChars / 5) / timeSpentMinutes);
        accuracy = Math.round((correctChars / totalTyped) * 100);
    } else if (totalTyped > 0) {
        wpm = Math.round((correctChars / 5) / (1 / 60));
        accuracy = Math.round((correctChars / totalTyped) * 100);
    }

    lessonWpmSpan.innerText = wpm;
    lessonAccuracySpan.innerText = `${accuracy}%`;
    lessonResultsDiv.style.display = 'block';

    lessonRestartBtn.focus();
}

// --- 5. INITIALIZATION for Lessons (inside DOMContentLoaded) ---
document.addEventListener('DOMContentLoaded', () => {
    mainTestSection = document.getElementById('main-test-section');
    lessonsSection = document.getElementById('lessons-section');
    navMainTest = document.getElementById('nav-main-test');
    navLessons = document.getElementById('nav-lessons');

    lessonsMenuDisplay = document.getElementById('lessons-menu-display');
    lessonListUl = document.getElementById('lesson-list');
    lessonTestAreaDiv = document.getElementById('lesson-test-area');
    lessonTitleH3 = document.getElementById('lesson-title');
    lessonInstructionsP = document.getElementById('lesson-instructions');
    lessonWordsDisplayP = document.getElementById('lesson-words-display');
    lessonInput = document.getElementById('lesson-input');
    lessonResultsDiv = document.getElementById('lesson-results');
    lessonWpmSpan = document.getElementById('lesson-wpm');
    lessonAccuracySpan = document.getElementById('lesson-accuracy');
    lessonRestartBtn = document.getElementById('lesson-restart-btn');
    backToLessonsMenuBtn = document.getElementById('back-to-lessons-menu-btn');
    lessonTimerDisplay = document.getElementById('lesson-timer');


    navMainTest.addEventListener('click', (e) => {
        e.preventDefault();
        lessonsSection.style.display = 'none';
        mainTestSection.style.display = 'block';
        if (typeof hiddenInput !== 'undefined' && hiddenInput) {
            hiddenInput.focus();
        }
        clearInterval(lessonTimerInterval);
        lessonIsPlaying = false;
        // Also ensure lesson input is reset/hidden when leaving lessons
        lessonInput.style.display = 'block'; // Reset for next lesson visit
        lessonInput.disabled = false;
        lessonInput.value = '';
        lessonResultsDiv.style.display = 'none';
    });

    navLessons.addEventListener('click', (e) => {
        e.preventDefault();
        mainTestSection.style.display = 'none';
        lessonsSection.style.display = 'block';
        lessonsMenuDisplay.style.display = 'block';
        lessonTestAreaDiv.style.display = 'none';
        renderLessonsList();
        clearInterval(lessonTimerInterval);
        lessonIsPlaying = false;
        // Also ensure lesson input is reset/hidden when entering lessons menu
        lessonInput.style.display = 'block'; // Reset for next lesson start
        lessonInput.disabled = false;
        lessonInput.value = '';
        lessonResultsDiv.style.display = 'none';
    });

    lessonInput.addEventListener('input', handleLessonInput);
    lessonRestartBtn.addEventListener('click', () => startLesson(currentActiveLessonId));
    backToLessonsMenuBtn.addEventListener('click', () => {
        lessonTestAreaDiv.style.display = 'none';
        lessonsMenuDisplay.style.display = 'block';
        clearInterval(lessonTimerInterval);
        lessonIsPlaying = false;
        lessonInput.disabled = false;
        lessonInput.value = '';
        lessonInput.style.display = 'block'; // Make sure input is visible for the next lesson
        lessonResultsDiv.style.display = 'none';
        renderLessonsList();
    });

    mainTestSection.style.display = 'block';
    lessonsSection.style.display = 'none';

    if (lessonTimerDisplay) lessonTimerDisplay.innerText = LESSON_TEST_TIME;
});