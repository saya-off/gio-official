const modalCreator = document.getElementById("creatorModal");
const statusText = document.getElementById('status');
let progressInterval;

let ytPlayer = null;
let ytReady = false;
let pendingVideoId = null;
let currentTitle = '';

(function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
})();

window.onYouTubeIframeAPIReady = function () {
    ytPlayer = new YT.Player('youtube-player', {
        height: '1',
        width: '1',
        playerVars: { autoplay: 0, controls: 0, rel: 0 },
        events: {
            onReady: () => {
                ytReady = true;
                if (pendingVideoId) {
                    ytPlayer.loadVideoById(pendingVideoId);
                    pendingVideoId = null;
                }
            },
            onStateChange: onPlayerStateChange
        }
    });
};

function loadVideo(videoId) {
    if (ytReady && ytPlayer && ytPlayer.loadVideoById) {
        ytPlayer.loadVideoById(videoId);
    } else {
        pendingVideoId = videoId;
    }
}

function onPlayerStateChange(event) {
    if (!window.YT) return;
    if (event.data === YT.PlayerState.PLAYING) {
        setPlayingUI(true);
        startProgressTracking();
        if (statusText) {
            statusText.innerHTML = "Status: Memutar " + currentTitle;
            statusText.style.color = "#bb86fc";
        }
    } else if (event.data === YT.PlayerState.PAUSED) {
        setPlayingUI(false);
        clearInterval(progressInterval);
        if (statusText) {
            statusText.innerHTML = "Status: Jeda " + currentTitle;
            statusText.style.color = "#a7a7a7";
        }
    } else if (event.data === YT.PlayerState.ENDED) {
        setPlayingUI(false);
        clearInterval(progressInterval);
        resetProgressBar();
        if (statusText) {
            statusText.innerHTML = "Status: Off";
            statusText.style.color = "#a7a7a7";
        }
    }
}

function formatTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds || 0));
    const mins = Math.floor(s / 60);
    let secs = s % 60;
    if (secs < 10) secs = '0' + secs;
    return mins + ':' + secs;
}

function startProgressTracking() {
    clearInterval(progressInterval);
    progressInterval = setInterval(() => {
        if (!ytPlayer || !ytPlayer.getCurrentTime || !ytPlayer.getDuration) return;
        const current = ytPlayer.getCurrentTime();
        const duration = ytPlayer.getDuration();
        if (!duration) return;

        const progressFill = document.getElementById('progress-fill');
        const currentTimeText = document.getElementById('current-time');
        const totalTimeText = document.getElementById('total-time');

        if (progressFill) progressFill.style.width = ((current / duration) * 100) + '%';
        if (currentTimeText) currentTimeText.innerHTML = formatTime(current);
        if (totalTimeText) totalTimeText.innerHTML = formatTime(duration);
    }, 500);
}

function resetProgressBar() {
    const progressFill = document.getElementById('progress-fill');
    const currentTimeText = document.getElementById('current-time');
    if (progressFill) progressFill.style.width = '0%';
    if (currentTimeText) currentTimeText.innerHTML = '0:00';
}

function seekTo(evt) {
    const bar = document.getElementById('progress-bar-bg');
    if (!bar || !ytPlayer || !ytPlayer.getDuration || !ytPlayer.seekTo) return;
    const duration = ytPlayer.getDuration();
    if (!duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (evt.clientX - rect.left) / rect.width));
    ytPlayer.seekTo(duration * ratio, true);
}

/* Toggle the big player button + swap the icon on whichever track is active */
function setPlayingUI(isPlaying) {
    const btn = document.getElementById('playPauseBtn');
    if (btn) {
        btn.innerHTML = isPlaying
            ? '<i class="fas fa-pause"></i> Jeda'
            : '<i class="fas fa-play"></i> Putar';
        btn.classList.toggle('is-playing', isPlaying);
    }

    const activeItem = document.querySelector('.music-item.active');
    if (activeItem) {
        const slot = activeItem.querySelector('.music-item-icon-slot');
        if (slot) {
            slot.innerHTML = isPlaying
                ? '<span class="eq-icon"><span></span><span></span><span></span></span>'
                : '<i class="fas fa-pause music-item-icon"></i>';
        }
    }

    const miniBtn = document.getElementById('miniPlayPauseBtn');
    if (miniBtn) {
        miniBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }
    const miniPlayer = document.getElementById('miniPlayer');
    if (miniPlayer) miniPlayer.classList.toggle('is-playing', isPlaying);
}

