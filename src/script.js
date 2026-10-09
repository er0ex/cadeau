/* =========================================================
   НАСТРОЙКИ
   ========================================================= */
const CONFIG = {
  // 10 октября 2025, 21:10 (Астана, UTC+5). Месяц с нуля!
  startDate: [2025, 9, 10, 21, 10],
  timezoneOffsetHours: 5,
  location: { latitude: 51.1330, longitude: 71.4330, name: 'Астана' },
  datapath: './data/',

  terminalLines: [
    { text: '$ whoami',                        delay: 500, class: 'prompt' },
    { text: 'человек, который тебя любит',     delay: 700, class: '' },
    { text: '$ locate --my-heart',             delay: 500, class: 'prompt' },
    { text: 'найдено: 1 совпадение ♥',         delay: 700, class: 'heart' },
    { text: '$ initialize --us',               delay: 500, class: 'prompt' },
    { text: 'загрузка воспоминаний...',        delay: 500, class: '' },
    { text: '████████████████████ 100%',       delay: 900, class: 'ok' },
    { text: 'статус: всё ещё влюблён',         delay: 700, class: 'ok' },
    { text: ' ',                               delay: 300, class: '' },
    { text: '> открываю небо над Астаной...',  delay: 900, class: 'prompt' },
  ],

  message: 'Каждая звезда здесь — это один день, что мы вместе. И я хочу, чтобы их стало бесконечно много.',
  startDateLabel: '10 октября 2025 · Астана, 21:10',
};

/* =========================================================
   ТЕРМИНАЛ
   ========================================================= */
const terminalEl = document.getElementById('terminal');
const outputEl   = document.getElementById('terminal-output');
const skyScreen  = document.getElementById('sky-screen');

let skipped = false;

function typeLine(lineObj, cb) {
  if (skipped) return;
  const el = document.createElement('span');
  el.className = 'line ' + (lineObj.class || '');
  outputEl.appendChild(el);

  const text = lineObj.text;
  let i = 0;

  const tick = () => {
    if (skipped) return;
    if (i <= text.length) {
      el.textContent = text.slice(0, i);
      i++;
      outputEl.scrollTop = outputEl.scrollHeight;
      setTimeout(tick, 18 + Math.random() * 25);
    } else {
      setTimeout(cb, lineObj.delay);
    }
  };
  tick();
}

function addCursor() {
  const c = document.createElement('span');
  c.className = 'cursor';
  outputEl.appendChild(c);
  outputEl.scrollTop = outputEl.scrollHeight;
}

function runTerminal(idx = 0) {
  if (skipped) return finishTerminal();
  if (idx >= CONFIG.terminalLines.length) {
    addCursor();
    setTimeout(finishTerminal, 900);
    return;
  }
  typeLine(CONFIG.terminalLines[idx], () => runTerminal(idx + 1));
}

function finishTerminal() {
  if (skipped && terminalEl.classList.contains('fade-out')) return;
  skipped = true;
  terminalEl.classList.add('fade-out');
  setTimeout(() => {
    terminalEl.style.display = 'none';
    skyScreen.classList.remove('hidden');
    initCelestialMap();
    initCounter();
    initHeartConstellation();
    initMusic();
    startSkyRotation();
  }, 800);
}

terminalEl.addEventListener('click', () => {
  if (skipped) return;
  outputEl.innerHTML = '';
  CONFIG.terminalLines.forEach(l => {
    const el = document.createElement('span');
    el.className = 'line ' + (l.class || '');
    el.textContent = l.text;
    outputEl.appendChild(el);
  });
  addCursor();
  skipped = false;
  setTimeout(finishTerminal, 400);
});

runTerminal();

/* =========================================================
   СЧЁТЧИК
   ========================================================= */
