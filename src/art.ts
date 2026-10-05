// All game graphics are vector drawings generated here as SVG strings and
// rasterized into Phaser textures at boot. No external image files needed.

export interface ArtAsset {
  key: string;
  w: number;
  h: number;
  svg: string;
}

const STROKE = '#4a3b35';

function svg(w: number, h: number, body: string, defs = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;
}

/** Small deterministic RNG so generated decorations look the same every time. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------------------------------------------------------------- rabbit ---

type Eyes = 'normal' | 'scared' | 'hurt' | 'happy';

function rabbit(hind: number, front: number, eyes: Eyes, bodyDy = 0): string {
  const fur = '#f4f1ec';
  const furDark = '#d8d0c6';
  const pink = '#ffb3c6';
  let eye = '';
  switch (eyes) {
    case 'normal':
      eye = `<ellipse cx="118" cy="44" rx="5.5" ry="7" fill="#2b1d1a"/><circle cx="120" cy="41" r="2.2" fill="#fff"/>`;
      break;
    case 'scared':
      eye = `<circle cx="118" cy="44" r="9.5" fill="#fff" stroke="${STROKE}" stroke-width="2.5"/><circle cx="121" cy="46" r="3.4" fill="#2b1d1a"/>
        <path d="M108 30 Q116 24 126 30" stroke="${STROKE}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M96 30 Q92 38 96 42 Q100 38 96 30 Z" fill="#7fd4ff" stroke="#3a8fc0" stroke-width="1.5"/>`;
      break;
    case 'hurt':
      eye = `<path d="M112 38 L124 50 M124 38 L112 50" stroke="#2b1d1a" stroke-width="3.5" stroke-linecap="round"/>`;
      break;
    case 'happy':
      eye = `<path d="M111 46 Q118 36 125 46" stroke="#2b1d1a" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      break;
  }
  const hindLeg = (a: number, fill: string, dx = 0) => `
    <g transform="translate(${dx} 0) rotate(${a} 44 86)">
      <ellipse cx="54" cy="110" rx="22" ry="8.5" fill="${fill}" stroke="${STROKE}" stroke-width="3"/>
      <ellipse cx="44" cy="90" rx="19" ry="21" fill="${fill}" stroke="${STROKE}" stroke-width="3"/>
    </g>`;
  const frontLeg = (a: number, fill: string, dx = 0) => `
    <g transform="translate(${dx} 0) rotate(${a} 92 92)">
      <rect x="85" y="88" width="14" height="28" rx="7" fill="${fill}" stroke="${STROKE}" stroke-width="3"/>
      <ellipse cx="96" cy="116" rx="10" ry="6" fill="${fill}" stroke="${STROKE}" stroke-width="3"/>
    </g>`;
  const body = `
    <g transform="translate(0 ${bodyDy})">
      <ellipse cx="96" cy="22" rx="9" ry="27" fill="${furDark}" stroke="${STROKE}" stroke-width="3" transform="rotate(-30 96 44)"/>
      ${hindLeg(hind + 18, furDark, 8)}
      ${frontLeg(front - 15, furDark, -8)}
      <circle cx="24" cy="66" r="13" fill="#fff" stroke="${STROKE}" stroke-width="3"/>
      <ellipse cx="64" cy="74" rx="43" ry="29" fill="${fur}" stroke="${STROKE}" stroke-width="3"/>
      <ellipse cx="72" cy="88" rx="26" ry="11" fill="#fff"/>
      ${hindLeg(hind, fur)}
      ${frontLeg(front, fur)}
      <ellipse cx="104" cy="18" rx="10.5" ry="29" fill="${fur}" stroke="${STROKE}" stroke-width="3" transform="rotate(-12 104 44)"/>
      <ellipse cx="104" cy="20" rx="5" ry="20" fill="${pink}" transform="rotate(-12 104 44)"/>
      <circle cx="108" cy="52" r="27" fill="${fur}" stroke="${STROKE}" stroke-width="3"/>
      <ellipse cx="117" cy="62" rx="7.5" ry="4.5" fill="${pink}" opacity="0.8"/>
      ${eye}
      <ellipse cx="133" cy="54" rx="4.5" ry="3.5" fill="#ff6f9c" stroke="${STROKE}" stroke-width="1.5"/>
      <path d="M126 62 Q129 66 132 62 Q135 66 138 62" stroke="${STROKE}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <rect x="128.5" y="63.5" width="6" height="6" rx="1.5" fill="#fff" stroke="${STROKE}" stroke-width="1.5"/>
      <path d="M134 57 L149 52 M134 59 L149 61" stroke="${STROKE}" stroke-width="1.5" stroke-linecap="round"/>
    </g>`;
  return svg(150, 132, body);
}

// --------------------------------------------------------------- pickups ---

function carrot(golden: boolean): string {
  const defs = golden
    ? `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3a8"/><stop offset="0.5" stop-color="#ffd23f"/><stop offset="1" stop-color="#e09a00"/></linearGradient>`
    : `<linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffa53a"/><stop offset="1" stop-color="#f27a0c"/></linearGradient>`;
  const stroke = golden ? '#9c6a00' : '#a84a06';
  const sparkle = golden
    ? `<path d="M50 12 L53 20 L61 23 L53 26 L50 34 L47 26 L39 23 L47 20 Z" fill="#fff" stroke="#e0a800" stroke-width="1.5"/>
       <path d="M12 46 L14 51 L19 53 L14 55 L12 60 L10 55 L5 53 L10 51 Z" fill="#fff"/>`
    : '';
  return svg(
    64,
    80,
    `<g transform="rotate(22 32 40)">
      <path d="M32 24 Q22 6 25 2 Q33 10 32 24 Z" fill="#46c247" stroke="#1f7a1f" stroke-width="2"/>
      <path d="M32 24 Q36 2 42 4 Q40 16 32 24 Z" fill="#5ad65b" stroke="#1f7a1f" stroke-width="2"/>
      <path d="M32 24 Q14 14 14 8 Q26 12 32 24 Z" fill="#3aad3b" stroke="#1f7a1f" stroke-width="2"/>
      <path d="M20 26 Q32 18 44 26 Q45 36 34 74 Q32 78 30 74 Q19 36 20 26 Z" fill="url(#g)" stroke="${stroke}" stroke-width="2.5"/>
      <path d="M24 36 L30 37 M37 46 L31 47 M26 55 L31 56 M35 62 L32 63" stroke="${stroke}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
      <path d="M25 30 Q27 44 30 56" stroke="#fff" stroke-width="2.5" fill="none" opacity="0.45" stroke-linecap="round"/>
    </g>${sparkle}`,
    defs,
  );
}

function bubble(inner: string, color: string): string {
  const defs = `<radialGradient id="b" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="0.6" stop-color="${color}" stop-opacity="0.45"/><stop offset="1" stop-color="${color}" stop-opacity="0.85"/></radialGradient>`;
  return svg(
    80,
    80,
    `<circle cx="40" cy="40" r="36" fill="url(#b)" stroke="#ffffff" stroke-width="3"/>
     ${inner}
     <ellipse cx="27" cy="22" rx="10" ry="6" fill="#fff" opacity="0.8" transform="rotate(-30 27 22)"/>`,
    defs,
  );
}

const ICONS = {
  turbo: `<path d="M44 10 L22 44 L37 44 L32 70 L58 32 L42 32 L50 10 Z" fill="#ffe14d" stroke="#b07800" stroke-width="3" stroke-linejoin="round"/>`,
  magnet: `<g transform="rotate(-35 40 42)">
      <path d="M22 22 L22 44 A18 18 0 0 0 58 44 L58 22 L46 22 L46 44 A6 6 0 0 1 34 44 L34 22 Z" fill="#e8343a" stroke="#7a1014" stroke-width="3" stroke-linejoin="round"/>
      <rect x="22" y="16" width="12" height="10" fill="#d9e1e8" stroke="#555" stroke-width="2.5"/>
      <rect x="46" y="16" width="12" height="10" fill="#d9e1e8" stroke="#555" stroke-width="2.5"/>
    </g>`,
  shield: `<path d="M40 14 L62 22 Q62 52 40 68 Q18 52 18 22 Z" fill="#3fa9ff" stroke="#0d4f8a" stroke-width="3" stroke-linejoin="round"/>
     <path d="M40 28 L44 37 L54 38 L46 44 L49 54 L40 48 L31 54 L34 44 L26 38 L36 37 Z" fill="#fff"/>`,
  wrench: `<g transform="rotate(45 40 40)">
      <rect x="35" y="26" width="10" height="40" rx="4" fill="#9aa5b1" stroke="#3d4650" stroke-width="3"/>
      <path d="M28 14 A13 13 0 1 0 52 14 L52 24 L46 28 L46 18 L34 18 L34 28 L28 24 Z" fill="#c5ced8" stroke="#3d4650" stroke-width="3" stroke-linejoin="round"/>
    </g>
    <circle cx="58" cy="58" r="10" fill="#ff5a3c" stroke="#7a1b0c" stroke-width="2.5"/>
    <path d="M58 52 L58 59 M58 62 L58 64" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  sneaker: `<path d="M14 50 Q14 36 22 30 L34 30 Q38 40 50 42 L62 46 Q68 50 66 58 L14 58 Z" fill="#ff4b4b" stroke="#7a1414" stroke-width="3" stroke-linejoin="round"/>
     <path d="M12 58 L68 58 Q68 64 62 64 L16 64 Q12 64 12 58 Z" fill="#fff" stroke="#7a1414" stroke-width="2.5"/>
     <path d="M30 36 L38 34 M33 41 L41 38" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
     <path d="M22 30 Q10 22 8 12 Q16 18 20 16 Q20 22 26 24 Z" fill="#fff" stroke="#7a1414" stroke-width="2"/>
     <path d="M70 30 L58 30 M72 38 L62 38" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  luck: `<g fill="#3cc94d" stroke="#1b6e26" stroke-width="2.5">
      <path d="M40 40 C24 40 18 22 30 18 C36 16 40 24 40 30 Z"/>
      <path d="M40 40 C40 24 58 18 62 30 C64 36 56 40 50 40 Z"/>
      <path d="M40 40 C56 40 62 58 50 62 C44 64 40 56 40 50 Z"/>
      <path d="M40 40 C40 56 22 62 18 50 C16 44 24 40 30 40 Z"/>
    </g>
    <path d="M40 42 Q44 58 52 68" stroke="#1b6e26" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  combo: `<path d="M40 8 L49 28 L71 30 L54 44 L60 66 L40 54 L20 66 L26 44 L9 30 L31 28 Z" fill="#ffd23f" stroke="#b07800" stroke-width="3" stroke-linejoin="round"/>
     <text x="40" y="49" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="20" fill="#b03a00" text-anchor="middle">x2</text>`,
};

// ------------------------------------------------------------- obstacles ---

const rock = svg(
  100,
  76,
  `<ellipse cx="50" cy="68" rx="44" ry="7" fill="#000" opacity="0.18"/>
   <path d="M8 66 Q4 40 22 26 Q34 8 56 12 Q80 14 90 36 Q98 56 90 66 Z" fill="#9ba6b2" stroke="#3d4650" stroke-width="3.5" stroke-linejoin="round"/>
   <path d="M14 64 Q50 70 88 64 Q90 52 86 46 Q60 58 16 54 Z" fill="#7d8894"/>
   <path d="M30 26 Q44 18 58 22" stroke="#d6dde4" stroke-width="5" fill="none" stroke-linecap="round"/>
   <path d="M54 36 L62 44 L58 52" stroke="#5e6872" stroke-width="2.5" fill="none" stroke-linecap="round"/>
   <ellipse cx="74" cy="22" rx="9" ry="5" fill="#6bbf4a" opacity="0.85"/>`,
);

const mud = svg(
  130,
  56,
  `<path d="M10 30 Q6 12 34 10 Q50 2 74 8 Q104 4 118 18 Q130 32 112 42 Q96 54 64 48 Q30 54 16 44 Q8 38 10 30 Z" fill="#6e4426" stroke="#3e2410" stroke-width="3"/>
   <path d="M26 28 Q30 18 50 18 Q70 12 90 20 Q106 24 100 34 Q86 42 60 38 Q32 42 26 28 Z" fill="#8a5a33"/>
   <ellipse cx="50" cy="24" rx="12" ry="3" fill="#b88a5f" opacity="0.8"/>
   <circle cx="84" cy="30" r="4" fill="none" stroke="#b88a5f" stroke-width="2"/>
   <circle cx="40" cy="34" r="2.5" fill="#b88a5f"/>`,
);

const hay = svg(
  96,
  92,
  `<ellipse cx="48" cy="86" rx="40" ry="6" fill="#000" opacity="0.18"/>
   <circle cx="48" cy="46" r="40" fill="#e8c15a" stroke="#9a6e15" stroke-width="3.5"/>
   <path d="M48 46 m0 -6 a6 6 0 1 1 -6 6 a12 12 0 1 1 12 12 a18 18 0 1 1 -18 -18 a24 24 0 1 1 24 24 a30 30 0 1 1 -30 -30" fill="none" stroke="#b8891f" stroke-width="3" stroke-linecap="round"/>
   <path d="M14 30 L6 26 M82 32 L92 28 M20 74 L12 80 M78 72 L88 78 M46 6 L44 0" stroke="#c99a2e" stroke-width="2.5" stroke-linecap="round"/>`,
);

const hedgehog = (() => {
  let spikes = 'M10 52 ';
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    const r = i % 2 === 0 ? 40 : 30;
    spikes += `L${(50 + Math.cos(a) * r).toFixed(1)} ${(52 + Math.sin(a) * r * 1.05).toFixed(1)} `;
  }
  spikes += 'Z';
  return svg(
    96,
    66,
    `<ellipse cx="48" cy="60" rx="40" ry="5" fill="#000" opacity="0.18"/>
     <path d="${spikes}" fill="#7a5230" stroke="#3b2412" stroke-width="3" stroke-linejoin="round"/>
     <path d="M30 56 Q14 56 6 48 Q14 34 32 36 Z" fill="#e2b98c" stroke="#3b2412" stroke-width="3" stroke-linejoin="round"/>
     <circle cx="6" cy="48" r="4" fill="#2b1d1a"/>
     <circle cx="20" cy="42" r="3" fill="#2b1d1a"/><circle cx="21" cy="41" r="1" fill="#fff"/>
     <ellipse cx="24" cy="50" rx="4" ry="2.5" fill="#ff9aa8" opacity="0.8"/>
     <rect x="30" y="54" width="8" height="8" rx="3" fill="#3b2412"/><rect x="60" y="54" width="8" height="8" rx="3" fill="#3b2412"/>`,
  );
})();

// --------------------------------------------------------------- combine ---

const combineBody = svg(
  420,
  480,
  `<rect x="236" y="140" width="50" height="34" rx="6" fill="#3a3a3a" stroke="#1d1d1d" stroke-width="3"/>
   <rect x="236" y="320" width="50" height="34" rx="6" fill="#3a3a3a" stroke="#1d1d1d" stroke-width="3"/>
   <rect x="58" y="22" width="16" height="70" rx="4" fill="#4a4a4a" stroke="#1d1d1d" stroke-width="3"/>
   <rect x="54" y="16" width="24" height="10" rx="3" fill="#2a2a2a"/>
   <rect x="26" y="74" width="160" height="66" rx="12" fill="#c23225" stroke="#5c1410" stroke-width="4"/>
   <rect x="36" y="88" width="140" height="10" fill="#f2c230"/>
   <rect x="8" y="128" width="266" height="262" rx="26" fill="#d93a2b" stroke="#5c1410" stroke-width="4"/>
   <rect x="8" y="196" width="266" height="16" fill="#f2c230" stroke="#5c1410" stroke-width="2"/>
   <rect x="28" y="230" width="150" height="120" rx="12" fill="#b72e22" stroke="#5c1410" stroke-width="3"/>
   <path d="M44 252 L162 252 M44 272 L162 272 M44 292 L162 292 M44 312 L162 312 M44 332 L162 332" stroke="#8e2219" stroke-width="5" stroke-linecap="round"/>
   <rect x="166" y="22" width="104" height="122" rx="12" fill="#2f2f2f" stroke="#151515" stroke-width="4"/>
   <rect x="178" y="34" width="80" height="98" rx="8" fill="#9fdcff" stroke="#1c4d6b" stroke-width="2"/>
   <circle cx="214" cy="80" r="14" fill="#5b4636"/>
   <path d="M196 74 Q214 58 232 74 Z" fill="#c9862f" stroke="#5b3b10" stroke-width="2"/>
   <rect x="198" y="94" width="34" height="38" rx="8" fill="#3b6fb6"/>
   <path d="M184 120 L240 40 L254 40 L198 120 Z" fill="#fff" opacity="0.35"/>
   <rect x="158" y="12" width="122" height="16" rx="7" fill="#d93a2b" stroke="#5c1410" stroke-width="3"/>
   <rect x="208" y="0" width="22" height="14" rx="5" fill="#ff9b1f" stroke="#7a4300" stroke-width="2"/>
   <circle cx="262" cy="166" r="11" fill="#fff7b0" stroke="#7a6b00" stroke-width="3"/>
   <circle cx="262" cy="350" r="11" fill="#fff7b0" stroke="#7a6b00" stroke-width="3"/>
   <rect x="268" y="18" width="114" height="452" rx="14" fill="#f2c230" stroke="#6b4e00" stroke-width="4"/>
   <rect x="282" y="38" width="86" height="412" rx="8" fill="#2d2d2d"/>
   ${(() => {
     let teeth = '';
     for (let y = 30; y < 458; y += 22) {
       teeth += `<path d="M380 ${y} L410 ${y + 11} L380 ${y + 22} Z" fill="#e3e7ea" stroke="#4d5359" stroke-width="2.5" stroke-linejoin="round"/>`;
     }
     return teeth;
   })()}`,
);

const wheel = (r: number) => {
  const size = r * 2 + 8;
  const c = size / 2;
  let lugs = '';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const x1 = c + Math.cos(a) * (r - 6);
    const y1 = c + Math.sin(a) * (r - 6);
    const x2 = c + Math.cos(a) * (r + 2);
    const y2 = c + Math.sin(a) * (r + 2);
    lugs += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#111" stroke-width="7"/>`;
  }
  let bolts = '';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    bolts += `<circle cx="${(c + Math.cos(a) * r * 0.32).toFixed(1)}" cy="${(c + Math.sin(a) * r * 0.32).toFixed(1)}" r="${(r * 0.06).toFixed(1)}" fill="#6b4e00"/>`;
  }
  return svg(
    size,
    size,
    `${lugs}<circle cx="${c}" cy="${c}" r="${r - 2}" fill="#262626" stroke="#111" stroke-width="3"/>
     <circle cx="${c}" cy="${c}" r="${r * 0.52}" fill="#f2c230" stroke="#6b4e00" stroke-width="3"/>
     ${bolts}
     <circle cx="${c}" cy="${c}" r="${r * 0.16}" fill="#777" stroke="#333" stroke-width="2"/>`,
  );
};

const reelTile = svg(
  44,
  44,
  `<rect width="44" height="44" fill="#2d2d2d"/>
   <rect x="16" y="0" width="12" height="44" fill="#f2c230" stroke="#6b4e00" stroke-width="2"/>
   <path d="M22 8 L36 12 M22 30 L36 34" stroke="#c9ced3" stroke-width="3" stroke-linecap="round"/>`,
);

const reelShade = svg(
  86,
  412,
  `<rect width="86" height="412" rx="8" fill="url(#s)"/>`,
  `<linearGradient id="s" x1="0" y1="0" x2="1" y2="0">
     <stop offset="0" stop-color="#000" stop-opacity="0.75"/>
     <stop offset="0.45" stop-color="#000" stop-opacity="0"/>
     <stop offset="0.6" stop-color="#fff" stop-opacity="0.12"/>
     <stop offset="1" stop-color="#000" stop-opacity="0.7"/>
   </linearGradient>`,
);

// ------------------------------------------------------------ background ---

const sky = svg(
  64,
  720,
  `<rect width="64" height="720" fill="url(#sky)"/>`,
  `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
     <stop offset="0" stop-color="#4fb3ff"/>
     <stop offset="0.35" stop-color="#9ed8ff"/>
     <stop offset="0.5" stop-color="#e6f6ff"/>
   </linearGradient>`,
);

const sunRays = (() => {
  let rays = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 360;
    rays += `<path d="M100 8 L108 40 L92 40 Z" fill="#ffd84d" transform="rotate(${a} 100 100)"/>`;
  }
  return svg(200, 200, rays);
})();

const sunFace = (() => {
  return svg(
    200,
    200,
    `<circle cx="100" cy="100" r="52" fill="#ffe46b" stroke="#ffb72e" stroke-width="5"/>
     <circle cx="84" cy="94" r="5" fill="#a86b00"/><circle cx="116" cy="94" r="5" fill="#a86b00"/>
     <path d="M82 112 Q100 128 118 112" stroke="#a86b00" stroke-width="5" fill="none" stroke-linecap="round"/>
     <ellipse cx="74" cy="110" rx="8" ry="5" fill="#ff9a6b" opacity="0.6"/><ellipse cx="126" cy="110" rx="8" ry="5" fill="#ff9a6b" opacity="0.6"/>`,
  );
})();

const cloud = svg(
  240,
  120,
  `<g fill="#fff" stroke="#d6ecfa" stroke-width="3">
     <circle cx="70" cy="70" r="36"/><circle cx="120" cy="52" r="44"/><circle cx="172" cy="72" r="34"/>
     <rect x="40" y="70" width="160" height="36" rx="18"/>
   </g>
   <rect x="44" y="66" width="152" height="38" rx="18" fill="#fff"/>`,
);

/** Seamless rolling-hill silhouette (only integer frequencies so it tiles). */
function hills(w: number, h: number, base: number, amps: [number, number][], fill: string, stroke: string, trees: number, seed: number): string {
  let d = `M0 ${h} `;
  const yAt = (x: number) => {
    let y = base;
    for (const [k, a] of amps) y += Math.sin((x / w) * Math.PI * 2 * k) * a;
    return y;
  };
  for (let x = 0; x <= w; x += 16) d += `L${x} ${yAt(x).toFixed(1)} `;
  d += `L${w} ${h} Z`;
  const r = rng(seed);
  let treeSvg = '';
  for (let i = 0; i < trees; i++) {
    const x = 40 + r() * (w - 80);
    const y = yAt(x) + 6;
    const s = 0.7 + r() * 0.6;
    treeSvg += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})">
      <rect x="-5" y="-24" width="10" height="26" fill="#7a5230"/>
      <circle cx="0" cy="-40" r="22" fill="#3e9e3a" stroke="#2a6e27" stroke-width="3"/>
      <circle cx="-10" cy="-30" r="14" fill="#47ad43"/><circle cx="8" cy="-48" r="9" fill="#5cc157"/>
    </g>`;
  }
  return svg(w, h, `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="3"/>${treeSvg}`);
}

function wheatTile(cut: boolean): string {
  const w = 128;
  const h = 100;
  const r = rng(cut ? 7 : 3);
  let s = '';
  if (cut) {
    s += `<rect x="0" y="70" width="${w}" height="30" fill="#c9a24a"/>`;
    for (let i = 0; i < 26; i++) {
      const x = (i / 26) * w + r() * 3;
      const y = 72 + r() * 22;
      s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} l${(r() * 4 - 2).toFixed(1)} -${(6 + r() * 6).toFixed(1)}" stroke="#e7c873" stroke-width="2.5" stroke-linecap="round"/>`;
    }
    for (let i = 0; i < 6; i++) {
      const x = r() * w;
      const y = 78 + r() * 18;
      s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} l14 -3" stroke="#f0d68a" stroke-width="2.5" stroke-linecap="round"/>`;
    }
  } else {
    s += `<rect x="0" y="60" width="${w}" height="40" fill="#d9a93a"/>`;
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 16; i++) {
        const x = (i / 16) * w + row * 2.7 + r() * 3;
        const top = 8 + row * 12 + r() * 8;
        const bottom = 100;
        const lean = r() * 6 - 3;
        const shade = ['#e6b94a', '#f2cc5c', '#d6a535'][row];
        s += `<path d="M${x.toFixed(1)} ${bottom} Q${(x + lean).toFixed(1)} ${((top + bottom) / 2).toFixed(1)} ${(x + lean).toFixed(1)} ${(top + 10).toFixed(1)}" stroke="${shade}" stroke-width="2.5" fill="none"/>
              <ellipse cx="${(x + lean).toFixed(1)}" cy="${(top + 4).toFixed(1)}" rx="3.6" ry="9" fill="${shade}" stroke="#a87a1a" stroke-width="1.2"/>`;
      }
    }
  }
  return svg(w, h, s);
}

