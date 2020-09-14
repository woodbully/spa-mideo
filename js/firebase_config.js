"use strict";

// ========== GLOBAL FIREBASE CONFIG ========== //
// Your web app's Firebase configuration
const _firebaseConfig = {
  apiKey: "AIzaSyAN2bXuS4IFALz24glQ1fG54T3IdfXrJ0E",
  authDomain: "mideo-cb05e.firebaseapp.com",
  databaseURL: "https://mideo-cb05e.firebaseio.com",
  projectId: "mideo-cb05e",
  storageBucket: "mideo-cb05e.appspot.com",
  messagingSenderId: "101809349141",
  appId: "1:101809349141:web:2f608f2b96ed7ad48a641c",
  measurementId: "G-FKPWJZB2DZ"
};
// Initialize Firebase and database references
firebase.initializeApp(_firebaseConfig);
const _db = firebase.firestore();