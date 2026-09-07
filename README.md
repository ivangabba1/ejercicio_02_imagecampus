# Cosmic Pixel Defender 2D 🚀👾

Videojuego 2D estilo retro arcade pixel art desarrollado con **HTML5 Canvas**, **JavaScript**, **CSS3** y **Web Audio API**.

El jugador pilota una nave espacial en el espacio exterior, enfrenta oleadas continuas de OVNIs alienígenas que devuelven fuego, recoge monedas doradas, utiliza un súper ataque masivo con enfriamiento de 1 minuto y enfrenta al temible Súper Jefe al abatir 50 OVNIs.

---

## 🎮 Controles

El juego cuenta con controles híbridos (puedes alternar entre teclado y mouse en cualquier momento):

| Acción | Teclado | Ratón / Mouse |
| :--- | :--- | :--- |
| **Mover nave** | `W, A, S, D` o `Flechas` | Mover el puntero del mouse |
| **Disparo continuo** | Mantener `Espacio` | Mantener `Clic Izquierdo` |
| **Súper Ataque EMP** | Tecla `E` o `Q` | `Clic Derecho` o botón en HUD |
| **Pausar / Reanudar** | Tecla `P` o `ESC` | Botón `PAUSA` en HUD |
| **Silenciar sonido** | — | Botón `SONIDO` en HUD |

---

## 🌟 Características Principales

- **Estética 2D Pixel Art:** Fondos espaciales con nebulosas y estrellas animadas en scroll parallax, naves, platillos voladores y nave nodriza gigante en arte pixelado.
- **Sistema de 3 Vidas:** Indicadores visuales en el HUD superior y período de invulnerabilidad temporal (2.2s) con escudo tras recibir daño.
- **Súper Ataque EMP:** Temporizador exacto de 60 segundos (1 minuto) con barra de progreso en tiempo real. Al activarse, elimina a todos los OVNIs en pantalla y causa 450 puntos de daño masivo al Súper Jefe.
- **Enemigos Inteligentes:** OVNIs con patrones de movimiento senoidales y en zig-zag que calculan la posición del jugador y disparan ráfagas de plasma.
- **Drops de Monedas:** Los enemigos destruidos sueltan monedas doradas que flotan con física de gravedad y atracción magnética al acercarse la nave.
- **Contador de 50 OVNIs:** HUD con seguimiento en tiempo real del objetivo de bajas `X / 50`.
- **Combate contra el Súper Jefe:** Al llegar a los 50 OVNIs, se activa una sirena de alarma y desciende una masiva nave nodriza alienígena con 2000 HP, barra de vida y múltiples fases de disparo.
- **Sonido Retro 8-Bit:** Sintetizador procedural integrado mediante **Web Audio API** (láseres, plasma, explosiones, monedas, sirenas y música de victoria).

---

## 🚀 Cómo Jugar

1. Clona o descarga este repositorio:
   ```bash
   git clone https://github.com/ivangabba1/ejercicio_02_imagecampus.git
   ```
2. Ejecuta el juego:
   - **En Windows:** Haz doble clic en `iniciar_juego.bat`.
   - **En cualquier sistema / navegador:** Abre el archivo `index.html` directamente en Google Chrome, Microsoft Edge, Mozilla Firefox u Opera.

---

