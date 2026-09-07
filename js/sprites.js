/**
 * Sprites & Graphics Manager
 * Maneja la carga y el procesamiento de texturas pixel art,
 * conversión de fondos negros a transparencia alfa, y generadores procedimentales.
 */
class SpriteManager {
    constructor() {
        this.loaded = false;
        this.images = {};
        this.coinFrames = [];
        this.bossCanvas = null;
        this.playerShipCanvas = null;
        this.ufoCanvas = null;
        this.bgImage = null;
    }

    async init() {
        try {
            // Cargar imagen de fondo
            this.bgImage = await this.loadImage('assets/space_bg.jpg');

            // Cargar y procesar con chroma-key para transparencia la nave y el ovni
            const rawPlayer = await this.loadImage('assets/player_ship.jpg');
            this.playerShipCanvas = this.createTransparentSprite(rawPlayer, 30);

            const rawUfo = await this.loadImage('assets/ufo_enemy.jpg');
            this.ufoCanvas = this.createTransparentSprite(rawUfo, 28);
        } catch (e) {
            console.warn("Recursos de imagen no cargados directamente, usando generación procedural:", e);
        }

        // Generar sprites procedurales para monedas y el súper jefe
        this.generateCoinFrames();
        this.generateBossSprite();
        if (!this.playerShipCanvas) this.generateFallbackPlayerSprite();
        if (!this.ufoCanvas) this.generateFallbackUfoSprite();

        this.loaded = true;
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = src;
        });
    }

    /**
     * Elimina el fondo negro o casi negro de una imagen para obtener un sprite con canal alfa
     */
    createTransparentSprite(img, threshold = 35) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // Si el color es negro o muy oscuro (fondo)
                if (r < threshold && g < threshold && b < threshold) {
                    data[i + 3] = 0; // Alfa transparente
                } else if (r < threshold * 1.5 && g < threshold * 1.5 && b < threshold * 1.5) {
                    // Suavizado suave en bordes de transición
                    const factor = Math.max(r, g, b) / (threshold * 1.5);
                    data[i + 3] = Math.floor(factor * 255);
                }
            }

            ctx.putImageData(imgData, 0, 0);
            return canvas;
        } catch (e) {
            console.warn("Chroma-key no disponible por restricciones de origen local (file://), usando sprite render:", e);
            return null;
        }
    }

    /**
     * Genera la animación de 4 fotogramas para la moneda dorada pixel art
     */
    generateCoinFrames() {
        this.coinFrames = [];
        const frameWidths = [16, 12, 6, 12]; // Simulación de rotación 3D en 2D pixelado

        for (let f = 0; f < 4; f++) {
            const canvas = document.createElement('canvas');
            canvas.width = 20;
            canvas.height = 20;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;

            const w = frameWidths[f];
            const x = (20 - w) / 2;

            // Borde oscuro de moneda
            ctx.fillStyle = '#b8860b';
            ctx.fillRect(x, 3, w, 14);

            // Relleno dorado brillante
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(x + 1, 4, Math.max(1, w - 2), 12);

            // Brillo interior central
            ctx.fillStyle = '#fff8a6';
            ctx.fillRect(x + 2, 5, Math.max(1, w - 4), 10);

            // Símbolo de crédito central (estrella/píxel)
            if (w > 8) {
                ctx.fillStyle = '#d4af37';
                ctx.fillRect(9, 7, 2, 6);
                ctx.fillRect(7, 9, 6, 2);
            }

            this.coinFrames.push(canvas);
        }
    }

    /**
     * Genera el sprite del Súper Jefe Pixel Art (Gran Nave Nodriza Alienígena)
     */
    generateBossSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Estructura de alas gigantescas (Metal oscuro alienígena)
        ctx.fillStyle = '#1c152e';
        ctx.beginPath();
        ctx.moveTo(80, 10);
        ctx.lineTo(155, 60);
        ctx.lineTo(130, 95);
        ctx.lineTo(100, 80);
        ctx.lineTo(80, 115);
        ctx.lineTo(60, 80);
        ctx.lineTo(30, 95);
        ctx.lineTo(5, 60);
        ctx.closePath();
        ctx.fill();

        // Placas de blindaje morado / púrpura espacial
        ctx.fillStyle = '#3a2364';
        ctx.beginPath();
        ctx.moveTo(80, 20);
        ctx.lineTo(140, 62);
        ctx.lineTo(115, 85);
        ctx.lineTo(80, 95);
        ctx.lineTo(45, 85);
        ctx.lineTo(20, 62);
        ctx.closePath();
        ctx.fill();

        // Detalles metálicos y bordes cibernéticos cian
        ctx.strokeStyle = '#00f7ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cañones de plasma laterales
        ctx.fillStyle = '#222';
        ctx.fillRect(15, 65, 12, 35);
        ctx.fillRect(133, 65, 12, 35);
        ctx.fillRect(45, 80, 10, 25);
        ctx.fillRect(105, 80, 10, 25);

        // Boquillas de energía de cañones (brillo rojo peligro)
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(17, 98, 8, 5);
        ctx.fillRect(135, 98, 8, 5);
        ctx.fillRect(47, 103, 6, 4);
        ctx.fillRect(107, 103, 6, 4);

        // Núcleo reactor central (Púlsar rojo/carmesí)
        const radGrad = ctx.createRadialGradient(80, 55, 3, 80, 55, 22);
        radGrad.addColorStop(0, '#ffffff');
        radGrad.addColorStop(0.3, '#ff2266');
        radGrad.addColorStop(0.7, '#aa0033');
        radGrad.addColorStop(1, 'rgba(100, 0, 30, 0.2)');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(80, 55, 22, 0, Math.PI * 2);
        ctx.fill();

        // Rejilla de contención del núcleo
        ctx.strokeStyle = '#ffbbdd';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(70, 45, 20, 20);
        ctx.beginPath();
        ctx.moveTo(70, 45); ctx.lineTo(90, 65);
        ctx.moveTo(90, 45); ctx.lineTo(70, 65);
        ctx.stroke();

        // Ojo alienígena cibernético en la cabina
        ctx.fillStyle = '#00ffcc';
        ctx.fillRect(72, 24, 16, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(78, 25, 4, 4);

        this.bossCanvas = canvas;
    }

    generateFallbackPlayerSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Alas exteriores y cuerpo principal (Cian espacial oscuro)
        ctx.fillStyle = '#08738a';
        ctx.beginPath();
        ctx.moveTo(24, 2);
        ctx.lineTo(46, 38);
        ctx.lineTo(36, 42);
        ctx.lineTo(24, 38);
        ctx.lineTo(12, 42);
        ctx.lineTo(2, 38);
        ctx.closePath();
        ctx.fill();

        // Blindaje frontal cian luminoso
        ctx.fillStyle = '#00f7ff';
        ctx.beginPath();
        ctx.moveTo(24, 4);
        ctx.lineTo(40, 34);
        ctx.lineTo(32, 36);
        ctx.lineTo(24, 32);
        ctx.lineTo(16, 36);
        ctx.lineTo(8, 34);
        ctx.closePath();
        ctx.fill();

        // Líneas de armadura blancas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(23, 6, 2, 14);
        ctx.fillRect(16, 26, 3, 6);
        ctx.fillRect(29, 26, 3, 6);

        // Cabina de energía (Azul eléctrico brillante)
        ctx.fillStyle = '#003366';
        ctx.fillRect(20, 16, 8, 11);
        ctx.fillStyle = '#70e4ff';
        ctx.fillRect(22, 17, 4, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(23, 18, 2, 3);

        // Cañones en los extremos de las alas
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(5, 24, 3, 10);
        ctx.fillRect(40, 24, 3, 10);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(5, 22, 3, 3);
        ctx.fillRect(40, 22, 3, 3);

        // Toberas de propulsión dobles
        ctx.fillStyle = '#333333';
        ctx.fillRect(15, 38, 6, 5);
        ctx.fillRect(27, 38, 6, 5);
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(16, 42, 4, 4);
        ctx.fillRect(28, 42, 4, 4);
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(17, 44, 2, 3);
        ctx.fillRect(29, 44, 2, 3);

        this.playerShipCanvas = canvas;
    }

    generateFallbackUfoSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Cúpula de cristal extraterrestre verde fluorescente
        const domeGrad = ctx.createRadialGradient(24, 15, 2, 24, 15, 14);
        domeGrad.addColorStop(0, '#aaff66');
        domeGrad.addColorStop(0.6, '#00e64d');
        domeGrad.addColorStop(1, '#006622');

        ctx.fillStyle = domeGrad;
        ctx.beginPath();
        ctx.arc(24, 17, 13, Math.PI, 0);
        ctx.fill();

        // Silueta del alienígena en el interior
        ctx.fillStyle = '#052b05';
        ctx.beginPath();
        ctx.ellipse(24, 15, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Ojos negros grandes alienígenas
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(22, 14, 1.8, 2.2, -0.3, 0, Math.PI * 2);
        ctx.ellipse(26, 14, 1.8, 2.2, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Platillo metálico plateado / titanio
        ctx.fillStyle = '#363d4a';
        ctx.beginPath();
        ctx.ellipse(24, 26, 23, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#6f7a8c';
        ctx.beginPath();
        ctx.ellipse(24, 25, 20, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Borde inferior oscuro
        ctx.fillStyle = '#1e2129';
        ctx.beginPath();
        ctx.ellipse(24, 28, 17, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 5 Balizas luminosas secuenciales en el borde del platillo
        const lights = ['#ff0055', '#ffbb00', '#00ffcc', '#ff00aa', '#00e5ff'];
        for (let i = 0; i < 5; i++) {
            const lx = 7 + i * 8.5;
            const ly = 27 + Math.sin((i / 4) * Math.PI) * 2;
            ctx.fillStyle = lights[i];
            ctx.beginPath();
            ctx.arc(lx, ly, 2.2, 0, Math.PI * 2);
            ctx.fill();
            // Reflejo
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(lx - 0.7, ly - 0.7, 1.4, 1.4);
        }

        // Tren de propulsión inferior (rayo tractor/antigravedad)
        ctx.fillStyle = '#00ffcc';
        ctx.fillRect(21, 33, 6, 3);

        this.ufoCanvas = canvas;
    }
}

window.spriteManager = new SpriteManager();