function fieldTile(): string {
  const w = 256;
  const h = 440;
  const r = rng(11);
  let s = `<rect width="${w}" height="${h}" fill="#6dbd4f"/>`;
  // Lane stripes (must match LANE_TOP / LANE_STEP / FIELD_TOP in config).
  for (let i = 0; i < 5; i++) {
    const top = 21 + i * 78;
    s += `<rect x="0" y="${top}" width="${w}" height="78" fill="${i % 2 ? '#7ccb59' : '#86d462'}"/>`;
    s += `<rect x="0" y="${top + 70}" width="${w}" height="8" fill="#000" opacity="0.06"/>`;
  }
  for (let i = 0; i < 60; i++) {
    const x = r() * w;
    const y = 10 + r() * (h - 20);
    s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} l-4 -9 M${x.toFixed(1)} ${y.toFixed(1)} l0 -11 M${x.toFixed(1)} ${y.toFixed(1)} l4 -9" stroke="#4f9e37" stroke-width="2" stroke-linecap="round"/>`;
  }
  const flowers = ['#ffffff', '#ffe14d', '#ff8ac2', '#a98bff'];
  for (let i = 0; i < 14; i++) {
    const x = 8 + r() * (w - 16);
    const y = 10 + r() * (h - 20);
    const c = flowers[Math.floor(r() * flowers.length)];
    s += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
      <circle cx="-3" cy="0" r="3" fill="${c}"/><circle cx="3" cy="0" r="3" fill="${c}"/>
      <circle cx="0" cy="-3" r="3" fill="${c}"/><circle cx="0" cy="3" r="3" fill="${c}"/>
      <circle cx="0" cy="0" r="2" fill="#ffb300"/></g>`;
  }
  return svg(w, h, s);
}

const barn = svg(
  330,
  330,
  `<ellipse cx="165" cy="318" rx="150" ry="12" fill="#000" opacity="0.2"/>
   <rect x="34" y="128" width="262" height="188" fill="#c8372d" stroke="#5c1410" stroke-width="4"/>
   <path d="M40 140 L40 312 M70 140 L70 312 M260 140 L260 312 M290 140 L290 312" stroke="#a52a21" stroke-width="4"/>
   <path d="M12 140 L165 22 L318 140 Z" fill="#7b2a1f" stroke="#3d120b" stroke-width="4" stroke-linejoin="round"/>
   <path d="M30 136 L165 34 L300 136" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/>
   <circle cx="165" cy="94" r="20" fill="#3a1d12" stroke="#fff" stroke-width="5"/>
   <path d="M150 90 Q165 76 180 92" stroke="#e8c15a" stroke-width="5" fill="none"/>
   <rect x="98" y="176" width="134" height="140" fill="#2d1810" stroke="#fff" stroke-width="6"/>
   <path d="M108 316 L120 296 L134 316 M200 316 L212 300 L224 316" stroke="#e8c15a" stroke-width="5" fill="#e8c15a"/>
   <rect x="58" y="176" width="36" height="140" fill="#c8372d" stroke="#fff" stroke-width="5"/>
   <path d="M58 176 L94 316 M94 176 L58 316" stroke="#fff" stroke-width="5"/>
   <rect x="236" y="176" width="36" height="140" fill="#c8372d" stroke="#fff" stroke-width="5"/>
   <path d="M236 176 L272 316 M272 176 L236 316" stroke="#fff" stroke-width="5"/>`,
);

const flag = svg(
  80,
  200,
  `<rect x="6" y="10" width="8" height="190" fill="#7a5230" stroke="#3b2412" stroke-width="2"/>
   <circle cx="10" cy="8" r="7" fill="#ffd23f" stroke="#9c6a00" stroke-width="2"/>
   <path d="M14 18 Q44 8 76 22 Q60 38 76 56 Q44 44 14 54 Z" fill="#ff4b8b" stroke="#8a1240" stroke-width="3"/>
   <path d="M28 28 L36 36 L28 44 M44 28 L52 36 L44 44" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
);

