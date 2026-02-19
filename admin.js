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

// --- CONEXIÓN CON MAKE (WEBHOOK) ---
async function enviarAGoogleSheets(datos) {
    const WEBHOOK_URL = "https://hook.us2.make.com/yout8thq1edp47ncqm1j35235c561f91"; 
    try {
        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
    } catch (e) {
        console.warn("Error enviando a Make:", e);
    }
}

// --- FUNCIÓN GUARDAR / ACTUALIZAR ---
async function guardarDato() {
    const btn = document.getElementById('btnGuardar');
    const dominio = document.getElementById('p_dominio').value.trim().toUpperCase();
    
    // Captura de datos del formulario
    const marca = document.getElementById('p_marca').value.trim();
    const modelo = document.getElementById('p_modelo').value.trim();
    const chasis = document.getElementById('p_chasis').value.trim();
    const nombreCliente = document.getElementById('p_nombre_cliente').value.trim();
    const telefonoCliente = document.getElementById('p_telefono_cliente').value.trim();
    const observaciones = document.getElementById('p_obs').value.trim();

    if (dominio.length < 6) return alert("El dominio es demasiado corto.");

    // Procesar bloques de servicios
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

        // Guardar en Firestore
        await setDoc(doc(db, "vehiculos", dominio), {
            marca, modelo, chasis, nombreCliente, telefonoCliente,
            observaciones, servicios: serviciosArray,
            ultimaActualizacion: serverTimestamp()
        });

        // Enviar alertas a Make (sin bloquear el alert de éxito)
        serviciosArray.forEach(srv => {
            if (srv.recordar) {
                enviarAGoogleSheets({
                    dominio, nombreCliente, telefonoCliente,
                    servicio: srv.nombre, vencimiento: srv.vencimiento
                });
            }
        });

        alert("¡Datos y servicios guardados con éxito!");
        location.reload();
    } catch (error) {
        alert("Error al guardar: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "GUARDAR / ACTUALIZAR";
    }
}

// --- FUNCIÓN BUSCAR (Ahora carga servicios también) ---
async function buscarParaModificar() {
    const dominioInput = document.getElementById('p_dominio');
    const dominio = dominioInput.value.trim().toUpperCase();
    if (!dominio) return alert("Ingresa un dominio.");

    try {
        const docSnap = await getDoc(doc(db, "vehiculos", dominio));
        if (docSnap.exists()) {
            const data = docSnap.data();

            // Llenar campos principales
            document.getElementById('p_marca').value = data.marca || "";
            document.getElementById('p_modelo').value = data.modelo || "";
            document.getElementById('p_chasis').value = data.chasis || "";
            document.getElementById('p_nombre_cliente').value = data.nombreCliente || "";
            document.getElementById('p_telefono_cliente').value = data.telefonoCliente || "";
            document.getElementById('p_obs').value = data.observaciones || "";

            // Llenar Servicios
            const contenedor = document.getElementById('contenedor-servicios');
            if (contenedor) {
                contenedor.innerHTML = ""; // Limpiar actuales
                if (data.servicios && data.servicios.length > 0) {
                    data.servicios.forEach(srv => agregarBloqueConDatos(srv));
                }
            }
            alert("Vehículo y servicios cargados.");
        } else {
            alert("No se encontró el vehículo.");
        }
    } catch (e) {
        alert("Error al buscar.");
    }
}

// Función auxiliar para recrear los bloques de servicio al buscar
function agregarBloqueConDatos(srv) {
    const contenedor = document.getElementById('contenedor-servicios');
    const div = document.createElement('div');
    div.className = 'bloque-servicio';
    
    // Separar duración (ej: "6 meses" -> 6 y "meses")
    const d = srv.duracion.split(' ');
    const num = d[0] || 1;
    const tipo = d[1] || "meses";

    div.innerHTML = `
        <input type="text" class="srv-nombre" placeholder="Nombre del servicio" value="${srv.nombre}">
        <input type="date" class="srv-fecha" value="${srv.fecha}">
        <div class="duracion-group">
            <input type="number" class="srv-duracion-num" value="${num}" min="1">
            <select class="srv-duracion-tipo">
                <option value="meses" ${tipo === 'meses' ? 'selected' : ''}>Meses</option>
                <option value="años" ${tipo === 'años' ? 'selected' : ''}>Años</option>
            </select>
        </div>
        <div class="recordar-group">
            <input type="checkbox" class="srv-recordar" ${srv.recordar ? 'checked' : ''}>
            <label>Recordar</label>
        </div>
        <button type="button" class="btn-eliminar" onclick="this.parentElement.remove()">×</button>
    `;
    contenedor.appendChild(div);
}

// --- FUNCIÓN BORRAR ---
async function borrarDato() {
    const dominio = document.getElementById('p_dominio').value.trim().toUpperCase();
    if (!dominio) return alert("Ingresa un dominio.");
    if (confirm(`¿Eliminar permanentemente ${dominio}?`)) {
        try {
            await deleteDoc(doc(db, "vehiculos", dominio));
            alert("Eliminado.");
            location.reload();
        } catch (e) { alert("Error al borrar."); }
    }
}

// --- EXPOSICIÓN GLOBAL ---
window.guardarDato = guardarDato;
window.buscarParaModificar = buscarParaModificar;
window.borrarDato = borrarDato;