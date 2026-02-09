// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBo8q4_fFxiFp9jfkRDL5Fbg1KURLutIfg",
  authDomain: "app-patentes.firebaseapp.com",
  projectId: "app-patentes",
  storageBucket: "app-patentes.firebasestorage.app",
  messagingSenderId: "831225954806",
  appId: "1:831225954806:web:175d36ddb3c1b8305f87d7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

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