const B = window.BODA, INV = window.INVITADOS;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if (!B.firebase.apiKey) { $('msg').textContent = 'Falta la configuración de Firebase en js/config.js.'; }
const v = '10.14.1';
const [{initializeApp}, A, F, S] = await Promise.all([
  import(`https://www.gstatic.com/firebasejs/${v}/firebase-app.js`),
  import(`https://www.gstatic.com/firebasejs/${v}/firebase-auth.js`),
  import(`https://www.gstatic.com/firebasejs/${v}/firebase-firestore.js`),
  import(`https://www.gstatic.com/firebasejs/${v}/firebase-storage.js`)
]);
const app = initializeApp(B.firebase), auth = A.getAuth(app), db = F.getFirestore(app), storage = S.getStorage(app);
$('loginBtn').onclick = () => A.signInWithPopup(auth, new A.GoogleAuthProvider()).catch(e => $('msg').textContent = e.message);
$('logoutBtn').onclick = () => A.signOut(auth);
A.onAuthStateChanged(auth, u => {
  if (!u) { $('login').hidden = false; $('panel').hidden = true; return; }
  if (!B.admins.includes(u.email)) { $('msg').textContent = `${u.email} no está en la lista de administradores.`; A.signOut(auth); return; }
  $('login').hidden = true; $('panel').hidden = false; $('who').textContent = 'Sesión: ' + u.email; load();
});

const base = location.href.replace(/admin\.html.*$/, '');
$('links').innerHTML = Object.entries(INV).map(([k,g]) => `<code>${esc(base)}?i=${k}</code><button class="btn sm" data-u="${esc(base)}?i=${k}">Copiar</button><span class="muted" style="grid-column:1/-1">${esc(g.titulo)} · ${g.personas.length} persona(s)</span>`).join('');
$('links').onclick = e => { const b = e.target.closest('button'); if (b) navigator.clipboard.writeText(b.dataset.u).then(() => b.textContent = 'Copiado'); };

let rows = [], rsvps = [], songsBy = {};
function merge(){
  // Cada fila combina la confirmación con la lista de canciones guardada aparte (colección 'canciones')
  rows = rsvps.map(r => ({...r, canciones: (songsBy[r.id] && songsBy[r.id].canciones) || r.canciones || []}));
  const vistos = new Set(rsvps.map(r => r.id));
  Object.values(songsBy).filter(x => !vistos.has(x.id)).forEach(x => rows.push({id:x.id, clave:x.clave, nombre:x.nombre, respuesta:'sin', personas:[], canciones:x.canciones || [], ts:x.ts}));
  render();
}
function load(){
  F.onSnapshot(F.query(F.collection(db,'rsvp'), F.orderBy('ts','desc')), snap => { rsvps = snap.docs.map(d => ({id:d.id, ...d.data()})); merge(); });
  F.onSnapshot(F.collection(db,'canciones'), snap => { songsBy = {}; snap.docs.forEach(d => { songsBy[d.id] = {id:d.id, ...d.data()}; }); merge(); });
  loadFotos(false);
  F.getCountFromServer(F.collection(db,'fotos')).then(s => $('sFotos').textContent = s.data().count).catch(()=>{});
}
function render(){
  {
    const si = rsvps.filter(r => r.respuesta === 'si');
    $('sSi').textContent = si.reduce((n,r) => n + (r.personas?.length || 1), 0);
    $('sGrupos').textContent = si.length;
    $('sNo').textContent = rsvps.filter(r => r.respuesta === 'no').length;
    $('sPend').textContent = rsvps.filter(r => r.respuesta === 'pendiente').length;
    const respondieron = new Set(rsvps.map(r => r.clave).filter(Boolean));
    $('sSin').textContent = Object.keys(INV).filter(k => !respondieron.has(k)).length;
    $('rsvpBody').innerHTML = rows.map(r => `<tr><td>${esc(r.nombre)}<br><span class="muted">${esc(r.clave || 'sin enlace')}</span></td><td><span class="tag ${esc(r.respuesta)}">${{si:'Sí',no:'No',pendiente:'Pendiente',sin:'Solo canciones'}[r.respuesta] || r.respuesta}</span>${r.fechaConfirma ? `<br><span class="muted">confirma el ${esc(r.fechaConfirma)}</span>` : ''}</td><td>${(r.personas||[]).map(esc).join('<br>')}</td><td>${(r.canciones||[]).map(c => esc(c.titulo) + (c.artista && c.artista !== 'Escrita a mano' ? '<br><span class="muted">' + esc(c.artista) + '</span>' : '')).join('<hr style="border:0;border-top:1px solid #e5ded0;margin:6px 0">')}</td><td>${esc(r.mensaje || '')}</td><td class="muted">${new Date(r.ts).toLocaleString('es-CR')}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Aún no hay respuestas.</td></tr>';
  }
}
$('songsBtn').onclick = () => {
  const lines = rows.flatMap(r => (r.canciones||[]).map(c => `${c.titulo}${c.artista && c.artista !== 'Escrita a mano' ? ' - ' + c.artista : ''}  (${r.nombre})`));
  navigator.clipboard.writeText(lines.join('\n')).then(() => $('songsBtn').textContent = 'Copiadas ' + lines.length);
};
$('csvBtn').onclick = () => {
  const csv = [['invitacion','clave','respuesta','personas','fecha_confirma','canciones','mensaje','fecha'].join(','), ...rows.map(r => [r.nombre, r.clave||'', r.respuesta, (r.personas||[]).join(' | '), r.fechaConfirma||'', (r.canciones||[]).map(c=>c.titulo+' - '+c.artista).join(' | '), (r.mensaje||'').replace(/\n/g,' '), new Date(r.ts).toISOString()].map(x => '"' + String(x).replace(/"/g,'""') + '"').join(','))].join('\n');
  navigator.clipboard.writeText(csv).then(() => $('csvBtn').textContent = 'Copiado');
};

let last = null;
async function loadFotos(more){
  const q = more && last ? F.query(F.collection(db,'fotos'), F.orderBy('ts','desc'), F.startAfter(last), F.limit(60)) : F.query(F.collection(db,'fotos'), F.orderBy('ts','desc'), F.limit(60));
  const snap = await F.getDocs(q); if (!more) $('fotos').innerHTML = '';
  snap.forEach(d => { const x = d.data(); const fig = document.createElement('figure');
    const safe = u => /^https:\/\/firebasestorage\.googleapis\.com\//.test(String(u || '')) ? u : '';
    fig.innerHTML = `<a href="${esc(safe(x.url) || '#')}" target="_blank" rel="noopener"><img src="${esc(safe(x.thumb) || safe(x.url) || '')}" alt=""></a><figcaption>${esc(x.por)}${x.tipo==='video'?' · video':''}</figcaption><button class="del" title="Borrar" data-id="${d.id}">×</button>`;
    fig.querySelector('.del').onclick = async ev => { if (fig.dataset.confirm !== '1') { fig.dataset.confirm = '1'; ev.target.textContent = '✓'; setTimeout(() => { fig.dataset.confirm = ''; ev.target.textContent = '×'; }, 3000); return; }
      try { await F.deleteDoc(F.doc(db,'fotos',d.id)); try { await S.deleteObject(S.ref(storage, x.url)); if (x.thumb) await S.deleteObject(S.ref(storage, x.thumb)); } catch {} fig.remove(); } catch (e) { alert(e.message); } };
    $('fotos').append(fig); });
  last = snap.docs[snap.docs.length-1] || last; $('moreFotos').hidden = snap.size < 60;
}
$('moreFotos').onclick = () => loadFotos(true);
