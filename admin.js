import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBo8q4_fFxiFp9jfkRDL5Fbg1KURLutIfg",
  authDomain: "app-patentes.firebaseapp.com",
  projectId: "app-patentes",
  storageBucket: "app-patentes.firebasestorage.app",
  messagingSenderId: "831225954806",
  appId: "1:831225954806:web:175d36ddb3c1b8305f87d7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- CERRAR SESIÓN ---
function logout() {
    if (confirm("¿Desea salir del panel de administración?")) {
        window.location.href = "index.html";
    }
}

// --- BUSCAR Y CARGAR (Para ver y modificar) ---
async function buscarParaModificar() {
    const dominioInput = document.getElementById('p_dominio');
    const dominio = dominioInput.value.trim().toUpperCase();
    if (!dominio) return alert("Ingresa un dominio");

    try {
        console.log("Buscando datos para:", dominio);
        const docSnap = await getDoc(doc(db, "vehiculos", dominio));
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // 1. Llenar campos básicos (con protección si el dato no existe)
            document.getElementById('p_marca').value = data.marca || "";
            document.getElementById('p_modelo').value = data.modelo || "";
            document.getElementById('p_chasis').value = data.chasis || "";
            document.getElementById('p_nombre_cliente').value = data.nombreCliente || "";
            document.getElementById('p_telefono_cliente').value = data.telefonoCliente || "";
            document.getElementById('p_obs').value = data.observaciones || "";

            // 2. Llenar Servicios
            const contenedor = document.getElementById('contenedor-servicios');
            if (contenedor) {
                contenedor.innerHTML = ""; // Limpiar antes de cargar
                
                if (data.servicios && Array.isArray(data.servicios)) {
                    data.servicios.forEach(srv => {
                        try {
                            const div = document.createElement('div');
                            div.className = 'bloque-servicio';
                            
                            // Separar duración con seguridad (evita el error si el formato es raro)
                            const duracionTexto = srv.duracion || "1 meses";
                            const duracionPartes = duracionTexto.split(" ");
                            const num = duracionPartes[0] || "1";
                            const tipo = duracionPartes[1] || "meses";

                            div.innerHTML = `
                                <input type="text" class="srv-nombre" placeholder="Servicio" value="${srv.nombre || ''}">
                                <input type="date" class="srv-fecha" value="${srv.fecha || ''}">
                                <input type="number" class="srv-duracion-num" value="${num}">
                                <select class="srv-duracion-tipo">
                                    <option value="meses" ${tipo === 'meses' ? 'selected' : ''}>Meses</option>
                                    <option value="años" ${tipo === 'años' ? 'selected' : ''}>Años</option>
                                </select>
                                <label><input type="checkbox" class="srv-recordar" ${srv.recordar ? 'checked' : ''}> Recordar</label>
                                <button type="button" onclick="this.parentElement.remove()">X</button>
                            `;
                            contenedor.appendChild(div);
                        } catch (errInner) {
                            console.error("Error procesando un servicio individual:", errInner);
                        }
                    });
                }
            }
            alert("Vehículo y servicios cargados correctamente.");
        } else {
            alert("No se encontró el vehículo.");
        }
    } catch (e) {
        console.error("Error detallado en búsqueda:", e);
        alert("Error al buscar: revisa la consola (F12) para más detalles.");
    }
}

// --- GUARDAR / ACTUALIZAR ---
async function guardarDato() {
    const btn = document.getElementById('btnGuardar');
    const dominio = document.getElementById('p_dominio').value.trim().toUpperCase();
    
    // Capturar datos básicos
    const marca = document.getElementById('p_marca').value.trim();
    const modelo = document.getElementById('p_modelo').value.trim();
    const chasis = document.getElementById('p_chasis').value.trim();
    const nombreCliente = document.getElementById('p_nombre_cliente').value.trim();
    const telefonoCliente = document.getElementById('p_telefono_cliente').value.trim();
    const observaciones = document.getElementById('p_obs').value.trim();

    // Capturar servicios del panel
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

        alert("¡Guardado correctamente!");
        location.reload();
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "GUARDAR / ACTUALIZAR";
    }
}

// --- BORRAR ---
async function borrarDato() {
    const dominio = document.getElementById('p_dominio').value.trim().toUpperCase();
    if (!dominio) return alert("Ingrese dominio");
    if (confirm("¿Borrar definitivamente?")) {
        await deleteDoc(doc(db, "vehiculos", dominio));
        alert("Eliminado");
        location.reload();
    }
}

// --- EXPOSICIÓN AL HTML ---
window.guardarDato = guardarDato;
window.buscarParaModificar = buscarParaModificar;
window.borrarDato = borrarDato;
window.logout = logout;