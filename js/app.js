/* Boda Alina & Diego — lógica de la invitación */
const B = window.BODA, INV = window.INVITADOS || {};
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Invitado (?i=clave o #clave) ---------- */
const clave = (new URLSearchParams(location.search).get('i') || location.hash.replace('#','') || '').toLowerCase().trim();
const invitado = INV[clave] || null;
if (invitado) {
  $('guestTitle').textContent = invitado.titulo;
  $('guestNames').innerHTML = invitado.personas.map(p => `<li>${esc(p)}</li>`).join('');
  $('coverFor').textContent = 'Invitación para';
  $('coverNames').textContent = invitado.titulo;
  document.title = `Boda de Alina & Diego · ${invitado.titulo}`;
} else {
  $('coverNames').hidden = true;
}

/* ---------- Datos fijos ---------- */
const C = B.ceremonia, R = B.celebracion;
$('igName').textContent = C.nombre; $('igPlace').textContent = C.lugar; $('igTime').textContent = C.hora; $('igAddr').textContent = C.direccion;
$('igMaps').href = C.maps; $('igWaze').href = C.waze;
$('rcName').textContent = R.nombre; $('rcPlace').textContent = R.lugar; $('rcTime').textContent = R.hora; $('rcAddr').textContent = R.direccion;
$('rcMaps').href = R.maps; $('rcWaze').href = R.waze;
$('deadline').textContent = B.fechaLimite; $('idxDeadline').textContent = B.fechaLimite;
$('adultsNote').hidden = !B.soloAdultos;

if (B.mostrarPrograma) {
  $('programa').hidden = false;
  $('timeline').innerHTML = B.programa.map(([t,e,s]) =>
    `<li><span class="t">${esc(t)}</span><span class="dot"></span><span class="e"><b>${esc(e)}</b>${s?`<small>${esc(s)}</small>`:''}</span></li>`).join('');
}

const DC = B.dressCode;
$('dcTitle').textContent = DC.titulo; $('dcSub').textContent = DC.sub || ''; $('dcSub').hidden = !DC.sub; $('dcNota').textContent = DC.nota || '';
$('dcDamas').innerHTML = DC.damas.map(x => `<li>${esc(x)}</li>`).join('');
$('dcCaballeros').innerHTML = DC.caballeros.map(x => `<li>${esc(x)}</li>`).join('');
$('regalosTexto').textContent = B.regalosTexto;
$('dcEvitar').innerHTML = DC.evitar.map(([n,c]) => `<div class="sw no"><i style="background:${c}"></i>${esc(n)}</div>`).join('');
$('pinBtn').href = DC.pinterest;

const cuentas = [...B.cuentas.map(c => ({...c, label: `${c.banco} · ${c.tipo}`}))];
if (B.sinpe) cuentas.push({label:'SINPE Móvil', numero:B.sinpe.numero, titular:B.sinpe.titular});
$('accts').innerHTML = cuentas.map((c,i) =>
  `<div class="acct"><span class="bank">${esc(c.label)}</span><span class="num" id="num${i}">${esc(c.numero)}</span><span class="own">${esc(c.titular)}</span><button class="copy" type="button" data-i="${i}">Copiar</button></div>`).join('');
$('accts').addEventListener('click', async e => {
  const b = e.target.closest('.copy'); if (!b) return;
  const txt = cuentas[b.dataset.i].numero.replace(/\s/g,'');
  try { await navigator.clipboard.writeText(txt); b.textContent = 'Copiado'; b.classList.add('ok'); }
  catch { const r = document.createRange(); r.selectNodeContents($('num'+b.dataset.i)); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selecciona'; }
  setTimeout(() => { b.textContent = 'Copiar'; b.classList.remove('ok'); }, 2200);
});

/* ---------- Calendario (Google + .ics con todos los detalles) ---------- */
const EVENTO = {
  titulo: 'Boda de Alina & Diego',
  desc: `Ceremonia: ${C.nombre}, ${C.lugar} · ${C.hora}\nCelebración: ${R.nombre}, ${R.lugar} · ${R.hora}\nCódigo de vestimenta: ${B.dressCode.titulo}\n\nInvitación: ${location.origin}${location.pathname}${clave ? '?i='+clave : ''}`,
  lugar: `${C.nombre}, ${C.direccion}, ${C.lugar}, Costa Rica`
};
(function(){
  const f = d => new Date(d).toISOString().replace(/[-:]|\.\d{3}/g,'');
  const u = new URL('https://calendar.google.com/calendar/render');
  u.searchParams.set('action','TEMPLATE'); u.searchParams.set('text', EVENTO.titulo);
  u.searchParams.set('dates', f(B.fechaISO)+'/'+f(B.finISO));
  u.searchParams.set('details', EVENTO.desc); u.searchParams.set('location', EVENTO.lugar);
  $('calGoogle').href = u.toString();
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Alina y Diego//Boda//ES','CALSCALE:GREGORIAN','BEGIN:VEVENT',
    'UID:boda-alina-diego-2026@invitacion', 'DTSTAMP:'+f(Date.now()), 'DTSTART:'+f(B.fechaISO), 'DTEND:'+f(B.finISO),
    'SUMMARY:'+EVENTO.titulo, 'DESCRIPTION:'+EVENTO.desc.replace(/\n/g,'\\n'), 'LOCATION:'+EVENTO.lugar.replace(/,/g,'\\,'),
    'GEO:9.9784079;-84.3798189', 'URL:'+C.maps, 'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:Mañana es la boda de Alina y Diego','END:VALARM',
    'END:VEVENT','END:VCALENDAR'].join('\r\n');
  try { $('calIcs').href = URL.createObjectURL(new Blob([ics], {type:'text/calendar;charset=utf-8'})); } catch { $('calIcs').hidden = true; }
  const fecha = new Date(B.fechaISO).toLocaleDateString('es-CR', {weekday:'long', day:'numeric', month:'long', year:'numeric', timeZone:'America/Costa_Rica'});
  $('calDetail').textContent = `${fecha.charAt(0).toUpperCase()+fecha.slice(1)} · ${C.hora} en ${C.nombre} · ${R.hora} en ${R.nombre}`;
})();

/* ---------- Cuenta regresiva ---------- */
(function(){
  const target = new Date(B.fechaISO).getTime();
  const pad = n => String(n).padStart(2,'0');
  const set = (id, v) => { const el = $(id); if (el.textContent !== String(v)) { el.textContent = v; if (!reduced) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); } } };
  function tick(){
    let d = Math.max(0, target - Date.now());
    const days = Math.floor(d/864e5); d -= days*864e5;
    const h = Math.floor(d/36e5); d -= h*36e5;
    const m = Math.floor(d/6e4); d -= m*6e4;
    set('cd', days); set('ch', pad(h)); set('cm', pad(m)); set('cs', pad(Math.floor(d/1e3)));
  }
  tick(); setInterval(tick, 1000);
})();