function initCounter() {
  const [y, mo, d, h, mi] = CONFIG.startDate;
  const start = Date.UTC(y, mo, d, h - CONFIG.timezoneOffsetHours, mi);

  const daysEl   = document.getElementById('days');
  const unitEl   = document.getElementById('unit');
  const hEl      = document.getElementById('hours');
  const mEl      = document.getElementById('minutes');
  const sEl      = document.getElementById('seconds');
  const startLbl = document.getElementById('start-date');
  const msgEl    = document.getElementById('message');

  startLbl.textContent = CONFIG.startDateLabel;
  msgEl.textContent = CONFIG.message;

  let animated = false;

  function update(animate = false) {
    const now = Date.now();
    const diff = Math.max(0, now - start);
    const totalSeconds = Math.floor(diff / 1000);
    const totalDays    = Math.floor(totalSeconds / 86400);

    const dm = totalDays % 100;
    const dd = dm % 10;
    let word = 'дней';
    if (dm < 11 || dm > 14) {
      if (dd === 1) word = 'день';
      else if (dd >= 2 && dd <= 4) word = 'дня';
    }
    unitEl.textContent = word;

    if (!animated && animate) {
      const duration = 1400;
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min((t - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        daysEl.textContent = Math.floor(totalDays * eased).toLocaleString('ru-RU');
        if (p < 1) requestAnimationFrame(step);
        else {
          daysEl.textContent = totalDays.toLocaleString('ru-RU');
          animated = true;
        }
      };
      requestAnimationFrame(step);
    } else {
      daysEl.textContent = totalDays.toLocaleString('ru-RU');
    }

    const hh = Math.floor((totalSeconds % 86400) / 3600);
    const mm = Math.floor((totalSeconds % 3600) / 60);
    const ss = totalSeconds % 60;
    hEl.textContent = String(hh).padStart(2, '0');
    mEl.textContent = String(mm).padStart(2, '0');
    sEl.textContent = String(ss).padStart(2, '0');
  }

  update(true);
  setInterval(() => update(false), 1000);
}

/* =========================================================
   КАРТА НЕБА
   ========================================================= */
function initCelestialMap() {
  if (typeof Celestial === 'undefined') {
    console.warn('d3-celestial не загрузился — фолбэк');
    drawFallbackSky();
    return;
  }

  Celestial.display({
    container: 'celestial-map',
    width: window.innerWidth,
    height: window.innerHeight,
    projection: 'airy',
    datapath: CONFIG.datapath,
    transform: 'equatorial',
    stars: { show: true, limit: 6.5, colors: true, style: { fill: '#ffffff', opacity: 1 } },
    dsos: { show: false },
    constellations: {
      show: true, names: false, lines: true,
      lineStyle: { stroke: 'rgba(138,184,255,0.18)', width: 1 }
    },
    mw: { show: true, style: { fill: 'rgba(138,184,255,0.06)', width: 1 } },
    planets: { show: true, which: ['mercury', 'venus', 'mars', 'jupiter', 'saturn'] },
    moon: { show: true, style: { fill: '#f5f0e0', opacity: 0.9 } },
    sun: { show: false },
    horizon: {
      show: true,
      stroke: 'rgba(255,138,184,0.35)',
      width: 2,
      fill: 'rgba(4,6,15,0.75)'
    },
    atmosphere: { show: true, style: { fill: 'rgba(10,14,28,0.55)', opacity: 0.55 } },
    controls: { show: false },
    interactive: false
  });

  const [y, mo, d, h, mi] = CONFIG.startDate;
  const utcDate = new Date(Date.UTC(y, mo, d, h - CONFIG.timezoneOffsetHours, mi));
  Celestial.date(utcDate);
  Celestial.location([CONFIG.location.latitude, CONFIG.location.longitude]);

  setTimeout(animateStars, 1500);

  let resizeTO;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(() => {
      try { Celestial.resize({ width: window.innerWidth, height: window.innerHeight }); }
      catch (e) {}
    }, 200);
  });
}

function animateStars() {
  const stars = document.querySelectorAll('#celestial-map svg circle');
  stars.forEach((s) => {
    const dur   = (2 + Math.random() * 3).toFixed(2);
    const delay = (Math.random() * 3).toFixed(2);
    s.style.animation = 'twinkle ' + dur + 's ease-in-out ' + delay + 's infinite';
  });
}

(function addTwinkleStyle() {
  const st = document.createElement('style');
  st.textContent = '@keyframes twinkle { 0%,100% { opacity: 0.65; } 50% { opacity: 1; } }';
  document.head.appendChild(st);
})();

/* =========================================================
   ВРАЩЕНИЕ НЕБА
   ========================================================= */
let skyTimeOffset = 0;
let skyTimer = null;

function startSkyRotation() {
  if (typeof Celestial === 'undefined') return;
  const [y, mo, d, h, mi] = CONFIG.startDate;
  const baseUTC = Date.UTC(y, mo, d, h - CONFIG.timezoneOffsetHours, mi);
  skyTimer = setInterval(() => {
    skyTimeOffset += 60 * 1000;
    try { Celestial.date(new Date(baseUTC + skyTimeOffset)); } catch (e) {}
  }, 30000);
}

/* =========================================================
   СЕРДЦЕ
   ========================================================= */
function initHeartConstellation() {
  const lines  = document.getElementById('heart-lines');
  const gStars = document.getElementById('heart-stars');
  if (!lines || !gStars) return;

  const points = [
    [200, 90], [140, 60], [80, 120], [90, 200],
    [200, 320], [310, 200], [320, 120], [260, 60], [200, 90],
  ];

  lines.setAttribute('points', points.map(p => p.join(',')).join(' '));

  const SVG_NS = 'http://www.w3.org/2000/svg';
  points.slice(0, 8).forEach(([x, y], i) => {
    const glow = document.createElementNS(SVG_NS, 'circle');
    glow.setAttribute('cx', x); glow.setAttribute('cy', y);
    glow.setAttribute('r', 14);
    glow.setAttribute('fill', 'rgba(255,138,184,0.18)');
    gStars.appendChild(glow);

    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', y);
    c.setAttribute('r', 3.5);
    c.setAttribute('fill', '#ffffff');
    c.classList.add('star');
    c.style.animationDelay = (i * 0.3) + 's';
    gStars.appendChild(c);
  });
}

/* =========================================================
   МУЗЫКА
   ========================================================= */
function initMusic() {
  const btn   = document.getElementById('music-btn');
  const audio = document.getElementById('bg-music');
  if (!btn || !audio) return;

  let playing = false;
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      if (playing) {
        audio.pause();
        btn.classList.remove('playing');
        playing = false;
      } else {
        audio.volume = 0.6;
        await audio.play();
        btn.classList.add('playing');
        playing = true;
      }
    } catch (err) { console.warn('audio:', err); }
  });
}

/* =========================================================
   ФОЛБЭК
   ========================================================= */
function drawFallbackSky() {
  const container = document.getElementById('celestial-map');
  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let W, H, DPR = Math.min(window.devicePixelRatio || 1, 2);
  const stars = [];

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    stars.length = 0;
    const count = Math.floor((W * H) / 4000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.4 + 0.2,
        a: Math.random() * 0.6 + 0.3,
        ph: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.02 + 0.005,
      });
    }
  }

  let t = 0;
  function draw() {
    t += 0.016;
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const tw = Math.sin(t * s.sp * 60 + s.ph) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + (s.a * (0.4 + tw * 0.6)) + ')';
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
}

/* =========================================================
   PWA
   ========================================================= */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((e) => {
      console.warn('SW:', e);
    });
  });
}