function showMiniPlayer() {
    const mini = document.getElementById('miniPlayer');
    if (mini) mini.classList.add('visible');
}

function hideMiniPlayer() {
    const mini = document.getElementById('miniPlayer');
    if (mini) mini.classList.remove('visible');
}

function resetItemIcon(itemEl) {
    if (!itemEl) return;
    const slot = itemEl.querySelector('.music-item-icon-slot');
    if (slot) slot.innerHTML = '<i class="fas fa-play music-item-icon"></i>';
}

function togglePlayPause() {
    if (!ytPlayer || !ytPlayer.getPlayerState) return;
    const state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
        ytPlayer.pauseVideo();
    } else {
        ytPlayer.playVideo();
    }
}

function openLogoPreview() {
    const modal = document.getElementById("logoModal");
    const audio = document.getElementById("voiceWelcome");
    if (modal) { modal.style.display = "flex"; }
    if (audio) {
        audio.currentTime = 0;
        audio.volume = 0.6;
        audio.play().catch(() => {});
    }
}

function closeLogoPreview() { 
    const modal = document.getElementById("logoModal");
    const audio = document.getElementById("voiceWelcome");
    if (modal) { modal.style.display = "none"; }
    if (audio) { audio.pause(); audio.currentTime = 0; }
}

function openCreatorModal() {
    if(modalCreator) modalCreator.style.display = "flex";
    startCreatorAutoplay();
}

function closeCreatorModal() { 
    if(modalCreator) modalCreator.style.display = "none";
    stopCreatorAutoplay();
}

let creatorIndex = 0;
let creatorAutoplay;

function creatorSlide(i) {
    const slides = document.querySelectorAll('.creator-slide');
    const dots = document.querySelectorAll('.creator-carousel-dots .dot');
    if (!slides.length) return;
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    slides[i].classList.add('active');
    if(dots[i]) dots[i].classList.add('active');
    creatorIndex = i;
}

function startCreatorAutoplay() {
    stopCreatorAutoplay();
    creatorAutoplay = setInterval(() => {
        const slides = document.querySelectorAll('.creator-slide');
        creatorSlide((creatorIndex + 1) % slides.length);
    }, 3500);
}

function stopCreatorAutoplay() {
    clearInterval(creatorAutoplay);
}

function creatorNext() {
    const slides = document.querySelectorAll('.creator-slide');
    if (!slides.length) return;
    creatorSlide((creatorIndex + 1) % slides.length);
    startCreatorAutoplay(); // reset timer biar tidak langsung lompat lagi
}

function creatorPrev() {
    const slides = document.querySelectorAll('.creator-slide');
    if (!slides.length) return;
    creatorSlide((creatorIndex - 1 + slides.length) % slides.length);
    startCreatorAutoplay();
}

function openGioBio() {
    const modal = document.getElementById("gioBioModal");
    if (modal) { modal.style.display = "flex"; }
}

function closeGioBio() {
    const modal = document.getElementById("gioBioModal");
    if (modal) { modal.style.display = "none"; }
}

function playSong(videoId, title, artist, el) {
    // Klik lagu yang sedang aktif lagi -> cukup toggle play/pause, tidak reload dari awal
    if (el && el.classList.contains('active')) {
        togglePlayPause();
        return;
    }

    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');
    if (trackTitle) trackTitle.innerHTML = title;
    if (trackArtist && artist) trackArtist.innerHTML = artist;
    currentTitle = title;

    const currentCover = document.getElementById('current-cover');
    if (currentCover && el) {
        const itemImg = el.querySelector('img');
        if (itemImg) {
            currentCover.src = itemImg.src;
            currentCover.style.display = 'block';
        }
    }

    const miniCover = document.getElementById('mini-cover');
    const miniTitle = document.getElementById('mini-title');
    const miniArtist = document.getElementById('mini-artist');
    if (miniCover && el) {
        const itemImg = el.querySelector('img');
        if (itemImg) miniCover.src = itemImg.src;
    }
    if (miniTitle) miniTitle.innerHTML = title;
    if (miniArtist && artist) miniArtist.innerHTML = artist;

    const allItems = document.querySelectorAll('.music-item');
    allItems.forEach(item => {
        if (item !== el) resetItemIcon(item);
        item.classList.remove('active');
    });
    if (el) el.classList.add('active');

    resetProgressBar();
    loadVideo(videoId);
}

