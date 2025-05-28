
// Данные открытки
let wishes = [];
let currentWishIndex = 0;
let wishInterval;
let blownCandles = 0;
let totalCandles = 5;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    setupEditor();
    setupEventListeners();
    checkURLParams();
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
    // Добавление обработчика для распознавания звука
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                setupAudioRecognition(stream);
            })
            .catch(function(err) {
                console.log('Микрофон недоступен:', err);
            });
    }

    // Обработчики для свечей
    setupCandleListeners();
}

// Настройка обработчиков свечей
function setupCandleListeners() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('candle') && 
            e.target.classList.contains('active') && 
            document.getElementById('cakeSection').classList.contains('active')) {
            
            blowOutSingleCandle(e.target);
        }
    });
}

// Настройка распознавания звука
function setupAudioRecognition(stream) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            console.log('AudioContext не поддерживается');
            return;
        }
        
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        function detectBlow() {
            analyser.getByteFrequencyData(dataArray);
            
            // Определение силы звука
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            let average = sum / dataArray.length;
            
            // Если звук достаточно сильный, считаем что свечу задули
            if (average > 50 && document.getElementById('cakeSection').classList.contains('active')) {
                blowRandomCandle();
            }
            
            requestAnimationFrame(detectBlow);
        }
        
        detectBlow();
    } catch (error) {
        console.log('Ошибка настройки аудио:', error);
    }
}

// Задувание случайной активной свечи
function blowRandomCandle() {
    const activeCandles = document.querySelectorAll('.candle.active');
    if (activeCandles.length > 0) {
        const randomIndex = Math.floor(Math.random() * activeCandles.length);
        blowOutSingleCandle(activeCandles[randomIndex]);
    }
}

// Задувание одной свечи
function blowOutSingleCandle(candleElement) {
    if (!candleElement.classList.contains('active')) return;
    
    candleElement.classList.remove('active');
    candleElement.classList.add('blown-out');
    blownCandles++;
    
    // Воспроизведение звука
    playBirthdaySound();
    
    // Проверяем, все ли свечи задуты
    if (blownCandles >= totalCandles) {
        setTimeout(function() {
            startCelebration();
        }, 1000);
    }
}

// Воспроизведение звука дня рождения
function playBirthdaySound() {
    const audio = document.getElementById('birthdaySound');
    audio.currentTime = 0;
    audio.play().catch(function(error) {
        console.log('Не удалось воспроизвести звук:', error);
    });
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
    const name = document.getElementById('birthdayName').value || 'Имя';
    const sender = document.getElementById('senderName').value || 'От кого';
    const font = document.getElementById('fontSelect').value;
    const background = document.getElementById('backgroundSelect').value;
    const textColor = document.getElementById('textColorSelect').value;
    
    const preview = document.getElementById('preview');
    const previewName = document.getElementById('previewName');
    const previewSender = document.getElementById('previewSender');
    const previewWish = document.getElementById('previewWish');
    
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
    previewSender.textContent = `От: ${sender}`;
    previewWish.textContent = wishes.length > 0 ? wishes[0].text : 'Добавьте пожелания...';
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
        
        // Применение настроек
        document.body.style.fontFamily = font;
        document.getElementById('celebration').className = `page active bg-${background}`;
        
        // Запуск таймера
        startTimer(new Date(date), name, sender, textColor);
    }
}

// Запуск таймера
function startTimer(targetDate, name, sender, textColor) {
    const timerSection = document.getElementById('timerSection');
    const cakeSection = document.getElementById('cakeSection');
    
    timerSection.classList.add('active');
    
    const timer = setInterval(function() {
        const now = new Date().getTime();
        const distance = targetDate - now;
        
        if (distance > 0) {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            document.getElementById('days').textContent = days;
            document.getElementById('hours').textContent = hours;
            document.getElementById('minutes').textContent = minutes;
            document.getElementById('seconds').textContent = seconds;
        } else {
            clearInterval(timer);
            // Переход к торту
            timerSection.classList.remove('active');
            cakeSection.classList.add('active');
            
            // Сброс состояния свечей
            resetCandles();
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
}

// Начало празднования
function startCelebration() {
    const cakeSection = document.getElementById('cakeSection');
    const partySection = document.getElementById('partySection');
    
    // Запуск эффектов
    startConfetti();
    startFireworks();
    
    // Переход к празднованию
    cakeSection.classList.remove('active');
    partySection.classList.add('active');
    
    // Обновление данных празднования
    updatePartyData();
    
    // Запуск ротации пожеланий
    startWishRotation();
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
    if (wishes.length === 0) return;
    
    function showNextWish() {
        const currentWish = document.getElementById('currentWish');
        const wishSender = document.getElementById('wishSender');
        const wishCard = document.getElementById('wishCard');
        
        const wish = wishes[currentWishIndex];
        
        // Применение стилей пожелания
        wishCard.className = `wish-card bg-${wish.background}`;
        wishCard.style.fontFamily = wish.font;
        
        currentWish.textContent = wish.text;
        currentWish.className = `wish-text ${wish.textColor}`;
        
        wishSender.textContent = `От: ${wish.sender}`;
        wishSender.className = `wish-sender ${wish.textColor}`;
        
        currentWishIndex = (currentWishIndex + 1) % wishes.length;
    }
    
    showNextWish();
    wishInterval = setInterval(showNextWish, 8000);
}

// Запуск конфетти
function startConfetti() {
    const confettiContainer = document.getElementById('confetti');
    const colors = ['#ff006e', '#8b5cf6', '#fbbf24', '#06d6a0', '#ff073a'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(function() {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confettiContainer.appendChild(confetti);
            
            setTimeout(function() {
                confetti.remove();
            }, 3000);
        }, i * 100);
    }
}

// Запуск фейерверков
function startFireworks() {
    const fireworksContainer = document.getElementById('fireworks');
    const colors = ['#ff006e', '#8b5cf6', '#fbbf24', '#06d6a0', '#ff073a'];
    
    for (let i = 0; i < 5; i++) {
        setTimeout(function() {
            const firework = document.createElement('div');
            firework.className = 'firework';
            firework.style.left = Math.random() * 100 + '%';
            firework.style.top = Math.random() * 100 + '%';
            firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            firework.style.width = Math.random() * 10 + 5 + 'px';
            firework.style.height = firework.style.width;
            fireworksContainer.appendChild(firework);
            
            setTimeout(function() {
                firework.remove();
            }, 2000);
        }, i * 500);
    }
}

// Обработка нажатия Enter в поле пожеланий
document.addEventListener('keypress', function(e) {
    if (e.target.id === 'wishInput' && e.key === 'Enter') {
        e.preventDefault();
        addWish();
    }
});