// -------------------------------------------------------------- effects ---

const splat = (() => {
  const r = rng(42);
  const cx = 150;
  const cy = 100;
  const pts: [number, number][] = [];
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rad = (i % 2 === 0 ? 70 + r() * 28 : 46 + r() * 12) * 1;
    pts.push([cx + Math.cos(a) * rad * 1.35, cy + Math.sin(a) * rad * 0.82]);
  }
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    const mx = (p[0] + q[0]) / 2;
    const my = (p[1] + q[1]) / 2;
    d += i === 0 ? `M${mx.toFixed(1)} ${my.toFixed(1)} ` : '';
    d += `Q${q[0].toFixed(1)} ${q[1].toFixed(1)} ${((q[0] + pts[(i + 2) % n][0]) / 2).toFixed(1)} ${((q[1] + pts[(i + 2) % n][1]) / 2).toFixed(1)} `;
  }
  d += 'Z';
  let drops = '';
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2;
    const dist = 110 + r() * 30;
    const x = cx + Math.cos(a) * dist * 1.25;
    const y = cy + Math.sin(a) * dist * 0.6;
    if (x < 12 || x > 288 || y < 12 || y > 188) continue;
    drops += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(5 + r() * 8).toFixed(1)}" fill="#8e2de2"/>`;
  }
  return svg(
    300,
    200,
    `${drops}<path d="${d}" fill="#8e2de2" stroke="#4a0f7a" stroke-width="4" stroke-linejoin="round"/>
     <path d="${d}" fill="#b35cff" transform="translate(${cx * 0.45} ${cy * 0.45}) scale(0.55)"/>
     <ellipse cx="128" cy="78" rx="26" ry="10" fill="#e3c2ff" opacity="0.8" transform="rotate(-15 128 78)"/>
     <circle cx="180" cy="70" r="6" fill="#e3c2ff" opacity="0.8"/>`,
  );
})();

