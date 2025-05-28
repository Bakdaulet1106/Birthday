// Ашық хат деректері
let wishes = [];
let currentWishIndex = 0;
let wishInterval;
let blownCandles = 0;
let totalCandles = 5;
let audioContext;
let micStream;
let analyser;
let isListening = false;
const MAX_WISHES = 25;

// Бет жүктелгенде инициализация
document.addEventListener('DOMContentLoaded', function() {
    setupEditor();
    setupEventListeners();
    checkURLParams();
    setupAudio();
    updateWishCounter();
});

// Редактор орнату
function setupEditor() {
    updatePreview();
    
    // Өрістер өзгергенде алдын ала көруді жаңарту
    document.getElementById('birthdayName').addEventListener('input', updatePreview);
    document.getElementById('senderName').addEventListener('input', updatePreview);
    document.getElementById('fontSelect').addEventListener('change', updatePreview);
    document.getElementById('backgroundSelect').addEventListener('change', updatePreview);
    document.getElementById('textColorSelect').addEventListener('change', updatePreview);
}

// Оқиға өңдегіштерін орнату
function setupEventListeners() {
    // Алғашқы әрекет кезінде микрофон рұқсатын сұрау
    document.addEventListener('click', requestMicrophoneAccess, { once: true });
    
    // Тілектер өрісінде Enter үшін өңдегіш
    document.getElementById('wishInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addWish();
        }
    });
}

// Микрофон қолжетімділігін сұрау
function requestMicrophoneAccess() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                micStream = stream;
                console.log('Микрофон қосылды');
            })
            .catch(function(err) {
                console.log('Микрофон қолжетімсіз:', err);
            });
    }
}

// Аудио контекстін орнату
function setupAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('AudioContext қолдаумен қамтамасыз етілмейді:', e);
    }
}

// Шамдарды сөндіру үшін дыбыс танумен жұмыс
function setupBlowDetection() {
    if (!micStream || !audioContext) {
        console.log('Микрофон немесе аудио контекст қолжетімсіз');
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
            
            // Үрлеуді анықтау үшін дыбыс талдау
            let sum = 0;
            let highFreqSum = 0;
            
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
                if (i > dataArray.length * 0.7) { // жоғары жиіліктер
                    highFreqSum += dataArray[i];
                }
            }
            
            let average = sum / dataArray.length;
            let highFreqAverage = highFreqSum / (dataArray.length * 0.3);
            
            const now = Date.now();
            
            // Үрлеудің сипатты дыбысын анықтау (жоғары жиіліктер + жалпы дауыстылық)
            if (average > 60 && highFreqAverage > 40 && 
                document.getElementById('cakeSection').classList.contains('active') &&
                now - lastBlowTime > 800) {
                
                console.log('Үрлеу анықталды!', { average, highFreqAverage });
                blowRandomCandle();
                lastBlowTime = now;
            }
            
            if (isListening) {
                requestAnimationFrame(detectBlow);
            }
        }
        
        detectBlow();
        console.log('Үрлеуді тану жүйесі іске қосылды');
    } catch (error) {
        console.log('Дыбыс танумен орнату қатесі:', error);
    }
}

// Кездейсоқ белсенді шамды сөндіру
function blowRandomCandle() {
    const activeCandles = document.querySelectorAll('.candle.active');
    if (activeCandles.length > 0) {
        const randomIndex = Math.floor(Math.random() * activeCandles.length);
        blowOutCandle(activeCandles[randomIndex]);
    }
}

// Бір шамды сөндіру (басу немесе үрлеу арқылы шақырылады)
function blowOutCandle(candleElement) {
    if (!candleElement.classList.contains('active')) return;
    
    candleElement.classList.remove('active');
    candleElement.classList.add('blown-out');
    blownCandles++;
    
    // Дыбыс ойнату
    playSound('candleBlowSound');
    
    console.log(`Шам сөндірілді! Қалды: ${totalCandles - blownCandles}`);
    
    // Барлық шамдар сөндірілгенін тексеру
    if (blownCandles >= totalCandles) {
        setTimeout(function() {
            startCelebration();
        }, 1500);
    }
}

// Дыбыс ойнату
function playSound(soundId, fallbackFreq = 800) {
    try {
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.currentTime = 0;
            audio.volume = 0.7;
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(function(error) {
                    console.log('Аудио файлды ойнату мүмкін емес:', error);
                    createBeepSound(fallbackFreq, 300);
                });
            }
        } else {
            createBeepSound(fallbackFreq, 300);
        }
    } catch (error) {
        console.log('Дыбыс ойнату қатесі:', error);
        createBeepSound(fallbackFreq, 300);
    }
}

