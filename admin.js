// ... (Toda tu configuración de Firebase inicial se mantiene igual)

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

        // 1. Guardar en Firebase (Para la consulta del cliente)
        await db.collection("vehiculos").doc(dominio).set({
            marca, modelo, chasis, nombreCliente, telefonoCliente,
            observaciones, servicios: serviciosArray,
            ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 2. ENVIAR A GOOGLE SHEETS (Para tus recordatorios)
        // Solo enviamos si hay servicios con "Recordar" activado
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
        console.error("Error:", error);
        alert("Error: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "GUARDAR / ACTUALIZAR";
    }
}

// NUEVA FUNCIÓN: Conexión con Make.com
async function enviarAGoogleSheets(datos) {
    // REEMPLAZA ESTE LINK con el que te dará Make en el siguiente paso
    const WEBHOOK_URL = "https://hook.us2.make.com/yout8thq1edp47ncqm1j35235c561f91"; 
    
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
    } catch (e) {
        console.warn("No se pudo enviar a la planilla, pero se guardó en Firebase.");
    }
}

// ... (Resto de tus funciones buscarParaModificar, borrarDato, etc. se mantienen igual)