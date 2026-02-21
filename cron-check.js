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
    const ahoraEnArgentina = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));
    
    // Calculamos la fecha objetivo (Hoy + 30 días)
    const fechaObjetivo = new Date(ahoraEnArgentina);
    fechaObjetivo.setDate(ahoraEnArgentina.getDate() + 30);
    
    // Formateamos manualmente a YYYY-MM-DD
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

// 2. CONFIGURACIÓN DE ENVÍO DE MAIL CON LINK DE WHATSAPP
async function enviarEmail(dominio, cliente, telefono, servicio) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'gleamdetail.arg@gmail.com',
            pass: 'rigt soyj ftuf bnyk' 
        }
    });

    // --- LÓGICA DE WHATSAPP ---
    // Limpiamos el teléfono de espacios, guiones o paréntesis
    const numLimpio = telefono ? telefono.replace(/\D/g, '') : '';
    
    // Creamos el mensaje predefinido
    const textoMensaje = `Hola ${cliente || ''}, te escribimos de Gleam Detail. Te recordamos que está próximo a vencer el servicio de ${servicio.nombre} para tu vehículo ${dominio}. ¿Te gustaría reservar un turno para renovarlo?`;
    const linkWhatsApp = `https://wa.me/${numLimpio}?text=${encodeURIComponent(textoMensaje)}`;

    const mailOptions = {
        from: '"Gleam Detail Alertas" <gleamdetail.arg@gmail.com>',
        to: 'gleamdetail.arg@gmail.com', 
        subject: `⚠️ PRÓXIMO VENCIMIENTO: ${dominio} (${cliente || 'Cliente'})`,
        html: `
            <div style="font-family: sans-serif; border: 1px solid #000; padding: 20px; background-color: #f9f9f9; max-width: 500px;">
                <h2 style="color: #d32f2f; text-transform: uppercase; margin-top: 0;">Aviso de Vencimiento</h2>
                <p><b>Vehículo:</b> ${dominio}</p>
                <p><b>Cliente:</b> ${cliente || 'No especificado'}</p>
                <hr style="border: 0; border-top: 1px solid #eee;">
                <p><b>Servicio por vencer:</b> ${servicio.nombre}</p>
                <p><b>Fecha de vencimiento:</b> <span style="background: yellow; padding: 2px 5px;">${servicio.vencimiento}</span></p>
                
                <div style="margin-top: 25px; text-align: center;">
                    <a href="${linkWhatsApp}" style="background-color: #25D366; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                        📱 CONTACTAR POR WHATSAPP
                    </a>
                </div>
                
                <p style="color: #666; font-size: 0.8em; margin-top: 20px; font-style: italic;">
                    Al hacer clic en el botón, se abrirá WhatsApp con el mensaje listo para enviar al cliente.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email con botón de WhatsApp enviado para: ${dominio}`);
    } catch (error) {
        console.error(`❌ Error al enviar el mail de ${dominio}:`, error);
    }
}

verificarVencimientos();