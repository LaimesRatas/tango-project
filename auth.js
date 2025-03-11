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
   * Siunčia el. pašto patvirtinimo laišką
   */
  sendVerificationEmail() {
    if (firebase.auth().currentUser && !firebase.auth().currentUser.emailVerified) {
      firebase.auth().currentUser.sendEmailVerification()
        .then(() => {
          alert('Patvirtinimo laiškas išsiųstas į jūsų el. paštą. Prašome patvirtinti savo paskyrą.');
        })
        .catch((error) => {
          console.error('Error sending verification email:', error);
          alert('Klaida siunčiant patvirtinimo laišką: ' + error.message);
        });
    }
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
    
    // Patikrinti slaptažodžio stiprumą
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const isStrongPassword = hasMinLength && hasUppercase && hasLowercase && hasNumbers && hasSpecialChar;
    
    if (!isStrongPassword) {
      let errorMsg = 'Slaptažodis per silpnas. Jis turi turėti:';
      if (!hasMinLength) errorMsg += '\n- bent 8 simbolius';
      if (!hasUppercase) errorMsg += '\n- bent vieną didžiąją raidę';
      if (!hasLowercase) errorMsg += '\n- bent vieną mažąją raidę';
      if (!hasNumbers) errorMsg += '\n- bent vieną skaičių';
      if (!hasSpecialChar) errorMsg += '\n- bent vieną specialų simbolį (!@#$%^&*(),.?":{}|<>)';
      
      alert(errorMsg);
      return;
    }
    
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        console.log('Registration successful');
        // Siunčiame patvirtinimo laišką
        this.sendVerificationEmail();
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
    
    // Patikriname, ar el. paštas patvirtintas
    if (user.emailVerified || user.providerData[0].providerId === 'google.com') {
      // Rodome aplikaciją, slepiame autentifikaciją
      document.getElementById('auth-container').style.display = 'none';
      document.getElementById('app-container').style.display = 'block';
      
      // Užkrauname vartotojo duomenis
      DataStore.loadUserData(user.uid);
    } else {
      // Jei el. paštas nepatvirtintas, rodome pranešimą
      alert('Prašome patvirtinti savo el. paštą prieš tęsiant. Patikrinkite savo el. pašto dėžutę.');
      this.sendVerificationEmail();
      
      // Atsijungiame, kol el. paštas nepatvirtintas
      this.signOut();
    }
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
