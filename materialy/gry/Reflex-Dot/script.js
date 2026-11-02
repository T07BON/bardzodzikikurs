document.addEventListener("DOMContentLoaded", () => {
    // ELEMENTY GRY
    const $ = (...selectors) =>
        selectors.map(s => document.querySelector(s)).find(Boolean);

    const playArea = $("#playArea", "#gameArea", ".play-area", ".game-area");
    const difficulty = $("#difficulty", "#difficultySelect");
    const durationInput = $("#duration", "#gameDuration", "#timeLimit", "#gameTime");
    const targetInput = $("#targetDots", "#targetCount", "#target");
    const startBtn = $("#startBtn", "#startButton");
    const cancelBtn = $("#cancelBtn", "#cancelButton");

    const scoreDisplay = $("#score", "#scoreDisplay");
    const averageDisplay = $("#averageReaction", "#averageReactionDisplay", "#avgReaction");
    const timeDisplay = $("#time", "#timer", "#timeDisplay");
    const missesDisplay = $("#misses", "#missesDisplay");
    const goalInfo = $("#goalInfo");

    const blueDot = $("#blueDot");
    const specialDot = $("#specialDot");

    if (!playArea || !startBtn || !blueDot) {
        console.error("Nie znaleziono wymaganych elementów gry. Sprawdź identyfikatory w HTML.");
        return;
    }

    // USTAWIENIA TRUDNOŚCI
    const settings = {
        easy: {
            size: 110,
            speed: 2000,
            greenChance: 0.22,
            redChance: 0.04,
            soloRedChance: 0.03,
            miniChance: 0.04,
            fruitChance: 0.05,
            miniSpeed: 2200
        },
        medium: {
            size: 65,
            speed: 1500,
            greenChance: 0.12,
            redChance: 0.12,
            soloRedChance: 0.08,
            miniChance: 0.13,
            fruitChance: 0.15,
            miniSpeed: 1550
        },
        hard: {
            size: 40,
            speed: 1100,
            greenChance: 0.05,
            redChance: 0.22,
            soloRedChance: 0.15,
            miniChance: 0.27,
            fruitChance: 0.18, // Zmniejszono częstotliwość występowania zdjęć/owoców na trudnym
            miniSpeed: 950
        }
    };

    // STAN GRY
    let slowTimeCounter = 0;
    let playing = false;
    let score = 0;
    let misses = 0;
    let blueHits = 0;
    let reactions = [];
    let remainingTime = 30;
    let targetDots = 20;
    let targetBonusGiven = false;

    let gameTimer = null;
    let dotTimer = null;
    let eventTimer = null;
    let animationFrame = null;
    let activeTimeouts = [];

    let currentDotTime = 0;
    let specialDotType = null;
    let miniGameActive = false;
    let currentEvent = null;

    const fruitImages = [
        {
            name: "Jabłko",
            url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500"
        },
        {
            name: "Banan",
            url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500"
        },
        {
            name: "Pomarańcza",
            url: "https://images.unsplash.com/photo-1547514701-42782101795e?w=500"
        },
        {
            name: "Truskawka",
            url: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500"
        }
    ];

    // STYLE DODATKOWYCH ELEMENTÓW
    const extraStyle = document.createElement("style");
    extraStyle.textContent = `
        #playArea, #gameArea, .play-area, .game-area {
            position: relative;
            overflow: hidden;
        }

        .chaos-overlay {
            position: absolute;
            inset: 0;
            z-index: 20;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(10, 15, 30, 0.88);
            cursor: pointer;
            user-select: none;
        }

        .chaos-instruction {
            position: absolute;
            top: 12%;
            left: 0;
            width: 100%;
            text-align: center;
            color: white;
            font-size: clamp(16px, 3vw, 24px);
            font-weight: bold;
            pointer-events: none;
        }

        .chaos-countdown {
            color: white;
            font-size: clamp(35px, 8vw, 65px);
            font-weight: bold;
        }

        .timing-track {
            width: min(75%, 650px);
            height: 24px;
            background: #333d50;
            border-radius: 12px;
            position: relative;
            overflow: hidden;
        }

        .timing-target {
            position: absolute;
            left: 50%;
            top: 0;
            height: 100%;
            width: 12%;
            transform: translateX(-50%);
            background: #35d47b;
            box-shadow: 0 0 15px #35d47b;
        }

        .timing-marker {
            position: absolute;
            top: -9px;
            left: 0;
            height: 42px;
            width: 5px;
            background: white;
            box-shadow: 0 0 12px white;
            border-radius: 5px;
        }

        .ring-stage {
            position: relative;
            width: min(75vw, 360px);
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .ring-target {
            position: absolute;
            width: 48%;
            height: 48%;
            border: 5px solid #35d47b;
            border-radius: 50%;
            box-shadow: 0 0 15px #35d47b;
        }

        .ring-moving {
            position: absolute;
            width: 100%;
            height: 100%;
            border: 5px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 15px white;
        }

        .fruit-event {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(10, 15, 30, 0.75);
            z-index: 21;
        }

        .fruit-event img {
            max-width: 65%;
            max-height: 65%;
            width: auto;
            height: auto;
            object-fit: contain;
            border-radius: 18px;
            animation: fruitFade 2.6s ease-in-out forwards;
        }

        @keyframes fruitFade {
            0% { opacity: 0; transform: scale(0.85); }
            25% { opacity: 1; transform: scale(1); }
            65% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.92); }
        }

        .chaos-result {
            position: absolute;
            bottom: 12%;
            color: white;
            font-size: 25px;
            font-weight: bold;
            pointer-events: none;
        }
    `;
    document.head.appendChild(extraStyle);

    // POMOCNICZE
    function currentSettings() {
        return settings[difficulty?.value] || settings.easy;
    }

    function schedule(callback, delay) {
        const id = setTimeout(() => {
            activeTimeouts = activeTimeouts.filter(x => x !== id);
            callback();
        }, delay);

        activeTimeouts.push(id);
        return id;
    }

    function clearAllTimers() {
        clearInterval(gameTimer);
        clearTimeout(dotTimer);
        clearTimeout(eventTimer);

        activeTimeouts.forEach(clearTimeout);
        activeTimeouts = [];

        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    }

    function slowGameTime() {
        if (!playing) return;

        clearInterval(gameTimer);

        gameTimer = setInterval(() => {
            if (!playing) return;

            slowTimeCounter++;

            if (slowTimeCounter >= 2) {
                remainingTime--;
                slowTimeCounter = 0;
                updateDisplay();
            }

            if (remainingTime <= 0) {
                endGame();
            }
        }, 1000);
    }

    function restoreGameTime() {
        clearInterval(gameTimer);
        slowTimeCounter = 0;

        gameTimer = setInterval(() => {
            if (!playing) return;

            remainingTime--;
            updateDisplay();

            if (remainingTime <= 0) {
                endGame();
            }
        }, 1000);
    }

    function updateDisplay() {
        if (scoreDisplay) scoreDisplay.textContent = score;
        if (missesDisplay) missesDisplay.textContent = misses;
        if (timeDisplay) timeDisplay.textContent = `${remainingTime} s`;

        if (goalInfo) {
            goalInfo.textContent = `Trafiono: ${blueHits} / ${targetDots} kropek${targetBonusGiven ? " (Bonus przyznany!)" : ""}`;
            if (targetBonusGiven) {
                goalInfo.classList.add("completed");
            } else {
                goalInfo.classList.remove("completed");
            }
        }

        if (averageDisplay) {
            const average = reactions.length
                ? reactions.reduce((a, b) => a + b, 0) / reactions.length
                : 0;

            averageDisplay.textContent = reactions.length ? `${Math.round(average)} ms` : "- ms";
        }
    }

    function addPoints(amount) {
        score = Math.max(0, score + amount);
        updateDisplay();
    }

    function lockSettings(locked) {
        [difficulty, durationInput, targetInput].forEach(element => {
            if (element) element.disabled = locked;
        });
    }

    function hideDots() {
        blueDot.style.display = "none";

        if (specialDot) {
            specialDot.style.display = "none";
        }

        specialDotType = null;
    }

    function clearEvent() {
        if (currentEvent) {
            currentEvent.remove();
            currentEvent = null;
        }

        miniGameActive = false;
    }

    function randomPosition(element) {
        const area = playArea.getBoundingClientRect();
        const size = currentSettings().size;

        const maxX = Math.max(0, area.width - size);
        const maxY = Math.max(0, area.height - size);

        const x = Math.random() * maxX;
        const y = Math.random() * maxY;

        element.style.position = "absolute";
        element.style.width = `${size}px`;
        element.style.height = `${size}px`;
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    }

    function configureDot(element, color) {
        element.style.background = color;
        element.style.borderRadius = "50%";
        element.style.cursor = "pointer";
        element.style.zIndex = "5";
        element.style.display = "block";
    }

    // ZWYKŁE KROPKI
    function showDot() {
        if (!playing || miniGameActive) return;

        hideDots();

        const s = currentSettings();
        const roll = Math.random();

        if (roll < s.fruitChance) {
            showFruit();
            return;
        }

        if (roll < s.fruitChance + s.miniChance) {
            if (Math.random() < 0.5) {
                startLineMiniGame();
            } else {
                startRingMiniGame();
            }
            return;
        }

        if (Math.random() < s.soloRedChance && specialDot) {
            showSoloRed();
            return;
        }

        configureDot(blueDot, "#2588ff");
        randomPosition(blueDot);

        currentDotTime = performance.now();
        blueDot.onclick = hitBlueDot;

        if (specialDot) {
            const specialRoll = Math.random();

            if (specialRoll < s.greenChance) {
                showSpecialDot("green");
            } else if (specialRoll < s.greenChance + s.redChance) {
                showSpecialDot("red");
            }
        }

        dotTimer = setTimeout(() => {
            if (!playing) return;

            misses++;
            hideDots();
            updateDisplay();
            schedule(showDot, 250);
        }, s.speed);
    }

    function hitBlueDot() {
        if (!playing || miniGameActive || blueDot.style.display === "none") return;

        const reaction = performance.now() - currentDotTime;
        reactions.push(reaction);

        score++;
        blueHits++;

        hideDots();
        checkTarget();
        updateDisplay();

        clearTimeout(dotTimer);
        schedule(showDot, 250);
    }

    function showSpecialDot(type) {
        if (!specialDot) return;

        specialDotType = type;
        configureDot(
            specialDot,
            type === "green" ? "#28d76f" : "#ef3434"
        );

        randomPosition(specialDot);
        specialDot.style.zIndex = "6";

        specialDot.onclick = () => {
            if (!playing || !specialDotType) return;

            if (specialDotType === "green") {
                addPoints(5);
            } else {
                addPoints(-1);
            }

            hideDots();
            clearTimeout(dotTimer);
            schedule(showDot, 250);
        };
    }

    function showSoloRed() {
        if (!specialDot) {
            schedule(showDot, 250);
            return;
        }

        configureDot(specialDot, "#ef3434");
        randomPosition(specialDot);
        specialDotType = "soloRed";

        // Poprawka: Kliknięcie w samotną czerwoną kropkę poprawnie odejmuje punkt (-1)[cite: 1]
        specialDot.onclick = () => {
            if (!playing) return;

            addPoints(-1);
            hideDots();
            clearTimeout(dotTimer);
            schedule(showDot, 250);
        };

        const disappearTime = difficulty?.value === "hard" ? 2000 : 3000;

        dotTimer = setTimeout(() => {
            if (!playing) return;

            hideDots();
            schedule(showDot, 250);
        }, disappearTime);
    }

    function checkTarget() {
        if (!targetDots || targetBonusGiven) return;

        if (blueHits >= targetDots) {
            targetBonusGiven = true;
            addPoints(targetDots * 2);
        }
    }

    // OWOC Z ANIMACJĄ FADE
    function showFruit() {
        if (!playing) return;

        hideDots();
        miniGameActive = true;
        slowGameTime();

        const fruit = fruitImages[
            Math.floor(Math.random() * fruitImages.length)
        ];

        const overlay = document.createElement("div");
        overlay.className = "fruit-event";

        const img = document.createElement("img");
        img.src = fruit.url;
        img.alt = fruit.name;

        overlay.appendChild(img);
        playArea.appendChild(overlay);
        currentEvent = overlay;

        schedule(() => {
            restoreGameTime();
            clearEvent();

            if (playing) showDot();
        }, 2700);
    }

    // WSPÓLNA OBSŁUGA MINIGIER
    function createMiniOverlay(instruction) {
        hideDots();
        miniGameActive = true;
        slowGameTime();

        const overlay = document.createElement("div");
        overlay.className = "chaos-overlay";

        const text = document.createElement("div");
        text.className = "chaos-instruction";
        text.textContent = instruction;

        overlay.appendChild(text);
        playArea.appendChild(overlay);
        currentEvent = overlay;

        return overlay;
    }

    function showCountdown(overlay, callback) {
        const countdown = document.createElement("div");
        countdown.className = "chaos-countdown";
        countdown.textContent = "1";

        overlay.appendChild(countdown);

        schedule(() => {
            if (!playing || !overlay.isConnected) return;

            countdown.textContent = "START!";
            callback();
        }, 1000);
    }

    function finishMiniGame(success) {
        if (!playing || !miniGameActive) return;

        miniGameActive = false;

        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }

        restoreGameTime();
        clearEvent();

        // Poprawka: Sukces dodaje 2 punkty i zwiększa liczbę trafień, porażka odejmuje 2 punkty
        if (success) {
            addPoints(2);
            blueHits++;
            checkTarget();
        } else {
            addPoints(-2);
        }

        const result = document.createElement("div");
        result.className = "chaos-result";
        result.textContent = success ? "+2 PUNKTY" : "-2 PUNKTY";

        playArea.appendChild(result);

        schedule(() => {
            result.remove();

            if (playing) showDot();
        }, 650);
    }

    // MINIGRA 1: TRAF W BLOK
    function startLineMiniGame() {
        const s = currentSettings();
        const overlay = createMiniOverlay("Kliknij, gdy wskaźnik trafi w zielony blok!");

        const track = document.createElement("div");
        track.className = "timing-track";

        const target = document.createElement("div");
        target.className = "timing-target";

        const marker = document.createElement("div");
        marker.className = "timing-marker";

        track.appendChild(target);
        track.appendChild(marker);
        overlay.appendChild(track);

        showCountdown(overlay, () => {
            if (!playing || !overlay.isConnected) return;

            const start = performance.now();
            const duration = s.miniSpeed;
            let position = 0;

            function animate(now) {
                if (!playing || !miniGameActive) return;

                const progress = Math.min((now - start) / duration, 1);
                position = progress * 100;

                marker.style.left = `${position}%`;

                if (progress < 1) {
                    animationFrame = requestAnimationFrame(animate);
                } else {
                    finishMiniGame(false);
                }
            }

            animationFrame = requestAnimationFrame(animate);

            overlay.onclick = () => {
                const targetCenter = 50;
                const tolerance = difficulty?.value === "hard" ? 4 : 6;

                finishMiniGame(
                    Math.abs(position - targetCenter) <= tolerance
                );
            };
        });
    }

    // MINIGRA 2: KURCZĄCY SIĘ PIERŚCIEŃ
    function startRingMiniGame() {
        const s = currentSettings();
        const overlay = createMiniOverlay("Kliknij, gdy biały pierścień pokryje się z zielonym!");

        const stage = document.createElement("div");
        stage.className = "ring-stage";

        const target = document.createElement("div");
        target.className = "ring-target";

        const moving = document.createElement("div");
        moving.className = "ring-moving";

        stage.appendChild(target);
        stage.appendChild(moving);
        overlay.appendChild(stage);

        showCountdown(overlay, () => {
            if (!playing || !overlay.isConnected) return;

            const start = performance.now();
            const duration = s.miniSpeed;

            const startScale = 1;
            const endScale = 0.25;
            let currentScale = startScale;

            function animate(now) {
                if (!playing || !miniGameActive) return;

                const progress = Math.min((now - start) / duration, 1);

                currentScale =
                    startScale - (startScale - endScale) * progress;

                moving.style.transform = `scale(${currentScale})`;

                if (progress < 1) {
                    animationFrame = requestAnimationFrame(animate);
                } else {
                    finishMiniGame(false);
                }
            }

            animationFrame = requestAnimationFrame(animate);

            overlay.onclick = () => {
                // Dobór tolerancji w zależności od poziomu trudności (większa tolerancja = większy "zielony obszar"):
                // Łatwy: duża (0.09), Średni: średnia (0.07), Trudny: lekko zwiększona (0.045)
                let tolerance = 0.045; // domyślnie hard
                if (difficulty?.value === "easy") {
                    tolerance = 0.09;  // duży obszar
                } else if (difficulty?.value === "medium") {
                    tolerance = 0.07;  // średni obszar
                }

                finishMiniGame(
                    Math.abs(currentScale - 0.48) <= tolerance
                );
            };
        });
    }

    // START GRY
    function startGame() {
        if (playing) return;

        playing = true;
        score = 0;
        misses = 0;
        blueHits = 0;
        reactions = [];
        targetBonusGiven = false;

        remainingTime = Number(durationInput?.value) || 30;
        targetDots = Number(targetInput?.value) || 20;

        lockSettings(true);

        startBtn.disabled = true;
        if (cancelBtn) cancelBtn.style.display = "inline-block";

        updateDisplay();
        hideDots();
        clearEvent();

        gameTimer = setInterval(() => {
            if (!playing) return;

            remainingTime--;
            updateDisplay();

            if (remainingTime <= 0) {
                endGame();
            }
        }, 1000);
        slowTimeCounter = 0;
        showDot();
    }

    // KONIEC GRY
    function endGame() {
        if (!playing) return;

        playing = false;
        clearAllTimers();
        hideDots();
        clearEvent();

        lockSettings(false);
        startBtn.disabled = false;

        if (cancelBtn) cancelBtn.style.display = "none";

        const average = reactions.length
            ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length)
            : 0;

        alert(
            "Koniec gry!\n\n" +
            "Wynik: " + score + "\n" +
            "Trafione niebieskie kropki: " + blueHits + "\n" +
            "Pudła: " + misses + "\n" +
            "Średni czas reakcji: " + average + " ms"
        );
    }

    // ANULOWANIE GRY
    function cancelGame() {
        if (!playing) return;

        playing = false;
        clearAllTimers();
        hideDots();
        clearEvent();

        lockSettings(false);
        startBtn.disabled = false;

        if (cancelBtn) cancelBtn.style.display = "none";

        updateDisplay();
    }

    // PODŁĄCZENIE PRZYCISKÓW
    startBtn.addEventListener("click", startGame);

    if (cancelBtn) {
        cancelBtn.addEventListener("click", cancelGame);
        cancelBtn.style.display = "none";
    }

    // POCZĄTKOWY STAN
    hideDots();
    updateDisplay();
});