/* ════════════════════════════════════════════════════════
   main.js — Yebum Portfolio
   수정 가이드:
   · 프로젝트 추가/수정  → [PROJECTS DATA] 블록
   · 작업물 사진/영상    → 각 프로젝트 media 배열
   · 프로젝트 설명       → desc1, desc2, sections
   · 다크/라이트 토글    → [THEME] 블록
   · 커서 끄기           → [CURSOR] 블록 주석 처리
════════════════════════════════════════════════════════ */


(function () {
  'use strict';

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  /* ══════════════════════════════════
     CURSOR
  ══════════════════════════════════ */
  const cDot = $('#cur'), cRing = $('#cur-ring'), cLbl = $('#cur-lbl');
  let cx = 0, cy = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { cx = e.clientX; cy = e.clientY; });
  (function ct() {
    rx = lerp(rx, cx, .11); ry = lerp(ry, cy, .11);
    cDot.style.left = cx + 'px'; cDot.style.top = cy + 'px';
    cRing.style.left = rx + 'px'; cRing.style.top = ry + 'px';
    cLbl.style.left = rx + 'px'; cLbl.style.top = ry + 'px';
    requestAnimationFrame(ct);
  })();
  $$('a').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.className = 'ch');
    el.addEventListener('mouseleave', () => document.body.className = '');
  });
  $$('.wcard').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.className = 'cv');
    el.addEventListener('mouseleave', () => document.body.className = '');
  });

  /* ══════════════════════════════════
     HERO — GRID DISTORTION
     미래적인 인터랙션: 마우스 위치에 따라
     perspective grid가 왜곡되고 
     교점(node)들이 마우스를 향해 끌림
  ══════════════════════════════════ */
  const heroEl = $('#hero');
  const gc = $('#grid-canvas');
  const gctx = gc.getContext('2d');
  let GW, GH;
  let gmx = 0, gmy = 0, tgmx = 0, tgmy = 0; // target vs smoothed mouse

  function resizeGrid() {
    GW = gc.width = window.innerWidth;
    GH = gc.height = window.innerHeight;
  }
  resizeGrid();
  window.addEventListener('resize', resizeGrid);

  heroEl.addEventListener('mousemove', e => {
    tgmx = e.clientX; tgmy = e.clientY;
  });

  /* Grid parameters */
  const COLS = 14, ROWS = 10;
  const PULL_RADIUS = 180;
  const PULL_STRENGTH = 0.38;

  function drawGrid() {
    gctx.clearRect(0, 0, GW, GH);

    // Smooth mouse
    gmx = lerp(gmx, tgmx, .06);
    gmy = lerp(gmy, tgmy, .06);

    const cellW = GW / COLS;
    const cellH = GH / ROWS;

    // Build node grid with displacement
    const nodes = [];
    for (let r = 0; r <= ROWS; r++) {
      nodes[r] = [];
      for (let c = 0; c <= COLS; c++) {
        const bx = c * cellW;
        const by = r * cellH;
        const dx = bx - gmx;
        const dy = by - gmy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let nx = bx, ny = by;
        if (dist < PULL_RADIUS && dist > 0) {
          const pull = (1 - dist / PULL_RADIUS) * PULL_STRENGTH;
          nx = bx - dx * pull;
          ny = by - dy * pull;
        }
        nodes[r][c] = { x: nx, y: ny };
      }
    }

    // Draw grid lines
    const _rgb = window._gridRGB || '59,143,245'; gctx.strokeStyle = `rgba(${_rgb},.06)`;
    gctx.lineWidth = .8;

    // Horizontal lines
    for (let r = 0; r <= ROWS; r++) {
      gctx.beginPath();
      for (let c = 0; c <= COLS; c++) {
        const n = nodes[r][c];
        c === 0 ? gctx.moveTo(n.x, n.y) : gctx.lineTo(n.x, n.y);
      }
      gctx.stroke();
    }
    // Vertical lines
    for (let c = 0; c <= COLS; c++) {
      gctx.beginPath();
      for (let r = 0; r <= ROWS; r++) {
        const n = nodes[r][c];
        r === 0 ? gctx.moveTo(n.x, n.y) : gctx.lineTo(n.x, n.y);
      }
      gctx.stroke();
    }

    // Draw nodes at intersections (dots that pulse near cursor)
    for (let r = 0; r <= ROWS; r++) {
      for (let c = 0; c <= COLS; c++) {
        const n = nodes[r][c];
        const bx = c * cellW, by = r * cellH;
        const odx = bx - gmx, ody = by - gmy;
        const odist = Math.sqrt(odx * odx + ody * ody);
        const proximity = Math.max(0, 1 - odist / PULL_RADIUS);

        const radius = .8 + proximity * 2.5;
        const alpha = .12 + proximity * .5;

        gctx.beginPath();
        gctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        gctx.fillStyle = `rgba(${window._gridRGB || '59,143,245'},${alpha})`;
        gctx.fill();
      }
    }

    // Draw cursor crosshair lines (thin, extending across screen)
    const hairAlpha = .07;
    gctx.strokeStyle = `rgba(${window._gridRGB || '59,143,245'},${hairAlpha})`;
    gctx.lineWidth = .6;
    gctx.setLineDash([4, 8]);
    gctx.beginPath(); gctx.moveTo(gmx, 0); gctx.lineTo(gmx, GH); gctx.stroke();
    gctx.beginPath(); gctx.moveTo(0, gmy); gctx.lineTo(GW, gmy); gctx.stroke();
    gctx.setLineDash([]);

    // Cursor position readout (coordinate label)
    const xPct = Math.round(gmx / GW * 100);
    const yPct = Math.round(gmy / GH * 100);
    gctx.font = `300 9px 'DM Mono', monospace`;
    gctx.fillStyle = `rgba(${window._gridRGB || '59,143,245'},.35)`;
    gctx.letterSpacing = '.1em';
    gctx.fillText(`${String(xPct).padStart(3, '0')} · ${String(yPct).padStart(3, '0')}`,
      gmx + 10, gmy - 8);

    requestAnimationFrame(drawGrid);
  }
  drawGrid();

  /* ══════════════════════════════════
     HERO LETTER PHYSICS
  ══════════════════════════════════ */
  const hLetters = $$('.hl');
  let hd = [], heroAlive = true;
  let hmx = window.innerWidth / 2, hmy = window.innerHeight / 2;

  document.addEventListener('mousemove', e => {
    const r = heroEl.getBoundingClientRect();
    hmx = e.clientX - r.left; hmy = e.clientY - r.top;
  });

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     [HERO PHYSICS] 히어로 텍스트 물리 효과
     🔧 튕김 강도 → STIFFNESS / DAMPING 수정
     🔧 영향 반경 → RADIUS 수정
     🔧 효과 끄기 → 이 함수 전체 주석 처리
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function initPhysics() {
    const hr = heroEl.getBoundingClientRect();
    hd = hLetters.map((el, i) => {
      const r = el.getBoundingClientRect();
      const ox = r.left - hr.left + r.width / 2;
      const oy = r.top - hr.top + r.height / 2;
      const prev = hd[i];
      return {
        el, ox, oy,
        x: prev ? prev.x : ox, y: prev ? prev.y : oy,
        vx: 0, vy: 0, rot: 0, rv: 0,
        fr: .87 + Math.random() * .04,
        rr: 140 + Math.random() * 35,
        m: 1.2 + Math.random() * .5, el2: .48
      };
    });
  }

  (function physLoop() {
    if (heroAlive) hd.forEach(d => {
      const dx = d.x - hmx, dy = d.y - hmy;
      const dist = Math.sqrt(dx * dx + dy * dy) || .01;
      if (dist < d.rr) {
        const n = (d.rr - dist) / d.rr, f = n * n * 26;
        d.vx += (dx / dist) * f / d.m; d.vy += (dy / dist) * f / d.m; d.rv += (dx / dist) * f * .08;
      }
      d.vx += (d.ox - d.x) * .055; d.vy += (d.oy - d.y) * .055;
      d.vx *= d.fr; d.vy *= d.fr; d.rv *= .87;
      d.x += d.vx; d.y += d.vy; d.rot += d.rv;
      d.el.style.transform = `translate(${d.x - d.ox}px,${d.y - d.oy}px) rotate(${d.rot}deg)`;
    });
    requestAnimationFrame(physLoop);
  })();

  heroEl.addEventListener('click', e => {
    const hr = heroEl.getBoundingClientRect();
    hd.forEach(d => {
      const dx = d.x - (e.clientX - hr.left), dy = d.y - (e.clientY - hr.top);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = Math.max(0, (300 - dist) / 300) * 38;
      d.vx += (dx / dist) * f; d.vy += (dy / dist) * f; d.rv += (Math.random() - .5) * f * .3;
    });
  });

  window.addEventListener('resize', () => setTimeout(initPhysics, 80));
  document.fonts.ready.then(() => setTimeout(initPhysics, 100));

  window.addEventListener('scroll', () => {
    const p = clamp(window.scrollY / window.innerHeight, 0, 1);
    heroEl.style.opacity = 1 - p * .8; heroAlive = p < .85;
  }, { passive: true });

  /* ══════════════════════════════════
     WORK SCROLL — 완전히 새로운 방식
     
     핵심 원리:
     - #work-wrap의 높이 = 100vh + slideWidth
     - slideWidth = track.scrollWidth - vw
     - sticky 진입 시점 = work-wrap의 offsetTop
     
     offsetTop을 정확히 얻는 방법:
     el.getBoundingClientRect().top은 현재 
     스크롤 위치에 따라 변하므로 신뢰 불가.
     
     대신: 페이지 최상단 기준 절대 위치를 
     getAbsoluteTop()으로 계산.
     이 값은 레이아웃이 변하지 않는 한 고정.
  ══════════════════════════════════ */
  const workWrap = $('#work-wrap');
  const workTrack = $('#w-track');
  const wProg = $('#w-prog');
  const wNumEl = $('#wn');
  const wCards = $$('.wcard');
  const NCARDS = wCards.length;

  let slideWidth = 0;   // 트랙이 슬라이드해야 할 총 거리
  let wrapTop = 0;   // 문서 최상단 기준 work-wrap의 top 위치

  /* 요소의 문서 내 절대 top 위치 계산 */
  let _initWorkTimer = null;

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     [WORK SECTION] 작업물 가로 스크롤 초기화
     🔧 스크롤 속도 → multiplier 값 수정
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function initWork() {
    // 중복 호출 방지 — 이전 예약된 initWork가 있으면 취소
    if (_initWorkTimer) clearTimeout(_initWorkTimer);

    _initWorkTimer = setTimeout(() => {
      _initWorkTimer = null;

      // 1. 트랙 리셋 + wrap 높이 초기화
      workTrack.style.transform = 'translateX(0)';
      workWrap.style.height = '';

      // 2. 3번의 rAF으로 레이아웃 완전히 settle 후 측정
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {

        // 3. 슬라이드 폭 측정
        slideWidth = workTrack.scrollWidth - window.innerWidth;
        if (slideWidth < 1) slideWidth = 1;

        // 4. wrap 높이 설정
        workWrap.style.height = (window.innerHeight + slideWidth) + 'px';

        // 5. wrapTop: getBoundingClientRect + scrollY 방식 (offsetParent 체인보다 안정적)
        //    height 변경 후 offsetHeight로 강제 reflow 후 측정
        void workWrap.offsetHeight;
        wrapTop = workWrap.getBoundingClientRect().top + window.scrollY;

        // 6. 즉시 반영
        applyWork();
      })));
    }, 30);
  }

  function applyWork() {
    if (slideWidth < 1) return;

    const scrolled = window.scrollY - wrapTop;
    const p = clamp(scrolled / slideWidth, 0, 1);

    workTrack.style.transform = `translateX(${-p * slideWidth}px)`;
    if (wProg) wProg.style.width = (p * 100) + '%';

    const idx = clamp(Math.round(p * (NCARDS - 1)), 0, NCARDS - 1);
    if (wNumEl) wNumEl.textContent = String(idx + 1).padStart(2, '0');
  }

  // scroll 이벤트 (기존: 마우스 휠 세로스크롤 → 가로스크롤 변환)
  window.addEventListener('scroll', applyWork, { passive: true });

  // 💡 [작업물 카드 직접 드래그 스크롤 기능]

  if (wProg) {
    wProg.style.height = '4px';
    wProg.style.bottom = '18px'; // 트랙 중앙에 오도록 배치
  }

  let isDraggingTrack = false;
  let hasDragged = false;
  let startX = 0;
  let startScrollY = 0;

  workTrack.addEventListener('mousedown', (e) => {
    isDraggingTrack = true;
    hasDragged = false;
    startX = e.pageX;
    startScrollY = window.scrollY;
    document.body.classList.add('cv'); // 커서 전역 고정
  });

  window.addEventListener('mouseup', () => {
    if (!isDraggingTrack) return;
    isDraggingTrack = false;
    document.body.classList.remove('cv');
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingTrack) return;
    const deltaX = e.pageX - startX;
    if (Math.abs(deltaX) > 5) hasDragged = true; // 조금이라도 움직이면 드래그로 판정

    // 왼쪽으로 드래그 시 세로 스크롤을 내리도록 매핑
    const targetScroll = startScrollY - (deltaX * 1.5);
    window.scrollTo({ top: targetScroll, behavior: 'auto' });
  });

  // 드래그 시 작업물 팝업이 뜨지 않도록 클릭 방지
  workTrack.addEventListener('click', (e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { capture: true });

  // 터치 스와이프 지원
  workTrack.addEventListener('touchstart', (e) => {
    isDraggingTrack = true;
    hasDragged = false;
    startX = e.touches[0].pageX;
    startScrollY = window.scrollY;
  }, { passive: true });

  window.addEventListener('touchend', () => { isDraggingTrack = false; });
  window.addEventListener('touchmove', (e) => {
    if (!isDraggingTrack) return;
    const deltaX = e.touches[0].pageX - startX;
    if (Math.abs(deltaX) > 5) hasDragged = true;
    const targetScroll = startScrollY - (deltaX * 1.5);
    window.scrollTo({ top: targetScroll, behavior: 'auto' });
  }, { passive: true });

  // 초기화 — load 이후 한 번만 실행되도록 debounce로 묶임
  window.addEventListener('load', initWork);
  document.fonts.ready.then(initWork);
  window.addEventListener('resize', initWork);

  /* ══════════════════════════════════
     CONTACT PARALLAX
  ══════════════════════════════════ */
  const ctWm = $('#ct-wm'), ctSec = $('#contact');
  window.addEventListener('scroll', () => {
    if (!ctWm || !ctSec) return;
    const r = ctSec.getBoundingClientRect();
    const p = clamp((window.innerHeight - r.top) / (window.innerHeight + r.height), 0, 1);
    ctWm.style.transform = `translateY(${-p * 55}px)`;
  }, { passive: true });

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     [SCROLL ANIMATION] 스크롤 진입 시 요소 페이드인
     🔧 대상 추가 → .fu 클래스를 HTML 요소에 부여
     🔧 임계값    → threshold: 0.15 수정
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
    });
  }, { threshold: .1 });
  $$('.sl,.fu,.a-p,.a-row,.ct-tag,.ct-em,.ct-soc').forEach(el => io.observe(el));

  const cth = $('#ct-h');
  if (cth) new IntersectionObserver(([e]) => {
    if (e.isIntersecting) cth.classList.add('on');
  }, { threshold: .1 }).observe(cth);

  $$('.sk-col').forEach((col, i) => {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setTimeout(() => col.classList.add('on'), i * 90);
    }, { threshold: .06 }).observe(col);
  });

  /* ══════════════════════════════════
     NAV
  ══════════════════════════════════ */
  const nav = $('#nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('solid', window.scrollY > window.innerHeight * .5);
  }, { passive: true });


  /* ══════════════════════════════════
     PROJECT DATA (한국어)
  ══════════════════════════════════ */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     [PROJECTS DATA] 포트폴리오 작업물 데이터
     프로젝트 추가 방법:
       1. 아래 블록을 복사해 마지막 항목 뒤에 붙여넣기
       2. 키 이름(예: forma)은 영소문자 고유값
       3. index.html .wcard에 data-project="키이름" 추가
     미디어(사진/영상) 추가:
       media 배열에 추가:
       { type:"image", src:"이미지경로.jpg", alt:"설명" }
       { type:"video", src:"영상경로.mp4" }
     설명 텍스트:
       desc1, desc2 → 상단 소개 문단
       sections → Overview / Approach / Result 등 섹션
     상세정보:
       details 배열 → { k:"항목명", v:"내용" }
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const PROJECTS = {
    dndn: {
      title: '든든AI', // 🔧 최상단 화면에 크게 표시되는 대제목입니다
      cat: 'Y-Startup', // 🔧 제목 위나 옆에 달리는 카테고리 태그입니다
      year: '2026', // 🔧 연도 태그
      desc1: '든든 AI는 AI 기술을 활용하여 누구나 쉽게 콘텐츠를 제작하고 수익을 창출할 수 있도록 돕는 서비스 프로젝트이다. 특히 디지털 콘텐츠 제작 경험이 부족한 사용자들도 AI를 활용해 간단한 과정만으로 숏폼 영상 콘텐츠를 제작하고 업로드할 수 있도록 돕는 것을 목표로 한다. 이 프로젝트는 콘텐츠 제작의 진입 장벽을 낮추고, AI 기반 창작 환경을 통해 새로운 형태의 개인 수익 창출 모델을 제안한다.', // 🔧 최상단 첫번째 요약 설명
      // desc2: '두번째 문단입니다. 프로젝트 성과나 결과를 간략하게 어필할 수 있습니다.', // 🔧 최상단 두번째 요약 설명
      sections: [
        // 🔧 스크롤해서 내릴 때 사진 옆에 나타나는 설명 텍스트들입니다. 
        // 원하는 개수만큼 { label, body } 세트를 늘리면 자동으로 박스가 계속 생겨납니다.
        { label: 'Concept', body: '최근 유튜브 쇼츠, 틱톡 등 숏폼 콘텐츠 시장이 빠르게 성장하면서 개인이 콘텐츠를 통해 수익을 창출할 수 있는 기회가 확대되고 있다. 하지만 영상 기획, 편집, 제작 과정은 여전히 많은 시간과 기술을 요구하기 때문에 디지털 제작 환경에 익숙하지 않은 사용자들에게는 진입 장벽이 존재한다. 특히 중장년층의 경우 콘텐츠 제작 도구에 대한 접근성이 낮아 이러한 흐름에 참여하기 어렵다는 문제가 있다. 든든 AI는 이러한 문제를 해결하기 위해 AI 기반 자동 콘텐츠 제작 시스템을 통해 누구나 쉽게 콘텐츠를 제작하고 부업 형태의 수익 활동을 시작할 수 있는 서비스를 제안한다.' },
        { label: 'Process', body: '본 프로젝트에서 정식 팀원은 아니었지만 UI/UX 기획 및 디자인을 담당하여 서비스 구조와 사용자 경험을 설계하였다. 주요 타깃이 중장년층 사용자라는 점을 고려하여 복잡한 기능보다는 직관적인 사용 흐름을 만드는 것을 중요하게 생각하였다. 이를 위해 전체 앱 구조를 단순한 단계로 구성하여 사용자가 어렵지 않게 콘텐츠 제작 과정을 따라갈 수 있도록 앱 플로우를 설계하였다. 또한 인터페이스 역시 직관적으로 이해할 수 있도록 구성하여 AI 기능을 처음 접하는 사용자들도 부담 없이 사용할 수 있도록 디자인하였다. 특히 생성형 AI를 통해 영상이 제작되는 동안 사용자가 이탈하지 않도록 로딩 과정에서의 사용자 경험을 중요하게 고려하였으며, 기다리는 과정에서도 서비스가 자연스럽게 진행되고 있다는 것을 전달할 수 있도록 로딩 페이지의 구성과 인터랙션에도 신경을 썼다.' },
        { label: 'Outcome', body: '최종적으로 AI를 활용하여 영상 아이디어 생성부터 스크립트 작성, 영상 제작까지 이어지는 콘텐츠 제작 흐름을 제안하는 서비스 콘셉트를 완성하였다. 든든 AI는 콘텐츠 제작 경험이 부족한 사용자들도 AI의 도움을 통해 쉽게 숏폼 콘텐츠를 제작할 수 있는 환경을 제시하며, 이를 통해 새로운 형태의 디지털 부업 플랫폼 가능성을 탐구하는 프로젝트로 발전하였다.' }
      ],
      details: [
        // 🔧 페이지 맨 밑에 들어가는 표 형식의 구체적인 스펙 정보입니다.
        { k: '프로젝트 유형', v: '창업 경진대회' },
        { k: '사용 툴', v: 'Figma' },
        { k: '역할', v: 'UI/UX 기획 및 디자인' },
      ],
      media: [
        // 🔧 설명 섹션 옆에 순서대로 화면을 채울 이미지나 영상 소스들입니다.
        // 위에서 작성한 sections 배열 요소 순서에 맞게 하나씩 1:1로 옆자리에 배치됩니다.
        { type: 'img', src: 'img/dndn.png', label: 'img' },
        { type: 'pdf', src: 'https://drive.google.com/file/d/1GTKoLy_zkEXd9j9vvgvryR2NIW2moGaF/view?usp=sharing', label: 'pdf' },
        { type: 'video', src: 'https://drive.google.com/file/d/1h_hmWHNEGFVQSHczw9Wt-ltj0MMxhrKq/view?usp=sharing', label: 'video' },
        // { type: 'video', src: 'video/sample.mp4', label: '비디오 캡션' } // 영상을 넣고 싶으시면 이렇게 하세요!
      ]
    },
    CITY: {
      title: 'CITY',
      cat: 'NextGen Startup Challenge',
      year: '2026',
      desc1: 'CITY는 시민과 행정 간의 소통 구조를 개선하기 위해 기획된 시민 참여 플랫폼 프로젝트이다. 단순한 민원 시스템을 넘어 시민들이 도시 문제에 대해 의견을 제안하고 토론하며 해결 과정에 참여할 수 있는 디지털 커뮤니티 환경을 만드는 것을 목표로 한다. 이 프로젝트는 온라인 플랫폼을 통해 시민 참여를 활성화하고 도시 정책 과정에 시민의 목소리를 보다 효과적으로 반영할 수 있는 새로운 참여 모델을 제안한다.',
      // desc2: 'CITY는 커뮤니티 기반 구조와 Gamification 시스템을 결합하여 시민이 도시 문제를 제안하고 토론하며 정책 형성 과정에 참여할 수 있도록 설계되었다. 시민들은 플랫폼에서 아이디어를 공유하고 투표와 피드백을 통해 의견을 발전시키며, 행정 담당자는 제안의 진행 상황을 업데이트함으로써 정책 과정의 투명성을 높일 수 있다. 이를 통해 CITY는 시민을 단순한 민원 제기자가 아닌 도시 문제 해결 과정에 참여하는 협력적 주체로 확장하는 것을 목표로 한다.',
      sections: [
        { label: 'Concept', body: '기존의 민원 시스템은 일방적인 의견 전달 구조로 이루어져 있어 시민 참여가 제한적이며, 문제 해결 과정에 시민의 지속적인 참여를 유도하기 어렵다는 한계가 있다. 이러한 문제를 해결하기 위해 시민들이 자유롭게 의견을 제안하고 토론할 수 있는 커뮤니티 기반 플랫폼을 기획하였다. CITY는 SNS와 유사한 구조를 통해 시민들이 도시 문제에 대해 의견을 공유하고, 다른 사용자들과 토론하며, 행정 기관과의 소통을 보다 투명하게 진행할 수 있도록 설계되었다.' },
        { label: 'Process', body: '본 프로젝트는 미국 대학생들이 진행하던 프로젝트에 한국 팀원으로 참여하면서 시작되었다. 프로젝트 진행 과정에서 미국 팀원들과 지속적으로 소통하며 아이디어를 구체화하고 프로젝트의 방향을 함께 정립하였다. 초기 단계에서 제시된 아이디어를 바탕으로 서비스의 세부적인 기획을 맡아 플랫폼의 구조와 기능을 정리하고, 시민 참여 흐름을 중심으로 서비스 구조를 설계하였다. 또한 팀원들의 이해를 돕고 프로젝트의 방향을 보다 명확하게 공유하기 위해 플랫폼의 구조와 사용자 흐름을 시각적으로 정리하여 데모 형태로 구현하였다. 프로젝트의 실현 가능성을 검증하기 위해 실제 현지에서 필드 리서치를 진행하였으며, 시민들을 대상으로 플랫폼 콘셉트를 설명하고 피드백을 수집하였다. 이러한 과정을 통해 타겟 사용자들의 의견을 반영하여 서비스 구조와 기능을 보완하며 프로젝트의 완성도를 높였다.' },
        { label: 'Outcome', body: '최종적으로 시민 의견 제안, 커뮤니티 토론, 행정 피드백 기능을 포함한 시민 참여 플랫폼 콘셉트를 완성하였다. CITY는 시민 참여를 단순한 민원 제기에서 확장하여 도시 문제 해결 과정에 시민이 직접 참여할 수 있는 디지털 거버넌스 플랫폼 가능성을 제시하는 프로젝트로 발전하였다. 해당 프로젝트는 국제 협업 환경 속에서 진행되었으며 최종 발표에서 3등상을 수상하며 프로젝트의 가능성과 완성도를 인정받았다.' },
      ],
      details: [
        { k: '프로젝트 유형', v: '창업 경진대회' },
        { k: '사용 도구', v: 'Figma, PowerPoint' },
        { k: '역할', v: '서비스 기획 · UX/UI 디자인' },
      ],
      media: [
        // 🔧 이미지: { type:'img', src:'img/파일명.png', label:'설명' }
        { type: 'img', src: 'img/CITY01.png', label: 'CITY01' },
        // 🔧 PDF:   { type:'pdf',   src:'pdf/파일명.pdf', label:'설명' }
        { type: 'pdf', src: 'https://drive.google.com/file/d/129ZRGtbEiZpoyGmBRwL1f1cdBHogAoSr/view?usp=sharing', label: 'CITY03' },
        // 🔧 영상:  { type:'video', src:'video/파일명.mp4', label:'설명' }
        { type: 'video', src: 'https://drive.google.com/file/d/165wWmOvIh6XDsoWgs2Cz4bZukWXie9S_/view?usp=sharing', label: 'CITY02' },
      ]
    },
    Jeonger: {
      title: 'Jeonger',
      cat: 'Think City 2026 Hackathon',
      year: '2026',
      desc1: 'Jeonger는 지역사회에서 도움이 필요한 노인과 도움을 제공할 수 있는 지역 구성원을 연결하는 커뮤니티 기반 매칭 플랫폼을 제안하는 프로젝트이다. ‘정(情)’이라는 개념에서 출발하여 단순한 노동 매칭을 넘어 세대 간 교류와 지역 공동체 회복을 목표로 한다. 이 프로젝트는 일상적인 생활 지원이 필요한 노인과 지역 구성원을 연결하여 지역 사회 내에서 서로 돕는 구조를 만드는 서비스 모델을 제안한다.',
      // desc2: '',
      sections: [
        { label: 'Concept', body: '한국과 미국 모두에서 고령화가 진행되면서 독거 노인의 증가와 지역사회 돌봄 문제는 공통적인 사회 이슈로 나타나고 있다. 하지만 이러한 문제는 행정 시스템만으로 해결하기 어렵고 지역 커뮤니티 기반의 참여가 필요하다. Jeonger 프로젝트는 해커톤 과정에서 한국과 미국 팀원들이 함께 브레인스토밍을 진행하며 두 사회가 공통적으로 겪고 있는 지역사회 문제를 정의하는 것에서 시작되었다. 이를 바탕으로 지역 구성원들이 서로 도움을 주고받을 수 있는 플랫폼을 통해 세대 간 연결을 강화하고 지역 공동체의 역할을 확장할 수 있는 서비스를 기획하였다.' },
        { label: 'Process', body: '본 프로젝트는 Think City 2026 Hackathon에서 진행된 국제 협업 프로젝트로, 제한된 시간 안에 문제 정의부터 서비스 기획까지 진행해야 했다. 팀원들은 브레인스토밍을 통해 한국과 미국에서 공통적으로 나타나는 지역사회 문제를 분석하고 해결 방향을 설정하였다. 프로젝트 과정에서는 언어와 문화적 차이가 존재했지만 팀원 간의 적극적인 소통을 통해 이러한 장벽을 극복하며 아이디어를 구체화하였다. 프로젝트에서 서비스 기획을 담당하며 플랫폼의 핵심 구조와 서비스 흐름을 정리하였고, 발표 문서 제작을 맡아 프로젝트의 핵심 메시지와 서비스 구조가 효과적으로 전달될 수 있도록 발표 자료를 구성하였다. 또한 팀원들과 함께 발표 준비를 진행하며 프로젝트의 방향을 정리하고 협업을 통해 팀워크를 강화하였다. 이러한 과정 속에서 국제 해커톤 환경에서 팀원들과 유대감을 형성하며 프로젝트를 완성해 나갔다.' },
        { label: 'Outcome', body: '최종적으로 지역사회 내에서 노인과 도움 제공자를 연결하는 커뮤니티 기반 서비스 모델을 제안하였다. Jeonger 프로젝트는 세대 간 연결과 지역 공동체의 상호 도움 구조를 중심으로 한 서비스 가능성을 제시하였으며, Think City 2026 Hackathon에서 2등상을 수상하며 프로젝트의 아이디어와 협업 성과를 인정받았다.' },
      ],
      details: [
        { k: '프로젝트 유형', v: '해커톤' },
        { k: '사용 도구', v: 'Figma' },
        { k: '역할', v: '서비스 기획 · 발표 문서 제작' },
      ],
      media: [
        // 🔧 웹사이트 연결 (프로토타입 등 직접 체험 가능)
        { type: 'img', src: 'img/Jeonger.png', label: 'img' },
        { type: 'pdf', src: 'https://drive.google.com/file/d/1tMEl_lq2yD3jzxxGmRPtdMUcBmAw88dB/view?usp=sharing', label: 'pdf' },
        { type: 'web', src: 'https://yebum.github.io/Jeonger/', label: 'web' },
      ]
    },
    toss: {
      title: '토스증권 광고',
      cat: '3D모션그래픽스',
      year: '2025',
      desc1: '본 프로젝트는 토스증권의 브랜드 메시지를 전달하기 위해 제작한 3D 모션그래픽 광고 영상이다. ‘모두를 위한 투자’라는 메시지를 중심으로 토스증권의 직관적인 투자 경험과 접근성을 시각적으로 표현하는 것을 목표로 하였다. 스마트폰 인터페이스, 금융 그래프, 다양한 오브젝트 등을 활용하여 투자 서비스를 쉽고 친근하게 전달하는 광고 콘텐츠를 제작하였다.',
      // desc2: '',
      sections: [
        { label: 'Concept', body: '최근 모바일 기반 투자 서비스가 대중화되면서 금융 서비스는 점점 더 직관적이고 사용자 친화적인 경험을 요구받고 있다. 토스증권은 간편한 인터페이스와 접근성을 강조하는 브랜드로, 이러한 특징을 시각적으로 전달할 수 있는 광고 콘텐츠를 제작하고자 하였다. 본 프로젝트는 토스증권의 브랜드 이미지와 UI 요소를 기반으로 3D 모션그래픽 스타일의 광고 영상을 기획하고, 직관적인 투자 경험과 서비스의 확장성을 시각적으로 표현하는 것을 목표로 하였다.' },
        { label: 'Process', body: '광고 영상 제작을 위해 먼저 스토리보드를 구성하여 전체 씬의 흐름과 메시지 전달 구조를 설계하였다. 이후 Blender와 Maya를 활용하여 스마트폰 인터페이스, 그래프, 아이콘 등 주요 3D 오브젝트를 직접 제작하고 장면에 맞게 모델링 및 텍스처 작업을 진행하였다. 영상 제작 과정에서 특히 각 장면이 끊기지 않고 자연스럽게 이어지는 흐름을 만드는 것을 중요하게 고려하였다. 카메라 이동과 오브젝트의 움직임을 활용하여 장면 간 전환이 부드럽게 연결되도록 설계하였으며, 이를 통해 광고 영상 전체의 몰입도를 높이고자 하였다. 또한 3D로 제작된 오브젝트와 2D 그래픽 요소가 자연스럽게 어우러지도록 구성하여 시각적 균형을 유지하고 브랜드의 직관적인 이미지가 효과적으로 전달되도록 디자인하였다. 마지막 단계에서는 After Effects를 활용하여 렌더링된 영상과 그래픽 요소를 합성하고 색감, 타이밍, 모션 디테일을 조정하여 최종 광고 영상을 완성하였다.' },
        { label: 'Result', body: '최종적으로 토스증권의 브랜드 메시지를 전달하는 3D 모션그래픽 광고 영상을 제작하였다. 스토리보드 기획부터 3D 오브젝트 제작, 모션 연출, 영상 편집까지 광고 제작의 전 과정을 직접 수행하며 브랜드 메시지를 시각적으로 전달하는 모션그래픽 제작 역량을 발전시킬 수 있었다. 또한 본 프로젝트는 작품의 완성도와 기획력을 인정받아 학과 우수작으로 선정되어 연합 PT 발표 작품으로 소개되었다.' },
      ],
      details: [
        { k: '프로젝트 유형', v: '3D모션그래픽 광고' },
        { k: '사용 도구', v: 'Figma · Blender · After Effects · Premiere Pro' },
        { k: '역할', v: '프로젝트 기획 · 제작 · 발표' },
      ],
      media: [
        { type: 'img', src: 'img/toss.png', label: 'img' },
        { type: 'pdf', src: 'https://drive.google.com/file/d/15N1K173q4mC_jvLkP1KIcvMXdgJ1Zm_R/view?usp=sharing', label: 'pdf' },
        { type: 'video', src: 'https://drive.google.com/file/d/1VoEqZAsS8xkAm3E8MO1A1aWr6JMTooqw/view?usp=sharing', label: 'video' },
      ]
    },
    sds: {
      title: '스대살',
      cat: '콘텐츠디자인',
      year: '2025',
      desc1: '스대살은 스위스에서 생활하는 대학생들이 현지 생활 정보를 쉽게 얻고 서로 경험을 공유할 수 있도록 기획한 웹 서비스 프로젝트이다. 유학생들이 겪는 정보 부족 문제를 해결하기 위해 생활 정보, 언어 교류, 커뮤니티 기능을 통합한 플랫폼을 제안하였다. 이를 통해 해외에서 생활하는 대학생들이 보다 쉽게 현지 생활에 적응할 수 있는 환경을 제공하는 것을 목표로 하였다.',
      // desc2: '',
      sections: [
        { label: 'Concept', body: '해외에서 생활하는 대학생들은 언어 장벽, 생활 정보 부족, 문화 차이 등 다양한 문제를 경험하게 된다. 특히 스위스는 생활비와 문화적 차이가 큰 국가로, 현지에서 필요한 실질적인 정보를 얻기 어려운 경우가 많다. 이러한 문제를 해결하기 위해 스위스에서 생활하는 대학생들이 서로 정보를 공유하고 도움을 주고받을 수 있는 플랫폼을 기획하였다. 본 프로젝트는 단순한 정보 제공을 넘어 학생들이 경험을 공유하고 서로 연결될 수 있는 커뮤니티 기반 서비스로 설계되었다.' },
        { label: 'Process', body: '서비스 기획을 위해 먼저 유학생들이 겪는 주요 문제를 분석하고 필요한 기능을 정의하였다. 이후 레퍼런스 리서치를 통해 해외 생활 정보 서비스와 커뮤니티 플랫폼의 구조를 분석하고 서비스 구조를 설계하였다. 플랫폼은 크게 네 가지 핵심 기능을 중심으로 구성하였다. 첫 번째는 스위스 생활 정보를 제공하는 메인 서비스, 두 번째는 유학생들이 서로 언어 교류를 할 수 있는 프로그램, 세 번째는 경험과 정보를 공유하는 커뮤니티 기능, 네 번째는 현지 생활에 필요한 정보를 공유하는 생활 마켓 기능이다. 이러한 기능들을 기반으로 사용자 흐름을 설계하고 웹 인터페이스를 디자인하여 실제 서비스 형태의 UI를 제작하였다. 또한 컬러 시스템, 타이포그래피, UI 레이아웃을 정리하여 일관된 디자인 시스템을 구축하고 플랫폼 전체의 사용자 경험이 자연스럽게 이어지도록 설계하였다.' },
        { label: 'Outcome', body: '최종적으로 스위스에서 생활하는 대학생들을 위한 정보 공유 및 커뮤니티 기반 플랫폼 ‘스대살’의 웹 UI 디자인을 완성하였다. 본 프로젝트를 통해 해외 유학생의 실제 문제를 바탕으로 서비스 구조를 설계하고 사용자 중심의 웹 인터페이스를 디자인하는 경험을 할 수 있었다.' },
      ],
      details: [
        { k: '프로젝트 유형', v: '웹 디자인' },
        { k: '사용 도구', v: 'Figma' },
        { k: '역할', v: '프로젝트 기획 · 제작 · 발표' },
      ],
      media: [
        { type: 'img', src: 'img/sds.png', label: 'img' },
        { type: 'pdf', src: 'https://drive.google.com/file/d/1mbB08IOrVbqQ-2JPRC4AlYEy1V1wIzD-/view?usp=sharing', label: 'pdf' },
        { type: 'video', src: 'https://drive.google.com/file/d/1tTaCRIh8sJ4Vloc5zrC2YDQmvoQ9a4hq/view?usp=sharing', label: 'video' },
      ]
    },
    supporters: {
      title: '슈퍼플레이 서포터즈 2기',
      cat: '슈퍼플레이',
      year: '2025',
      desc1: '슈퍼플레이 서포터즈 활동을 통해 e-sports 및 게임 문화 공간을 소개하는 콘텐츠를 제작하였다. 게임 팬들이 실제로 방문하거나 경험할 수 있는 공간을 직접 탐방하고 이를 카드뉴스와 영상 콘텐츠 형태로 제작하여 온라인 플랫폼에서 소개하는 활동을 진행하였다. 매장의 분위기, 체험 요소, 브랜드 아이덴티티 등을 콘텐츠로 전달하며 사용자들이 공간을 간접적으로 경험할 수 있도록 구성하였다.',
      sections: [
        { label: 'Overview', body: '본 활동에서 카드뉴스 콘텐츠와 롱폼 영상 콘텐츠 제작을 담당하였다. 카드뉴스는 SNS 환경에서 빠르게 정보를 전달할 수 있도록 핵심 내용을 시각적으로 정리하여 제작하였고, 영상 콘텐츠는 공간의 분위기와 체험 요소를 보다 생생하게 전달할 수 있도록 촬영과 편집을 진행하였다. 다양한 형식의 콘텐츠를 제작하며 플랫폼 특성에 맞는 전달 방식과 스토리 구성을 고민하였다.' },
        { label: 'CardNews 01', body: '슈퍼플레이 의왕점을 소개하는 카드뉴스 콘텐츠를 제작하였다. 매장의 전반적인 분위기와 주요 체험 공간을 중심으로 구성하였으며, 굿즈샵, 게이밍 장비, 게임 체험 공간 등을 사진과 함께 소개하였다. 특히 방문자가 매장을 실제로 둘러보는 흐름을 고려하여 콘텐츠의 순서를 구성하였고, 게임 팬들이 관심을 가질 만한 요소들을 중심으로 내용을 정리하였다. 카드뉴스에서는 매장의 다양한 굿즈와 체험 공간을 강조하며 게임 팬들에게 흥미로운 공간임을 전달하고자 하였다.' },
        { label: 'CardNews 02', body: 'T1 베이스캠프 PC방을 소개하는 카드뉴스 콘텐츠를 제작하였다. 콘텐츠에서는 위치, 운영시간, 내부 시설 등의 기본 정보를 전달하는 동시에, e-sports 팬들이 관심을 가질 만한 공간적 특징을 강조하였다. 특히 T1 베이스캠프의 내부 환경, 게이밍 장비, 굿즈 공간, 식음 메뉴 등을 단계적으로 보여주며 실제 방문 경험을 간접적으로 전달하는 콘텐츠 구조를 설계하였다. 강렬한 레드 컬러와 그래픽 요소를 활용해 e-sports 브랜드 이미지와 어울리는 시각적 스타일을 적용하였다.' },
        { label: 'Video 01', body: 'PUBG 성수 매장을 방문하여 공간을 체험하는 브이로그 콘텐츠를 제작하였다. 매장의 분위기와 체험 요소를 자연스럽게 보여주기 위해 방문 과정과 매장 내부 경험을 중심으로 영상을 구성하였다. 본 영상에서는 촬영과 편집을 담당하였으며, 공간 탐방 흐름에 맞추어 장면을 구성하여 시청자가 실제로 매장을 방문한 것처럼 느낄 수 있도록 제작하였다.' },
        { label: 'Video 02', body: '새롭게 오픈한 메이플 아지트에서 일일 아르바이트를 체험하는 콘텐츠로, 매장의 운영 방식과 현장 분위기를 보여주는 영상이다. 본 영상에서는 영상 편집을 담당하였으며, 체험 과정의 주요 장면들을 중심으로 스토리 흐름을 정리하고 시청자가 콘텐츠의 흐름을 쉽게 따라갈 수 있도록 편집하였다.' },
        { label: 'Video 03', body: '홍대 슈퍼플레이 매장을 방문하여 매장의 특징을 소개하고 직원 인터뷰를 통해 매장의 운영과 분위기를 전달하는 콘텐츠이다. 본 영상에서는 영상 편집을 담당하였으며, 인터뷰와 매장 촬영 장면을 자연스럽게 연결하여 매장의 분위기와 정보를 동시에 전달할 수 있도록 구성하였다.' },
      ],
      details: [
        { k: '프로젝트 유형', v: '콘텐츠 제작' },
        { k: '사용 도구', v: 'Figma · After Effects · Premiere Pro' },
        { k: '역할', v: '프로젝트 기획 · 제작' },
      ],
      media: [
        { type: 'img', src: 'img/supporters.png', label: 'img' },
        { type: 'pdf', src: 'https://drive.google.com/file/d/1YoZYXckRYaJMp37kpkgk1sqzepWwYTUZ/view?usp=sharing', label: 'pdf01' },
        { type: 'pdf', src: 'https://drive.google.com/file/d/11QTOsKiQMDta-TCH2YQTHXVJFjFYWdJl/view?usp=sharing', label: 'pdf02' },
        { type: 'video', src: 'https://drive.google.com/file/d/1uUJxAylaoHZdA5825NYAI2BrbS_U8Cx9/view?usp=sharing', label: 'video01' },
        { type: 'video', src: 'https://drive.google.com/file/d/1TF4v7MfsLaEnBrUWzrccVR5sIKCRvD_T/view?usp=sharing', label: 'video02' },
        { type: 'video', src: 'https://drive.google.com/file/d/1DBZCxx29Sk1qMgCh2TVqvA9DeZADp1c7/view?usp=sharing', label: 'video03' },
      ]
    },
    learncation: {
      title: '가치 제주, 고치 제주',
      cat: '제주가치 공감, 런케이션 해커톤',
      year: '2025',
      desc1: '‘가치 제주, 고치 제주’는 제주 지역의 환경 문제와 지역 문화 자원을 결합하여 지속 가능한 체험형 관광 모델을 제안한 프로젝트이다. 단순한 관광이 아니라 지역 환경 보존과 문화 체험을 동시에 경험할 수 있는 프로그램을 설계하여, 방문객이 제주 자연과 지역 공동체의 가치를 이해하고 참여할 수 있도록 하는 것을 목표로 하였다.',
      desc2: '해당 프로젝트는 제주 가치 공감 런케이션 해커톤에서 진행된 프로젝트로, ESG 관점에서 지역 환경과 관광을 연결하는 새로운 체험형 콘텐츠 모델을 제안하였다.',
      sections: [
        { label: 'Concept', body: '제주는 아름다운 자연환경을 기반으로 많은 관광객이 방문하는 지역이지만, 관광 산업이 확대되면서 환경 오염과 지역 생태계 훼손 문제가 지속적으로 제기되고 있다. 특히 해양 쓰레기와 자연 훼손 문제는 지역 주민과 관광 산업 모두에게 중요한 과제로 떠오르고 있다. 이 프로젝트에서는 이러한 문제를 해결하기 위해 관광을 단순한 소비 활동이 아닌 환경 보호와 지역 문화 이해를 함께 경험하는 참여형 프로그램으로 전환하는 것을 목표로 하였다. 예를 들어 해양 환경 보호 활동과 지역 문화 체험을 결합한 프로그램을 통해 방문객이 제주 자연과 지역 공동체의 가치를 직접 체험하도록 설계하였다. 실제 프로젝트에서는 해양 생태 체험, 환경 보호 활동, 지역 문화 체험 프로그램 등 다양한 활동을 통해 ESG 관점의 관광 모델을 제안하였다.' },
        { label: 'Process', body: '본 프로젝트에서는 팀원들과 함께 제주 지역 환경 문제와 관광 산업의 관계를 분석하며 프로젝트를 기획하였다. 먼저 ESG 관점에서 제주 관광의 문제점을 분석하고, 관광객이 자연스럽게 환경 보호 활동에 참여할 수 있는 체험 프로그램을 설계하였다.이 과정에서 Needs/Wants 분석, 3C 분석, SWOT 분석 등을 통해 프로젝트의 방향성을 정리하고, 제주 지역의 환경 자원과 문화 자원을 활용한 체험형 관광 프로그램을 구체화하였다. 또한 해양 환경 체험, 지역 문화 체험, 자연 탐방 프로그램 등을 결합한 콘텐츠를 기획하고, 참여자가 단순한 관광객이 아니라 환경 보호 활동에 참여하는 체험형 관광 모델이 되도록 프로그램 구조를 설계하였다.' },
      ],
      details: [
        { k: '프로젝트 유형', v: '해커톤' },
        { k: '사용 도구', v: 'Figma' },
        { k: '역할', v: '프로젝트 기획 · 발표 자료 제작' },
      ],
      media: [
        { type: 'img', src: 'img/learncation.png', label: 'img' },
        { type: 'pdf', src: 'https://drive.google.com/file/d/14H8JPIvYtZfv8PdRqI7InkLV7BSXcSZR/view?usp=sharing', label: 'pdf' },
      ]
    },
    hana: {
      title: 'Fill The [ ], Feel MY [ ]',
      cat: '제3회 하나카드 plate 디자인 공모전',
      year: '2025',
      desc1: '‘Fill The [ ], Feel My [ ]’는 하나카드 Plate 공모전에 출품한 카드 디자인 프로젝트로, 사용자가 자신의 취향과 감정을 카드 디자인에 반영할 수 있는 Young Premium Card 컨셉을 제안하였다.',
      desc2: '카드를 단순한 결제 수단이 아닌 개인의 감정과 라이프스타일을 표현하는 오브젝트로 바라보고, 다양한 그래픽 요소와 컬러를 통해 사용자 경험을 확장하는 디자인을 목표로 하였다. 카드의 디자인과 사용 경험을 연결하여 사용자에게 감각적인 브랜드 경험을 제공하는 것을 핵심 컨셉으로 설정하였다.',
      sections: [
        { label: 'Concept', body: '기존 카드 디자인은 기능 중심으로 제작되는 경우가 많지만, 최근에는 카드 역시 개인의 취향과 라이프스타일을 반영하는 디자인 요소로 인식되고 있다. 이 프로젝트에서는 특히 젊은 세대(Young Premium User)를 타겟으로 설정하여 카드 디자인을 단순한 금융 상품이 아닌 개인의 감정과 취향을 표현할 수 있는 매체로 확장하고자 하였다. 프로젝트의 핵심 컨셉은 Fill The [ ], Feel My [ ]로, 사용자가 자신의 취향을 카드 디자인에 채워 넣고(Fill), 이를 통해 자신의 감정을 표현한다(Feel)는 의미를 담고 있다. 다양한 그래픽 요소와 컬러를 통해 사용자마다 다른 개성을 표현할 수 있는 카드 디자인을 제안하였다.' },
        { label: 'Process', body: '프로젝트는 카드 디자인 경험을 3단계 사용자 경험 과정으로 설계하였다. 첫 번째 단계에서는 다양한 그래픽 요소와 컬러를 통해 사용자의 취향을 카드 디자인에 반영할 수 있도록 하였다. 두 번째 단계에서는 카드 디자인을 통해 개인의 감정과 라이프스타일을 표현할 수 있는 시각적 요소를 구성하였다. 마지막 단계에서는 완성된 카드 디자인이 하나의 브랜드 경험으로 이어질 수 있도록 전체적인 디자인 시스템을 정리하였다. 또한 카드 디자인에는 #EC91FA, #E9FC88, #05AA82 등 젊은 세대를 타겟으로 한 컬러 팔레트를 사용하여 감각적이고 개성 있는 시각적 스타일을 구현하였다.' },
      ],
      details: [
        { k: '프로젝트 유형', v: '공모전' },
        { k: '사용 도구', v: 'Figma · Photoshop · Illustrator' },
        { k: '역할', v: '프로젝트 기획 · 디자인' },
      ],
      media: [
        { type: 'img', src: 'img/hana.png', label: 'img' },
        { type: 'pdf', src: 'https://drive.google.com/file/d/1ZlQMCjZ6jWLpcgaNeCa8uu5QKYKCgFqI/view?usp=sharing', label: 'pdf' },
      ]
    },
    climate: {
      title: '기후동행카드 광고',
      cat: '3D모션그래픽스',
      year: '2025',
      desc1: '기후동행카드는 서울시에서 도입한 대중교통 무제한 이용 카드로, 대중교통 이용을 장려하고 친환경 이동을 촉진하기 위한 정책이다.',
      desc2: '본 프로젝트는 기후동행카드의 브랜드 아이덴티티를 모션그래픽을 통해 재해석하여, 기존 카드 디자인을 보다 친근하고 생동감 있는 이미지로 전달하는 것을 목표로 제작된 3D 모션그래픽 광고 프로젝트이다. 캐릭터와 카드 오브젝트를 활용하여 기후동행카드의 상징성과 브랜드 이미지를 시각적으로 표현하였다.',
      sections: [
        { label: 'Concept', body: '기존 기후동행카드는 단순한 카드 디자인 중심으로 인식되는 경향이 있었기 때문에, 이를 보다 친근하고 재미있는 방식으로 전달할 수 있는 콘텐츠가 필요하다고 판단하였다. 이 프로젝트에서는 서울의 상징 캐릭터인 해치 캐릭터를 활용하여 기후동행카드의 이미지를 재해석하고, 캐릭터와 카드가 등장하는 스토리 기반 모션그래픽을 제작하였다. 캐릭터가 등장하여 기존 카드 디자인에서 새로운 디자인으로 변화하는 과정을 통해 기후동행카드의 브랜드 아이덴티티를 보다 생동감 있게 전달하고자 하였다. 또한 전체 영상은 캐릭터 중심의 귀엽고 친근한 분위기를 유지하기 위해 안동까투리체 서체와 기후동행카드의 주요 컬러 팔레트를 기반으로 디자인을 구성하여 브랜드 일관성을 유지하였다.' },
        { label: 'Process', body: '영상 제작은 스토리보드를 기반으로 전체 장면 흐름을 설계한 뒤, 2D 그래픽과 3D 오브젝트를 결합하여 제작하였다. 먼저 Illustrator를 활용해 영상에 들어갈 그래픽 요소를 제작하고, Blender를 이용해 카드 오브젝트와 캐릭터를 포함한 3D 요소를 제작하였다. 이후 After Effects에서 장면을 구성하고 모션을 설계하여 최종 영상을 완성하였다. 특히 각 장면이 끊기지 않고 자연스럽게 이어지도록 씬 전환과 카메라 움직임을 고려하여 모션을 설계하였으며, 3D 오브젝트와 2D 그래픽 요소가 시각적으로 어우러질 수 있도록 전체적인 스타일과 색감을 조정하였다. 이를 통해 영상 전체의 흐름이 자연스럽게 이어지면서도 브랜드 이미지를 효과적으로 전달할 수 있도록 구성하였다.' },
        { label: 'Outcome', body: '최종적으로 기후동행카드의 브랜드 이미지를 캐릭터와 모션그래픽을 통해 친근하게 전달하는 광고 영상을 제작하였다. 3D 오브젝트와 2D 그래픽 요소를 결합한 모션그래픽을 통해 카드 디자인과 캐릭터의 움직임을 자연스럽게 연결하였으며, 스토리 기반의 영상 흐름을 통해 기후동행카드의 브랜드 메시지를 효과적으로 시각화하였다. 완성된 결과물은 카드와 캐릭터가 등장하는 다양한 장면을 통해 기후동행카드의 이미지를 보다 생동감 있게 표현하는 모션그래픽 콘텐츠로 제작되었다.' },
      ],
      details: [
        { k: '프로젝트 유형', v: '3D모션그래픽 광고' },
        { k: '사용 도구', v: 'Illustrator · Blender · After Effects · Premiere Pro' },
        { k: '역할', v: '프로젝트 기획 · 제작 · 발표' },
      ],
      media: [
        { type: 'img', src: 'img/climate.png', label: 'img' },
        { type: 'pdf', src: 'https://drive.google.com/file/d/1by1xmH7UfcRhfganTzI2Wh_m6pnTBYom/view?usp=sharing', label: 'pdf' },
        { type: 'video', src: 'https://drive.google.com/file/d/1ke7vtQ-1vJ5VHRHtEum8von8mesD4G5h/view?usp=sharing', label: 'video' },
      ]
    },
    naver: {
      title: '네이버지도 광고',
      cat: '영상기초',
      year: '2025',
      desc1: '본 프로젝트는 네이버 지도 서비스를 주제로 제작한 광고 영상 프로젝트로, 실제 촬영 영상과 2D 그래픽을 결합하여 네이버 지도의 기능과 사용 경험을 직관적으로 전달하는 것을 목표로 하였다.',
      desc2: '단순한 서비스 소개 영상이 아니라 사용자가 실제로 목적지를 찾는 과정과 서비스를 활용하는 상황을 기반으로, 네이버 지도가 제공하는 편리함을 시각적으로 표현하는 광고 콘텐츠를 제작하였다.',
      sections: [
        { label: 'Concept', body: '지도 서비스는 단순히 길을 찾기 위한 도구로 인식되지만, 실제로는 사용자가 어디로 갈지 고민하는 순간부터 활용되는 서비스이다. 이 프로젝트에서는 이러한 사용 경험을 바탕으로 [목적지를 위한 순간]이라는 컨셉을 설정하였다. 사용자가 이동을 계획하고 장소를 탐색하는 과정 속에서 네이버 지도가 어떤 역할을 하는지를 영상으로 표현하고자 하였다. 또한 평점, 지역 명소, 주요 시설, 여행지 등 다양한 정보를 제공하는 네이버 지도 기능을 광고 영상 속에서 자연스럽게 보여주는 것을 목표로 하였다. ' },
        { label: 'Process', body: '영상 제작은 아이템 선정과 컨셉 설정 이후 스토리보드를 기반으로 진행되었다. 먼저 실제 영상 촬영을 통해 서비스 사용 상황을 촬영하고, 이후 After Effects와 Premiere Pro를 활용하여 편집을 진행하였다. 촬영된 영상 위에 네이버 지도 인터페이스를 연상시키는 2D 그래픽 요소를 추가하여 서비스 기능을 직관적으로 표현하였다. 특히 실제 촬영 영상과 그래픽 요소가 자연스럽게 어우러지도록 화면 구성과 모션을 조정하여 광고 영상의 흐름을 구성하였다. 이를 통해 사용자 경험과 서비스 기능을 동시에 전달할 수 있는 영상 콘텐츠를 제작하였다.' },
        { label: 'Outcome', body: '최종적으로 실제 촬영 영상과 2D 그래픽을 결합한 네이버 지도 광고 영상을 제작하였다. 영상에서는 사용자가 목적지를 찾고 이동을 계획하는 과정을 중심으로 네이버 지도 서비스의 주요 기능을 자연스럽게 보여주었으며, 서비스 사용 상황을 직관적으로 전달하는 광고 콘텐츠를 완성하였다. 이 프로젝트를 통해 실제 촬영 영상과 그래픽 요소를 결합한 영상 제작 과정을 경험하며 영상 기획부터 촬영, 편집까지 전체 제작 과정을 수행하였다.' },
      ],
      details: [
        { k: '프로젝트 유형', v: '광고 영상' },
        { k: '사용 도구', v: 'After Effects · Premiere Pro' },
        { k: '역할', v: '프로젝트 기획 · 제작 · 발표' },
      ],
      media: [
        { type: 'img', src: 'img/naver.png', label: 'img' },
        { type: 'pdf', src: 'https://drive.google.com/file/d/1mR5jdob21bv5n_-3hPW9zzafQJ7rzfHc/view?usp=sharing', label: 'pdf' },
        { type: 'video', src: 'https://drive.google.com/file/d/1c0ysNhxz2MXNm4vJok_mlwy2aZXfCs5J/view?usp=sharing', label: 'video' },
      ]
    },
    dmd: {
      title: '디미디, 우주를 닮다',
      cat: '기획기초',
      year: '2025',
      desc1: '‘디지털미디어디자인과, 우주를 닮다’는 디지털미디어디자인과 학생들의 성향을 조사하고 이를 시각적 콘텐츠로 표현한 모션 영상 프로젝트이다. 설문조사를 통해 학과 학생들의 MBTI 성향을 분석하고, 그 결과를 바탕으로 디지털미디어디자인과의 특성이 INTP 성향과 유사하다는 점을 시각적 스토리로 표현한 영상 콘텐츠를 제작하였다.',
      desc2: '제작된 영상은 디지털 사이니지 환경을 고려하여 제작되었으며, X-Space LED 월에 상영되는 것을 목표로 한 대형 화면 콘텐츠로 기획되었다.',
      sections: [
        { label: 'Overview', body: '디지털미디어디자인과 학생들은 시각적 감각이 뛰어나고 창의적이며, 새로운 미디어 표현 방식과 기술 융합에 높은 관심을 보이는 특성을 가진다. 또한 디자인 작업 과정에서 논리적인 사고와 실험적인 접근을 동시에 활용하는 특징이 나타난다. 이 프로젝트에서는 이러한 학과의 특성을 보다 흥미로운 방식으로 표현하기 위해 MBTI 성향 분석을 기반으로 학과의 특징을 시각적으로 해석하는 콘텐츠를 기획하였다. 특히 설문 결과를 통해 디지털미디어디자인과 학생들의 성향이 INTP와 유사하다는 점을 발견하였고, 이를 우주라는 메타포를 활용하여 표현하였다. INTP의 특성을 우주와 연결하여 깊은 사고, 넓은 시야, 논리적 구조, 유연한 사고라는 개념으로 시각화하였다. ' },
        { label: 'Process', body: '먼저 디지털미디어디자인과 학생들의 성향을 파악하기 위해 설문조사를 진행하였다. 디자인관에서 3일 동안 ‘낙서벽’ 형태의 참여형 설문을 진행하여 학생들의 작업 방식, 아이디어의 원천, 협업 스타일, 마감 방식 등에 대한 의견을 수집하였다. 수집된 데이터를 분석하여 MBTI 요소(E/I, S/N, T/F, J/P)를 기준으로 그룹핑하였고, 그 결과 디지털미디어디자인과의 성향이 INTP 성향과 유사한 특징을 보인다는 결론을 도출하였다. 이후 이러한 성향을 시각적으로 전달하기 위해 ‘우주’를 콘셉트로 설정하고 스토리보드와 화면 스케치를 제작하였다. 영상은 대형 LED 월 환경을 고려하여 4096×1344 해상도의 와이드 비율 콘텐츠로 설계되었으며, 우주 공간을 배경으로 INTP의 특성을 상징적으로 표현하는 모션 그래픽 영상으로 제작하였다.' },
        { label: 'Outcome', body: '최종적으로 디지털미디어디자인과 학생들의 성향을 INTP와 우주라는 메타포로 시각화한 디지털 사이니지 콘텐츠 영상을 제작하였다. 영상은 대형 LED 월 환경을 고려한 와이드 화면 구성과 모션 그래픽을 활용하여 제작되었으며, 학과의 창의적이고 실험적인 성향을 시각적으로 표현하는 콘텐츠로 완성되었다. 이를 통해 데이터 기반 조사 결과를 시각적 스토리로 해석하고, 디지털 사이니지 환경에서 활용 가능한 콘텐츠 제작 경험을 얻을 수 있었다.' },
      ],
      details: [
        { k: '프로젝트 유형', v: 'LED월 프로젝트' },
        { k: '사용 도구', v: 'Illustrator · After Effects · Premiere Pro' },
        { k: '역할', v: '프로젝트 기획 · 제작 · 발표' },
      ],
      media: [
        { type: 'img', src: 'img/dmd.png', label: 'img' },
        { type: 'pdf', src: 'https://drive.google.com/file/d/1wa5yp3xS7RvKxmVics4NFBCh0_jkm_on/view?usp=sharing', label: 'pdf' },
        { type: 'video', src: 'https://drive.google.com/file/d/1a9W1BuFLpUmypBl5pNI-FiQM22GfexPh/view?usp=sharing', label: 'video' },
      ]
    },
  };

  /* ══════════════════════════════════
     PROJECT WINDOW — 새 창 열기 (Blob URL)
  ══════════════════════════════════ */

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     [PROJECT PAGE HTML] 작업물 상세 새 창 HTML 생성
     🔧 레이아웃    → 함수 안 template literal HTML 수정
     🔧 상단 바     → header.topbar 블록
     🔧 갤러리      → div.gallery 블록
     🔧 텍스트 섹션 → sectionsHTML 생성 코드
     🔧 상세정보    → detailsHTML 생성 코드
     ⚠️  함수 안의 </script>는 반드시 <\/script> 형태 유지!
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function buildProjectPageHTML(data, isDark) {
    const theme = isDark ? 'dark' : 'light';
    const bg = isDark ? '#111113' : '#ffffff';
    const bgSection = isDark ? '#18191d' : '#f5f5f4';
    const textMain = isDark ? '#eeeeed' : '#080807';
    const textMid = isDark ? '#8c8c86' : '#8c8c86';
    const divider = isDark ? 'rgba(42,42,46,.8)' : '#dededa';
    const accent = isDark ? '#5aabff' : '#3b8ff5';
    const accentBg = isDark ? 'rgba(90,171,255,.12)' : 'rgba(59,143,245,.10)';
    const navBg = isDark ? 'rgba(17,17,19,.92)' : 'rgba(255,255,255,.92)';
    const cardBg = isDark ? '#1c1d21' : '#f5f5f4';

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       [미디어 블록 렌더링]
       각 media 항목을 스크롤 섹션으로 변환합니다.
       sections 배열과 media 배열을 인덱스로 매칭합니다.
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    // 미디어 렌더링 헬퍼
    function renderMedia(m, idx) {
      if (!m) {
        // 🔧 미디어 없을 때 빈 플레이스홀더
        return `<div class="media-ph"><span class="ph-num">0${idx + 1}</span></div>`;
      }

      /* ────────────────────────────────────────────────────
         🔧 이미지 추가 방법:
            { type:'img', src:'https://...또는 상대경로', label:'설명' }
         🔧 영상(MP4) 추가 방법:
            { type:'video', src:'https://....mp4', label:'설명' }
         🔧 유튜브 추가 방법:
            { type:'youtube', src:'https://youtu.be/XXXXXXXXXXX', label:'설명' }
         🔧 PDF/PPT 추가 방법:
            { type:'pdf', src:'Google Drive 공유 URL 또는 PDF URL', label:'설명' }
         🔧 플레이스홀더 (아직 미업로드):
            { type:'ph', label:'섹션명' }
         ────────────────────────────────────────────────────*/

      if (m.type === 'img') {
        return `<figure class="media-fig">
        <img src="${m.src}" alt="${m.label || ''}" loading="lazy">
        ${m.label ? `<figcaption>${m.label}</figcaption>` : ''}
      </figure>`;
      }

      if (m.type === 'video') {
        const rawSrc = m.src || '';
        if (rawSrc.includes('drive.google.com')) {
          const embedSrc = rawSrc.replace(/\/edit(\?.*)?$/, '/preview').replace(/\/view(\?.*)?$/, '/preview');
          return `<figure class="media-fig media-video">
            <div style="position:relative; width:100%; aspect-ratio:16/9; border-radius:4px; overflow:hidden; background:#000;">
              <iframe src="${embedSrc}" style="position:absolute; inset:0; width:100%; height:100%; border:none;" allow="autoplay" allowfullscreen></iframe>
            </div>
            ${m.label ? `<figcaption>${m.label}</figcaption>` : ''}
          </figure>`;
        }
        return `<figure class="media-fig media-video">
        <video src="${rawSrc}" controls loop playsinline preload="metadata"></video>
        ${m.label ? `<figcaption>${m.label}</figcaption>` : ''}
      </figure>`;
      }

      if (m.type === 'youtube') {
        const ytMatch = (m.src || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
        const ytId = ytMatch ? ytMatch[1] : '';
        if (ytId) {
          return `<figure class="media-fig media-yt">
          <div class="yt-wrap">
            <iframe src="https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1"
              title="${m.label || 'YouTube'}" frameborder="0"
              allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"
              allowfullscreen></iframe>
          </div>
          ${m.label ? `<figcaption>${m.label}</figcaption>` : ''}
        </figure>`;
        }
        return `<figure class="media-fig media-ph">
        <div class="media-ph-inner">
          <span class="ph-num">0${idx + 1}</span>
          <a href="${m.src}" target="_blank" class="media-link-btn">YouTube에서 보기 ↗</a>
        </div>
      </figure>`;
      }

      if (m.type === 'pdf') {
        const rawSrc = m.src || '';
        let embedSrc = rawSrc;

        // Google Docs / Drive URL이면 embed URL로 변환
        if (rawSrc.includes('docs.google.com') || rawSrc.includes('drive.google.com')) {
          embedSrc = rawSrc.replace(/\/edit(\?.*)?$/, '/preview').replace(/\/view(\?.*)?$/, '/preview');
        }
        // 외부 일반 URL(http/https)이면 Google Docs Viewer 사용
        else if (/^https?:\/\//.test(rawSrc)) {
          embedSrc = 'https://docs.google.com/viewer?url=' + encodeURIComponent(rawSrc) + '&embedded=true';
        }
        // 로컬/상대경로면 브라우저 내장 PDF 뷰어로 직접 embed

        const pdfIcon = `<svg viewBox="0 0 14 14" stroke-width="1.4" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="1" width="10" height="12" rx="1.5"/>
          <line x1="5" y1="5" x2="9" y2="5"/>
          <line x1="5" y1="7.5" x2="9" y2="7.5"/>
          <line x1="5" y1="10" x2="7" y2="10"/>
        </svg>`;

        const extIcon = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12L12 2M12 2H6M12 2V8"/></svg>`;

        return `<figure class="media-fig media-pdf">
        <div class="pdf-wrap">
          <iframe src="${embedSrc}" title="${m.label || 'Document'}" frameborder="0" loading="lazy"></iframe>
          <div class="pdf-toolbar">
            <span class="pdf-label-tag">${pdfIcon}${m.label || 'PDF Document'}</span>
            <a href="${rawSrc}" target="_blank" rel="noopener" class="pdf-open-btn">
              ${extIcon} 새 탭에서 열기
            </a>
          </div>
        </div>
        ${m.label ? `<figcaption>${m.label}</figcaption>` : ''}
      </figure>`;
      }


      // ph (플레이스홀더) 또는 알 수 없는 타입
      return `<div class="media-ph">
      <span class="ph-num">0${idx + 1}</span>
      <span class="ph-label">${m.label || ''}</span>
    </div>`;
    }

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       [스크롤 섹션 구성]
       sections 배열 기준으로 미디어와 교차 배치
       홀수 섹션: 텍스트 왼쪽 + 미디어 오른쪽
       짝수 섹션: 미디어 왼쪽 + 텍스트 오른쪽
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const sections = data.sections || [];
    const mediaArr = data.media || [];

    const scrollSectionsHTML = sections.map((sec, i) => {
      const med = mediaArr[i] || null;
      const isEven = i % 2 === 0;
      const mediaBlock = renderMedia(med, i);
      const textBlock = `<div class="ss-text">
      <p class="ss-label">${sec.label || ''}</p>
      <p class="ss-body">${sec.body || ''}</p>
    </div>`;

      return `<section class="scroll-section ss-reveal" data-idx="${i}">
      <div class="ss-inner ${isEven ? '' : 'ss-reverse'}">
        ${isEven ? textBlock + mediaBlock : mediaBlock + textBlock}
      </div>
    </section>`;
    }).join('');

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       미디어가 섹션보다 많을 경우 추가 미디어 그리드로 표시
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    const extraMedia = mediaArr.slice(sections.length);
    const extraGridHTML = extraMedia.length > 0
      ? `<section class="extra-media-grid ss-reveal">
        <div class="emg-inner">
          ${extraMedia.map((m, i) => renderMedia(m, sections.length + i)).join('')}
        </div>
      </section>`
      : '';

    const detailsHTML = (data.details || []).map(d =>
      `<div class="detail-item"><p class="detail-k">${d.k}</p><p class="detail-v">${d.v}</p></div>`
    ).join('');

    return `<!DOCTYPE html>
<html lang="ko" data-theme="${theme}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${data.title} — Yebum</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
/* ── CSS 변수 ── */
:root {
  --bg:   ${bg};
  --bg2:  ${bgSection};
  --ink:  ${textMain};
  --mid:  ${textMid};
  --div:  ${divider};
  --ac:   ${accent};
  --ac2:  ${accentBg};
  --nav:  ${navBg};
  --card: ${cardBg};
  --ft-bg: ${isDark ? '#0a0b0d' : '#0e0f11'};
  --ft-text: ${isDark ? 'rgba(240,240,238,.25)' : 'rgba(255,255,255,.3)'};
  --ft-text-em: ${isDark ? 'rgba(240,240,238,.5)' : 'rgba(255,255,255,.55)'};
  --pf: 'Space Grotesk', sans-serif;
  --sy: 'Inter', sans-serif;
  --mo: 'Space Mono', monospace;
  --tr: .35s cubic-bezier(.16,1,.3,1);
}
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
html { overflow-x:clip; scroll-behavior:smooth; }
body {
  background:var(--bg); color:var(--ink);
  font-family:var(--sy);
  -webkit-font-smoothing:antialiased;
  transition:background var(--tr), color var(--tr);
}

/* ══════════════════════════════════
   TOPBAR
══════════════════════════════════ */
.topbar {
  position:fixed; top:0; left:0; right:0; z-index:100;
  display:flex; align-items:center; justify-content:space-between;
  padding:18px 36px;
  background:var(--nav);
  backdrop-filter:blur(18px);
  border-bottom:1px solid var(--div);
  transition:background var(--tr);
}
.tb-back {
  display:flex; align-items:center; gap:10px;
  font-family:var(--mo); font-size:10px; letter-spacing:.18em; text-transform:uppercase;
  color:var(--mid); text-decoration:none;
  transition:color var(--tr);
}
.tb-back:hover { color:var(--ac); }
.tb-back svg { width:14px; height:14px; stroke:currentColor; stroke-width:1.5; fill:none; }
.tb-title {
  font-family:var(--pf); font-size:14px; font-weight:600;
  color:var(--ink); letter-spacing:-.02em;
}
.tb-cat {
  font-family:var(--mo); font-size:9px; letter-spacing:.18em; text-transform:uppercase;
  color:var(--ac); opacity:.8; text-align:center; margin-top:2px;
}

/* 테마 토글 pill */
.theme-pill {
  width:44px; height:24px; border-radius:12px;
  background:var(--div); border:1.5px solid rgba(140,140,134,.3);
  position:relative; cursor:pointer;
  transition:background var(--tr), border-color var(--tr);
}
.theme-pill:hover { border-color:var(--ac); }
[data-theme="dark"] .theme-pill { background:#252529; border-color:rgba(90,171,255,.3); }
.pill-thumb {
  width:16px; height:16px; border-radius:50%;
  background:#333; position:absolute; top:50%; transform:translateY(-50%); left:3px;
  transition:transform var(--tr), background var(--tr);
  display:flex; align-items:center; justify-content:center;
}
[data-theme="dark"] .pill-thumb { transform:translate(19px,-50%); background:var(--ac); }
.pill-icon { width:9px; height:9px; transition:opacity .25s; }
.pill-sun  { opacity:1; }
.pill-moon { opacity:0; position:absolute; }
[data-theme="dark"] .pill-sun  { opacity:0; }
[data-theme="dark"] .pill-moon { opacity:1; }

/* ══════════════════════════════════
   히어로 섹션 (프로젝트 타이틀)
══════════════════════════════════ */
.proj-hero {
  padding:140px 7vw 80px;
  max-width:1400px; margin:0 auto;
  border-bottom:1px solid var(--div);
}
.meta-row {
  display:flex; align-items:center; gap:14px; margin-bottom:28px;
}
.cat-tag {
  font-family:var(--mo); font-size:9px; letter-spacing:.22em; text-transform:uppercase;
  color:var(--ac); background:var(--ac2); padding:4px 10px; border:1px solid var(--ac);
}
.year-tag {
  font-family:var(--mo); font-size:9px; letter-spacing:.14em; color:var(--mid);
}
h1.proj-title {
  font-family:var(--pf); font-weight:700;
  font-size:clamp(36px,5.5vw,80px); line-height:1.02;
  letter-spacing:-.04em; color:var(--ink);
  margin-bottom:0;
}
h1.proj-title em { font-style:italic; color:var(--ac); }

/* 외부 링크 버튼 */
.proj-ext-link {
  display:inline-flex; align-items:center; justify-content:center;
  width:38px; height:38px; border-radius:50%;
  border:1.5px solid var(--div); color:var(--mid);
  text-decoration:none; vertical-align:middle; margin-left:14px;
  transition:color .2s, border-color .2s, transform .2s, background .2s;
}
.proj-ext-link svg { width:14px; height:14px; }
.proj-ext-link:hover { color:var(--ac); border-color:var(--ac); background:var(--ac2); transform:scale(1.08); }

.hero-desc {
  max-width:680px; margin-top:36px;
}
.hero-desc p {
  font-family:var(--sy); font-size:17px; font-weight:300;
  line-height:1.9; color:var(--ink); margin-bottom:16px;
}

/* ══════════════════════════════════
   스크롤 섹션 (핵심 레이아웃)
══════════════════════════════════ */
.scroll-section {
  padding:100px 7vw;
  border-bottom:1px solid var(--div);
}
.scroll-section:last-of-type { border-bottom:none; }

.ss-inner {
  max-width:1400px; margin:0 auto;
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:80px;
  align-items:center;
}
.ss-inner.ss-reverse {
  /* 짝수 섹션: 미디어 왼쪽 */
}

/* 텍스트 블록 */
.ss-text {
  display:flex; flex-direction:column; gap:20px;
}
.ss-label {
  font-family:var(--mo); font-size:9px; letter-spacing:.24em;
  text-transform:uppercase; color:var(--ac);
}
.ss-body {
  font-family:var(--sy); font-size:16px; font-weight:300;
  line-height:1.95; color:var(--ink);
}

/* ══════════════════════════════════
   미디어 블록
══════════════════════════════════ */
/* 이미지 */
.media-fig {
  width:100%; display:flex; flex-direction:column; gap:12px;
}
.media-fig img,
.media-fig video {
  width:100%;
  border-radius:4px;
  display:block;
  background:var(--card);
  /* 🔧 object-fit 제거 → 원본 비율 자동 유지 */
}
.media-fig img { height:auto; }  /* 🔧 원본 비율 유지 */
.media-fig video { aspect-ratio:16/9; object-fit:contain; background:#000; }  /* 🔧 영상은 16:9 유지 */
figcaption {
  font-family:var(--mo); font-size:9px; letter-spacing:.14em;
  color:var(--mid); opacity:.6;
}

/* YouTube */
.media-yt { }
.yt-wrap {
  position:relative; width:100%; aspect-ratio:16/9;
  border-radius:4px; overflow:hidden; background:#000;
}
.yt-wrap iframe {
  position:absolute; inset:0; width:100%; height:100%;
  border:none;
}

/* PDF */
.media-pdf { }
.pdf-wrap {
  position:relative; width:100%; aspect-ratio:4/3;
  border-radius:4px; overflow:hidden;
  background:var(--card);
  border:1px solid var(--div);
}
.pdf-wrap iframe {
  width:100%; height:100%; border:none; display:block;
}
.pdf-open-btn {
  position:absolute; bottom:12px; right:12px;
  display:inline-flex; align-items:center; gap:6px;
  padding:7px 14px; border-radius:20px;
  background:var(--nav); border:1px solid var(--div);
  color:var(--mid); font-size:11px; font-family:var(--mo);
  text-decoration:none; letter-spacing:.06em;
  backdrop-filter:blur(8px);
  transition:color .2s, border-color .2s;
}
.pdf-open-btn svg { width:11px; height:11px; }
.pdf-open-btn:hover { color:var(--ac); border-color:var(--ac); }

/* 플레이스홀더 */
.media-ph {
  width:100%; aspect-ratio:4/3;
  display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:12px;
  background:var(--card);
  border:1px dashed var(--div);
  border-radius:4px;
}
.ph-num {
  font-family:var(--pf); font-weight:700;
  font-size:clamp(48px,7vw,96px); letter-spacing:-.05em;
  color:rgba(140,140,134,.12); user-select:none; line-height:1;
}
.ph-label {
  font-family:var(--mo); font-size:9px; letter-spacing:.2em;
  text-transform:uppercase; color:var(--mid); opacity:.5;
}
.media-link-btn {
  display:inline-block; padding:8px 18px; border-radius:20px;
  border:1px solid var(--div); color:var(--mid);
  font-size:12px; font-family:var(--mo); text-decoration:none; letter-spacing:.06em;
  transition:color .2s, border-color .2s;
}
.media-link-btn:hover { color:var(--ac); border-color:var(--ac); }

/* ══════════════════════════════════
   추가 미디어 그리드
══════════════════════════════════ */
.extra-media-grid {
  padding:80px 7vw;
  border-top:1px solid var(--div);
}
.emg-inner {
  max-width:1400px; margin:0 auto;
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));
  gap:32px;
}

/* ══════════════════════════════════
   상세 정보 그리드
══════════════════════════════════ */
.proj-details {
  padding:72px 7vw;
  border-top:1px solid var(--div);
}
.proj-details-inner {
  max-width:1400px; margin:0 auto;
}
.details-label {
  font-family:var(--mo); font-size:9px; letter-spacing:.24em;
  text-transform:uppercase; color:var(--ac); margin-bottom:40px;
}
.details {
  display:grid; grid-template-columns:repeat(3,1fr);
  border-top:1px solid var(--div);
}
@media(max-width:600px){ .details { grid-template-columns:1fr 1fr; } }
.detail-item { padding:20px 0; border-bottom:1px solid rgba(140,140,134,.15); }
.detail-k {
  font-family:var(--mo); font-size:8px; letter-spacing:.2em; text-transform:uppercase;
  color:var(--mid); margin-bottom:7px;
}
.detail-v { font-family:var(--sy); font-size:14px; font-weight:300; color:var(--ink); }

/* ══════════════════════════════════
   FOOTER
══════════════════════════════════ */
.proj-footer {
  background:var(--ft-bg);
  border-top:1px solid rgba(255,255,255,.06);
  padding:24px 56px;
  display:flex; justify-content:space-between; align-items:center;
}
.proj-footer span {
  font-family:var(--mo); font-size:8px; letter-spacing:.16em;
  color:var(--ft-text); text-transform:uppercase;
}
.proj-footer span:first-child { color:var(--ft-text-em); }
@media(max-width:700px){
  .proj-footer { padding:22px 24px; flex-direction:column; gap:10px; text-align:center; }
}

/* ══════════════════════════════════
   스크롤 Reveal 애니메이션
══════════════════════════════════ */
.ss-reveal {
  opacity:0;
  transform:translateY(32px);
  transition:opacity .75s cubic-bezier(.16,1,.3,1), transform .75s cubic-bezier(.16,1,.3,1);
}
.ss-reveal.visible {
  opacity:1;
  transform:none;
}

/* ══════════════════════════════════
   반응형 (태블릿/모바일)
══════════════════════════════════ */
@media(max-width:900px) {
  .ss-inner,
  .ss-inner.ss-reverse {
    grid-template-columns:1fr;
    gap:40px;
  }
  /* 모바일에서는 항상 텍스트 → 미디어 순 */
  .ss-inner.ss-reverse { direction:ltr; }
  .ss-inner.ss-reverse .ss-text { order:1; }
  .ss-inner.ss-reverse .media-fig,
  .ss-inner.ss-reverse .media-ph,
  .ss-inner.ss-reverse .media-yt,
  .ss-inner.ss-reverse .media-pdf { order:2; }

  .scroll-section { padding:64px 5vw; }
  .proj-hero { padding:110px 5vw 60px; }
}
@media(max-width:600px) {
  .topbar { padding:16px 20px; }
  .emg-inner { grid-template-columns:1fr; }
  .details { grid-template-columns:1fr 1fr; }
}
</style>
</head>
<body>

<!-- ━ 탑바 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
<header class="topbar">
  <a class="tb-back" href="#" onclick="history.length > 1 ? history.back() : window.close(); return false;">
    <svg viewBox="0 0 14 14"><polyline points="9,2 4,7 9,12"/></svg>
    Back
  </a>
  <div style="text-align:center;">
    <div class="tb-title">${data.title}</div>
    <div class="tb-cat">${data.cat}</div>
  </div>
  <button class="theme-pill" id="proj-theme-toggle" aria-label="테마 전환">
    <div class="pill-thumb">
      <svg class="pill-icon pill-sun" viewBox="0 0 9 9" fill="none" stroke="white" stroke-width="1.2">
        <circle cx="4.5" cy="4.5" r="2"/>
        <line x1="4.5" y1="0.5" x2="4.5" y2="1.5"/>
        <line x1="4.5" y1="7.5" x2="4.5" y2="8.5"/>
        <line x1="0.5" y1="4.5" x2="1.5" y2="4.5"/>
        <line x1="7.5" y1="4.5" x2="8.5" y2="4.5"/>
      </svg>
      <svg class="pill-icon pill-moon" viewBox="0 0 9 9" fill="none" stroke="white" stroke-width="1.2">
        <path d="M7 4.8A3 3 0 014.2 2a3 3 0 000 5.5A3 3 0 007 4.8z"/>
      </svg>
    </div>
  </button>
</header>

<!-- ━ 히어로 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
<div class="proj-hero ss-reveal">
  <div class="meta-row">
    <span class="cat-tag">${data.cat}</span>
    <span class="year-tag">${data.year}</span>
  </div>
  <h1 class="proj-title">
    ${data.title}
    ${data.link ? `<a href="${data.link}" target="_blank" rel="noopener" class="proj-ext-link" title="외부 링크">
      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12L12 2M12 2H6M12 2V8"/></svg>
    </a>` : ''}
  </h1>
  <div class="hero-desc">
    <p>${data.desc1 || ''}</p>
    ${data.desc2 ? `<p>${data.desc2}</p>` : ''}
  </div>
</div>

<!-- ━ 스크롤 섹션들 (텍스트 + 미디어 교차) ━━━━━━━━━━━━━━━━━━ -->
${scrollSectionsHTML}

<!-- ━ 추가 미디어 그리드 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
${extraGridHTML}

<!-- ━ 상세 정보 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
<div class="proj-details ss-reveal">
  <div class="proj-details-inner">
    <p class="details-label">Project Details</p>
    <div class="details">${detailsHTML}</div>
  </div>
</div>

<!-- ━ 푸터 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
<footer class="proj-footer">
  <span>© 2025 Yebum</span>
  <span>Seoul, Korea</span>
  <span>Designed &amp; built by Yebum</span>
</footer>

<script>
(function(){
  /* ── 스크롤 Reveal ── */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.ss-reveal').forEach((el, i) => {
    el.style.transitionDelay = (i * 60) + 'ms';
    revealObs.observe(el);
  });

  /* ── 테마 토글 ── */
  const KEY = 'yebum-theme';
  const htmlEl = document.documentElement;
  const pillBtn = document.getElementById('proj-theme-toggle');

  function setCSSVars(dark) {
    const r = htmlEl.style;
    if (dark) {
      r.setProperty('--bg','#111113'); r.setProperty('--bg2','#18191d');
      r.setProperty('--ink','#eeeeed'); r.setProperty('--mid','#6a6a64');
      r.setProperty('--div','rgba(42,42,46,.8)'); r.setProperty('--ac','#5aabff');
      r.setProperty('--ac2','rgba(90,171,255,.12)'); r.setProperty('--nav','rgba(17,17,19,.92)');
      r.setProperty('--card','#1c1d21'); r.setProperty('--ft-bg','#0a0b0d');
      r.setProperty('--ft-text','rgba(240,240,238,.25)'); r.setProperty('--ft-text-em','rgba(240,240,238,.5)');
    } else {
      r.setProperty('--bg','#ffffff'); r.setProperty('--bg2','#f5f5f4');
      r.setProperty('--ink','#080807'); r.setProperty('--mid','#8c8c86');
      r.setProperty('--div','#dededa'); r.setProperty('--ac','#3b8ff5');
      r.setProperty('--ac2','rgba(59,143,245,.10)'); r.setProperty('--nav','rgba(255,255,255,.92)');
      r.setProperty('--card','#f5f5f4'); r.setProperty('--ft-bg','#0e0f11');
      r.setProperty('--ft-text','rgba(255,255,255,.3)'); r.setProperty('--ft-text-em','rgba(255,255,255,.55)');
    }
  }

  function applyTheme(t) {
    htmlEl.setAttribute('data-theme', t);
    setCSSVars(t === 'dark');
    localStorage.setItem(KEY, t);
  }

  if (pillBtn) {
    pillBtn.addEventListener('click', function() {
      applyTheme(htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  /* ── 키보드 닫기 ── */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { history.length > 1 ? history.back() : window.close(); }
  });
})();
<\/script>
</body>
</html>`;
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     [OPEN PROJECT] 카드 클릭 → 새 탭/창 열기
     🔧 팝업 차단 시 브라우저에서 팝업 허용 필요
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function openProjectPage(projectId) {
    if (!PROJECTS[projectId]) return;
    // 새 탭 대신 같은 탭 이동 → 팝업 차단기 무관, 라이브 서버 정상 동작
    window.location.href = 'project-page.html?p=' + encodeURIComponent(projectId);
  }

  // 작업물 카드 클릭 이벤트
  $$('.wcard[data-project]').forEach(card => {
    card.addEventListener('click', () => {
      openProjectPage(card.dataset.project);
    });
  });

  /* ══════════════════════════════════
     EXPERIENCE 스크롤 애니메이션
  ══════════════════════════════════ */
  $$('.exp-item').forEach(el => {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('on'); }
    }, { threshold: .1 }).observe(el);
  });

  /* ══════════════════════════════════
     DARK / LIGHT MODE TOGGLE
  ══════════════════════════════════ */
  (function () {
    const html = document.documentElement;
    const btn = $('#theme-toggle');
    const label = $('#tt-label');
    const DARK = 'dark';
    const LIGHT = 'light';
    const KEY = 'yebum-theme';

    // 저장된 테마 또는 시스템 기본값
    function getPreferred() {
      const saved = localStorage.getItem(KEY);
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK : LIGHT;
    }

    function applyTheme(theme, animate) {
      if (animate) {
        // 테마 전환 ripple 효과
        const ripple = document.createElement('div');
        ripple.style.cssText = `
        position:fixed; z-index:99999; border-radius:50%;
        pointer-events:none;
        background:${theme === DARK ? '#111113' : '#ffffff'};
        width:4px; height:4px;
        top:28px; right:${window.innerWidth - (btn.getBoundingClientRect().right - btn.getBoundingClientRect().width / 2)}px;
        transform:translate(-50%,-50%) scale(1);
        transition:transform .7s cubic-bezier(.16,1,.3,1), opacity .7s ease;
      `;
        document.body.appendChild(ripple);
        // force reflow
        void ripple.offsetWidth;
        const maxDim = Math.max(window.innerWidth, window.innerHeight) * 2.6;
        ripple.style.transform = `translate(-50%,-50%) scale(${maxDim})`;
        ripple.style.opacity = '0';
        setTimeout(() => { ripple.remove(); }, 750);
      }

      if (theme === DARK) {
        html.setAttribute('data-theme', DARK);
        if (label) label.textContent = 'Dark';
        // grid canvas 색상 JS 업데이트
        window._gridRGB = '90,171,255';
      } else {
        html.removeAttribute('data-theme');
        if (label) label.textContent = 'Light';
        window._gridRGB = '59,143,245';
      }
      localStorage.setItem(KEY, theme);
    }

    // 초기 적용 (애니메이션 없이)
    applyTheme(getPreferred(), false);

    // 버튼 클릭
    if (btn) {
      btn.addEventListener('click', () => {
        const current = html.getAttribute('data-theme') === DARK ? DARK : LIGHT;
        applyTheme(current === DARK ? LIGHT : DARK, true);
      });
    }

    // 시스템 테마 변경 감지
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem(KEY)) {
        applyTheme(e.matches ? DARK : LIGHT, true);
      }
    });
  })();



})();
