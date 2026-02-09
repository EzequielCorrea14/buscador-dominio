// 1. Configuración de Firebase (Reemplaza con tus datos de la consola de Firebase)
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/**
 * Función Principal de Búsqueda
 */
async function validarYBuscar() {
    const inputPatente = document.getElementById('patenteInput');
    const errorMsg = document.getElementById('errorMsg');
    const patente = inputPatente.value.trim().toUpperCase();

    // Resetear estado de error
    errorMsg.style.display = 'none';

    // 2. Validación de caracteres (Mínimo 6, Máximo 7)
    if (patente.length < 6 || patente.length > 7) {
        alert("Por favor, ingrese una patente válida (6 a 7 caracteres alfanuméricos).");
        return;
    }

    try {
        // 3. Consulta a Firestore
        // Buscamos el documento cuyo ID es la patente (Primary Key)
        const docRef = db.collection("vehiculos").doc(patente);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            // Si existe, guardamos los datos en sessionStorage para usarlos en la siguiente página
            const datosVehiculo = docSnap.data();
            datosVehiculo.dominio = patente; // Guardamos el ID también
            
            sessionStorage.setItem('vehiculoEncontrado', JSON.stringify(datosVehiculo));

            // Redirigir a la página de resultados
            window.location.href = "resultado.html";
        } else {
            // Si no existe, mostramos el error en pantalla
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error("Error al buscar en la base de datos:", error);
        alert("Ocurrió un error en la conexión. Intente más tarde.");
    }
}

// Permitir que el usuario presione "Enter" en el input para buscar
document.getElementById('patenteInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        validarYBuscar();
    }
});