

const settings = {
    easy: {
        size: 110,
        speed: 2000,
        greenChance: 0.22,
        redChance: 0.04,
        soloRedChance: 0.03
    },

    medium: {
        size: 65,
        speed: 1500,
        greenChance: 0.12,
        redChance: 0.12,
        soloRedChance: 0.08
    },

    hard: {
        size: 40,
        speed: 1100,
        greenChance: 0.05,
        redChance: 0.22,
        soloRedChance: 0.15
    }
};


// Punkty za specjalne kropki
const GREEN_POINTS = 5;

// Czas samodzielnej czerwonej kropki
const SOLO_RED_TIME = 2000;

// Zmienne gry
let score = 0;
let misses = 0;
let reactions = [];

let gameRunning = false;
let timeLeft = 30;
let targetDots = 20;

let bonusReceived = false;
let appearTime = 0;

let timerInterval;
let dotTimeout;
let nextDotTimeout;

// Elementy HTML
const gameArea = document.getElementById("gameArea");

const blueDot = document.getElementById("blueDot");
const specialDot = document.getElementById("specialDot");

const startBtn = document.getElementById("startBtn");
const cancelBtn = document.getElementById("cancelBtn");

const difficulty = document.getElementById("difficulty");
const gameTime = document.getElementById("gameTime");
const targetInput = document.getElementById("target");

const scoreDisplay = document.getElementById("score");
const reactionDisplay = document.getElementById("reaction");
const timeDisplay = document.getElementById("time");
const progressDisplay = document.getElementById("progress");

const message = document.getElementById("message");
const results = document.getElementById("results");
const goalInfo = document.getElementById("goalInfo");
const startMessage = document.getElementById("startMessage");

// Przyciski
startBtn.addEventListener("click", startGame);
cancelBtn.addEventListener("click", cancelGame);

blueDot.addEventListener("click", hitBlueDot);
specialDot.addEventListener("click", hitSpecialDot);


// =====================================
// ROZPOCZĘCIE GRY
// =====================================

function startGame() {

    clearInterval(timerInterval);
    clearTimeout(dotTimeout);
    clearTimeout(nextDotTimeout);

    score = 0;
    misses = 0;
    reactions = [];

    timeLeft = Number(gameTime.value);

    targetDots = Math.max(
        1,
        Math.min(
            200,
            Math.floor(Number(targetInput.value) || 20)
        )
    );

    targetInput.value = targetDots;

    bonusReceived = false;
    gameRunning = true;

    scoreDisplay.textContent = "0";
    reactionDisplay.textContent = "- ms";
    timeDisplay.textContent = timeLeft + " s";

    progressDisplay.textContent = "0 / " + targetDots;

    results.textContent = "";
    message.textContent = "Powodzenia!";

    goalInfo.textContent =
        "Traf " + targetDots +
        " niebieskich kropek, aby zdobyć bonus!";

    goalInfo.classList.remove("completed");

    startMessage.style.display = "none";

    difficulty.disabled = true;
    gameTime.disabled = true;
    targetInput.disabled = true;

    startBtn.disabled = true;
    startBtn.textContent = "Gra w toku";

    cancelBtn.style.display = "block";

    hideAllDots();

    showDot();

    timerInterval = setInterval(() => {

        timeLeft--;

        timeDisplay.textContent = timeLeft + " s";

        if (timeLeft <= 0) {
            endGame();
        }

    }, 1000);
}


// =====================================
// LOSOWANIE POZYCJI
// =====================================

function randomPosition(size, avoidPosition = null) {

    const maxX = Math.max(0, gameArea.clientWidth - size);
    const maxY = Math.max(0, gameArea.clientHeight - size);

    let position = {
        x: 0,
        y: 0
    };

    // Staramy się nie nakładać kropek
    for (let i = 0; i < 30; i++) {

        position = {
            x: Math.random() * maxX,
            y: Math.random() * maxY
        };

        if (!avoidPosition) {
            break;
        }

        const dx = position.x - avoidPosition.x;
        const dy = position.y - avoidPosition.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > size + 20) {
            break;
        }
    }

    return position;
}


// =====================================
// UKRYWANIE KROPEK
// =====================================

function hideAllDots() {

    blueDot.style.display = "none";
    specialDot.style.display = "none";

    specialDot.className = "dot";
}


// =====================================
// KOLEJNA RUNDA
// =====================================

function showDot() {

    if (!gameRunning) return;

    clearTimeout(dotTimeout);
    clearTimeout(nextDotTimeout);

    hideAllDots();

    const config = settings[difficulty.value];

    // Losowanie samodzielnej czerwonej kropki
    if (Math.random() < config.soloRedChance) {

        showSoloRed();

        return;
    }

    // Pozycja niebieskiej kropki
    const bluePosition = randomPosition(config.size);

    blueDot.style.width = config.size + "px";
    blueDot.style.height = config.size + "px";

    blueDot.style.left = bluePosition.x + "px";
    blueDot.style.top = bluePosition.y + "px";

    blueDot.style.display = "block";

    // Pomiar reakcji zaczyna się od pojawienia niebieskiej
    appearTime = performance.now();

    // Losowanie dodatkowej kropki
    const random = Math.random();

    let specialType = null;

    if (random < config.greenChance) {

        specialType = "green";

    } else if (
        random < config.greenChance + config.redChance
    ) {

        specialType = "red";

    }

    if (specialType) {

        showSpecialDot(
            specialType,
            bluePosition,
            config
        );
    }

    // Czas życia całego zestawu
    dotTimeout = setTimeout(() => {

        if (!gameRunning) return;

        misses++;

        hideAllDots();

        nextDotTimeout = setTimeout(showDot, 250);

    }, config.speed);
}


