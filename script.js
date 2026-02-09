// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBo8q4_fFxiFp9jfkRDL5Fbg1KURLutIfg",
    authDomain: "app-patentes.firebaseapp.com",
    projectId: "app-patentes",
    storageBucket: "app-patentes.firebasestorage.app",
    messagingSenderId: "831225954806",
    appId: "1:831225954806:web:175d36ddb3c1b8305f87d7"
};

/**
 * INICIALIZACIÓN CORRECTA
 * He eliminado la línea que causaba el error ReferenceError
 */
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
    btnText.innerText = "BUSCANDO";
    spinner.style.display = "inline-block";

    try {
        const docRef = db.collection("vehiculos").doc(patente);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const datosVehiculo = docSnap.data();
            datosVehiculo.dominio = patente; 
            sessionStorage.setItem('vehiculoEncontrado', JSON.stringify(datosVehiculo));
            window.location.href = "resultado.html";
        } else {
            errorMsg.style.display = 'block';
            // Resetear botón si no hay resultados
            resetBtn();
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión.");
        resetBtn();
    }

    // Función interna para volver el botón a su estado normal
    function resetBtn() {
        btn.disabled = false;
        btnText.innerText = "BUSCAR";
        spinner.style.display = "none";
    }
}

// Evento para la tecla Enter
document.getElementById('patenteInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        validarYBuscar();
    }
});