const ghost = svg(
  110,
  130,
  `<ellipse cx="55" cy="14" rx="26" ry="8" fill="none" stroke="#ffd23f" stroke-width="5"/>
   <ellipse cx="40" cy="38" rx="9" ry="22" fill="#fff" opacity="0.9" transform="rotate(-15 40 50)"/>
   <ellipse cx="70" cy="38" rx="9" ry="22" fill="#fff" opacity="0.9" transform="rotate(15 70 50)"/>
   <path d="M20 80 Q20 46 55 46 Q90 46 90 80 L90 118 Q82 108 74 118 Q66 128 58 118 Q50 108 42 118 Q34 128 28 116 Q22 108 20 118 Z" fill="#fff" opacity="0.92" stroke="#c8d7ff" stroke-width="3"/>
   <path d="M38 76 Q44 70 50 76 M60 76 Q66 70 72 76" stroke="#5a6b8c" stroke-width="3.5" fill="none" stroke-linecap="round"/>
   <ellipse cx="55" cy="88" rx="4" ry="3" fill="#ff8ab0"/>
   <path d="M48 96 Q55 102 62 96" stroke="#5a6b8c" stroke-width="3" fill="none" stroke-linecap="round"/>`,
);

const spark = svg(32, 32, `<path d="M16 0 L20 12 L32 16 L20 20 L16 32 L12 20 L0 16 L12 12 Z" fill="#fff"/>`);
const dot = svg(24, 24, `<circle cx="12" cy="12" r="11" fill="#fff"/>`);
const softDot = svg(
  64,
  64,
  `<circle cx="32" cy="32" r="32" fill="url(#r)"/>`,
  `<radialGradient id="r"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`,
);
const drop = svg(24, 30, `<path d="M12 2 Q22 16 20 22 Q16 30 12 30 Q8 30 4 22 Q2 16 12 2 Z" fill="#fff"/>`);
const straw = svg(22, 8, `<rect x="1" y="2" width="20" height="4" rx="2" fill="#f0cf6a" stroke="#a87a1a" stroke-width="1"/>`);
const confetti = svg(12, 18, `<rect width="12" height="18" rx="2" fill="#fff"/>`);
const shadow = svg(120, 30, `<ellipse cx="60" cy="15" rx="58" ry="13" fill="#000" opacity="0.25"/>`);
const speedLine = svg(120, 6, `<rect width="120" height="6" rx="3" fill="#fff"/>`);
const shieldBubble = svg(
  170,
  170,
  `<circle cx="85" cy="85" r="80" fill="url(#sb)" stroke="#7fd4ff" stroke-width="5"/>
   <ellipse cx="55" cy="45" rx="22" ry="11" fill="#fff" opacity="0.75" transform="rotate(-35 55 45)"/>`,
  `<radialGradient id="sb" cx="0.5" cy="0.5" r="0.5"><stop offset="0.6" stop-color="#7fd4ff" stop-opacity="0.08"/><stop offset="1" stop-color="#3fa9ff" stop-opacity="0.45"/></radialGradient>`,
);
const smoke = svg(
  64,
  64,
  `<circle cx="32" cy="32" r="30" fill="url(#sm)"/>`,
  `<radialGradient id="sm"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="0.7" stop-color="#fff" stop-opacity="0.5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`,
);
const vignette = svg(
  128,
  72,
  `<rect width="128" height="72" fill="url(#v)"/>`,
  `<radialGradient id="v" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stop-color="#ff0000" stop-opacity="0"/><stop offset="1" stop-color="#ff0000" stop-opacity="0.75"/></radialGradient>`,
);

