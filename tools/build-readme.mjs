// Builds the GitHub profile README and its link buttons from the portfolio's data.
//   node tools/build-readme.mjs ../portfolio-claude-v3
// The portfolio folder holds data/data.json and data/images.json; nothing here is typed twice.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.resolve(here, process.argv[2] || '../portfolio-claude-v3');
const data = JSON.parse(fs.readFileSync(path.join(site, 'data/data.json'), 'utf8'));
const dims = JSON.parse(fs.readFileSync(path.join(site, 'data/images.json'), 'utf8'));
const LIVE = 'https://bader915.github.io/portfolio/';
const P = data.person, E = data.experience[0];
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const enc = s => encodeURI(s);

/* buttons: small SVG pills in the portfolio's colours (a hover effect is not possible in a README) */
function button(file, label, solid) {
  const w = Math.round(label.length * 8.6 + 48);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="44" viewBox="0 0 ${w} 44" role="img" aria-label="${esc(label)}">
  <rect x="1" y="1" width="${w - 2}" height="42" rx="21" fill="${solid ? '#ffd23f' : '#0b1118'}" stroke="${solid ? '#ffd23f' : '#3a4652'}" stroke-width="2"/>
  <text x="${w / 2}" y="28" text-anchor="middle" font-family="Segoe UI, Helvetica Neue, Arial, sans-serif" font-size="15" font-weight="600" fill="${solid ? '#161000' : '#f4f6f8'}">${esc(label)}</text>
</svg>
`;
  fs.writeFileSync(path.join(here, 'assets', file), svg);
  return `assets/${file}`;
}
fs.mkdirSync(path.join(here, 'assets'), { recursive: true });
const buttons = [
  [button('btn-portfolio.svg', 'Open the portfolio', true), LIVE, 'Open the portfolio'],
  [button('btn-contact.svg', 'Contact panel', false), LIVE + 'contact.html', 'Contact panel'],
  [button('btn-linkedin.svg', 'LinkedIn', false), P.linkedin, 'LinkedIn'],
  [button('btn-cv.svg', 'Download the CV', false), LIVE + enc(P.cv), 'Download the CV'],
];

/* project cards: the strongest work, each card opens its page on the portfolio */
// [slug, which of its images to show]: landscape pictures keep the rows even
const FEATURED = [['pcb-defect-vit', 0], ['microgrid-protection', 2], ['golf-ball-qc', 3], ['wood-defect-segmentation', 0], ['relay-coordination', 0], ['fabric-qc', 0]];
const bySlug = Object.fromEntries(data.projects.map(p => [p.slug, p]));
const cats = Object.fromEntries(data.categories.map(c => [c.id, c.label]));
const thumb = src => { const b = src.replace(/\.webp$/, ''); return dims[b + '-800.webp'] ? b + '-800.webp' : dims[b + '-400.webp'] ? b + '-400.webp' : src; };
const card = ([slug, n]) => {
  const p = bySlug[slug]; if (!p) throw new Error('no project ' + slug);
  const url = `${LIVE}work/${slug}.html`, img = p.images[n];
  return `<td width="33%" valign="top">
<a href="${url}"><img src="${LIVE}${enc(thumb(img.src))}" alt="${esc(img.alt)}" width="100%"></a>
<br><a href="${url}"><b>${esc(p.title)}</b></a>
<br><sub>${esc(cats[p.category])} · ${esc(p.context)}</sub>
</td>`;
};
const rows = [FEATURED.slice(0, 3), FEATURED.slice(3)].map(r => `<tr>\n${r.map(card).join('\n')}\n</tr>`).join('\n');

/* every project, grouped by discipline, in collapsible sections */
const order = [...data.projects].sort((a, b) => a.order - b.order);
const groups = data.categories.map(c => ({ c, list: order.filter(p => p.category === c.id) })).filter(g => g.list.length);
const sections = groups.map(g => `<details>
<summary><b>${esc(g.c.label)}</b> · ${g.list.length} projects</summary>
<br>

${g.list.map(p => `- [${p.title}](${LIVE}work/${p.slug}.html): ${p.summary}`).join('\n')}

</details>`).join('\n');

/* skills table */
const skills = data.skills.map(s => `| **${s.domain}** | ${s.items.slice(0, 6).join(', ')} |`).join('\n');

const readme = `<a href="${LIVE}"><img src="assets/banner.svg" alt="Badr Albdulmajeed, electrical and electronic engineer: power system protection, Siemens PLC automation, machine vision, embedded hardware" width="100%"></a>

<p>
${buttons.map(([src, href, alt]) => `<a href="${href}"><img src="${src}" alt="${esc(alt)}" height="44"></a>`).join('\n')}
</p>

<img src="${LIVE}assets/avatar/pose-wave.webp" alt="Animated portrait of Badr waving in the workshop" width="150" align="right">

### ${P.headline}

${P.lead} ${P.degree}. ${P.visa}, so no sponsorship is needed. ${P.availability}.

**${E.role}**, ${E.org.replace(/ Sdn Bhd$/, '')}, Malaysia · March to July 2025

${E.homePoints.filter(x => !/24 V DC/.test(x)).map(x => `- ${x}`).join('\n')}

<br clear="right">

### Selected work

<table>
${rows}
</table>

### Every project

Open a discipline to see its projects. Each one links to its page on the portfolio, written from its report.

${sections}

### What I work with

| Area | Tools and methods |
|---|---|
${skills}

<details>
<summary><b>Certificates</b> · ${data.certificates.length} from ${[...new Set(data.certificates.map(c => c.issuer))].join(', ')}</summary>
<br>

${data.certificates.map(c => `- [${c.name}](${LIVE}${enc(c.href)}), ${c.issuer}, ${c.date}`).join('\n')}

</details>

---

<sub>The banner and buttons are drawn in this repository. The project cards and portrait come from the live portfolio at <a href="${LIVE}">bader915.github.io/portfolio</a>, which is built from the code in <a href="https://github.com/bader915/portfolio">bader915/portfolio</a>.</sub>
`;
fs.writeFileSync(path.join(here, 'README.md'), readme);
console.log('README.md written:', data.projects.length, 'projects,', FEATURED.length, 'featured');
