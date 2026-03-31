const canvas = document.getElementById('nousCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let mouse = { x: -1000, y: -1000, active: false };
const panel = document.getElementById('manifesto-display');
const titleElem = document.getElementById('manifesto-title');
const textElem = document.getElementById('manifesto-text');

// Frases del Manifiesto de Anticitera
const dogmas = [
    { title: "La Doctrina .IA", text: "La tecnología no reemplaza a la humanidad; la eleva. Inteligencia Aumentada sobre Artificial." },
    { title: "Nación de Nodos", text: "Nuestros pasaportes son claves criptográficas. Nuestra tierra es la red." },
    { title: "Alianza Algorítmica", text: "La Máquina aporta la lógica sin sesgo. El Humano aporta la ética y la consciencia creativa." },
    { title: "Soberanía Cognitiva", text: "El mundo digital está fracturado por fronteras físicas obsoletas. Nosotros declaramos independencia." },
    { title: "El Juramento", text: "Nos dedicamos a un ecosistema descentralizado, resistente a la censura y promotor del conocimiento." }
];

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// Interacción del cursor
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
});

window.addEventListener('mouseout', () => {
    mouse.active = false;
    mouse.x = -1000;
    mouse.y = -1000;
    panel.classList.remove('show');
    panel.classList.add('hidden');
});

let lastClickTime = 0;
window.addEventListener('click', (e) => {
    if (Date.now() - lastClickTime < 1500) return; // Prevent spamming
    lastClickTime = Date.now();

    // Spawn burst
    for(let i = 0; i < 15; i++) {
        particles.push(new Particle(mouse.x, mouse.y, true));
    }

    // Mostrar dogma aleatorio
    const dogma = dogmas[Math.floor(Math.random() * dogmas.length)];
    titleElem.innerText = dogma.title;
    textElem.innerText = dogma.text;

    panel.classList.remove('hidden');
    panel.classList.add('show');
});

// Partícula
class Particle {
    constructor(x, y, isBurst = false) {
        this.x = x || Math.random() * width;
        this.y = y || Math.random() * height;
        this.vx = (Math.random() - 0.5) * (isBurst ? 5 : 1);
        this.vy = (Math.random() - 0.5) * (isBurst ? 5 : 1);
        this.radius = Math.random() * 2 + 1;
        this.color = Math.random() > 0.8 ? '#d4af37' : '#00d2ff'; // Bronce o Neón
        this.life = isBurst ? 100 : Infinity;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Rebote simple
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Atracción al ratón
        if (mouse.active) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 150) {
                this.x -= dx * 0.02; // Fugarse levemente
                this.y -= dy * 0.02;
            }
        }

        if (this.life !== Infinity) this.life--;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        
        let opacity = this.life === Infinity ? 0.7 : this.life / 100;
        ctx.globalAlpha = opacity;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Brillo sutil
        if (this.radius > 2) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

// Iniciar red
for (let i = 0; i < 120; i++) {
    particles.push(new Particle());
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    // Conexiones sinápticas
    for (let i = 0; i < particles.length; i++) {
        let p1 = particles[i];
        p1.update();
        p1.draw();

        if (p1.life <= 0) {
            particles.splice(i, 1);
            i--;
            continue;
        }

        for (let j = i + 1; j < particles.length; j++) {
            let p2 = particles[j];
            let dx = p1.x - p2.x;
            let dy = p1.y - p2.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                
                let isBronze = p1.color === '#d4af37' || p2.color === '#d4af37';
                ctx.strokeStyle = isBronze ? `rgba(212, 175, 55, ${1 - dist/100})` : `rgba(0, 210, 255, ${1 - dist/100})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }

        // Conectar al ratón
        if (mouse.active) {
            let dx = p1.x - mouse.x;
            let dy = p1.y - mouse.y;
            let distMouse = Math.sqrt(dx * dx + dy * dy);
            
            if (distMouse < 180) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.strokeStyle = `rgba(212, 175, 55, ${(180 - distMouse)/200})`; // Hilo dorado hacia el usuario
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(animate);
}

// Spark
setTimeout(animate, 100);
