import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/**
 * Architectural model of a modern two-storey house on a walnut plinth, lit like
 * a model in a dark studio. Scroll progress (0 → 1) drives:
 *   golden hour (warm low sun, long shadows) → blue hour (rooms light up one by
 *   one) → the camera dollies to the living-room glass → we "step inside" into
 *   the 360° living-room panorama that the tour below starts from.
 * Everything is built from primitives: no model files.
 */

export interface HouseOptions {
  reduce: boolean;
  /** Panorama shown at the very end (same room/view the tour opens on). */
  pano: { image: string; preview: string; lon: number; lat: number };
}

const smooth = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function initHouse(host: HTMLElement, opts: HouseOptions) {
  const { reduce, pano } = opts;
  const small = window.matchMedia('(max-width: 767px)').matches;

  // --- renderer (transparent: the studio backdrop is a CSS gradient behind it)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environmentIntensity = 0.35;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

  // --- materials
  const clay = new THREE.MeshStandardMaterial({ color: '#efebe4', roughness: 0.88 });
  const clayWarm = new THREE.MeshStandardMaterial({ color: '#e6e0d6', roughness: 0.9 });
  const oak = new THREE.MeshStandardMaterial({ color: '#b48a5e', roughness: 0.62 });
  const walnut = new THREE.MeshStandardMaterial({ color: '#2a1f18', roughness: 0.5 });
  const plinthWood = new THREE.MeshStandardMaterial({ color: '#a58260', roughness: 0.55 });
  const sage = new THREE.MeshStandardMaterial({ color: '#dfe3d8', roughness: 0.95 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#b9c6d1',
    metalness: 0,
    roughness: 0.04,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    envMapIntensity: 1.6,
  });
  const lit = (base: string) =>
    new THREE.MeshStandardMaterial({ color: base, emissive: '#ffc98a', emissiveIntensity: 0, roughness: 0.9 });
  const gfLight = lit('#ece6dc'); // ground-floor back wall + ceiling strips
  const ufWindow = new THREE.MeshStandardMaterial({
    color: '#3a444f',
    metalness: 0.6,
    roughness: 0.1,
    envMapIntensity: 2.4,
    emissive: '#ffc98a',
    emissiveIntensity: 0,
  });
  const water = new THREE.MeshStandardMaterial({ color: '#36585f', metalness: 0.3, roughness: 0.05, envMapIntensity: 2, emissive: '#5fb7c4', emissiveIntensity: 0 });
  const pathLight = new THREE.MeshStandardMaterial({ color: '#d8d2c6', emissive: '#ffdcae', emissiveIntensity: 0 });

  const model = new THREE.Group();
  scene.add(model);
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material, shadows = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = shadows;
    m.receiveShadow = shadows;
    model.add(m);
    return m;
  };

  // Plinth
  box(18.4, 0.45, 13.2, 0, -0.225, 0, plinthWood);
  box(18.6, 0.12, 13.4, 0, -0.5, 0, walnut, false);
  box(18, 0.06, 12.8, 0, 0.03, 0, clayWarm);
  model.add(contactShadow());

  // Ground floor: slab, walls, glass front, overhanging roof/terrace slab
  box(9, 0.2, 5.4, 0, 0.16, 0, clay);
  box(9, 2.7, 0.22, 0, 1.6, -2.6, clay); // back wall
  box(0.22, 2.7, 5.4, -4.4, 1.6, 0, clay); // left wall
  box(0.22, 2.7, 5.4, 4.4, 1.6, 0, clay); // right wall
  box(10.4, 0.26, 6.3, 0.35, 3.08, 0.15, clay); // roof slab with overhang
  const front = new THREE.Mesh(new THREE.BoxGeometry(8.6, 2.7, 0.04), glass);
  front.position.set(0, 1.6, 2.62);
  model.add(front);
  for (let i = 0; i <= 5; i++) box(0.06, 2.7, 0.1, -4.3 + i * 1.72, 1.6, 2.62, clay);

  // Interior (reads through the glass at night)
  const back = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 2.6), gfLight);
  back.position.set(0, 1.6, -2.48);
  model.add(back);
  for (let i = 0; i < 3; i++) box(2.2, 0.04, 0.12, -2.9 + i * 2.9, 2.92, 0.4, gfLight, false);
  box(2.4, 0.42, 0.95, -1.7, 0.48, -1.6, clay); // sofa
  box(2.4, 0.55, 0.2, -1.7, 0.78, -2.05, clay);
  box(1.1, 0.22, 0.65, -1.7, 0.36, -0.55, oak); // coffee table
  box(1.8, 0.07, 0.95, 2.1, 0.98, -0.6, oak); // dining table
  box(0.08, 0.72, 0.08, 1.35, 0.6, -0.3, clay);
  box(0.08, 0.72, 0.08, 2.85, 0.6, -0.9, clay);
  box(2.2, 0.95, 0.7, 2.4, 0.73, -2.05, clay); // kitchen counter
  const gfLamp = new THREE.PointLight('#ffc98a', 0, 0, 2);
  gfLamp.position.set(0, 2.4, 0.4);
  model.add(gfLamp);

  // Upper floor: cantilevered volume, ribbon window, oak fins, roof
  box(7.2, 2.5, 4.3, 1.5, 4.46, -0.7, clay);
  box(7.9, 0.2, 4.9, 1.5, 5.81, -0.7, clay);
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.05, 0.06), ufWindow);
  ribbon.position.set(1.8, 4.5, 1.47);
  model.add(ribbon);
  const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.05, 2.6), ufWindow);
  sideWin.position.set(5.12, 4.5, -0.7);
  model.add(sideWin);
  for (let i = 0; i < 11; i++) box(0.05, 2.3, 0.12, -2.16, 4.46, -2.6 + i * 0.36, oak);
  const ufLamp = new THREE.PointLight('#ffc98a', 0, 0, 2);
  ufLamp.position.set(1.8, 4.6, 0.6);
  model.add(ufLamp);

  // Terrace glass railing over the uncovered part of the ground floor roof
  const rail = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.9, 0.03), glass);
  rail.position.set(-2.75, 3.66, 3.22);
  model.add(rail);
  box(0.03, 0.9, 2.2, -4.85, 3.66, 2.1, glass, false);

  // Pool with coping, timber deck, path with small lights
  box(5, 0.06, 2.4, 3.6, 0.05, 4.4, clay); // coping
  const pool = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.04, 2.0), water);
  pool.position.set(3.6, 0.08, 4.4);
  pool.receiveShadow = true;
  model.add(pool);
  box(3.4, 0.05, 2.6, -2.4, 0.08, 4.3, oak); // deck
  box(1.1, 0.03, 5.6, -5.6, 0.07, 3.0, clay); // path
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 12), pathLight);
    p.position.set(-6.3, 0.17, 0.8 + i * 1.1);
    model.add(p);
  }

  // Abstract trees (architectural-model style)
  const crown = new THREE.SphereGeometry(1, 28, 20);
  const trunk = new THREE.CylinderGeometry(0.05, 0.08, 1.3, 10);
  [
    [-7.2, -4.1, 1.05],
    [-7.6, 2.2, 0.8],
    [6.9, -4.3, 1.15],
    [7.6, 1.2, 0.9],
    [-3.2, -5.2, 0.75],
    [3.1, -5.3, 0.85],
  ].forEach(([x, z, r]) => {
    const t = new THREE.Mesh(trunk, oak);
    t.position.set(x, 0.65, z);
    t.castShadow = true;
    model.add(t);
    const c = new THREE.Mesh(crown, sage);
    c.scale.set(r, r * 1.18, r);
    c.position.set(x, 1.3 + r, z);
    c.castShadow = true;
    c.receiveShadow = true;
    model.add(c);
  });

  // --- lights
  const sun = new THREE.DirectionalLight('#fff1dc', 3);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(small ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 80 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.025;
  sun.target.position.set(0, 0, 0);
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight('#cfd6e2', '#3b322b', 0.6);
  scene.add(hemi);
  // Cool rim from behind to outline the edges against the dark studio.
  const rim = new THREE.DirectionalLight('#a9bddb', 0.7);
  rim.position.set(-12, 9, -16);
  scene.add(rim);

  // --- final panorama ("step inside")
  const panoScene = new THREE.Scene();
  const panoGeo = new THREE.SphereGeometry(50, 64, 40);
  panoGeo.scale(-1, 1, 1);
  const panoMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  panoScene.add(new THREE.Mesh(panoGeo, panoMat));
  const panoCam = new THREE.PerspectiveCamera(78, 1, 0.1, 200);
  let panoReady = false;
  const loadPano = (() => {
    let started = false;
    return () => {
      if (started) return;
      started = true;
      const loader = new THREE.TextureLoader();
      const apply = (t: THREE.Texture) => {
        t.colorSpace = THREE.SRGBColorSpace;
        panoMat.map = t;
        panoMat.needsUpdate = true;
        panoReady = true;
      };
      loader.load(pano.preview, (t) => {
        if (!panoMat.map) apply(t);
        if (renderer.capabilities.maxTextureSize >= 4096) loader.load(pano.image, apply);
      });
    };
  })();

  // --- camera path
  const posCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(17, 11, 20),
    new THREE.Vector3(13, 7.4, 21),
    new THREE.Vector3(5.5, 4.2, 19),
    new THREE.Vector3(1.1, 2.1, 9),
    new THREE.Vector3(0.45, 1.62, 3.35),
  ]);
  const lookCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.6, 0.9, 0),
    new THREE.Vector3(0.6, 1.2, 0.3),
    new THREE.Vector3(0.4, 1.5, 0.8),
    new THREE.Vector3(0.4, 1.6, 1.4),
    new THREE.Vector3(0.3, 1.5, 0),
  ]);

  // --- colours over time
  const sunDay = new THREE.Color('#ffe4c2');
  const sunGold = new THREE.Color('#ffa65a');
  const skyDay = new THREE.Color('#cfd6e2');
  const skyNight = new THREE.Color('#2b3b5c');

  let aspect = 1;
  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    renderer.setSize(w, h, false);
    aspect = w / h;
    camera.aspect = panoCam.aspect = aspect;
    camera.updateProjectionMatrix();
    panoCam.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(host);

  const pointer = { x: 0, y: 0 };
  const sway = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  let target = reduce ? 0.62 : 0;
  let p = target;
  const tmpPos = new THREE.Vector3();
  const tmpLook = new THREE.Vector3();
  const STEP_IN = 0.93; // where the house hands over to the panorama

  const update = (time: number) => {
    // --- sun sweeps from front-right, high, to front-left, low; then sets
    const golden = smooth(0, 0.56, p);
    const dusk = smooth(0.5, 0.72, p);
    const elev = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(33, 5, golden));
    const azim = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(38, -72, golden));
    sun.position.set(30 * Math.cos(elev) * Math.sin(azim), 30 * Math.sin(elev), 30 * Math.cos(elev) * Math.cos(azim));
    sun.color.copy(sunDay).lerp(sunGold, golden);
    sun.intensity = THREE.MathUtils.lerp(3.4, 2.6, golden) * (1 - dusk);
    hemi.color.copy(skyDay).lerp(skyNight, dusk);
    hemi.intensity = THREE.MathUtils.lerp(0.6, 0.18, dusk);
    rim.intensity = THREE.MathUtils.lerp(0.7, 0.35, dusk);
    scene.environmentIntensity = THREE.MathUtils.lerp(0.35, 0.1, dusk);

    // Rooms switch on one after another.
    const gfOn = smooth(0.52, 0.6, p);
    const ufOn = smooth(0.58, 0.66, p);
    const outOn = smooth(0.63, 0.72, p);
    gfLight.emissiveIntensity = gfOn * 1.6;
    gfLamp.intensity = gfOn * 14;
    ufWindow.emissiveIntensity = ufOn * 2.2;
    ufLamp.intensity = ufOn * 8;
    pathLight.emissiveIntensity = outOn * 3;
    water.emissiveIntensity = outOn * 0.55;

    // --- camera along the path (pulled back on tall screens, except at the glass)
    const t = Math.min(p, STEP_IN) / STEP_IN;
    posCurve.getPointAt(t, tmpPos);
    lookCurve.getPointAt(t, tmpLook);
    // The path is composed for a ~16:10 screen; narrower screens back off in
    // proportion so the whole model stays in frame (except for the final dolly).
    // In the 3/4 view the plinth reads ≈23 units wide; keep it near two thirds of the frame.
    const fit = Math.max(1.85, 1.15 / aspect);
    const pull = THREE.MathUtils.lerp(fit, 1, smooth(0.72, 0.93, p));
    tmpPos.sub(tmpLook).multiplyScalar(pull).add(tmpLook);
    sway.x += (pointer.x - sway.x) * 0.04;
    sway.y += (pointer.y - sway.y) * 0.04;
    const swayAmt = 1 - smooth(0.7, 0.9, p);
    camera.position.set(
      tmpPos.x + sway.x * 0.9 * swayAmt + Math.sin(time * 0.00025) * 0.15 * swayAmt,
      tmpPos.y - sway.y * 0.45 * swayAmt,
      tmpPos.z,
    );
    camera.fov = THREE.MathUtils.lerp(32, 36, smooth(0.5, 0.85, p)) + smooth(0.85, STEP_IN, p) * 16;
    const lift = (aspect < 0.7 ? 0.25 : aspect < 1 ? 0.13 : 0.1) * (1 - smooth(0.42, 0.75, p));
    // On wide screens the model starts right of centre, leaving the headline room.
    const shiftX = aspect > 1.2 ? -0.11 * (1 - smooth(0.16, 0.45, p)) : 0;
    camera.setViewOffset(1000, 1000, 1000 * shiftX, 1000 * lift, 1000, 1000);
    camera.updateProjectionMatrix();
    camera.lookAt(tmpLook);

    // --- panorama
    if (p > 0.6) loadPano();
    const lonRad = THREE.MathUtils.degToRad(pano.lon);
    const phi = THREE.MathUtils.degToRad(90 - pano.lat);
    const inside = smooth(STEP_IN, 1, p);
    panoCam.fov = THREE.MathUtils.lerp(86, 75, inside);
    panoCam.updateProjectionMatrix();
    panoCam.lookAt(Math.sin(phi) * Math.cos(lonRad), Math.cos(phi), Math.sin(phi) * Math.sin(lonRad));
  };

  const render = (time: number) => {
    p += (target - p) * (reduce ? 1 : 0.085);
    update(time);
    if (p >= STEP_IN && panoReady) renderer.render(panoScene, panoCam);
    else renderer.render(scene, camera);
  };

  let running = false;
  const start = () => {
    if (running) return;
    running = true;
    renderer.setAnimationLoop(render);
  };
  const stop = () => {
    running = false;
    renderer.setAnimationLoop(null);
  };
  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(host);
  if (reduce) render(0);

  return {
    /** Scroll progress through the hero, 0 → 1. */
    setProgress(v: number) {
      target = v;
      if (reduce) render(0);
    },
    stepIn: STEP_IN,
  };
}

/** Soft shadow under the plinth so the model sits on something. */
function contactShadow() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 26),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = -0.58;
  return m;
}
