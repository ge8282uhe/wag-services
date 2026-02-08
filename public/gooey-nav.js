/* ===== Gooey Nav – Shared JS (ReactBits-style) ===== */

(function () {
  'use strict';

  /* --- Inject SVG filter once into the page ---
     This replaces the old CSS blur+contrast + mix-blend-mode hack.
     The SVG filter blurs/contrasts the ALPHA channel only,
     so it works on transparent backgrounds without the white rectangle. */
  function ensureSVGFilter() {
    if (document.getElementById('gooey-svg-filter')) return;
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('style', 'position:absolute;width:0;height:0;pointer-events:none');
    svg.setAttribute('aria-hidden', 'true');

    var defs = document.createElementNS(svgNS, 'defs');
    var filter = document.createElementNS(svgNS, 'filter');
    filter.setAttribute('id', 'gooey-svg-filter');
    filter.setAttribute('color-interpolation-filters', 'sRGB');

    // 1. Gaussian blur
    var blur = document.createElementNS(svgNS, 'feGaussianBlur');
    blur.setAttribute('in', 'SourceGraphic');
    blur.setAttribute('stdDeviation', '7');
    blur.setAttribute('result', 'blur');
    filter.appendChild(blur);

    // 2. Alpha contrast (keeps RGB, snaps alpha: 20*a - 10)
    var matrix = document.createElementNS(svgNS, 'feColorMatrix');
    matrix.setAttribute('in', 'blur');
    matrix.setAttribute('type', 'matrix');
    matrix.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10');
    matrix.setAttribute('result', 'gooey');
    filter.appendChild(matrix);

    // 3. Composite original sharp graphic atop gooey shape
    var comp = document.createElementNS(svgNS, 'feComposite');
    comp.setAttribute('in', 'SourceGraphic');
    comp.setAttribute('in2', 'gooey');
    comp.setAttribute('operator', 'atop');
    filter.appendChild(comp);

    defs.appendChild(filter);
    svg.appendChild(defs);
    document.body.appendChild(svg);
  }

  /* --- Init one gooey-nav-container --- */
  function initGooeyNav(container) {
    var nav = container.querySelector('nav');
    var list = container.querySelector('ul');
    var items = Array.from(container.querySelectorAll('li'));
    var filterEl = container.querySelector('.effect.filter');
    var textEl = container.querySelector('.effect.text');
    if (!nav || !list || items.length === 0 || !filterEl || !textEl) return;

    var animationTime = 600;
    var particleCount = 26;
    var particleDistances = [90, 10];
    var particleR = 500;
    var timeVariance = 900;
    var colors = [1, 2, 3, 1, 2, 3, 1, 4];

    function noise(n) {
      n = n || 1;
      return n / 2 - Math.random() * n;
    }

    function getXY(distance, pointIndex, totalPoints) {
      var angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
      return [distance * Math.cos(angle), distance * Math.sin(angle)];
    }

    function createParticle(i, t, d, r) {
      var rotate = noise(r / 10);
      return {
        start: getXY(d[0], particleCount - i, particleCount),
        end: getXY(d[1] + noise(7), particleCount - i, particleCount),
        time: t,
        scale: 1 + noise(0.2),
        color: colors[Math.floor(Math.random() * colors.length)],
        rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
      };
    }

    function makeParticles() {
      var d = particleDistances;
      var r = particleR;
      var bubbleTime = animationTime * 2 + timeVariance;
      filterEl.style.setProperty('--time', bubbleTime + 'ms');
      filterEl.classList.remove('active');

      for (var i = 0; i < particleCount; i++) {
        var t = animationTime * 2 + noise(timeVariance * 2);
        var p = createParticle(i, t, d, r);

        (function (p, t) {
          setTimeout(function () {
            var particle = document.createElement('span');
            var point = document.createElement('span');
            particle.classList.add('particle');
            particle.style.setProperty('--start-x', p.start[0] + 'px');
            particle.style.setProperty('--start-y', p.start[1] + 'px');
            particle.style.setProperty('--end-x', p.end[0] + 'px');
            particle.style.setProperty('--end-y', p.end[1] + 'px');
            particle.style.setProperty('--time', p.time + 'ms');
            particle.style.setProperty('--scale', '' + p.scale);
            particle.style.setProperty('--color', 'var(--color-' + p.color + ', white)');
            particle.style.setProperty('--rotate', p.rotate + 'deg');

            point.classList.add('point');
            particle.appendChild(point);
            filterEl.appendChild(particle);
            requestAnimationFrame(function () {
              filterEl.classList.add('active');
            });
            setTimeout(function () {
              if (particle.parentElement === filterEl) {
                filterEl.removeChild(particle);
              }
            }, t);
          }, 30);
        })(p, t);
      }
    }

    function updateEffectPosition(element) {
      var containerRect = container.getBoundingClientRect();
      var pos = element.getBoundingClientRect();
      var styles = {
        left: (pos.left - containerRect.left) + 'px',
        top: (pos.top - containerRect.top) + 'px',
        width: pos.width + 'px',
        height: pos.height + 'px'
      };
      Object.assign(filterEl.style, styles);
      Object.assign(textEl.style, styles);
      textEl.textContent = element.innerText.trim();
    }

    function setActive(element) {
      items.forEach(function (item) { item.classList.remove('active'); });
      element.classList.add('active');
      updateEffectPosition(element);

      textEl.classList.remove('active');
      void textEl.offsetWidth;
      textEl.classList.add('active');

      filterEl.querySelectorAll('.particle').forEach(function (p) { p.remove(); });
      makeParticles();
    }

    var activeItem = items.find(function (item) { return item.classList.contains('active'); }) || items[0];
    updateEffectPosition(activeItem);
    textEl.classList.add('active');
    filterEl.classList.remove('active');
    void filterEl.offsetWidth;
    filterEl.classList.add('active');

    items.forEach(function (item) {
      var link = item.querySelector('a');
      if (!link) return;

      link.addEventListener('click', function () {
        if (activeItem === item) return;
        activeItem = item;
        setActive(item);
      });

      link.addEventListener('keydown', function (e) {
        if (e.key === ' ') {
          e.preventDefault();
          link.click();
        }
      });
    });

    var resizeObserver = new ResizeObserver(function () {
      if (activeItem) {
        updateEffectPosition(activeItem);
      }
    });
    resizeObserver.observe(container);

    container._gooeyRefresh = function () {
      if (activeItem) updateEffectPosition(activeItem);
    };
  }

  window.refreshGooeyNav = function () {
    document.querySelectorAll('.gooey-nav-container').forEach(function (c) {
      if (c._gooeyRefresh) c._gooeyRefresh();
    });
  };

  /* --- Boot: dopo il layout così la sidebar ha dimensioni corrette --- */
  ensureSVGFilter();
  function boot() {
    document.querySelectorAll('.gooey-nav-container').forEach(initGooeyNav);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(boot);
      });
    });
  } else {
    requestAnimationFrame(function () {
      requestAnimationFrame(boot);
    });
  }
})();
