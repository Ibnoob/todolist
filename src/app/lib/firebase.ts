import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';


// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
  apiKey: 'AIzaSyC3iHGTjR_Sx4w4GUDKUpN2IgOIQENkH9k',
  authDomain: 'todolist-a2b1c.firebaseapp.com',
  projectId: 'todolist-a2b1c',
  storageBucket: 'todolist-a2b1c.firebasestorage.app',
  messagingSenderId: '628780013468',
  appId: '1:628780013468:web:b47a1916dfaec5ca411a59'
};


// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


export { db };


