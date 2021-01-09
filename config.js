import firebase from 'firebase';
require('@firebase/firestore');

var firebaseConfig = {
   apiKey: "AIzaSyAFcUditdxKJjVobcEAPR0eCpYTKEUgW3w",
   authDomain: "wily-app-7b9a4.firebaseapp.com",
   projectId: "wily-app-7b9a4",
   storageBucket: "wily-app-7b9a4.appspot.com",
   messagingSenderId: "962842092707",
   appId: "1:962842092707:web:9d017083b2ca9cbf9c4b16"
 };
 // Initialize Firebase
firebase.initializeApp(firebaseConfig);

export default firebase.firestore();