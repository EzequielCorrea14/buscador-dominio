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
