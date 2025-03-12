// Firebase konfigūracija
const firebaseConfig = {
  apiKey: "AIzaSyDTeH8iFH2bVxspr-E4fgABOu1ZrVPrIgc",
  authDomain: "tangochallenge-5b793.firebaseapp.com",
  projectId: "tangochallenge-5b793",
  storageBucket: "tangochallenge-5b793.firebasestorage.app",
  messagingSenderId: "124849282962",
  appId: "1:124849282962:web:5beecd57d9bf42c2932b4b",
  measurementId: "G-5H4YLH194H",
  databaseURL: "https://tangochallenge-5b793-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Klaidų gaudymas Firebase inicializacijai
try {
  // Patikriname ar jau inicializuota
  if (!firebase.apps.length) {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
  } else {
    console.log('Firebase already initialized');
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  
  // Parodome klaidos pranešimą vartotojui
  document.addEventListener('DOMContentLoaded', () => {
    const errorDiv = document.createElement('div');
    errorDiv.style.backgroundColor = '#f8d7da';
    errorDiv.style.color = '#721c24';
    errorDiv.style.padding = '15px';
    errorDiv.style.margin = '20px';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.textAlign = 'center';
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '10px';
    errorDiv.style.left = '10px';
    errorDiv.style.right = '10px';
    errorDiv.style.zIndex = '9999';
    
    errorDiv.innerHTML = `
      <h3>Klaida inicializuojant Firebase</h3>
      <p>${error.message || 'Nežinoma klaida'}</p>
      <p>Bandykite perkrauti puslapį arba patikrinkite interneto ryšį.</p>
      <button onclick="location.reload()" style="padding:5px 15px; background-color:#dc3545; color:white; border:none; border-radius:3px; cursor:pointer;">
        Perkrauti puslapį
      </button>
    `;
    
    document.body.appendChild(errorDiv);
  });
}
