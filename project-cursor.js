(function () {
  'use strict';

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!finePointer.matches) return;

  const dot = document.createElement('span');
  const ring = document.createElement('span');
  const label = document.createElement('span');
  dot.id = 'proj-cur';
  ring.id = 'proj-cur-ring';
  label.id = 'proj-cur-label';
  label.textContent = 'VIEW';
  dot.setAttribute('aria-hidden', 'true');
  ring.setAttribute('aria-hidden', 'true');
  label.setAttribute('aria-hidden', 'true');
  document.body.append(dot, ring, label);

  let cursorX = 0;
  let cursorY = 0;
  let ringX = 0;
  let ringY = 0;
  let started = false;

  const viewSelector = [
    '.media-fig',
    '.media-yt',
    '.media-pdf',
    '.web-wrap'
  ].join(',');

  document.addEventListener('mousemove', event => {
    cursorX = event.clientX;
    cursorY = event.clientY;
    if (!started) {
      ringX = cursorX;
      ringY = cursorY;
      started = true;
    }

    dot.style.left = cursorX + 'px';
    dot.style.top = cursorY + 'px';
    const target = event.target instanceof Element ? event.target : null;
    const isView = Boolean(target?.closest(viewSelector));
    const isLink = !isView && Boolean(target?.closest('a, button, [role="button"]'));
    document.body.classList.toggle('proj-cursor-view', isView);
    document.body.classList.toggle('proj-cursor-link', isLink);
    document.body.classList.remove('proj-cursor-out');
  });

  document.documentElement.addEventListener('mouseleave', () => {
    document.body.classList.add('proj-cursor-out');
  });

  (function animateRing() {
    ringX += (cursorX - ringX) * .14;
    ringY += (cursorY - ringY) * .14;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    label.style.left = ringX + 'px';
    label.style.top = ringY + 'px';
    requestAnimationFrame(animateRing);
  })();
})();
