/* classyQuiz film (animatic): about 60 s, wordless, flat SVG.

   Purpose: a teacher who has never seen a classroom quiz sees what they would
   type to their AI, how the .zip reaches the site, and what the class does:
   the question on the wall only, the choices on every tablet, a tap that shows
   up on the wall, the teacher's phone setting the pace, the split before the
   solution as the moment to talk, avatars instead of names.
   (storyboard-classyquiz.md; screen words from the repo, film-text.md.)

   Built to port: one script, no outside fonts or libraries; every word the
   film shows is in "words" below (the root page's own from landing-text.ts,
   filled in at build time) and drawn at play time in the page's language,
   none in the page's HTML. build.py makes two of it: the artifact (ASSETS as
   data: URIs, inlined) and the site's /js/film.js (sitebuild.py: ASSETS as
   the site's own /landing files and the brand SVGs as text, the font from
   site.css; no data: anywhere). On the site the page holds the poster frame
   as a picture until ▶ (build() below).

   The whole picture is a function of film time t (render(t)); nothing is
   chained on timers, so seeking, pausing and the poster frame are the same
   code path as playing. */
(function () {
  'use strict';

  /*@LOOK@*/

  const ASSETS = /*@ASSETS@*/ window.CQFILM_ASSETS || {};
  const NS = 'http://www.w3.org/2000/svg';
  const W = 1600, H = 900, DUR = 60, POSTER = 47.3;

  // ---------------------------------------------------------------- words
  // The film's only words, all on screens, in the page's language (de en fr it) where the real
  // screens are: the teacher's chat with their AI and the quiz it makes are in the teacher's
  // language, and so is the root page; the site's own screens after the upload (the check, the
  // second device's choice, the wall's chrome, the Remote, the tablets) exist in English only and
  // stay English (film-text.md 0.7). One quiz in every language: the example's 646 000 arrow
  // question, translated, so every language shows the same film.

  /** The root page's words from client/landing-text.ts, filled in by build.py: per language the example ask
      ({ s, l }: l 0 the site's address, any other l a labelled part), code, run, upload, drop, reading, the chapters'
      names (capSheet, capAi, capZip, capWall, capTap) and the player's (play, pause, speed, seek). */
  const LANDING = /*@LANDING@*/ {};

  /* The chat's and the quiz's words per language: ai is what the page's language calls an AI, the letters
     on the AI app's tile (its name under the tile is the chapter's, LANDING.capAi); ask2 is the teacher's
     second message, the real conversation's second ask, which changes the quiz; then the AI's status
     lines, the .zip it makes (the chip's title and the file's name), the quiz's title and its question 1.
     q4, question 4, is no longer shown (the checks keep the questions folded); docs/example/build.py
     holds the example's words to it (docs/example/text.py, FILM).
     en is the real example's (film-text.md 2). draft: true marks a language whose words are drafts,
     to be replaced by the translators' (build.py and sitecheck.py name them). */
  const CONTENT = {
    en: {
      draft: false,
      ai: 'AI',
      ask2: 'Please add some questions where the number is given and they have to pick the matching marked number line.',
      status1: 'Fetching the classyquiz.pages.dev page now.',
      status2: 'Planning the spacing of the four new number-line questions',
      zipTitle: 'Big numbers quiz', zipFile: 'big-numbers-quiz.zip',
      title: 'Big numbers on the number line',
      q1: 'Which number does the arrow show?',
      q4: 'Which number line has an arrow at 654 000?',
    },
    de: {
      draft: true,
      ai: 'KI',
      ask2: 'Bitte füge ein paar Fragen hinzu, bei denen die Zahl gegeben ist und sie den passenden markierten Zahlenstrahl auswählen müssen.',
      status1: 'Rufe jetzt die Seite classyquiz.pages.dev ab.',
      status2: 'Plane die Abstände der vier neuen Zahlenstrahl-Fragen',
      zipTitle: 'Grosse Zahlen Quiz', zipFile: 'grosse-zahlen-quiz.zip',
      title: 'Grosse Zahlen am Zahlenstrahl',
      q1: 'Welche Zahl zeigt der Pfeil?',
      q4: 'Welcher Zahlenstrahl hat einen Pfeil bei 654 000?',
    },
    fr: {
      draft: true,
      ai: 'IA',
      ask2: 'Ajoute s’il te plaît quelques questions où le nombre est donné et où ils doivent choisir la droite graduée marquée qui correspond.',
      status1: 'Je consulte la page classyquiz.pages.dev.',
      status2: 'Planification de l’espacement des quatre nouvelles questions sur la droite graduée',
      zipTitle: 'Quiz grands nombres', zipFile: 'quiz-grands-nombres.zip',
      title: 'Les grands nombres sur la droite graduée',
      q1: 'Quel nombre la flèche montre-t-elle ?',
      q4: 'Quelle droite graduée a une flèche à 654 000 ?',
    },
    it: {
      draft: true,
      ai: 'IA',
      ask2: 'Per favore aggiungi alcune domande in cui il numero è dato e devono scegliere la retta numerica segnata corrispondente.',
      status1: 'Sto leggendo la pagina classyquiz.pages.dev.',
      status2: 'Pianifico la spaziatura delle quattro nuove domande sulla retta numerica',
      zipTitle: 'Quiz grandi numeri', zipFile: 'quiz-grandi-numeri.zip',
      title: 'I grandi numeri sulla retta numerica',
      q1: 'Quale numero indica la freccia?',
      q4: 'Quale retta numerica ha una freccia a 654 000?',
    },
  };

  /** The film's own words and the example's figures, the same in every language. */
  const COMMON = {
    zipSub: 'ZIP',
    choices: ['646 000', '645 000', '644 000', '647 000'],
    right: 0,
    codePh: '12345',
    photos: ['sheet-photo-1.jpg', 'sheet-photo-2.jpg'],
    nq: ' · 13 questions',
    code: '63953', teacherCode: '63953 47',
    addr: 'classyquiz.pages.dev',
    of: ' / 13',
    // the chapters' starts, marked on the time bar: [film time, the key of its name in landing-text.ts (LANDING)]
    chapters: [[0, 'capSheet'], [4.4, 'capAi'], [19.6, 'capZip'], [28.7, 'capWall'], [38.0, 'capTap']],
    // the names on the standalone page; on the site the stage's, ▶'s, the replay's and the full screen button's are the page's, in its language
    ui: { again: 'Play again', full: 'Full screen', film: 'From an exercise sheet to the class: a film without sound' },
  };
  /** The words the film quotes from the site's own screens, English on the real site too (film-text.md 0.7): the local check, the
      lobby's check, the second device's question, the wall before anyone is let in, the Remote's buttons. client/film.test.ts holds
      them to the site's sources, so a screen that changes its words fails the tests until the film follows. A piece of the how-to
      with a kind is the site's address or the teacher code, which the screen fills in. */
  const SITE = {
    // the local check (client/open.ts, the entries' words from client/entry-*.ts)
    playedAsk: 'How will it be played?',
    entries: [
      { name: 'Solo', line: 'You play the quiz on your own, to learn or review: the solution after each answer.', button: 'Play ▶', note: 'Nothing goes to the site. A reload or closing the tab ends it.' },
      { name: 'Peers', line: 'You play the quiz with friends, each on your own device. It moves on once everyone has answered, so nobody has to run it.', button: 'Play together ▶', note: 'This puts the quiz on the site, with a code for the others. Until then it is only in this browser.' },
      { name: 'Quizmaster', line: "You run the quiz for a class or a group: the questions on a big screen, the answers on everyone's own device.", button: 'Open the lobby ▶', note: 'This puts the quiz on the site. Until then it is only in this browser.' },
    ],
    fold: 'The questions and their solutions', foldHint: 'If you will play it yourself, leave this closed.',
    // the lobby's check (client/screen.ts, renderCheck; on a phone, so without the line on a second screen in a new window)
    joinCode: 'Join code ',
    arrangeAsk: 'How are the screens arranged?',
    arrange: [
      { name: 'One screen', line: 'It shows the quiz and steers it: the buttons under the quiz, the keyboard or a clicker.' },
      { name: 'Screen and remote', line: 'One device shows the quiz, another steers it: a phone, say.' },
    ],
    howTo: [['On the second device, open '], ['classyquiz.pages.dev', 'bold'], [' and type '], ['63953 47', 'code'], ['.']],
    call: 'In a video call, the window you share is the screen everyone sees.',
    letIn: 'Let everyone in ▶', more: '⋯ More',
    // the second device's question (client/play.ts)
    showHere: 'Show the quiz here', showHereSub: 'everyone watches this screen',
    steerHere: 'Steer it from here', steerHereSub: 'Start, next, the solution',
    wait: 'Joining opens in a moment.',
    // the Remote's button at each press: Start quiz's ▶ after, the steps' before (client/steps.ts)
    presses: ['Let everyone in ▶', 'Start quiz ▶', '▶ Choices', '▶ Answers', '▶ Solution', '▶ Final ranking'],
  };
  const LANGS = Object.keys(CONTENT);

  /** The film's words in language `lang`, a fresh object (a build changes its own: the site's address).
      The ask breaks into lines at ordinary spaces only: a labelled part ("Nr. 1", "5. Klasse") is one unbreakable
      piece, and so is a space before ? ! : ; » or after « (French). */
  function words(lang) {
    const L = LANDING[lang], Q = CONTENT[lang];
    if (!L || !Q) throw new Error(`no film words for "${lang}"`);
    const nb = (s) => s.replace(/ /g, ' ');
    const glue = (s) => s.replace(/ (?=[?!:;»])/g, ' ').replace(/« /g, '« ');
    return Object.assign(JSON.parse(JSON.stringify(COMMON)), JSON.parse(JSON.stringify(SITE)), {
      ask1: L.ask.map((p) => (p.l === 0 ? [p.s, 'addr'] : p.l !== undefined ? [nb(p.s), 'part'] : [glue(p.s)])),
      ask2: [[glue(Q.ask2)]],
      ai: Q.ai, aiName: L.capAi,
      status1: Q.status1, status2: Q.status2,
      zipTitle: Q.zipTitle, title: Q.title, q1: Q.q1,
      files: [Q.zipFile, ...COMMON.photos],
      codeLabel: L.code, run: L.run, upload: L.upload, drop: L.drop, reading: L.reading,
      // [name, film time, key]; the player's names (play, pause, speed, the time bar) in the page's language
      chapters: COMMON.chapters.map(([at, key]) => [L[key], at, key]),
      ui: Object.assign({}, COMMON.ui, { play: L.play, pause: L.pause, speed: L.speed, seek: L.seek }),
      lang: `${lang.toUpperCase()} ▾`,
    });
  }
  /** The film's language: the nearest lang around the film (client/home.ts sets #landing's before the film loads), else English. */
  function langOf(host) {
    const l = ((host.closest('[lang]') || {}).lang || '').slice(0, 2).toLowerCase();
    return LANGS.includes(l) ? l : 'en';
  }

  // ---------------------------------------------------------------- tokens
  const C = {
    paper: '#fbf8f2', ink: '#1d1d1b', muted: '#5d5c57', card: '#ffffff', rule: '#e2ddd2',
    frame: '#2b2b29', accent: '#a8471a', good: '#1f8a4c', bad: '#c62828', codeBg: '#f1eee6',
    skin1: '#f1c4a1', skin1d: '#d9a07a',
  };
  const ANS = ['#d93b3b', '#2f6fd6', '#e8b100', '#1f9d55'];
  const ANS_INK = ['#ffffff', '#ffffff', '#1b1b1f', '#ffffff'];
  const SHAPES = [
    'M50 12 L90 84 H10Z',
    'M50 8 L92 50 L50 92 L8 50Z',
    'M50 10 A40 40 0 1 1 49.9 10Z',
    'M17 13 H83 Q87 13 87 17 V83 Q87 87 83 87 H17 Q13 87 13 83 V17 Q13 13 17 13Z',
  ];
  const ICON = {
    check: 'M4 12.5l5 5L20 6.5',
    cross: 'M6 6l12 12M18 6L6 18',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z"/>',
    star: 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.2"/>',
    trophy: 'M7 3h10v4a5 5 0 01-10 0zM5 4H2v2a4 4 0 004 4M19 4h3v2a4 4 0 01-4 4M10 14h4v3h3v3H7v-3h3z',
  };

  /** One film, in one language: everything it draws and its player, built afresh each time (a language switch
      on the page builds another), so nothing of one build is left in the next. */
  function film(host, lang) {
    const TX = words(lang);
    const CHECK = { overflow: [] }; // what the build measured, for check() (sitecheck.py)
    const DEMO = COMMON.addr;
    /** The site's address wherever the film shows it (the ask, the AI's status line, the check, the wall, the end card): on the site the one
        the browser opened, by client/home.ts's rule, so an own copy shows its own; the standalone page keeps the demo's. */
    function siteAddress(h) {
      const swap = (v) => (typeof v === 'string' ? v.split(DEMO).join(h) : Array.isArray(v) ? v.map(swap) : v);
      for (const k of ['ask1', 'status1', 'howTo', 'addr']) TX[k] = swap(TX[k]);
    }

    // ---------------------------------------------------------------- timeline
    // Every teacher press on the phone, and when its change lands on the wall.
    const PRESS = [28.4, 35.0, 38.0, 44.0, 50.0, 56.3];
    const LAG = 0.25;
    const T = {
      sheet1: 0.3, sheet2: 0.75, raise: [1.7, 2.4], flash1: 2.95, flash2: 3.75, home: 4.3,
      pulse: 5.55, open: 6.25, expand: [6.85, 7.3],
      attach: 7.45, type1: 7.85, send1: 13.5, status1: 13.85, bars1: [14.05, 14.85], zip1: 14.95,
      type2: 15.35, send2: 17.8, status2: 18.05, bars2: [18.2, 18.6], zip2: 18.75, tapZip: 19.45,
      web: 19.7, tapUpload: 20.3, sheetUp: [20.5, 20.75], tapFile: 21.0, sheetDown: [21.1, 21.3],
      local: 21.55, tapLobby: 22.5, lobby: 22.75, tapRemote: 23.3, zoomCode: [23.6, 24.1], shrink: [24.45, 25.05],
      lapOn: 25.4, typeCode: 25.75, codeStep: 0.11, enterClick: 26.75, enter: 26.95, showClick: 27.35,
      kidsIn: 29.6, oneTap: 39.6, ots: [36.9, 41.3], ots2: [52.55, 54.4], flick: [55.4, 56.25], end: [58.5, 59.0],
      cut: 27.7, walk: [29.2, 30.3],
    };
    // The asks type at whatever speed ends them this long before their send, however long they are in a language
    // or with an own copy's address: the first holds for the address to be read, the second barely.
    const HOLD1 = 1.425, HOLD2 = 0.165;
    const PH = [150, 512]; // the phone in the teacher's left hand, world coordinates
    const LAPTOP = { x: 425, y: 525, w: 140, s: 140 / 960 };
    const SCREEN = { x: 600, y: 70, w: 760, s: 760 / 960 };

    // ---------------------------------------------------------------- helpers
    const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
    const lerp = (a, b, k) => a + (b - a) * k;
    const seg = (t, a, b) => clamp((t - a) / (b - a));
    const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    const eseg = (t, a, b) => ease(seg(t, a, b));
    const outBack = (k) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
    const popIn = (t, a, d = 0.35) => (t <= a ? 0 : t >= a + d ? 1 : outBack((t - a) / d));
    const fade = (t, a, b, d = 0.2) => Math.min(seg(t, a, a + d), 1 - seg(t, b - d, b));
    function keys(t, arr, log) {
      if (t <= arr[0][0]) return arr[0][1];
      for (let i = 1; i < arr.length; i++) {
        if (t < arr[i][0]) {
          const [t0, v0] = arr[i - 1], [t1, v1] = arr[i];
          const k = ease((t - t0) / (t1 - t0));
          if (Array.isArray(v0)) return v0.map((a, j) => (log && log[j] ? Math.exp(lerp(Math.log(a), Math.log(v1[j]), k)) : lerp(a, v1[j], k)));
          return lerp(v0, v1, k);
        }
      }
      return arr[arr.length - 1][1];
    }
    function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    function E(tag, attrs, parent) {
      const e = document.createElementNS(NS, tag);
      if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    }
    function G(parent, html, attrs) { const g = E('g', attrs, parent); if (html) g.innerHTML = html; return g; }
    // Attribute writes only when the value changes: most of the picture holds still most of the time.
    function set(el, k, v) { el._c = el._c || {}; if (el._c[k] !== v) { el._c[k] = v; el.setAttribute(k, v); } }
    function vis(el, on) { set(el, 'display', on ? 'inline' : 'none'); }
    function op(el, v) { v = clamp(v); vis(el, v > 0.002); if (v > 0.002) set(el, 'opacity', v >= 0.999 ? '1' : v.toFixed(3)); }
    function tf(el, s) { set(el, 'transform', s); }
    function txt(el, s) { if (el._t !== s) { el._t = s; el.textContent = s; } }
    const f1 = (x) => (Math.round(x * 10) / 10).toString();
    const tr = (x, y, s) => `translate(${f1(x)} ${f1(y)})` + (s === undefined || s === 1 ? '' : ` scale(${s.toFixed(4)})`);

    // SVG snippets
    function T_(x, y, s, size, o = {}) {
      return `<text x="${f1(x)}" y="${f1(y)}" font-size="${size}"${o.fit ? ` data-fit="${o.fit}"` : ''}${o.cls ? ` class="${o.cls}"` : ''} fill="${o.fill || C.ink}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.extra || ''}>${esc(s)}</text>`;
    }
    const shape = (k, x, y, s, fill) => `<path d="${SHAPES[k]}" transform="${tr(x, y, s / 100)}" fill="${fill}"/>`;
    const icon = (name, x, y, s, fill, stroke) => {
      const d = ICON[name];
      const inner = d.startsWith('<') ? d : stroke ? `<path d="${d}" fill="none" stroke="${fill}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : `<path d="${d}"/>`;
      return `<g transform="${tr(x, y, s / 24)}" fill="${fill}" color="${fill}">${inner}</g>`;
    };
    const avUse = (i, x, y, s, extra = '') => `<use href="#cqav${i}" x="${f1(x)}" y="${f1(y)}" width="${f1(s)}" height="${f1(s)}"${extra}/>`;

    // Text measuring (wrapping and underlines are measured, not guessed).
    let meas;
    const XMLNS = 'http://www.w3.org/XML/1998/namespace';
    /** A text that must stay inside its box (data-fit = the box's width): shrunk about its anchor when the face runs wider. Faces differ by device (system-ui). */
    function fitText(el) {
      const max = +el.getAttribute('data-fit');
      if (!max) return;
      el.removeAttribute('transform');
      const w = el.getComputedTextLength();
      if (w > max) {
        const x = +el.getAttribute('x') || 0, y = +el.getAttribute('y') || 0, k = max / w;
        el.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) scale(${k.toFixed(4)}) translate(${f1(-x)} ${f1(-y)})`);
      }
    }
    const lineW = (parts, size, clsOf) => {
      const p = parts.slice();
      while (p.length && /^ +$/.test(p[p.length - 1].text)) p.pop();
      return p.reduce((a, q) => a + measure(q.text, size, clsOf(q.kind)), 0);
    };
    function measure(str, size, cls) {
      set(meas, 'font-size', String(size));
      set(meas, 'class', cls || '');
      meas.textContent = str;
      return meas.getComputedTextLength();
    }
    /** Lines from pieces [[text, kind]]: breaks only at ordinary spaces (not at a no-break space); each piece keeps its index in the whole string. */
    function wrap(pieces, size, maxW, clsOf) {
      const words = [];
      let idx = 0, cur = null;
      for (const [text, kind] of pieces) {
        for (const tok of text.match(/ +|[^ ]+/g) || []) {
          const sp = tok[0] === ' ';
          if (!cur || (!sp && cur.endsSpace)) { cur = { parts: [], endsSpace: false }; words.push(cur); }
          cur.parts.push({ text: tok, kind, start: idx });
          cur.endsSpace = sp;
          idx += tok.length;
        }
      }
      const lines = [];
      let line = [];
      const lineW = (parts) => parts.reduce((w, p) => w + measure(p.text, size, clsOf(p.kind)), 0);
      for (const w of words) {
        const trial = line.concat(w.parts);
        const trimmed = trial.slice();
        while (trimmed.length && /^ +$/.test(trimmed[trimmed.length - 1].text)) trimmed.pop();
        if (line.length && lineW(trimmed) > maxW) { lines.push(line); line = w.parts.slice(); }
        else line = trial;
      }
      if (line.length) lines.push(line);
      return { lines, total: idx };
    }
    /** Draws wrapped lines; returns an updater that shows the first n characters, and the caret's place. */
    function drawLines(parent, wrapped, x, y, size, lh, o) {
      const g = G(parent);
      const out = [];
      wrapped.lines.forEach((parts, li) => {
        const t = E('text', { x: f1(x), y: f1(y + li * lh), 'font-size': size, fill: o.fill || C.ink }, g);
        t.setAttributeNS(XMLNS, 'xml:space', 'preserve');
        let px = 0;
        parts.forEach((p) => {
          const span = E('tspan', {}, t);
          const cls = o.clsOf(p.kind);
          if (cls) span.setAttribute('class', cls);
          if (o.fillOf && o.fillOf(p.kind)) span.setAttribute('fill', o.fillOf(p.kind));
          span.textContent = p.text;
          // the width of every first k characters, measured here once: typing reads them every frame, and a measure forces a layout
          const pre = [0];
          for (let k = 1; k < p.text.length; k++) pre.push(measure(p.text.slice(0, k), size, cls));
          const w = measure(p.text, size, cls);
          pre.push(w);
          let ul = null;
          if (o.underline && o.underline(p.kind)) ul = E('rect', { x: f1(x + px), y: f1(y + li * lh + size * 0.2), width: f1(w), height: Math.max(2, size * 0.07), fill: o.underline(p.kind) }, g);
          out.push({ span, p, x: x + px, w, pre, li, ul, cls });
          px += w;
        });
      });
      let shown = -1;
      function show(n) {
        if (n === shown) return; shown = n;
        for (const o2 of out) {
          const k = clamp(n - o2.p.start, 0, o2.p.text.length);
          txt(o2.span, o2.p.text.slice(0, k));
          if (o2.ul) set(o2.ul, 'width', f1(o2.pre[k]));
        }
      }
      function caret(n) {
        let last = null;
        for (const o2 of out) if (o2.p.start < n || (!last && o2.p.start === 0)) last = o2;
        if (!last) return [x, y];
        const k = clamp(n - last.p.start, 0, last.p.text.length);
        return [last.x + last.pre[k], y + last.li * lh];
      }
      return { g, show, caret, out, height: wrapped.lines.length * lh };
    }

    // ---------------------------------------------------------------- the class
    const AVATARS = [];
    const KIDS = [];
    const HAIR = ['#2b1d14', '#5a3a22', '#8a5a2b', '#c8913f', '#1b1b1b', '#a0432a', '#e1c07a', '#3b2a1e'];
    const SKIN = [['#f1c4a1', '#d9a07a'], ['#e0ac80', '#c48a5c'], ['#c68a5e', '#a86e45'], ['#8d5a3b', '#734428'], ['#f6d3b8', '#e0b192']];
    const TOPS = ['#3e7bfa', '#e5484d', '#12a594', '#f5c518', '#8e4ec6', '#7cb518', '#e93d82', '#1f3a8a', '#f28c28', '#5d6b7a'];
    function makeClass() {
      const r = rng(7);
      for (let i = 0; i < 20; i++) AVATARS.push({ a: i % 12, c: (i * 3) % 8, b: [0, 1, 2, 3, 4, 5, 0, 2, 1, 3][i % 10], h: [0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 3, 5][i % 12] });
      // 12 right (646 000), 6 the halfway mistake (645 000), 2 one tick off (644 000), 0 the other.
      const ans = [0, 1, 0, 0, 2, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0];
      for (let i = 0; i < 20; i++) {
        const row = i < 10 ? 0 : 1;
        const j = i % 10;
        const s = row ? 1 : 0.86;
        KIDS.push({
          i, row, s,
          x: row ? 615 + j * 104 : 662 + j * 96,
          y: row ? 772 : 652,
          hair: (i * 5 + 1) % 7, hairC: HAIR[(i * 3) % HAIR.length], skin: SKIN[(i * 7) % SKIN.length], top: TOPS[(i * 7 + 3) % TOPS.length],
          av: i, ans: ans[i], jitter: r(),
        });
      }
      // The over-the-shoulder child: front row, a red ponytail; right answer.
      const ots = KIDS[13]; ots.hair = 1; ots.hairC = '#a0432a'; ots.ans = 0; ots.top = '#12a594'; ots.skin = SKIN[0];
      // Walking in from the door on the right: the farthest seats first, so no one crosses.
      const order = KIDS.slice().sort((a, b) => a.x - b.x || a.row - b.row);
      order.forEach((k, n) => {
        k.enter = T.kidsIn + n * 0.1;
        k.walk = 0.6 + (1720 - k.x) / 900;
        k.seated = k.enter + k.walk;
      });
      const byJoin = KIDS.slice().sort((a, b) => a.seated + a.jitter * 0.8 - (b.seated + b.jitter * 0.8));
      byJoin.forEach((k, n) => { k.join = 31.6 + n * 0.16; });
      // Answers: a few before the shown child, the shown child at T.oneTap, the rest after the cut back.
      const others = KIDS.filter((k) => k !== ots).sort((a, b) => a.jitter - b.jitter);
      others.forEach((k, n) => { k.answer = n < 4 ? 38.95 + n * 0.17 : n < 7 ? 39.9 + (n - 4) * 0.4 : 41.45 + (n - 7) * 0.16; });
      ots.answer = T.oneTap + 0.3; // stored a moment after the tap
      ots.tap = T.oneTap;
      KIDS.forEach((k) => { k.tap = k.tap || k.answer - 0.25; });
      // Turning to a neighbour at the split.
      const turners = [[0, 1], [1, -1], [3, 1], [4, -1], [6, 1], [7, -1], [10, 1], [11, -1], [14, 1], [15, -1], [17, 1], [18, -1], [8, 1]];
      turners.forEach(([i, d]) => { KIDS[i].turn = d; });
    }
    const answeredOrder = () => KIDS.slice().sort((a, b) => a.answer - b.answer);
    const joinedOrder = () => KIDS.slice().sort((a, b) => a.join - b.join);
    const counts = [0, 0, 0, 0];

    // ---------------------------------------------------------------- state of the screens at t
    function wallMode(t) {
      if (t < T.showClick + 0.1) return 'off';
      if (t < PRESS[0] + LAG) return 'wait';
      if (t < PRESS[1] + LAG) return 'join';
      if (t < T.flick[0]) return 'q';
      if (t < PRESS[5] + LAG) return 'flick';
      return 'final';
    }
    function qPhase(t) {
      if (t < PRESS[2] + LAG) return 'reading';
      if (t < PRESS[3] + LAG) return 'open';
      if (t < PRESS[4] + LAG) return 'split';
      return 'solution';
    }
    function kidScreen(k, t) {
      const m = wallMode(t);
      if (t < k.join - 0.9) return 'code';
      if (t < k.join) return 'typing';
      if (m === 'join' || m === 'wait' || m === 'off') return 'lobby';
      if (m === 'final' || m === 'flick') return 'rank';
      const q = qPhase(t);
      if (q === 'reading') return 'eye';
      if (q === 'solution') return k.ans === TX.right ? 'right' : 'wrong';
      if (t >= k.tap) return 'chosen';
      return q === 'open' ? 'open' : 'chosen';
    }

    // ---------------------------------------------------------------- build
    let svg, world, cam = [800, 450, 1];
    const updaters = [];
    const on = (f) => updaters.push(f);
    const W2F = (x, y) => [(x - cam[0]) * cam[2] + 800, (y - cam[1]) * cam[2] + 450];

    function defs() {
      const d = E('defs', {}, svg);
      let html = '';
      AVATARS.forEach((av, i) => {
        const inner = avatarSvg(av, false).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
        html += `<symbol id="cqav${i}" viewBox="0 0 100 100">${inner}</symbol>`;
      });
      const sym = (id, src) => {
        const vb = (src.match(/viewBox="([^"]+)"/) || [])[1];
        const inner = src.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title[^>]*>.*?<\/title>/, '').replace(/ id="[^"]*"/g, '');
        return `<symbol id="${id}" viewBox="${vb}">${inner}</symbol>`;
      };
      if (ASSETS.fox) html += sym('cq-fox', ASSETS.fox);
      if (ASSETS.lockup) html += sym('cq-lockup', ASSETS.lockup);
      // A QR-like pattern, drawn once (not a real code: nobody scans a film).
      const r = rng(3); let q = '';
      const n = 25, fin = (x, y) => (x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!fin(x, y) && r() < 0.48) q += `M${x} ${y}h1v1h-1z`;
      const finder = (x, y) => `<path d="M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5z" fill-rule="evenodd"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
      html += `<symbol id="cq-qr" viewBox="-1 -1 27 27"><rect x="-1" y="-1" width="27" height="27" fill="#fff"/><g fill="#1d1d1b"><path d="${q}"/>${finder(0, 0)}${finder(18, 0)}${finder(0, 18)}</g></symbol>`;
      // The question's picture: q1.svg from big-numbers-quiz.zip, as vector.
      let nl = '<rect width="1600" height="340" fill="#fff"/><line x1="80" y1="240" x2="1520" y2="240" stroke="#222" stroke-width="5"/>';
      for (let i = 0; i <= 10; i++) {
        const x = 100 + i * 140, big = i % 5 === 0;
        nl += `<line x1="${x}" y1="240" x2="${x}" y2="${big ? 180 : 214}" stroke="#222" stroke-width="${big ? 6 : 4}"/>`;
        if (big) nl += `<text x="${x}" y="298" font-size="44" text-anchor="middle" fill="#222">${['640 000', '650 000', '660 000'][i / 5]}</text>`;
      }
      nl += '<line x1="520" y1="50" x2="520" y2="160" stroke="#1c7c8c" stroke-width="12"/><polygon points="494,145 546,145 520,190" fill="#1c7c8c"/>';
      html += `<symbol id="cq-q1" viewBox="0 0 1600 340">${nl}</symbol>`;
      // Thumb (tip at 0,0, pointing up) and a child's finger.
      html += `<symbol id="cq-thumb" viewBox="-70 -10 140 470" overflow="visible"><path d="M0 -4 C-34 -4 -52 26 -52 70 L-46 460 L64 460 L56 70 C56 26 34 -4 0 -4Z" fill="${C.skin1}" stroke="${C.skin1d}" stroke-width="5"/><path d="M-26 18 Q2 2 30 18 L28 64 Q2 76 -24 64Z" fill="#f8ddca"/></symbol>`;
      d.innerHTML = html;
      return d;
    }

    function mkFrame(parent, clipId) {
      const g = G(parent);
      const cp = E('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' }, g);
      const r = E('rect', { x: 0, y: 0, width: W, height: H, rx: 0 }, cp);
      g.setAttribute('clip-path', `url(#${clipId})`);
      const inner = G(g);
      return { g, clip: r, inner };
    }

    // ---------------------------------------------------------------- the wall (960 x 540)
    function makeWall(parent, name) {
      const g = G(parent);
      const bar = (s) => T_(24, 38, s, 20, { cls: 'tb', fill: C.muted, fit: 900 });
      g.innerHTML = `
        <rect width="960" height="540" fill="${C.paper}"/>
        <g class="w-off"><rect width="960" height="540" fill="#d9d4ca"/></g>
        <g class="w-wait">${bar(TX.title)}${T_(480, 285, TX.wait, 24, { fill: C.muted, anchor: 'middle', fit: 880 })}</g>
        <g class="w-join">${bar(TX.title)}
          <use href="#cq-qr" x="140" y="78" width="180" height="180"/>
          <use href="#cq-fox" x="84" y="282" width="40" height="40"/>${T_(132, 312, TX.addr, 27, { cls: 'tb', fit: 300 })}
          ${T_(230, 440, TX.code, 104, { cls: 'b', anchor: 'middle', extra: ' letter-spacing="8"' })}
          <g color="${C.ink}" fill="${C.ink}">${icon('person', 486, 80, 34, C.ink)}</g>
          <text class="b w-n" x="526" y="110" font-size="36" fill="${C.ink}">0</text>
          <g class="w-crowd"></g></g>
        <g class="w-q">
          <text class="tb tn w-pos" x="24" y="38" font-size="20" fill="${C.muted}">1${TX.of}</text>
          <g class="w-strip"></g>
          <g class="w-count">${icon('person', 838, 20, 24, C.muted)}<text class="tb tn w-cnt" x="936" y="39" font-size="22" text-anchor="end" fill="${C.muted}">0 / 20</text></g>
          <g class="w-qbody">
            ${T_(480, 108, TX.q1, 44, { cls: 'tb', anchor: 'middle', fit: 900 })}
            <rect x="24" y="126" width="912" height="156" rx="8" fill="#fff"/>
            <use href="#cq-q1" x="113" y="126" width="734" height="156"/>
          </g>
          <g class="w-ghost"><rect class="w-gq" y="80" height="34" rx="17" fill="#d5cfc4"/><rect x="24" y="132" width="912" height="146" rx="8" fill="#fff"/><rect class="w-gp" y="196" height="10" rx="5" fill="#cfc8bb"/></g>
          <g class="w-tiles"></g>
          ${T_(936, 530, '', 14, { fill: C.muted, anchor: 'end', extra: ' class="w-foot"' })}
        </g>
        <g class="w-party"></g>
        <g class="w-final"></g>`;
      const q = (s) => g.querySelector(s);
      const P = { off: q('.w-off'), wait: q('.w-wait'), join: q('.w-join'), q: q('.w-q'), final: q('.w-final'), party: q('.w-party') };
      q('.w-foot').innerHTML = `${esc(TX.addr)} · <tspan class="b" fill="${C.ink}">${TX.code}</tspan>`;
      // lobby crowd
      const crowd = q('.w-crowd');
      const jo = joinedOrder();
      const crowdEls = jo.map((k, n) => {
        const x = 490 + (n % 5) * 90, y = 140 + Math.floor(n / 5) * 92;
        const e = G(crowd, avUse(k.av, -36, -36, 72));
        e._x = x + 36; e._y = y + 36; e._k = k;
        return e;
      });
      const nTxt = q('.w-n');
      // the question bar's strip
      const strip = q('.w-strip');
      const ao = answeredOrder();
      const stripEls = ao.map((k, n) => { const e = G(strip, avUse(k.av, -15, -15, 30)); e._x = 96 + n * 35 + 15; e._y = 30; e._k = k; return e; });
      const cnt = q('.w-cnt'), cntG = q('.w-count'), pos = q('.w-pos'), qbody = q('.w-qbody'), ghost = q('.w-ghost'), gq = q('.w-gq'), gp = q('.w-gp');
      // tiles
      const tilesG = q('.w-tiles');
      const tiles = [0, 1, 2, 3].map((i) => {
        const x = i % 2 ? 485 : 24, y = i < 2 ? 292 : 403, w = 451, h = 101;
        const tg = G(tilesG, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${ANS[i]}"/>
          ${shape(i, x + 22, y + 22, 58, ANS_INK[i])}
          ${T_(x + 104, y + 64, TX.choices[i], 38, { cls: 'tb tn tl-txt', fill: ANS_INK[i], fit: w - 104 - 130 })}
          <g class="tl-tick">${icon('check', x + w - 118, y + 30, 42, ANS_INK[i], true)}</g>
          <text class="b tl-n" x="${x + w - 20}" y="${y + 68}" font-size="46" text-anchor="end" fill="${ANS_INK[i]}">0</text>
          <rect class="tl-fill" x="${x}" y="${y + h - 10}" width="0" height="10" fill="${ANS_INK[i]}" opacity=".55"/>`);
        return { g: tg, txt: tg.querySelector('.tl-txt'), tick: tg.querySelector('.tl-tick'), n: tg.querySelector('.tl-n'), fill: tg.querySelector('.tl-fill'), w };
      });
      // the winners' band
      const winners = KIDS.filter((k) => k.ans === TX.right);
      P.party.innerHTML = `<rect x="0" y="52" width="960" height="236" fill="${C.paper}" opacity=".9"/>`;
      const jumpers = winners.map((k, n) => { const e = G(P.party, avUse(k.av, -36, -72, 72)); e._x = 60 + n * 76.4; e._y = 250; e._d = (n % 3) * 0.12 + (n % 2) * 0.05; return e; });
      // the final ranking: podium 1-3 and everyone else in front, all jumping
      const fin = P.final;
      fin.innerHTML = `<g>${icon('trophy', 22, 16, 26, C.accent)}${T_(56, 38, TX.title, 20, { cls: 'tb', fill: C.muted, fit: 860 })}</g>
        <rect x="300" y="300" width="140" height="190" fill="#e6dfd2"/><rect x="440" y="250" width="140" height="240" fill="#ddd4c4"/><rect x="580" y="340" width="140" height="150" fill="#e6dfd2"/>
        ${T_(370, 360, '2', 48, { cls: 'b', anchor: 'middle', fill: C.muted })}${T_(510, 312, '1', 56, { cls: 'b', anchor: 'middle', fill: C.accent })}${T_(650, 398, '3', 44, { cls: 'b', anchor: 'middle', fill: C.muted })}`;
      const podium = [[KIDS[5], 510, 250, 120], [KIDS[16], 370, 300, 104], [KIDS[2], 650, 340, 96]];
      const finEls = [];
      podium.forEach(([k, x, y, s], n) => { const e = G(fin, avUse(k.av, -s / 2, -s, s)); e._x = x; e._y = y - 4; e._d = n * 0.1; finEls.push(e); });
      const rest = KIDS.filter((k) => !podium.some((p) => p[0] === k));
      rest.forEach((k, n) => { const row = n % 2; const e = G(fin, avUse(k.av, -32, -64, 64)); e._x = 70 + (n >> 1) * 102 + row * 50; e._y = 470 + row * 62; e._d = (n * 0.137) % 0.5; finEls.push(e); });

      function update(t) {
        const m = wallMode(t);
        vis(P.off, m === 'off'); vis(P.wait, m === 'wait'); vis(P.join, m === 'join');
        vis(P.q, m === 'q' || m === 'flick'); vis(P.final, m === 'final');
        if (m === 'join') {
          let n = 0;
          for (const e of crowdEls) { const p = popIn(t, e._k.join); if (p > 0) n++; vis(e, p > 0); if (p > 0) tf(e, tr(e._x, e._y, p)); }
          txt(nTxt, String(n));
        }
        if (m === 'q' || m === 'flick') {
          const ph = m === 'flick' ? 'reading' : qPhase(t);
          let n = 0;
          for (const e of stripEls) { const p = ph === 'reading' ? 0 : popIn(t, e._k.answer); if (p > 0) n++; vis(e, p > 0); if (p > 0) tf(e, tr(e._x, e._y, p)); }
          vis(cntG, ph !== 'reading');
          txt(cnt, `${n} / 20`);
          set(cnt, 'fill', n === 20 ? C.good : C.muted);
          cntG.querySelector('g').setAttribute('fill', n === 20 ? C.good : C.muted);
          if (m === 'flick') {
            const k = Math.min(12, Math.floor(eseg(t, T.flick[0], T.flick[1]) * 12.99));
            txt(pos, `${k + 1}${TX.of}`);
            op(qbody, 0);
            const gw = 620, pw = 760;
            set(gq, 'x', f1(480 - gw / 2)); set(gq, 'width', f1(gw)); set(gp, 'x', f1(480 - pw / 2)); set(gp, 'width', f1(pw));
          } else { txt(pos, `1${TX.of}`); op(qbody, 1); }
          vis(ghost, m === 'flick');
          const showN = ph === 'split' || ph === 'solution';
          tiles.forEach((tl, i) => {
            vis(tl.txt, ph !== 'reading');
            vis(tl.n, showN); vis(tl.fill, showN);
            if (showN) { txt(tl.n, String(counts[i])); set(tl.fill, 'width', f1(tl.w * counts[i] / 20 * seg(t, PRESS[3] + LAG, PRESS[3] + LAG + 0.6))); }
            vis(tl.tick, ph === 'solution' && i === TX.right);
            op(tl.g, ph === 'reading' ? 0.55 : ph === 'solution' && i !== TX.right ? 0.5 : 1); // veiled tiles are faint (app.css .tiles.veiled)
          });
        }
        // winners jump in a band over the question for about 4 s
        const pa = m === 'q' && qPhase(t) === 'solution' ? fade(t, PRESS[4] + LAG + 0.05, PRESS[4] + LAG + 4.2, 0.3) : 0;
        op(P.party, pa);
        if (pa > 0) for (const e of jumpers) {
          const t0 = PRESS[4] + LAG + 0.1 + e._d;
          const p = popIn(t, t0);
          const j = jumpK((t - t0 - 0.35) / 0.62, 5);
          tf(e, `${tr(e._x, e._y - j.y * 72)} scale(${(p * j.sx).toFixed(3)} ${(p * j.sy).toFixed(3)})`);
        }
        if (m === 'final') for (const e of finEls) {
          const t0 = PRESS[5] + LAG + e._d;
          const p = popIn(t, t0);
          const j = jumpK((t - t0 - 0.35) / 0.62, 4);
          tf(e, `${tr(e._x, e._y - j.y * 60)} scale(${(p * j.sx).toFixed(3)} ${(p * j.sy).toFixed(3)})`);
        }
      }
      return { g, update };
    }
    /** The site's jump (app.css @keyframes jump): crouch, rise, land; squash only at the ground. */
    function jumpK(p, times) {
      if (p < 0 || p >= times) return { y: 0, sx: 1, sy: 1 };
      const f = p % 1;
      const K = [[0, 0, 1, 1], [0.14, 0, 1.1, 0.86], [0.32, 0.32, 0.94, 1.08], [0.5, 0.48, 1, 1], [0.7, 0.25, 0.97, 1.04], [0.86, 0, 1.08, 0.9], [1, 0, 1, 1]];
      for (let i = 1; i < K.length; i++) if (f <= K[i][0]) {
        const a = K[i - 1], b = K[i], k = Math.sin(((f - a[0]) / (b[0] - a[0])) * Math.PI / 2) ** 2;
        return { y: lerp(a[1], b[1], k), sx: lerp(a[2], b[2], k), sy: lerp(a[3], b[3], k) };
      }
      return { y: 0, sx: 1, sy: 1 };
    }

    // ---------------------------------------------------------------- a tablet (400 x 640), full detail
    function makeTablet(parent, k) {
      const g = G(parent);
      const btn = (i) => {
        const x = i % 2 ? 206 : 14, y = i < 2 ? 70 : 352, w = 180, h = 272;
        return `<g class="tb-b"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${ANS[i]}"/>${shape(i, x + w / 2 - 30, y + 80, 60, ANS_INK[i])}
          ${T_(x + w / 2, y + 190, TX.choices[i], 34, { cls: 'tb tn', anchor: 'middle', fill: ANS_INK[i], fit: w - 24 })}
          <rect class="tb-mark" x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" rx="18" fill="none" stroke="${C.ink}" stroke-width="7"/></g>`;
      };
      g.innerHTML = `<rect x="-22" y="-22" width="444" height="684" rx="36" fill="${C.frame}"/><rect width="400" height="640" rx="14" fill="${C.paper}"/>
        <g class="tb-top">${avUse(k.av, 12, 8, 46)}${T_(200, 40, `1${TX.of}`, 22, { cls: 'tb tn', anchor: 'middle', fill: C.muted })}${icon('star', 336, 18, 22, C.ink)}<text class="tb tn tb-score" x="388" y="40" font-size="22" text-anchor="end">0</text></g>
        <g class="tb-eye">${icon('eye', 120, 240, 160, C.ink)}</g>
        <g class="tb-btns">${[0, 1, 2, 3].map(btn).join('')}</g>
        <g class="tb-res"><circle cx="200" cy="270" r="120" class="tb-disc"/><g class="tb-ok">${icon('check', 128, 198, 144, '#fff', true)}</g><g class="tb-no">${icon('cross', 128, 198, 144, '#fff', true)}</g>
          ${shape(k.ans, 160, 430, 80, ANS[k.ans])}</g>`;
      const q = (s) => g.querySelector(s);
      const bs = [...g.querySelectorAll('.tb-b')];
      const marks = [...g.querySelectorAll('.tb-mark')];
      const eye = q('.tb-eye'), btns = q('.tb-btns'), res = q('.tb-res'), disc = q('.tb-disc'), ok = q('.tb-ok'), no = q('.tb-no'), score = q('.tb-score');
      function update(t) {
        const s = kidScreen(k, t);
        vis(eye, s === 'eye');
        vis(btns, s === 'open' || s === 'chosen');
        vis(res, s === 'right' || s === 'wrong');
        const chosen = s === 'chosen';
        bs.forEach((b, i) => op(b, chosen && i !== k.ans ? 0.35 : 1));
        marks.forEach((m, i) => {
          vis(m, chosen && i === k.ans);
          if (chosen && i === k.ans) {
            const stored = t >= k.answer;
            set(m, 'stroke-dasharray', stored ? 'none' : '18 12');
            set(m, 'opacity', stored ? '1' : (0.55 + 0.45 * Math.sin(t * 18)).toFixed(2));
          }
        });
        set(disc, 'fill', s === 'right' ? C.good : C.bad);
        vis(ok, s === 'right'); vis(no, s === 'wrong');
        txt(score, s === 'right' ? '1' : '0');
      }
      return { g, update };
    }

    // ---------------------------------------------------------------- the teacher's thumb, the ripple
    function makeThumb(parent, scale, from) {
      const g = G(parent, `<g class="th-r"><circle r="10" fill="none" stroke="${C.ink}" stroke-width="5"/></g><g class="th"><use href="#cq-thumb" x="-70" y="-10" width="140" height="470"/></g>`);
      const th = g.querySelector('.th'), rp = g.querySelector('.th-r'), rc = rp.querySelector('circle');
      /** taps: [[time, x, y]] in the parent's coordinates. In: 0.6 s, out: 0.55 s; taps under 1.4 s apart go from one to the next without leaving. */
      function update(t, taps) {
        const IN = 0.6, OUT = 0.55, HOLD = 0.15, NEAR = 1.4;
        let pos = null, press = 1, rip = null;
        taps.forEach((tp, i) => {
          const [t0, x, y] = tp, prev = taps[i - 1], next = taps[i + 1];
          const fromPrev = prev && t0 - prev[0] < NEAR, toNext = next && next[0] - t0 < NEAR;
          if (!fromPrev && t >= t0 - IN && t < t0) { const k = eseg(t, t0 - IN, t0 - 0.05); pos = [x + from[0] * (1 - k), y + from[1] * (1 - k)]; }
          if (t >= t0 && t < t0 + HOLD) pos = [x, y];
          if (t >= t0 + HOLD) {
            if (toNext && t < next[0]) { const k = eseg(t, t0 + HOLD, next[0] - 0.05); pos = [lerp(x, next[1], k), lerp(y, next[2], k) + Math.sin(Math.PI * k) * 60 * scale]; }
            else if (!toNext && t < t0 + HOLD + OUT) { const k = eseg(t, t0 + HOLD, t0 + HOLD + OUT); pos = [x + from[0] * k, y + from[1] * k]; }
          }
          if (t > t0 - 0.05 && t < t0 + 0.12) press = 0.94;
          if (t >= t0 && t < t0 + 0.45) rip = [seg(t, t0, t0 + 0.45), x, y];
        });
        vis(th, !!pos);
        if (pos) tf(th, `${tr(pos[0], pos[1], scale * press)} rotate(-24)`);
        vis(rp, !!rip);
        if (rip) { const [rk, x, y] = rip; tf(rp, tr(x, y)); set(rc, 'r', f1(10 + rk * 70 * scale)); set(rc, 'opacity', (0.5 * (1 - rk)).toFixed(2)); set(rc, 'stroke-width', f1(5 * scale)); }
      }
      return { g, update };
    }

    // ---------------------------------------------------------------- the room (world)
    function makeWorld() {
      world = G(svg);
      // wall, floor, pinboard, door
      G(world, `<rect x="-600" y="-400" width="2800" height="1040" fill="#efe6d8"/><rect x="-600" y="600" width="2800" height="700" fill="#d6c2a3"/>
        <rect x="-600" y="596" width="2800" height="8" fill="#c9b08c"/>
        <rect x="40" y="90" width="330" height="200" rx="6" fill="#c9a274"/><rect x="62" y="110" width="80" height="104" fill="#fff" transform="rotate(-3 102 162)"/>
        <rect x="160" y="118" width="86" height="64" fill="#f6e7a6"/><rect x="262" y="104" width="86" height="112" fill="#fff" transform="rotate(4 305 160)"/>
        <rect x="1420" y="250" width="150" height="350" fill="#b9946a"/><circle cx="1440" cy="430" r="7" fill="#7a5a36"/>`);
      // the projector screen
      G(world, `<rect x="${SCREEN.x - 8}" y="${SCREEN.y - 8}" width="${SCREEN.w + 16}" height="${SCREEN.w * 9 / 16 + 16}" rx="4" fill="#c7c1b6"/>`);
      const wallG = G(world, '', { transform: tr(SCREEN.x, SCREEN.y, SCREEN.s) });
      const wall = makeWall(wallG, 'world');
      on((t) => { if (worldOn(t)) wall.update(t); });
      // the desk
      G(world, `<path d="M-200 562 L640 562 L660 690 L-200 690Z" fill="#c89f72"/><rect x="-200" y="690" width="870" height="120" fill="#a77c50"/><rect x="-200" y="810" width="870" height="120" fill="#7f5c3a"/>`);
      // mug: set dressing only, no clock (owner)
      G(world, `<rect x="28" y="548" width="44" height="54" rx="8" fill="#2f7f86"/><path d="M72 560 q18 2 16 18 q-2 14 -16 14" fill="none" stroke="#2f7f86" stroke-width="7"/><ellipse cx="50" cy="550" rx="22" ry="5" fill="#215c61"/>`);
      // the two sheets, laid down
      const sheets = [1, 2].map((n) => G(world, `<g><rect x="2" y="4" width="66" height="92" fill="#000" opacity=".12"/><image href="${ASSETS['sheet' + n] || ''}" x="0" y="0" width="66" height="92" preserveAspectRatio="none"/><rect width="66" height="92" fill="none" stroke="#d9d2c4" stroke-width="1"/></g>`));
      on((t) => {
        [[T.sheet1, 72, 586, -5], [T.sheet2, 148, 590, 6]].forEach(([t0, x, y, r], i) => {
          const k = eseg(t, t0, t0 + 0.7);
          op(sheets[i], seg(t, t0, t0 + 0.15));
          tf(sheets[i], `translate(${f1(x + (1 - k) * 160)} ${f1(y + (1 - k) * 220)}) rotate(${f1(r + (1 - k) * 25)})`);
        });
      });
      // the camera flash on the desk
      const flash = E('circle', { cx: 143, cy: 636, r: 95, fill: '#fff' }, world);
      on((t) => { op(flash, 0.55 * Math.max(1 - seg(t, T.flash1, T.flash1 + 0.3), 0) * (t >= T.flash1 ? 1 : 0) + 0.55 * (t >= T.flash2 ? 1 - seg(t, T.flash2, T.flash2 + 0.3) : 0)); });
      // the laptop
      G(world, `<path d="M${LAPTOP.x - 14} 612 L${LAPTOP.x + LAPTOP.w + 14} 612 L${LAPTOP.x + LAPTOP.w + 26} 628 L${LAPTOP.x - 26} 628Z" fill="#9aa0a6"/>
        <rect x="${LAPTOP.x - 6}" y="${LAPTOP.y - 6}" width="${LAPTOP.w + 12}" height="${LAPTOP.w * 600 / 960 + 12}" rx="5" fill="${C.frame}"/>`);
      const lapG = G(world, '', { transform: tr(LAPTOP.x, LAPTOP.y, LAPTOP.s) });
      const lap = makeLaptop(lapG);
      on((t) => { if (worldOn(t)) lap.update(t); });
      // the teacher, side-on from the cut on
      const side = makeTeacherSide(world);
      on((t) => { if (worldOn(t)) side.update(t); });
      // the class
      const kidsG = G(world);
      const kidEls = [...KIDS.filter((k) => k.row === 0), ...KIDS.filter((k) => k.row === 1)].map((k) => makeKid(kidsG, k));
      on((t) => { if (worldOn(t)) kidEls.forEach((e) => e.update(t)); });
      // bubbles over the class and the teacher
      const bub = makeBubbles(world);
      on((t) => { if (worldOn(t)) bub.update(t); });
    }
    const worldOn = (t) => t >= T.cut && !(t > T.ots[0] && t < T.ots[1]) && !(t > T.ots2[0] && t < T.ots2[1]) && t < T.end[1];
    const openingOn = (t) => t < T.cut && !(t > T.expand[1] && t < T.shrink[0]);
    let phoneAt = [186, 500];

    // ---------------------------------------------------------------- the phone (300 x 600), in the teacher's hand
    function makePhone(parent) {
      const g = G(parent);
      // The AI app on the home screen: one white tile with the letters the page's language uses for an AI (AI, KI, IA),
      // the chapter's name under it as a home screen names its apps. (A ring of invented app icons stood here first;
      // the owner, watching: nothing said AI.) The tile opens into the white chat.
      g.innerHTML = `<rect width="300" height="600" rx="40" fill="#1b1b1d"/><rect x="14" y="22" width="272" height="556" rx="28" fill="#000" class="ph-scr"/>
        <g class="ph-cam"><image class="ph-sheet" x="40" y="90" width="220" height="311" preserveAspectRatio="none"/><circle cx="150" cy="510" r="34" fill="#fff"/><circle cx="150" cy="510" r="27" fill="none" stroke="#000" stroke-width="3"/>
          <g class="ph-th1"><image href="${ASSETS.sheet1 || ''}" width="44" height="62"/></g><g class="ph-th2"><image href="${ASSETS.sheet2 || ''}" width="44" height="62"/></g>
          <rect class="ph-flash" x="14" y="22" width="272" height="556" rx="28" fill="#fff"/></g>
        <g class="ph-home"><g class="ph-tile"><rect x="-65" y="-65" width="130" height="130" rx="30" fill="#fff"/></g>
          ${T_(150, 380, TX.aiName, 30, { cls: 'ts ph-name', fill: '#e6e6e6', anchor: 'middle', fit: 250 })}
          <rect class="ph-open" rx="28" fill="#fff"/><g class="ph-ai">${T_(0, 25, TX.ai, 72, { cls: 'b', anchor: 'middle' })}</g></g>
        <g class="ph-site"><rect x="14" y="22" width="272" height="556" rx="28" fill="${C.paper}"/>
          <rect x="30" y="56" width="210" height="16" rx="5" fill="${C.ink}"/><rect x="30" y="82" width="110" height="10" rx="4" fill="${C.muted}"/><rect x="30" y="112" width="160" height="10" rx="4" fill="${C.ink}"/>
          <rect x="30" y="134" width="240" height="52" rx="9" fill="#fff" stroke="${C.rule}" stroke-width="2"/><rect x="30" y="196" width="240" height="52" rx="9" fill="#ededed" stroke="${C.ink}" stroke-width="2.5"/>
          <rect x="30" y="262" width="230" height="9" rx="4" fill="#bdb8ae"/><rect x="30" y="279" width="150" height="9" rx="4" fill="#bdb8ae"/><rect x="30" y="300" width="220" height="9" rx="4" fill="#cfcac0"/>
          <rect x="120" y="324" width="150" height="46" rx="9" fill="${C.ink}" class="ph-btn"/>
          <rect x="30" y="390" width="240" height="1" fill="${C.rule}"/><rect x="30" y="406" width="200" height="10" rx="4" fill="#cfcac0"/></g>`;
      const q = (s) => g.querySelector(s);
      const camG = q('.ph-cam'), home = q('.ph-home'), site = q('.ph-site'), sheet = q('.ph-sheet'), fl = q('.ph-flash'), th1 = q('.ph-th1'), th2 = q('.ph-th2');
      const tile = q('.ph-tile'), aiG = q('.ph-ai'), name = q('.ph-name'), openR = q('.ph-open');
      function update(t) {
        const camOn = t >= T.raise[1] - 0.2 && t < T.home;
        vis(camG, camOn);
        if (camOn) {
          sheet.setAttribute('href', t < T.flash1 + 0.35 ? ASSETS.sheet1 || '' : ASSETS.sheet2 || '');
          const sway = Math.sin(t * 3) * 3;
          set(sheet, 'x', f1(40 + sway));
          op(fl, (t >= T.flash1 ? 1 - seg(t, T.flash1, T.flash1 + 0.25) : 0) + (t >= T.flash2 ? 1 - seg(t, T.flash2, T.flash2 + 0.25) : 0));
          [[th1, T.flash1], [th2, T.flash2]].forEach(([e, t0], i) => {
            const k = eseg(t, t0 + 0.05, t0 + 0.45);
            vis(e, t > t0);
            tf(e, `${tr(lerp(40, 30 + i * 52, k), lerp(90, 496, k), lerp(5, 1, k))}`);
          });
        }
        const homeOn = t >= T.home && t < T.expand[1] + 0.1;
        vis(home, homeOn);
        if (homeOn) {
          // the tile pops in, pulses twice under the thumb, then its white grows to the whole screen; the letters and the name fade as it goes
          const p = popIn(t, T.home + 0.05, 0.3);
          const pulse = 1 + 0.22 * Math.sin(Math.PI * seg(t, T.pulse, T.pulse + 0.32)) + 0.18 * Math.sin(Math.PI * seg(t, T.pulse + 0.32, T.pulse + 0.64));
          const s = Math.max(0.001, p * pulse);
          tf(tile, tr(150, 270, s)); tf(aiG, tr(150, 270, s));
          op(name, p * (1 - seg(t, T.open, T.open + 0.25))); op(aiG, p * (1 - seg(t, T.open, T.open + 0.3)));
          const k = eseg(t, T.open, T.open + 0.5);
          vis(openR, k > 0);
          if (k > 0) { const x = lerp(85, 14, k), y = lerp(205, 22, k), w = lerp(130, 272, k), h = lerp(130, 556, k); set(openR, 'x', f1(x)); set(openR, 'y', f1(y)); set(openR, 'width', f1(w)); set(openR, 'height', f1(h)); }
        }
        vis(site, t >= T.shrink[0]);
      }
      return { g, update };
    }

    /** 2-bone IK: elbow and hand for a reach from s to target; bend +1 puts the elbow below the line (clockwise in SVG). */
    function ik(sx, sy, tx, ty, l1, l2, bend) {
      const dx = tx - sx, dy = ty - sy;
      const d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1, l1 + l2 - 0.5);
      const th = Math.atan2(dy, dx);
      const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
      return { ex: sx + l1 * Math.cos(th + bend * a), ey: sy + l1 * Math.sin(th + bend * a), hx: sx + d * Math.cos(th), hy: sy + d * Math.sin(th) };
    }

    // The teacher in front of the class, seen from the side, facing the screen (right). Origin: the base of the neck.
    // Draw order by pose: far arm behind the body; the phone, held out in the far hand ahead of the chest, in front of the body
    // so it stays in view; near arm in front of everything (under the phone between presses, on it for a press, also when it points).
    const SIDE = { from: [300, 460, 1.1], to: [552, 522, 1.0] };
    function makeTeacherSide(parent) {
      const g = G(parent);
      const top = '#5b6f8a', topD = '#4a5c75', hair = '#4a2f1d', skin = '#e9b892', skinD = '#d9a07a', trou = '#2f3440', trouD = '#262a33';
      g.innerHTML = `<g class="ts-sq">
        <g class="ts-lf" transform="translate(0 236)"><path d="M0 0 V300" stroke="${trouD}" stroke-width="34" stroke-linecap="round"/></g>
        <path class="ts-af" fill="none" stroke="${topD}" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/><circle class="ts-hf" r="11" fill="${skinD}"/>
        <g class="ts-ln" transform="translate(0 236)"><path d="M0 0 V300" stroke="${trou}" stroke-width="34" stroke-linecap="round"/></g>
        <path d="M-30 12 Q-30 -4 -10 -6 L12 -6 Q32 -4 34 14 Q44 64 36 124 L32 248 L-34 248 L-34 124 Q-38 64 -30 12Z" fill="${top}"/>
        <rect x="-6" y="-24" width="18" height="26" fill="${skinD}"/>
        <g class="ts-head">
          <circle cx="6" cy="-56" r="36" fill="${skin}"/><circle cx="41" cy="-52" r="7" fill="${skin}"/><circle cx="25" cy="-63" r="3.3" fill="#1d1d1b"/>
          <path d="M38 -78 C24 -100 -26 -100 -36 -62 C-42 -42 -34 -26 -20 -20 L-10 -32 C-16 -52 -2 -70 38 -72Z" fill="${hair}"/><circle cx="-32" cy="-34" r="15" fill="${hair}"/>
          <ellipse cx="-2" cy="-50" rx="6" ry="9" fill="${skinD}"/></g>
        <g class="ts-ph"><rect x="-13" y="-25" width="26" height="50" rx="5" fill="#1b1b1d"/><rect x="-10" y="-21" width="20" height="40" rx="2" fill="${C.paper}"/><rect x="-7" y="-9" width="14" height="8" rx="2" fill="${C.ink}"/></g>
        <path class="ts-an" fill="none" stroke="${top}" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="ts-fi" fill="none" stroke="${skin}" stroke-width="7" stroke-linecap="round"/><circle class="ts-hn" r="12" fill="${skin}"/></g>`;
      const q = (x) => g.querySelector(x);
      const lf = q('.ts-lf'), ln = q('.ts-ln'), af = q('.ts-af'), hf = q('.ts-hf'), an = q('.ts-an'), hn = q('.ts-hn'), fi = q('.ts-fi'), head = q('.ts-head'), ph = q('.ts-ph');
      const SH = [4, 10], L1 = 70, L2 = 64; // shoulder (both arms, seen from the side), upper and lower arm
      const ARROW = [SCREEN.x + SCREEN.s * (113 + 734 * 520 / 1600), SCREEN.y + SCREEN.s * (126 + 156 * 120 / 340)];
      function update(t) {
        // walking from the desk to the front: the step's phase from the distance walked, not from the clock
        const wk = eseg(t, T.walk[0], T.walk[1]);
        const nx = lerp(SIDE.from[0], SIDE.to[0], wk), ny0 = lerp(SIDE.from[1], SIDE.to[1], wk), s = lerp(SIDE.from[2], SIDE.to[2], wk);
        const dist = Math.hypot(nx - SIDE.from[0], ny0 - SIDE.from[1]);
        const walking = t > T.walk[0] && t < T.walk[1];
        const phase = dist / 34;
        const swing = walking ? Math.sin(phase) * 18 * Math.min(1, Math.sin(Math.PI * wk) * 3) : 0;
        const ny = ny0 - (walking ? Math.abs(Math.sin(phase)) * 7 : 0);
        tf(g, tr(nx, ny, s));
        tf(lf, `translate(0 236) rotate(${f1(-swing)})`); tf(ln, `translate(0 236) rotate(${f1(swing)})`);
        // the phone in the far hand, held out ahead of the chest (clear of the body and of the near arm)
        const pX = 74, pY = 44;
        tf(ph, `translate(${pX} ${pY}) rotate(-8)`);
        phoneAt = [nx + pX * s, ny + pY * s];
        const e1 = ik(SH[0], SH[1], pX - 4, pY + 18, L1, L2, 1);
        set(af, 'd', `M${SH[0]} ${SH[1]} L${f1(e1.ex)} ${f1(e1.ey)} L${f1(e1.hx)} ${f1(e1.hy)}`);
        set(hf, 'cx', f1(e1.hx)); set(hf, 'cy', f1(e1.hy));
        // near hand: just under the phone; up onto its screen for each press; lifted towards the screen while reading; pointing at the arrow
        let tx = pX - 10, ty = pY + 36;
        for (const p of PRESS) if (t > p - 0.35 && t < p + 0.25) { const k = Math.sin(Math.PI * seg(t, p - 0.35, p + 0.25)); tx += 6 * k; ty -= 22 * k; }
        const toArrow = [(ARROW[0] - nx) / s - SH[0], (ARROW[1] - ny) / s - SH[1]];
        const dl = Math.hypot(toArrow[0], toArrow[1]);
        const read = eseg(t, PRESS[1] + 0.4, PRESS[1] + 0.8) * (1 - eseg(t, PRESS[2] - 0.5, PRESS[2] - 0.2));
        const point = eseg(t, 46.2, 46.7) * (1 - eseg(t, 49.4, 49.9));
        const rx = SH[0] + toArrow[0] / dl * (L1 + L2) * 0.55, ry = SH[1] + toArrow[1] / dl * (L1 + L2) * 0.55 + 20;
        const qx = SH[0] + toArrow[0] / dl * (L1 + L2) * 0.97, qy = SH[1] + toArrow[1] / dl * (L1 + L2) * 0.97;
        tx = lerp(lerp(tx, rx, read), qx, point); ty = lerp(lerp(ty, ry, read), qy, point);
        const e2 = ik(SH[0], SH[1], tx, ty, L1, L2, 1);
        set(an, 'd', `M${SH[0]} ${SH[1]} L${f1(e2.ex)} ${f1(e2.ey)} L${f1(e2.hx)} ${f1(e2.hy)}`);
        set(hn, 'cx', f1(e2.hx)); set(hn, 'cy', f1(e2.hy));
        vis(fi, point > 0.5);
        if (point > 0.5) set(fi, 'd', `M${f1(e2.hx)} ${f1(e2.hy)} l${f1(toArrow[0] / dl * 22)} ${f1(toArrow[1] / dl * 22)}`);
        // she looks up at the screen while she reads it out and when she points
        tf(head, `rotate(${f1(-9 * Math.max(read, point))} 4 -10)`);
      }
      return { update };
    }

    // ---------------------------------------------------------------- the opening (owner's sketch): over the teacher's head onto the desk
    const PO = { x: 810, y: 500, s: 0.44 };             // the phone held up, centre and scale (phone drawn 300 x 600)
    const OLAP = { x: 1730, y: 250, w: 330, s: 330 / 960 };
    let opening, ocam = [800, 450, 1];
    // After the site has shrunk back into the phone, a cut to the laptop's screen (two keys at one time): the laptop is a
    // second device, and a pan across the desk to it only said so with a swoop (owner: unnecessary, too busy).
    const OCAM = [
      [0, [800, 450, 1]], [T.home + 0.1, [800, 450, 1]], [5.4, [PO.x, PO.y, 2.9]],
      [T.lapOn, [PO.x, PO.y, 2.9]], [T.lapOn, [OLAP.x + OLAP.w / 2, OLAP.y + OLAP.w * 600 / 1920, 1484 / OLAP.w]],
    ];
    const O2F = (x, y) => [(x - ocam[0]) * ocam[2] + 800, (y - ocam[1]) * ocam[2] + 450];
    function makeOpening() {
      const g = G(svg);
      const cg = G(g);
      const top = '#5b6f8a', topD = '#4a5c75', hair = '#4a2f1d', skin = '#e9b892', skinD = '#d9a07a';
      G(cg, `<rect x="-900" y="-700" width="3800" height="1110" fill="#efe6d8"/>
        <rect x="-900" y="250" width="3800" height="10" fill="#e3d8c6"/>
        <path d="M-900 400 H2900 V660 H-900Z" fill="#c89f72"/><rect x="-900" y="396" width="3800" height="6" fill="#b48a5e"/>
        <rect x="-900" y="660" width="3800" height="16" fill="#b48a5e"/><rect x="-900" y="676" width="3800" height="700" fill="#7f5c3a"/>`);
      // the mug on the far edge, left (set dressing only, no clock)
      G(cg, `<path d="M168 318 V408 A38 11 0 0 0 244 408 V318Z" fill="#2f7f86"/><ellipse cx="206" cy="318" rx="38" ry="11" fill="#256a70"/><ellipse cx="206" cy="318" rx="31" ry="8" fill="#3b2a1e"/>`);
      // the two sheets, fanned out on the desk, seen at a slant from above
      const sheet = (n) => `<g><rect x="6" y="8" width="250" height="353" fill="#000" opacity=".12"/><image href="${ASSETS['sheet' + n] || ''}" width="250" height="353" preserveAspectRatio="none"/><rect width="250" height="353" fill="none" stroke="#d9d2c4" stroke-width="2"/></g>`;
      const sheets = [G(cg, sheet(1)), G(cg, sheet(2))];
      const flash = E('ellipse', { cx: PO.x, cy: 530, rx: 420, ry: 150, fill: '#fff' }, cg);
      // the laptop on the right of the desk (out of the first frame)
      G(cg, `<path d="M${OLAP.x - 30} ${OLAP.y + 214} H${OLAP.x + OLAP.w + 30} L${OLAP.x + OLAP.w + 80} ${OLAP.y + 300} H${OLAP.x - 80}Z" fill="#9aa0a6"/>
        <path d="M${OLAP.x - 40} ${OLAP.y + 240} H${OLAP.x + OLAP.w + 40} M${OLAP.x - 55} ${OLAP.y + 262} H${OLAP.x + OLAP.w + 55}" stroke="#868c92" stroke-width="5"/>
        <rect x="${OLAP.x - 12}" y="${OLAP.y - 12}" width="${OLAP.w + 24}" height="${OLAP.w * 600 / 960 + 24}" rx="10" fill="${C.frame}"/>`);
      const lap = makeLaptop(G(cg, '', { transform: tr(OLAP.x, OLAP.y, OLAP.s) }));
      // the teacher: the arm from the lower left, the phone held up beyond the head, then the back of the head (nearest the camera, drawn last)
      // The left hand holds the phone from below: palm behind it, the fingertips curling round its right edge, the thumb across from the left edge to the shutter (drawn in the phone's own units).
      const arm = E('path', { fill: 'none', stroke: topD, 'stroke-width': 92, 'stroke-linecap': 'round' }, cg);
      const palmG = G(cg, `<ellipse cx="-14" cy="520" rx="84" ry="118" transform="rotate(-14 -14 520)" fill="${skin}" stroke="${skinD}" stroke-width="6"/>`);
      const phG = G(cg);
      const phone = makePhone(phG);
      const gripG = G(cg, `<g fill="${skin}" stroke="${skinD}" stroke-width="6"><ellipse cx="298" cy="404" rx="17" ry="25"/><ellipse cx="302" cy="456" rx="17" ry="25"/><ellipse cx="298" cy="508" rx="16" ry="23"/></g>
        <g class="op-thumb"><path d="M0 -40 C64 -42 132 -36 158 -23 C182 -11 182 13 158 23 C132 33 64 36 0 36Z" fill="${skin}" stroke="${skinD}" stroke-width="6"/><ellipse cx="144" cy="0" rx="20" ry="15" fill="#f8ddca"/></g>`);
      const opThumb = gripG.querySelector('.op-thumb');
      const THUMB_BASE = [-16, 452];
      G(cg, `<ellipse cx="800" cy="1130" rx="720" ry="270" fill="${top}"/>
        <circle cx="800" cy="960" r="285" fill="${hair}"/>
        <g fill="none" stroke="#5b3a24" stroke-width="7" stroke-linecap="round"><path d="M640 760 Q760 700 900 720"/><path d="M590 840 Q720 760 880 770"/><path d="M960 740 Q1030 780 1050 860"/><path d="M700 700 Q800 680 880 690"/></g>`);
      function phonePos(t) {
        const up = eseg(t, T.raise[0], T.raise[1]);
        return [PO.x - (1 - up) * 240, PO.y + (1 - up) * 520];
      }
      function update(t) {
        [[T.sheet1, 600, 520, -17], [T.sheet2, 1010, 505, 21]].forEach(([t0, x, y, rot], i) => {
          const k = eseg(t, t0, t0 + 0.7);
          op(sheets[i], seg(t, t0, t0 + 0.12));
          tf(sheets[i], `translate(${f1(x + (1 - k) * (i ? 260 : -260))} ${f1(y + (1 - k) * 420)}) scale(1 .64) rotate(${f1(rot + (1 - k) * (i ? 30 : -30))}) translate(-125 -176)`);
        });
        op(flash, 0.5 * ((t >= T.flash1 ? 1 - seg(t, T.flash1, T.flash1 + 0.3) : 0) + (t >= T.flash2 ? 1 - seg(t, T.flash2, T.flash2 + 0.3) : 0)));
        const [px, py] = phonePos(t);
        tf(phG, tr(px - 150 * PO.s, py - 300 * PO.s, PO.s));
        phone.update(t);
        const inPhone = tr(px - 150 * PO.s, py - 300 * PO.s, PO.s);
        tf(palmG, inPhone); tf(gripG, inPhone);
        const [wx, wy] = [px + (-70 - 150) * PO.s, py + (640 - 300) * PO.s]; // the wrist, below the palm
        set(arm, 'd', `M380 1000 L${f1(wx)} ${f1(wy)}`);
        // the thumb rests just above the shutter and presses it at each photo
        let press = 0;
        for (const f of [T.flash1, T.flash2]) press = Math.max(press, Math.sin(Math.PI * seg(t, f - 0.22, f + 0.12)));
        tf(opThumb, `translate(${THUMB_BASE[0]} ${THUMB_BASE[1]}) rotate(${f1(11 + 5 * press)})`);
        if (t > T.lapOn - 0.4 && t < T.cut + 0.1) lap.update(t);
      }
      opening = { g, cg, update, phonePos };
    }

    function makeLaptop(parent) {
      const g = G(parent);
      g.innerHTML = `<rect width="960" height="600" fill="#101012" class="lp-off"/>
        <g class="lp-home"><rect width="960" height="600" fill="${C.paper}"/><rect y="78" width="960" height="1.5" fill="${C.rule}"/>
          <use href="#cq-lockup" x="30" y="17" width="184" height="44" color="${C.ink}"/>
          ${T_(536, 50, TX.codeLabel, 22, { fill: C.muted, anchor: 'end' })}
          <rect x="548" y="16" width="230" height="48" rx="10" fill="#fff" stroke="${C.rule}" stroke-width="2"/>
          <text class="b lp-ph" x="663" y="51" font-size="32" text-anchor="middle" fill="#72716b">${TX.codePh}</text>
          <text class="b lp-code" x="663" y="51" font-size="32" text-anchor="middle" fill="${C.ink}" letter-spacing="1"></text>
          <rect x="788" y="16" width="56" height="48" rx="10" fill="${C.ink}" class="lp-go"/><path d="M808 28 L828 40 L808 52Z" fill="#fff"/>
          ${T_(900, 50, TX.lang, 20, { fill: C.muted, anchor: 'middle' })}
          <rect x="60" y="120" width="840" height="200" rx="14" fill="none" stroke="${C.rule}" stroke-width="2"/>
          <rect x="90" y="150" width="120" height="140" rx="6" fill="#e9e4da"/><rect x="250" y="150" width="120" height="140" rx="6" fill="#e9e4da"/><rect x="410" y="150" width="120" height="140" rx="6" fill="#e9e4da"/><rect x="570" y="150" width="140" height="140" rx="6" fill="#e9e4da"/><rect x="750" y="150" width="120" height="140" rx="6" fill="#e9e4da"/>
          <rect x="60" y="360" width="400" height="18" rx="6" fill="#d5cfc4"/><rect x="500" y="360" width="400" height="18" rx="6" fill="#d5cfc4"/><rect x="60" y="400" width="360" height="12" rx="5" fill="#e2ddd2"/><rect x="500" y="400" width="360" height="12" rx="5" fill="#e2ddd2"/></g>
        <g class="lp-enter"><rect width="960" height="600" fill="${C.paper}"/><rect y="78" width="960" height="1.5" fill="${C.rule}"/><use href="#cq-lockup" x="30" y="17" width="184" height="44" color="${C.ink}"/>
          ${T_(80, 170, TX.title, 46, { cls: 'tb', fit: 820 })}
          <rect x="80" y="220" width="560" height="120" rx="16" fill="${C.ink}" class="lp-b1"/>${T_(110, 272, TX.showHere, 36, { cls: 'ts', fill: '#fff', fit: 500 })}${T_(110, 314, TX.showHereSub, 24, { fill: '#d8d4cc', fit: 500 })}
          <rect x="80" y="364" width="560" height="120" rx="16" fill="#fff" stroke="${C.rule}" stroke-width="3"/>${T_(110, 416, TX.steerHere, 36, { cls: 'ts', fit: 500 })}${T_(110, 458, TX.steerHereSub, 24, { fill: C.muted, fit: 500 })}</g>
        <g class="lp-wall"><rect width="960" height="600" fill="${C.paper}"/><g class="lp-wallin" transform="translate(0 30)"></g></g>
        <g class="lp-cursor"><path d="M0 0 L0 44 L11 33 L19 52 L27 48 L19 30 L34 30Z" fill="#111" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></g>
        <g class="lp-click"><circle r="20" fill="none" stroke="${C.ink}" stroke-width="4"/></g>`;
      const q = (s) => g.querySelector(s);
      const off = q('.lp-off'), home = q('.lp-home'), enter = q('.lp-enter'), wallG = q('.lp-wall'), code = q('.lp-code'), ph = q('.lp-ph'), cur = q('.lp-cursor'), click = q('.lp-click');
      const wall = makeWall(q('.lp-wallin'), 'laptop');
      function update(t) {
        const m = t < T.lapOn ? 'off' : t < T.enter ? 'home' : t < T.showClick + 0.1 ? 'enter' : 'wall';
        vis(off, m === 'off'); vis(home, m === 'home'); vis(enter, m === 'enter'); vis(wallG, m === 'wall');
        if (m === 'home') {
          const n = clamp(Math.floor((t - T.typeCode) / T.codeStep) + 1, 0, TX.teacherCode.length);
          txt(code, TX.teacherCode.slice(0, n)); vis(ph, n === 0);
        }
        if (m === 'wall') wall.update(t);
        // the mouse: to ▶, then to "Show the quiz here"
        const pts = [[T.lapOn, 520, 420], [T.enterClick - 0.35, 520, 420], [T.enterClick, 812, 40], [T.enter + 0.05, 812, 40], [T.showClick - 0.05, 360, 280], [T.showClick + 0.4, 360, 280], [T.showClick + 0.9, 900, 560]];
        const p = keys(t, pts.map(([tt, x, y]) => [tt, [x, y]]));
        vis(cur, t > T.lapOn && t < T.showClick + 0.9);
        tf(cur, tr(p[0], p[1]));
        let ck = -1, cx = 0, cy = 0;
        for (const [tc, x, y] of [[T.enterClick, 812, 40], [T.showClick, 360, 280]]) if (t >= tc && t < tc + 0.4) { ck = seg(t, tc, tc + 0.4); cx = x; cy = y; }
        vis(click, ck >= 0);
        if (ck >= 0) { tf(click, tr(cx, cy, 0.5 + ck * 1.6)); set(click, 'opacity', (1 - ck).toFixed(2)); }
      }
      return { g, update };
    }

    // A child seen from behind: head (hair, ears), shoulders, the tablet held beside them.
    function makeKid(parent, k) {
      const g = G(parent);
      const [sk, skd] = k.skin;
      const hairs = [
        `<circle cx="0" cy="-3" r="35"/>`,
        `<circle cx="0" cy="-3" r="35"/><ellipse cx="0" cy="38" rx="11" ry="27"/><rect x="-8" y="22" width="16" height="7" rx="3" fill="#f5c518"/>`,
        `<circle cx="0" cy="-3" r="35"/><circle cx="0" cy="-38" r="15"/>`,
        `<path d="M-35 -3 A35 35 0 0 1 35 -3 L38 58 Q0 70 -38 58Z"/>`,
        `<circle cx="0" cy="-4" r="31"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => { const a = (i / 9) * Math.PI * 2; return `<circle cx="${f1(28 * Math.cos(a))}" cy="${f1(-4 + 28 * Math.sin(a))}" r="13"/>`; }).join('')}`,
        `<circle cx="0" cy="-3" r="35"/><ellipse cx="-27" cy="42" rx="8" ry="25"/><ellipse cx="27" cy="42" rx="8" ry="25"/>`,
        `<circle cx="0" cy="-3" r="35"/><path d="M-30 -18 L-24 -44 L-14 -26 L-4 -50 L6 -28 L16 -48 L22 -24 L32 -38 L32 -14Z"/>`,
      ];
      g.innerHTML = `<g class="k-all">
        <g class="k-tab" transform="translate(50 30) rotate(13)"><rect x="-23" y="-32" width="46" height="64" rx="6" fill="${C.frame}"/><g class="k-scr"></g></g>
        <path d="M-58 46 Q-60 36 -38 33 L38 33 Q60 36 58 46 L66 240 L-66 240Z" fill="${k.top}"/>
        <rect x="-11" y="20" width="22" height="18" fill="${skd}"/>
        <g class="k-up"><path d="M-40 44 Q-58 0 -60 -64" fill="none" stroke="${k.top}" stroke-width="22" stroke-linecap="round"/><circle cx="-60" cy="-72" r="12" fill="${sk}"/></g>
        <g class="k-head"><circle r="33" fill="${sk}"/><ellipse class="k-ear1" cx="-33" cy="4" rx="6" ry="9" fill="${sk}"/><ellipse class="k-ear2" cx="33" cy="4" rx="6" ry="9" fill="${sk}"/>
          <circle class="k-nose" cx="33" cy="6" r="7" fill="${sk}"/><g class="k-hair" fill="${k.hairC}">${hairs[k.hair]}</g></g></g>`;
      const q = (s) => g.querySelector(s);
      const all = q('.k-all'), head = q('.k-head'), hair = q('.k-hair'), nose = q('.k-nose'), up = q('.k-up'), scr = q('.k-scr');
      // the tablet's tiny screen, one group per state
      scr.innerHTML = `<rect x="-19" y="-27" width="38" height="54" rx="3" fill="${C.paper}"/>
        <g class="ks-code"><rect x="-13" y="-6" width="26" height="10" rx="2" fill="#fff" stroke="#bbb" stroke-width="1.5"/></g>
        <g class="ks-av">${avUse(k.av, -14, -14, 28)}</g>
        <g class="ks-eye">${icon('eye', -11, -11, 22, C.ink)}</g>
        <g class="ks-btn">${[0, 1, 2, 3].map((i) => `<rect class="ks-b" x="${i % 2 ? 1 : -17}" y="${i < 2 ? -23 : 1}" width="16" height="22" rx="2" fill="${ANS[i]}"/>`).join('')}</g>
        <g class="ks-res"><circle r="13" class="ks-disc"/></g>`;
      const S = { code: scr.querySelector('.ks-code'), av: scr.querySelector('.ks-av'), eye: scr.querySelector('.ks-eye'), btn: scr.querySelector('.ks-btn'), res: scr.querySelector('.ks-res') };
      const kb = [...scr.querySelectorAll('.ks-b')], disc = scr.querySelector('.ks-disc');
      function update(t) {
        // walking in
        const walkK = seg(t, k.enter, k.seated);
        const x = lerp(1760, k.x, walkK);
        const walking = walkK > 0 && walkK < 1;
        vis(g, t >= k.enter);
        let y = k.y - (walking ? Math.abs(Math.sin(t * 9 + k.i)) * 10 : 0);
        // the right ones jump (squash only at the ground); the others shrug, one laughs
        let sx = 1, sy = 1;
        const sol = PRESS[4] + LAG;
        if (k.ans === TX.right) {
          const j = jumpK((t - sol - 0.25 - k.jitter * 0.3) / 0.62, 4);
          y -= j.y * 110; sx = j.sx; sy = j.sy;
        }
        tf(all, `${tr(x, y, k.s)} scale(${sx.toFixed(3)} ${sy.toFixed(3)})`);
        // head: turns to a neighbour at the split; nods while laughing
        const turn = (k.turn || 0) * eseg(t, 44.75 + k.jitter * 0.4, 45.1 + k.jitter * 0.4) * (1 - eseg(t, 48.8, 49.2));
        const laugh = k.i === 9 && t > sol + 0.4 && t < sol + 2.6 ? Math.abs(Math.sin((t - sol) * 14)) * 4 : 0;
        const shr = k.ans !== TX.right ? Math.sin(Math.PI * seg(t, sol + 0.3 + k.jitter * 0.3, sol + 1.5 + k.jitter * 0.3)) : 0;
        tf(head, tr(turn * 4, laugh + shr * 6));
        tf(hair, tr(-turn * 9, 0));
        op(nose, Math.abs(turn));
        set(nose, 'cx', turn < 0 ? '-31' : '31');
        vis(up, k.i === 5 && t > 45.6 && t < 49.6);
        // the tablet
        const s = kidScreen(k, t);
        vis(S.code, s === 'code' || s === 'typing');
        vis(S.av, s === 'lobby' || s === 'rank');
        vis(S.eye, s === 'eye');
        vis(S.btn, s === 'open' || s === 'chosen');
        vis(S.res, s === 'right' || s === 'wrong');
        if (s === 'chosen') kb.forEach((b, i) => op(b, i === k.ans ? 1 : 0.3));
        else if (s === 'open') kb.forEach((b) => op(b, 1));
        set(disc, 'fill', s === 'right' ? C.good : C.bad);
      }
      return { update };
    }

    // Wordless bubbles: the teacher reading, the class at the split, a laugh.
    function makeBubbles(parent) {
      const g = G(parent);
      const glyph = (kind) => kind === 'read'
        ? `<path d="M-30 -6 q10 -10 20 0 t20 0 t20 0 M-30 10 q10 -10 20 0 t20 0" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`
        : kind === 'ha' ? `<path d="M-22 -6 Q0 22 22 -6Z" fill="${C.ink}"/><path d="M-20 -18 q6 -6 12 0 M8 -18 q6 -6 12 0" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>`
          : `<text class="b" x="0" y="15" font-size="44" text-anchor="middle" fill="${kind === '!' ? C.accent : C.ink}">${kind}</text>`;
      const list = [
        { at: [508, 374], t: [35.5, 36.85], kind: 'read', w: 90, tail: -1 },
        { kid: 1, t: [45.0, 48.6], kind: '?' }, { kid: 4, t: [45.35, 48.9], kind: '!' }, { kid: 11, t: [45.6, 48.5], kind: '?' },
        { kid: 15, t: [46.0, 49.0], kind: '!' }, { kid: 7, t: [46.4, 48.9], kind: '?' }, { kid: 18, t: [46.8, 49.1], kind: '?' },
        { kid: 9, t: [50.75, 52.9], kind: 'ha' }, { kid: 13, t: [50.6, 52.6], kind: '!' },
      ];
      const els = list.map((b) => {
        const w = b.w || 62;
        const e = G(g, `<path d="M${-w / 2} -30 Q${-w / 2} -40 ${-w / 2 + 10} -40 H${w / 2 - 10} Q${w / 2} -40 ${w / 2} -30 V24 Q${w / 2} 34 ${w / 2 - 10} 34 H8 L${b.tail === -1 ? 30 : -6} 58 L-6 34 H${-w / 2 + 10} Q${-w / 2} 34 ${-w / 2} 24Z" fill="#fff" stroke="${C.ink}" stroke-width="3.5"/>${glyph(b.kind)}`);
        return { e, b };
      });
      function update(t) {
        for (const { e, b } of els) {
          const p = popIn(t, b.t[0], 0.3) * (1 - seg(t, b.t[1] - 0.2, b.t[1]));
          vis(e, p > 0);
          if (p <= 0) continue;
          let x, y;
          if (b.kid !== undefined) {
            const k = KIDS[b.kid];
            x = k.x + 30 * k.s; y = k.y - 110 * k.s;
            if (k.ans === TX.right && t > PRESS[4]) y -= jumpK((t - PRESS[4] - LAG - 0.25 - k.jitter * 0.3) / 0.62, 4).y * 110;
          } else { x = b.at[0]; y = b.at[1]; }
          tf(e, tr(x, y, Math.max(0.001, p) * (b.kid !== undefined ? KIDS[b.kid].s * 1.35 : 1.2)));
        }
      }
      return { update };
    }

    // ---------------------------------------------------------------- the chat (full frame: the phone's screen)
    let chat;
    function makeChat() {
      const F = mkFrame(svg, 'cq-clip-chat');
      const g = F.inner;
      const X0 = 200, X1 = 1400, FS = 46, LH = 60;
      G(g, `<rect width="${W}" height="${H}" fill="#fff"/>`);
      const conv = G(g);
      // composer (bottom) and top bar drawn over the conversation
      const comp = G(g);
      const top = G(g, `<rect width="${W}" height="78" fill="#fff"/><rect y="77" width="${W}" height="2" fill="#ececec"/>
        <g transform="translate(64 39)"><rect x="-24" y="-24" width="48" height="48" rx="11" fill="#fff" stroke="#d6d6d6" stroke-width="2"/>${T_(0, 9, TX.ai, 27, { cls: 'b', anchor: 'middle' })}</g>
        ${T_(110, 49, TX.aiName, 30, { cls: 'ts', fit: 500 })}`);
      const clsOf = () => ''; // one face for the whole ask; the address stands out by colour and underline (opts)
      // the first ask: typed in the composer, then a bubble
      // the text keeps clear of the send button at the box's right end
      const maxW = X1 - X0 - 36 - 110;
      const w1 = wrap(TX.ask1, FS, maxW, clsOf);
      const w2 = wrap(TX.ask2, FS, maxW, clsOf);
      const typeEnd1 = T.send1 - HOLD1, typeEnd2 = T.send2 - HOLD2;
      T.cps1 = w1.total / (typeEnd1 - T.type1);
      T.cps2 = w2.total / (typeEnd2 - T.type2);
      for (const [k, w] of [['ask1', w1], ['ask2', w2]]) {
        CHECK[k] = { chars: w.total, lines: w.lines.length, cps: k === 'ask1' ? T.cps1 : T.cps2, typed: k === 'ask1' ? T.type1 + w.total / T.cps1 : T.type2 + w.total / T.cps2, send: k === 'ask1' ? T.send1 : T.send2 };
        w.lines.forEach((l, i) => { const lw = lineW(l, FS, clsOf); if (lw > maxW + 0.5) CHECK.overflow.push(`${k} line ${i + 1}: ${Math.round(lw)} > ${maxW}`); });
      }
      const opts = { clsOf, fillOf: (k) => (k === 'addr' ? C.accent : null), underline: (k) => (k === 'addr' ? C.accent : null) };
      // composer box
      const compBox = E('rect', { x: X0, rx: 30, width: X1 - X0, fill: '#fff', stroke: '#d6d6d6', 'stroke-width': 3 }, comp);
      const attach = G(comp, `<g transform="translate(0 0)"><rect x="-3" y="-3" width="96" height="126" rx="12" fill="#6b4a2e"/><image href="${ASSETS.sheet1 || ''}" x="8" y="8" width="80" height="104" preserveAspectRatio="none"/></g>
        <g transform="translate(110 0)"><rect x="-3" y="-3" width="96" height="126" rx="12" fill="#6b4a2e"/><image href="${ASSETS.sheet2 || ''}" x="8" y="8" width="80" height="104" preserveAspectRatio="none"/></g>`);
      const typed1 = drawLines(comp, w1, X0 + 36, 0, FS, LH, opts);
      const typed2 = drawLines(comp, w2, X0 + 36, 0, FS, LH, opts);
      const caret = E('rect', { width: 4, height: FS * 1.1, fill: C.ink }, comp);
      const sendB = G(comp, `<circle r="34" fill="${C.ink}"/><path d="M0 16 V-14 M-13 -2 L0 -15 L13 -2" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`);
      // conversation content, y from 0 (scrolled)
      let y = 110;
      const photos = G(conv, `<g transform="translate(${X1 - 250} ${y})"><rect width="112" height="150" rx="12" fill="#6b4a2e"/><image href="${ASSETS.sheet1 || ''}" x="9" y="9" width="94" height="132" preserveAspectRatio="none"/></g>
        <g transform="translate(${X1 - 128} ${y})"><rect width="112" height="150" rx="12" fill="#6b4a2e"/><image href="${ASSETS.sheet2 || ''}" x="9" y="9" width="94" height="132" preserveAspectRatio="none"/></g>`);
      y += 170;
      const bw1 = Math.max(...w1.lines.map((l) => lineW(l, FS, clsOf))) + 60;
      const b1 = G(conv);
      E('rect', { x: X1 - bw1, y, width: bw1, height: typed1.height + 40, rx: 28, fill: '#f0f0ee' }, b1);
      const sent1 = drawLines(b1, w1, X1 - bw1 + 30, y + 20 + FS * 0.82, FS, LH, opts);
      sent1.show(w1.total);
      y += typed1.height + 40 + 46;
      const ai1 = G(conv, T_(X0, y, TX.status1, 28, { fill: '#8a8a8a', fit: X1 - X0 }));
      y += 36;
      const bars1 = [1080, 1010, 1100, 720, 1040, 860, 600].map((w, i) => E('rect', { x: X0, y: y + 14 + i * 42, width: w, height: 22, rx: 11, fill: '#d9d9d6' }, ai1));
      y += 14 + 7 * 42 + 20;
      // the AI's .zip as a chip, twice: the quiz, then the quiz changed by the second ask; the thumb takes the second
      const zipChip = (yy) => {
        const z = G(conv, `<rect x="${X0}" y="${yy}" width="470" height="104" rx="18" fill="#f4f4f2" stroke="#e0e0dc" stroke-width="2"/>
          <rect x="${X0 + 24}" y="${yy + 22}" width="60" height="60" rx="12" fill="#fff" stroke="#d0d0cc" stroke-width="2"/><path d="M${X0 + 40} ${yy + 40} h28 v28 h-28z M${X0 + 46} ${yy + 40} v28 M${X0 + 52} ${yy + 46} h4 M${X0 + 52} ${yy + 54} h4 M${X0 + 52} ${yy + 62} h4" fill="none" stroke="#6a6a66" stroke-width="3"/>
          ${T_(X0 + 104, yy + 50, TX.zipTitle, 32, { cls: 'ts', fit: 270 })}${T_(X0 + 104, yy + 84, TX.zipSub, 22, { fill: '#8a8a8a', fit: 270 })}
          <g class="zip-ok"><circle cx="${X0 + 420}" cy="${yy + 52}" r="26" fill="${C.good}"/>${icon('check', X0 + 402, yy + 34, 36, '#fff', true)}</g>`);
        const pop = (t, at) => { vis(z, t >= at); if (t >= at) tf(z, `translate(${X0} ${yy + 52}) scale(${popIn(t, at, 0.3).toFixed(3)}) translate(${-X0} ${-(yy + 52)})`); };
        return { g: z, ok: z.querySelector('.zip-ok'), y: yy, pop };
      };
      const zip1 = zipChip(y);
      vis(zip1.ok, false);
      y += 104 + 60;
      const bw2 = Math.max(...w2.lines.map((l) => lineW(l, FS, clsOf))) + 60;
      const b2Y = y;
      const b2 = G(conv);
      E('rect', { x: X1 - bw2, y, width: bw2, height: typed2.height + 40, rx: 28, fill: '#f0f0ee' }, b2);
      drawLines(b2, w2, X1 - bw2 + 30, y + 20 + FS * 0.82, FS, LH, opts).show(w2.total);
      y += typed2.height + 40 + 46;
      const ai2 = G(conv, T_(X0, y, TX.status2, 28, { fill: '#8a8a8a', fit: X1 - X0 }));
      y += 36;
      const bars2 = [980, 1060, 760, 520].map((w, i) => E('rect', { x: X0, y: y + 14 + i * 42, width: w, height: 22, rx: 11, fill: '#d9d9d6' }, ai2));
      y += 14 + 4 * 42 + 20;
      const zip2 = zipChip(y);
      // where the conversation rests at the end: the second .zip just above the composer, empty again (64 + one line high, at the foot)
      const scEnd = Math.max(0, zip2.y + 104 - (880 - 64 - LH - 30));
      // geometry of the composer
      function compose(t) {
        // which ask is in the composer, how much of it is typed
        let w = null, n = 0, typedL = null, lines = 1;
        if (t < T.send1) { w = w1; typedL = typed1; n = Math.floor((t - T.type1) * T.cps1); }
        else if (t >= T.type2 && t < T.send2) { w = w2; typedL = typed2; n = Math.floor((t - T.type2) * T.cps2); }
        n = clamp(n, 0, w ? w.total : 0);
        if (w && n > 0) lines = clamp(typedL.caret(n)[1] / LH + 1, 1, w.lines.length) | 0;
        const att = t >= T.attach && t < T.send1;
        const hgt = 64 + lines * LH + (att ? 140 : 0);
        // a new chat has its box in the middle; once sent, the box sits at the foot
        const foot = eseg(t, T.send1, T.send1 + 0.4);
        const topY = lerp(470 - hgt / 2, 880 - hgt, foot);
        return { w, n, typedL, lines, att, hgt, topY };
      }
      function update(t) {
        const c = compose(t);
        set(compBox, 'y', f1(c.topY)); set(compBox, 'height', f1(c.hgt));
        op(attach, c.att ? popIn(t, T.attach, 0.3) : 0);
        tf(attach, tr(X0 + 30, c.topY + 22));
        const textTop = c.topY + (c.att ? 160 : 22) + FS * 0.85;
        tf(typed1.g, tr(0, textTop)); tf(typed2.g, tr(0, textTop));
        vis(typed1.g, c.typedL === typed1); vis(typed2.g, c.typedL === typed2);
        if (c.typedL) c.typedL.show(c.n);
        const blink = c.typedL && (Math.floor(t * 2.4) % 2 === 0 || (c.n > 0 && c.n < c.w.total));
        vis(caret, !!blink);
        if (c.typedL) { const [cx, cy] = c.typedL.caret(c.n); set(caret, 'x', f1(cx + 3)); set(caret, 'y', f1(textTop + cy - FS * 0.85)); }
        // the address pulses while the ask holds
        const pul = t > typeEnd1 && t < T.send1 ? 0.5 + 0.5 * Math.cos((t - typeEnd1 - 0.125) * 6) : 1;
        typed1.out.forEach((o) => { if (o.ul) set(o.ul, 'height', f1(3 + (1 - pul) * 4)); });
        tf(sendB, tr(X1 - 52, c.topY + c.hgt - 46));
        op(sendB, c.typedL && c.n > 0 ? 1 : 0.25);
        // conversation
        vis(photos, t >= T.send1); vis(b1, t >= T.send1);
        op(b1, seg(t, T.send1, T.send1 + 0.15)); op(photos, seg(t, T.send1, T.send1 + 0.15));
        vis(ai1, t >= T.status1);
        bars1.forEach((b, i) => { const k = seg(t, T.bars1[0] + i * 0.11, T.bars1[0] + i * 0.11 + 0.25); vis(b, k > 0); set(b, 'width', f1(k * +b.getAttribute('data-w') || 0)); });
        zip1.pop(t, T.zip1);
        vis(b2, t >= T.send2); op(b2, seg(t, T.send2, T.send2 + 0.15));
        vis(ai2, t >= T.status2);
        bars2.forEach((b, i) => { const k = seg(t, T.bars2[0] + i * 0.11, T.bars2[0] + i * 0.11 + 0.25); vis(b, k > 0); set(b, 'width', f1(k * +b.getAttribute('data-w') || 0)); });
        zip2.pop(t, T.zip2);
        vis(zip2.ok, t >= T.tapZip + 0.15);
        // scroll: keep the newest thing above the composer
        const bottomOf = (yy) => Math.max(0, yy - (c.topY - 30));
        const sc = keys(t, [
          [T.send1, 0], [T.status1, bottomOf(zip1.y - 40)], [T.zip1, bottomOf(zip1.y - 40)], [T.zip1 + 0.3, bottomOf(zip1.y + 104)],
          [T.type2, bottomOf(zip1.y + 104)], [T.send2 - 0.01, Math.max(0, zip1.y + 104 - (880 - 64 - w2.lines.length * LH - 30))],
          [T.send2 + 0.3, bottomOf(b2Y + typed2.height + 40)], [T.status2, bottomOf(zip2.y - 40)], [T.zip2, bottomOf(zip2.y - 40)], [T.zip2 + 0.3, scEnd],
        ]);
        tf(conv, tr(0, -sc));
        thumb.update(t, [[T.send1, X1 - 52, 470 + compose(T.send1 - 0.01).hgt / 2 - 46], [T.send2, X1 - 52, 834], [T.tapZip, X0 + 240, zip2.y + 52 - scEnd]]);
      }
      [...bars1, ...bars2].forEach((b) => b.setAttribute('data-w', b.getAttribute('width')));
      const thumb = makeThumb(g, 0.9, [210, 470]);
      chat = { F, update };
      // for check(): how much of each ask the composer shows just before its send, and the composer's top then (under the top bar at 78)
      CHECK.typedBefore = () => [[T.send1 - 0.02, typed1, w1], [T.send2 - 0.02, typed2, w2]].map(([at, typed, w]) => { render(at); return { shown: typed.g.textContent.length, of: w.total, top: Math.round(compose(at).topY) }; });
    }

    // ---------------------------------------------------------------- the site on the phone (full frame)
    // The root page's Run box, the OS's file sheet, then the local check (the .zip read in the browser, nothing gone up yet:
    // Solo, Peers and Quizmaster), whose "Open the lobby" puts the quiz up and opens the lobby's check; there "Screen and
    // remote" brings the how-to with the teacher code, which the laptop then types. Both checks are drawn as a laptop-wide
    // window shows them (client/open.ts, client/screen.ts), scaled to the frame; what doesn't fit lies below it.
    let web;
    function makeWeb() {
      const F = mkFrame(svg, 'cq-clip-web');
      const g = F.inner;
      const zoomG = G(g);
      const page = G(zoomG);
      const header = `<rect width="${W}" height="112" fill="${C.paper}"/><rect y="111" width="${W}" height="2" fill="${C.rule}"/><use href="#cq-lockup" x="60" y="24" width="268" height="64" color="${C.ink}"/>`;
      const root = G(page, `<rect width="${W}" height="${H}" fill="${C.paper}"/>${header}
        ${T_(1010, 70, TX.codeLabel, 32, { fill: C.muted, anchor: 'end' })}
        <rect x="1028" y="26" width="270" height="62" rx="14" fill="#fff" stroke="${C.rule}" stroke-width="3"/>${T_(1163, 70, TX.codePh, 38, { cls: 'b', fill: '#72716b', anchor: 'middle' })}
        <rect x="1312" y="26" width="72" height="62" rx="14" fill="${C.ink}"/><path d="M1338 42 L1362 57 L1338 72Z" fill="#fff"/>${T_(1460, 70, TX.lang, 30, { fill: C.muted, anchor: 'middle' })}
        ${T_(260, 230, TX.run, 60, { cls: 'b', fit: 1080 })}
        <rect x="260" y="270" width="1080" height="330" rx="26" fill="none" stroke="#b9b3a7" stroke-width="4" stroke-dasharray="18 12"/>
        <g class="wb-upl"><rect x="330" y="330" width="940" height="120" rx="20" fill="${C.ink}"/>${T_(800, 405, TX.upload, 44, { cls: 'ts', fill: '#fff', anchor: 'middle', fit: 880 })}</g>
        ${T_(800, 530, TX.drop, 36, { fill: C.muted, anchor: 'middle', fit: 1000 })}
        <g class="wb-prog"><rect x="270" y="280" width="1060" height="310" rx="22" fill="${C.paper}"/>${T_(800, 455, TX.reading, 46, { fill: C.muted, anchor: 'middle', fit: 1000 })}</g>`);
      const prog = root.querySelector('.wb-prog');
      // the OS's file sheet: the .zip on top
      const fileRow = (i, name, y) => `<g><rect x="200" y="${y}" width="1200" height="120" rx="18" fill="${i === 0 ? '#eef3ff' : '#fff'}"/>
        <rect x="230" y="${y + 22}" width="76" height="76" rx="14" fill="${i === 0 ? '#e9e9e4' : '#d9cbb7'}"/>${i === 0 ? `<path d="M248 ${y + 40} h40 v40 h-40z M258 ${y + 40} v40 M266 ${y + 48} h6 M266 ${y + 58} h6 M266 ${y + 68} h6" fill="none" stroke="#6a6a66" stroke-width="3.5"/>` : ''}
        ${T_(340, y + 74, name, 42, { cls: i === 0 ? 'ts' : '', fit: 1020 })}</g>`;
      const sheet = G(g, `<rect x="0" y="0" width="${W}" height="${H}" fill="#000" opacity=".35"/><g class="wb-sheet"><rect x="140" y="330" width="1320" height="700" rx="40" fill="#fff"/><rect x="740" y="350" width="120" height="10" rx="5" fill="#ccc"/>
        ${TX.files.map((f, i) => fileRow(i, f, 400 + i * 132)).join('')}</g>`);
      const sheetIn = sheet.querySelector('.wb-sheet');
      const plain = { clsOf: () => '', fillOf: () => null, underline: () => null };
      const titleLine = (y, fit = 1280) => `<text x="160" y="${y}" font-size="52" class="tb" data-fit="${fit}">${esc(TX.title)}<tspan fill="${C.muted}" font-size="36" font-weight="600">${esc(TX.nq)}</tspan></text>`;
      const button = (x, y, w, h, label, size, primary) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${primary ? C.ink : '#fff'}" stroke="${primary ? C.ink : C.rule}" stroke-width="3"/>${T_(x + w / 2, y + h / 2 + size * 0.36, label, size, { cls: 'ts', fill: primary ? '#fff' : C.ink, anchor: 'middle', fit: w - 30 })}`;
      // the local check: three cards side by side, each its name, its line, its button (the first the primary) and its quiet line
      const local = G(page, `<rect width="${W}" height="${H}" fill="${C.paper}"/>${header}${titleLine(196)}${T_(160, 262, TX.playedAsk, 32, { cls: 'b', fit: 1280 })}`);
      const CW = 413, CG = 20, CY = 290, CP = 28;
      const cards = TX.entries.map((e, i) => {
        const x = 160 + i * (CW + CG);
        const cg = G(local);
        const line = wrap([[e.line]], 28, CW - 2 * CP, plain.clsOf);
        const note = wrap([[e.note]], 22, CW - 2 * CP, plain.clsOf);
        const bw = measure(e.button, 30, 'ts') + 64;
        const lineY = CY + 112, btnY = lineY + line.lines.length * 38 - 6, noteY = btnY + 76 + 40;
        return { x, cg, line, note, bw, lineY, btnY, noteY, e, i, bottom: noteY + (note.lines.length - 1) * 30 + 34 };
      });
      const CH = Math.max(...cards.map((c) => c.bottom)) - CY;
      cards.forEach((c) => {
        G(c.cg, `<rect x="${c.x}" y="${CY}" width="${CW}" height="${CH}" rx="22" fill="#fff" stroke="${C.rule}" stroke-width="3"/>${T_(c.x + CP, CY + 62, c.e.name, 40, { cls: 'b', fit: CW - 2 * CP })}
          ${button(c.x + CP, c.btnY, c.bw, 76, c.e.button, 30, c.i === 0)}`);
        drawLines(c.cg, c.line, c.x + CP, c.lineY, 28, 38, plain).show(c.line.total);
        drawLines(c.cg, c.note, c.x + CP, c.noteY, 22, 30, Object.assign({ fill: C.muted }, plain)).show(c.note.total);
      });
      const qm = cards[2], lobbyBtn = [qm.x + CP + qm.bw / 2, qm.btnY + 38];
      // under the cards, out of the frame: the questions, folded ("If you will play it yourself, leave this closed.")
      G(local, `<rect x="160" y="${CY + CH + 30}" width="1280" height="2" fill="${C.rule}"/>`);
      // the lobby's check: the join code small; how the screens are arranged, One screen until this browser knows better;
      // "Screen and remote" brings the how-to with the teacher code, and what follows moves down to make room for it
      const jc = measure(TX.code, 32, 'b') + 8, jl = measure(TX.joinCode.trim(), 30, '') + 12;
      const lobby = G(page, `<rect width="${W}" height="${H}" fill="${C.paper}"/>${titleLine(110, 1280 - jc - jl - 40)}`);
      G(lobby, `${T_(1440 - jc - 12, 110, TX.joinCode.trim(), 30, { fill: C.muted, anchor: 'end' })}${T_(1440, 110, TX.code, 32, { cls: 'b', anchor: 'end', extra: ' letter-spacing="2"' })}
        ${T_(160, 190, TX.arrangeAsk, 30, { cls: 'b', fit: 1280 })}`);
      const TW = 630, TY = 214, TH = 170;
      const toggles = TX.arrange.map((a, i) => {
        const x = 160 + i * (TW + 20);
        const tg = G(lobby);
        const off = E('rect', { x, y: TY, width: TW, height: TH, rx: 18, fill: '#fff', stroke: C.rule, 'stroke-width': 3 }, tg);
        const on = E('rect', { x, y: TY, width: TW, height: TH, rx: 18, fill: '#ededed', stroke: C.ink, 'stroke-width': 4 }, tg);
        G(tg, T_(x + 28, TY + 56, a.name, 32, { cls: 'tb', fit: TW - 56 }));
        const lw = wrap([[a.line]], 26, TW - 56, plain.clsOf);
        drawLines(tg, lw, x + 28, TY + 100, 26, 36, Object.assign({ fill: C.muted }, plain)).show(lw.total);
        return { on, off, c: [x + TW / 2, TY + TH / 2] };
      });
      const howOpts = { clsOf: (k) => (k === 'code' ? 'b' : k === 'bold' ? 'tb' : ''), fillOf: () => null, underline: () => null, fill: C.muted };
      const hw = wrap(TX.howTo, 32, 1280, howOpts.clsOf);
      const HY = TY + TH + 56;
      const howG = G(lobby, `<rect class="wb-hl" rx="12" fill="#f6dcc8"/>`);
      const how = drawLines(howG, hw, 160, HY, 32, 46, howOpts);
      how.show(hw.total);
      // the whole teacher code, both its pieces, on the line where it starts
      const codeOs = how.out.filter((o) => o.p.kind === 'code' && !/^ +$/.test(o.p.text));
      const codeO = { x: codeOs[0].x, li: codeOs[0].li };
      codeO.w = Math.max(...codeOs.filter((o) => o.li === codeO.li).map((o) => o.x + o.w)) - codeO.x;
      const hl = howG.querySelector('.wb-hl');
      set(hl, 'x', f1(codeO.x - 12)); set(hl, 'y', f1(HY + codeO.li * 46 - 34)); set(hl, 'width', f1(codeO.w + 24)); set(hl, 'height', '48');
      const codeC = [codeO.x + codeO.w / 2, HY + codeO.li * 46 - 10];
      const rest = G(lobby);
      const lw = measure(TX.letIn, 34, 'ts') + 90;
      G(rest, `${T_(160, HY, TX.call, 28, { fill: C.muted, fit: 1280 })}${button(1440 - lw, HY + 32, lw, 104, TX.letIn, 34, true)}
        <rect x="160" y="${HY + 170}" width="1280" height="2" fill="${C.rule}"/><path d="M164 ${HY + 208} L184 ${HY + 220} L164 ${HY + 232}Z" fill="${C.ink}"/>${T_(200, HY + 232, TX.fold, 30, { cls: 'tb', fit: 1200 })}
        ${button(1440 - 180, HY + 280, 180, 76, TX.more, 28, false)}`);
      const howH = hw.lines.length * 46 + 16;
      const thumb = makeThumb(g, 0.9, [210, 470]);
      function update(t) {
        // slides in from the right over the chat
        const k = eseg(t, T.web, T.web + 0.35);
        tf(page, tr((1 - k) * W, 0));
        const scr = t < T.local ? 'root' : t < T.lobby ? 'local' : 'lobby';
        vis(root, scr === 'root'); vis(local, scr === 'local'); vis(lobby, scr === 'lobby');
        vis(prog, t >= T.sheetDown[1] && scr === 'root');
        const sk = eseg(t, T.sheetUp[0], T.sheetUp[1]) * (1 - eseg(t, T.sheetDown[0], T.sheetDown[1]));
        op(sheet, sk > 0 ? 1 : 0);
        if (sk > 0) { set(sheet.firstChild, 'opacity', (0.35 * sk).toFixed(2)); tf(sheetIn, tr(0, (1 - sk) * 700)); }
        // the arrangement: One screen, then Screen and remote once tapped, and the how-to with it
        const remote = t >= T.tapRemote + 0.05;
        toggles.forEach((tg, i) => { const pressed = (i === 1) === remote; vis(tg.on, pressed); vis(tg.off, !pressed); });
        vis(howG, remote);
        tf(rest, tr(0, remote ? howH : 0));
        // the teacher code: zoom and pulse
        const z = eseg(t, T.zoomCode[0], T.zoomCode[1]);
        const zs = lerp(1, 1.9, z);
        tf(zoomG, `translate(${f1(lerp(0, 800 - codeC[0] * zs, z))} ${f1(lerp(0, 450 - codeC[1] * zs, z))}) scale(${zs.toFixed(3)})`);
        op(hl, t > T.zoomCode[0] ? 0.55 + 0.45 * Math.sin((t - T.zoomCode[0]) * 7) : 0);
        thumb.update(t, [[T.tapUpload, 1140, 400], [T.tapFile, 1180, 462], [T.tapLobby, lobbyBtn[0], lobbyBtn[1]], [T.tapRemote, toggles[1].c[0], toggles[1].c[1]]]);
      }
      web = { F, update };
    }

    // ---------------------------------------------------------------- over the shoulder (full frame)
    let ots;
    function makeOts() {
      const g = G(svg);
      G(g, `<rect width="${W}" height="${H}" fill="#efe6d8"/><rect y="640" width="${W}" height="300" fill="#d6c2a3"/>
        <rect x="92" y="42" width="916" height="522" rx="4" fill="#c7c1b6"/>`);
      const wallG = G(g, '', { transform: tr(100, 50, 900 / 960) });
      const wall = makeWall(wallG, 'ots');
      // other heads in the room, small, between wall and child
      G(g, `<g fill="#3b2a1e"><circle cx="1130" cy="640" r="44"/><circle cx="1290" cy="660" r="40" fill="#c8913f"/><circle cx="160" cy="650" r="42" fill="#1b1b1b"/></g>
        <path d="M1060 700 Q1130 670 1200 700 L1220 900 L1040 900Z" fill="#7cb518"/><path d="M1225 720 Q1290 690 1355 720 L1370 900 L1210 900Z" fill="#e93d82"/><path d="M90 710 Q160 680 230 710 L250 900 L70 900Z" fill="#8e4ec6"/>`);
      const k = KIDS[13];
      const kidG = G(g);
      kidG.innerHTML = `<path d="M60 760 Q80 700 200 690 L420 690 Q540 700 560 760 L600 960 L20 960Z" fill="${k.top}"/>
        <g class="o-head"><circle cx="310" cy="650" r="128" fill="${k.skin[0]}"/><ellipse cx="438" cy="664" rx="20" ry="34" fill="${k.skin[0]}"/>
        <g fill="${k.hairC}"><circle cx="300" cy="640" r="134"/><ellipse cx="300" cy="790" rx="40" ry="90"/><rect x="270" y="730" width="60" height="26" rx="10" fill="#f5c518"/></g></g>`;
      const head = kidG.querySelector('.o-head');
      const tabG = G(g, '', { transform: `translate(1060 250) rotate(-4) scale(.9)` });
      const tab = makeTablet(tabG, k);
      // the child's finger
      const fin = G(g, `<g class="o-fin"><path d="M-22 0 Q-22 -26 0 -26 Q22 -26 22 0 L30 300 L-36 300Z" fill="${k.skin[0]}" stroke="${k.skin[1]}" stroke-width="4"/><path d="M-12 -16 Q0 -22 12 -16 L12 4 Q0 8 -12 4Z" fill="#f8ddca"/></g>`);
      const finger = fin.querySelector('.o-fin');
      // a comic emphasis (the film's, not the wall's) where that child's avatar lands in the wall's bar
      const slot = answeredOrder().indexOf(k);
      const ax = 100 + (96 + slot * 35 + 15) * 900 / 960, ay = 50 + 30 * 900 / 960;
      const burst = G(g, [0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = (i / 8) * Math.PI * 2; return `<path d="M${f1(ax + 26 * Math.cos(a))} ${f1(ay + 26 * Math.sin(a))} L${f1(ax + 40 * Math.cos(a))} ${f1(ay + 40 * Math.sin(a))}" stroke="${C.accent}" stroke-width="5" stroke-linecap="round"/>`; }).join(''));
      function update(t) {
        const on1 = t > T.ots[0] && t < T.ots[1], on2 = t > T.ots2[0] && t < T.ots2[1];
        op(burst, on1 ? fade(t, k.answer + 0.05, k.answer + 0.9, 0.12) : 0);
        vis(g, on1 || on2);
        if (!(on1 || on2)) return;
        wall.update(t); tab.update(t);
        // finger: comes in, taps red (646 000), goes
        const tp = T.oneTap;
        const off = Math.max(1 - eseg(t, tp - 0.55, tp - 0.05), eseg(t, tp + 0.2, tp + 0.6));
        vis(finger, on1 && off < 0.999);
        // tablet button 0 centre in frame: tablet local (104, 206) -> frame
        const lx = 128, ly = 300, bx = 1060 + 0.9 * (lx * Math.cos(-0.0698) - ly * Math.sin(-0.0698)), by = 250 + 0.9 * (lx * Math.sin(-0.0698) + ly * Math.cos(-0.0698));
        tf(finger, `${tr(bx + off * 420, by + off * 420, t > tp - 0.05 && t < tp + 0.15 ? 0.95 : 1)} rotate(-38)`);
        // the head bobs at the solution
        const j = jumpK((t - PRESS[4] - LAG - 0.25) / 0.62, 4);
        tf(head, tr(0, -j.y * 60));
      }
      ots = { update };
    }

    // ---------------------------------------------------------------- the teacher's press, the same motif every time
    let inset;
    function makeInset() {
      const g = G(svg);
      const tail = E('path', { fill: '#fff', stroke: C.ink, 'stroke-width': 4, 'stroke-linejoin': 'round' }, g);
      const box = G(g, `<rect x="0" y="0" width="420" height="250" rx="30" fill="#1b1b1d" stroke="${C.ink}" stroke-width="4"/>
        <rect x="16" y="16" width="388" height="234" rx="18" fill="${C.paper}"/><rect x="16" y="230" width="388" height="20" fill="${C.paper}"/>
        <use href="#cq-fox" x="36" y="30" width="34" height="34"/><rect x="84" y="40" width="140" height="14" rx="7" fill="#d5cfc4"/>
        <rect class="in-btn" x="36" y="88" width="348" height="104" rx="18" fill="${C.ink}"/><text class="ts in-lab" x="210" y="152" font-size="40" text-anchor="middle" fill="#fff" data-fit="320"></text>
        <rect x="36" y="210" width="220" height="10" rx="5" fill="#d5cfc4"/>`);
      const lab = box.querySelector('.in-lab');
      const thumb = makeThumb(box, 0.55, [110, 290]);
      const X = 26, Y = 624;
      function update(t) {
        let idx = -1;
        PRESS.forEach((p, i) => { if (t > p - 0.7 && t < p + 0.9) idx = i; });
        if (idx < 0) { vis(g, false); return; }
        const p0 = PRESS[idx];
        const k = popIn(t, p0 - 0.7, 0.3) * (1 - seg(t, p0 + 0.62, p0 + 0.9));
        vis(g, k > 0.001);
        if (lab._fit !== TX.presses[idx]) { txt(lab, TX.presses[idx]); fitText(lab); if (lab.getComputedTextLength() > 0) lab._fit = TX.presses[idx]; }
        tf(box, `${tr(X + 210, Y + 125)} scale(${Math.max(0.001, k).toFixed(3)}) translate(-210 -125)`);
        // the tail points at the phone in the teacher's hand, when it is in the frame
        const [fx, fy] = W2F(phoneAt[0], phoneAt[1]);
        const inFrame = worldOn(t) && fx > 0 && fx < W && fy > 0 && fy < H;
        vis(tail, inFrame && k > 0.5);
        // its base on the part of the bubble's top nearest the phone
        const bx = clamp(fx - 140, X + 95, X + 325);
        if (inFrame) set(tail, 'd', `M${f1(bx - 55)} ${Y + 4} L${f1(fx)} ${f1(fy + 30)} L${f1(bx + 55)} ${Y + 4}Z`);
        thumb.update(t, [[p0, 210, 140]]);
      }
      inset = { update };
    }


    // ---------------------------------------------------------------- end card
    let endc;
    function makeEnd() {
      const g = G(svg, `<rect width="${W}" height="${H}" fill="${C.paper}"/><use href="#cq-fox" x="640" y="150" width="320" height="320"/>
        ${T_(800, 620, TX.addr, 96, { cls: 'b', anchor: 'middle', fit: 1400 })}`);
      const ulw = Math.min(measure(TX.addr, 96, 'b'), 1400); // under the address as fitted (an own copy's may be longer)
      E('rect', { x: f1(800 - ulw / 2), y: 642, width: f1(ulw), height: 7, fill: C.accent }, g);
      endc = { update: (t) => op(g, seg(t, T.end[0], T.end[1])) };
    }

    // ---------------------------------------------------------------- camera and layers
    // The room from "Let everyone in" on: the wall, the class and the teacher; the mug and the sheets may leave the frame (owner).
    const ROOM = [850, 455, 1.06], SPLIT = [840, 425, 1.15];
    // The room opens with a cut from the laptop's screen to the teacher beside it, and holds: the one press that follows
    // ("Let everyone in") should be the only thing moving (the zoom out from the screen was the same swoop as above).
    const CAM = [
      [T.cut, [431, 537, 2.3]], [29.1, [431, 537, 2.3]], [30.4, ROOM],
      [44.3, ROOM], [45.6, SPLIT], [49.6, SPLIT], [50.3, ROOM],
      [54.6, ROOM], [55.4, [SCREEN.x + SCREEN.w / 2, SCREEN.y + SCREEN.w * 9 / 32, W / SCREEN.w]],
    ];
    function layers(t) {
      cam = keys(t, CAM, [false, false, true]);
      tf(world, `translate(800 450) scale(${cam[2].toFixed(4)}) translate(${f1(-cam[0])} ${f1(-cam[1])})`);
      vis(world, worldOn(t));
      ocam = keys(t, OCAM, [false, false, true]);
      tf(opening.cg, `translate(800 450) scale(${ocam[2].toFixed(4)}) translate(${f1(-ocam[0])} ${f1(-ocam[1])})`);
      vis(opening.g, openingOn(t));
      if (openingOn(t)) opening.update(t);
      // the phone's screen in the frame (for the chat to grow out of and shrink back into)
      const [ppx, ppy] = opening.phonePos(t);
      const [sx0, sy0] = O2F(ppx + (14 - 150) * PO.s, ppy + (22 - 300) * PO.s);
      const sw = 272 * PO.s * ocam[2], sh = 556 * PO.s * ocam[2];
      const ex = eseg(t, T.expand[0], T.expand[1]);
      const chatOn = t > T.expand[0] && t < T.web + 0.4;
      vis(chat.F.g, chatOn);
      if (chatOn) {
        clipTo(chat.F, ex, sx0, sy0, sw, sh);
        chat.update(t);
      }
      const webOn = t > T.web && t < T.shrink[1];
      vis(web.F.g, webOn);
      if (webOn) {
        clipTo(web.F, 1 - eseg(t, T.shrink[0], T.shrink[1]), sx0, sy0, sw, sh);
        web.update(t);
      }
    }
    function clipTo(F, k, x, y, w, h) {
      set(F.clip, 'x', f1(lerp(x, 0, k))); set(F.clip, 'y', f1(lerp(y, 0, k)));
      set(F.clip, 'width', f1(lerp(w, W, k))); set(F.clip, 'height', f1(lerp(h, H, k)));
      set(F.clip, 'rx', f1(lerp(28 * PO.s * ocam[2], 0, k)));
      const s = lerp(h / H, 1, k);
      const cx = x + w / 2, cy = y + h / 2;
      tf(F.inner, k >= 1 ? 'translate(0 0)' : `translate(${f1(lerp(cx - 800 * s, 0, k))} ${f1(lerp(cy - 450 * s, 0, k))}) scale(${s.toFixed(4)})`);
    }

    function render(t) {
      t = clamp(t, 0, DUR);
      counts.fill(0);
      KIDS.forEach((k) => { counts[k.ans]++; });
      layers(t);
      for (const f of updaters) f(t);
      ots.update(t);
      inset.update(t);
      endc.update(t);
    }

    // ---------------------------------------------------------------- player
    /* Two hosts. In the artifact #cqfilm is empty and the film builds its whole player.
       On the site the page already holds the film's place (until this script runs, or if it never does): .cqf-film, holding
       .cqf-stage with the poster frame as a picture, ▶ and a hidden replay, and .cqf-bar: play, the time bar, the clock, the
       speed and a hidden full screen button (client/film-poster.ts makes the bar work before this script is there: the
       speed, and a move of the time bar, which loads it). All named in the page's language. The film takes these over, paints
       the poster frame over the picture, drops the picture, and plays from the start (data-start empty) or shows the moment
       the time bar was moved to (data-start "seek"). If the picture can't be drawn, the page keeps what it had and data-film
       says "failed" (client/film-poster.ts then builds it again on the next press). destroy() gives the page back as it was
       before the press, the picture in its place: a language switch does that (client/film-poster.ts). */
    const chapterOf = (x) => { let c = TX.chapters[0]; for (const k of TX.chapters) if (x >= k[1]) c = k; return c; };
    const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3 L21 12 L6 21Z" fill="currentColor"/></svg>';
    const ICON_FULL = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path class="in" d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/><path class="out" d="M9 4v5H4M15 4v5h5M20 15h-5v5M4 15h5v5"/></svg>';
    const fmt = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
    function build(host) {
      let stage = host.querySelector('.cqf-stage');
      const adopt = !!stage;
      let big, bar, again, full;
      if (!adopt) {
        // the page's markup (index.html), named from TX
        host.innerHTML = '';
        const wrapEl = document.createElement('div'); wrapEl.className = 'cqf';
        const left = document.createElement('div'); left.className = 'cqf-film';
        stage = document.createElement('div'); stage.className = 'cqf-stage';
        stage.setAttribute('role', 'group'); stage.setAttribute('aria-label', TX.ui.film);
        big = document.createElement('button'); big.type = 'button'; big.className = 'cqf-big'; big.setAttribute('aria-label', TX.ui.play);
        big.innerHTML = ICON_PLAY;
        stage.appendChild(big);
        left.appendChild(stage);
        bar = document.createElement('div'); bar.className = 'cqf-bar';
        bar.innerHTML = `<button class="cqf-play" type="button">▶</button><span class="cqf-seek"><input type="range" min="0" max="${DUR}" step="0.1" value="0"></span>`
          + `<span class="cqf-time">0:00<span class="cqf-dur"> / ${fmt(DUR)}</span></span><button class="cqf-speed" type="button" data-rate="1">1×</button>`
          + `<button class="cqf-full" type="button" aria-pressed="false" hidden>${ICON_FULL}</button>`;
        bar.querySelector('.cqf-play').setAttribute('aria-label', TX.ui.play);
        bar.querySelector('input').setAttribute('aria-label', TX.ui.seek);
        bar.querySelector('.cqf-speed').setAttribute('aria-label', TX.ui.speed);
        bar.querySelector('.cqf-full').setAttribute('aria-label', TX.ui.full);
        left.appendChild(bar);
        wrapEl.appendChild(left);
        host.appendChild(wrapEl);
      } else {
        big = stage.querySelector('.cqf-big');
        again = stage.querySelector('.cqf-again');
        bar = host.querySelector('.cqf-bar');
      }
      full = bar.querySelector('.cqf-full');
      if (!again) { again = document.createElement('button'); again.type = 'button'; again.className = 'cqf-again'; again.setAttribute('aria-label', TX.ui.again); again.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 3.5v4h4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'; again.hidden = true; stage.appendChild(again); }
      const poster = adopt ? stage.querySelector(':scope > img') : null;

      // the picture first, whole, before anything of the page changes (measuring needs it in the document, under the poster picture)
      try {
        if (adopt) siteAddress(location.host || DEMO);
        makeClass();
        // its accessible name is English; the words drawn in it are in TX's language, the site's own screens English
        svg = E('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', lang: 'en', 'aria-label': 'classyQuiz: from your sheets to the class, a film without sound' });
        stage.insertBefore(svg, stage.firstChild);
        meas = E('text', { x: -9999, y: -9999, visibility: 'hidden' }, svg);
        meas.setAttributeNS(XMLNS, 'xml:space', 'preserve');
        defs();
        makeWorld();
        makeOpening();
        makeChat();
        makeWeb();
        makeOts();
        makeInset();
        makeEnd();
        svg.querySelectorAll('[data-fit]').forEach(fitText);
        render(POSTER);
      } catch (err) {
        if (svg) svg.remove();
        host.dataset.film = 'failed';
        console.error('classyQuiz film:', err);
        return null;
      }

      // the player: the stage takes focus for the keys; the bar is the page's (index.html), or built above for the artifact
      stage.tabIndex = 0;
      stage.setAttribute('aria-keyshortcuts', 'Space ArrowLeft ArrowRight');
      const pb = bar.querySelector('.cqf-play'), range = bar.querySelector('input[type=range]'), time = bar.querySelector('.cqf-time');
      const sp = bar.querySelector('.cqf-speed'), seekBox = bar.querySelector('.cqf-seek');
      const movedTo = +range.value; // where the bar was moved before this script was there (data-start 'seek'); the first paint sets it to 0
      const clockNode = time.firstChild, labels = { play: pb.getAttribute('aria-label'), clock: fmt(0) };
      full.hidden = false;
      /* The chapters' starts as ticks on the time bar, and the chapter's name over the thumb while it is moved by hand. Both are
         placed as the browser places the thumb's centre: half a thumb in from either end (--thumb, index.html). */
      const marks = document.createElement('span'); marks.className = 'cqf-marks'; marks.setAttribute('aria-hidden', 'true');
      for (const [, at] of TX.chapters) { if (!at) continue; const i = document.createElement('i'); i.style.setProperty('--at', at / DUR); marks.appendChild(i); }
      const tip = document.createElement('span'); tip.className = 'cqf-tip'; tip.setAttribute('aria-hidden', 'true'); tip.hidden = true;
      seekBox.append(marks, tip);

      let t = POSTER, playing = false, last = 0, started = false, raf = 0, pend = 0, held = false, tipOff = 0;
      // the speed is the button's (client/film-poster.ts sets it on the site, before and after this script; the artifact's below)
      const rate = () => +sp.dataset.rate || 1;
      /** A button that hides takes its focus to the bar's play/pause, not to the page. */
      const showBtn = (b, show) => { if (b.hidden === !show) return; const had = document.activeElement === b; b.hidden = !show; if (!show && had) pb.focus({ preventScroll: true }); };
      function showTip(on) {
        clearTimeout(tipOff);
        tip.hidden = !on;
        if (!on) return;
        const name = chapterOf(t)[0];
        if (tip.textContent !== name) tip.textContent = name;
        // over the thumb, but inside the bar's width
        const w = seekBox.clientWidth, th = parseFloat(getComputedStyle(seekBox).getPropertyValue('--thumb')) || 16, tw = tip.offsetWidth;
        const x = th / 2 + (w - th) * (t / DUR);
        tip.style.left = `${clamp(x - tw / 2, 0, Math.max(0, w - tw))}px`;
      }
      function paint() {
        render(t);
        // before the first start the bar stands at 0, where ▶ starts, though the picture is the poster frame
        const at = started ? t : 0;
        if (!held) range.value = at.toFixed(1);
        const clock = fmt(at);
        if (clockNode.nodeValue !== clock) { clockNode.nodeValue = clock; }
        const vt = `${clock}, ${chapterOf(at)[0]}`;
        if (range.getAttribute('aria-valuetext') !== vt) range.setAttribute('aria-valuetext', vt);
        if (!tip.hidden) showTip(true);
        const label = playing ? TX.ui.pause : labels.play;
        if (pb.getAttribute('aria-label') !== label) { pb.textContent = playing ? '❚❚' : '▶'; pb.setAttribute('aria-label', label); }
        // ▶ on the stage goes for good once the film has started; Play again stands on the end card once it has played to the end
        showBtn(big, !(playing || started));
        showBtn(again, !playing && t >= DUR);
      }
      function frame(now) {
        raf = 0;
        if (!playing) return;
        // at most a tenth of a second a frame: after a stall the film goes on from where it was, not further on
        t += clamp((now - last) / 1000, 0, 0.1) * rate(); last = now;
        if (t >= DUR) { t = DUR; playing = false; }
        paint();
        if (playing) raf = requestAnimationFrame(frame);
      }
      function play() {
        if (t >= DUR) t = 0;
        if (!started) { started = true; if (t === POSTER) t = 0; }
        playing = true;
        // one loop: a press while it plays only moves t
        if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
        paint();
      }
      function pause() { playing = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } paint(); }
      function seek(x) { started = true; t = clamp(x, 0, DUR); paint(); }
      /** The time bar moved by hand: the film follows at most once a frame, so a drag on a slow device skips frames instead of lagging. */
      function seekSoon(x) {
        started = true; t = clamp(x, 0, DUR);
        if (playing) pause();
        if (!pend) pend = requestAnimationFrame(() => { pend = 0; paint(); });
      }
      // every listener on the page's elements and the document goes with destroy()
      const ac = new AbortController(), own = { signal: ac.signal };
      big.addEventListener('click', () => { t = 0; play(); }, own);
      again.addEventListener('click', () => { t = 0; play(); }, own);
      pb.addEventListener('click', () => (playing ? pause() : play()), own);
      // held: also a press that began before this script was there (it loads on the bar's first move)
      range.addEventListener('input', () => { if (!held && range.matches(':active')) held = true; seekSoon(+range.value); if (held) showTip(true); }, own);
      range.addEventListener('pointerdown', () => { held = true; showTip(true); }, own);
      const letGo = () => { if (!held) return; held = false; showTip(false); };
      document.addEventListener('pointerup', letGo, own);
      document.addEventListener('pointercancel', letGo, own);
      range.addEventListener('blur', () => showTip(false), own);
      if (!adopt) sp.addEventListener('click', () => { const r = { 1: 0.5, 0.5: 0.25, 0.25: 1 }[rate()] || 1; sp.dataset.rate = r; sp.textContent = { 1: '1×', 0.5: '½×', 0.25: '¼×' }[r]; }, own);
      stage.addEventListener('click', (e) => { if (big.contains(e.target) || again.contains(e.target)) return; if (started) playing ? pause() : play(); }, own);

      /* Full screen, for watching the film big where the page shows it small (a phone, upright or sideways): the film's column, the
         picture and its bar, fills the screen (.cqf-fs; the page's CSS letterboxes it). The browser's full screen where it has one for
         an element; where it hasn't (iPhone Safari) or refuses, the same column fixed over the viewport, the page under it held still.
         The button again, or Esc, ends it, and the page is where it was. Inside, the film's keys work as on the page: it starts on the
         stage, and Tab goes round the player's own controls. */
      const col = stage.parentNode;
      let fs = '', saved = null; // '', 'api' (the browser's) or 'css' (fixed over the viewport); the page's scroll before it
      function fsOn(mode) {
        fs = mode;
        col.classList.add('cqf-fs');
        full.setAttribute('aria-pressed', 'true');
        if (document.activeElement === full || !col.contains(document.activeElement)) stage.focus({ preventScroll: true });
      }
      function fsOff() {
        if (!fs) return;
        const had = col.contains(document.activeElement);
        fs = '';
        col.classList.remove('cqf-fs');
        full.setAttribute('aria-pressed', 'false');
        if (saved) { scrollTo(saved[0], saved[1]); saved = null; }
        if (had) full.focus({ preventScroll: true });
      }
      function fsEnter() {
        saved = [scrollX, scrollY];
        if (!(document.fullscreenEnabled && col.requestFullscreen)) { fsOn('css'); return; }
        const p = col.requestFullscreen();
        if (p && p.catch) p.catch(() => { if (!fs) fsOn('css'); });
      }
      function fsExit() {
        if (fs === 'api' && document.fullscreenElement) document.exitFullscreen().catch(() => fsOff());
        else fsOff();
      }
      full.addEventListener('click', () => (fs ? fsExit() : fsEnter()), own);
      document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement === col) fsOn('api');
        else if (fs === 'api') fsOff();
      }, own);
      document.addEventListener('keydown', (e) => {
        if (fs !== 'css' || e.key !== 'Escape' || e.defaultPrevented) return;
        e.preventDefault();
        fsExit();
      }, own);
      // a focus that lands outside the column (a click on the page's header behind it, a screen reader's move) goes back to the stage
      document.addEventListener('focusin', (e) => { if (fs && !col.contains(e.target)) stage.focus({ preventScroll: true }); }, own);
      col.addEventListener('keydown', (e) => {
        if (!fs || e.key !== 'Tab' || e.ctrlKey || e.altKey || e.metaKey) return;
        const ring = [stage, ...col.querySelectorAll('button, input')].filter((el) => !el.closest('[hidden]'));
        const i = ring.indexOf(document.activeElement), end = e.shiftKey ? 0 : ring.length - 1;
        if (i !== end && i !== -1) return;
        e.preventDefault();
        ring[e.shiftKey ? ring.length - 1 : 0].focus();
      }, own);

      // Keys from inside the player only: the page's own (Space scrolling it, a tab's keys, typing a code) stay the page's.
      // Space plays or pauses where it means nothing else: on the stage and on the time bar. The arrows move a second (with Shift a tenth)
      // on the stage, the bar's buttons and the time bar, there in place of its own steps.
      host.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.altKey || e.metaKey || e.defaultPrevented) return;
        const el = e.target, mine = el === stage || el === range;
        if (e.key === ' ') {
          if (!mine) return;
          e.preventDefault();
          if (playing) pause(); else play();
          return;
        }
        const dir = e.key === 'ArrowRight' || (el === range && e.key === 'ArrowUp') ? 1 : e.key === 'ArrowLeft' || (el === range && e.key === 'ArrowDown') ? -1 : 0;
        if (!dir || !(mine || el === pb || el === sp)) return;
        e.preventDefault();
        pause(); seek(t + dir * (e.shiftKey ? 0.1 : 1));
        // on the time bar the chapter's name shows for a moment, as while it is dragged
        if (el === range) { showTip(true); tipOff = setTimeout(() => showTip(false), 1200); }
      }, own);
      // It never plays unseen: a hidden tab or the film scrolled out of view pauses it, and it waits for a press to go on.
      document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause(); }, own);
      const io = window.IntersectionObserver ? new IntersectionObserver((es) => { if (!es[es.length - 1].isIntersecting && playing) pause(); }) : null;
      if (io) io.observe(stage);
      paint();
      if (poster) {
        // the live film now shows the same frame as the picture; the picture goes in the same task, so no frame shows neither
        poster.remove();
        host.dataset.film = 'on';
        // data-start: "seek" for the time bar moved before this script was there (that moment, paused), else empty for ▶
        if (host.dataset.start === 'seek') seek(movedTo);
        else if (host.dataset.start !== undefined) { t = 0; play(); }
      }
      /** The page as it was before the first press: out of full screen, the picture back in its place, ▶ on it, the bar at 0 with
          its full screen button hidden, no listener left. */
      function destroy() {
        if (fs === 'api' && document.fullscreenElement === col) document.exitFullscreen().catch(() => {});
        fsOff();
        playing = false;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        if (pend) { cancelAnimationFrame(pend); pend = 0; }
        clearTimeout(tipOff);
        ac.abort();
        if (io) io.disconnect();
        if (!adopt) { host.innerHTML = ''; return; }
        const lost = document.activeElement === stage || document.activeElement === again;
        svg.remove();
        marks.remove(); tip.remove();
        full.hidden = true;
        range.value = 0; range.setAttribute('aria-valuetext', labels.clock); clockNode.nodeValue = labels.clock;
        pb.textContent = '▶'; pb.setAttribute('aria-label', labels.play);
        stage.removeAttribute('tabindex'); stage.removeAttribute('aria-keyshortcuts');
        big.hidden = false; again.hidden = true;
        if (poster) stage.insertBefore(poster, stage.firstChild);
        delete host.dataset.film; delete host.dataset.start;
        if (window.cqFilm === api) delete window.cqFilm;
        if (lost) big.focus({ preventScroll: true });
      }
      // for checking: render any moment directly; what the build measured (check())
      const api = {
        render: (x) => { pause(); started = true; t = x; paint(); }, duration: DUR, poster: POSTER, lang,
        check: () => ({
          lang, draft: CONTENT[lang].draft, ask1: CHECK.ask1, ask2: CHECK.ask2, overflow: CHECK.overflow.slice(), kids: KIDS.length, avatars: AVATARS.length,
          typedBefore: (() => { const r = CHECK.typedBefore(); paint(); return r; })(),
          // each fitted text and how far it is shrunk to stay in its box (1: not at all)
          fits: [...svg.querySelectorAll('[data-fit]')].map((el) => ({ text: el.textContent, k: Math.min(1, +el.getAttribute('data-fit') / (el.getComputedTextLength() || 1)) })).filter((x) => x.text && x.k < 1),
        }),
      };
      window.cqFilm = api;
      return { destroy };
    }

    return build(host);
  }

  // ---------------------------------------------------------------- the page
  let live = null, gen = 0;
  /** Builds the film into #cqfilm in the language around it, once the faces are in (measuring needs them). */
  function start() {
    const host = document.getElementById('cqfilm');
    if (!host || live) return;
    const my = ++gen;
    const ready = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('700 40px Rubik'), document.fonts.ready]) : Promise.resolve();
    ready.catch(() => {}).then(() => {
      if (my !== gen || live) return;
      try { live = film(host, langOf(host)); } catch (err) { host.dataset.film = 'failed'; console.error('classyQuiz film:', err); }
    });
  }
  /** Back to the poster picture with nothing of the film left; the next start() builds it anew, in the language around it then. */
  function reset() {
    gen++;
    if (live) { live.destroy(); live = null; }
  }
  // the page's handle (client/film-poster.ts): build again after a reset or a failed draw, and reset on a language switch
  window.classyQuizFilm = { start, reset };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
