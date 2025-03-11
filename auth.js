/**
 * Autentifikacijos valdymo modulis
 * Atsakingas už vartotojų autentifikaciją ir sesijų valdymą
 */
const Auth = {
  // Kintamieji
  currentUser: null,
  ui: null,
  
  /**
   * Inicializuoja autentifikacijos sistemą
   */
  init() {
    // Firebase UI konfigūracija
    const uiConfig = {
      signInSuccessUrl: '/',
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID
      ],
      tosUrl: '/',
      privacyPolicyUrl: '/',
      callbacks: {
        signInSuccessWithAuthResult: (authResult) => {
          // Sėkmingas prisijungimas
          console.log('Sėkmingai prisijungta:', authResult.user.displayName);
          return false; // Neperadresuojame
        }
      }
    };
    
    // Inicializuojame Firebase UI
    this.ui = new firebaseui.auth.AuthUI(firebase.auth());
    this.ui.start('#firebaseui-auth-container', uiConfig);
    
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
    
    // Pridedame atsijungimo mygtuko veikimą
    document.getElementById('sign-out-btn').addEventListener('click', () => {
      this.signOut();
    });
    
    console.log('Auth module initialized');
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