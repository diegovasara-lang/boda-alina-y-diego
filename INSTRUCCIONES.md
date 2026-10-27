# Boda de Alina & Diego — sitio web de la invitación

Sitio estático (HTML + CSS + JS). No necesita servidor propio: se hospeda gratis y usa
Firebase (Google) para guardar confirmaciones y fotos.

## Estructura
```
index.html            la invitación
fotos.html            página aparte para subir fotos el día de la boda (para el código QR)
admin.html            panel privado (confirmaciones, fotos, enlaces)
js/config.js          TODOS los datos editables: horas, cuentas, textos, Firebase
js/invitados.js       lista de invitados y sus claves de enlace
js/app.js             lógica
css/estilo.css        estilos
assets/               logo (monograma.png, wordmark.png) y música (musica.mp3)
img/                  fotos de la sesión
firebase/             reglas de seguridad para pegar en la consola de Firebase
```

## 1) Conectar Firebase (10 minutos, una sola vez)
1. Entrar a https://console.firebase.google.com con la cuenta de Google y **Crear proyecto** (ej. `boda-alina-diego`). Google Analytics: no hace falta.
2. En el proyecto: **Compilación → Firestore Database → Crear base de datos** → modo producción → ubicación `us-central1` (o `southamerica-east1`).
3. **Compilación → Storage → Comenzar**. Para subir muchas fotos hay que pasar el proyecto al plan **Blaze** (pago por uso): los primeros 5 GB son gratis y después cuesta ~US$0.026 por GB al mes. 2 000 fotos de celular ≈ 6–8 GB ≈ menos de US$0.25 al mes.
4. **Compilación → Authentication → Comenzar → Google → Habilitar** (solo lo usa el panel de administración).
5. Pegar las reglas: en Firestore → pestaña **Reglas**, reemplazar todo por el contenido de `firebase/firestore.rules` y **Publicar**. Igual en Storage → **Reglas** con `firebase/storage.rules`.
6. **Configuración del proyecto (engranaje) → Tus apps → icono `</>` (Web)** → registrar la app (sin Hosting) → copiar el objeto `firebaseConfig` y pegar sus valores en `js/config.js` dentro de `firebase: { ... }`.
7. En **Authentication → Settings → Dominios autorizados**, agregar el dominio donde quede el sitio (ej. `bodaalinaydiego.com`).

Sin este paso el sitio funciona igual en "modo demostración": todo se ve, pero las
respuestas y fotos no se guardan.

## 2) Publicar el sitio con URL propia
Opción recomendada: **Netlify** (gratis).
1. https://app.netlify.com → **Add new site → Deploy manually** → arrastrar la carpeta completa.
2. Netlify da una URL tipo `boda-alina-diego.netlify.app`. Se puede cambiar el nombre en *Site settings → Change site name*.
3. Dominio propio (ej. `bodaalinaydiego.com`, ~US$10 al año en Namecheap, Porkbun o Cloudflare): en Netlify → **Domain management → Add a domain** y seguir los pasos para apuntar el DNS. Netlify pone el certificado HTTPS solo.

Alternativas equivalentes: Vercel, GitHub Pages, Firebase Hosting.

Cada vez que cambie algo en `js/config.js` o `js/invitados.js`, se vuelve a arrastrar la carpeta.

## 3) Enlaces personalizados
Cada invitación es `https://TU-DOMINIO/?i=clave`. Las claves y los nombres se editan en
`js/invitados.js`. El panel `admin.html` los lista con botón de copiar.
Sin `?i=` la página también funciona: pide el nombre al confirmar.

## 4) Panel de administración
`https://TU-DOMINIO/admin.html` → Entrar con Google (solo los correos en `admins` de
`js/config.js` y en las reglas). Muestra conteos, tabla de respuestas (copiar CSV), fotos (con
borrar) y los enlaces por invitado.

## 5) Música
`assets/musica.mp3` es "Beneath the Moonlight" de Aaron Kenny (Biblioteca de audio de YouTube,
libre de uso). Para usar otra canción basta reemplazar el archivo con el mismo nombre (ideal: MP3
de 1–3 MB, 96–128 kbps). Nota: en iPhone la música solo arranca tras tocar "Abrir invitación";
es una restricción de Safari.
