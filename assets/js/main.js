/* =========================================================================
   /Kagari — メインスクリプト
   役割:
   1) 篝籠の格子(SVG)を動的に生成して「編まれる」アニメ
   2) 火の粉(canvas)を描画、カーソルで乱流を起こす
   3) スクロール到達でセクションをリビール
   ========================================================================= */

(function () {
  'use strict';

  // prefers-reduced-motion: reduce のユーザーには重い演出をスキップ
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ============================================================
  // 1) 篝籠の格子(SVG): 斜め格子 + 水平帯を生成し、ドローイングアニメ
  // ============================================================
  const latticeGroup = document.getElementById('lattice-group');
  if (latticeGroup) {
    const W = 800, H = 800;
    const spacing = 40;
    const lines = [];

    // 斜め(右上→左下)の線
    for (let i = -H; i <= W + H; i += spacing) {
      lines.push({ x1: i, y1: 0, x2: i + H, y2: H });
    }
    // 斜め(左上→右下)の線
    for (let i = -H; i <= W + H; i += spacing) {
      lines.push({ x1: i, y1: 0, x2: i - H, y2: H });
    }
    // 水平の帯(篝籠の金属リング)
    for (let y = 0; y <= H; y += spacing * 2) {
      lines.push({ x1: 0, y1: y, x2: W, y2: y, ring: true });
    }

    const svgNS = 'http://www.w3.org/2000/svg';
    lines.forEach((ln, idx) => {
      const l = document.createElementNS(svgNS, 'line');
      l.setAttribute('x1', ln.x1);
      l.setAttribute('y1', ln.y1);
      l.setAttribute('x2', ln.x2);
      l.setAttribute('y2', ln.y2);
      if (ln.ring) {
        l.setAttribute('stroke', '#3A4558');
        l.setAttribute('stroke-width', '1.2');
      }
      // ドローイングアニメ
      const len = Math.hypot(ln.x2 - ln.x1, ln.y2 - ln.y1);
      l.style.strokeDasharray = len;
      l.style.strokeDashoffset = len;
      l.style.transition = `stroke-dashoffset ${reduced ? 0 : 1.6}s cubic-bezier(0.16, 1, 0.3, 1) ${reduced ? 0 : (idx * 0.012)}s`;
      latticeGroup.appendChild(l);
      requestAnimationFrame(() => {
        l.style.strokeDashoffset = 0;
      });
    });
  }

  // ============================================================
  // 2) 火の粉 canvas: 下から上に立ち昇る粒子
  // ============================================================
  const canvas = document.getElementById('ember-canvas');
  if (canvas && !reduced) {
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];
    const mouse = { x: -9999, y: -9999, active: false };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // カーソル追従グロー要素
    const glow = document.querySelector('.hero__cursor-glow');
    canvas.parentElement.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
      if (glow) {
        glow.style.left = mouse.x + 'px';
        glow.style.top = mouse.y + 'px';
        glow.style.opacity = '1';
      }
    });
    canvas.parentElement.addEventListener('pointerleave', () => {
      mouse.active = false;
      if (glow) glow.style.opacity = '0';
    });

    function spawn() {
      return {
        x: Math.random() * W,
        y: H + Math.random() * 40,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.3 + Math.random() * 0.9),
        life: 0,
        maxLife: 180 + Math.random() * 200,
        size: 0.6 + Math.random() * 1.6,
        hue: 20 + Math.random() * 30, // 琥珀〜朱
        twinkle: Math.random() * Math.PI * 2
      };
    }

    // 初期粒子
    for (let i = 0; i < 90; i++) {
      const p = spawn();
      p.y = Math.random() * H;
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    function step() {
      ctx.clearRect(0, 0, W, H);
      // 背景のグローオーバーレイ
      const grad = ctx.createLinearGradient(0, H * 0.5, 0, H);
      grad.addColorStop(0, 'rgba(200,74,31,0)');
      grad.addColorStop(1, 'rgba(232,163,61,0.05)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        // カーソル近傍で乱流を起こす
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 30000) {
            const f = (30000 - d2) / 30000;
            p.vx += (dx / Math.sqrt(d2 + 0.1)) * f * 0.25;
            p.vy += (dy / Math.sqrt(d2 + 0.1)) * f * 0.25;
          }
        }
        // 微かな横ゆらぎ
        p.vx += (Math.random() - 0.5) * 0.02;
        // 抵抗
        p.vx *= 0.98;
        p.vy = Math.max(p.vy, -2);
        p.vy += -0.006; // 上昇の加速

        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.twinkle += 0.1;

        const lifeRatio = p.life / p.maxLife;
        const alpha = Math.max(0, 1 - lifeRatio) * (0.6 + Math.sin(p.twinkle) * 0.4);
        const r = p.size * (1 + Math.sin(p.twinkle * 0.7) * 0.3);

        // グロー
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 8);
        g.addColorStop(0, `hsla(${p.hue}, 90%, 70%, ${alpha})`);
        g.addColorStop(0.4, `hsla(${p.hue - 10}, 85%, 50%, ${alpha * 0.4})`);
        g.addColorStop(1, 'hsla(20, 80%, 40%, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 8, 0, Math.PI * 2);
        ctx.fill();

        // 芯
        ctx.fillStyle = `hsla(${p.hue + 15}, 100%, 85%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.8, 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.maxLife || p.y < -20 || p.x < -20 || p.x > W + 20) {
          particles[i] = spawn();
        }
      }

      requestAnimationFrame(step);
    }
    step();
  }

  // ============================================================
  // 3) スクロールリビール: section と .reveal を観察
  // ============================================================
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('section:not(.hero), .reveal').forEach((el) => {
    el.classList.add('reveal');
    io.observe(el);
  });
})();
