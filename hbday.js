
// Глобальные переменные
let wishes = [];
let currentWishIndex = 0;
let wishInterval;
let blownCandles = 0;
let totalCandles = 5;
let timerInterval;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Приложение загружено');
    setupEditor();
    setupEventListeners();
    checkURLParams();
});

// Настройка редактора
function setupEditor() {
    updatePreview();
    
    // Обновление предпросмотра при изменении полей
    const inputs = ['birthdayName', 'senderName', 'fontSelect', 'backgroundSelect', 'textColorSelect'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updatePreview);
            element.addEventListener('change', updatePreview);
        }
    });
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработчик для Enter в поле пожеланий
    const wishInput = document.getElementById('wishInput');
    if (wishInput) {
        wishInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                addWish();
            }
        });
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
    if (!wishList) return;
    
    wishList.innerHTML = '';
    
    wishes.forEach((wish, index) => {
        const wishItem = document.createElement('div');
        wishItem.className = 'wish-item';
        wishItem.innerHTML = `
            <div class="wish-item-content">
                <div class="wish-item-text">${wish.text}</div>
                <div class="wish-item-details">От: ${wish.sender}</div>
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
    const name = document.getElementById('birthdayName')?.value || 'ИМЯ';
    const sender = document.getElementById('senderName')?.value || 'Ваше имя';
    const font = document.getElementById('fontSelect')?.value || 'Dancing Script';
    const background = document.getElementById('backgroundSelect')?.value || 'purple-pink';
    const textColor = document.getElementById('textColorSelect')?.value || 'neon-pink';
    
    const preview = document.getElementById('preview');
    const previewName = document.getElementById('previewName');
    const previewMainSender = document.getElementById('previewMainSender');
    const previewWishes = document.getElementById('previewWishes');
    
    if (!preview) return;
    
    // Обновление фона и шрифта
    preview.className = `preview-card bg-${background}`;
    preview.style.fontFamily = font;
    
    // Обновление содержимого
    if (previewName) previewName.textContent = name.toUpperCase();
    if (previewMainSender) previewMainSender.textContent = `От: ${sender}`;
    
    // Обновление пожеланий в предпросмотре
    if (previewWishes) {
        previewWishes.innerHTML = '';
        
        if (wishes.length > 0) {
            wishes.forEach(wish => {
                const wishElement = document.createElement('div');
                wishElement.className = 'preview-wish-item';
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
}

// Генерация ссылки
function generateLink() {
    const name = document.getElementById('birthdayName')?.value;
    const date = document.getElementById('birthdayDate')?.value;
    const sender = document.getElementById('senderName')?.value;
    const font = document.getElementById('fontSelect')?.value || 'Dancing Script';
    const background = document.getElementById('backgroundSelect')?.value || 'purple-pink';
    const textColor = document.getElementById('textColorSelect')?.value || 'neon-pink';
    
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
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(function() {
            alert('Ссылка скопирована в буфер обмена! Отправьте её имениннику.');
        }).catch(function() {
            fallbackCopyText(link);
        });
    } else {
        fallbackCopyText(link);
    }
}

// Fallback для копирования текста
function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        alert('Ссылка скопирована в буфер обмена! Отправьте её имениннику.');
    } catch (err) {
        console.error('Не удалось скопировать текст:', err);
        prompt('Скопируйте эту ссылку:', text);
    }
    
    document.body.removeChild(textArea);
}

// Проверка параметров URL
function checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('name')) {
        console.log('Найдены параметры, запуск празднования');
        
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
        
        try {
            wishes = JSON.parse(urlParams.get('wishes') || '[]');
        } catch (e) {
            console.error('Ошибка парсинга пожеланий:', e);
            wishes = [];
        }
        
        console.log('Данные из URL:', { name, date, sender, wishes });
        
        // Применение настроек
        document.body.style.fontFamily = font;
        document.getElementById('celebration').className = `page active bg-${background}`;
        
        // Запуск таймера
        if (date) {
            startTimer(new Date(date), name, sender, textColor, font, background);
        }
    }
}

// Запуск таймера
function startTimer(targetDate, name, sender, textColor, font, background) {
    const timerSection = document.getElementById('timerSection');
    const cakeSection = document.getElementById('cakeSection');
    
    if (!timerSection || !cakeSection) return;
    
    timerSection.classList.add('active');
    
    function updateTimer() {
        const now = new Date();
        const distance = targetDate - now;
        
        if (distance > 0) {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            // Обновление дисплея
            const daysEl = document.getElementById('days');
            const hoursEl = document.getElementById('hours');
            const minutesEl = document.getElementById('minutes');
            const secondsEl = document.getElementById('seconds');
            
            if (daysEl) daysEl.textContent = days;
            if (hoursEl) hoursEl.textContent = hours;
            if (minutesEl) minutesEl.textContent = minutes;
            if (secondsEl) secondsEl.textContent = seconds;
        } else {
            clearInterval(timerInterval);
            // Переход к торту
            timerSection.style.display = 'none';
            cakeSection.style.display = 'flex';
            
            resetCandles();
            console.log('Время пришло! Переход к торту.');
        }
    }
    
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
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

// Задувание свечи
function blowOutCandle(candleElement) {
    if (!candleElement.classList.contains('active')) return;
    
    candleElement.classList.remove('active');
    candleElement.classList.add('blown-out');
    blownCandles++;
    
    console.log(`Свеча задута! Осталось: ${totalCandles - blownCandles}`);
    
    // Проверяем, все ли свечи задуты
    if (blownCandles >= totalCandles) {
        setTimeout(function() {
            startCelebration();
        }, 1000);
    }
}

// Начало празднования
function startCelebration() {
    const cakeSection = document.getElementById('cakeSection');
    const partySection = document.getElementById('partySection');
    
    if (!cakeSection || !partySection) return;
    
    console.log('Начало празднования!');
    
    // Переход к празднованию
    cakeSection.style.display = 'none';
    partySection.style.display = 'flex';
    
    // Обновление данных празднования
    updatePartyData();
    
    // Запуск эффектов
    setTimeout(() => startConfetti(), 500);
    setTimeout(() => startFireworks(), 1000);
    
    // Запуск ротации пожеланий
    setTimeout(() => startWishRotation(), 2000);
}

// Обновление данных празднования
function updatePartyData() {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    const textColor = urlParams.get('textColor') || 'neon-pink';
    
    const partyName = document.getElementById('partyName');
    if (partyName && name) {
        partyName.textContent = name.toUpperCase();
    }
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
        
        if (!currentWish || !currentWishSender || !wishCard) return;
        
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
    wishInterval = setInterval(showNextWish, 4000);
}

// Запуск конфетти
function startConfetti() {
    const confettiContainer = document.getElementById('confetti');
    if (!confettiContainer) return;
    
    const colors = ['#ff006e', '#8b5cf6', '#fbbf24', '#06d6a0', '#ff073a', '#00ffff'];
    
    console.log('Запуск конфетти');
    
    // Очистка предыдущего конфетти
    confettiContainer.innerHTML = '';
    
    for (let i = 0; i < 100; i++) {
        setTimeout(function() {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
            confettiContainer.appendChild(confetti);
            
            setTimeout(function() {
                if (confetti.parentNode) {
                    confetti.remove();
                }
            }, 6000);
        }, i * 50);
    }
    
    // Повторяем конфетти каждые 3 секунды
    setTimeout(() => {
        const partySection = document.getElementById('partySection');
        if (partySection && partySection.style.display !== 'none') {
            startConfetti();
        }
    }, 3000);
}

// Запуск фейерверков
function startFireworks() {
    const fireworksContainer = document.getElementById('fireworks');
    if (!fireworksContainer) return;
    
    const colors = ['#ff006e', '#8b5cf6', '#fbbf24', '#06d6a0', '#ff073a', '#00ffff'];
    
    console.log('Запуск фейерверков');
    
    for (let i = 0; i < 8; i++) {
        setTimeout(function() {
            const firework = document.createElement('div');
            firework.className = 'firework';
            firework.style.left = (Math.random() * 80 + 10) + '%';
            firework.style.top = (Math.random() * 80 + 10) + '%';
            firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            firework.style.width = Math.random() * 30 + 20 + 'px';
            firework.style.height = firework.style.width;
            firework.style.boxShadow = `0 0 30px ${colors[Math.floor(Math.random() * colors.length)]}`;
            fireworksContainer.appendChild(firework);
            
            setTimeout(function() {
                if (firework.parentNode) {
                    firework.remove();
                }
            }, 2000);
        }, i * 500);
    }
    
    // Повторяем фейерверки каждые 6 секунд
    setTimeout(() => {
        const partySection = document.getElementById('partySection');
        if (partySection && partySection.style.display !== 'none') {
            startFireworks();
        }
    }, 6000);
}

// Очистка при уходе со страницы
window.addEventListener('beforeunload', function() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    if (wishInterval) {
        clearInterval(wishInterval);
    }
});

console.log('Скрипт открытки день рождения загружен');



