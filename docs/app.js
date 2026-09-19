/* MITRA course site
   Reads courses/courses.json and renders the course. No build step, no framework. */

const $ = (sel, root = document) => root.querySelector(sel);
const REPO = 'https://github.com/RishiR123/MITRA-Students';

let course = null;
let flat = [];                    // every lesson, in order, each carrying its module
const notesCache = new Map();

/* ── helpers ─────────────────────────────────────────────────────────── */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const ICON = {
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
  chev:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`,
  play:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12-7.5z"/></svg>`,
  clock: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  link:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>`,
  pr:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M6 8.5v7M8.5 6H14a3 3 0 0 1 3 3v6.5"/></svg>`,
  book:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 1 5.5 18H19v3H5.5A1.5 1.5 0 0 1 4 19.5z"/><path d="M8.5 8h6M8.5 12h4"/></svg>`,
};

/* ── progress (per browser, not per account) ─────────────────────────── */

const KEY = 'mitra.progress.v1';

function readProgress() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function writeProgress(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ }
}
const isDone = (id) => readProgress()[id] === true;

function setDone(id, done) {
  const p = readProgress();
  if (done) p[id] = true; else delete p[id];
  writeProgress(p);
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ── markdown ────────────────────────────────────────────────────────── */

function renderMarkdown(src) {
  if (window.marked?.parse) return window.marked.parse(src, { mangle: false, headerIds: false });
  return `<pre>${esc(src)}</pre>`;
}

/* ── the live fit ─────────────────────────────────────────────────────
   90 real rows from Student_Performance.csv — previous exam score against
   performance index. The same gradient descent the lesson teaches, run in the
   browser, so the landing page shows the thing rather than describing it. */

const SAMPLE = '40,29,41,32,43,23,44,23,44,25,44,28,45,35,46,44,48,21,48,38,49,39,49,45,50,45,52,29,53,41,54,38,54,41,54,52,55,38,56,31,57,35,57,51,59,32,59,36,59,38,59,45,61,39,61,50,62,43,62,43,64,43,64,56,65,43,65,49,65,57,66,42,66,44,66,46,67,41,67,52,68,56,69,42,70,62,71,53,71,67,71,70,73,53,73,66,74,47,75,48,76,57,77,67,77,73,77,73,78,68,79,55,79,56,79,65,79,65,79,67,79,72,79,75,79,78,79,79,80,65,81,60,81,67,81,71,82,64,84,69,84,70,84,78,84,82,85,59,86,63,86,68,87,67,87,70,88,67,88,80,89,68,89,76,91,66,92,67,93,71,93,78,95,76,95,91,98,79,99,97';

function samplePoints() {
  const n = SAMPLE.split(',').map(Number);
  const pts = [];
  for (let i = 0; i < n.length; i += 2) pts.push([n[i], n[i + 1]]);
  return pts;
}

function fitHTML() {
  return `
    <figure class="fit-wrap">
      <div class="fit">
        <svg class="fit-plot" viewBox="0 0 640 392" role="img"
             aria-label="A scatter of 90 students: previous exam score against performance index, with a straight line being fitted to them by gradient descent.">
          <g id="fit-axes"></g>
          <g id="fit-points"></g>
          <line id="fit-line" x1="0" y1="0" x2="0" y2="0"
                stroke="var(--line)" stroke-width="3" stroke-linecap="round"/>
        </svg>
        <div class="fit-readout">
          <dl><dt>step</dt><dd id="fit-step">0</dd></dl>
          <dl class="loss"><dt>loss</dt><dd id="fit-loss">—</dd></dl>
          <dl><dt>w</dt><dd id="fit-w">0.000</dd></dl>
          <dl><dt>b</dt><dd id="fit-b">0.000</dd></dl>
          <button class="fit-replay" id="fit-replay" type="button">Run it again</button>
        </div>
      </div>
      <figcaption class="fit-caption">
        Ninety real rows from the dataset. The line starts flat and wrong; each step nudges
        <em>w</em> and <em>b</em> downhill until the loss stops falling. That loop is the lesson.
      </figcaption>
    </figure>`;
}

function startFit() {
  const svg = $('.fit-plot');
  if (!svg) return;

  const pts = samplePoints();
  const W = 640, H = 392, PAD = { l: 46, r: 22, t: 22, b: 40 };
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs) - 4, x1 = Math.max(...xs) + 4;
  const y0 = 10, y1 = 105;

  const px = (x) => PAD.l + ((x - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
  const py = (y) => H - PAD.b - ((y - y0) / (y1 - y0)) * (H - PAD.t - PAD.b);

  // axes: a frame and a few labelled ticks, in the plot's own vernacular
  const xticks = [40, 55, 70, 85, 100], yticks = [20, 40, 60, 80, 100];
  $('#fit-axes').innerHTML = `
    ${yticks.map((t) => `
      <line x1="${PAD.l}" y1="${py(t)}" x2="${W - PAD.r}" y2="${py(t)}"
            stroke="var(--rule)" stroke-width="1"/>
      <text x="${PAD.l - 9}" y="${py(t) + 4}" text-anchor="end"
            font-family="var(--mono)" font-size="11" fill="var(--ink-faint)">${t}</text>`).join('')}
    ${xticks.map((t) => `
      <text x="${px(t)}" y="${H - PAD.b + 19}" text-anchor="middle"
            font-family="var(--mono)" font-size="11" fill="var(--ink-faint)">${t}</text>`).join('')}
    <line x1="${PAD.l}" y1="${H - PAD.b}" x2="${W - PAD.r}" y2="${H - PAD.b}"
          stroke="var(--rule-firm)" stroke-width="1"/>
    <text x="${(PAD.l + W - PAD.r) / 2}" y="${H - 6}" text-anchor="middle"
          font-family="var(--mono)" font-size="11" fill="var(--ink-faint)">previous score</text>
    <text x="14" y="${(PAD.t + H - PAD.b) / 2}" text-anchor="middle"
          transform="rotate(-90 14 ${(PAD.t + H - PAD.b) / 2})"
          font-family="var(--mono)" font-size="11" fill="var(--ink-faint)">performance index</text>`;

  $('#fit-points').innerHTML = pts.map(([x, y]) =>
    `<circle cx="${px(x).toFixed(1)}" cy="${py(y).toFixed(1)}" r="3.6"
             fill="var(--point)" opacity="0.42"/>`).join('');

  // standardise so one learning rate works regardless of the columns' units
  const n = pts.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  const sx = Math.sqrt(xs.reduce((a, b) => a + (b - mx) ** 2, 0) / n);
  const sy = Math.sqrt(ys.reduce((a, b) => a + (b - my) ** 2, 0) / n);
  const zx = xs.map((x) => (x - mx) / sx), zy = ys.map((y) => (y - my) / sy);

  const LR = 0.008, STEPS = 420;
  let w = 0, b = 0, step = 0, raf = 0;

  const line = $('#fit-line');
  const elStep = $('#fit-step'), elLoss = $('#fit-loss'), elW = $('#fit-w'), elB = $('#fit-b');

  function draw() {
    // back to the original units, so w and b mean something to a student
    const W0 = (w * sy) / sx;
    const B0 = my - (w * sy * mx) / sx + sy * b;

    line.setAttribute('x1', px(x0)); line.setAttribute('y1', py(W0 * x0 + B0));
    line.setAttribute('x2', px(x1)); line.setAttribute('y2', py(W0 * x1 + B0));

    let mse = 0;
    for (let i = 0; i < n; i++) mse += (W0 * xs[i] + B0 - ys[i]) ** 2;

    elStep.textContent = step;
    elLoss.textContent = (mse / n).toFixed(2);
    elW.textContent = W0.toFixed(3);
    elB.textContent = B0.toFixed(2);
  }

  function gradientStep() {
    let gw = 0, gb = 0;
    for (let i = 0; i < n; i++) {
      const err = w * zx[i] + b - zy[i];
      gw += err * zx[i]; gb += err;
    }
    w -= LR * (2 * gw) / n;
    b -= LR * (2 * gb) / n;
    step++;
  }

  function run() {
    cancelAnimationFrame(raf);
    w = 0; b = 0; step = 0;
    draw();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      while (step < STEPS) gradientStep();
      draw();
      return;
    }

    const tick = () => {
      for (let k = 0; k < 2 && step < STEPS; k++) gradientStep();
      draw();
      if (step < STEPS) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  $('#fit-replay').addEventListener('click', run);
  run();
}

/* ── video ───────────────────────────────────────────────────────────── */

function hasVideo(lesson) {
  const v = lesson.video;
  if (!v) return false;
  if (v.provider === 'mp4') return Boolean(v.url);
  return (v.provider === 'youtube' || v.provider === 'vimeo') && Boolean(v.id);
}

function playerHTML(lesson) {
  const v = lesson.video || { provider: 'pending' };

  if (v.provider === 'youtube' && v.id) {
    return `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?rel=0&modestbranding=1"
      title="${esc(lesson.title)}" loading="lazy" allowfullscreen
      allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
      referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  }
  if (v.provider === 'vimeo' && v.id) {
    return `<iframe src="https://player.vimeo.com/video/${encodeURIComponent(v.id)}"
      title="${esc(lesson.title)}" loading="lazy" allowfullscreen
      allow="autoplay; fullscreen; picture-in-picture"></iframe>`;
  }
  if (v.provider === 'mp4' && v.url) {
    return `<video controls preload="metadata" playsinline ${v.poster ? `poster="${esc(v.poster)}"` : ''}>
      <source src="${esc(v.url)}" type="video/mp4">
      Your browser can't play this video.
    </video>`;
  }

  return `
    <div class="player-pending">
      <div class="big">The recording is still to come</div>
      <div class="small">
        Everything you need is already here — the notes below are written to stand on their
        own, and the notebook runs without it.
        <br><br>
        Mentors: set <code>video</code> for lesson <code>${esc(lesson.id)}</code> in
        <code>courses/courses.json</code> and merge. The site redeploys itself.
      </div>
    </div>`;
}

/* ── sidebar ─────────────────────────────────────────────────────────── */

function moduleStats(mod) {
  const total = mod.lessons.length;
  const complete = mod.lessons.filter((l) => isDone(l.id)).length;
  return { total, complete, pct: total ? Math.round((complete / total) * 100) : 0 };
}

function overallStats() {
  const total = flat.length;
  const complete = flat.filter((l) => isDone(l.id)).length;
  return { total, complete, pct: total ? Math.round((complete / total) * 100) : 0 };
}

function renderSidebar(activeId = null, filter = '') {
  if (!document.body.classList.contains('has-rail')) return;

  const toc = $('#toc');
  const q = filter.trim().toLowerCase();

  const modules = course.modules
    .map((mod) => ({
      mod,
      lessons: q
        ? mod.lessons.filter((l) =>
            l.title.toLowerCase().includes(q) ||
            l.id.toLowerCase().includes(q) ||
            mod.title.toLowerCase().includes(q))
        : mod.lessons,
    }))
    .filter((m) => m.lessons.length);

  if (!modules.length) {
    toc.innerHTML = `<div class="no-results">Nothing matches &ldquo;${esc(filter)}&rdquo;</div>`;
    return;
  }

  toc.innerHTML = modules.map(({ mod, lessons }) => {
    const st = moduleStats(mod);
    const open = q || lessons.some((l) => l.id === activeId) ||
                 (!activeId && mod === course.modules[0]);

    return `
      <div class="mod ${open ? 'open' : ''} ${st.complete === st.total ? 'complete' : ''}" data-mod="${esc(mod.id)}">
        <button class="mod-head" aria-expanded="${open}">
          <span class="mod-num">${st.complete === st.total ? ICON.check : mod.number}</span>
          <span class="mod-meta">
            <span class="mod-title">${esc(mod.title)}</span>
            <span class="mod-count">${st.complete}/${st.total} lessons</span>
          </span>
          ${ICON.chev}
        </button>
        <div class="lessons">
          ${lessons.map((l) => `
            <button class="lesson ${isDone(l.id) ? 'done' : ''} ${l.id === activeId ? 'active' : ''}"
                    data-go="#/${esc(mod.id)}/${esc(l.id)}">
              <span class="tick">${ICON.check}</span>
              <span class="lesson-name">${esc(l.id)}&nbsp; ${esc(l.title)}</span>
              <span class="lesson-dur ${l.video?.provider === 'pending' ? 'pending' : ''}">
                ${l.video?.provider === 'pending' ? 'soon' : esc(l.duration || '')}
              </span>
            </button>`).join('')}
        </div>
      </div>`;
  }).join('');

  const st = overallStats();
  $('#overall-pct').textContent = `${st.complete} / ${st.total}`;
  $('#overall-bar').style.width = `${st.pct}%`;
}

/* ── home ────────────────────────────────────────────────────────────── */

function resumeHash() {
  const next = flat.find((l) => !isDone(l.id)) || flat[0];
  return next ? `#/${next.mod.id}/${next.id}` : '#/';
}

function renderHome() {
  const st = overallStats();
  const first = course.modules[0];
  const notebook = (first.lessons[0].resources || [])
    .find((r) => /\.ipynb$/.test(r.url));

  $('#main').innerHTML = `
    <div class="wrap">
      <section class="hero">
        <div class="hero-text">
          <p class="hero-eyebrow">${esc(course.program)} &nbsp;/&nbsp; ${esc(course.cohort.replace('cohort-', 'cohort '))}</p>
          <h1>${esc(course.headline || first.title)}</h1>
          <p class="hero-lede">${esc(course.lede || first.summary)}</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="${resumeHash()}">
              ${ICON.play} ${st.complete ? 'Pick up where you stopped' : 'Start the lesson'}
            </a>
            ${notebook ? `
              <a class="btn btn-ghost" href="${esc(notebook.url)}" target="_blank" rel="noopener">
                Open the notebook
              </a>` : ''}
          </div>
        </div>
        ${fitHTML()}
      </section>

      ${first.outcomes?.length ? `
        <section class="band">
          <h2>What you'll be able to do</h2>
          <p class="band-sub">By the end of the lesson and its project, without looking anything up.</p>
          <ul class="outcomes">
            ${first.outcomes.map((o) => `<li>${ICON.check}<span>${esc(o)}</span></li>`).join('')}
          </ul>
        </section>` : ''}

      ${first.concepts?.length ? `
        <section class="band">
          <h2>The four pieces</h2>
          <p class="band-sub">Every trained network needs exactly these, whatever its size.
             Miss one and nothing learns.</p>
          <table class="pieces">
            <thead><tr><th>Piece</th><th>In the notebook</th><th>What it does</th></tr></thead>
            <tbody>
              ${first.concepts.map((c) => `
                <tr>
                  <td class="what">${esc(c.what)}</td>
                  <td><code>${esc(c.code)}</code></td>
                  <td>${esc(c.does)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </section>` : ''}

      ${first.project ? `
        <section class="band">
          <h2>What you submit</h2>
          <div class="brief">
            <h3>${esc(first.title)} — the project</h3>
            <p>${esc(first.project)}</p>
            <div class="hero-actions">
              <a class="btn btn-ghost" href="${REPO}/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">
                ${ICON.pr} How to submit it
              </a>
              <a class="btn btn-ghost" href="${REPO}/issues/new?template=doubt.yml" target="_blank" rel="noopener">
                Ask a doubt
              </a>
            </div>
          </div>
        </section>` : ''}
    </div>`;

  startFit();
  renderSidebar(null, $('#search').value);
  document.title = `${course.program} — ${first.title}`;
}

/* ── lesson ──────────────────────────────────────────────────────────── */

async function renderLesson(modId, lessonId) {
  const idx = flat.findIndex((l) => l.id === lessonId && l.mod.id === modId);
  if (idx === -1) { location.hash = ''; return; }

  const { mod, ...lesson } = flat[idx];
  const prev = flat[idx - 1], next = flat[idx + 1];
  const complete = isDone(lesson.id);
  const notebook = (lesson.resources || []).find((r) => /\.ipynb$/.test(r.url));
  const reading = (lesson.resources || []).filter((r) => r !== notebook);

  $('#main').innerHTML = `
    <div class="wrap">
      <p class="crumb"><a href="#/">${esc(course.program)}</a> / ${esc(mod.title)}</p>

      <div class="lesson-head">
        <h1>${esc(lesson.title)}</h1>
      </div>
      <div class="lesson-meta">
        <span>lesson ${esc(lesson.id)}</span>
        ${lesson.duration && lesson.duration !== '—' ? `<span>${ICON.clock} ${esc(lesson.duration)}</span>` : ''}
        ${complete ? `<span class="is-done">${ICON.check} completed</span>` : ''}
      </div>

      <div class="player${hasVideo(lesson) ? '' : ' is-pending'}">${playerHTML(lesson)}</div>

      ${notebook ? `
        <div class="artifact">
          <span class="artifact-mark">${ICON.book}</span>
          <span class="artifact-text">
            <b>Run it yourself</b>
            <span>The notebook and its dataset, ready to open.</span>
          </span>
          <a class="btn btn-ghost" href="${esc(notebook.url)}" target="_blank" rel="noopener">Open the notebook</a>
        </div>` : ''}

      <div class="actions">
        <button class="btn ${complete ? 'btn-ghost' : 'btn-done'}" id="toggle-done">
          ${complete ? 'Mark as not done' : `${ICON.check} Mark complete`}
        </button>
        <a class="btn btn-ghost" href="${REPO}/issues/new?template=doubt.yml" target="_blank" rel="noopener">
          Ask a doubt
        </a>
        ${mod.project ? `
          <a class="btn btn-ghost" href="${REPO}/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">
            ${ICON.pr} Submit your project
          </a>` : ''}
      </div>

      <div class="notes" id="notes"><p class="loading">Loading the notes</p></div>

      ${reading.length ? `
        <section class="band">
          <h2>Further reading</h2>
          <ul class="resources">
            ${reading.map((r) => `
              <li><a href="${esc(r.url)}" target="_blank" rel="noopener">${ICON.link}${esc(r.label)}</a></li>
            `).join('')}
          </ul>
        </section>` : ''}

      <div class="pager">
        ${prev
          ? `<a href="#/${esc(prev.mod.id)}/${esc(prev.id)}"><span class="dir">Previous</span><span class="what">${esc(prev.title)}</span></a>`
          : '<span class="spacer"></span>'}
        ${next
          ? `<a class="next" href="#/${esc(next.mod.id)}/${esc(next.id)}"><span class="dir">Next</span><span class="what">${esc(next.title)}</span></a>`
          : `<a class="next" href="#/"><span class="dir">That's the course</span><span class="what">Back to the overview</span></a>`}
      </div>
    </div>`;

  document.title = `${lesson.title} — ${course.program}`;
  renderSidebar(lesson.id, $('#search').value);
  $('#main').scrollTop = 0;

  $('#toggle-done').addEventListener('click', () => {
    const nowDone = !isDone(lesson.id);
    setDone(lesson.id, nowDone);
    if (nowDone && next) {
      toast(`Lesson ${lesson.id} complete`);
      location.hash = `#/${next.mod.id}/${next.id}`;
    } else {
      toast(nowDone ? 'Lesson complete — now build the project' : 'Marked as not done');
      renderLesson(modId, lessonId);
    }
  });

  loadNotes(lesson.notes);
}

/* The notes are authored to be read on GitHub too, so they carry their own H1 and
   link to sibling files by relative path. Neither survives being dropped into this
   page: the H1 repeats the title above it, and a relative href resolves against
   /docs/. Fix both on the way in. */

function adoptNotes(html, path) {
  const box = document.createElement('div');
  box.innerHTML = html;

  const h1 = box.querySelector('h1');
  if (h1 && !h1.previousElementSibling) h1.remove();

  const dir = path.split('/').slice(0, -1).join('/');
  const base = `${REPO}/blob/main/${dir}/`;

  for (const a of box.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    a.setAttribute('href', new URL(href, base).href);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  }
  for (const img of box.querySelectorAll('img[src]')) {
    const src = img.getAttribute('src');
    if (!/^(https?:|data:)/.test(src)) {
      img.setAttribute('src', new URL(src, `${REPO}/raw/main/${dir}/`).href);
    }
  }
  return box.innerHTML;
}

async function loadNotes(path) {
  const box = $('#notes');
  if (!box) return;

  if (!path) { box.innerHTML = '<p class="loading">No written notes for this lesson.</p>'; return; }
  if (notesCache.has(path)) { box.innerHTML = notesCache.get(path); return; }

  // The site is served from docs/, the notes live in courses/ — try both.
  for (const url of [path, `../${path}`]) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const html = adoptNotes(renderMarkdown(await res.text()), path);
      notesCache.set(path, html);
      if ($('#notes')) $('#notes').innerHTML = html;
      return;
    } catch { /* try the next one */ }
  }

  box.innerHTML = `<p class="loading">The notes didn't load. Read them on
    <a href="${REPO}/blob/main/${esc(path)}" target="_blank" rel="noopener">GitHub</a> instead.</p>`;
}

