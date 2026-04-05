import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// La configuración se carga desde config.js (no rastreado por git)
const firebaseConfig = CONFIG.firebaseConfig;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const canvas = document.getElementById('nousCanvas');
const ctx = canvas.getContext('2d');

let infrastructureData = null; // Telemetría (Firestore)
let staticInfra = null;      // Cartografía (JSON)

const infraPanel = document.getElementById('infra-panel');
const infraContent = document.getElementById('infra-content');
const netToggle = document.getElementById('net-toggle');
const closePanel = document.getElementById('close-panel');

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

        // Si es una partícula vinculada a infraestructura real, brilla más
        if (this.isStation) {
            opacity = 1.0;
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
        }

        ctx.globalAlpha = opacity;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Brillo sutil
        if (this.radius > 2 || this.isStation) {
            ctx.shadowBlur = this.isStation ? 25 : 10;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        if (this.label) {
            ctx.fillStyle = "#fff";
            ctx.font = "10px monospace";
            ctx.fillText(this.label, this.x + 10, this.y + 5);
        }
    }
}

// Estaciones de Infraestructura (Nodos Fijos)
let stations = {};

async function fetchInfrastructure() {
    try {
        const response = await fetch('infrastructure.json');
        staticInfra = await response.json();
        renderInfraPanel();
        initializeStations();
    } catch (error) {
        console.error("Error cargando cartografía:", error);
        infraContent.innerHTML = "<p class='error'>Error al leer protocolos de red.</p>";
    }
}

function initializeStations() {
    if (!staticInfra) return;
    
    // Posicionamiento inteligente basado en Tier
    staticInfra.nodes.forEach((node, index) => {
        let x, y, color, radius;
        
        switch(node.tier) {
            case 'local':
                x = width * (0.2 + (index * 0.1));
                y = height * 0.5;
                color = "#00d2ff"; // Azul Neón
                radius = 8;
                break;
            case 'cloud':
                x = width * 0.8;
                y = height * 0.3;
                color = "#00ffa3"; // Verde Neón
                radius = 6;
                break;
            case 'edge':
                x = width * (0.4 + (index * 0.05));
                y = height * 0.7;
                color = "#a855f7"; // Púrpura
                radius = 5;
                break;
            default:
                x = Math.random() * width;
                y = Math.random() * height;
                color = "#fff";
                radius = 4;
        }

        const p = new Particle(x, y);
        p.isStation = true;
        p.radius = radius;
        p.color = color;
        p.label = node.id.toUpperCase();
        p.vx = p.vy = 0;
        stations[node.id] = p;
    });

    // Iniciar red de partículas aleatorias (relleno)
    for (let i = 0; i < 100; i++) {
        particles.push(new Particle());
    }
}

function renderInfraPanel() {
    if (!staticInfra) return;

    let html = '';
    
    // Agrupar por Tier
    const tiers = {
        'local': 'INFRAESTRUCTURA_LOCAL (CABLE)',
        'cloud': 'INFRAESTRUCTURA_NUBE (GCP)',
        'edge': 'INFRAESTRUCTURA_EDGE (WIFI)'
    };

    Object.entries(tiers).forEach(([tierKey, tierTitle]) => {
        const nodes = staticInfra.nodes.filter(n => n.tier === tierKey);
        if (nodes.length > 0) {
            html += `
            <div class="infra-tier">
                <h3>${tierTitle}</h3>
                <div class="nodes-list">
                    ${nodes.map(n => `
                        <div class="node-item">
                            <span class="node-name">${n.name}</span>
                            <span class="node-role">${n.role}</span>
                            <div class="node-meta">${n.ip_local || n.ip_publica || 'IP: DINÁMICA'} // ${n.interface}</div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
    });

    // Dominios
    html += `
    <div class="infra-tier">
        <h3>DOMINIOS_OPERATIVOS</h3>
        <div class="domain-grid">
            ${[...staticInfra.domains.core, ...staticInfra.domains.satellites, ...staticInfra.domains.decentralized].map(d => `
                <div class="domain-item">
                    <a href="https://${d.url}" target="_blank" class="domain-url">${d.url}</a>
                    <span class="node-role">${d.service}</span>
                </div>
            `).join('')}
        </div>
    </div>`;

    infraContent.innerHTML = html;
}

// Eventos de Panel
netToggle.addEventListener('click', () => {
    infraPanel.classList.toggle('hidden');
});

closePanel.addEventListener('click', () => {
    infraPanel.classList.add('hidden');
});

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

    // Dibujar y actualizar estaciones fijas
    Object.values(stations).forEach(s => {
        // Si hay datos, hacer que el tamaño de M2 pulse con la CPU
        if (s.label === "M2" && infrastructureData?.node_m2) {
            s.radius = 8 + (infrastructureData.node_m2.cpu_percent / 20);
        }
        
        // Si el MCP no está activo, atenuarlo
        if (s.label === "GCLOUD_MCP" && infrastructureData?.mcp) {
            s.color = infrastructureData.mcp.active ? "#a855f7" : "#4b5563";
        }

        s.update();
        s.draw();
        
        // Nexos automáticos entre estaciones (Local -> Cloud)
        if (stations.m2 && stations.gcp) {
            ctx.beginPath();
            ctx.moveTo(stations.m2.x, stations.m2.y);
            ctx.lineTo(stations.gcp.x, stations.gcp.y);
            ctx.strokeStyle = "rgba(212, 175, 55, 0.2)";
            ctx.setLineDash([5, 15]); // Línea discontinua para el túnel local-nube
            ctx.stroke();
            ctx.setLineDash([]);
        }
    });

    requestAnimationFrame(animate);
}

// Conexión en tiempo real con la infraestructura
onSnapshot(doc(db, "metadata", "infrastructure"), (doc) => {
    if (doc.exists()) {
        infrastructureData = doc.data();
        console.log("Telemetría actualizada:", infrastructureData);
        
        // Actualizar UI básica
        const statusText = document.querySelector('.status-indicator span:last-child');
        if (statusText && infrastructureData.node_m2) {
            statusText.innerText = `NEXO_M2 // CPU: ${infrastructureData.node_m2.cpu_percent}%`;
        }
    }
});

// Spark: Iniciamos el bucle de animación y carga de infra
fetchInfrastructure();
setTimeout(animate, 100);
