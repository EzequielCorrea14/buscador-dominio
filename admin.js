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

// --- FUNCIÓN PARA AGREGAR CAMPOS VACÍOS ---
function agregarCampoServicio() {
    const contenedor = document.getElementById('contenedor-servicios');
    if (!contenedor) return;
    const nuevoDiv = document.createElement('div');
    nuevoDiv.className = 'bloque-servicio';
    nuevoDiv.innerHTML = `
        <input type="text" class="srv-nombre" placeholder="SERVICIO (Ej: Tratamiento)">
        <label class="label-admin">FECHA:</label>
        <input type="date" class="srv-fecha">
        <label class="label-admin">DURACIÓN:</label>
        <div class="row-flex">
            <select class="srv-duracion-num">
                ${Array.from({length: 12}, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('')}
            </select>
            <select class="srv-duracion-tipo">
                <option value="meses">Meses</option>
                <option value="años">Años</option>
            </select>
        </div>
        <div class="checkbox-container">
            <input type="checkbox" class="srv-recordar">
            <span>¿Desea un recordatorio?</span>
        </div>
        <button type="button" onclick="this.parentElement.remove()" style="background:transparent; color:#ff4d4d; border:none; cursor:pointer; margin-top:10px; font-weight:bold;">[ ELIMINAR X ]</button>
    `;
    contenedor.appendChild(nuevoDiv);
}

// --- BUSCAR Y CARGAR ---
async function buscarParaModificar() {
    const dominio = document.getElementById('p_dominio').value.trim().toUpperCase();
    if (!dominio) return alert("Ingresa un dominio");

    try {
        const docRef = doc(db, "vehiculos", dominio);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            document.getElementById('p_marca').value = data.marca || "";
            document.getElementById('p_modelo').value = data.modelo || "";
            document.getElementById('p_chasis').value = data.chasis || "";
            document.getElementById('p_nombre_cliente').value = data.nombreCliente || "";
            document.getElementById('p_telefono_cliente').value = data.telefonoCliente || "";
            document.getElementById('p_obs').value = data.observaciones || "";

            const contenedor = document.getElementById('contenedor-servicios');
            contenedor.innerHTML = ""; 

            if (data.servicios && data.servicios.length > 0) {
                data.servicios.forEach(srv => {
                    const div = document.createElement('div');
                    div.className = 'bloque-servicio';
                    const d = (srv.duracion || "1 meses").split(" ");
                    const num = d[0] || "1";
                    const tipo = d[1] || "meses";

                    div.innerHTML = `
                        <input type="text" class="srv-nombre" value="${srv.nombre || ''}">
                        <label class="label-admin">FECHA:</label>
                        <input type="date" class="srv-fecha" value="${srv.fecha || ''}">
                        <div class="row-flex">
                            <select class="srv-duracion-num">
                                ${Array.from({length: 12}, (_, i) => `<option value="${i+1}" ${i+1 == num ? 'selected' : ''}>${i+1}</option>`).join('')}
                            </select>
                            <select class="srv-duracion-tipo">
                                <option value="meses" ${tipo === 'meses' ? 'selected' : ''}>Meses</option>
                                <option value="años" ${tipo === 'años' ? 'selected' : ''}>Años</option>
                            </select>
                        </div>
                        <div class="checkbox-container">
                            <input type="checkbox" class="srv-recordar" ${srv.recordar ? 'checked' : ''}>
                            <span>¿Desea un recordatorio?</span>
                        </div>
                        <button type="button" onclick="this.parentElement.remove()" style="background:transparent; color:#ff4d4d; border:none; cursor:pointer; margin-top:10px; font-weight:bold;">[ ELIMINAR X ]</button>
                    `;
                    contenedor.appendChild(div);
                });
            } else {
                agregarCampoServicio();
            }
            alert("Vehículo cargado.");
        } else {
            alert("No se encontró esa patente.");
        }
    } catch (e) {
        console.error(e);
        alert("Error al buscar.");
    }
}

// --- GUARDAR (VERSIÓN OPTIMIZADA PARA EL ROBOT DE GITHUB) ---
async function guardarDato() {
    const dominio = document.getElementById('p_dominio').value.trim().toUpperCase();
    if (!dominio) return alert("Falta el dominio");

    const bloques = document.querySelectorAll('.bloque-servicio');
    let serviciosArray = [];

    bloques.forEach(bloque => {
        const nombreSrv = bloque.querySelector('.srv-nombre').value.trim();
        const fechaSrv = bloque.querySelector('.srv-fecha').value; 
        const duracionNum = parseInt(bloque.querySelector('.srv-duracion-num').value);
        const duracionTipo = bloque.querySelector('.srv-duracion-tipo').value;
        const recordar = bloque.querySelector('.srv-recordar').checked;

        if (nombreSrv && fechaSrv) {
            // Lógica para calcular vencimiento exacto sin errores de zona horaria
            const [year, month, day] = fechaSrv.split('-').map(Number);
            let fechaVencimiento = new Date(year, month - 1, day); 

            if (duracionTipo === "meses") {
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + duracionNum);
            } else {
                fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + duracionNum);
            }

            // Formatear a YYYY-MM-DD manualmente
            const y = fechaVencimiento.getFullYear();
            const m = String(fechaVencimiento.getMonth() + 1).padStart(2, '0');
            const d = String(fechaVencimiento.getDate()).padStart(2, '0');
            const fechaVencFinal = `${y}-${m}-${d}`;

            serviciosArray.push({
                nombre: nombreSrv,
                fecha: fechaSrv,
                duracion: `${duracionNum} ${duracionTipo}`,
                vencimiento: fechaVencFinal, // Este campo es el que busca el robot
                recordar: recordar
            });
        }
    });

    try {
        const btn = document.getElementById('btnGuardar');
        btn.innerText = "GUARDANDO...";
        btn.disabled = true;

        await setDoc(doc(db, "vehiculos", dominio), {
            marca: document.getElementById('p_marca').value,
            modelo: document.getElementById('p_modelo').value,
            chasis: document.getElementById('p_chasis').value,
            nombreCliente: document.getElementById('p_nombre_cliente').value,
            telefonoCliente: document.getElementById('p_telefono_cliente').value,
            observaciones: document.getElementById('p_obs').value,
            servicios: serviciosArray,
            timestamp: serverTimestamp()
        });

        alert("¡Guardado correctamente! Alerta programada en el sistema.");
        location.reload();
    } catch (e) {
        alert("Error al guardar.");
        console.error(e);
        const btn = document.getElementById('btnGuardar');
        btn.innerText = "GUARDAR DATOS";
        btn.disabled = false;
    }
}

// --- EXPORTAR TODO AL HTML ---
window.buscarParaModificar = buscarParaModificar;
window.guardarDato = guardarDato;
window.agregarCampoServicio = agregarCampoServicio;
window.logout = () => { if(confirm("¿Cerrar sesión?")) window.location.href="index.html"; };
window.borrarDato = async () => {
    const d = document.getElementById('p_dominio').value.toUpperCase();
    if(d && confirm("¿Borrar definitivamente?")) { 
        await deleteDoc(doc(db, "vehiculos", d)); 
        location.reload(); 
    }
};