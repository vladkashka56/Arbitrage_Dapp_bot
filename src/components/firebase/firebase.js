import firebase from 'firebase';

const firebaseConfig = {
  apiKey: "AIzaSyAK0eE1uA0Wd_seFD-1HtskoLMTs9ax3ko",
  authDomain: "web-app-89b45.firebaseapp.com",
  databaseURL: "https://web-app-89b45-default-rtdb.firebaseio.com",
  projectId: "web-app-89b45",
  storageBucket: "web-app-89b45.appspot.com",
  messagingSenderId: "593772222905",
  appId: "1:593772222905:web:3da0f03d9f80d80c20be68",
  measurementId: "G-VV90LPJ49L"
};

const app = firebase.initializeApp(firebaseConfig)

export const database = app.database()
export default app;
