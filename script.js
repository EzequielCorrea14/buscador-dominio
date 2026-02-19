// Configuración de Firebase (Se mantiene igual)
const firebaseConfig = {
    apiKey: "AIzaSyBo8q4_fFxiFp9jfkRDL5Fbg1KURLutIfg",
    authDomain: "app-patentes.firebaseapp.com",
    projectId: "app-patentes",
    storageBucket: "app-patentes.firebasestorage.app",
    messagingSenderId: "831225954806",
    appId: "1:831225954806:web:175d36ddb3c1b8305f87d7"
};

// Inicialización UNIFICADA
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

/**
 * Función Principal de Búsqueda
 */
async function validarYBuscar() {
    const inputPatente = document.getElementById('patenteInput');
    const errorMsg = document.getElementById('errorMsg');
    const btn = document.getElementById('btnBuscar');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    
    const patente = inputPatente.value.trim().toUpperCase();

    if (patente.length < 6 || patente.length > 7) {
        alert("Por favor, ingrese una patente válida.");
        return;
    }

    // --- ACTIVAR CARGANDO ---
    btn.disabled = true;
    if(btnText) btnText.innerText = "BUSCANDO";
    if(spinner) spinner.style.display = "inline-block";
    errorMsg.style.display = 'none'; 

    try {
        const docRef = db.collection("vehiculos").doc(patente);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();
            
            // --- CORRECCIÓN CLAVE AQUÍ ---
            // Guardamos todo el objeto, incluyendo el nuevo array de 'servicios'
            const vehiculoParaGuardar = {
                dominio: patente,
                marca: data.marca || "---",
                modelo: data.modelo || "---",
                chasis: data.chasis || "---",
                observaciones: data.observaciones || "---",
                // Si existen servicios, los pasamos, si no, pasamos un array vacío
                servicios: data.servicios || [] 
            };

            sessionStorage.setItem('vehiculoEncontrado', JSON.stringify(vehiculoParaGuardar));
            window.location.href = "resultado.html";
        } else {
            errorMsg.style.display = 'block';
            resetBtn();
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión con la base de datos.");
        resetBtn();
    }

    function resetBtn() {
        btn.disabled = false;
        if(btnText) btnText.innerText = "BUSCAR";
        if(spinner) spinner.style.display = "none";
    }
}

// Evento para la tecla Enter (Se mantiene igual)
document.getElementById('patenteInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        validarYBuscar();
    }
});

// Control de video y carga inicial (Se mantiene igual)
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('bg-video');
    if (video) {
        video.play().catch(error => {
            console.log("Autoplay bloqueado");
        });
    }
});