// Дыбысты бағдарламалық түрде жасау
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
        console.log('Дыбыс жасау мүмкін емес:', error);
    }
}

// Тілек қосу
function addWish() {
    if (wishes.length >= MAX_WISHES) {
        alert(`Максимум ${MAX_WISHES} тілек қосуға болады!`);
        return;
    }

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
        updateWishCounter();
        updatePreview();
        
        console.log('Тілек қосылды:', wish);
    }
}

// Тілектер санағышын жаңарту
function updateWishCounter() {
    const wishCount = document.getElementById('wishCount');
    if (wishCount) {
        wishCount.textContent = wishes.length;
        
        // Максимумға жақындағанда түс өзгерту
        const counter = wishCount.parentElement;
        if (wishes.length >= MAX_WISHES) {
            counter.style.color = '#ff006e';
            counter.style.fontWeight = 'bold';
        } else if (wishes.length >= MAX_WISHES * 0.8) {
            counter.style.color = '#ffd700';
        } else {
            counter.style.color = '#8b5cf6';
            counter.style.fontWeight = 'normal';
        }
    }
}

// Тілектер тізімін жаңарту
function updateWishList() {
    const wishList = document.getElementById('wishList');
    wishList.innerHTML = '';
    
    wishes.forEach((wish, index) => {
        const wishItem = document.createElement('div');
        wishItem.className = 'wish-item';
        wishItem.innerHTML = `
            <div class="wish-item-content">
                <div class="wish-item-text">${wish.text}</div>
                <div class="wish-item-details">Кімнен: ${wish.sender} | ${wish.font} | ${wish.background} | ${wish.textColor}</div>
            </div>
            <button onclick="removeWish(${index})">Жою</button>
        `;
        wishList.appendChild(wishItem);
    });
}

// Тілекті жою
function removeWish(index) {
    wishes.splice(index, 1);
    updateWishList();
    updateWishCounter();
    updatePreview();
}

// Алдын ала көруді жаңарту
function updatePreview() {
    const name = document.getElementById('birthdayName').value || 'АТЫ';
    const sender = document.getElementById('senderName').value || 'Сіздің атыңыз';
    const font = document.getElementById('fontSelect').value;
    const background = document.getElementById('backgroundSelect').value;
    const textColor = document.getElementById('textColorSelect').value;
    
    const preview = document.getElementById('preview');
    const previewName = document.getElementById('previewName');
    const previewMainSender = document.getElementById('previewMainSender');
    const previewWishes = document.getElementById('previewWishes');
    
    // Фонды жаңарту
    preview.className = `preview-card bg-${background}`;
    
    // Қарипті жаңарту
    preview.style.fontFamily = font;
    
    // Мәтін түстерін жаңарту
    const mainTitle = preview.querySelector('.neon-preview');
    const secondaryTitle = preview.querySelector('.neon-preview-secondary');
    
    if (mainTitle) {
        mainTitle.className = `neon-preview ${textColor}`;
    }
    if (secondaryTitle) {
        secondaryTitle.className = `neon-preview-secondary ${textColor}`;
    }
    
    // Мазмұнды жаңарту
    previewName.textContent = name.toUpperCase();
    previewMainSender.textContent = `Кімнен: ${sender}`;
    
    // Алдын ала көрудегі барлық тілектерді жаңарту
    previewWishes.innerHTML = '';
    
    if (wishes.length > 0) {
        // Тек алғашқы 3 тілекті көрсету (алдын ала көруде)
        const wishesToShow = wishes.slice(0, 3);
        wishesToShow.forEach((wish, index) => {
            const wishElement = document.createElement('div');
            wishElement.className = 'preview-wish-item';
            wishElement.style.fontFamily = wish.font;
            wishElement.innerHTML = `
                <p class="preview-wish-text ${wish.textColor}">${wish.text}</p>
                <p class="preview-wish-sender">— ${wish.sender}</p>
            `;
            previewWishes.appendChild(wishElement);
        });
        
        // Егер көп тілек болса, көрсеткішті қосу
        if (wishes.length > 3) {
            const moreIndicator = document.createElement('div');
            moreIndicator.className = 'preview-wish-item';
            moreIndicator.style.opacity = '0.7';
            moreIndicator.innerHTML = `
                <p class="preview-wish-text">...және тағы ${wishes.length - 3} тілек</p>
            `;
            previewWishes.appendChild(moreIndicator);
        }
    } else {
        const defaultWish = document.createElement('div');
        defaultWish.className = 'preview-wish-item';
        defaultWish.innerHTML = `
            <p class="preview-wish-text">Тілектер қосыңыз...</p>
            <p class="preview-wish-sender">— Кімнен</p>
        `;
        previewWishes.appendChild(defaultWish);
    }
}

