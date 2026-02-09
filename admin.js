// 1. Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBo8q4_fFxiFp9jfkRDL5Fbg1KURLutIfg",
    authDomain: "app-patentes.firebaseapp.com",
    projectId: "app-patentes",
    storageBucket: "app-patentes.firebasestorage.app",
    messagingSenderId: "831225954806",
    appId: "1:831225954806:web:175d36ddb3c1b8305f87d7"
};

// 2. Inicialización UNIFICADA (Evita errores de ReferenceError)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// 3. Verificar si el admin está logueado
auth.onAuthStateChanged(user => {
    if (!user) {
        // Si no hay usuario y no estamos ya en el login, redirigir
        if (!window.location.pathname.includes("login.html")) {
            window.location.href = "login.html";
        }
    }
});

// 4. Función para Guardar Datos
async function guardarDato() {
    const domInput = document.getElementById('p_dominio');
    const btn = document.getElementById('btnGuardar');

    const dominio = domInput.value.trim().toUpperCase();
    const chasis = document.getElementById('p_chasis').value.trim();
    const fecha = document.getElementById('p_fecha').value;
    const servicio = document.getElementById('p_servicio').value.trim();
    const observaciones = document.getElementById('p_obs').value.trim();

    // Validación básica
    if (dominio.length < 6) {
        alert("El dominio debe tener al menos 6 caracteres.");
        return;
    }

    try {
        btn.disabled = true;
        btn.innerText = "GUARDANDO...";

        // Guardamos en la colección "vehiculos" usando el dominio como ID
        await db.collection("vehiculos").doc(dominio).set({
            chasis: chasis,
            fecha: fecha,
            servicio: servicio,
            observaciones: observaciones,
            ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("¡Datos guardados con éxito!");
        
        // Limpiar formulario
        document.querySelectorAll('input, textarea').forEach(el => el.value = "");
        
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Error al guardar: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "GUARDAR EN BASE DE DATOS";
    }
}

// 5. Función de Logout
function logout() {
    auth.signOut().then(() => {
        window.location.href = "login.html";
    });
}