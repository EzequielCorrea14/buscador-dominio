const firebaseConfig = { /* ...tus datos... */ };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Verificar si el admin está logueado
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "login.html"; // Si no hay usuario, fuera.
    }
});

async function guardarDato() {
    const dominio = document.getElementById('p_dominio').value.trim().toUpperCase();
    const chasis = document.getElementById('p_chasis').value.trim();
    const fecha = document.getElementById('p_fecha').value;
    const servicio = document.getElementById('p_servicio').value.trim();
    const observaciones = document.getElementById('p_obs').value.trim();

    if (dominio.length < 6) {
        alert("Dominio inválido");
        return;
    }

    try {
        const btn = document.getElementById('btnGuardar');
        btn.disabled = true;
        btn.innerText = "GUARDANDO...";

        // Usamos el dominio como ID del documento (Primary Key)
        await db.collection("vehiculos").doc(dominio).set({
            chasis: chasis,
            fecha: fecha,
            servicio: servicio,
            observaciones: observaciones
        });

        alert("¡Datos guardados con éxito!");
        // Limpiar formulario
        document.querySelectorAll('input, textarea').forEach(el => el.value = "");
        
    } catch (error) {
        console.error("Error:", error);
        alert("Error al guardar");
    } finally {
        const btn = document.getElementById('btnGuardar');
        btn.disabled = false;
        btn.innerText = "GUARDAR EN BASE DE DATOS";
    }
}

function logout() {
    auth.signOut();
}