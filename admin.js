// 1. IMPORTACIONES
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";

// 2. CONFIGURACIÓN
const firebaseConfig = {
  apiKey: "AIzaSyBo8q4_fFxiFp9jfkRDL5Fbg1KURLutIfg",
  authDomain: "app-patentes.firebaseapp.com",
  projectId: "app-patentes",
  storageBucket: "app-patentes.firebasestorage.app",
  messagingSenderId: "831225954806",
  appId: "1:831225954806:web:175d36ddb3c1b8305f87d7"
};

// 3. INICIALIZACIÓN
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- CONEXIÓN CON MAKE ---
async function enviarAGoogleSheets(datos) {
    const WEBHOOK_URL = "https://hook.us2.make.com/yout8thq1edp47ncqm1j35235c561f91"; 
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
    } catch (e) {
        console.warn("Error en Make:", e);
    }
}

// --- FUNCIÓN GUARDAR ---
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

        await setDoc(doc(db, "vehiculos", dominio), {
            marca, modelo, chasis, nombreCliente, telefonoCliente,
            observaciones, servicios: serviciosArray,
            ultimaActualizacion: serverTimestamp()
        });

        for (const srv of serviciosArray) {
            if (srv.recordar) {
                await enviarAGoogleSheets({
                    dominio, nombreCliente, telefonoCliente,
                    servicio: srv.nombre, vencimiento: srv.vencimiento
                });
            }
        }

        alert("¡Datos guardados con éxito!");
        location.reload();
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "GUARDAR / ACTUALIZAR";
    }
}

// --- FUNCIÓN BUSCAR ---
async function buscarParaModificar() {
    const dominio = document.getElementById('p_dominio').value.trim().toUpperCase();
    if (!dominio) return alert("Ingresa un dominio");

    try {
        const docSnap = await getDoc(doc(db, "vehiculos", dominio));
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('p_marca').value = data.marca || "";
            document.getElementById('p_modelo').value = data.modelo || "";
            document.getElementById('p_chasis').value = data.chasis || "";
            document.getElementById('p_nombre_cliente').value = data.nombreCliente || "";
            document.getElementById('p_telefono_cliente').value = data.telefonoCliente || "";
            document.getElementById('p_obs').value = data.observaciones || "";
            alert("Vehículo encontrado. Puedes modificarlo.");
        } else {
            alert("No se encontró el vehículo.");
        }
    } catch (e) {
        alert("Error al buscar.");
    }
}

// --- FUNCIÓN BORRAR ---
async function borrarDato() {
    const dominio = document.getElementById('p_dominio').value.trim().toUpperCase();
    if (!dominio) return alert("Ingresa un dominio para borrar");

    if (confirm(`¿Seguro que quieres borrar el dominio ${dominio}?`)) {
        try {
            await deleteDoc(doc(db, "vehiculos", dominio));
            alert("Borrado con éxito.");
            location.reload();
        } catch (e) {
            alert("Error al borrar.");
        }
    }
}

// --- HACER QUE LOS BOTONES FUNCIONEN (IMPORTANTE) ---
window.guardarDato = guardarDato;
window.buscarParaModificar = buscarParaModificar;
window.borrarDato = borrarDato;