// Сілтеме генерациялау
function generateLink() {
    const name = document.getElementById('birthdayName').value;
    const date = document.getElementById('birthdayDate').value;
    const sender = document.getElementById('senderName').value;
    const font = document.getElementById('fontSelect').value;
    const background = document.getElementById('backgroundSelect').value;
    const textColor = document.getElementById('textColorSelect').value;
    
    if (!name || !date || !sender || wishes.length === 0) {
        alert('Барлық өрістерді толтырып, кемінде бір тілек қосыңыз!');
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
    
    // Сілтемені алмасу буферіне көшіру
    navigator.clipboard.writeText(link).then(function() {
        alert('Сілтеме алмасу буферіне көшірілді!');
    }).catch(function() {
        // Ескі браузерлер үшін резерв
        const textArea = document.createElement('textarea');
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Сілтеме алмасу буферіне көшірілді!');
    });
}

// URL параметрлерін тексеру
function checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('name')) {
        // Мереке бетіне көшу
        document.getElementById('editor').classList.remove('active');
        document.getElementById('celebration').classList.add('active');
        
        // URL-дан деректерді алу
        const name = urlParams.get('name');
        const date = urlParams.get('date');
        const sender = urlParams.get('sender');
        const font = urlParams.get('font') || 'Dancing Script';
        const background = urlParams.get('background') || 'purple-pink';
        const textColor = urlParams.get('textColor') || 'neon-pink';
        wishes = JSON.parse(urlParams.get('wishes') || '[]');
        
        console.log('URL-дан деректер:', { name, date, sender, wishes });
        
        // Параметрлерді қолдану
        document.body.style.fontFamily = font;
        document.getElementById('celebration').className = `page active bg-${background}`;
        
        // Фондық музыканы ойнату
        playSound('birthdayMusic');
        
        // Таймерді іске қосу
        startTimer(new Date(date), name, sender, textColor);
    }
}

// Таймерді іске қосу
function startTimer(targetDate, name, sender, textColor) {
    const timerSection = document.getElementById('timerSection');
    const cakeSection = document.getElementById('cakeSection');
    
    timerSection.classList.add('active');
    
    const timer = setInterval(function() {
        const now = new Date();
        const distance = targetDate - now;
        
        if (distance > 0) {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            // Сандық дисплейді жаңарту
            document.getElementById('days').textContent = days.toString().padStart(2, '0');
            document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
            document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        } else {
            clearInterval(timer);
            // Тортқа көшу
            timerSection.classList.remove('active');
            cakeSection.classList.add('active');
            
            // Шамдар күйін қалпына келтіру
            resetCandles();
            
            // Үрлеуді тану жүйесін іске қосу
            setupBlowDetection();
            
            console.log('Уақыт келді! Тортқа көшу.');
        }
    }, 1000);
}

// Шамдар күйін қалпына келтіру
function resetCandles() {
    blownCandles = 0;
    const candles = document.querySelectorAll('.candle');
    candles.forEach(candle => {
        candle.classList.add('active');
        candle.classList.remove('blown-out');
    });
    
    console.log('Шамдар қалпына келтірілді');
}

// Мерекелеуді бастау
function startCelebration() {
    const cakeSection = document.getElementById('cakeSection');
    const partySection = document.getElementById('partySection');
    
    // Микрофон тыңдауын тоқтату
    isListening = false;
    
    console.log('Мерекелеу басталды!');
    
    // Мереке дыбысын ойнату
    playSound('celebrationSound', 1000);
    
    // Эффекттерді іске қосу
    setTimeout(() => startConfetti(), 500);
    setTimeout(() => startFireworks(), 1000);
    
    // Мерекеге көшу
    cakeSection.classList.remove('active');
    partySection.classList.add('active');
    
    // Мереке деректерін жаңарту
    updatePartyData();
    
    // Тілектер айналымын іске қосу
    setTimeout(() => startWishRotation(), 2000);
}