function stopMusic() {
    if (ytPlayer && ytPlayer.pauseVideo) {
        try { ytPlayer.pauseVideo(); } catch (e) {}
    }
}

function openGevagart() {
    const app = document.getElementById('gevagartApp');
    if (app) {
        app.classList.add('active');
        document.body.style.overflow = 'hidden';
        history.pushState({ gevagart: true }, '');
    }
}

function closeGevagart() {
    const app = document.getElementById('gevagartApp');
    if (app) {
        app.classList.remove('active');
        document.body.style.overflow = '';
    }
}

window.addEventListener('popstate', () => {
    const app = document.getElementById('gevagartApp');
    if (app && app.classList.contains('active')) {
        closeGevagart();
    }
    const music = document.getElementById('musicApp');
    if (music && music.classList.contains('active')) {
        closeMusicApp();
    }
});

function openMusicApp() {
    const app = document.getElementById('musicApp');
    if (app) {
        app.classList.add('active');
        document.body.style.overflow = 'hidden';
        history.pushState({ musicApp: true }, '');
    }
    hideMiniPlayer();
}

function closeMusicApp() {
    const app = document.getElementById('musicApp');
    if (app) {
        app.classList.remove('active');
        document.body.style.overflow = '';
    }
    if (currentTitle) showMiniPlayer();
}

function bukaTab(nama) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });

    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => { btn.classList.remove('active'); });

    const targetTab = document.getElementById(nama);
    if (targetTab) {
        targetTab.style.display = 'block';
        targetTab.classList.add('active');
    }

    const targetBtn = document.getElementById('btn-' + nama);
    if (targetBtn) { targetBtn.classList.add('active'); }
}

function mulaiKenalan() { 
    const mainContent = document.getElementById('main-content');
    if(mainContent) mainContent.scrollIntoView({ behavior: 'smooth' }); 
}

function kembaliHome() { 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const app = document.getElementById('gevagartApp');
        if (app && app.classList.contains('active')) closeGevagart();

        const music = document.getElementById('musicApp');
        if (music && music.classList.contains('active')) closeMusicApp();

        const bio = document.getElementById('gioBioModal');
        if (bio && bio.style.display === 'flex') closeGioBio();
    }
});

window.onclick = function(event) {
    if (event.target == modalCreator) closeCreatorModal();
    const modalLogo = document.getElementById("logoModal");
    if (event.target == modalLogo) closeLogoPreview();
    const modalBio = document.getElementById("gioBioModal");
    if (event.target == modalBio) closeGioBio();
}

window.addEventListener('scroll', function() {
    const nav = document.querySelector('nav');
    if (window.scrollY > 10) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});
function initHeroParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;
    const count = window.innerWidth < 600 ? 12 : 22;

    for (let i = 0; i < count; i++) {
        const p = document.createElement('span');
        p.className = 'hero-particle';
        const size = 3 + Math.random() * 5;
        const left = Math.random() * 100;
        const duration = 9 + Math.random() * 10;
        const delay = Math.random() * 12;
        const drift = (Math.random() * 80 - 40) + 'px';

        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = left + '%';
        p.style.setProperty('--drift', drift);
        p.style.animationDuration = duration + 's';
        p.style.animationDelay = delay + 's';

        container.appendChild(p);
    }
}

function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    function prepAndObserve(selector, staggerGroup = 8) {
        document.querySelectorAll(selector).forEach((el, i) => {
            if (el.classList.contains('reveal-on-scroll')) return;
            el.classList.add('reveal-on-scroll');
            el.style.transitionDelay = ((i % staggerGroup) * 0.06) + 's';
            observer.observe(el);
        });
    }

    prepAndObserve('.gevagart-item');
    prepAndObserve('.gio-fact');
    prepAndObserve('.platform-badge');

    prepAndObserve('#anomali .gallery-grid img');
}

let logoClickTimes = [];
function registerLogoClick(evt) {
    const now = Date.now();
    logoClickTimes.push(now);
    logoClickTimes = logoClickTimes.filter(t => now - t < 2500);
    if (logoClickTimes.length >= 5) {
        logoClickTimes = [];
        burstSparkles(evt.clientX, evt.clientY);
    }
}

