const modalCreator = document.getElementById("creatorModal");
const statusText = document.getElementById('status');
let progressInterval;

/* ===================== YOUTUBE PLAYER ENGINE ===================== */
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
/* =================================================================== */

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
    // Musik TIDAK dihentikan di sini -- biar tetap lanjut walau pindah halaman/app lain.
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
/* ===================== HERO FLOATING PARTICLES ===================== */
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

/* ===================== SCROLL REVEAL ===================== */
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

    // Galeri "Koleksi" ada di dalam tab yang disembunyikan (display:none) saat awal load,
    // jadi elemen di dalamnya baru diobservasi begitu tabnya benar-benar ditampilkan.
    prepAndObserve('#normal .gallery-grid img');
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setTimeout(() => prepAndObserve('.tab-content.active .gallery-grid img'), 30);
        });
    });
}

/* ===================== LOGO EASTER EGG ===================== */
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

document.addEventListener('DOMContentLoaded', () => {
    initHeroParticles();
    initScrollReveal();
    scheduleGoblinWalk(8000 + Math.random() * 7000); // kemunculan pertama: 8-15 detik setelah load

    document.querySelectorAll('.logo-wrapper, .sidebar-logo').forEach(el => {
        el.addEventListener('click', registerLogoClick);
    });
});

/* ===================== GOBLIN THE TURTLE MASCOT ===================== */
function walkGoblin() {
    const mascot = document.getElementById('goblinMascot');
    if (!mascot) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const direction = Math.random() < 0.5 ? 'dir-right' : 'dir-left';
    const duration = 14 + Math.random() * 6; // 14-20 detik jalan santai
    mascot.style.setProperty('--goblin-duration', duration + 's');

    mascot.classList.remove('walking', 'dir-right', 'dir-left');
    void mascot.offsetWidth; // reset animasi
    mascot.classList.add('walking', direction);

    const cleanup = () => {
        mascot.classList.remove('walking', direction);
        mascot.removeEventListener('animationend', cleanup);
    };
    mascot.addEventListener('animationend', cleanup);
}

function scheduleGoblinWalk(firstDelay) {
    const delay = firstDelay !== undefined ? firstDelay : 25000 + Math.random() * 15000; // 25-40 detik
    setTimeout(() => {
        walkGoblin();
        scheduleGoblinWalk();
    }, delay);
}