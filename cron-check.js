const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// 1. CONFIGURACIÓN DE FIREBASE (Se lee desde las variables secretas de GitHub)
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verificarVencimientos() {
    console.log("Iniciando revisión de vencimientos...");
    
    // Calculamos la fecha de hoy + 30 días
    const hoy = new Date();
    const fechaObjetivo = new Date();
    fechaObjetivo.setDate(hoy.getDate() + 30);
    
    // Formato YYYY-MM-DD para comparar con tu base de datos
    const isoFechaObjetivo = fechaObjetivo.toISOString().split('T')[0];

    const snapshot = await db.collection('vehiculos').get();
    
    snapshot.forEach(async (doc) => {
        const data = doc.data();
        const dominio = doc.id;

        if (data.servicios) {
            for (const srv of data.servicios) {
                // Si vence en 30 días y tiene activado "recordar"
                if (srv.vencimiento === isoFechaObjetivo && srv.recordar) {
                    await enviarEmail(dominio, data.nombreCliente, data.telefonoCliente, srv);
                }
            }
        }
    });
}

// 2. CONFIGURACIÓN DE ENVÍO DE MAIL
async function enviarEmail(dominio, cliente, telefono, servicio) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'gleamdetail.arg@gmail.com', // El mail del taller
            pass: 'rigt soyj ftuf bnyk' // La clave de 16 letras de Google
        }
    });

    const mailOptions = {
        from: '"Recordatorios Taller" <gleamdetail.arg@gmail.com>',
        to: 'gleamdetail.arg@gmail.com', // Te lo envías a ti mismo
        subject: `⚠️ VENCIMIENTO PRÓXIMO: ${dominio}`,
        html: `
            <h3>Hola! Tienes un servicio por vencer en 30 días</h3>
            <p><b>Vehículo:</b> ${dominio}</p>
            <p><b>Cliente:</b> ${cliente}</p>
            <p><b>Teléfono:</b> ${telefono}</p>
            <p><b>Servicio:</b> ${servicio.nombre}</p>
            <p><b>Fecha de vencimiento:</b> ${servicio.vencimiento}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email enviado para el dominio ${dominio}`);
    } catch (error) {
        console.error("Error enviando mail:", error);
    }
}

verificarVencimientos();