function burstSparkles(x, y) {
    const count = 18;
    for (let i = 0; i < count; i++) {
        const s = document.createElement('span');
        s.className = 'spark-burst';
        const angle = (Math.PI * 2 * i) / count;
        const dist = 60 + Math.random() * 60;
        s.style.left = x + 'px';
        s.style.top = y + 'px';
        s.style.setProperty('--sx', Math.cos(angle) * dist + 'px');
        s.style.setProperty('--sy', Math.sin(angle) * dist + 'px');
        document.body.appendChild(s);
        s.addEventListener('animationend', () => s.remove());
    }
}

function initHeroBgSlideshow() {
    const slides = document.querySelectorAll('#heroBgSlideshow .hero-bg-slide');
    if (slides.length < 2) return;

    let current = 0;
    const intervalMs = 5000;

    setInterval(() => {
        const next = (current + 1) % slides.length;
        slides[current].classList.remove('active');
        slides[next].classList.add('active');
        current = next;
    }, intervalMs);
}

document.addEventListener('DOMContentLoaded', () => {
    initHeroParticles();
    initScrollReveal();
    initHeroBgSlideshow();
    scheduleGoblinWalk(8000 + Math.random() * 7000);
    initGoblinInteraction();

    document.querySelectorAll('.logo-wrapper, .sidebar-logo').forEach(el => {
        el.addEventListener('click', registerLogoClick);
    });
});


let goblinAnimId = null;
let goblinHeld = false;
let goblinPressing = false;
let goblinPressStart = { x: 0, y: 0 };
let goblinDragOffset = { x: 0, y: 0 };
let goblinLastPos = { x: 0, y: 0 };

// Transform untuk si kura-kura tergantung sisi mana yang lagi dia lewatin +
// arah geraknya, biar kaki selalu "nempel" ke arah tembok/lantai yang benar
// dan kepala selalu menghadap arah jalannya (nggak kebalik/mundur).
const GOBLIN_POSE = {
    'bottom-right': 'rotate(0deg)',
    'bottom-left':  'scaleX(-1)',
    'top-right':    'scaleY(-1)',
    'top-left':     'rotate(180deg)',
    'right-up':     'rotate(-90deg)',
    'right-down':   'rotate(90deg) scaleY(-1)',
    'left-up':      'rotate(90deg) scaleX(-1)',
    'left-down':    'rotate(90deg)'
};

// Urutan pojok + pose saat MENINGGALKAN tiap pojok, searah jarum jam / kebalikannya
const GOBLIN_POSE_CW  = ['bottom-right', 'right-up', 'top-left', 'left-down'];
const GOBLIN_POSE_CCW = ['left-up', 'bottom-left', 'right-down', 'top-right'];

const GOBLIN_ANGRY_PHRASES = [
    'Turunkan gue!',
    'Woy, lepasin!!',
    'APASIH SOK ASIK!',
    'WOI GIO KURANG AJAR!!',
    'Taruh balik!!',
    'Hei!! Jangan diangkat!'
];

function goblinPickPhrase() {
    const el = document.getElementById('goblinSpeech');
    if (!el) return;
    el.textContent = GOBLIN_ANGRY_PHRASES[Math.floor(Math.random() * GOBLIN_ANGRY_PHRASES.length)];
}

let goblinAudioCtx = null;
function goblinGetAudioCtx() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!goblinAudioCtx) goblinAudioCtx = new AC();
    if (goblinAudioCtx.state === 'suspended') goblinAudioCtx.resume();
    return goblinAudioCtx;
}

function goblinBeep(ctx, freq, start, duration, type, peak) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak || 0.15, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.03);
}

function goblinPlayAngrySound() {
    const ctx = goblinGetAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    goblinBeep(ctx, 320, now, 0.09, 'square', 0.16);
    goblinBeep(ctx, 230, now + 0.10, 0.09, 'square', 0.16);
    goblinBeep(ctx, 170, now + 0.20, 0.15, 'sawtooth', 0.18);
}

function goblinPlayReliefSound() {
    const ctx = goblinGetAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    goblinBeep(ctx, 420, now, 0.08, 'sine', 0.10);
    goblinBeep(ctx, 540, now + 0.09, 0.10, 'sine', 0.10);
}

