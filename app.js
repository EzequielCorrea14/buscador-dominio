// CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// REGEX PATENTES ARGENTINAS
const regexAR = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;

// BUSCAR DOMINIO
function buscarDominio() {
  const dominio = dominioInput.value.toUpperCase();
  error.innerText = "";

  if (!regexAR.test(dominio)) {
    error.innerText = "Dominio inválido";
    return;
  }

  db.collection("vehiculos").doc(dominio).get().then(doc => {
    if (!doc.exists) {
      error.innerText = "Su dominio no está en nuestra base";
      return;
    }

    const d = doc.data();
    searchCard.classList.add("hidden");
    resultCard.classList.remove("hidden");

    rDominio.innerText = "Dominio: " + d.dominio;
    rChasis.innerText = "Chasis: " + d.chasis;
    rFecha.innerText = "Fecha: " + d.fecha;
    rServicio.innerText = "Servicio: " + d.servicio;
    rObs.innerText = "Observaciones: " + d.observaciones;
  });
}

// MOSTRAR LOGIN
function mostrarLogin() {
  searchCard.classList.add("hidden");
  loginCard.classList.remove("hidden");
}

// LOGIN ADMIN
function login() {
  loginError.innerText = "";
  auth.signInWithEmailAndPassword(email.value, password.value)
    .then(() => {
      loginCard.classList.add("hidden");
      adminCard.classList.remove("hidden");
    })
    .catch(() => loginError.innerText = "Credenciales inválidas");
}

// LOGOUT
function logout() {
  auth.signOut();
  adminCard.classList.add("hidden");
  searchCard.classList.remove("hidden");
}

// GUARDAR / ACTUALIZAR
function guardarDominio() {
  adminError.innerText = "";
  adminSuccess.innerText = "";

  const dom = aDominio.value.toUpperCase();
  if (!regexAR.test(dom)) {
    adminError.innerText = "Dominio inválido";
    return;
  }

  db.collection("vehiculos").doc(dom).set({
    dominio: dom,
    chasis: aChasis.value,
    fecha: aFecha.value,
    servicio: aServicio.value,
    observaciones: aObs.value
  }).then(() => {
    adminSuccess.innerText = "Guardado correctamente";
  });
}

const firebaseConfig = {
  apiKey: "AIzaSyBo8q4_fFxiFp9jfkRDL5Fbg1KURLutIfg",
  authDomain: "app-patentes.firebaseapp.com",
  projectId: "app-patentes",
  storageBucket: "app-patentes.firebasestorage.app",
  messagingSenderId: "831225954806",
  appId: "1:831225954806:web:175d36ddb3c1b8305f87d7"
};

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_DOMINIO",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_BUCKET",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();


function loginAdmin(email, password) {
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Admin logueado");
      mostrarPanelAdmin();
    })
    .catch(err => {
      alert("Error: " + err.message);
    });
}


function logoutAdmin() {
  auth.signOut();
}


auth.onAuthStateChanged(user => {
  const adminPanel = document.getElementById("adminPanel");

  if (user) {
    adminPanel.style.display = "block";
  } else {
    adminPanel.style.display = "none";
  }
});


function validarDominio(dominio) {
  const regex = /^[A-Z0-9]{6,7}$/;
  return regex.test(dominio);
}


function guardarPatente() {

  const dominio = document.getElementById("dominio").value.toUpperCase();
  const chasis = document.getElementById("chasis").value;
  const fecha = document.getElementById("fecha").value;
  const servicio = document.getElementById("servicio").value;
  const observaciones = document.getElementById("observaciones").value;

  if (!validarDominio(dominio)) {
    alert("Patente inválida");
    return;
  }

  db.collection("patentes").doc(dominio).set({
    dominio: dominio,
    chasis: chasis,
    fecha: fecha,
    servicio: servicio,
    observaciones: observaciones
  })
  .then(() => {
    alert("Patente guardada correctamente");
  })
  .catch(error => {
    alert("Error: " + error.message);
  });
}

