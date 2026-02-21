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
    
    // FORZAMOS LA FECHA DE ARGENTINA (GMT-3)
    // Esto evita que el servidor de GitHub use la hora de Londres o EE.UU.
    const ahoraEnArgentina = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));
    
    // Calculamos la fecha objetivo (Hoy + 30 días)
    const fechaObjetivo = new Date(ahoraEnArgentina);
    fechaObjetivo.setDate(ahoraEnArgentina.getDate() + 30);
    
    // Formateamos manualmente a YYYY-MM-DD para asegurar match total con Firebase
    const y = fechaObjetivo.getFullYear();
    const m = String(fechaObjetivo.getMonth() + 1).padStart(2, '0');
    const d = String(fechaObjetivo.getDate()).padStart(2, '0');
    const isoFechaObjetivo = `${y}-${m}-${d}`;

    console.log(`Hoy en Argentina es: ${ahoraEnArgentina.toLocaleDateString()}`);
    console.log(`Buscando vencimientos para la fecha exacta: ${isoFechaObjetivo}`);

    try {
        const snapshot = await db.collection('vehiculos').get();
        console.log(`Vehículos totales en la base: ${snapshot.size}`);

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const dominio = doc.id;
            
            if (data.servicios && Array.isArray(data.servicios)) {
                for (const srv of data.servicios) {
                    // Log detallado para ver qué detecta el robot en cada vuelta
                    console.log(`Revisando [${dominio}] -> Vence: ${srv.vencimiento} | Recordar: ${srv.recordar}`);

                    if (srv.vencimiento === isoFechaObjetivo && srv.recordar === true) {
                        console.log(`🎯 ¡MATCH ENCONTRADO! Enviando alerta para ${dominio}...`);
                        await enviarEmail(dominio, data.nombreCliente, data.telefonoCliente, srv);
                    }
                }
            }
        }
        console.log("--- REVISIÓN FINALIZADA CON ÉXITO ---");
    } catch (error) {
        console.error("❌ Error crítico en la revisión:", error);
    }
}

// 2. CONFIGURACIÓN DE ENVÍO DE MAIL
async function enviarEmail(dominio, cliente, telefono, servicio) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'gleamdetail.arg@gmail.com',
            pass: 'rigt soyj ftuf bnyk' 
        }
    });

    const mailOptions = {
        from: '"Gleam Detail Alertas" <gleamdetail.arg@gmail.com>',
        to: 'gleamdetail.arg@gmail.com', 
        subject: `⚠️ ALERTA DE VENCIMIENTO: ${dominio}`,
        html: `
            <div style="font-family: sans-serif; border: 1px solid #000; padding: 20px; background-color: #f9f9f9;">
                <h2 style="color: #d32f2f; text-transform: uppercase;">Aviso de Vencimiento (30 días)</h2>
                <p><b>Vehículo (Dominio):</b> ${dominio}</p>
                <p><b>Cliente:</b> ${cliente || 'No especificado'}</p>
                <p><b>Teléfono:</b> ${telefono || 'No especificado'}</p>
                <hr style="border: 0; border-top: 1px solid #eee;">
                <p style="font-size: 1.1em;"><b>Servicio próximo a vencer:</b> ${servicio.nombre}</p>
                <p><b>Fecha de vencimiento:</b> <span style="background: yellow;">${servicio.vencimiento}</span></p>
                <br>
                <p style="color: #666; font-style: italic;">Este es un mensaje automático del Sistema de Gestión Gleam Detail.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email enviado exitosamente a gleamdetail.arg@gmail.com para el dominio: ${dominio}`);
    } catch (error) {
        console.error(`❌ Error al enviar el mail de ${dominio}:`, error);
    }
}

verificarVencimientos();