// ------------------------------------------------------------------ list ---

export function buildArt(): ArtAsset[] {
  const list: ArtAsset[] = [];
  const add = (key: string, w: number, h: number, s: string) => list.push({ key, w, h, svg: s });

  // Run cycle: [hind leg angle, front leg angle, body bob]
  const frames: [number, number, number][] = [
    [42, -48, 2],
    [14, -14, -2],
    [-34, 32, -5],
    [10, 4, 0],
  ];
  frames.forEach(([h, f, dy], i) => {
    add(`rabbit_${i}`, 150, 132, rabbit(h, f, 'normal', dy));
    add(`rabbit_scared_${i}`, 150, 132, rabbit(h, f, 'scared', dy));
  });
  add('rabbit_hurt', 150, 132, rabbit(10, 20, 'hurt'));
  add('rabbit_happy', 150, 132, rabbit(-20, -40, 'happy', -4));

  add('carrot', 64, 80, carrot(false));
  add('carrot_gold', 64, 80, carrot(true));
  add('pu_turbo', 80, 80, bubble(ICONS.turbo, '#ffcc00'));
  add('pu_magnet', 80, 80, bubble(ICONS.magnet, '#ff5a5a'));
  add('pu_shield', 80, 80, bubble(ICONS.shield, '#3fa9ff'));
  add('pu_wrench', 80, 80, bubble(ICONS.wrench, '#9aa5b1'));
  add('pu_sneaker', 80, 80, bubble(ICONS.sneaker, '#ff7a3c'));
  add('icon_speed', 80, 80, bubble(ICONS.sneaker, '#ff7a3c'));
  add('icon_luck', 80, 80, bubble(ICONS.luck, '#3cc94d'));
  add('icon_combo', 80, 80, bubble(ICONS.combo, '#ffb300'));

  add('rock', 100, 76, rock);
  add('mud', 130, 56, mud);
  add('hay', 96, 92, hay);
  add('hedgehog', 96, 66, hedgehog);

  add('combine', 420, 480, combineBody);
  add('wheel_big', 148, 148, wheel(70));
  add('wheel_small', 104, 104, wheel(48));
  add('reel', 44, 44, reelTile);
  add('reel_shade', 86, 412, reelShade);

  add('sky', 64, 720, sky);
  add('sun_rays', 200, 200, sunRays);
  add('sun', 200, 200, sunFace);
  add('cloud', 240, 120, cloud);
  add('hills_far', 1280, 240, hills(1280, 240, 120, [[2, 28], [3, 16], [5, 8]], '#a9d8a0', '#8cc485', 0, 1));
  add('hills_near', 1280, 200, hills(1280, 200, 110, [[1, 18], [4, 14], [7, 6]], '#77c461', '#5aa847', 9, 5));
  add('wheat', 128, 100, wheatTile(false));
  add('stubble', 128, 100, wheatTile(true));
  add('field', 256, 440, fieldTile());
  add('barn', 330, 330, barn);
  add('flag', 80, 200, flag);

  add('splat', 300, 200, splat);
  add('ghost', 110, 130, ghost);
  add('spark', 32, 32, spark);
  add('dot', 24, 24, dot);
  add('soft', 64, 64, softDot);
  add('drop', 24, 30, drop);
  add('straw', 22, 8, straw);
  add('confetti', 12, 18, confetti);
  add('shadow', 120, 30, shadow);
  add('speedline', 120, 6, speedLine);
  add('shield_bubble', 170, 170, shieldBubble);
  add('smoke', 64, 64, smoke);
  add('vignette', 128, 72, vignette);
  return list;
}
