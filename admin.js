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

// --- FUNCIÓN PARA AGREGAR CAMPOS VACÍOS (NUEVO SERVICIO) ---
function agregarCampoServicio() {
    const contenedor = document.getElementById('contenedor-servicios');
    if (!contenedor) return;
    const nuevoDiv = document.createElement('div');
    nuevoDiv.className = 'bloque-servicio nuevo-ingreso'; 
    nuevoDiv.innerHTML = `
        <div class="header-servicio"><strong>NUEVO SERVICIO</strong></div>
        <input type="text" class="srv-nombre" placeholder="SERVICIO (Ej: Tratamiento Cerámico)">
        <label class="label-admin">FECHA REALIZADO:</label>
        <input type="date" class="srv-fecha">
        <label class="label-admin">DURACIÓN HASTA PRÓXIMO AVISO:</label>
        <div class="row-flex">
            <select class="srv-duracion-num">
                ${Array.from({length: 12}, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('')}
            </select>
            <select class="srv-duracion-tipo">
                <option value="meses">Meses</option>
                <option value="años">Años</option>
            </select>
        </div>
        <textarea class="srv-obs" placeholder="Observaciones específicas de este trabajo..." style="width:100%; margin-top:10px; font-size:12px;"></textarea>
        <div class="checkbox-container">
            <input type="checkbox" class="srv-recordar" checked>
            <span>¿Activar recordatorio de 30 días?</span>
        </div>
        <button type="button" onclick="this.parentElement.remove()" style="background:transparent; color:#ff4d4d; border:none; cursor:pointer; margin-top:10px; font-weight:bold;">[ ELIMINAR X ]</button>
    `;
    contenedor.appendChild(nuevoDiv);
}

// --- BUSCAR Y CARGAR (CON HISTORIAL) ---
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
                // Hacemos una copia para no alterar el original y lo revertimos para mostrar el más nuevo arriba
                const serviciosParaMostrar = [...data.servicios].reverse();

                serviciosParaMostrar.forEach((srv) => {
                    const div = document.createElement('div');
                    const hoy = new Date().toISOString().split('T')[0];
                    const esVencido = srv.vencimiento < hoy;
                    div.className = `bloque-servicio ${esVencido ? 'modo-historial' : ''}`;

                    const d = (srv.duracion || "1 meses").split(" ");
                    const num = d[0] || "1";
                    const tipo = d[1] || "meses";

                    div.innerHTML = `
                        <div class="header-servicio">
                            <strong>Servicio Realizado el ${srv.fecha || 'Sin fecha'}</strong>
                            ${esVencido ? '<span style="color:red; font-size:10px;">[VENCIDO]</span>' : '<span style="color:green; font-size:10px;">[VIGENTE]</span>'}
                        </div>
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
                        <textarea class="srv-obs" placeholder="Sin observaciones..." style="width:100%; margin-top:10px; font-size:12px;">${srv.observaciones || ''}</textarea>
                        <div class="checkbox-container">
                            <input type="checkbox" class="srv-recordar" ${srv.recordar ? 'checked' : ''}>
                            <span>Recordatorio activado</span>
                        </div>
                        <button type="button" onclick="this.parentElement.remove()" style="background:transparent; color:#ff4d4d; border:none; cursor:pointer; margin-top:10px; font-weight:bold;">[ ELIMINAR DEL HISTORIAL ]</button>
                    `;
                    contenedor.appendChild(div);
                });
            } else {
                agregarCampoServicio();
            }
            alert("Vehículo y historial cargados.");
        } else {
            alert("No se encontró esa patente.");
        }
    } catch (e) {
        console.error(e);
        alert("Error al buscar.");
    }
}

// --- GUARDAR (CON VALIDACIONES ANTICHOQUE) ---
async function guardarDato() {
    const dominio = document.getElementById('p_dominio')?.value.trim().toUpperCase();
    if (!dominio) return alert("Falta el dominio");

    const bloques = document.querySelectorAll('.bloque-servicio');
    let serviciosArray = [];

    bloques.forEach(bloque => {
        // Usamos ?.value para que si no encuentra el input, devuelva 'undefined' en lugar de un error
        const nombreSrv = bloque.querySelector('.srv-nombre')?.value?.trim();
        const fechaSrv = bloque.querySelector('.srv-fecha')?.value; 
        const duracionNum = parseInt(bloque.querySelector('.srv-duracion-num')?.value || "1");
        const duracionTipo = bloque.querySelector('.srv-duracion-tipo')?.value || "meses";
        const recordar = bloque.querySelector('.srv-recordar')?.checked || false;
        const obsSrv = bloque.querySelector('.srv-obs')?.value || ""; // ESTA ES LA LÍNEA 137

        if (nombreSrv && fechaSrv) {
            try {
                const [year, month, day] = fechaSrv.split('-').map(Number);
                let fechaVencimiento = new Date(year, month - 1, day); 

                if (duracionTipo === "meses") {
                    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + duracionNum);
                } else {
                    fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + duracionNum);
                }

                const y = fechaVencimiento.getFullYear();
                const m = String(fechaVencimiento.getMonth() + 1).padStart(2, '0');
                const d = String(fechaVencimiento.getDate()).padStart(2, '0');
                const fechaVencFinal = `${y}-${m}-${d}`;

                serviciosArray.push({
                    nombre: nombreSrv,
                    fecha: fechaSrv,
                    duracion: `${duracionNum} ${duracionTipo}`,
                    vencimiento: fechaVencFinal,
                    recordar: recordar,
                    observaciones: obsSrv
                });
            } catch (err) {
                console.warn("Error procesando un bloque de servicio, se omitirá:", err);
            }
        }
    });

    try {
        const btn = document.getElementById('btnGuardar');
        if (btn) {
            btn.innerText = "GUARDANDO...";
            btn.disabled = true;
        }

        await setDoc(doc(db, "vehiculos", dominio), {
            marca: document.getElementById('p_marca')?.value || "",
            modelo: document.getElementById('p_modelo')?.value || "",
            chasis: document.getElementById('p_chasis')?.value || "",
            nombreCliente: document.getElementById('p_nombre_cliente')?.value || "",
            telefonoCliente: document.getElementById('p_telefono_cliente')?.value || "",
            observaciones: document.getElementById('p_obs')?.value || "",
            servicios: serviciosArray,
            timestamp: serverTimestamp()
        });

        alert("¡Datos y historial guardados con éxito!");
        location.reload();
    } catch (e) {
        alert("Error al guardar en Firebase.");
        console.error(e);
        const btn = document.getElementById('btnGuardar');
        if (btn) {
            btn.innerText = "GUARDAR DATOS";
            btn.disabled = false;
        }
    }
}

// --- EXPORTAR ---
window.buscarParaModificar = buscarParaModificar;
window.guardarDato = guardarDato;
window.agregarCampoServicio = agregarCampoServicio;
window.logout = () => { if(confirm("¿Cerrar sesión?")) window.location.href="index.html"; };
window.borrarDato = async () => {
    const d = document.getElementById('p_dominio').value.toUpperCase();
    if(d && confirm("¿Borrar definitivamente todo el historial de este auto?")) { 
        await deleteDoc(doc(db, "vehiculos", d)); 
        location.reload(); 
    }
};