/* Página de fotos — subida masiva con nombre y galería */
const B = window.BODA, INV = window.INVITADOS || {};
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const qi = (new URLSearchParams(location.search).get('i') || '').toLowerCase().trim();
const hh = location.hash.replace('#','').toLowerCase().trim();
const clave = qi || (INV[hh] ? hh : '');
const invitado = INV[clave] || null;
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

/* ---------- Fotos: subida masiva con nombre ---------- */
const people = [...new Set(Object.values(INV).flatMap(g => g.personas))].sort((a,b) => a.localeCompare(b,'es'));
$('peopleList').innerHTML = people.map(p => `<option value="${esc(p)}">`).join('');
if (invitado && invitado.personas.length === 1) $('upName').value = invitado.personas[0];
try { const n = localStorage.getItem('upName'); if (n && !$('upName').value) $('upName').value = n; } catch {}

const drop = $('drop'), filesIn = $('upFiles'), queue = $('queue');
['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
filesIn.addEventListener('change', () => { handleFiles(filesIn.files); filesIn.value = ''; });

function makeThumb(file){
  return new Promise(res => {
    if (!file.type.startsWith('image/')) return res(null);
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const s = 640 / Math.max(img.width, img.height); const w = Math.round(img.width*Math.min(1,s)), h = Math.round(img.height*Math.min(1,s));
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img,0,0,w,h);
      c.toBlob(b => { URL.revokeObjectURL(url); res({blob:b, w:img.width, h:img.height}); }, 'image/jpeg', .8); };
    img.onerror = () => { URL.revokeObjectURL(url); res(null); };
    img.src = url;
  });
}

