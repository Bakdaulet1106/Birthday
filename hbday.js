// Данные открытки
let wishes = [];
let currentWishIndex = 0;
let wishInterval;
let blownCandles = 0;
let totalCandles = 5;
let audioContext;
let micStream;
let analyser;
let isListening = false;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    setupEditor();
    setupEventListeners();
    checkURLParams();
    setupAudio();
});

// Настройка редактора
function setupEditor() {
    updatePreview();
    
    // Обновление предпросмотра при изменении полей
    document.getElementById('birthdayName').addEventListener('input', updatePreview);
    document.getElementById('senderName').addEventListener('input', updatePreview);
    document.getElementById('fontSelect').addEventListener('change', updatePreview);
    document.getElementById('backgroundSelect').addEventListener('change', updatePreview);
    document.getElementById('textColorSelect').addEventListener('change', updatePreview);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Запрос разрешения на микрофон при первом взаимодействии
    document.addEventListener('click', requestMicrophoneAccess, { once: true });
    
    // Обработчик для Enter в поле пожеланий
    document.getElementById('wishInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addWish();
        }
    });
}

// Запрос доступа к микрофону
function requestMicrophoneAccess() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                micStream = stream;
                console.log('Микрофон подключен');
            })
            .catch(function(err) {
                console.log('Микрофон недоступен:', err);
            });
    }
}

// Настройка аудио контекста
function setupAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('AudioContext не поддерживается:', e);
    }
}

// Настройка распознавания звука для задувания свечей
function setupBlowDetection() {
    if (!micStream || !audioContext) {
        console.log('Микрофон или аудио контекст недоступны');
        return;
    }
    
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(micStream);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        let lastBlowTime = 0;
        isListening = true;
        
        function detectBlow() {
            if (!isListening) return;
            
            analyser.getByteFrequencyData(dataArray);
            
            // Анализ звука для обнаружения дутья
            let sum = 0;
            let highFreqSum = 0;
            
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
                if (i > dataArray.length * 0.7) { // высокие частоты
                    highFreqSum += dataArray[i];
                }
            }
            
            let average = sum / dataArray.length;
            let highFreqAverage = highFreqSum / (dataArray.length * 0.3);
            
            const now = Date.now();
            
            // Обнаружение характерного звука дутья (высокие частоты + общая громкость)
            if (average > 60 && highFreqAverage > 40 && 
                document.getElementById('cakeSection').classList.contains('active') &&
                now - lastBlowTime > 800) {
                
                console.log('Обнаружено дутье!', { average, highFreqAverage });
                blowRandomCandle();
                lastBlowTime = now;
            }
            
            if (isListening) {
                requestAnimationFrame(detectBlow);
            }
        }
        
        detectBlow();
        console.log('Система распознавания дутья активирована');
    } catch (error) {
        console.log('Ошибка настройки распознавания звука:', error);
    }
}

// Задувание случайной активной свечи
function blowRandomCandle() {
    const activeCandles = document.querySelectorAll('.candle.active');
    if (activeCandles.length > 0) {
        const randomIndex = Math.floor(Math.random() * activeCandles.length);
        blowOutCandle(activeCandles[randomIndex]);
    }
}

// Задувание одной свечи (вызывается при клике или дутье)
function blowOutCandle(candleElement) {
    if (!candleElement.classList.contains('active')) return;
    
    candleElement.classList.remove('active');
    candleElement.classList.add('blown-out');
    blownCandles++;
    
    // Воспроизведение звука
    playSound('candleBlowSound');
    
    console.log(`Свеча задута! Осталось: ${totalCandles - blownCandles}`);
    
    // Проверяем, все ли свечи задуты
    if (blownCandles >= totalCandles) {
        setTimeout(function() {
            startCelebration();
        }, 1500);
    }
}

// Воспроизведение звука
function playSound(soundId, fallbackFreq = 800) {
    try {
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.currentTime = 0;
            audio.volume = 0.7;
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(function(error) {
                    console.log('Не удалось воспроизвести аудио файл:', error);
                    createBeepSound(fallbackFreq, 300);
                });
            }
        } else {
            createBeepSound(fallbackFreq, 300);
        }
    } catch (error) {
        console.log('Ошибка воспроизведения звука:', error);
        createBeepSound(fallbackFreq, 300);
    }
}

