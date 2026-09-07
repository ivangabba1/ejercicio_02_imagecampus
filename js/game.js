/**
 * Cosmic Pixel Defender - Motor Principal del Juego
 * 2D Retro Pixel Art Space Shooter
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        // Resolución fija arcade retro
        this.width = 480;
        this.height = 640;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Estados del juego: 'START', 'PLAYING', 'BOSS_ALERT', 'BOSS_FIGHT', 'GAMEOVER', 'VICTORY', 'PAUSED'
        this.state = 'START';
        this.prevState = null;

        // Estadísticas de partida
        this.lives = 3;
        this.maxLives = 3;
        this.killedUfos = 0;
        this.targetUfos = 50;
        this.coins = 0;
        this.score = 0;
        this.gameStartTime = 0;
        this.gameEndTime = 0;

        // Súper Ataque (1 minuto = 60,000 ms)
        this.superCooldown = 60000;
        this.superTimer = this.superCooldown; // Comienza listo para uso inicial
        this.superReadyNotified = true;
        this.superActiveEffect = 0; // Duración del flash visual

        // Fondo espacial animado
        this.bgY1 = 0;
        this.bgY2 = -this.height;
        this.bgSpeed = 1.2;
        this.stars = [];
        this.initStars();

        // Entidades
        this.player = null;
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.coinsList = [];
        this.particles = [];
        this.floatingTexts = [];
        this.boss = null;

        // Tiempos y oleadas
        this.lastSpawnTime = 0;
        this.spawnInterval = 1200; // ms entre ovnis
        this.lastShootTime = 0;
        this.shootInterval = 160; // ms entre disparos del jugador
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.alertTimer = 0;

        // Control de entrada (Teclado y Mouse simultáneos)
        this.keys = {};
        this.mouse = { x: this.width / 2, y: this.height - 80, isDown: false, active: false };

        this.setupEventListeners();
        this.resetGame();

        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    initStars() {
        this.stars = [];
        for (let i = 0; i < 70; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() > 0.8 ? 2 : 1,
                speed: 0.5 + Math.random() * 2,
                color: Math.random() > 0.4 ? '#ffffff' : (Math.random() > 0.5 ? '#a6e3e9' : '#f9ed69'),
                blink: Math.random() * Math.PI
            });
        }
    }

    resetGame() {
        this.lives = 3;
        this.killedUfos = 0;
        this.coins = 0;
        this.score = 0;
        this.superTimer = this.superCooldown;
        this.superReadyNotified = true;
        this.superActiveEffect = 0;
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.coinsList = [];
        this.particles = [];
        this.floatingTexts = [];
        this.boss = null;
        this.shakeTimer = 0;
        this.alertTimer = 0;
        this.lastSpawnTime = performance.now();

        this.player = {
            x: this.width / 2 - 20,
            y: this.height - 90,
            width: 40,
            height: 40,
            speed: 5.5,
            invulnerableTime: 0,
            flameAnim: 0
        };
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (e.code === 'KeyP' || e.code === 'Escape') {
                this.togglePause();
            }

            if (e.code === 'KeyE' || e.code === 'KeyQ') {
                this.triggerSuperAttack();
            }

            if (this.state === 'START' && (e.code === 'Space' || e.code === 'Enter')) {
                this.startGame();
            }

            if ((this.state === 'GAMEOVER' || this.state === 'VICTORY') && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR')) {
                this.resetGame();
                this.startGame();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse
        const getCanvasCoords = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        };

        this.canvas.addEventListener('mousemove', (e) => {
            const coords = getCanvasCoords(e);
            this.mouse.x = coords.x;
            this.mouse.y = coords.y;
            this.mouse.active = true;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Clic izquierdo
                this.mouse.isDown = true;
                this.mouse.active = true;
                window.soundEngine.resume();

                if (this.state === 'START') {
                    this.startGame();
                } else if (this.state === 'GAMEOVER' || this.state === 'VICTORY') {
                    this.resetGame();
                    this.startGame();
                }
            } else if (e.button === 2) { // Clic derecho para súper ataque
                e.preventDefault();
                this.triggerSuperAttack();
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.isDown = false;
            }
        });

        // Botón HTML de Súper Ataque
        const superBtn = document.getElementById('superAttackBtn');
        if (superBtn) {
            superBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.soundEngine.resume();
                this.triggerSuperAttack();
            });
        }

        // Botón de Pausa HTML
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.togglePause();
            });
        }

        // Botón de Audio HTML
        const audioBtn = document.getElementById('audioBtn');
        if (audioBtn) {
            audioBtn.addEventListener('click', () => {
                window.soundEngine.resume();
                const muted = window.soundEngine.toggleMute();
                audioBtn.innerHTML = muted ? '🔇 MUTE' : '🔊 SONIDO';
                audioBtn.classList.toggle('muted', muted);
            });
        }

        // Botones de Pantallas Modales
        const btnStart = document.getElementById('btnStart');
        if (btnStart) {
            btnStart.addEventListener('click', () => {
                window.soundEngine.resume();
                this.startGame();
            });
        }

        const btnRestart = document.getElementById('btnRestart');
        if (btnRestart) {
            btnRestart.addEventListener('click', () => {
                window.soundEngine.resume();
                this.resetGame();
                this.startGame();
            });
        }

        const btnPlayAgain = document.getElementById('btnPlayAgain');
        if (btnPlayAgain) {
            btnPlayAgain.addEventListener('click', () => {
                window.soundEngine.resume();
                this.resetGame();
                this.startGame();
            });
        }
    }

    startGame() {
        window.soundEngine.resume();
        this.state = 'PLAYING';
        this.gameStartTime = performance.now();
        this.lastSpawnTime = performance.now();
    }

    togglePause() {
        if (this.state === 'PLAYING' || this.state === 'BOSS_FIGHT' || this.state === 'BOSS_ALERT') {
            this.prevState = this.state;
            this.state = 'PAUSED';
        } else if (this.state === 'PAUSED') {
            this.state = this.prevState || 'PLAYING';
        }
    }

    triggerSuperAttack() {
        if (this.state !== 'PLAYING' && this.state !== 'BOSS_FIGHT' && this.state !== 'BOSS_ALERT') return;
        if (this.superTimer < this.superCooldown) return;

        // Activar súper ataque
        this.superTimer = 0;
        this.superReadyNotified = false;
        this.superActiveEffect = 35; // 35 frames de efecto
        this.shake(20, 400);
        window.soundEngine.playSuperAttack();

        // Destruir todos los ovnis normales en pantalla
        const destroyedCount = this.enemies.length;
        this.enemies.forEach(enemy => {
            this.spawnExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, true);
            this.dropCoins(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 2);
            this.killedUfos++;
            this.score += 150;
        });
        this.enemies = [];

        // Limpiar todas las balas enemigas
        this.enemyBullets = [];

        // Si el jefe está activo, infligir daño masivo
        if (this.boss && this.boss.alive) {
            this.boss.takeDamage(450);
            this.spawnExplosion(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, true);
            this.addFloatingText("¡SÚPER IMPACTO -450!", this.boss.x + this.boss.width / 2, this.boss.y + 40, '#ffff00');
        }

        this.addFloatingText(`¡SÚPER ATAQUE EMP! ${destroyedCount > 0 ? '+' + destroyedCount + ' OVNIS' : ''}`, this.width / 2, this.height / 2, '#00ffff');

        this.checkBossSpawn();
    }

    shake(intensity, durationMs) {
        this.shakeIntensity = intensity;
        this.shakeTimer = durationMs;
    }

    spawnExplosion(x, y, big = false) {
        window.soundEngine.playExplosion(big);
        const count = big ? 40 : 18;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * (big ? 5 : 3.5)) + 0.8;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * (big ? 4 : 2.5) + 1.5,
                color: ['#ff0055', '#ff9900', '#ffff00', '#ffffff', '#00e5ff'][Math.floor(Math.random() * 5)],
                life: 1,
                decay: 0.02 + Math.random() * 0.03
            });
        }
    }

    dropCoins(x, y, count = 1) {
        for (let i = 0; i < count; i++) {
            this.coinsList.push({
                x: x + (Math.random() * 20 - 10),
                y: y + (Math.random() * 10 - 5),
                vx: (Math.random() * 2 - 1) * 1.5,
                vy: -1.5 - Math.random() * 1.5, // Salto inicial hacia arriba
                frame: Math.floor(Math.random() * 4),
                frameTimer: 0,
                width: 18,
                height: 18,
                magnetized: false
            });
        }
    }

    addFloatingText(text, x, y, color = '#ffd700') {
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            vy: -1.2,
            life: 1,
            color: color
        });
    }

    checkBossSpawn() {
        if (this.killedUfos >= this.targetUfos && !this.boss && this.state === 'PLAYING') {
            this.state = 'BOSS_ALERT';
            this.alertTimer = 2200; // 2.2 segundos de alarma
            window.soundEngine.playBossAlarm();
            this.shake(12, 1000);
        }
    }

    // ==========================================
    // BUCLE PRINCIPAL DE ACTUALIZACIÓN
    // ==========================================
    loop(currentTime) {
        const dt = Math.min(currentTime - this.lastFrameTime, 100);
        this.lastFrameTime = currentTime;

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // Actualizar efectos globales
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            if (this.shakeTimer <= 0) this.shakeIntensity = 0;
        }

        if (this.superActiveEffect > 0) {
            this.superActiveEffect--;
        }

        // Recarga del Súper Ataque (1 minuto)
        if (this.superTimer < this.superCooldown) {
            this.superTimer += dt;
            if (this.superTimer >= this.superCooldown) {
                this.superTimer = this.superCooldown;
                if (!this.superReadyNotified) {
                    this.superReadyNotified = true;
                    window.soundEngine.playSuperReady();
                    this.addFloatingText("⚡ ¡SÚPER ATAQUE LISTO! (Pulsa E) ⚡", this.width / 2, this.height - 130, '#00ffff');
                }
            }
        }

        // Fondo espacial
        this.updateBackground(dt);

        if (this.state === 'PAUSED') return;

        if (this.state === 'BOSS_ALERT') {
            this.alertTimer -= dt;
            if (this.alertTimer <= 0) {
                this.state = 'BOSS_FIGHT';
                this.spawnSuperBoss();
            }
            this.updatePlayer(dt);
            this.updateBullets(dt);
            this.updateParticles(dt);
            return;
        }

        if (this.state === 'PLAYING' || this.state === 'BOSS_FIGHT') {
            this.updatePlayer(dt);
            this.updateBullets(dt);
            this.updateEnemies(dt);
            this.updateBoss(dt);
            this.updateCoins(dt);
            this.updateParticles(dt);
            this.updateFloatingTexts(dt);
            this.checkCollisions();
        }
    }

    updateBackground(dt) {
        this.bgY1 += this.bgSpeed;
        this.bgY2 += this.bgSpeed;

        if (this.bgY1 >= this.height) this.bgY1 = this.bgY2 - this.height;
        if (this.bgY2 >= this.height) this.bgY2 = this.bgY1 - this.height;

        // Estrellas
        for (let star of this.stars) {
            star.y += star.speed;
            star.blink += 0.05;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
        }
    }

    updatePlayer(dt) {
        if (!this.player) return;

        // Reducir invulnerabilidad
        if (this.player.invulnerableTime > 0) {
            this.player.invulnerableTime -= dt;
        }

        this.player.flameAnim += 0.25;

        // Movimiento por TECLADO
        let moveX = 0;
        let moveY = 0;

        if (this.keys['ArrowLeft'] || this.keys['KeyA']) moveX -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) moveX += 1;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) moveY -= 1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) moveY += 1;

        if (moveX !== 0 || moveY !== 0) {
            // Normalizar diagonal
            if (moveX !== 0 && moveY !== 0) {
                moveX *= 0.7071;
                moveY *= 0.7071;
            }
            this.player.x += moveX * this.player.speed;
            this.player.y += moveY * this.player.speed;
            this.mouse.active = false; // Teclado toma prioridad al pulsar
        } else if (this.mouse.active) {
            // Movimiento por MOUSE suave y directo hacia el cursor
            const targetX = this.mouse.x - this.player.width / 2;
            const targetY = this.mouse.y - this.player.height / 2;
            const dx = targetX - this.player.x;
            const dy = targetY - this.player.y;

            // Interpolación reactiva
            this.player.x += dx * 0.18;
            this.player.y += dy * 0.18;
        }

        // Delimitar dentro de la pantalla
        this.player.x = Math.max(8, Math.min(this.width - this.player.width - 8, this.player.x));
        this.player.y = Math.max(30, Math.min(this.height - this.player.height - 15, this.player.y));

        // Partículas del propulsor de la nave
        if (Math.random() < 0.6) {
            this.particles.push({
                x: this.player.x + this.player.width / 2 + (Math.random() * 8 - 4),
                y: this.player.y + this.player.height - 4,
                vx: (Math.random() * 1 - 0.5),
                vy: 2 + Math.random() * 2,
                size: Math.random() * 2.5 + 1,
                color: Math.random() > 0.4 ? '#ff9900' : '#ffff00',
                life: 0.8,
                decay: 0.05
            });
        }

        // Disparo (Espacio o Clic Izquierdo sostenido)
        const wantsToShoot = this.keys['Space'] || this.mouse.isDown;
        const now = performance.now();
        if (wantsToShoot && now - this.lastShootTime > this.shootInterval) {
            this.shootPlayerBullets();
            this.lastShootTime = now;
        }
    }

    shootPlayerBullets() {
        window.soundEngine.playPlayerShoot();

        // Disparo doble simétrico
        const pCenterX = this.player.x + this.player.width / 2;
        const pTop = this.player.y + 4;

        this.bullets.push({
            x: pCenterX - 11,
            y: pTop,
            width: 4,
            height: 12,
            vy: -9,
            damage: 15
        });

        this.bullets.push({
            x: pCenterX + 7,
            y: pTop,
            width: 4,
            height: 12,
            vy: -9,
            damage: 15
        });

        // Chispas de disparo
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: pCenterX + (Math.random() * 16 - 8),
                y: pTop,
                vx: Math.random() * 2 - 1,
                vy: -Math.random() * 2,
                size: 2,
                color: '#00f7ff',
                life: 0.5,
                decay: 0.1
            });
        }
    }

    updateBullets(dt) {
        // Balas del jugador
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.y += b.vy;
            if (b.y < -20) {
                this.bullets.splice(i, 1);
            }
        }

        // Balas de enemigos
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const eb = this.enemyBullets[i];
            eb.x += eb.vx;
            eb.y += eb.vy;
            if (eb.y > this.height + 20 || eb.x < -20 || eb.x > this.width + 20) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }

    updateEnemies(dt) {
        const now = performance.now();

        // Generar nuevos OVNIs mientras estemos en modo PLAYING (hasta llegar a 50)
        if (this.state === 'PLAYING') {
            if (this.killedUfos + this.enemies.length < this.targetUfos) {
                if (now - this.lastSpawnTime > this.spawnInterval) {
                    this.spawnEnemyUfo();
                    this.lastSpawnTime = now;
                    // Aumentar ligeramente la dificultad progresiva
                    this.spawnInterval = Math.max(700, 1200 - this.killedUfos * 10);
                }
            }
        }

        // Actualizar OVNIs activos
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.timer += dt;

            // Patrones de movimiento:
            if (enemy.pattern === 'zigzag') {
                enemy.y += enemy.speedY;
                enemy.x += Math.sin(enemy.timer * 0.004) * 2.8;
            } else if (enemy.pattern === 'swoop') {
                enemy.y += enemy.speedY * (1 + Math.sin(enemy.timer * 0.003) * 0.5);
                enemy.x += enemy.dirX * 1.5;
                if (enemy.x <= 10 || enemy.x >= this.width - enemy.width - 10) {
                    enemy.dirX *= -1;
                }
            } else { // Estándar senoidal
                enemy.y += enemy.speedY;
                enemy.x += Math.cos(enemy.timer * 0.003) * 1.8;
            }

            // Los OVNIs disparan periódicamente hacia la posición del jugador
            enemy.shootCooldown -= dt;
            if (enemy.shootCooldown <= 0 && enemy.y > 20 && enemy.y < this.height - 150) {
                this.enemyShoot(enemy);
                enemy.shootCooldown = 1500 + Math.random() * 1800; // Cadencia de disparo
            }

            // Si se sale de pantalla por abajo, reubicar arriba
            if (enemy.y > this.height + 30) {
                enemy.y = -40;
                enemy.x = 30 + Math.random() * (this.width - 100);
            }
        }
    }

    spawnEnemyUfo() {
        const types = [
            { type: 'scout', width: 38, height: 38, hp: 20, speedY: 1.6, pattern: 'sine' },
            { type: 'fighter', width: 42, height: 42, hp: 35, speedY: 1.3, pattern: 'zigzag' },
            { type: 'diver', width: 34, height: 34, hp: 15, speedY: 2.2, pattern: 'swoop' }
        ];

        const template = types[Math.floor(Math.random() * types.length)];
        const x = 20 + Math.random() * (this.width - template.width - 40);

        this.enemies.push({
            ...template,
            x: x,
            y: -50,
            maxHp: template.hp,
            timer: Math.random() * 1000,
            dirX: Math.random() > 0.5 ? 1 : -1,
            shootCooldown: 800 + Math.random() * 1500
        });
    }

    enemyShoot(enemy) {
        window.soundEngine.playEnemyShoot();

        const startX = enemy.x + enemy.width / 2;
        const startY = enemy.y + enemy.height - 4;

        // Calcular dirección hacia la nave del jugador
        const targetX = this.player.x + this.player.width / 2;
        const targetY = this.player.y + this.player.height / 2;
        const angle = Math.atan2(targetY - startY, targetX - startX);

        const bulletSpeed = 3.5;

        this.enemyBullets.push({
            x: startX,
            y: startY,
            width: 6,
            height: 6,
            vx: Math.cos(angle) * bulletSpeed,
            vy: Math.sin(angle) * bulletSpeed,
            color: '#ff2255'
        });
    }

    spawnSuperBoss() {
        this.boss = {
            x: this.width / 2 - 80,
            y: -140,
            targetY: 60,
            width: 160,
            height: 110,
            hp: 2000,
            maxHp: 2000,
            alive: true,
            timer: 0,
            attackTimer: 0,
            currentAttack: 0,
            hoverDir: 1,
            speedX: 1.4,
            shieldPulse: 0,
            takeDamage: (amount) => {
                this.boss.hp -= amount;
                if (this.boss.hp <= 0) {
                    this.boss.hp = 0;
                    this.onBossDefeated();
                }
            }
        };

        this.addFloatingText("¡¡ SÚPER JEFE NODRIZA !!", this.width / 2, 120, '#ff0055');
    }

    updateBoss(dt) {
        if (!this.boss || !this.boss.alive) return;

        this.boss.timer += dt;
        this.boss.shieldPulse += 0.05;

        // Entrada inicial descendente
        if (this.boss.y < this.boss.targetY) {
            this.boss.y += 1.2;
            return;
        }

        // Movimiento horizontal flotante de combate
        this.boss.x += this.boss.speedX * this.boss.hoverDir;
        if (this.boss.x <= 15) {
            this.boss.x = 15;
            this.boss.hoverDir = 1;
        } else if (this.boss.x >= this.width - this.boss.width - 15) {
            this.boss.x = this.width - this.boss.width - 15;
            this.boss.hoverDir = -1;
        }

        // Ciclo de ataques del Jefe
        this.boss.attackTimer += dt;
        if (this.boss.attackTimer > 1100) {
            this.boss.attackTimer = 0;
            this.bossAttack();
        }
    }

    bossAttack() {
        if (!this.boss || !this.boss.alive) return;
        window.soundEngine.playEnemyShoot();

        const cx = this.boss.x + this.boss.width / 2;
        const cy = this.boss.y + this.boss.height - 10;
        const mode = Math.floor(Math.random() * 4);

        if (mode === 0) {
            // Disparo triple en abanico
            const angles = [-0.35, 0, 0.35];
            angles.forEach(ang => {
                this.enemyBullets.push({
                    x: cx,
                    y: cy,
                    width: 8,
                    height: 8,
                    vx: Math.sin(ang) * 3.8,
                    vy: Math.cos(ang) * 3.8,
                    color: '#ff0033'
                });
            });
        } else if (mode === 1) {
            // Ráfaga dual desde los cañones laterales
            const leftCannon = this.boss.x + 20;
            const rightCannon = this.boss.x + this.boss.width - 20;

            [-0.1, 0.1].forEach(offset => {
                this.enemyBullets.push({
                    x: leftCannon,
                    y: cy,
                    width: 7,
                    height: 7,
                    vx: offset * 3,
                    vy: 4.2,
                    color: '#00f7ff'
                });
                this.enemyBullets.push({
                    x: rightCannon,
                    y: cy,
                    width: 7,
                    height: 7,
                    vx: offset * 3,
                    vy: 4.2,
                    color: '#00f7ff'
                });
            });
        } else if (mode === 2) {
            // Ráfaga concentrada dirigida al jugador
            const px = this.player.x + this.player.width / 2;
            const py = this.player.y + this.player.height / 2;
            const angle = Math.atan2(py - cy, px - cx);

            for (let i = -1; i <= 1; i++) {
                const spread = angle + i * 0.15;
                this.enemyBullets.push({
                    x: cx,
                    y: cy,
                    width: 8,
                    height: 8,
                    vx: Math.cos(spread) * 4.2,
                    vy: Math.sin(spread) * 4.2,
                    color: '#ffea00'
                });
            }
        } else {
            // Spawn de dron de apoyo mini-ovni
            if (this.enemies.length < 3) {
                this.enemies.push({
                    type: 'scout',
                    width: 32,
                    height: 32,
                    x: cx + (Math.random() * 40 - 20),
                    y: cy,
                    hp: 20,
                    maxHp: 20,
                    speedY: 1.2,
                    pattern: 'sine',
                    timer: 0,
                    dirX: 1,
                    shootCooldown: 1200
                });
            }
        }
    }

    onBossDefeated() {
        this.boss.alive = false;
        this.shake(30, 2500);

        // Cascada de explosiones
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                if (this.boss) {
                    const rx = this.boss.x + Math.random() * this.boss.width;
                    const ry = this.boss.y + Math.random() * this.boss.height;
                    this.spawnExplosion(rx, ry, true);
                    this.dropCoins(rx, ry, 2);
                }
            }, i * 150);
        }

        setTimeout(() => {
            window.soundEngine.playVictory();
            this.state = 'VICTORY';
            this.gameEndTime = performance.now();
        }, 2400);
    }

    updateCoins(dt) {
        for (let i = this.coinsList.length - 1; i >= 0; i--) {
            const coin = this.coinsList[i];

            // Animación de giro
            coin.frameTimer += dt;
            if (coin.frameTimer > 90) {
                coin.frame = (coin.frame + 1) % 4;
                coin.frameTimer = 0;
            }

            // Gravedad y flotación
            coin.vy = Math.min(2.5, coin.vy + 0.08);
            coin.x += coin.vx;
            coin.y += coin.vy;
            coin.vx *= 0.96;

            // Atracción magnética hacia la nave del jugador si está cerca
            const cx = coin.x + coin.width / 2;
            const cy = coin.y + coin.height / 2;
            const px = this.player.x + this.player.width / 2;
            const py = this.player.y + this.player.height / 2;
            const dist = Math.hypot(px - cx, py - cy);

            if (dist < 85) {
                coin.magnetized = true;
                const angle = Math.atan2(py - cy, px - cx);
                const magnetSpeed = 6.0;
                coin.x += Math.cos(angle) * magnetSpeed;
                coin.y += Math.sin(angle) * magnetSpeed;
            }

            // Desaparecer si cae fuera de pantalla
            if (coin.y > this.height + 20) {
                this.coinsList.splice(i, 1);
            }
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateFloatingTexts(dt) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.life -= 0.02;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    // ==========================================
    // SISTEMA DE COLISIONES
    // ==========================================
    checkCollisions() {
        const p = this.player;
        if (!p) return;

        // 1. Balas del jugador contra OVNIs
        for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
            const b = this.bullets[bi];
            let bulletHit = false;

            // Contra OVNIs normales
            for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
                const enemy = this.enemies[ei];
                if (this.rectIntersect(b.x, b.y, b.width, b.height, enemy.x, enemy.y, enemy.width, enemy.height)) {
                    bulletHit = true;
                    enemy.hp -= b.damage;

                    // Chispas de impacto
                    for (let k = 0; k < 4; k++) {
                        this.particles.push({
                            x: b.x,
                            y: b.y,
                            vx: (Math.random() * 2 - 1) * 2,
                            vy: (Math.random() * 2 - 1) * 2,
                            size: 2,
                            color: '#00ffff',
                            life: 0.6,
                            decay: 0.08
                        });
                    }

                    if (enemy.hp <= 0) {
                        this.spawnExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                        // Los ovnis dropean monedas al morir
                        const coinCount = Math.random() < 0.4 ? 2 : 1;
                        this.dropCoins(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, coinCount);

                        this.enemies.splice(ei, 1);
                        this.killedUfos++;
                        this.score += 100;
                        this.checkBossSpawn();
                    }
                    break;
                }
            }

            // Contra el Súper Jefe
            if (!bulletHit && this.boss && this.boss.alive) {
                if (this.rectIntersect(b.x, b.y, b.width, b.height, this.boss.x, this.boss.y, this.boss.width, this.boss.height)) {
                    bulletHit = true;
                    this.boss.takeDamage(b.damage);

                    this.particles.push({
                        x: b.x,
                        y: b.y,
                        vx: Math.random() * 2 - 1,
                        vy: Math.random() * 2,
                        size: 2.5,
                        color: '#ff0055',
                        life: 0.5,
                        decay: 0.1
                    });
                }
            }

            if (bulletHit) {
                this.bullets.splice(bi, 1);
            }
        }

        // 2. Balas enemigas contra la Nave del Jugador
        if (p.invulnerableTime <= 0) {
            for (let bi = this.enemyBullets.length - 1; bi >= 0; bi--) {
                const eb = this.enemyBullets[bi];
                // Hitbox del jugador un poco más tolerante (retro arcade feel)
                if (this.rectIntersect(eb.x, eb.y, eb.width, eb.height, p.x + 8, p.y + 6, p.width - 16, p.height - 12)) {
                    this.enemyBullets.splice(bi, 1);
                    this.playerHit();
                    break;
                }
            }
        }

        // 3. Colisión directa Nave contra OVNI o Jefe
        if (p.invulnerableTime <= 0) {
            for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
                const enemy = this.enemies[ei];
                if (this.rectIntersect(p.x + 6, p.y + 6, p.width - 12, p.height - 12, enemy.x, enemy.y, enemy.width, enemy.height)) {
                    this.spawnExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    this.enemies.splice(ei, 1);
                    this.playerHit();
                    break;
                }
            }

            if (this.boss && this.boss.alive) {
                if (this.rectIntersect(p.x + 6, p.y + 6, p.width - 12, p.height - 12, this.boss.x + 20, this.boss.y + 20, this.boss.width - 40, this.boss.height - 30)) {
                    this.playerHit();
                }
            }
        }

        // 4. Recolección de Monedas
        for (let ci = this.coinsList.length - 1; ci >= 0; ci--) {
            const coin = this.coinsList[ci];
            if (this.rectIntersect(p.x, p.y, p.width, p.height, coin.x, coin.y, coin.width, coin.height)) {
                this.coinsList.splice(ci, 1);
                this.coins++;
                this.score += 50;
                window.soundEngine.playCoin();
                this.addFloatingText("+1 MONEDA", coin.x, coin.y - 8, '#ffd700');

                // Chispas doradas
                for (let k = 0; k < 6; k++) {
                    this.particles.push({
                        x: coin.x + 8,
                        y: coin.y + 8,
                        vx: Math.cos(k * 1.04) * 2,
                        vy: Math.sin(k * 1.04) * 2,
                        size: 2,
                        color: '#ffe600',
                        life: 0.6,
                        decay: 0.08
                    });
                }
            }
        }
    }

    playerHit() {
        this.lives--;
        window.soundEngine.playPlayerHit();
        this.shake(14, 300);
        this.spawnExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);

        if (this.lives <= 0) {
            this.lives = 0;
            this.state = 'GAMEOVER';
            window.soundEngine.playGameOver();
        } else {
            // 2.2 segundos de invulnerabilidad
            this.player.invulnerableTime = 2200;
            this.addFloatingText("¡ESCUDOS ACTIVADOS!", this.player.x, this.player.y - 15, '#ff3366');
        }
    }

    rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    // ==========================================
    // RENDERIZADO VISUAL
    // ==========================================
    render() {
        this.ctx.save();

        // Screen Shake
        if (this.shakeTimer > 0) {
            const ox = (Math.random() - 0.5) * this.shakeIntensity;
            const oy = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(ox, oy);
        }

        // Limpiar pantalla
        this.ctx.fillStyle = '#06060c';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 1. Fondo de espacio
        if (window.spriteManager && window.spriteManager.bgImage) {
            this.ctx.drawImage(window.spriteManager.bgImage, 0, this.bgY1, this.width, this.height);
            this.ctx.drawImage(window.spriteManager.bgImage, 0, this.bgY2, this.width, this.height);
        }

        // 2. Estrellas parallax
        for (let star of this.stars) {
            const alpha = 0.5 + 0.5 * Math.sin(star.blink);
            this.ctx.fillStyle = star.color;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
        }
        this.ctx.globalAlpha = 1.0;

        // 3. Monedas en pantalla
        for (let coin of this.coinsList) {
            if (window.spriteManager && window.spriteManager.coinFrames[coin.frame]) {
                this.ctx.drawImage(window.spriteManager.coinFrames[coin.frame], Math.floor(coin.x), Math.floor(coin.y));
            } else {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fillRect(coin.x, coin.y, coin.width, coin.height);
            }
        }

        // 4. Balas del Jugador (Láser cyan brillante)
        this.ctx.fillStyle = '#00f7ff';
        this.ctx.shadowColor = '#00f7ff';
        this.ctx.shadowBlur = 6;
        for (let b of this.bullets) {
            this.ctx.fillRect(Math.floor(b.x), Math.floor(b.y), b.width, b.height);
            // Núcleo blanco
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(Math.floor(b.x + 1), Math.floor(b.y + 2), b.width - 2, b.height - 4);
            this.ctx.fillStyle = '#00f7ff';
        }
        this.ctx.shadowBlur = 0;

        // 5. Balas Enemigas (Plasma carmesí / esferas alienígenas)
        for (let eb of this.enemyBullets) {
            this.ctx.fillStyle = eb.color || '#ff0055';
            this.ctx.beginPath();
            this.ctx.arc(Math.floor(eb.x), Math.floor(eb.y), eb.width / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 6. OVNIs Enemigos
        for (let enemy of this.enemies) {
            if (window.spriteManager && window.spriteManager.ufoCanvas) {
                this.ctx.drawImage(window.spriteManager.ufoCanvas, Math.floor(enemy.x), Math.floor(enemy.y), enemy.width, enemy.height);
            } else {
                this.ctx.fillStyle = '#00ff66';
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
        }

        // 7. Súper Jefe
        if (this.boss && this.boss.alive) {
            if (window.spriteManager && window.spriteManager.bossCanvas) {
                this.ctx.drawImage(window.spriteManager.bossCanvas, Math.floor(this.boss.x), Math.floor(this.boss.y), this.boss.width, this.boss.height);
            }

            // Escudo energético pulsante alrededor del jefe
            const shieldAlpha = 0.2 + 0.15 * Math.sin(this.boss.shieldPulse);
            this.ctx.strokeStyle = `rgba(255, 0, 85, ${shieldAlpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(this.boss.x - 4, this.boss.y - 4, this.boss.width + 8, this.boss.height + 8);
        }

        // 8. Nave del Jugador
        if (this.player && (this.state === 'PLAYING' || this.state === 'BOSS_FIGHT' || this.state === 'BOSS_ALERT' || this.state === 'PAUSED')) {
            // Parpadeo de invulnerabilidad
            const visible = this.player.invulnerableTime <= 0 || Math.floor(this.player.invulnerableTime / 100) % 2 === 0;

            if (visible) {
                if (window.spriteManager && window.spriteManager.playerShipCanvas) {
                    this.ctx.drawImage(window.spriteManager.playerShipCanvas, Math.floor(this.player.x), Math.floor(this.player.y), this.player.width, this.player.height);
                } else {
                    this.ctx.fillStyle = '#00e5ff';
                    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
                }

                // Escudo protector si está invulnerable
                if (this.player.invulnerableTime > 0) {
                    this.ctx.strokeStyle = '#00ffff';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, this.player.width * 0.7, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            }
        }

        // 9. Partículas
        for (let p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = Math.max(0, p.life);
            this.ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
        }
        this.ctx.globalAlpha = 1.0;

        // 10. Textos Flotantes (+1 MONEDA, etc.)
        this.ctx.font = '10px "Press Start 2P", monospace, sans-serif';
        this.ctx.textAlign = 'center';
        for (let ft of this.floatingTexts) {
            this.ctx.fillStyle = ft.color;
            this.ctx.globalAlpha = Math.max(0, ft.life);
            this.ctx.fillText(ft.text, ft.x, ft.y);
        }
        this.ctx.globalAlpha = 1.0;

        // 11. Efecto de Súper Ataque en pantalla completa (Onda expansiva luminosa)
        if (this.superActiveEffect > 0) {
            const progress = (35 - this.superActiveEffect) / 35;
            this.ctx.fillStyle = `rgba(0, 247, 255, ${0.45 * (1 - progress)})`;
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Anillos expansivos
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(this.width / 2, this.height / 2, progress * this.height * 0.8, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        this.ctx.restore();

        // 12. Render de HUD y Pantallas
        this.renderHUD();
    }

    renderHUD() {
        // Vidas
        const hudLives = document.getElementById('hudLives');
        if (hudLives) {
            let icons = '';
            for (let i = 0; i < this.maxLives; i++) {
                if (i < this.lives) {
                    icons += '<span class="life-icon active">🚀</span> ';
                } else {
                    icons += '<span class="life-icon lost">💀</span> ';
                }
            }
            hudLives.innerHTML = icons;
        }

        // Contador de OVNIs
        const hudKills = document.getElementById('hudKills');
        if (hudKills) {
            hudKills.innerText = `${Math.min(this.killedUfos, this.targetUfos)} / ${this.targetUfos}`;
        }

        const killProgress = document.getElementById('killProgressBar');
        if (killProgress) {
            const pct = Math.min(100, (this.killedUfos / this.targetUfos) * 100);
            killProgress.style.width = `${pct}%`;
        }

        // Monedas
        const hudCoins = document.getElementById('hudCoins');
        if (hudCoins) {
            hudCoins.innerText = this.coins;
        }

        // Barra del Súper Ataque
        const superPct = Math.min(100, Math.floor((this.superTimer / this.superCooldown) * 100));
        const superBar = document.getElementById('superProgressBar');
        const superBtn = document.getElementById('superAttackBtn');
        const superText = document.getElementById('superStatusText');

        if (superBar) {
            superBar.style.width = `${superPct}%`;
        }

        if (superBtn && superText) {
            if (this.superTimer >= this.superCooldown) {
                superBtn.classList.add('ready');
                superText.innerHTML = '⚡ ¡LISTO! [E / Clic]';
            } else {
                superBtn.classList.remove('ready');
                const remainingSecs = Math.ceil((this.superCooldown - this.superTimer) / 1000);
                superText.innerHTML = `Cargando: ${remainingSecs}s (${superPct}%)`;
            }
        }

        // Barra de Salud del Súper Jefe
        const bossHud = document.getElementById('bossHudContainer');
        if (bossHud) {
            if (this.boss && this.boss.alive) {
                bossHud.style.display = 'block';
                const bossPct = Math.max(0, (this.boss.hp / this.boss.maxHp) * 100);
                const bossHpBar = document.getElementById('bossHpBar');
                const bossHpText = document.getElementById('bossHpText');
                if (bossHpBar) bossHpBar.style.width = `${bossPct}%`;
                if (bossHpText) bossHpText.innerText = `${Math.ceil(this.boss.hp)} / ${this.boss.maxHp}`;
            } else {
                bossHud.style.display = 'none';
            }
        }

        // Alerta del Jefe
        const alertOverlay = document.getElementById('bossAlertOverlay');
        if (alertOverlay) {
            alertOverlay.style.display = (this.state === 'BOSS_ALERT') ? 'flex' : 'none';
        }

        // Pantallas de menú (Start, GameOver, Victory, Pause)
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const victoryScreen = document.getElementById('victoryScreen');
        const pauseOverlay = document.getElementById('pauseOverlay');

        if (startScreen) startScreen.style.display = (this.state === 'START') ? 'flex' : 'none';
        if (gameOverScreen) {
            gameOverScreen.style.display = (this.state === 'GAMEOVER') ? 'flex' : 'none';
            if (this.state === 'GAMEOVER') {
                document.getElementById('finalScore').innerText = this.score;
                document.getElementById('finalKills').innerText = this.killedUfos;
                document.getElementById('finalCoins').innerText = this.coins;
            }
        }
        if (victoryScreen) {
            victoryScreen.style.display = (this.state === 'VICTORY') ? 'flex' : 'none';
            if (this.state === 'VICTORY') {
                const totalSeconds = Math.floor((this.gameEndTime - this.gameStartTime) / 1000);
                document.getElementById('vicScore').innerText = this.score + 5000;
                document.getElementById('vicCoins').innerText = this.coins;
                document.getElementById('vicTime').innerText = `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`;
            }
        }
        if (pauseOverlay) pauseOverlay.style.display = (this.state === 'PAUSED') ? 'flex' : 'none';
    }
}

// Inicialización cuando cargue el DOM
window.addEventListener('DOMContentLoaded', async () => {
    if (window.spriteManager) {
        await window.spriteManager.init();
    }
    window.game = new Game();
});
