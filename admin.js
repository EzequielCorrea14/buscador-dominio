// 1. Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBo8q4_fFxiFp9jfkRDL5Fbg1KURLutIfg",
    authDomain: "app-patentes.firebaseapp.com",
    projectId: "app-patentes",
    storageBucket: "app-patentes.firebasestorage.app",
    messagingSenderId: "831225954806",
    appId: "1:831225954806:web:175d36ddb3c1b8305f87d7"
};

// 2. Inicialización UNIFICADA
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// 3. Verificar si el admin está logueado
auth.onAuthStateChanged(user => {
    if (!user) {
        if (!window.location.pathname.includes("login.html")) {
            window.location.href = "login.html";
        }
    }
});

// 4. Función para Guardar o Actualizar Datos
async function guardarDato() {
    const btn = document.getElementById('btnGuardar');
    
    const dominio = document.getElementById('p_dominio').value.trim().toUpperCase();
    const marca = document.getElementById('p_marca').value.trim();
    const modelo = document.getElementById('p_modelo').value.trim();
    const chasis = document.getElementById('p_chasis').value.trim();
    const fecha = document.getElementById('p_fecha').value;
    const servicio = document.getElementById('p_servicio').value.trim();
    const observaciones = document.getElementById('p_obs').value.trim();

    if (dominio.length < 6) {
        alert("El dominio debe tener al menos 6 caracteres.");
        return;
    }

    try {
        btn.disabled = true;
        btn.innerText = "PROCESANDO...";

        await db.collection("vehiculos").doc(dominio).set({
            marca: marca,
            modelo: modelo,
            chasis: chasis,
            fecha: fecha,
            servicio: servicio,
            observaciones: observaciones,
            ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("¡Vehículo guardado/actualizado con éxito!");
        limpiarFormulario();
        
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Error al guardar: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "GUARDAR EN BASE DE DATOS";
    }
}

// 5. NUEVA FUNCIÓN: Buscar para Editar
async function buscarParaModificar() {
    const dominio = document.getElementById('p_dominio').value.trim().toUpperCase();
    
    if (!dominio) {
        alert("Ingresa un dominio para buscar.");
        return;
    }

    try {
        const doc = await db.collection("vehiculos").doc(dominio).get();
        if (doc.exists) {
            const data = doc.data();
            // Rellenamos los campos con la info de la base de datos
            document.getElementById('p_marca').value = data.marca || "";
            document.getElementById('p_modelo').value = data.modelo || "";
            document.getElementById('p_chasis').value = data.chasis || "";
            document.getElementById('p_fecha').value = data.fecha || "";
            document.getElementById('p_servicio').value = data.servicio || "";
            document.getElementById('p_obs').value = data.observaciones || "";
            alert("Datos cargados. Modifica lo que necesites y presiona GUARDAR.");
        } else {
            alert("No se encontró ningún vehículo con esa patente.");
        }
    } catch (error) {
        console.error("Error al buscar:", error);
        alert("Error al buscar datos.");
    }
}

// 6. NUEVA FUNCIÓN: Borrar Dato
async function borrarDato() {
    const dominio = document.getElementById('p_dominio').value.trim().toUpperCase();
    
    if (!dominio) {
        alert("Ingresa el dominio del vehículo que deseas borrar.");
        return;
    }

    const confirmar = confirm(`¿Estás seguro de que deseas eliminar permanentemente el vehículo ${dominio}?`);
    
    if (confirmar) {
        try {
            await db.collection("vehiculos").doc(dominio).delete();
            alert("Vehículo eliminado correctamente.");
            limpiarFormulario();
        } catch (error) {
            console.error("Error al borrar:", error);
            alert("Error al intentar eliminar.");
        }
    }
}

// 7. Función para Limpiar el Formulario
function limpiarFormulario() {
    document.querySelectorAll('input, textarea').forEach(el => el.value = "");
}

// 8. Función de Logout
function logout() {
    auth.signOut().then(() => {
        window.location.href = "login.html";
    });
}

// 9. Control de Video para móviles
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('bg-video');
    if (video) {
        video.play().catch(error => {
            console.log("Autoplay bloqueado.");
        });
    }
});