// Создание звука программно
function createBeepSound(frequency = 800, duration = 200) {
    try {
        if (!audioContext) {
            setupAudio();
        }
        
        if (audioContext) {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        }
    } catch (error) {
        console.log('Не удалось создать звук:', error);
    }
}

// Добавление пожелания
function addWish() {
    const wishInput = document.getElementById('wishInput');
    const wishSender = document.getElementById('wishSender');
    const wishFont = document.getElementById('wishFont');
    const wishBackground = document.getElementById('wishBackground');
    const wishTextColor = document.getElementById('wishTextColor');
    
    const wishText = wishInput.value.trim();
    const senderText = wishSender.value.trim() || 'Аноним';
    
    if (wishText) {
        const wish = {
            text: wishText,
            sender: senderText,
            font: wishFont.value,
            background: wishBackground.value,
            textColor: wishTextColor.value
        };
        
        wishes.push(wish);
        wishInput.value = '';
        wishSender.value = '';
        updateWishList();
        updatePreview();
        
        console.log('Пожелание добавлено:', wish);
    }
}

// Обновление списка пожеланий
function updateWishList() {
    const wishList = document.getElementById('wishList');
    wishList.innerHTML = '';
    
    wishes.forEach((wish, index) => {
        const wishItem = document.createElement('div');
        wishItem.className = 'wish-item';
        wishItem.innerHTML = `
            <div class="wish-item-content">
                <div class="wish-item-text">${wish.text}</div>
                <div class="wish-item-details">От: ${wish.sender} | ${wish.font} | ${wish.background} | ${wish.textColor}</div>
            </div>
            <button onclick="removeWish(${index})">Удалить</button>
        `;
        wishList.appendChild(wishItem);
    });
}

// Удаление пожелания
function removeWish(index) {
    wishes.splice(index, 1);
    updateWishList();
    updatePreview();
}

// Обновление предпросмотра
function updatePreview() {
    const name = document.getElementById('birthdayName').value || 'ИМЯ';
    const sender = document.getElementById('senderName').value || 'Ваше имя';
    const font = document.getElementById('fontSelect').value;
    const background = document.getElementById('backgroundSelect').value;
    const textColor = document.getElementById('textColorSelect').value;
    
    const preview = document.getElementById('preview');
    const previewName = document.getElementById('previewName');
    const previewMainSender = document.getElementById('previewMainSender');
    const previewWishes = document.getElementById('previewWishes');
    
    // Обновление фона
    preview.className = `preview-card bg-${background}`;
    
    // Обновление шрифта
    preview.style.fontFamily = font;
    
    // Обновление цветов текста
    const mainTitle = preview.querySelector('.neon-preview');
    const secondaryTitle = preview.querySelector('.neon-preview-secondary');
    
    if (mainTitle) {
        mainTitle.className = `neon-preview ${textColor}`;
    }
    if (secondaryTitle) {
        secondaryTitle.className = `neon-preview-secondary ${textColor}`;
    }
    
    // Обновление содержимого
    previewName.textContent = name.toUpperCase();
    previewMainSender.textContent = `От: ${sender}`;
    
    // Обновление всех пожеланий в предпросмотре
    previewWishes.innerHTML = '';
    
    if (wishes.length > 0) {
        wishes.forEach(wish => {
            const wishElement = document.createElement('div');
            wishElement.className = 'preview-wish-item';
            wishElement.style.fontFamily = wish.font;
            wishElement.innerHTML = `
                <p class="preview-wish-text ${wish.textColor}">${wish.text}</p>
                <p class="preview-wish-sender">— ${wish.sender}</p>
            `;
            previewWishes.appendChild(wishElement);
        });
    } else {
        const defaultWish = document.createElement('div');
        defaultWish.className = 'preview-wish-item';
        defaultWish.innerHTML = `
            <p class="preview-wish-text">Добавьте пожелания...</p>
            <p class="preview-wish-sender">— От кого</p>
        `;
        previewWishes.appendChild(defaultWish);
    }
}

// Генерация ссылки
function generateLink() {
    const name = document.getElementById('birthdayName').value;
    const date = document.getElementById('birthdayDate').value;
    const sender = document.getElementById('senderName').value;
    const font = document.getElementById('fontSelect').value;
    const background = document.getElementById('backgroundSelect').value;
    const textColor = document.getElementById('textColorSelect').value;
    
    if (!name || !date || !sender || wishes.length === 0) {
        alert('Пожалуйста, заполните все поля и добавьте хотя бы одно пожелание!');
        return;
    }
    
    const params = new URLSearchParams({
        name: name,
        date: date,
        sender: sender,
        font: font,
        background: background,
        textColor: textColor,
        wishes: JSON.stringify(wishes)
    });
    
    const link = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    // Копирование ссылки в буфер обмена
    navigator.clipboard.writeText(link).then(function() {
        alert('Ссылка скопирована в буфер обмена!');
    }).catch(function() {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Ссылка скопирована в буфер обмена!');
    });
}