/* ---------- Motion: reveal + parallax + pétalos ---------- */
if ('IntersectionObserver' in window && !reduced) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.12, rootMargin:'0px 0px -6% 0px'});
  document.querySelectorAll('.reveal, .photo').forEach(el => io.observe(el));
} else document.documentElement.classList.add('no-io');

if (!reduced) {
  const ph = [...document.querySelectorAll('.parallax img')];
  let raf = 0;
  const upd = () => { raf = 0; const vh = innerHeight; ph.forEach(img => { const r = img.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return; const p = (r.top + r.height/2 - vh/2) / vh; img.style.setProperty('--py', (p * -28).toFixed(1) + 'px'); }); };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, {passive:true}); upd();
}

(function petals(){
  if (reduced) return;
  const cv = $('petals'), ctx = cv.getContext('2d'); let W, H, P = [], run = true;
  const size = () => { W = cv.width = innerWidth * devicePixelRatio; H = cv.height = innerHeight * devicePixelRatio; };
  size(); addEventListener('resize', size);
  for (let i = 0; i < 26; i++) P.push({x:Math.random(), y:Math.random(), r:(4+Math.random()*7)*devicePixelRatio, s:.00025+Math.random()*.0004, a:Math.random()*6.28, w:.6+Math.random()*.8, o:.25+Math.random()*.35});
  function draw(){
    if (!run) return; ctx.clearRect(0,0,W,H);
    for (const p of P) {
      p.y += p.s; p.a += .01*p.w; p.x += Math.sin(p.a)*.0006; if (p.y > 1.05) { p.y = -.05; p.x = Math.random(); }
      ctx.save(); ctx.translate(p.x*W, p.y*H); ctx.rotate(p.a); ctx.globalAlpha = p.o;
      ctx.fillStyle = '#c9c7a7'; ctx.beginPath(); ctx.ellipse(0,0,p.r,p.r*.55,0,0,6.28); ctx.fill(); ctx.restore();
    }
    requestAnimationFrame(draw);
  }
  draw(); $('openBtn').addEventListener('click', () => setTimeout(() => run = false, 1200));
})();

