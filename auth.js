/**
 * Autentifikacijos valdymo modulis
 * Atsakingas už vartotojų autentifikaciją ir sesijų valdymą
 */
const Auth = {
  // Kintamieji
  currentUser: null,
  
  /**
   * Inicializuoja autentifikacijos sistemą
   */
  init() {
    // Pridedame prisijungimo mygtukų klausytojus
    document.getElementById('login-with-google').addEventListener('click', () => {
      this.signInWithGoogle();
    });
    
    document.getElementById('login-with-email').addEventListener('click', () => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      this.signInWithEmail(email, password);
    });
    
    // Pridedame registracijos mygtuko klausytoją
    document.getElementById('register-with-email').addEventListener('click', () => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      this.registerWithEmail(email, password);
    });
    
    // Pridedame atsijungimo mygtuko veikimą
    document.getElementById('sign-out-btn').addEventListener('click', () => {
      this.signOut();
    });
    
    // Klausomės autentifikacijos būsenos
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        // Vartotojas prisijungęs
        this.currentUser = user;
        this.onUserSignedIn(user);
      } else {
        // Vartotojas neprisijungęs
        this.currentUser = null;
        this.onUserSignedOut();
      }
    });
    
    console.log('Auth module initialized');
  },
  
  /**
   * Prisijungimas su Google
   */
  signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then((result) => {
        console.log('Google sign in successful');
      })
      .catch((error) => {
        console.error('Google sign in error:', error);
        alert('Klaida prisijungiant su Google: ' + error.message);
      });
  },
  
  /**
   * Prisijungimas su el. paštu ir slaptažodžiu
   */
  signInWithEmail(email, password) {
    if (!email || !password) {
      alert('Įveskite el. paštą ir slaptažodį');
      return;
    }
    
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        console.log('Email sign in successful');
      })
      .catch((error) => {
        console.error('Email sign in error:', error);
        alert('Klaida prisijungiant: ' + error.message);
      });
  },
  
  /**
   * Registracija su el. paštu ir slaptažodžiu
   */
  registerWithEmail(email, password) {
    if (!email || !password) {
      alert('Įveskite el. paštą ir slaptažodį');
      return;
    }
    
    if (password.length < 6) {
      alert('Slaptažodis turi būti bent 6 simbolių ilgio');
      return;
    }
    
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        console.log('Registration successful');
      })
      .catch((error) => {
        console.error('Registration error:', error);
        alert('Klaida registruojantis: ' + error.message);
      });
  },
  
  /**
   * Autorizuoto vartotojo apdorojimas
   * @param {Object} user - Prisijungusio vartotojo objektas
   */
  onUserSignedIn(user) {
    console.log('Prisijungęs vartotojas:', user.displayName || user.email);
    
    // Rodome aplikaciją, slepiame autentifikaciją
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    
    // Užkrauname vartotojo duomenis
    DataStore.loadUserData(user.uid);
  },
  
  /**
   * Neautorizuoto vartotojo apdorojimas
   */
  onUserSignedOut() {
    console.log('Vartotojas atsijungęs');
    
    // Rodome autentifikaciją, slepiame aplikaciją
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('app-container').style.display = 'none';
  },
  
  /**
   * Atsijungimas iš sistemos
   */
  signOut() {
    firebase.auth().signOut()
      .then(() => {
        console.log('Sėkmingai atsijungta');
      })
      .catch(error => {
        console.error('Klaida atsijungiant:', error);
      });
  },
  
  /**
   * Gauna dabartinio prisijungusio vartotojo ID
   * @returns {string|null} - Vartotojo ID arba null
   */
  getCurrentUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }
};