// Проверка параметров URL
function checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('name')) {
        // Переход к странице празднования
        document.getElementById('editor').classList.remove('active');
        document.getElementById('celebration').classList.add('active');
        
        // Получение данных из URL
        const name = urlParams.get('name');
        const date = urlParams.get('date');
        const sender = urlParams.get('sender');
        const font = urlParams.get('font') || 'Dancing Script';
        const background = urlParams.get('background') || 'purple-pink';
        const textColor = urlParams.get('textColor') || 'neon-pink';
        wishes = JSON.parse(urlParams.get('wishes') || '[]');
        
        console.log('Данные из URL:', { name, date, sender, wishes });
        
        // Применение настроек
        document.body.style.fontFamily = font;
        document.getElementById('celebration').className = `page active bg-${background}`;
        
        // Воспроизведение фоновой музыки
        playSound('birthdayMusic');
        
        // Запуск таймера
        startTimer(new Date(date), name, sender, textColor);
    }
}

// Обновление механических часов
function updateClockHands(targetDate) {
    const now = new Date();
    const distance = targetDate - now;
    
    if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Обновление стрелок часов
        const hourHand = document.getElementById('hourHand');
        const minuteHand = document.getElementById('minuteHand');
        const secondHand = document.getElementById('secondHand');
        
        if (hourHand && minuteHand && secondHand) {
            // Вычисление углов поворота стрелок
            const hourAngle = (hours % 12) * 30 + (minutes * 0.5);
            const minuteAngle = minutes * 6 + (seconds * 0.1);
            const secondAngle = seconds * 6;
            
            hourHand.style.transform = `rotate(${hourAngle}deg)`;
            minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
            secondHand.style.transform = `rotate(${secondAngle}deg)`;
        }
        
        return { days, hours, minutes, seconds };
    }
    
    return null;
}

// Запуск таймера
function startTimer(targetDate, name, sender, textColor) {
    const timerSection = document.getElementById('timerSection');
    const cakeSection = document.getElementById('cakeSection');
    
    timerSection.classList.add('active');
    
    const timer = setInterval(function() {
        const timeLeft = updateClockHands(targetDate);
        
        if (timeLeft) {
            // Обновление цифрового дисплея
            document.getElementById('days').textContent = timeLeft.days;
            document.getElementById('hours').textContent = timeLeft.hours;
            document.getElementById('minutes').textContent = timeLeft.minutes;
            document.getElementById('seconds').textContent = timeLeft.seconds;
        } else {
            clearInterval(timer);
            // Переход к торту
            timerSection.classList.remove('active');
            cakeSection.classList.add('active');
            
            // Сброс состояния свечей
            resetCandles();
            
            // Запуск системы распознавания дутья
            setupBlowDetection();
            
            console.log('Время пришло! Переход к торту.');
        }
    }, 1000);
}

// Сброс состояния свечей
function resetCandles() {
    blownCandles = 0;
    const candles = document.querySelectorAll('.candle');
    candles.forEach(candle => {
        candle.classList.add('active');
        candle.classList.remove('blown-out');
    });
    
    console.log('Свечи сброшены');
}

// Начало празднования
function startCelebration() {
    const cakeSection = document.getElementById('cakeSection');
    const partySection = document.getElementById('partySection');
    
    // Остановка прослушивания микрофона
    isListening = false;
    
    console.log('Начало празднования!');
    
    // Воспроизведение звука празднования
    playSound('celebrationSound', 1000);
    
    // Запуск эффектов
    setTimeout(() => startConfetti(), 500);
    setTimeout(() => startFireworks(), 1000);
    
    // Переход к празднованию
    cakeSection.classList.remove('active');
    partySection.classList.add('active');
    
    // Обновление данных празднования
    updatePartyData();
    
    // Запуск ротации пожеланий
    setTimeout(() => startWishRotation(), 2000);
}