function goblinCorners() {
    const mascot = document.getElementById('goblinMascot');
    const margin = 10;
    const w = mascot.offsetWidth || 90;
    const h = mascot.offsetHeight || 54;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const leftX = margin;
    const rightX = vw - margin - w;
    const topY = margin;
    const bottomY = vh - margin - h;

    // Urutan tetap: 0=BL, 1=BR, 2=TR, 3=TL
    return [
        { x: leftX,  y: bottomY },
        { x: rightX, y: bottomY },
        { x: rightX, y: topY },
        { x: leftX,  y: topY }
    ];
}

function goblinBuildRoute(corners, startIndex, clockwise) {
    const segments = [];
    let idx = startIndex;
    for (let i = 0; i < 4; i++) {
        const nextIdx = clockwise ? (idx + 1) % 4 : (idx + 3) % 4;
        const pose = clockwise ? GOBLIN_POSE_CW[idx] : GOBLIN_POSE_CCW[idx];
        segments.push({ from: corners[idx], to: corners[nextIdx], pose });
        idx = nextIdx;
    }
    return segments;
}

function goblinRunSegments(segments, opts) {
    const mascot = document.getElementById('goblinMascot');
    const rotor = document.getElementById('goblinRotor');
    if (!mascot || !rotor) return;

    const speed = 110; // px per detik
    const timedSegments = segments.map(s => {
        const dist = Math.hypot(s.to.x - s.from.x, s.to.y - s.from.y);
        return { ...s, duration: Math.max(dist / speed, 0.4) };
    });
    const totalDuration = timedSegments.reduce((sum, s) => sum + s.duration, 0);
    const fadeTime = 0.6;
    const fadeIn = opts && opts.fadeIn;
    const fadeOut = opts && opts.fadeOut;
    const onDone = opts && opts.onDone;

    mascot.classList.add('patrolling');
    if (fadeIn) mascot.style.opacity = '0';
    rotor.style.transform = GOBLIN_POSE[timedSegments[0].pose];

    let activePose = timedSegments[0].pose;
    const startTime = performance.now();

    function frame(now) {
        if (goblinHeld) { goblinAnimId = null; return; }

        const elapsed = (now - startTime) / 1000;

        if (elapsed >= totalDuration) {
            const last = timedSegments[timedSegments.length - 1].to;
            goblinLastPos = { x: last.x, y: last.y };
            mascot.style.transform = `translate(${last.x}px, ${last.y}px)`;
            if (fadeOut) {
                mascot.classList.remove('patrolling');
                mascot.style.opacity = '0';
            }
            goblinAnimId = null;
            if (onDone) onDone();
            return;
        }

        let t = elapsed;
        let seg = timedSegments[0];
        for (const s of timedSegments) {
            if (t <= s.duration) { seg = s; break; }
            t -= s.duration;
        }

        if (seg.pose !== activePose) {
            activePose = seg.pose;
            rotor.style.transform = GOBLIN_POSE[activePose];
        }

        const progress = Math.min(1, t / seg.duration);
        const x = seg.from.x + (seg.to.x - seg.from.x) * progress;
        const y = seg.from.y + (seg.to.y - seg.from.y) * progress;
        goblinLastPos = { x, y };

        mascot.style.transform = `translate(${x}px, ${y}px)`;

        if (fadeIn || fadeOut) {
            const opacity = Math.min(
                fadeIn ? elapsed / fadeTime : 1,
                fadeOut ? (totalDuration - elapsed) / fadeTime : 1
            );
            mascot.style.opacity = String(Math.max(0, Math.min(1, opacity)));
        }

        goblinAnimId = requestAnimationFrame(frame);
    }

    goblinAnimId = requestAnimationFrame(frame);
}

function patrolGoblin() {
    const mascot = document.getElementById('goblinMascot');
    if (!mascot) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (goblinAnimId || goblinHeld) return; // sudah jalan atau lagi dipegang, jangan tumpuk

    const corners = goblinCorners();
    const clockwise = Math.random() < 0.5;
    const segments = goblinBuildRoute(corners, 0, clockwise); // 0 = pojok kiri-bawah
    goblinRunSegments(segments, { fadeIn: true, fadeOut: true });
}

function scheduleGoblinWalk(firstDelay) {
    const delay = firstDelay !== undefined ? firstDelay : 25000 + Math.random() * 15000; // 25-40 detik
    setTimeout(() => {
        patrolGoblin();
        scheduleGoblinWalk();
    }, delay);
}

