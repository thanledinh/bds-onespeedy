import * as THREE from 'three';
import gsap from 'gsap';
import type { Room, Hotspot } from '../data/tour';

/**
 * 360° home tour on an inverted sphere (same approach as three.js'
 * webgl_panorama_equirectangular), with room-to-room hotspots, info points,
 * inertia, pinch/wheel zoom, idle auto-rotate, fullscreen and device motion.
 */
export function initTour(root: HTMLElement, rooms: Room[], opts: { reduce: boolean }) {
  const { reduce } = opts;
  const stage = root.querySelector<HTMLElement>('[data-tour-stage]')!;
  const layer = root.querySelector<HTMLElement>('[data-tour-hotspots]')!;
  const fade = root.querySelector<HTMLElement>('[data-tour-fade]')!;
  const roomName = root.querySelector<HTMLElement>('[data-tour-room]');
  const roomIndex = root.querySelector<HTMLElement>('[data-tour-index]');
  const hint = root.querySelector<HTMLElement>('[data-tour-hint]');
  const hdBadge = root.querySelector<HTMLElement>('[data-tour-hd]');
  const roomBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-tour-goto]')];

  // --- renderer
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const canvas = renderer.domElement;
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:pan-y';
  canvas.setAttribute('aria-hidden', 'true');
  stage.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 1, 1100);
  const geo = new THREE.SphereGeometry(500, 96, 64);
  geo.scale(-1, 1, 1);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  scene.add(new THREE.Mesh(geo, mat));

  const hdOK = renderer.capabilities.maxTextureSize >= 4096;
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const loader = new THREE.TextureLoader();
  const cache = new Map<string, Promise<THREE.Texture>>();
  const load = (url: string) => {
    if (!cache.has(url)) {
      cache.set(
        url,
        loader.loadAsync(url).then((t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = aniso;
          return t;
        }),
      );
    }
    return cache.get(url)!;
  };

  // --- view state (degrees)
  const view = { lon: 0, lat: 0, fov: 75 };
  let vLon = 0;
  let vLat = 0;
  let lastInput = performance.now();
  let interacted = false;
  let autorotate = !reduce;
  let busy = false;
  let current: Room = rooms[0];

  const dirFor = (lon: number, lat: number, r = 500) => {
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon);
    return new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
  };
  const shortest = (from: number, to: number) => from + ((((to - from) % 360) + 540) % 360) - 180;

  // --- hotspots
  let spots: { el: HTMLElement; pos: THREE.Vector3 }[] = [];
  const buildHotspots = (room: Room) => {
    layer.innerHTML = '';
    spots = room.hotspots.map((h) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `hs hs-${h.type}`;
      el.setAttribute('aria-label', h.type === 'go' ? `Go to ${h.label}` : h.label);
      el.innerHTML =
        h.type === 'go'
          ? `<span class="hs-dot"><span class="hs-pulse"></span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 8h9M8.5 4 12.5 8 8.5 12"/></svg></span><span class="hs-label">${h.label}</span>`
          : `<span class="hs-dot hs-dot-info">i</span><span class="hs-card"><strong>${h.label}</strong><span>${h.text ?? ''}</span></span>`;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        markInput();
        if (h.type === 'go' && h.to) go(h.to, h);
        else {
          const open = !el.classList.contains('is-open');
          layer.querySelectorAll('.hs-info.is-open').forEach((x) => x.classList.remove('is-open'));
          el.classList.toggle('is-open', open);
        }
      });
      layer.append(el);
      return { el, pos: dirFor(h.lon, h.lat) };
    });
  };

  const updateUi = (room: Room) => {
    if (roomName) roomName.textContent = room.name;
    if (roomIndex) roomIndex.textContent = `${String(rooms.indexOf(room) + 1).padStart(2, '0')} / ${String(rooms.length).padStart(2, '0')}`;
    roomBtns.forEach((b) => b.setAttribute('aria-current', String(b.dataset.tourGoto === room.id)));
  };

  const show = async (room: Room) => {
    current = room;
    const preview = await load(room.preview);
    mat.map = preview;
    mat.needsUpdate = true;
    view.lon = room.start.lon;
    view.lat = room.start.lat;
    buildHotspots(room);
    updateUi(room);
    // Neighbouring rooms load in the background so the next jump is instant.
    room.hotspots.filter((h) => h.to).forEach((h) => load(rooms.find((r) => r.id === h.to)!.preview));
    if (hdOK) {
      hdBadge?.classList.add('is-loading');
      load(room.image).then((tex) => {
        if (current !== room) return;
        mat.map = tex;
        mat.needsUpdate = true;
        hdBadge?.classList.remove('is-loading');
      });
    }
  };

  const go = async (id: string, via?: Hotspot) => {
    const next = rooms.find((r) => r.id === id);
    if (!next || busy || next === current) return;
    busy = true;
    const ready = load(next.preview);
    if (!reduce) {
      const tl = gsap.timeline();
      tl.to(view, {
        lon: via ? shortest(view.lon, via.lon) : view.lon,
        lat: via ? via.lat : view.lat,
        fov: 42,
        duration: 0.9,
        ease: 'power2.inOut',
      }).to(fade, { opacity: 1, duration: 0.45, ease: 'power1.in' }, 0.5);
      await tl;
    }
    await ready;
    await show(next);
    view.fov = reduce ? 75 : 92;
    if (!reduce) {
      await gsap
        .timeline()
        .to(fade, { opacity: 0, duration: 0.6, ease: 'power1.out' }, 0)
        .to(view, { fov: 75, duration: 1.2, ease: 'expo.out' }, 0);
    }
    busy = false;
  };

  // --- input
  const markInput = () => {
    lastInput = performance.now();
    if (!interacted) {
      interacted = true;
      hint?.classList.add('is-gone');
    }
  };
  const pointers = new Map<number, { x: number; y: number }>();
  let drag: { x: number; y: number; lon: number; lat: number; t: number } | null = null;
  let pinch0 = 0;
  let pinchFov = 75;

  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);
    markInput();
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch0 = Math.hypot(a.x - b.x, a.y - b.y);
      pinchFov = view.fov;
      drag = null;
    } else {
      drag = { x: e.clientX, y: e.clientY, lon: view.lon, lat: view.lat, t: performance.now() };
      vLon = vLat = 0;
      canvas.style.cursor = 'grabbing';
      layer.querySelectorAll('.hs-info.is-open').forEach((x) => x.classList.remove('is-open'));
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    markInput();
    if (pointers.size === 2 && pinch0) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      view.fov = THREE.MathUtils.clamp(pinchFov * (pinch0 / d), 30, 90);
      return;
    }
    if (!drag) return;
    const k = 0.11 * (view.fov / 75);
    const lon = drag.lon + (drag.x - e.clientX) * k;
    const lat = drag.lat + (e.clientY - drag.y) * k;
    vLon = (lon - view.lon) * 0.5;
    vLat = (lat - view.lat) * 0.5;
    view.lon = lon;
    view.lat = lat;
  });
  const end = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch0 = 0;
    if (pointers.size === 0) {
      drag = null;
      canvas.style.cursor = 'grab';
    }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  root.addEventListener(
    'wheel',
    (e) => {
      // Inside the page the wheel scrolls; in fullscreen it zooms.
      if (!root.classList.contains('is-fullscreen')) return;
      e.preventDefault();
      markInput();
      view.fov = THREE.MathUtils.clamp(view.fov + e.deltaY * 0.04, 30, 90);
    },
    { passive: false },
  );

  root.querySelectorAll<HTMLButtonElement>('[data-tour-zoom]').forEach((b) =>
    b.addEventListener('click', () => {
      markInput();
      const fov = THREE.MathUtils.clamp(view.fov + (b.dataset.tourZoom === 'in' ? -12 : 12), 30, 90);
      gsap.to(view, { fov, duration: reduce ? 0 : 0.6, ease: 'power2.out' });
    }),
  );

  root.addEventListener('keydown', (e) => {
    const step = 6;
    const map: Record<string, () => void> = {
      ArrowLeft: () => (view.lon -= step),
      ArrowRight: () => (view.lon += step),
      ArrowUp: () => (view.lat += step),
      ArrowDown: () => (view.lat -= step),
      '+': () => (view.fov = Math.max(30, view.fov - 6)),
      '-': () => (view.fov = Math.min(90, view.fov + 6)),
    };
    if (!map[e.key] || (e.target as HTMLElement).closest('input,textarea')) return;
    e.preventDefault();
    markInput();
    map[e.key]();
  });

  // Auto-rotate toggle
  const autoBtn = root.querySelector<HTMLButtonElement>('[data-tour-auto]');
  autoBtn?.setAttribute('aria-pressed', String(autorotate));
  autoBtn?.addEventListener('click', () => {
    autorotate = !autorotate;
    autoBtn.setAttribute('aria-pressed', String(autorotate));
  });

  // Fullscreen
  root.querySelector('[data-tour-fs]')?.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else root.requestFullscreen?.().catch(() => root.classList.toggle('is-fullscreen'));
  });
  document.addEventListener('fullscreenchange', () => {
    const on = document.fullscreenElement === root;
    root.classList.toggle('is-fullscreen', on);
    canvas.style.touchAction = on ? 'none' : 'pan-y';
  });

  // Device motion (phones): look around by moving the phone.
  const gyroBtn = root.querySelector<HTMLButtonElement>('[data-tour-gyro]');
  let gyroOn = false;
  let base: { alpha: number; lon: number } | null = null;
  const onOrient = (e: DeviceOrientationEvent) => {
    if (e.alpha == null || e.beta == null) return;
    if (!base) base = { alpha: e.alpha, lon: view.lon };
    view.lon = base.lon + (base.alpha - e.alpha);
    view.lat = THREE.MathUtils.clamp(e.beta - 90, -80, 80);
    lastInput = performance.now();
  };
  if (gyroBtn && 'DeviceOrientationEvent' in window && matchMedia('(pointer: coarse)').matches) {
    gyroBtn.hidden = false;
    gyroBtn.addEventListener('click', async () => {
      if (!gyroOn) {
        const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
        if (typeof DOE.requestPermission === 'function') {
          const res = await DOE.requestPermission().catch(() => 'denied');
          if (res !== 'granted') return;
        }
        base = null;
        window.addEventListener('deviceorientation', onOrient);
        gyroOn = true;
      } else {
        window.removeEventListener('deviceorientation', onOrient);
        gyroOn = false;
      }
      gyroBtn.setAttribute('aria-pressed', String(gyroOn));
      markInput();
    });
  }

  roomBtns.forEach((b) =>
    b.addEventListener('click', () => {
      markInput();
      go(b.dataset.tourGoto!);
    }),
  );

  // --- sizing + loop
  const resize = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(stage);

  const tmp = new THREE.Vector3();
  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(now - last, 50);
    last = now;
    if (!drag && !gyroOn) {
      if (Math.abs(vLon) > 0.001 || Math.abs(vLat) > 0.001) {
        view.lon += vLon;
        view.lat += vLat;
        vLon *= 0.92;
        vLat *= 0.92;
      } else if (autorotate && !busy && now - lastInput > 3500) {
        view.lon += dt * 0.006;
      }
    }
    view.lat = THREE.MathUtils.clamp(view.lat, -85, 85);
    if (camera.fov !== view.fov) {
      camera.fov = view.fov;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(dirFor(view.lon, view.lat));
    renderer.render(scene, camera);

    // Pin hotspots to their spot in the room.
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    for (const s of spots) {
      tmp.copy(s.pos).applyMatrix4(camera.matrixWorldInverse);
      const inFront = tmp.z < 0;
      tmp.copy(s.pos).project(camera);
      const visible = inFront && Math.abs(tmp.x) < 1.15 && Math.abs(tmp.y) < 1.15;
      s.el.style.transform = `translate3d(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px, 0)`;
      s.el.classList.toggle('is-hidden', !visible);
    }
  };

  let running = false;
  const startLoop = () => {
    if (running) return;
    running = true;
    last = performance.now();
    renderer.setAnimationLoop(frame);
  };
  const stopLoop = () => {
    running = false;
    renderer.setAnimationLoop(null);
  };
  new IntersectionObserver(([e]) => (e.isIntersecting ? startLoop() : stopLoop())).observe(root);
  document.addEventListener('visibilitychange', () => (document.hidden ? stopLoop() : startLoop()));

  show(rooms[0]).then(() => {
    root.classList.add('is-ready');
    if (reduce) frame(performance.now());
  });

  return { go };
}