// Обновление данных празднования
function updatePartyData() {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    const textColor = urlParams.get('textColor') || 'neon-pink';
    
    document.getElementById('partyName').textContent = name.toUpperCase();
    
    // Применение цветов
    const partyTitle = document.querySelector('.party-title');
    const partyName = document.querySelector('.party-name');
    const partySubtitle = document.querySelector('.party-subtitle');
    
    if (partyTitle) partyTitle.className = `neon-text party-title ${textColor}`;
    if (partyName) partyName.className = `neon-text-secondary party-name ${textColor}`;
    if (partySubtitle) partySubtitle.className = `neon-text-tertiary party-subtitle ${textColor}`;
}

// Запуск ротации пожеланий
function startWishRotation() {
    if (wishes.length === 0) {
        console.log('Нет пожеланий для показа');
        return;
    }
    
    console.log('Запуск ротации пожеланий:', wishes.length);
    
    function showNextWish() {
        const currentWish = document.getElementById('currentWish');
        const currentWishSender = document.getElementById('currentWishSender');
        const wishCard = document.getElementById('wishCard');
        
        if (currentWishIndex >= wishes.length) {
            currentWishIndex = 0;
        }
        
        const wish = wishes[currentWishIndex];
        
        // Применение стилей пожелания
        wishCard.className = `wish-card bg-${wish.background}`;
        wishCard.style.fontFamily = wish.font;
        
        currentWish.textContent = wish.text;
        currentWish.className = `wish-text ${wish.textColor}`;
        
        currentWishSender.textContent = `— ${wish.sender}`;
        currentWishSender.className = `wish-sender ${wish.textColor}`;
        
        console.log('Показано пожелание:', wish.text, 'от', wish.sender);
        
        currentWishIndex = (currentWishIndex + 1) % wishes.length;
    }
    
    showNextWish();
    wishInterval = setInterval(showNextWish, 6000);
}

// Запуск конфетти
function startConfetti() {
    const confettiContainer = document.getElementById('confetti');
    const colors = ['#ff006e', '#8b5cf6', '#fbbf24', '#06d6a0', '#ff073a', '#00ffff'];
    
    console.log('Запуск конфетти');
    
    // Очистка предыдущего конфетти
    confettiContainer.innerHTML = '';
    
    for (let i = 0; i < 150; i++) {
        setTimeout(function() {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
            confetti.style.width = (Math.random() * 8 + 6) + 'px';
            confetti.style.height = confetti.style.width;
            confettiContainer.appendChild(confetti);
            
            setTimeout(function() {
                if (confetti.parentNode) {
                    confetti.remove();
                }
            }, 6000);
        }, i * 30);
    }
    
    // Повторяем конфетти каждые 4 секунды
    setTimeout(() => {
        if (document.getElementById('partySection').classList.contains('active')) {
            startConfetti();
        }
    }, 4000);
}

// Запуск фейерверков
function startFireworks() {
    const fireworksContainer = document.getElementById('fireworks');
    const colors = ['#ff006e', '#8b5cf6', '#fbbf24', '#06d6a0', '#ff073a', '#00ffff'];
    
    console.log('Запуск фейерверков');
    
    // Воспроизведение звука фейерверков
    playSound('fireworkSound', 1200);
    
    for (let i = 0; i < 12; i++) {
        setTimeout(function() {
            const firework = document.createElement('div');
            firework.className = 'firework';
            firework.style.left = (Math.random() * 80 + 10) + '%';
            firework.style.top = (Math.random() * 80 + 10) + '%';
            firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            firework.style.width = Math.random() * 20 + 15 + 'px';
            firework.style.height = firework.style.width;
            firework.style.boxShadow = `0 0 30px ${colors[Math.floor(Math.random() * colors.length)]}`;
            firework.style.animationDuration = (Math.random() * 1 + 1.5) + 's';
            fireworksContainer.appendChild(firework);
            
            setTimeout(function() {
                if (firework.parentNode) {
                    firework.remove();
                }
            }, 3000);
        }, i * 400);
    }
    
    // Повторяем фейерверки каждые 8 секунд
    setTimeout(() => {
        if (document.getElementById('partySection').classList.contains('active')) {
            startFireworks();
        }
    }, 8000);
}

// Остановка микрофона при уходе со страницы
window.addEventListener('beforeunload', function() {
    isListening = false;
    if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
    }
    if (wishInterval) {
        clearInterval(wishInterval);
    }
});

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.log('Ошибка:', e.error);
});

console.log('Скрипт день рождения загружен');



