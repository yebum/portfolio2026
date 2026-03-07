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

  // 💡 [하단 드래그 바(Scrollbar) 스크롤 제어 기능]

  // 마우스로 잡을 수 있는 가상의 트랙(히트박스) 생성
  const dragTrack = document.createElement('div');
  dragTrack.style.cssText = 'position:absolute; bottom:0; left:0; width:100%; height:40px; cursor:grab; z-index:50;';
  if (workWrap.querySelector('#work-sticky')) {
    workWrap.querySelector('#work-sticky').appendChild(dragTrack);
  }

  let isDraggingThumb = false;
  let startX = 0;
  let startScrollY = 0;

  // wProg의 디자인만 살짝 더 눈에 띄게 두껍게
  if (wProg) {
    wProg.style.height = '4px';
    wProg.style.bottom = '18px'; // 트랙 중앙에 오도록 배치
  }

  dragTrack.addEventListener('mousedown', (e) => {
    isDraggingThumb = true;
    startX = e.pageX;
    startScrollY = window.scrollY;
    dragTrack.style.cursor = 'grabbing';
    document.body.classList.add('cv'); // 커서 전역 고정
    e.preventDefault();
  });

  window.addEventListener('mouseup', () => {
    if (!isDraggingThumb) return;
    isDraggingThumb = false;
    dragTrack.style.cursor = 'grab';
    document.body.classList.remove('cv');
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingThumb) return;
    const deltaX = e.pageX - startX;
    const scrollRatio = deltaX / window.innerWidth;

    // 가로 이동 비율만큼 세로 스크롤로 환산 반영
    const targetScroll = startScrollY + (scrollRatio * trackWidth * 1.5);
    window.scrollTo({ top: targetScroll, behavior: 'auto' });
  });

  // 터치 스와이프 지원
  dragTrack.addEventListener('touchstart', (e) => {
    isDraggingThumb = true;
    startX = e.touches[0].pageX;
    startScrollY = window.scrollY;
  }, { passive: true });

  window.addEventListener('touchend', () => { isDraggingThumb = false; });
  window.addEventListener('touchmove', (e) => {
    if (!isDraggingThumb) return;
    const deltaX = e.touches[0].pageX - startX;
    const scrollRatio = deltaX / window.innerWidth;
    const targetScroll = startScrollY + (scrollRatio * trackWidth * 1.5);
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
      desc1: '상단 히어로 텍스트 밑에 들어가는 첫번째 문단입니다. 프로젝트 배경을 적어보세요.', // 🔧 최상단 첫번째 요약 설명
      desc2: '두번째 문단입니다. 프로젝트 성과나 결과를 간략하게 어필할 수 있습니다.', // 🔧 최상단 두번째 요약 설명
      sections: [
        // 🔧 스크롤해서 내릴 때 사진 옆에 나타나는 설명 텍스트들입니다. 
        // 원하는 개수만큼 { label, body } 세트를 늘리면 자동으로 박스가 계속 생겨납니다.
        { label: 'Overview', body: '프로젝트의 전체적인 개요' },
        { label: 'My Role', body: 'UI기획 어쩌구' },
        { label: 'My Role', body: 'UI기획 어쩌구' }
      ],
      details: [
        // 🔧 페이지 맨 밑에 들어가는 표 형식의 구체적인 스펙 정보입니다.
        { k: '프로젝트 유형', v: '개인 프로젝트' },
        { k: '사용 툴', v: 'Figma, Illustrator' }
      ],
      media: [
        // 🔧 설명 섹션 옆에 순서대로 화면을 채울 이미지나 영상 소스들입니다.
        // 위에서 작성한 sections 배열 요소 순서에 맞게 하나씩 1:1로 옆자리에 배치됩니다.
        { type: 'img', src: 'img/dndn.png', label: 'img' },
        { type: 'pdf', src: 'pdf/dndn.pdf', label: 'pdf' },
        { type: 'video', src: 'video/dndn.mp4', label: 'video' },
        // { type: 'video', src: 'video/sample.mp4', label: '비디오 캡션' } // 영상을 넣고 싶으시면 이렇게 하세요!
      ]
    },
    CITY: {
      title: 'CITY',
      cat: 'NextGen Startup Challenge',
      year: '2026',
      desc1: 'CITY는 시민과 행정 간의 소통 단절 문제를 해결하기 위해 기획된 시민 참여 플랫폼이다. 기존의 민원 시스템은 단발성 신고와 처리 중심으로 운영되어 시민 참여가 지속되기 어렵고, 정책 반영 과정 또한 시민들이 확인하기 어렵다는 한계가 있다.',
      desc2: 'CITY는 커뮤니티 기반 구조와 Gamification 시스템을 결합하여 시민이 도시 문제를 제안하고 토론하며 정책 형성 과정에 참여할 수 있도록 설계되었다. 시민들은 플랫폼에서 아이디어를 공유하고 투표와 피드백을 통해 의견을 발전시키며, 행정 담당자는 제안의 진행 상황을 업데이트함으로써 정책 과정의 투명성을 높일 수 있다. 이를 통해 CITY는 시민을 단순한 민원 제기자가 아닌 도시 문제 해결 과정에 참여하는 협력적 주체로 확장하는 것을 목표로 한다.',
      sections: [
        { label: 'Problem Identification', body: '기존 도시 민원 시스템은 시민 참여가 제한적이고 정책 반영 과정이 불투명하다는 문제를 가지고 있다. 대부분의 플랫폼은 단순한 신고와 처리 중심으로 운영되어 시민들이 지속적으로 참여할 동기가 부족하다. 또한 시민 간의 토론 구조가 부족하여 다양한 의견이 모이기 어렵고, 행정 시스템 또한 사용자 경험이 직관적이지 않아 시민 참여 장벽이 존재한다. 이러한 문제는 시민과 행정 간의 신뢰 형성을 어렵게 만든다.' },
        { label: 'Service Design', body: 'CITY는 커뮤니티 기반 플랫폼 구조를 통해 시민들이 도시 문제와 아이디어를 자유롭게 제안하고 토론할 수 있도록 설계되었다. 사용자들은 게시글을 통해 문제를 공유하고, 투표와 댓글을 통해 의견을 나누며 집단적인 해결 방향을 형성할 수 있다. 또한 플랫폼에는 포인트, 뱃지, 활동 레벨과 같은 Gamification 요소를 도입하여 시민 참여를 지속적으로 유도하였다. 행정 담당자는 제안의 진행 상태를 업데이트하여 시민들이 정책 진행 과정을 확인할 수 있도록 하였다.' },
        { label: 'Expected Outcome', body: 'CITY는 시민 참여를 활성화하고 행정과 시민 간의 신뢰를 형성하는 새로운 도시 참여 플랫폼 모델을 제시한다. 커뮤니티 기반 참여 구조를 통해 시민들은 단순한 민원 제기자가 아니라 도시 문제 해결 과정에 적극적으로 참여하게 된다. 또한 플랫폼에서 축적된 시민 의견 데이터는 도시 정책 결정 과정에서 중요한 참고 자료로 활용될 수 있으며, 시민 참여 기반의 도시 거버넌스를 강화하는 데 기여할 수 있다.' },
      ],
      details: [
        { k: '프로젝트 유형', v: '시민 참여 플랫폼' },
        { k: '역할', v: '서비스 기획 · UX/UI 디자인' },
        { k: '사용 도구', v: 'Figma' },
        { k: '기여 내용', v: 'UX 리서치 · 인터랙션 설계' },
        { k: '핵심 기능', v: '시민 의견 수집 및 참여 시스템' },
        { k: '결과물', v: '서비스 프로토타입' },
      ],
      media: [
        // 🔧 이미지: { type:'img', src:'img/파일명.png', label:'설명' }
        { type: 'img', src: 'img/CITY01.png', label: 'CITY01' },
        // 🔧 PDF:   { type:'pdf',   src:'pdf/파일명.pdf', label:'설명' }
        { type: 'pdf', src: 'pdf/CITY.pdf', label: 'CITY03' },
        // 🔧 영상:  { type:'video', src:'video/파일명.mp4', label:'설명' }
        { type: 'video', src: 'video/CITY.mp4', label: 'CITY02' },
      ]
    },
    Jeonger: {
      title: 'Jeonger',
      cat: 'Think City 2026 Hackathon',
      year: '2026',
      desc1: 'Drift는 동시대 건축 문화를 다루는 독립 매거진의 리브랜딩 및 에디토리얼 디자인 프로젝트입니다. 타이포그래피 자체가 레이아웃의 주인공이 되도록 설계했습니다.',
      desc2: '총 120페이지 분량의 타이포그래피 시스템, 그리드 시스템, 사진 편집 방향성을 포함한 에디토리얼 가이드를 제작했습니다. 창간호 인쇄 감리까지 전 과정에 참여했습니다.',
      sections: [
        { label: 'Overview', body: '건축·공간 문화를 다루는 독립 매거진 Drift의 창간호 에디토리얼 디자인 프로젝트입니다. 기존의 건축 잡지와 달리, 텍스트와 이미지의 긴장 관계를 전면에 내세우는 방식으로 차별화를 꾀했습니다.' },
        { label: 'Approach', body: '12열 그리드 시스템을 기반으로 타이포그래피가 레이아웃을 지배하는 구조를 설계했습니다. 헤드라인에는 커스텀 레터스페이싱을 적용한 Canela Text를, 본문에는 가독성 중심의 Freight Text를 사용했습니다. 사진은 풀블리드와 타이트 크롭의 극단적 대비를 통해 시각적 리듬을 만들었습니다.' },
        { label: 'Result', body: '한정판 500부 초판이 2주 만에 완판되었습니다. 이후 Behance 에디터 추천에 선정되었으며, 서울·도쿄 독립서점 15곳에 정기 입점하게 되었습니다.' },
      ],
      details: [
        { k: '클라이언트', v: 'Drift Magazine' },
        { k: '역할', v: '에디토리얼 디자인 · 아트 디렉션' },
        { k: '기간', v: '8주' },
        { k: '툴', v: 'InDesign · Figma' },
        { k: '결과물', v: '매거진 120p, 타입 시스템, 에디토리얼 가이드' },
        { k: '발행', v: '서울 · 한정판 500부' },
      ],
      media: [
        // 🔧 웹사이트 연결 (프로토타입 등 직접 체험 가능)
        { type: 'img', src: 'img/Jeonger.png', label: 'img' },
        { type: 'pdf', src: 'pdf/Jeonger.pdf', label: 'pdf' },
        { type: 'web', src: 'https://yebum.github.io/Jeonger/', label: 'web' },
      ]
    },
    toss: {
      title: '토스증권 광고',
      cat: '3D모션그래픽스',
      year: '2025',
      desc1: '토스 증권을 기반으로 한 3D 모션 광고로, 토스 특유의 깔끔하고 세련된 3D 그래픽 스타일을 중심으로 제작했습니다.',
      desc2: '사용자 인터뷰 → 워크플로 설계 → 와이어프레임 → 고해상도 프로토타입까지 전체 UX 프로세스를 담당했습니다. Figma 인터랙티브 프로토타입으로 실제 앱과 동일한 수준의 흐름을 구현했습니다.',
      sections: [
        { label: 'Overview', body: '수면 데이터를 달의 위상(phase)에 매핑하는 독창적인 메타포를 중심으로 설계된 웰니스 앱입니다. 사용자가 자신의 수면 패턴을 자연스럽게 인식하고 개선할 수 있도록 직관적인 시각화 시스템을 구현했습니다.' },
        { label: 'Challenge', body: '복잡한 수면 데이터를 감성적이고 이해하기 쉬운 인터페이스로 번역하는 것이 핵심 과제였습니다. 사용자 인터뷰 12명을 통해 "숫자보다 느낌"을 원한다는 인사이트를 발굴했고, 이를 토대로 달의 위상 시각화 시스템을 도입했습니다.' },
        { label: 'Result', body: 'Behance 에디터 선정 이후 3일 만에 조회수 22만을 기록했습니다. 현재 2개 스타트업으로부터 실제 구현 파트너십 제안을 받은 상태이며, App Store 출시 준비 중입니다.' },
      ],
      details: [
        { k: '클라이언트', v: 'Lune Labs (스타트업)' },
        { k: '역할', v: 'UX 리서치 · UI 디자인 전체' },
        { k: '기간', v: '10주' },
        { k: '툴', v: 'Figma · Principle' },
        { k: '결과물', v: 'iOS 앱 UI, 디자인 시스템, 프로토타입' },
        { k: '선정', v: 'Behance Featured 2023' },
      ],
      media: [
        { type: 'img', src: 'img/toss.png', label: 'img' },
        { type: 'pdf', src: 'pdf/toss.pdf', label: 'pdf' },
        { type: 'video', src: 'video/toss.mp4', label: 'video' },
      ]
    },
    sds: {
      title: '삼성 SDS',
      cat: 'UX/UI',
      year: '2026',
      desc1: '삼성 SDS 프로젝트입니다.',
      desc2: '상세 내용은 추후 업데이트 예정입니다.',
      sections: [
        { label: 'Overview', body: '삼성 SDS 프로젝트 개요입니다.' },
        { label: 'Overview', body: '네이버 프로젝트 개요입니다.' },
        { label: 'Overview', body: '네이버 프로젝트 개요입니다.' },
      ],
      details: [
        { k: '클라이언트', v: '삼성 SDS' },
        { k: '역할', v: 'UX/UI 디자인' }
      ],
      media: [
        { type: 'img', src: 'img/sds.png', label: 'img' },
        { type: 'pdf', src: 'pdf/sds.pdf', label: 'pdf' },
        { type: 'video', src: 'video/sds.mp4', label: 'video' },
      ]
    },
    supporters: {
      title: '슈퍼플레이',
      cat: '3D모션그래픽스',
      year: '2025',
      desc1: 'Archive Collective는 한국 현대 사진 작가 12인의 작품을 아카이빙한 아트북 프로젝트입니다. 사진의 여백과 침묵을 디자인 언어로 번역하는 데 집중했습니다.',
      desc2: '아트 디렉션부터 인쇄 감리, 제본 방식 선정까지 전 과정을 주도했습니다. 특수 용지와 실 제본을 채택해 책 자체가 하나의 오브제가 되도록 설계했습니다.',
      sections: [
        { label: 'Overview', body: '한국 현대 사진 작가 12인의 작품을 아카이빙한 리미티드 에디션 아트북입니다. 각 작가의 시선과 침묵을 페이지 구조로 번역하는 것이 이 프로젝트의 핵심 과제였습니다.' },
        { label: 'Design Direction', body: '사진이 주인공이 되도록 텍스트를 극도로 절제했습니다. 그리드는 황금비율을 변형한 독자 시스템을 적용했으며, 페이지마다 여백의 비율이 달라져 각 작가의 호흡을 반영합니다. 인쇄는 이탈리아산 무코팅 아이보리 용지(100g)에 낱장 인쇄 후 손으로 실 제본하는 방식을 선택했습니다.' },
        { label: 'Impact', body: '한정판 300부가 발행 2주 만에 완판되었습니다. Yes24 예술 분야 베스트셀러 3위를 기록했으며, 국내 독립서점 24곳과 도쿄 Spbs에 입점되었습니다. 이후 2쇄 500부 추가 제작이 확정되었습니다.' },
        { label: 'Design Direction', body: '사진이 주인공이 되도록 텍스트를 극도로 절제했습니다. 그리드는 황금비율을 변형한 독자 시스템을 적용했으며, 페이지마다 여백의 비율이 달라져 각 작가의 호흡을 반영합니다. 인쇄는 이탈리아산 무코팅 아이보리 용지(100g)에 낱장 인쇄 후 손으로 실 제본하는 방식을 선택했습니다.' },
        { label: 'Impact', body: '한정판 300부가 발행 2주 만에 완판되었습니다. Yes24 예술 분야 베스트셀러 3위를 기록했으며, 국내 독립서점 24곳과 도쿄 Spbs에 입점되었습니다. 이후 2쇄 500부 추가 제작이 확정되었습니다.' },
        { label: 'Impact', body: '한정판 300부가 발행 2주 만에 완판되었습니다. Yes24 예술 분야 베스트셀러 3위를 기록했으며, 국내 독립서점 24곳과 도쿄 Spbs에 입점되었습니다. 이후 2쇄 500부 추가 제작이 확정되었습니다.' },
      ],
      details: [
        { k: '클라이언트', v: 'Archive Collective Seoul' },
        { k: '역할', v: '아트 디렉션 · 편집 디자인' },
        { k: '기간', v: '12주' },
        { k: '툴', v: 'InDesign · Photoshop' },
        { k: '결과물', v: '아트북 240p, 한정판 300부' },
        { k: '유통', v: 'Yes24 · 독립서점 전국 유통' },
      ],
      media: [
        { type: 'img', src: 'img/supporters.png', label: 'img' },
        { type: 'pdf', src: 'pdf/supporters01.pdf', label: 'pdf' },
        { type: 'pdf', src: 'pdf/supporters02.pdf', label: 'pdf' },
        { type: 'video', src: 'video/supporters01.mp4', label: 'video' },
        { type: 'video', src: 'video/supporters02.mp4', label: 'video' },
        { type: 'video', src: 'video/supporters03.mp4', label: 'video' },
      ]
    },
    learncation: {
      title: '가치 제주, 고치 제주',
      cat: '제주가치 공감, 런케이션 해커톤',
      year: '2025',
      desc1: '가치 제주, 고치 제주는 제주도의 가치를 제시하는 웹사이트입니다. 제주도의 특징을 반영한 디자인으로 제작했습니다.',
      desc2: '사용자 인터뷰 → 워크플로 설계 → 와이어프레임 → 고해상도 프로토타입까지 전체 UX 프로세스를 담당했습니다. Figma 인터랙티브 프로토타입으로 실제 앱과 동일한 수준의 흐름을 구현했습니다.',
      sections: [
        { label: 'Concept', body: '제주도의 가치를 제시하는 웹사이트입니다. 제주도의 특징을 반영한 디자인으로 제작했습니다.' },
        { label: 'Technical', body: 'Three.js의 BufferGeometry와 Custom ShaderMaterial을 활용해 30,000개 파티클의 실시간 연산을 구현했습니다. Web Audio API로 주변 소리를 분석해 파티클의 진폭과 색상에 실시간 반영했습니다. GPU 인스턴싱 기법으로 60fps를 안정적으로 유지했습니다.' },
      ],
      details: [
        { k: '유형', v: '개인 프로젝트 · 웹 아트' },
        { k: '역할', v: 'Creative Coding · 비주얼 디자인' },
        { k: '기간', v: '4주' },
        { k: '기술', v: 'Three.js · WebGL · Web Audio API' },
        { k: '결과물', v: '인터랙티브 웹사이트' },
        { k: '수상', v: 'Awwwards SOTD 2023' },
      ],
      media: [
        { type: 'img', src: 'img/learncation.png', label: 'img' },
        { type: 'pdf', src: 'pdf/learncation.pdf', label: 'pdf' },
      ]
    },
    hana: {
      title: '하나은행',
      cat: 'UX/UI',
      year: '2026',
      desc1: '하나은행 프로젝트입니다.',
      desc2: '상세 내용은 추후 업데이트 예정입니다.',
      sections: [
        { label: 'Overview', body: '하나은행 프로젝트 개요입니다.' },
        { label: 'Approach', body: '접근 방식입니다.' },
      ],
      details: [
        { k: '클라이언트', v: '하나은행' },
        { k: '역할', v: 'UX/UI 디자인' }
      ],
      media: [
        { type: 'img', src: 'img/hana.png', label: 'img' },
        { type: 'pdf', src: 'pdf/hana.pdf', label: 'pdf' },
      ]
    },
    climate: {
      title: '기후동행카드 광고',
      cat: '3D모션그래픽스',
      year: '2025',
      desc1: 'Archive Collective는 한국 현대 사진 작가 12인의 작품을 아카이빙한 아트북 프로젝트입니다. 사진의 여백과 침묵을 디자인 언어로 번역하는 데 집중했습니다.',
      desc2: '아트 디렉션부터 인쇄 감리, 제본 방식 선정까지 전 과정을 주도했습니다. 특수 용지와 실 제본을 채택해 책 자체가 하나의 오브제가 되도록 설계했습니다.',
      sections: [
        { label: 'Overview', body: '한국 현대 사진 작가 12인의 작품을 아카이빙한 리미티드 에디션 아트북입니다. 각 작가의 시선과 침묵을 페이지 구조로 번역하는 것이 이 프로젝트의 핵심 과제였습니다.' },
        { label: 'Design Direction', body: '사진이 주인공이 되도록 텍스트를 극도로 절제했습니다. 그리드는 황금비율을 변형한 독자 시스템을 적용했으며, 페이지마다 여백의 비율이 달라져 각 작가의 호흡을 반영합니다. 인쇄는 이탈리아산 무코팅 아이보리 용지(100g)에 낱장 인쇄 후 손으로 실 제본하는 방식을 선택했습니다.' },
        { label: 'Impact', body: '한정판 300부가 발행 2주 만에 완판되었습니다. Yes24 예술 분야 베스트셀러 3위를 기록했으며, 국내 독립서점 24곳과 도쿄 Spbs에 입점되었습니다. 이후 2쇄 500부 추가 제작이 확정되었습니다.' },
      ],
      details: [
        { k: '클라이언트', v: 'Archive Collective Seoul' },
        { k: '역할', v: '아트 디렉션 · 편집 디자인' },
        { k: '기간', v: '12주' },
        { k: '툴', v: 'InDesign · Photoshop' },
        { k: '결과물', v: '아트북 240p, 한정판 300부' },
        { k: '유통', v: 'Yes24 · 독립서점 전국 유통' },
      ],
      media: [
        { type: 'img', src: 'img/climate.png', label: 'img' },
        { type: 'pdf', src: 'pdf/climate.pdf', label: 'pdf' },
        { type: 'video', src: 'video/climate.mp4', label: 'video' },
      ]
    },
    naver: {
      title: '네이버',
      cat: 'UX/UI',
      year: '2026',
      desc1: '네이버 프로젝트입니다.',
      desc2: '상세 내용은 추후 업데이트 예정입니다.',
      sections: [
        { label: 'Overview', body: '네이버 프로젝트 개요입니다.' },
        { label: 'Overview', body: '네이버 프로젝트 개요입니다.' },
        { label: 'Overview', body: '네이버 프로젝트 개요입니다.' },
      ],
      details: [
        { k: '클라이언트', v: '네이버' },
        { k: '역할', v: 'UX/UI 디자인' }
      ],
      media: [
        { type: 'img', src: 'img/naver.png', label: 'img' },
        { type: 'pdf', src: 'pdf/naver.pdf', label: 'pdf' },
        { type: 'video', src: 'video/naver.mp4', label: 'video' },
      ]
    },
    dmd: {
      title: '디미디, 우주를 닮다',
      cat: '기획기초',
      year: '2025',
      desc1: '디미디, 우주를 닮다 프로젝트입니다.',
      desc2: '기획기초 과목에서 기획한 프로젝트입니다.',
      sections: [
        { label: 'Overview', body: '프로젝트 개요입니다.' },
        { label: 'Approach', body: '접근 방식입니다.' },
        { label: 'Impact', body: '접근 방식입니다.' },
      ],
      details: [
        { k: '유형', v: '아카데믹 프로젝트' },
        { k: '결과물', v: '기획서' },
      ],
      media: [
        { type: 'img', src: 'img/dmd.png', label: 'img' },
        { type: 'pdf', src: 'pdf/dmd.pdf', label: 'pdf' },
        { type: 'video', src: 'video/dmd.mp4', label: 'video' },
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
        return `<figure class="media-fig media-video">
        <video src="${m.src}" controls loop playsinline preload="metadata"></video>
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
  line-height:1.9; color:var(--mid); margin-bottom:16px;
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
  line-height:1.95; color:var(--mid);
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