const MAX_MB = 300;
let active = 0; const pending = [];
async function handleFiles(list){
  const who = $('upName').value.trim();
  if (!who) { $('upNote').textContent = 'Primero escribe o elige tu nombre, así sabremos de quién son las fotos.'; $('upNote').hidden = false; $('upName').focus(); return; }
  $('upNote').hidden = true; try { localStorage.setItem('upName', who); } catch {}
  for (const f of list) {
    if (!/^(image|video)\//.test(f.type)) continue;
    const li = document.createElement('li');
    const prev = f.type.startsWith('image/') ? `<img alt="">` : `<span class="vid">VIDEO</span>`;
    li.innerHTML = `${prev}<div class="fn"><span>${esc(f.name)}</span><div class="bar"><i></i></div></div><span class="st">En cola</span>`;
    queue.prepend(li);
    if (f.type.startsWith('image/')) { const u = URL.createObjectURL(f); li.querySelector('img').src = u; }
    if (f.size > MAX_MB*1024*1024) { setSt(li, 'err', `Más de ${MAX_MB} MB`); continue; }
    pending.push({f, li, who}); pump();
  }
}
function setSt(li, cls, t){ const s = li.querySelector('.st'); s.className = 'st ' + cls; s.textContent = t; }
function pump(){ while (active < 3 && pending.length) { active++; uploadOne(pending.shift()).finally(() => { active--; pump(); }); } }

async function uploadOne({f, li, who}){
  await fbReady;
  const bar = li.querySelector('.bar i');
  if (!fb) { // modo demo: simula
    setSt(li, '', 'Subiendo'); for (let p = 0; p <= 100; p += 20) { await new Promise(r => setTimeout(r, 120)); bar.style.width = p + '%'; }
    setSt(li, 'ok', 'Demo'); $('upNote').textContent = 'Modo demostración: aún no hay servidor conectado, las fotos no se guardaron.'; $('upNote').hidden = false; return;
  }
  try {
    setSt(li, '', 'Preparando');
    const thumb = await makeThumb(f);
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    const ext = (f.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,5);
    const base = `fotos/${id}`;
    const meta = {contentType: f.type, customMetadata: {por: who}};
    const refO = fb.st.ref(fb.storage, `${base}.${ext}`);
    setSt(li, '', 'Subiendo');
    await new Promise((res, rej) => {
      const task = fb.st.uploadBytesResumable(refO, f, meta);
      task.on('state_changed', s => { bar.style.width = Math.round(s.bytesTransferred / s.totalBytes * 100) + '%'; }, rej, res);
    });
    let thumbUrl = null;
    if (thumb) { const refT = fb.st.ref(fb.storage, `${base}_t.jpg`); await fb.st.uploadBytes(refT, thumb.blob, {contentType:'image/jpeg'}); thumbUrl = await fb.st.getDownloadURL(refT); }
    const url = await fb.st.getDownloadURL(refO);
    await fb.fs.setDoc(fb.fs.doc(fb.db, 'fotos', id), {por: who, clave: clave || null, tipo: f.type.startsWith('video/') ? 'video' : 'foto', url, thumb: thumbUrl, nombre: f.name.slice(0,120), bytes: f.size, w: thumb?.w || null, h: thumb?.h || null, ts: Date.now(), creado: fb.fs.serverTimestamp()});
    setSt(li, 'ok', 'Lista');
  } catch (e) { console.error(e); setSt(li, 'err', 'Error, reintenta'); }
}

/* ---------- Galería ---------- */
const gallery = $('gallery'); let lastDoc = null; const PAGE = 24;
function cardFor(d){
  const b = document.createElement('button'); b.type = 'button';
  const media = d.tipo === 'video' && !d.thumb ? `<video src="${esc(d.url)}#t=0.1" preload="metadata" muted playsinline></video>` : `<img src="${esc(d.thumb || d.url)}" alt="Foto subida por ${esc(d.por)}" loading="lazy">`;
  b.innerHTML = `${media}${d.tipo === 'video' ? '<span class="play">▶</span>' : ''}<span class="by">${esc(d.por)}</span>`;
  b.addEventListener('click', () => openLb(d)); return b;
}
async function loadGallery(more){
  await fbReady;
  if (!fb) { gallery.innerHTML = '<p class="gallery-empty">Aquí aparecerán las fotos que suban los invitados.</p>'; return; }
  const {collection, query, orderBy, limit, startAfter, getDocs, onSnapshot} = fb.fs;
  if (!more) {
    gallery.innerHTML = '';
    const q = query(collection(fb.db,'fotos'), orderBy('ts','desc'), limit(PAGE));
    onSnapshot(q, snap => {
      snap.docChanges().forEach(ch => { if (ch.type === 'added') { const el = cardFor(ch.doc.data()); el.dataset.id = ch.doc.id; if (ch.newIndex === 0) gallery.prepend(el); else gallery.append(el); } if (ch.type === 'removed') gallery.querySelector(`[data-id="${ch.doc.id}"]`)?.remove(); });
      lastDoc = snap.docs[snap.docs.length-1] || null; $('moreBtn').hidden = snap.size < PAGE;
      if (!snap.size) gallery.innerHTML = '<p class="gallery-empty">Sé el primero en compartir una foto.</p>';
    }, e => { console.warn(e); gallery.innerHTML = '<p class="gallery-empty">No pudimos cargar la galería.</p>'; });
  } else if (lastDoc) {
    const snap = await getDocs(query(collection(fb.db,'fotos'), orderBy('ts','desc'), startAfter(lastDoc), limit(PAGE)));
    snap.forEach(d => { const el = cardFor(d.data()); el.dataset.id = d.id; gallery.append(el); });
    lastDoc = snap.docs[snap.docs.length-1] || lastDoc; $('moreBtn').hidden = snap.size < PAGE;
  }
}
$('moreBtn').addEventListener('click', () => loadGallery(true));
loadGallery(false);

const lb = $('lightbox');
function openLb(d){ $('lbBody').innerHTML = d.tipo === 'video' ? `<video src="${esc(d.url)}" controls playsinline autoplay></video>` : `<img src="${esc(d.url)}" alt="">`; $('lbCap').textContent = 'Foto de ' + d.por; lb.hidden = false; document.body.style.overflow = 'hidden'; }
function closeLb(){ lb.hidden = true; $('lbBody').innerHTML = ''; document.body.style.overflow = ''; }
$('lbClose').addEventListener('click', closeLb); lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });
