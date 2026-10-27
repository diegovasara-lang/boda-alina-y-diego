/* =====================================================================
   DATOS DE LA BODA — editar aquí. Nada más del sitio hay que tocar.
   ===================================================================== */
window.BODA = {
  nombres: "Alina & Diego",
  fechaISO: "2026-12-20T15:00:00-06:00",     // inicio de la ceremonia (hora de Costa Rica)
  finISO:   "2026-12-21T01:00:00-06:00",     // fin estimado de la celebración (para el calendario)

  ceremonia: {
    nombre: "Parroquia San Rafael Arcángel",
    lugar: "Atenas, Alajuela",
    hora: "3:00 p. m.",
    direccion: "Avenida Central Abel Rodríguez Vargas, frente al parque central de Atenas",
    maps: "https://www.google.com/maps/search/?api=1&query=9.9784079,-84.3798189&query_place_id=ChIJk_LK8RlRoI8RRzGuUcB37E4",
    waze: "https://waze.com/ul?ll=9.9784079,-84.3798189&navigate=yes&zoom=17"
  },
  celebracion: {
    nombre: "Hacienda Vargas Ú",
    lugar: "Atenas, Alajuela",
    hora: "5:00 p. m.",
    direccion: "Autopista José María Castro Madriz (Ruta 27), Atenas",
    maps: "https://www.google.com/maps/search/?api=1&query=9.9671583,-84.3570212&query_place_id=ChIJsZxtjjVRoI8Ry4dvKowZ19E",
    waze: "https://waze.com/ul?ll=9.9671583,-84.3570212&navigate=yes&zoom=17"
  },

  // Programa del día: cuando esté definido, poner mostrarPrograma: true
  mostrarPrograma: false,
  programa: [
    ["3:00 pm", "Ceremonia religiosa", "Parroquia San Rafael Arcángel"],
    ["5:00 pm", "Recepción de invitados", "Hacienda Vargas Ú"],
    ["6:30 pm", "Ingreso al salón y brindis", ""],
    ["7:30 pm", "Cena", ""],
    ["9:00 pm", "Set bailable", ""],
    ["12:00 am", "Comida de cierre", ""]
  ],

  dressCode: {
    titulo: "Formal veraniego",
    sub: "",
    damas: ["Vestido largo o midi (por debajo de la rodilla)", "Estilo elegante y sencillo, sin diseños demasiado elaborados", "Telas ligeras, preferiblemente sin estampados ni brillos", "No vestidos cortos"],
    caballeros: ["Pantalón de vestir y camisa de manga larga", "Saco o blazer ligero (lino o algodón)", "Corbata opcional; zapatos formales, sin tenis"],
    nota: "Por favor, eviten el blanco, beige y marfil: están reservados para los novios.",
    pinterest: "https://pin.it/6qmHqN4bZ",
    evitar: [["Blanco", "#ffffff"], ["Beige", "#efe6d4"], ["Marfil", "#f6f1e3"]]
  },
  regalosTexto: "Apreciamos cada muestra de cariño que nos quieran dar. En esta ocasión les invitamos a compartirla en efectivo: en un sobre el día de la boda, o por transferencia a estas cuentas.",

  cuentas: [
    { banco: "Scotiabank", tipo: "IBAN", numero: "CR41 0123 0012 0120 6620 09", titular: "Alina" },
    { banco: "BAC Credomatic", tipo: "IBAN", numero: "CR23 0102 0000 9731 3702 96", titular: "Diego" }
  ],
  sinpe: null,   // opcional: { numero: "0000-0000", titular: "Nombre" }

  fechaLimite: "20 de noviembre de 2026",
  whatsappRespaldo: "50600000000",   // ← tu número con código de país; solo se ofrece si la base de datos falla
  soloAdultos: true,

  /* ---------- Firebase: pegar aquí la configuración del proyecto ----------
     Consola de Firebase → Configuración del proyecto → Tus apps → Web → firebaseConfig.
     Mientras esté vacío, el sitio funciona en modo demostración (sin guardar). */
  firebase: {
    apiKey: "AIzaSyAndRE4R0S-6MVT5AeO8MUOHOL9WkoqZyo",
    authDomain: "boda-alina-diego.firebaseapp.com",
    projectId: "boda-alina-diego",
    storageBucket: "boda-alina-diego.firebasestorage.app",
    messagingSenderId: "545729201144",
    appId: "1:545729201144:web:83fd00481f767978f8cc0d"
  },
  // Correos que pueden entrar a admin.html y ver confirmaciones
  admins: ["diego.vasara@gmail.com"]
};
