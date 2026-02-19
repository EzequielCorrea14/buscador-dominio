// 1. IMPORTACIONES UNIFICADAS
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";

// 2. CONFIGURACIÓN (Pon tus datos aquí)
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO_ID",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_ID",
    appId: "TU_APP_ID"
};

// 3. INICIALIZACIÓN ÚNICA
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Hacemos que la función sea accesible desde el botón del HTML
window.guardarDato = guardarDato;

// 4. FUNCIÓN PARA ENVIAR A MAKE (Webhook)
async function enviarAGoogleSheets(datos) {
    const WEBHOOK_URL = "https://hook.us2.make.com/yout8thq1edp47ncqm1j35235c561f91"; 
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        console.log("Enviado a Make con éxito");
    } catch (e) {
        console.warn("Error enviando a Make:", e);
    }
}

// 5. FUNCIÓN PRINCIPAL PARA GUARDAR
async function guardarDato() {
    const btn = document.getElementById('btnGuardar');
    const dominio = document.getElementById('p_dominio').value.trim().toUpperCase();
    const marca = document.getElementById('p_marca').value.trim();
    const modelo = document.getElementById('p_modelo').value.trim();
    const chasis = document.getElementById('p_chasis').value.trim();
    const nombreCliente = document.getElementById('p_nombre_cliente').value.trim();
    const telefonoCliente = document.getElementById('p_telefono_cliente').value.trim();
    const observaciones = document.getElementById('p_obs').value.trim();

    if (dominio.length < 6) {
        alert("El dominio debe tener al menos 6 caracteres.");
        return;
    }

    const bloques = document.querySelectorAll('.bloque-servicio');
    let serviciosArray = [];

    bloques.forEach(bloque => {
        const nombreSrv = bloque.querySelector('.srv-nombre').value.trim();
        const fechaSrv = bloque.querySelector('.srv-fecha').value;
        const duracionNum = parseInt(bloque.querySelector('.srv-duracion-num').value);
        const duracionTipo = bloque.querySelector('.srv-duracion-tipo').value;
        const recordar = bloque.querySelector('.srv-recordar').checked;

        if (nombreSrv && fechaSrv) {
            let fechaVencimiento = new Date(fechaSrv);
            if (duracionTipo === "meses") {
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + duracionNum);
            } else {
                fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + duracionNum);
            }

            serviciosArray.push({
                nombre: nombreSrv,
                fecha: fechaSrv,
                duracion: `${duracionNum} ${duracionTipo}`,
                vencimiento: fechaVencimiento.toISOString().split('T')[0],
                recordar: recordar
            });
        }
    });

    try {
        btn.disabled = true;
        btn.innerText = "PROCESANDO...";

        // GUARDAR EN FIREBASE
        await setDoc(doc(db, "vehiculos", dominio), {
            marca, 
            modelo, 
            chasis, 
            nombreCliente, 
            telefonoCliente,
            observaciones, 
            servicios: serviciosArray,
            ultimaActualizacion: serverTimestamp()
        });

        // ENVIAR A MAKE (Solo si 'recordar' está marcado)
        for (const srv of serviciosArray) {
            if (srv.recordar) {
                await enviarAGoogleSheets({
                    dominio,
                    nombreCliente,
                    telefonoCliente,
                    servicio: srv.nombre,
                    vencimiento: srv.vencimiento
                });
            }
        }

        alert("¡Datos guardados y sincronizados con éxito!");
        location.reload();
        
    } catch (error) {
        console.error("Error completo:", error);
        alert("Error al guardar: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "GUARDAR / ACTUALIZAR";
    }
}