const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// 1. CONFIGURACIÓN DE FIREBASE
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verificarVencimientos() {
    console.log("--- INICIANDO REVISIÓN DE VENCIMIENTOS ---");
    
    // Calculamos la fecha de hoy + 30 días
    const hoy = new Date();
    const fechaObjetivo = new Date();
    fechaObjetivo.setDate(hoy.getDate() + 30);
    
    // Formato YYYY-MM-DD
    const isoFechaObjetivo = fechaObjetivo.toISOString().split('T')[0];
    console.log(`Buscando vencimientos para la fecha exacta: ${isoFechaObjetivo}`);

    try {
        const snapshot = await db.collection('vehiculos').get();
        console.log(`Vehículos encontrados en la base de datos: ${snapshot.size}`);

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const dominio = doc.id;
            
            if (data.servicios && Array.isArray(data.servicios)) {
                for (const srv of data.servicios) {
                    // LOG DE REVISIÓN: Esto te dirá en la consola de GitHub qué está viendo el robot
                    console.log(`Revisando [${dominio}] - Servicio: ${srv.nombre} | Vencimiento: ${srv.vencimiento} | Recordar: ${srv.recordar}`);

                    if (srv.vencimiento === isoFechaObjetivo && srv.recordar === true) {
                        console.log(`¡COINCIDENCIA ENCONTRADA! Preparando envío para ${dominio}...`);
                        await enviarEmail(dominio, data.nombreCliente, data.telefonoCliente, srv);
                    }
                }
            }
        }
        console.log("--- REVISIÓN FINALIZADA CON ÉXITO ---");
    } catch (error) {
        console.error("Error al acceder a la base de datos:", error);
    }
}

// 2. CONFIGURACIÓN DE ENVÍO DE MAIL
async function enviarEmail(dominio, cliente, telefono, servicio) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'gleamdetail.arg@gmail.com',
            pass: 'rigt soyj ftuf bnyk' // Tu clave de aplicación de 16 letras
        }
    });

    const mailOptions = {
        from: '"Gleam Detail Alertas" <gleamdetail.arg@gmail.com>',
        to: 'gleamdetail.arg@gmail.com', 
        subject: `⚠️ ALERTA DE VENCIMIENTO: ${dominio}`,
        html: `
            <div style="font-family: sans-serif; border: 1px solid #ccc; padding: 20px;">
                <h2 style="color: #d32f2f;">Próximo Vencimiento (30 días)</h2>
                <p><b>Dominio:</b> ${dominio}</p>
                <p><b>Cliente:</b> ${cliente || 'Sin nombre'}</p>
                <p><b>Teléfono:</b> ${telefono || 'Sin teléfono'}</p>
                <hr>
                <p><b>Servicio a realizar:</b> ${servicio.nombre}</p>
                <p><b>Fecha de vencimiento:</b> ${servicio.vencimiento}</p>
                <br>
                <small>Este es un recordatorio automático generado por tu sistema de gestión.</small>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email enviado correctamente para el dominio: ${dominio}`);
    } catch (error) {
        console.error(`❌ Error enviando mail para ${dominio}:`, error);
    }
}

// Ejecutar la función
verificarVencimientos();