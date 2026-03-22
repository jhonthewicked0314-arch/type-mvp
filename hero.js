/**
 * hero.js — TypeMaster Pro Hero Banner
 * Wrapped in DOMContentLoaded + IIFE so zero global variables
 * are created and nothing interferes with script.js / lessons.js.
 */
document.addEventListener('DOMContentLoaded', function () {
    (function () {

        /* ── Guard: only run if hero exists on this page ── */
        const heroSection = document.querySelector('.hero');
        if (!heroSection) return;

        /* ══════════════════════════════════════════════════
           CONFIG
        ══════════════════════════════════════════════════ */
        const PHRASES = [
            "The quick brown fox jumps over the lazy dog.",
            "Precision builds confidence over time.",
            "Speed comes naturally with focused practice.",
            "Every keystroke is a step toward mastery.",
            "Accuracy is the foundation of great typing.",
            "Flow state begins when hesitation ends.",
            "Train your fingers to think for themselves.",
            "Good habits compound into exceptional skill.",
            "Consistency turns effort into effortless skill.",
        ];

        /* ══════════════════════════════════════════════════
           DOM REFS — all scoped inside heroSection
        ══════════════════════════════════════════════════ */
        const allKeys = [...heroSection.querySelectorAll('.hb-key')];
        const charKeys = allKeys.filter(k => k.dataset.char && k.dataset.char.length > 0);
        const typePreview = heroSection.querySelector('#hbTypePreview');
        const cursorEl = heroSection.querySelector('#hbCursor');
        const kbWrap = heroSection.querySelector('#hbKbWrap');
        const rightPanel = heroSection.querySelector('#hbRightPanel');
        const ambientLayer = heroSection.querySelector('#hbAmbientLayer');
        const svgLayer = heroSection.querySelector('#hbSvgAmbientLayer');

        if (!typePreview || !cursorEl || !kbWrap || !rightPanel) return;

        /* char → key element map */
        const charToKey = {};
        charKeys.forEach(k => {
            const ch = k.dataset.char;
            if (ch.length === 1) charToKey[ch.toLowerCase()] = k;
            if (ch === ' ') charToKey[' '] = k;
        });

        /* ══════════════════════════════════════════════════
           STATE
        ══════════════════════════════════════════════════ */
        let userHovering = false;
        let resumeTimer = null;
        let phraseIdx = 0;
        let charIdx = 0;
        let deleting = false;
        let autoTimer = null;
        let hoverBuf = '';

        /* ══════════════════════════════════════════════════
           HELPERS
        ══════════════════════════════════════════════════ */
        const rnd = (a, b) => Math.random() * (b - a) + a;
        const rndI = (a, b) => Math.floor(rnd(a, b + 1));
        const tick = (fn, ms) => { clearTimeout(autoTimer); autoTimer = setTimeout(fn, ms); };

        /* ══════════════════════════════════════════════════
           PREVIEW DOM
        ══════════════════════════════════════════════════ */
        function appendChar(ch) {
            const span = document.createElement('span');
            span.className = 'hb-type-char';
            span.textContent = ch === ' ' ? '\u00A0' : ch;
            typePreview.insertBefore(span, cursorEl);
            const spans = typePreview.querySelectorAll('.hb-type-char');
            if (spans.length > 54) spans[0].remove();
        }

        function removeLastChar() {
            const spans = typePreview.querySelectorAll('.hb-type-char');
            if (spans.length) spans[spans.length - 1].remove();
        }

        function clearPreviewChars() {
            typePreview.querySelectorAll('.hb-type-char').forEach(s => s.remove());
        }

        function setPreviewFull(text) {
            clearPreviewChars();
            [...text].forEach((ch, i) => {
                const span = document.createElement('span');
                span.className = 'hb-type-char';
                span.textContent = ch === ' ' ? '\u00A0' : ch;
                span.style.animationDelay = `${i * 9}ms`;
                typePreview.insertBefore(span, cursorEl);
            });
        }

        /* ══════════════════════════════════════════════════
           KEY PRESS ANIMATION
        ══════════════════════════════════════════════════ */
        function pressKey(el, holdMs) {
            holdMs = holdMs || 120;
            if (!el || el.classList.contains('hb-auto-press')) return;
            el.classList.add('hb-auto-press');
            setTimeout(function () { el.classList.remove('hb-auto-press'); }, holdMs);
        }

        /* ══════════════════════════════════════════════════
           AUTO-TYPING ENGINE
        ══════════════════════════════════════════════════ */
        function step() {
            if (userHovering) return;
            const phrase = PHRASES[phraseIdx];

            if (!deleting) {
                const ch = phrase[charIdx];
                charIdx++;
                pressKey(charToKey[ch.toLowerCase()] || charToKey[ch], rndI(85, 155));
                appendChar(ch);

                if (charIdx >= phrase.length) {
                    tick(function () { deleting = true; step(); }, rnd(1700, 2600));
                    return;
                }

                var delay;
                var r = Math.random();
                if (ch === ' ') delay = rnd(65, 130);
                else if (r < 0.03) delay = rnd(300, 520);
                else if (r < 0.09) delay = rnd(140, 230);
                else delay = rnd(45, 105);
                tick(step, delay);

            } else {
                removeLastChar();
                charIdx--;
                if (charIdx <= 0) {
                    charIdx = 0;
                    deleting = false;
                    phraseIdx = (phraseIdx + 1) % PHRASES.length;
                    tick(step, rnd(300, 500));
                    return;
                }
                tick(step, rnd(26, 50));
            }
        }

        setTimeout(function () { step(); }, 1300);

        /* ══════════════════════════════════════════════════
           AMBIENT DECOR-KEY SHIMMER
        ══════════════════════════════════════════════════ */
        var decorKeys = allKeys.filter(function (k) {
            return !k.dataset.char || k.dataset.char.length === 0;
        });

        function shimmerLoop() {
            if (!userHovering && Math.random() < 0.38 && decorKeys.length) {
                var k = decorKeys[rndI(0, decorKeys.length - 1)];
                var prev = k.style.transition;
                k.style.transition = 'background 280ms ease, box-shadow 280ms ease';
                k.style.background = '#f6f8ff';
                k.style.boxShadow = '0 0 0 1px rgba(74,108,247,0.09), 0 0 9px rgba(74,108,247,0.07)';
                setTimeout(function () {
                    k.style.background = '';
                    k.style.boxShadow = '';
                    setTimeout(function () { k.style.transition = prev; }, 300);
                }, rndI(160, 360));
            }
            setTimeout(shimmerLoop, rnd(800, 2200));
        }
        setTimeout(shimmerLoop, 2400);

        /* ══════════════════════════════════════════════════
           HOVER — key mouseenter shows typed chars
        ══════════════════════════════════════════════════ */
        allKeys.forEach(function (key) {
            key.addEventListener('mouseenter', function () {
                var ch = key.dataset.char;
                if (!ch || ch.length === 0) return;
                userHovering = true;
                clearTimeout(resumeTimer);
                clearTimeout(autoTimer);
                hoverBuf += (ch === ' ' ? ' ' : ch);
                if (hoverBuf.length > 40) hoverBuf = hoverBuf.slice(-40);
                setPreviewFull(hoverBuf);
            });
        });

        /* resume auto typing after leaving the panel */
        rightPanel.addEventListener('mouseleave', function () {
            clearTimeout(resumeTimer);
            resumeTimer = setTimeout(function () {
                userHovering = false;
                hoverBuf = '';
                clearPreviewChars();
                charIdx = 0;
                deleting = false;
                tick(step, 700);
            }, 2200);
        });

        rightPanel.addEventListener('mouseenter', function () {
            clearTimeout(resumeTimer);
        });

        /* ══════════════════════════════════════════════════
           PARALLAX TILT
        ══════════════════════════════════════════════════ */
        rightPanel.addEventListener('mousemove', function (e) {
            var rect = rightPanel.getBoundingClientRect();
            var dx = (e.clientX - rect.left - rect.width / 2) / rect.width;
            var dy = (e.clientY - rect.top - rect.height / 2) / rect.height;
            kbWrap.style.transform =
                'rotateX(' + (14 - dy * 6) + 'deg) ' +
                'rotateY(' + (-4 + dx * 7) + 'deg) ' +
                'rotateZ(' + (1.5 + dx * 0.5) + 'deg)';
        });

        rightPanel.addEventListener('mouseleave', function () {
            kbWrap.style.transform = 'rotateX(14deg) rotateY(-4deg) rotateZ(1.5deg)';
        });

        /* ══════════════════════════════════════════════════
           REAL KEYBOARD PASSTHROUGH
           Scoped: only highlights hero keys, won't fire
           on the typing test input.
        ══════════════════════════════════════════════════ */
        document.addEventListener('keydown', function (e) {
            var ch = e.key.toLowerCase();
            allKeys.forEach(function (k) {
                if (k.dataset.char === ch || k.dataset.char === e.key) {
                    k.classList.add('hb-active');
                }
            });
        });
        document.addEventListener('keyup', function () {
            allKeys.forEach(function (k) { k.classList.remove('hb-active'); });
        });

        /* ══════════════════════════════════════════════════
           FLOATING AMBIENT DIV-KEY SHAPES
        ══════════════════════════════════════════════════ */
        (function buildAmbientKeys() {
            if (!ambientLayer) return;
            var glyphs = ['A', 'S', 'D', 'F', 'J', 'K', 'L', '↵', '⇧', '⌘', 'Tab', '⌫', 'Z', 'M', ';'];
            var positions = [
                { right: '8%', top: '12%' }, { right: '82%', top: '8%' }, { right: '5%', top: '70%' },
                { right: '88%', top: '78%' }, { right: '15%', top: '85%' }, { right: '70%', top: '15%' },
                { right: '50%', top: '82%' }, { right: '92%', top: '45%' }, { right: '3%', top: '40%' },
                { right: '60%', top: '6%' }, { right: '25%', top: '5%' }, { right: '78%', top: '88%' },
            ];

            positions.forEach(function (pos, i) {
                var el = document.createElement('div');
                el.className = 'hb-amb-key';
                var w = rndI(28, 50);
                var h = rndI(25, 36);
                var dur = rnd(14, 24);
                var del = rnd(0, 8);
                var dy = rnd(-32, -14);
                var r0 = rnd(-8, 8);
                var r1 = rnd(-14, 14);
                var op = rnd(0.28, 0.52);
                el.style.width = w + 'px';
                el.style.height = h + 'px';
                el.style.right = pos.right;
                el.style.top = pos.top;
                el.textContent = glyphs[i % glyphs.length];

                el.animate([
                    { opacity: 0, transform: 'translateY(0px) rotate(' + r0 + 'deg)' },
                    { opacity: op, transform: 'translateY(' + Math.round(dy / 2) + 'px) rotate(' + ((r0 + r1) / 2) + 'deg)', offset: 0.15 },
                    { opacity: op, transform: 'translateY(' + Math.round(dy / 2) + 'px) rotate(' + ((r0 + r1) / 2) + 'deg)', offset: 0.85 },
                    { opacity: 0, transform: 'translateY(' + dy + 'px) rotate(' + r1 + 'deg)' },
                ], {
                    duration: dur * 1000,
                    delay: del * 1000,
                    iterations: Infinity,
                    easing: 'ease-in-out',
                    fill: 'both',
                });

                ambientLayer.appendChild(el);
            });
        })();

        /* ══════════════════════════════════════════════════
           SVG AMBIENT ELEMENTS
        ══════════════════════════════════════════════════ */
        (function buildSvgAmbient() {
            if (!svgLayer) return;

            var SHAPES = [
                /* 0 — double-walled keycap */
                '<svg width="44" height="36" viewBox="0 0 44 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="41" height="33" rx="6.5" stroke="currentColor" stroke-width="1.1" fill="none"/><rect x="5" y="5" width="34" height="26" rx="4" stroke="currentColor" stroke-width="0.6" fill="none" opacity="0.55"/></svg>',
                /* 1 — I-beam cursor */
                '<svg width="18" height="30" viewBox="0 0 18 30" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="1" y1="2.5" x2="17" y2="2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="9" y1="2.5" x2="9" y2="27.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="1" y1="27.5" x2="17" y2="27.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
                /* 2 — three text lines */
                '<svg width="52" height="28" viewBox="0 0 52 28" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="4" x2="52" y2="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="0" y1="14" x2="40" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="0" y1="24" x2="46" y2="24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
                /* 3 — right arrow */
                '<svg width="30" height="18" viewBox="0 0 30 18" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="9" x2="26" y2="9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><polyline points="18,3 26,9 18,15" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                /* 4 — square brackets */
                '<svg width="34" height="30" viewBox="0 0 34 30" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2 L4 2 L4 28 L10 28" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 2 L30 2 L30 28 L24 28" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                /* 5 — enter symbol */
                '<svg width="34" height="26" viewBox="0 0 34 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 4 L30 14 L6 14" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><polyline points="12,8 6,14 12,20" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                /* 6 — three mini keycaps */
                '<svg width="44" height="18" viewBox="0 0 44 18" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="12" height="16" rx="2.5" stroke="currentColor" stroke-width="1" fill="none"/><rect x="16" y="1" width="12" height="16" rx="2.5" stroke="currentColor" stroke-width="1" fill="none"/><rect x="31" y="1" width="12" height="16" rx="2.5" stroke="currentColor" stroke-width="1" fill="none"/></svg>',
                /* 7 — forward slash */
                '<svg width="20" height="34" viewBox="0 0 20 34" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="17" y1="2" x2="3" y2="32" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
                /* 8 — dot grid */
                '<svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="4" r="2" fill="currentColor"/><circle cx="14" cy="4" r="2" fill="currentColor"/><circle cx="24" cy="4" r="2" fill="currentColor"/><circle cx="4" cy="16" r="2" fill="currentColor"/><circle cx="14" cy="16" r="2" fill="currentColor"/><circle cx="24" cy="16" r="2" fill="currentColor"/></svg>',
                /* 9 — spacebar outline */
                '<svg width="80" height="26" viewBox="0 0 80 26" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="78" height="24" rx="5" stroke="currentColor" stroke-width="1" fill="none"/></svg>',
                /* 10 — up arrow */
                '<svg width="18" height="30" viewBox="0 0 18 30" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="9" y1="28" x2="9" y2="4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><polyline points="3,10 9,4 15,10" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                /* 11 — curly braces */
                '<svg width="38" height="40" viewBox="0 0 38 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2 Q8 2 8 8 L8 16 Q8 20 4 20 Q8 20 8 24 L8 32 Q8 38 14 38" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 2 Q30 2 30 8 L30 16 Q30 20 34 20 Q30 20 30 24 L30 32 Q30 38 24 38" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                /* 12 — semicolon */
                '<svg width="14" height="30" viewBox="0 0 14 30" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="8" r="2.5" fill="currentColor"/><path d="M7 18 Q7 26 3 28" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/><circle cx="7" cy="18" r="2.5" fill="currentColor"/></svg>',
                /* 13 — backspace arrow */
                '<svg width="34" height="22" viewBox="0 0 34 22" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="14,4 4,11 14,18" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="4" y1="11" x2="30" y2="11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
                /* 14 — 2×2 key grid */
                '<svg width="32" height="36" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="13" height="14" rx="2.5" stroke="currentColor" stroke-width="1" fill="none"/><rect x="18" y="1" width="13" height="14" rx="2.5" stroke="currentColor" stroke-width="1" fill="none"/><rect x="1" y="21" width="13" height="14" rx="2.5" stroke="currentColor" stroke-width="1" fill="none"/><rect x="18" y="21" width="13" height="14" rx="2.5" stroke="currentColor" stroke-width="1" fill="none"/></svg>',
                /* 15 — underscore */
                '<svg width="28" height="10" viewBox="0 0 28 10" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="1" y1="7" x2="27" y2="7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
            ];

            var ITEMS = [
                { s: 0, l: '73%', t: '18%', baseOp: 0.11, dur: 17, delay: 0, dX: 8, dY: -22, r0: -5, r1: 6, near: true },
                { s: 6, l: '10%', t: '42%', baseOp: 0.10, dur: 20, delay: 2.8, dX: -6, dY: -18, r0: 3, r1: -8, near: true },
                { s: 4, l: '58%', t: '72%', baseOp: 0.12, dur: 15, delay: 1.2, dX: 5, dY: -24, r0: -10, r1: 5, near: true },
                { s: 1, l: '30%', t: '14%', baseOp: 0.09, dur: 22, delay: 4.5, dX: -4, dY: -16, r0: 8, r1: -4, near: true },
                { s: 5, l: '80%', t: '68%', baseOp: 0.10, dur: 18, delay: 3.1, dX: 6, dY: -20, r0: -3, r1: 11, near: true },
                { s: 10, l: '52%', t: '6%', baseOp: 0.08, dur: 19, delay: 1.8, dX: -5, dY: -18, r0: -7, r1: 3, near: true },
                { s: 13, l: '85%', t: '44%', baseOp: 0.09, dur: 21, delay: 7.2, dX: 4, dY: -22, r0: 2, r1: -9, near: true },
                { s: 2, l: '22%', t: '78%', baseOp: 0.09, dur: 24, delay: 6.0, dX: -7, dY: -14, r0: 5, r1: -6, near: true },
                { s: 14, l: '42%', t: '55%', baseOp: 0.08, dur: 16, delay: 9.0, dX: 3, dY: -20, r0: -4, r1: 8, near: true },
                { s: 15, l: '65%', t: '32%', baseOp: 0.10, dur: 13, delay: 5.5, dX: -3, dY: -12, r0: 0, r1: 2, near: true },
                { s: 3, l: '18%', t: '28%', baseOp: 0.07, dur: 26, delay: 0.8, dX: 9, dY: -30, r0: -12, r1: 7, near: false },
                { s: 9, l: '60%', t: '88%', baseOp: 0.06, dur: 28, delay: 5.0, dX: -8, dY: -26, r0: 6, r1: -10, near: false },
                { s: 7, l: '88%', t: '12%', baseOp: 0.06, dur: 23, delay: 11.0, dX: 5, dY: -28, r0: -9, r1: 5, near: false },
                { s: 11, l: '5%', t: '60%', baseOp: 0.07, dur: 25, delay: 3.8, dX: 10, dY: -20, r0: 4, r1: -12, near: false },
                { s: 12, l: '75%', t: '84%', baseOp: 0.06, dur: 29, delay: 14.0, dX: -4, dY: -22, r0: -6, r1: 8, near: false },
                { s: 8, l: '2%', t: '8%', baseOp: 0.05, dur: 32, delay: 2.0, dX: 6, dY: -34, r0: 10, r1: -8, near: false },
                { s: 0, l: '90%', t: '90%', baseOp: 0.05, dur: 34, delay: 8.5, dX: -7, dY: -28, r0: 14, r1: -4, near: false },
                { s: 3, l: '45%', t: '96%', baseOp: 0.04, dur: 30, delay: 16.0, dX: 4, dY: -20, r0: -5, r1: 9, near: false },
                { s: 6, l: '2%', t: '82%', baseOp: 0.05, dur: 27, delay: 7.0, dX: 8, dY: -26, r0: 3, r1: -11, near: false },
                { s: 9, l: '50%', t: '2%', baseOp: 0.04, dur: 36, delay: 18.0, dX: -5, dY: -32, r0: -8, r1: 6, near: false },
            ];

            var svgAnims = [];

            ITEMS.forEach(function (item, i) {
                var wrap = document.createElement('div');
                wrap.className = 'hb-svg-el';
                var isAccent = i % 3 !== 1;
                wrap.style.color = isAccent ? 'rgba(74,108,247,0.9)' : 'rgba(100,102,130,0.9)';
                if (!item.near) {
                    wrap.style.filter = 'blur(' + (Math.random() * 0.6 + 0.3).toFixed(1) + 'px)';
                }
                wrap.style.left = item.l;
                wrap.style.top = item.t;
                wrap.innerHTML = SHAPES[item.s % SHAPES.length];
                svgLayer.appendChild(wrap);

                var midX = (item.dX * 0.5);
                var midY = (item.dY * 0.5);
                var midR = (item.r0 + item.r1) / 2;

                var anim = wrap.animate([
                    { opacity: 0, transform: 'translate(0px,0px) rotate(' + item.r0 + 'deg)' },
                    { opacity: item.baseOp, transform: 'translate(' + midX + 'px,' + midY + 'px) rotate(' + midR + 'deg)', offset: 0.18 },
                    { opacity: item.baseOp, transform: 'translate(' + midX + 'px,' + midY + 'px) rotate(' + midR + 'deg)', offset: 0.82 },
                    { opacity: 0, transform: 'translate(' + item.dX + 'px,' + item.dY + 'px) rotate(' + item.r1 + 'deg)' },
                ], {
                    duration: item.dur * 1000,
                    delay: item.delay * 1000,
                    iterations: Infinity,
                    easing: 'ease-in-out',
                    fill: 'both',
                });

                svgAnims.push(anim);
            });

            /* hover: speed up SVG animations + CSS tint */
            rightPanel.addEventListener('mouseenter', function () {
                rightPanel.classList.add('hb-svg-hovered');
                svgAnims.forEach(function (a) { a.playbackRate = 1.45; });
            });
            rightPanel.addEventListener('mouseleave', function () {
                rightPanel.classList.remove('hb-svg-hovered');
                svgAnims.forEach(function (a) { a.playbackRate = 1.0; });
            });

        })(); /* end buildSvgAmbient */

    })();
}); /* end DOMContentLoaded */