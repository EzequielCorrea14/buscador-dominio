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
    const patente = inputPatente.value.trim().toUpperCase();

    // Resetear estado de error
    if (errorMsg) errorMsg.style.display = 'none';

    // Validación de caracteres (Mínimo 6, Máximo 7)
    if (patente.length < 6 || patente.length > 7) {
        alert("Por favor, ingrese una patente válida (6 a 7 caracteres alfanuméricos).");
        return;
    }

    try {
        // Consulta a Firestore usando la sintaxis COMPAT
        const docRef = db.collection("vehiculos").doc(patente);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const datosVehiculo = docSnap.data();
            datosVehiculo.dominio = patente; 
            
            sessionStorage.setItem('vehiculoEncontrado', JSON.stringify(datosVehiculo));

            // Asegúrate de que este archivo se llame exactamente "resultado.html"
            window.location.href = "./resultado.html";
        } else {
            if (errorMsg) errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error("Error al buscar en la base de datos:", error);
        alert("Ocurrió un error en la conexión. Verifique la consola (F12).");
    }
}

// Evento para la tecla Enter
document.getElementById('patenteInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        validarYBuscar();
    }
});