/* ---------- Botón flotante "Confirmar asistencia" ---------- */
(function(){
  const pill = $('rsvpPill'), hero = document.querySelector('.hero'), sec = $('confirmar');
  if (!('IntersectionObserver' in window)) return;
  let pastHero = false, secVisible = false;
  const paint = () => { let answered = false; try { answered = !!JSON.parse(localStorage.getItem('rsvp:' + (clave || 'anon')) || 'null'); } catch {} pill.hidden = !(pastHero && !secVisible && !answered); };
  new IntersectionObserver(es => { pastHero = !es[0].isIntersecting; paint(); }, {threshold:.05}).observe(hero);
  new IntersectionObserver(es => { secVisible = es[0].isIntersecting; paint(); }, {threshold:.05}).observe(sec);
  document.addEventListener('rsvp:done', () => { pill.hidden = true; });
})();

/* ---------- Progreso de lectura ---------- */
(function(){ const bar = $('progress'); let raf = 0; const upd = () => { raf = 0; const h = document.documentElement; const max = h.scrollHeight - h.clientHeight; bar.style.setProperty('--p', max > 0 ? (h.scrollTop / max).toFixed(4) : 0); }; addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, {passive:true}); upd(); })();

/* ---------- Música (audio real: funciona con el switch de silencio del iPhone) ---------- */
const bgm = $('bgm'); bgm.volume = 0;
let fadeTimer = 0;
function fadeTo(v, ms, then){ clearInterval(fadeTimer); const step = (v - bgm.volume) / (ms/50); fadeTimer = setInterval(() => { let nv = bgm.volume + step; if ((step > 0 && nv >= v) || (step < 0 && nv <= v)) { nv = v; clearInterval(fadeTimer); then && then(); } bgm.volume = Math.max(0, Math.min(1, nv)); }, 50); }
function paintMusic(){ const on = !bgm.paused; $('musicBtn').classList.toggle('on', on); $('musicBtn').setAttribute('aria-pressed', on); $('musicTxt').textContent = on ? 'Sonando' : 'Música'; }
async function playMusic(){ try { await bgm.play(); fadeTo(.32, 3500); } catch(e) { /* el navegador bloqueó el autoplay: el botón flotante queda disponible */ } paintMusic(); }
function stopMusic(){ quiereMusica = false; fadeTo(0, 800, () => { bgm.pause(); paintMusic(); }); paintMusic(); setTimeout(paintMusic, 850); }
$('musicBtn').addEventListener('click', () => bgm.paused ? playMusic() : stopMusic());
bgm.addEventListener('play', paintMusic); bgm.addEventListener('pause', paintMusic);
// Al salir a Maps/Waze o a otra app el sistema pausa el audio; al volver, lo retomamos.
let quiereMusica = false;
bgm.addEventListener('play', () => { quiereMusica = true; });
$('musicBtn').addEventListener('click', () => { if (!bgm.paused) quiereMusica = false; }, true);
function reanudar(){
  if (!quiereMusica || !bgm.paused) return;
  bgm.play().then(() => { bgm.volume = Math.max(bgm.volume, .32); paintMusic(); }).catch(() => {
    // El navegador exige un gesto: reanudamos en el primer toque
    const once = () => { if (quiereMusica && bgm.paused) bgm.play().then(paintMusic).catch(()=>{}); };
    ['touchstart','pointerdown','keydown'].forEach(ev => addEventListener(ev, once, {once:true, passive:true}));
  });
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(reanudar, 150); else paintMusic(); });
addEventListener('pageshow', () => setTimeout(reanudar, 150));
addEventListener('focus', () => setTimeout(reanudar, 150));

