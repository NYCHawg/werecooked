// Interactive kitchen for the Pantry tab: a clean architectural elevation. Each area is a tappable group with data-zone.
window.kitchenSVG = function (c) {
  // c: { zone: {n: itemCount, low: lowCount} }
  const tag = (x, y, label, z) => {
    const k = c[z] || { n: 0, low: 0 }, val = k.low ? `${k.low} low` : String(k.n), w = label.length * 7 + val.length * 6.2 + 30;
    return `<g class="ztag" pointer-events="none" transform="translate(${x - w / 2} ${y - 10})"><rect width="${w}" height="20" rx="10" class="k-tag"/>
      <text x="11" y="13.5" class="k-tl">${label.toUpperCase()}</text><text x="${w - 11}" y="13.5" text-anchor="end" class="k-tv${k.low ? ' low' : ''}">${val}</text></g>`;
  };
  const hl = (x, y, w, h, r = 6) => `<rect class="hl" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
  const jars = [...Array(8)].map((_, i) => { const x = 103 + i * 14.4, h = [16, 13, 16, 14, 16, 12, 15, 16][i];
    return `<rect x="${x}" y="${58 - h}" width="10" height="${h}" rx="2" class="k-glass"/><rect x="${x}" y="${58 - h}" width="10" height="3.2" rx="1.2" class="k-metal"/><rect x="${x + 2}" y="${58 - h + 6}" width="6" height="${Math.max(3, h - 9)}" rx="1" style="fill:${['#B4553A', '#C9963B', '#7C8C4E', '#8C3B2E', '#D7B45A', '#7A6A55', '#A9672F', '#5E7A52'][i]};opacity:.85"/>`; }).join('');
  return `<svg class="kitchen" viewBox="0 0 360 240" role="img" aria-label="Your kitchen. Tap an area to see what's there.">
  <defs>
    <linearGradient id="kSteel" x1="0" x2="1"><stop offset="0" style="stop-color:var(--ks1)"/><stop offset=".55" style="stop-color:var(--ks2)"/><stop offset="1" style="stop-color:var(--ks1)"/></linearGradient>
    <linearGradient id="kCab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--kc)"/><stop offset="1" style="stop-color:var(--kc-d)"/></linearGradient>
    <pattern id="kTile" width="18" height="9" patternUnits="userSpaceOnUse"><rect width="18" height="9" class="k-wall2"/><path d="M0 8.5H18M9 0V9" class="k-grout"/></pattern>
    <filter id="kSh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2" stdDeviation="2.2" flood-color="#000" flood-opacity=".14"/></filter>
  </defs>
  <rect width="360" height="226" class="k-wall"/>
  <rect x="92" y="64" width="170" height="86" fill="url(#kTile)"/>
  <rect y="222" width="360" height="18" class="k-floor"/>

  <g class="zone" data-zone="pantry" tabindex="0" role="button" aria-label="Pantry cabinet">
    <rect x="10" y="24" width="74" height="198" rx="3" fill="url(#kCab)" filter="url(#kSh)"/>
    <rect x="15" y="30" width="30" height="186" rx="2" class="k-panel"/><rect x="49" y="30" width="30" height="186" rx="2" class="k-panel"/>
    <rect x="40" y="104" width="2.2" height="36" rx="1.1" class="k-pull"/><rect x="52" y="104" width="2.2" height="36" rx="1.1" class="k-pull"/>
    ${hl(8, 22, 78, 202)}
  </g>

  <g class="zone" data-zone="spices" tabindex="0" role="button" aria-label="Spice shelf">
    <rect x="96" y="24" width="124" height="38" fill="transparent"/>
    ${jars}
    <rect x="96" y="58" width="124" height="4.5" rx="1.5" class="k-wood" filter="url(#kSh)"/>
    ${hl(94, 22, 128, 43)}
  </g>

  <g class="zone" data-zone="baking" tabindex="0" role="button" aria-label="Baking shelf">
    <rect x="96" y="70" width="124" height="38" fill="transparent"/>
    <rect x="104" y="79" width="26" height="25" rx="5" class="k-ceram"/><rect x="104" y="76" width="26" height="5" rx="2.5" class="k-wood"/><rect x="110" y="88" width="14" height="1.6" rx=".8" class="k-ink"/>
    <rect x="136" y="83" width="23" height="21" rx="5" class="k-ceram"/><rect x="136" y="80" width="23" height="5" rx="2.5" class="k-wood"/><rect x="141" y="91" width="13" height="1.6" rx=".8" class="k-ink"/>
    <rect x="165" y="87" width="19" height="17" rx="4.5" class="k-ceram"/><rect x="165" y="84" width="19" height="4.5" rx="2.2" class="k-wood"/>
    <rect x="192" y="84" width="11" height="20" rx="3" style="fill:#6B3A22"/><rect x="194.5" y="79" width="6" height="6" rx="1" class="k-metal"/>
    <rect x="207" y="90" width="9" height="14" rx="2.5" class="k-glass"/>
    <rect x="96" y="104" width="124" height="4.5" rx="1.5" class="k-wood" filter="url(#kSh)"/>
    ${hl(94, 68, 128, 43)}
  </g>

  <g class="zone" data-zone="counter" tabindex="0" role="button" aria-label="Counter">
    <rect x="94" y="114" width="166" height="36" fill="transparent"/>
    <path d="M176 150v-26a9 9 0 0 1 18 0v4" class="k-faucet"/>
    <rect x="108" y="141" width="44" height="7" rx="2" class="k-wood"/><path d="M112 141c0-9 8-13 18-13s18 4 18 13z" style="fill:#C8955A"/><path d="M119 133l3 3M128 131l3 3M137 133l3 3" class="k-score"/>
    <path d="M206 148h40c-1 0-2-11-20-11s-19 11-20 11z" class="k-ceram"/><circle cx="218" cy="137" r="5.5" style="fill:#B4553A"/><circle cx="229" cy="135.5" r="5.5" style="fill:#D7B45A"/><circle cx="239" cy="138" r="4.8" style="fill:#7C8C4E"/>
    ${hl(92, 112, 170, 40)}
  </g>
  <rect x="88" y="149" width="178" height="8" rx="1.5" class="k-stone" filter="url(#kSh)"/>

  <g class="zone" data-zone="household" tabindex="0" role="button" aria-label="Under the sink">
    <rect x="92" y="157" width="170" height="65" fill="url(#kCab)"/>
    <rect x="97" y="162" width="78" height="55" rx="2" class="k-panel"/><rect x="179" y="162" width="78" height="55" rx="2" class="k-panel"/>
    <rect x="120" y="168" width="32" height="2.2" rx="1.1" class="k-pull"/><rect x="202" y="168" width="32" height="2.2" rx="1.1" class="k-pull"/>
    ${hl(90, 155, 174, 69, 4)}
  </g>

  <g class="zone" data-zone="freezer" tabindex="0" role="button" aria-label="Freezer">
    <rect x="270" y="24" width="80" height="64" rx="5" fill="url(#kSteel)" filter="url(#kSh)"/>
    <rect x="279" y="44" width="2.6" height="30" rx="1.3" class="k-handle"/>
    ${hl(268, 22, 84, 68)}
  </g>
  <g class="zone" data-zone="fridge" tabindex="0" role="button" aria-label="Fridge">
    <rect x="270" y="90" width="80" height="132" rx="5" fill="url(#kSteel)" filter="url(#kSh)"/>
    <rect x="279" y="100" width="2.6" height="46" rx="1.3" class="k-handle"/>
    <rect x="270" y="88.6" width="80" height="1.6" class="k-seam"/>
    ${hl(268, 88, 84, 136)}
  </g>
  ${tag(47, 14, 'Pantry', 'pantry')}${tag(158, 14, 'Spices', 'spices')}${tag(128, 117, 'Baking', 'baking')}${tag(230, 117, 'Counter', 'counter')}
  ${tag(177, 196, 'Under sink', 'household')}${tag(310, 14, 'Freezer', 'freezer')}${tag(310, 160, 'Fridge', 'fridge')}
  </svg>`;
};
