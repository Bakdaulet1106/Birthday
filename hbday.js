// Данные открытки
let wishes = [];
let currentWishIndex = 0;
let wishInterval;

// Музыкальные файлы
const musicFiles = {
    'default': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBDuH0fPTgjMGHm7A7+OZRQ0PVqzn7qlXGAhEnODwx2IhAzmO2O+8cCwFKbfP8NCPPwk',
    'madagascar': 'мадагаскар - с днём рождения тебя.mp3',
    'allegrova': 'YA_dyshu-Irina_Allegrova_-_Den_Rozhdeniya_-_S_Dnjom_Rozhdeniya_Uspekha_radosti_vezeniya_lyubykh_zhelanijj_ispolneniya_i_million_nochejj_i_dnejj_S_Dnjom_Rozhdeniya_Lyubvi_do_golovokruzheniya_i_74820012.mp3',
    'falling-feathers': 'Falling Feathers - Happy Birthday To You.mp3',
    'chorus-friends': 'Chorus Friends - Happy Birthday to You.mp3',
    'relaxing': 'Relaxing Mode - Happy Birthday To You.mp3'
};

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
}

// Настройка распознавания звука
function setupAudioRecognition(stream) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
            blowOutCandle();
        }
        
        requestAnimationFrame(detectBlow);
    }
    
    detectBlow();
}

// Добавление пожелания
function addWish() {
    const wishInput = document.getElementById('wishInput');
    const wishText = wishInput.value.trim();
    
    if (wishText) {
        wishes.push(wishText);
        wishInput.value = '';
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
            <span>${wish}</span>
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
    previewWish.textContent = wishes.length > 0 ? wishes[0] : 'Добавьте пожелания...';
}

// Генерация ссылки
function generateLink() {
    const name = document.getElementById('birthdayName').value;
    const date = document.getElementById('birthdayDate').value;
    const sender = document.getElementById('senderName').value;
    const font = document.getElementById('fontSelect').value;
    const background = document.getElementById('backgroundSelect').value;
    const textColor = document.getElementById('textColorSelect').value;
    const music = document.getElementById('musicSelect').value;
    
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
        music: music,
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
        const music = urlParams.get('music') || 'default';
        wishes = JSON.parse(urlParams.get('wishes') || '[]');
        
        // Применение настроек
        document.body.style.fontFamily = font;
        document.getElementById('celebration').className = `page active bg-${background}`;
        
        // Запуск музыки
        playMusic(music);
        
        // Запуск таймера
        startTimer(new Date(date), name, sender, textColor);
    }
}

// Воспроизведение музыки
function playMusic(musicKey) {
    const audio = document.getElementById('birthdayMusic');
    
    if (musicKey !== 'default' && musicFiles[musicKey]) {
        // Попытка загрузить выбранный файл
        audio.src = musicFiles[musicKey];
        audio.onerror = function() {
            // Если файл не найден, используем по умолчанию
            audio.src = `data:audio/wav;base64,${musicFiles.default}`;
        };
    }
    
    audio.play().catch(function(error) {
        console.log('Автовоспроизведение заблокировано:', error);
        // Показать кнопку для запуска музыки
        showMusicButton();
    });
}

// Показать кнопку запуска музыки
function showMusicButton() {
    const button = document.createElement('button');
    button.textContent = '🎵 Включить музыку';
    button.style.position = 'fixed';
    button.style.top = '20px';
    button.style.right = '20px';
    button.style.zIndex = '9999';
    button.style.padding = '10px 20px';
    button.style.background = '#8b5cf6';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '10px';
    button.style.cursor = 'pointer';
    
    button.onclick = function() {
        document.getElementById('birthdayMusic').play();
        button.remove();
    };
    
    document.body.appendChild(button);
}

// Запуск таймера
function startTimer(targetDate, name, sender, textColor) {
    const timerSection = document.getElementById('timerSection');
    const cakeSection = document.getElementById('cakeSection');
    const partySection = document.getElementById('partySection');
    
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
            
            // Через 10 секунд автоматически задуть свечу если пользователь не сделал это
            setTimeout(function() {
                if (cakeSection.classList.contains('active')) {
                    blowOutCandle();
                }
            }, 10000);
        }
    }, 1000);
}

// Задувание свечи
function blowOutCandle() {
    const candle = document.getElementById('candle');
    const cakeSection = document.getElementById('cakeSection');
    const partySection = document.getElementById('partySection');
    
    candle.classList.add('blown-out');
    
    // Запуск эффектов
    setTimeout(function() {
        startConfetti();
        startFireworks();
        
        // Переход к празднованию
        cakeSection.classList.remove('active');
        partySection.classList.add('active');
        
        // Обновление данных празднования
        updatePartyData();
        
        // Запуск ротации пожеланий
        startWishRotation();
    }, 1000);
}

// Обновление данных празднования
function updatePartyData() {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    const sender = urlParams.get('sender');
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
    
    const urlParams = new URLSearchParams(window.location.search);
    const sender = urlParams.get('sender');
    
    function showNextWish() {
        const currentWish = document.getElementById('currentWish');
        const wishSender = document.getElementById('wishSender');
        
        currentWish.textContent = wishes[currentWishIndex];
        wishSender.textContent = `От: ${sender}`;
        
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

// Клик по торту для ручного задувания
document.addEventListener('click', function(e) {
    if (e.target.closest('.cake-container') && document.getElementById('cakeSection').classList.contains('active')) {
        blowOutCandle();
    }
});

// Обработка нажатия Enter в поле пожеланий
document.addEventListener('keypress', function(e) {
    if (e.target.id === 'wishInput' && e.key === 'Enter') {
        e.preventDefault();
        addWish();
    }
});