$('openBtn').addEventListener('click', () => {
  $('cover').classList.add('gone'); document.body.classList.add('open');
  document.body.style.overflow = '';
  playMusic();
  setTimeout(() => $('cover').remove(), 1200);
});
document.body.style.overflow = 'hidden';

/* ---------- Firebase (opcional: sin configuración el sitio funciona en modo demo) ---------- */
let fb = null;
async function initFirebase(){
  if (!B.firebase || !B.firebase.apiKey) return null;
  try {
    const v = '10.14.1';
    const [{initializeApp}, fs, st] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${v}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${v}/firebase-firestore.js`),
      import(`https://www.gstatic.com/firebasejs/${v}/firebase-storage.js`)
    ]);
    const app = initializeApp(B.firebase);
    return { fs, st, db: fs.getFirestore(app), storage: st.getStorage(app) };
  } catch (e) { console.warn('Firebase no disponible', e); return null; }
}
const fbReady = initFirebase().then(x => fb = x);

/* ---------- Canción que no puede faltar (buscador público de Apple Music, sin cuenta) ---------- */
const canciones = [];
(function(){
  const input = $('songInput'), list = $('songList'), picked = $('songPicked');
  let timer = 0, items = [], sel = -1, lastQ = '';
  const paint = () => { picked.innerHTML = canciones.map((c,i) => `<li>${c.arte ? `<img src="${esc(c.arte)}" alt="" onerror="this.remove()">` : ''}<div class="txt"><b>${esc(c.titulo)}</b><small>${esc(c.artista)}</small></div><button type="button" data-i="${i}" aria-label="Quitar">×</button></li>`).join(''); input.disabled = canciones.length >= 2; input.placeholder = canciones.length >= 2 ? 'Ya elegiste dos canciones' : 'Escribe la canción o el artista'; };
  const close = () => { list.hidden = true; list.innerHTML = ''; items = []; sel = -1; };
  const add = c => { if (canciones.length >= 2) return; canciones.push(c); input.value = ''; close(); paint(); };
  const show = q => {
    const manual = {titulo: q, artista: 'Escrita a mano', arte: null, manual: true};
    const aviso = items.length ? '' : `<li class="manual" style="cursor:default;color:var(--piedra)">No encontramos coincidencias; puedes guardarla tal cual:</li>`;
    list.innerHTML = aviso + items.map((c,i) => `<li role="option" data-i="${i}">${c.arte ? `<img src="${esc(c.arte)}" alt="" onerror="this.remove()">` : ''}<div><b>${esc(c.titulo)}</b><small>${esc(c.artista)}</small></div></li>`).join('') + `<li role="option" data-i="m" class="manual">Usar “${esc(q)}” tal cual</li>`;
    items.push(manual); list.hidden = false; sel = -1;
  };
  input.addEventListener('input', () => {
    const q = input.value.trim(); clearTimeout(timer); if (q.length < 2) { close(); return; }
    timer = setTimeout(async () => {
      lastQ = q;
      items = await buscarCanciones(q);
      if (lastQ !== q) return;
      show(q);
    }, 350);
  });
  // Buscador 1: Apple Music (fetch). Buscador 2: Deezer (JSONP), por si una red bloquea al primero.
  const jsonp = (url) => new Promise((res, rej) => {
    const cb = 'cb' + Math.random().toString(36).slice(2); const s = document.createElement('script');
    const t = setTimeout(() => { cleanup(); rej(new Error('timeout')); }, 6000);
    function cleanup(){ clearTimeout(t); delete window[cb]; s.remove(); }
    window[cb] = d => { cleanup(); res(d); };
    s.onerror = () => { cleanup(); rej(new Error('script')); };
    s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cb; document.head.appendChild(s);
  });
  async function buscarCanciones(q){
    try {
      const r = await fetch(`https://itunes.apple.com/search?media=music&entity=song&limit=6&country=CR&term=${encodeURIComponent(q)}`);
      if (!r.ok) throw new Error('itunes ' + r.status);
      const j = await r.json();
      if (j.results && j.results.length) return j.results.map(x => ({titulo: x.trackName, artista: x.artistName, arte: (x.artworkUrl100 || '').replace('100x100','200x200')}));
    } catch (e) { console.warn('Apple Music no respondió', e.message); }
    try {
      const j = await jsonp(`https://api.deezer.com/search?limit=6&output=jsonp&q=${encodeURIComponent(q)}`);
      if (j.data && j.data.length) return j.data.map(x => ({titulo: x.title, artista: x.artist && x.artist.name, arte: x.album && x.album.cover_medium}));
    } catch (e) { console.warn('Deezer no respondió', e.message); }
    return [];
  }
  list.addEventListener('mousedown', e => { const li = e.target.closest('li[role=option]'); if (!li) return; e.preventDefault(); add(li.dataset.i === 'm' ? items[items.length-1] : items[+li.dataset.i]); });
  input.addEventListener('keydown', e => {
    if (list.hidden) return; const lis = [...list.children];
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel+1, lis.length-1); } else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel-1, 0); }
    else if (e.key === 'Enter') { e.preventDefault(); const li = lis[sel] || lis[lis.length-1]; add(li.dataset.i === 'm' ? items[items.length-1] : items[+li.dataset.i]); return; }
    else if (e.key === 'Escape') { close(); return; } else return;
    lis.forEach((l,i) => l.setAttribute('aria-selected', i === sel));
  });
  list.addEventListener('touchstart', e => { const li = e.target.closest('li[role=option]'); if (!li) return; e.preventDefault(); add(li.dataset.i === 'm' ? items[items.length-1] : items[+li.dataset.i]); }, {passive:false});
  input.addEventListener('blur', () => setTimeout(close, 250));
  picked.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; canciones.splice(+b.dataset.i, 1); paint(); });
  document.addEventListener('rsvp:restore', e => { canciones.splice(0, canciones.length, ...(e.detail || [])); paint(); });
})();