// Мереке деректерін жаңарту
function updatePartyData() {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    const textColor = urlParams.get('textColor') || 'neon-pink';
    
    document.getElementById('partyName').textContent = name.toUpperCase();
    
    // Түстерді қолдану
    const partyTitle = document.querySelector('.party-title');
    const partyName = document.querySelector('.party-name');
    const partySubtitle = document.querySelector('.party-subtitle');
    
    if (partyTitle) partyTitle.className = `neon-text party-title ${textColor}`;
    if (partyName) partyName.className = `neon-text-secondary party-name ${textColor}`;
    if (partySubtitle) partySubtitle.className = `neon-text-tertiary party-subtitle ${textColor}`;
}

// Тілектер айналымын іске қосу
function startWishRotation() {
    if (wishes.length === 0) {
        console.log('Көрсету үшін тілектер жоқ');
        return;
    }
    
    console.log('Тілектер айналымын іске қосу:', wishes.length);
    
    function showNextWish() {
        const currentWish = document.getElementById('currentWish');
        const currentWishSender = document.getElementById('currentWishSender');
        const wishCard = document.getElementById('wishCard');
        
        if (currentWishIndex >= wishes.length) {
            currentWishIndex = 0;
        }
        
        const wish = wishes[currentWishIndex];
        
        // Тілек стильдерін қолдану
        wishCard.className = `wish-card bg-${wish.background}`;
        wishCard.style.fontFamily = wish.font;
        
        currentWish.textContent = wish.text;
        currentWish.className = `wish-text ${wish.textColor}`;
        
        currentWishSender.textContent = `— ${wish.sender}`;
        currentWishSender.className = `wish-sender ${wish.textColor}`;
        
        console.log('Тілек көрсетілді:', wish.text, 'кімнен', wish.sender);
        
        currentWishIndex = (currentWishIndex + 1) % wishes.length;
    }
    
    showNextWish();
    wishInterval = setInterval(showNextWish, 6000);
}

// Конфетти іске қосу
function startConfetti() {
    const confettiContainer = document.getElementById('confetti');
    const colors = ['#ff006e', '#8b5cf6', '#fbbf24', '#06d6a0', '#ff073a', '#00ffff'];
    
    console.log('Конфетти іске қосылды');
    
    // Алдыңғы конфеттиді тазалау
    confettiContainer.innerHTML = '';
    
    for (let i = 0; i < 200; i++) {
        setTimeout(function() {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
            confetti.style.width = (Math.random() * 12 + 8) + 'px';
            confetti.style.height = confetti.style.width;
            confetti.style.borderRadius = '50%';
            confettiContainer.appendChild(confetti);
            
            setTimeout(function() {
                if (confetti.parentNode) {
                    confetti.remove();
                }
            }, 6000);
        }, i * 20);
    }
    
    // Конфеттиді әр 4 секундта қайталау
    setTimeout(() => {
        if (document.getElementById('partySection').classList.contains('active')) {
            startConfetti();
        }
    }, 4000);
}

// Фейерверктерді іске қосу
function startFireworks() {
    const fireworksContainer = document.getElementById('fireworks');
    const colors = ['#ff006e', '#8b5cf6', '#fbbf24', '#06d6a0', '#ff073a', '#00ffff'];
    
    console.log('Фейерверктер іске қосылды');
    
    // Фейерверк дыбысын ойнату
    playSound('fireworkSound', 1200);
    
    for (let i = 0; i < 15; i++) {
        setTimeout(function() {
            const firework = document.createElement('div');
            firework.className = 'firework';
            firework.style.left = (Math.random() * 80 + 10) + '%';
            firework.style.top = (Math.random() * 80 + 10) + '%';
            firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            firework.style.width = Math.random() * 25 + 20 + 'px';
            firework.style.height = firework.style.width;
            firework.style.boxShadow = `0 0 40px ${colors[Math.floor(Math.random() * colors.length)]}`;
            firework.style.animationDuration = (Math.random() * 1 + 1.5) + 's';
            fireworksContainer.appendChild(firework);
            
            setTimeout(function() {
                if (firework.parentNode) {
                    firework.remove();
                }
            }, 3000);
        }, i * 300);
    }
    
    // Фейерверктерді әр 8 секундта қайталау
    setTimeout(() => {
        if (document.getElementById('partySection').classList.contains('active')) {
            startFireworks();
        }
    }, 8000);
}

// Беттен кеткенде микрофонды тоқтату
window.addEventListener('beforeunload', function() {
    isListening = false;
    if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
    }
    if (wishInterval) {
        clearInterval(wishInterval);
    }
});

// Қателерді өңдеу
window.addEventListener('error', function(e) {
    console.log('Қате:', e.error);
});

console.log('Туған күн скрипті жүктелді');


