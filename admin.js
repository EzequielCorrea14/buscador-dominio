// 1. Importaciones (Asegúrate de que las versiones coincidan con tu HTML)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";

const firebaseConfig = {
    // PEGA AQUÍ TUS CREDENCIALES (apiKey, authDomain, etc.)
};

// 2. Inicialización Global
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para guardar
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

        // 3. GUARDAR EN FIREBASE (Sintaxis corregida)
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

        // 4. ENVIAR A GOOGLE SHEETS (Make.com)
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

// Asegúrate de que la función enviarAGoogleSheets esté definida abajo también