/* ---------- RSVP ---------- */
const form = $('rsvpForm');
const LS_KEY = 'rsvp:' + (clave || 'anon');
if (!invitado) $('nameField').hidden = false;
if (invitado && invitado.personas.length > 1) {
  $('whoList').innerHTML = invitado.personas.map((p,i) => `<label><input type="checkbox" name="persona" value="${esc(p)}" id="per${i}" checked>${esc(p)}</label>`).join('');
}
form.addEventListener('change', () => {
  const r = form.respuesta.value;
  $('whoField').hidden = !(r === 'si' && invitado && invitado.personas.length > 1);
  $('whenField').hidden = r !== 'pendiente';
});
function showDone(data){
  form.hidden = true; $('rsvpDone').hidden = false; document.dispatchEvent(new Event('rsvp:done'));
  const t = {si:'¡Nos vemos ahí!', no:'Gracias por avisarnos', pendiente:'Quedamos atentos'}[data.respuesta];
  const txt = {
    si: `Recibimos tu confirmación${data.personas && data.personas.length ? ' para ' + data.personas.join(', ') : ''}. Guarda la fecha en tu calendario.`,
    no: 'Los vamos a extrañar. Gracias por acompañarnos de corazón.',
    pendiente: `Sin problema. ${data.fechaConfirma ? 'Te escribimos cerca del ' + new Date(data.fechaConfirma+'T12:00').toLocaleDateString('es-CR',{day:'numeric',month:'long'}) + '.' : 'Puedes volver a esta página cuando lo sepas.'}`
  }[data.respuesta];
  $('doneTitle').textContent = t; $('doneText').textContent = txt;
  const f = new Date(data.ts || Date.now()).toLocaleDateString('es-CR', {day:'numeric', month:'long', year:'numeric'});
  $('sentDate').textContent = 'Respuesta enviada el ' + f;
  $('calBox').hidden = data.respuesta !== 'si';
  if (data.canciones) document.dispatchEvent(new CustomEvent('rsvp:restore', {detail: data.canciones}));
  const s = (data.canciones || []).map(c => c.titulo + (c.artista && c.artista !== 'Escrita a mano' ? ' · ' + c.artista : '')).join('  ·  ');
  $('doneSongs').textContent = s ? 'Tu canción: ' + s : ''; $('doneSongs').hidden = !s;
}
// Si ya respondió desde otro teléfono, recuperar su respuesta de la base de datos
fbReady.then(async () => { if (!fb || !clave) return; try { const snap = await fb.fs.getDoc(fb.fs.doc(fb.db, 'rsvp', clave)); if (snap.exists()) { const d = snap.data(); try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch {} showDone(d); } } catch (e) { /* lectura no permitida para invitados: se usa la copia local */ } });
try { const prev = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); if (prev && prev.respuesta) showDone(prev); } catch {}
$('editBtn').addEventListener('click', () => { $('rsvpDone').hidden = true; form.hidden = false; });