// =====================================
// DODATKOWA KROPKA OBOK NIEBIESKIEJ
// =====================================

function showSpecialDot(type, bluePosition, config) {

    const size = config.size;

    const position = randomPosition(size, bluePosition);

    specialDot.style.width = size + "px";
    specialDot.style.height = size + "px";

    specialDot.style.left = position.x + "px";
    specialDot.style.top = position.y + "px";

    specialDot.className = "dot";

    if (type === "green") {
        specialDot.classList.add("green-dot");
    }

    if (type === "red") {
        specialDot.classList.add("red-dot");
    }

    specialDot.dataset.type = type;

    specialDot.style.display = "block";
}


// =====================================
// SAMODZIELNA CZERWONA KROPKA
// =====================================

function showSoloRed() {

    const size = settings[difficulty.value].size;

    const position = randomPosition(size);

    specialDot.style.width = size + "px";
    specialDot.style.height = size + "px";

    specialDot.style.left = position.x + "px";
    specialDot.style.top = position.y + "px";

    specialDot.className = "dot red-dot";

    specialDot.dataset.type = "solo-red";

    specialDot.style.display = "block";

    // Czerwona kropka ma 3 sekundy
    dotTimeout = setTimeout(() => {

        if (!gameRunning) return;

        hideAllDots();

        // Zignorowanie czerwonej nie powoduje kary
        nextDotTimeout = setTimeout(showDot, 200);

    }, SOLO_RED_TIME);
}


// =====================================
// KLIKNIĘCIE NIEBIESKIEJ KROPKI
// =====================================

function hitBlueDot() {

    if (!gameRunning || blueDot.style.display === "none") {
        return;
    }

    const reactionTime = Math.round(
        performance.now() - appearTime
    );

    reactions.push(reactionTime);

    score += 1;

    clearTimeout(dotTimeout);

    hideAllDots();

    updateStats();
    checkGoal();

    nextDotTimeout = setTimeout(showDot, 200);
}


// =====================================
// KLIKNIĘCIE ZIELONEJ LUB CZERWONEJ
// =====================================

function hitSpecialDot() {

    if (!gameRunning || specialDot.style.display === "none") {
        return;
    }

    const type = specialDot.dataset.type;

    clearTimeout(dotTimeout);

    hideAllDots();

    if (type === "green") {

        // Zielona: bonusowe punkty
        score += GREEN_POINTS;

        message.textContent =
            "Świetnie! Zielona kropka: +" +
            GREEN_POINTS + " punktów!";

    } else {

        // Czerwona: utrata jednego punktu
        score = Math.max(0, score - 1);

        message.textContent =
            "Uwaga! Czerwona kropka: -1 punkt!";
    }

    // Nie dodajemy reakcji ani trafienia niebieskiej
    // za kliknięcie specjalnej kropki

    updateStats();

    nextDotTimeout = setTimeout(showDot, 200);
}


// =====================================
// STATYSTYKI
// =====================================

function updateStats() {

    scoreDisplay.textContent = score;

    progressDisplay.textContent =
        reactions.length + " / " + targetDots;

    if (reactions.length > 0) {

        const average = Math.round(
            reactions.reduce((a, b) => a + b, 0) /
            reactions.length
        );

        reactionDisplay.textContent =
            average + " ms";
    }
}


// =====================================
// BONUS ZA OSIĄGNIĘCIE CELU
// =====================================

function checkGoal() {

    if (
        reactions.length >= targetDots &&
        !bonusReceived
    ) {

        bonusReceived = true;

        const bonus = targetDots * 2;

        score += bonus;

        scoreDisplay.textContent = score;

        goalInfo.textContent =
            "Cel osiągnięty! Bonus: +" +
            bonus + " punktów!";

        goalInfo.classList.add("completed");
    }
}


// =====================================
// PRZYWRACANIE USTAWIEŃ
// =====================================

function resetGameControls() {

    difficulty.disabled = false;
    gameTime.disabled = false;
    targetInput.disabled = false;

    startBtn.disabled = false;
    startBtn.textContent = "Zagraj ponownie";

    cancelBtn.style.display = "none";
}


// =====================================
// ANULOWANIE GRY
// =====================================

function cancelGame() {

    if (!gameRunning) return;

    gameRunning = false;

    clearInterval(timerInterval);
    clearTimeout(dotTimeout);
    clearTimeout(nextDotTimeout);

    hideAllDots();

    resetGameControls();

    message.textContent = "Gra została anulowana.";

    results.textContent = "";

    startMessage.style.display = "flex";
    startMessage.textContent = "Gra anulowana. Możesz rozpocząć ponownie.";
}


// =====================================
// KONIEC GRY
// =====================================

function endGame() {

    if (!gameRunning) return;

    gameRunning = false;

    clearInterval(timerInterval);
    clearTimeout(dotTimeout);
    clearTimeout(nextDotTimeout);

    hideAllDots();

    resetGameControls();

    message.textContent = "Koniec gry!";

    startMessage.style.display = "none";

    const average = reactions.length
        ? Math.round(
            reactions.reduce((a, b) => a + b, 0) /
            reactions.length
        )
        : 0;

    const bonus = bonusReceived
        ? targetDots * 2
        : 0;

    results.innerHTML =
        "Wynik końcowy: " + score + " punktów<br>" +
        "Średni czas reakcji: " + average + " ms<br>" +
        "Niebieskie trafienia: " + reactions.length + "<br>" +
        "Pominięcia: " + misses + "<br>" +
        "Bonus za cel: " + bonus + " punktów<br>" +
        "Cel: " +
        (bonusReceived ? "Osiągnięty!" : "Nieosiągnięty");
}
