
// Matrix Rain Effect
class MatrixRain {
    constructor() {
        this.canvas = document.getElementById('matrixCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.initCanvas();
        this.initMatrix();
        this.animate();
        
        window.addEventListener('resize', () => this.initCanvas());
    }
    
    initCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    initMatrix() {
        this.matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
        this.matrixArray = this.matrix.split("");
        
        this.font_size = 10;
        this.columns = this.canvas.width / this.font_size;
        
        this.drops = [];
        for(let x = 0; x < this.columns; x++) {
            this.drops[x] = 1;
        }
    }
    
    animate() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = this.font_size + 'px arial';
        
        for(let i = 0; i < this.drops.length; i++) {
            const text = this.matrixArray[Math.floor(Math.random() * this.matrixArray.length)];
            this.ctx.fillText(text, i * this.font_size, this.drops[i] * this.font_size);
            
            if(this.drops[i] * this.font_size > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            this.drops[i]++;
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

// Birthday Timer
class BirthdayTimer {
    constructor() {
        this.targetDate = new Date('2025-06-11T10:00:00').getTime();
        this.timerSection = document.getElementById('timerSection');
        this.birthdaySection = document.getElementById('birthdaySection');
        this.updateTimer();
        this.interval = setInterval(() => this.updateTimer(), 1000);
    }
    
    updateTimer() {
        const now = new Date().getTime();
        const distance = this.targetDate - now;
        
        if (distance < 0) {
            this.showBirthdayMessage();
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }
    
    showBirthdayMessage() {
        clearInterval(this.interval);
        this.timerSection.style.display = 'none';
        this.birthdaySection.style.display = 'block';
        this.startCelebration();
    }
    
    startCelebration() {
        // Create celebration particles
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createParticle();
            }, i * 100);
        }
    }
    
    createParticle() {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: #00ff00;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            box-shadow: 0 0 10px #00ff00;
        `;
        
        particle.style.left = Math.random() * window.innerWidth + 'px';
        particle.style.top = '-10px';
        
        document.body.appendChild(particle);
        
        const animation = particle.animate([
            { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
            { transform: `translateY(${window.innerHeight + 20}px) rotate(720deg)`, opacity: 0 }
        ], {
            duration: 3000 + Math.random() * 2000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        animation.onfinish = () => particle.remove();
    }
}

// Modal Controller
class ModalController {
    constructor() {
        this.modal = document.getElementById('modal');
        this.aboutBtn = document.getElementById('aboutBtn');
        this.closeBtn = document.getElementById('closeBtn');
        
        this.aboutBtn.addEventListener('click', () => this.openModal());
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }
    
    openModal() {
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Animate modal appearance
        const modalContent = this.modal.querySelector('.modal-content');
        modalContent.style.transform = 'scale(0.8) translateY(-50px)';
        modalContent.style.opacity = '0';
        
        setTimeout(() => {
            modalContent.style.transition = 'all 0.3s ease';
            modalContent.style.transform = 'scale(1) translateY(0)';
            modalContent.style.opacity = '1';
        }, 10);
    }
    
    closeModal() {
        const modalContent = this.modal.querySelector('.modal-content');
        modalContent.style.transition = 'all 0.3s ease';
        modalContent.style.transform = 'scale(0.8) translateY(-50px)';
        modalContent.style.opacity = '0';
        
        setTimeout(() => {
            this.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

// Sound Effects Controller
class SoundController {
    constructor() {
        this.audioContext = null;
        this.initAudio();
    }
    
    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API не поддерживается');
        }
    }
    
    playBeep(frequency = 440, duration = 200) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }
}

// Keyboard Effects
class KeyboardEffects {
    constructor() {
        this.soundController = new SoundController();
        this.initKeyboardListeners();
    }
    
    initKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            this.createKeyEffect(e.key);
            this.soundController.playBeep(200 + Math.random() * 800, 100);
        });
    }
    
    createKeyEffect(key) {
        const effect = document.createElement('div');
        effect.textContent = key;
        effect.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #00ff00;
            font-family: 'Orbitron', monospace;
            font-size: 2rem;
            font-weight: bold;
            pointer-events: none;
            z-index: 1000;
            text-shadow: 0 0 20px #00ff00;
        `;
        
        document.body.appendChild(effect);
        
        const animation = effect.animate([
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
            { opacity: 0, transform: 'translate(-50%, -50%) scale(2)' }
        ], {
            duration: 500,
            easing: 'ease-out'
        });
        
        animation.onfinish = () => effect.remove();
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎉 Инициализация сайта 20-летия...');
    
    // Initialize all components
    new MatrixRain();
    new BirthdayTimer();
    new ModalController();
    new KeyboardEffects();
    
    // Easter egg: Konami code
    let konamiCode = [];
    const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    
    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.code);
        if (konamiCode.length > 10) konamiCode.shift();
        
        if (JSON.stringify(konamiCode) === JSON.stringify(konamiSequence)) {
            activateEasterEgg();
            konamiCode = [];
        }
    });
    
    function activateEasterEgg() {
        const message = document.createElement('div');
        message.innerHTML = '🎮 CHEAT CODE ACTIVATED! 🎮<br>Happy 20th Birthday, Neo!';
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 0, 0.9);
            color: #000;
            padding: 2rem;
            border-radius: 10px;
            font-family: 'Orbitron', monospace;
            font-weight: bold;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 0 50px #00ff00;
        `;
        
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
    }
    
    console.log('✅ Все системы запущены!');
});

// Performance monitoring
let frameCount = 0;
let lastTime = performance.now();

function monitorPerformance() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
        console.log(`FPS: ${frameCount}`);
        frameCount = 0;
        lastTime = currentTime;
    }
    
    requestAnimationFrame(monitorPerformance);
}

monitorPerformance();