form.addEventListener('submit', async e => {
  e.preventDefault();
  const err = $('formError'); err.hidden = true;
  const r = form.respuesta.value;
  const nombre = invitado ? invitado.titulo : $('rsvpName').value.trim();
  if (!nombre) { err.textContent = 'Escribe tu nombre para saber quién responde.'; err.hidden = false; return; }
  if (!r) { err.textContent = 'Elige una de las tres opciones.'; err.hidden = false; return; }
  const personas = r === 'si' ? (invitado ? [...form.querySelectorAll('input[name=persona]:checked')].map(i => i.value) : [nombre]) : [];
  if (r === 'si' && invitado && invitado.personas.length > 1 && !personas.length) { err.textContent = 'Marca al menos una persona.'; err.hidden = false; return; }
  const data = { clave: clave || null, nombre, respuesta: r, personas, fechaConfirma: r === 'pendiente' ? ($('rsvpWhen').value || null) : null, mensaje: $('rsvpMsg').value.trim().slice(0,500) || null, canciones: canciones.map(c => ({titulo: String(c.titulo).slice(0,120), artista: String(c.artista).slice(0,120), arte: c.arte || null})), ts: Date.now(), ua: navigator.userAgent.slice(0,120) };

  const btn = $('sendBtn'); btn.disabled = true; btn.textContent = 'Enviando…';
  try {
    await fbReady;
    if (fb) {
      const id = clave || ('anon-' + nombre.toLowerCase().replace(/[^a-z0-9ñ]+/g,'-').slice(0,40) + '-' + Math.random().toString(36).slice(2,7));
      await fb.fs.setDoc(fb.fs.doc(fb.db, 'rsvp', id), {...data, actualizado: fb.fs.serverTimestamp()}, {merge:true});
    } else {
      $('formNote').textContent = 'Modo demostración: la respuesta se guardó solo en este teléfono. Cuando conectemos la base de datos, quedará registrada.'; $('formNote').hidden = false;
    }
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
    showDone(data);
  } catch (e2) {
    console.error(e2);
    const wa = B.whatsappRespaldo ? ` <a href="https://wa.me/${B.whatsappRespaldo}?text=${encodeURIComponent('Hola Diego, soy ' + nombre + '. Mi respuesta a la boda: ' + ({si:'Confirmo asistencia', no:'No podré asistir', pendiente:'Aún no puedo confirmar'}[r]) + (personas.length ? ' (' + personas.join(', ') + ')' : '') + '.')}" target="_blank" rel="noopener" style="text-decoration:underline">Envíala por WhatsApp</a>.` : '';
    err.innerHTML = 'No pudimos guardar tu respuesta. Revisa tu conexión e intenta de nuevo.' + wa; err.hidden = false;
  } finally { btn.disabled = false; btn.textContent = 'Enviar respuesta'; }
});

