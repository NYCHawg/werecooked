// Interactive kitchen illustration for the Pantry tab. Each zone is a tappable group with data-zone.
window.kitchenSVG = function (c) {
  // c: { zone: {n: itemCount, low: lowCount} }
  const O = 'stroke="#1A1A1A" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';
  const tag = (x, y, label, z, anchor = 'middle') => {
    const k = c[z] || { n: 0, low: 0 }, w = label.length * 6.4 + 34;
    const x0 = anchor === 'middle' ? x - w / 2 : x;
    return `<g class="ztag" pointer-events="none"><rect x="${x0}" y="${y - 11}" width="${w}" height="22" rx="11" fill="#FFFDF8" ${O} stroke-width="1.6"/>
      <text x="${x0 + 10}" y="${y + 4}" font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" fill="#1E1A16">${label}</text>
      <text x="${x0 + w - 10}" y="${y + 4}" text-anchor="end" font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" fill="${k.low ? '#D24F14' : '#6F665C'}">${k.low ? '!' + k.low : k.n}</text></g>`;
  };
  return `<svg class="kitchen" viewBox="0 0 360 252" role="img" aria-label="Your kitchen. Tap a spot to see what's there.">
  <defs><pattern id="tile" width="24" height="12" patternUnits="userSpaceOnUse"><rect width="24" height="12" fill="#F4E4CC"/><path d="M0 12H24M12 0V12" stroke="#E6D2B4" stroke-width="1"/></pattern></defs>
  <rect x="0" y="0" width="360" height="226" fill="#FBF0DF"/>
  <rect x="92" y="76" width="168" height="76" fill="url(#tile)"/>
  <rect x="0" y="222" width="360" height="30" fill="#D9C2A0"/><path d="M0 236H360" stroke="#C7AD88" stroke-width="1.5"/>

  <!-- pantry cabinet -->
  <g class="zone" data-zone="pantry" tabindex="0" role="button" aria-label="Pantry cabinet">
    <rect x="8" y="34" width="78" height="190" rx="4" fill="#B5793F" ${O}/>
    <rect x="14" y="40" width="31" height="178" rx="2" fill="#C58B4F" ${O} stroke-width="1.8"/><rect x="49" y="40" width="31" height="178" rx="2" fill="#C58B4F" ${O} stroke-width="1.8"/>
    <circle cx="41" cy="132" r="2.6" fill="#1A1A1A"/><circle cx="53" cy="132" r="2.6" fill="#1A1A1A"/>
    <rect x="20" y="56" width="19" height="26" rx="2" fill="#E9DCC4" stroke="#1A1A1A" stroke-width="1.4"/><path d="M23 64h13M23 70h10" stroke="#B5793F" stroke-width="1.6"/>
    <rect x="55" y="150" width="19" height="13" rx="2" fill="#2E6B4E" stroke="#1A1A1A" stroke-width="1.4"/><rect x="55" y="166" width="19" height="13" rx="2" fill="#D24F14" stroke="#1A1A1A" stroke-width="1.4"/>
  </g>

  <!-- spice rack -->
  <g class="zone" data-zone="spices" tabindex="0" role="button" aria-label="Spice rack">
    <rect x="98" y="22" width="122" height="48" rx="4" fill="#8A5A2E" ${O}/>
    <path d="M98 46H220" stroke="#1A1A1A" stroke-width="2.4"/>
    ${[0, 1, 2, 3, 4, 5, 6].map(i => { const x = 104 + i * 16.5, cols = ['#D24F14', '#C9961B', '#5E9E3A', '#8A2A2A', '#E8C468', '#6E6150', '#B9682F']; return `<rect x="${x}" y="28" width="11" height="15" rx="2" fill="#FFF7EA" stroke="#1A1A1A" stroke-width="1.4"/><rect x="${x}" y="28" width="11" height="5" rx="1.5" fill="${cols[i]}" stroke="#1A1A1A" stroke-width="1.4"/><rect x="${x}" y="52" width="11" height="15" rx="2" fill="#FFF7EA" stroke="#1A1A1A" stroke-width="1.4"/><rect x="${x}" y="52" width="11" height="5" rx="1.5" fill="${cols[(i + 3) % 7]}" stroke="#1A1A1A" stroke-width="1.4"/>`; }).join('')}
  </g>

  <!-- baking shelf -->
  <g class="zone" data-zone="baking" tabindex="0" role="button" aria-label="Baking shelf">
    <rect x="98" y="76" width="122" height="38" fill="transparent"/>
    <rect x="98" y="106" width="122" height="7" rx="2" fill="#8A5A2E" ${O}/>
    <path d="M106 106V88a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v18z" fill="#FFFDF8" ${O}/><rect x="104" y="80" width="32" height="6" rx="2" fill="#2E6B4E" ${O} stroke-width="1.8"/>
    <text x="120" y="100" text-anchor="middle" font-family="Inter,sans-serif" font-size="7" font-weight="800" fill="#1E1A16">FLOUR</text>
    <path d="M142 106V90a4 4 0 0 1 4-4h18a4 4 0 0 1 4 4v16z" fill="#FFFDF8" ${O}/><rect x="140" y="82" width="30" height="6" rx="2" fill="#D24F14" ${O} stroke-width="1.8"/>
    <text x="155" y="100" text-anchor="middle" font-family="Inter,sans-serif" font-size="7" font-weight="800" fill="#1E1A16">SUGAR</text>
    <path d="M176 106V96a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v10z" fill="#E8C468" ${O}/><rect x="198" y="88" width="16" height="18" rx="3" fill="#7A3F1E" ${O}/><rect x="201" y="83" width="10" height="6" rx="1" fill="#1A1A1A"/>
  </g>
  <!-- counter -->
  <g class="zone" data-zone="counter" tabindex="0" role="button" aria-label="Counter">
    <rect x="96" y="120" width="160" height="32" fill="transparent"/>
    <path d="M110 143c0 6 8 9 20 9s20-3 20-9z" fill="#2F6F9F" ${O}/>
    <circle cx="122" cy="137" r="6.5" fill="#C62828" ${O} stroke-width="1.8"/><circle cx="136" cy="136" r="6.5" fill="#E8B530" ${O} stroke-width="1.8"/><path d="M127 131c4-6 13-8 19-5-6 1-10 3-12 7" fill="#F3D35B" ${O} stroke-width="1.8"/>
    <path d="M162 150v-10c0-6 6-9 18-9s18 3 18 9v10z" fill="#D49A57" ${O}/><path d="M170 137l4 4M180 135l4 4M190 137l4 4" stroke="#8A5A2E" stroke-width="1.6"/>
    <circle cx="214" cy="143" r="8" fill="#E9C9A0" ${O} stroke-width="1.8"/><circle cx="228" cy="144" r="7" fill="#C9A06A" ${O} stroke-width="1.8"/><path d="M214 135v-4M228 137v-3" stroke="#1A1A1A" stroke-width="1.6"/>
    <circle cx="242" cy="145" r="6" fill="#F4ECE0" ${O} stroke-width="1.6"/>
  </g>
  <rect x="88" y="150" width="174" height="12" rx="3" fill="#E7DFD1" ${O}/>

  <!-- under-sink cabinet -->
  <g class="zone" data-zone="household" tabindex="0" role="button" aria-label="Under the sink">
    <rect x="94" y="162" width="162" height="62" fill="#F0E4CC" ${O}/>
    <rect x="100" y="168" width="72" height="50" rx="3" fill="#FFF7EA" ${O} stroke-width="1.8"/><rect x="178" y="168" width="72" height="50" rx="3" fill="#FFF7EA" ${O} stroke-width="1.8"/>
    <path d="M166 193h2M184 193h2" stroke="#1A1A1A" stroke-width="3"/>
    <path d="M112 212v-18a4 4 0 0 1 4-4h8l2-6h6v28z" fill="#5BA4D4" stroke="#1A1A1A" stroke-width="1.4"/>
  </g>

  <!-- fridge + freezer -->
  <g class="zone" data-zone="freezer" tabindex="0" role="button" aria-label="Freezer">
    <rect x="266" y="22" width="88" height="70" rx="8" fill="#D9E8EF" ${O}/>
    <rect x="274" y="38" width="5" height="34" rx="2.5" fill="#1A1A1A"/>
    <path d="M318 44l0 22M307 49l22 12M329 49l-22 12" stroke="#7FA7BA" stroke-width="2.2"/>
  </g>
  <g class="zone" data-zone="fridge" tabindex="0" role="button" aria-label="Fridge">
    <rect x="266" y="94" width="88" height="130" rx="8" fill="#E6F0F4" ${O}/>
    <rect x="274" y="108" width="5" height="44" rx="2.5" fill="#1A1A1A"/>
    <rect x="298" y="112" width="18" height="22" rx="3" fill="#FFFDF8" stroke="#1A1A1A" stroke-width="1.4"/><path d="M301 112v-4h12v4" stroke="#1A1A1A" stroke-width="1.4" fill="#2F6F9F"/>
    <circle cx="331" cy="124" r="6" fill="#FFC531" stroke="#1A1A1A" stroke-width="1.4"/>
    <rect x="290" y="200" width="56" height="12" rx="3" fill="#CFE3D6" stroke="#1A1A1A" stroke-width="1.4"/>
  </g>
  ${tag(47, 18, 'Pantry', 'pantry')}${tag(159, 12, 'Spices', 'spices')}${tag(159, 119, 'Baking', 'baking')}${tag(214, 157, 'Counter', 'counter')}
  ${tag(175, 240, 'Under sink', 'household')}${tag(310, 12, 'Freezer', 'freezer')}${tag(310, 168, 'Fridge', 'fridge')}
  </svg>`;
};