// --- Bisa disentuh & diseret; kalau diangkat dia marah; kalau dilepas, diam sebentar lalu jalan lagi ---
function goblinGetPoint(e) {
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
}

const GOBLIN_LIFT_THRESHOLD = 8; // px geseran minimum biar dianggap "diangkat", bukan cuma kesenggol/tersentuh

function goblinPointerDown(e) {
    const mascot = document.getElementById('goblinMascot');
    if (!mascot || !mascot.classList.contains('patrolling')) return; // cuma bisa dipegang pas lagi kelihatan jalan
    if (goblinHeld) return;

    e.preventDefault();
    goblinPressing = true;
    goblinHeld = false;

    const rect = mascot.getBoundingClientRect();
    const point = goblinGetPoint(e);
    goblinPressStart = point;
    goblinDragOffset.x = point.x - rect.left;
    goblinDragOffset.y = point.y - rect.top;
    goblinLastPos = { x: rect.left, y: rect.top };

    if (mascot.setPointerCapture && e.pointerId !== undefined) {
        try { mascot.setPointerCapture(e.pointerId); } catch (err) {}
    }
}

function goblinLiftNow(mascot) {
    goblinHeld = true;
    if (goblinAnimId) { cancelAnimationFrame(goblinAnimId); goblinAnimId = null; }
    mascot.classList.add('held');
    mascot.style.opacity = '1';
    goblinPickPhrase();
    goblinPlayAngrySound();
}

function goblinPointerMove(e) {
    if (!goblinPressing) return;
    const mascot = document.getElementById('goblinMascot');
    if (!mascot) return;

    const point = goblinGetPoint(e);

    if (!goblinHeld) {
        const dist = Math.hypot(point.x - goblinPressStart.x, point.y - goblinPressStart.y);
        if (dist < GOBLIN_LIFT_THRESHOLD) return; // masih dianggap sekadar sentuhan, belum "diangkat"
        goblinLiftNow(mascot);
    }

    const x = point.x - goblinDragOffset.x;
    const y = point.y - goblinDragOffset.y;
    goblinLastPos = { x, y };
    mascot.style.transform = `translate(${x}px, ${y}px)`;
}

function goblinPointerUp() {
    const mascot = document.getElementById('goblinMascot');
    const wasHeld = goblinHeld;
    goblinPressing = false;
    goblinHeld = false;
    if (!mascot || !wasHeld) return; // cuma sentuhan biasa (nggak sampai diangkat), biarin dia jalan terus

    // diturunin di posisi itu juga, langsung tenang lagi (bukan hilang)
    mascot.classList.remove('held');
    goblinPlayReliefSound();

    // diam sebentar dulu (kayak lega abis diturunin), baru jalan lagi dari situ
    setTimeout(() => {
        if (goblinHeld) return; // keburu diangkat lagi
        goblinResumeFromDrop();
    }, 900);
}

function goblinResumeFromDrop() {
    const mascot = document.getElementById('goblinMascot');
    if (!mascot || goblinHeld) return;

    const corners = goblinCorners();
    const dropPoint = { x: goblinLastPos.x, y: goblinLastPos.y };

    // cari pojok terdekat dari posisi diturunin
    let nearestIdx = 0;
    let nearestDist = Infinity;
    corners.forEach((c, i) => {
        const d = Math.hypot(c.x - dropPoint.x, c.y - dropPoint.y);
        if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    });

    // jalan pelan dulu balik ke jalur pinggir layar, baru lanjut muter seperti biasa
    const settlePose = (corners[nearestIdx].x >= dropPoint.x) ? 'bottom-right' : 'bottom-left';
    const settleSegment = { from: dropPoint, to: corners[nearestIdx], pose: settlePose };

    const clockwise = Math.random() < 0.5;
    const loopSegments = goblinBuildRoute(corners, nearestIdx, clockwise);

    goblinRunSegments([settleSegment, ...loopSegments], { fadeIn: false, fadeOut: true });
}

function initGoblinInteraction() {
    const mascot = document.getElementById('goblinMascot');
    if (!mascot) return;
    mascot.addEventListener('pointerdown', goblinPointerDown);
    window.addEventListener('pointermove', goblinPointerMove);
    window.addEventListener('pointerup', goblinPointerUp);
    window.addEventListener('pointercancel', goblinPointerUp);
}