/* ── router ──────────────────────────────────────────────────────────── */

function route() {
  const m = location.hash.match(/^#\/([^/]+)\/([^/]+)$/);
  document.body.classList.remove('nav-open');
  if (m) renderLesson(decodeURIComponent(m[1]), decodeURIComponent(m[2]));
  else renderHome();
}

/* ── theme ───────────────────────────────────────────────────────────── */

const THEME_KEY = 'mitra.theme';

function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  $('#theme-btn').setAttribute('aria-label',
    t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  try { localStorage.setItem(THEME_KEY, t); } catch { /* private mode */ }
}

/* ── boot ────────────────────────────────────────────────────────────── */

async function boot() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) document.documentElement.dataset.theme = saved;
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.dataset.theme = 'dark';
  } catch { /* private mode */ }

  // Pages copies the syllabus to data/; locally it's still in courses/.
  for (const url of ['data/courses.json', '../courses/courses.json']) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      course = await res.json();
      break;
    } catch { /* try the next one */ }
  }

  if (!course) {
    $('#main').innerHTML = `<div class="wrap"><p class="loading">
      Couldn't load the syllabus. If you're running this locally, serve the repo root
      with <code>python3 -m http.server</code> and open <code>/docs/</code>.</p></div>`;
    return;
  }

  flat = course.modules.flatMap((mod) => mod.lessons.map((l) => ({ ...l, mod })));

  // A rail to move between lessons only earns its width once there are several.
  if (flat.length > 3) document.body.classList.add('has-rail');

  window.addEventListener('hashchange', route);
  route();

  document.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (go) { location.hash = go.dataset.go; return; }

    const head = e.target.closest('.mod-head');
    if (head) {
      const mod = head.closest('.mod');
      const open = mod.classList.toggle('open');
      head.setAttribute('aria-expanded', String(open));
    }
  });

  $('#menu-btn').addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    $('#menu-btn').setAttribute('aria-expanded', String(open));
  });
  $('#backdrop').addEventListener('click', () => document.body.classList.remove('nav-open'));

  $('#theme-btn').addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  $('#search').addEventListener('input', (e) => {
    const active = location.hash.match(/^#\/[^/]+\/([^/]+)$/)?.[1] || null;
    renderSidebar(active, e.target.value);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) {
      e.preventDefault(); $('#search')?.focus();
    }
    if (e.key === 'Escape') document.body.classList.remove('nav-open');
  });
}

boot();
