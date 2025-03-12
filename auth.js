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
      
      // Patikriname, ar reikalinga migruoti duomenis
      this.migrateLocalDataToFirebase(user.uid).then(() => {
        // Užkrauname vartotojo duomenis
        DataStore.loadUserData(user.uid);
      });
    } else {
      // Jei el. paštas nepatvirtintas, rodome pranešimą
      alert('Prašome patvirtinti savo el. paštą prieš tęsiant. Patikrinkite savo el. pašto dėžutę.');
      this.sendVerificationEmail();
      
      // Atsijungiame, kol el. paštas nepatvirtintas
      this.signOut();
    }
  },
  
  /**
   * Migruoja lokalius duomenis į Firebase, jei jie dar nebuvo migruoti
   * @param {string} userId - Vartotojo ID
   * @returns {Promise} - Pažadas, kuris įvykdomas, kai migracija baigiama
   */
  async migrateLocalDataToFirebase(userId) {
    console.log('Checking if data migration is needed...');
    
    try {
      // Patikriname, ar jau yra duomenų Firebase
      const userRef = firebase.database().ref('users/' + userId);
      const snapshot = await userRef.once('value');
      const userData = snapshot.val() || {};
      
      const hasFirebaseData = userData.videos && userData.videos.length > 0;
      
      // Gauname lokalius duomenis
      const videosData = localStorage.getItem('tangoVideos');
      const completedData = localStorage.getItem('tangoCompletedIds');
      
      const hasLocalData = videosData || completedData;
      
      // Jei Firebase neturi duomenų, bet lokaliai yra, atliekame migraciją
      if (!hasFirebaseData && hasLocalData) {
        console.log('Firebase duomenų nerasta, bet lokalūs duomenys egzistuoja. Atliekama migracija...');
        
        const videos = videosData ? JSON.parse(videosData) : [];
        const completedIds = completedData ? JSON.parse(completedData) : [];
        
        // Migruojame ir lokalius video failus, jei įmanoma
        if (DataStore.db) {
          console.log('Bandoma migruoti lokalius vaizdo failus...');
          
          // Gauname visus video ID, kurie yra "local" tipo
          const localVideoIds = videos
            .filter(v => v.type === 'local')
            .map(v => v.id);
          
          // Įsitikiname, kad visi video turi reikalingus laukus
          const migratedVideos = videos.map(video => {
            // Tikriname ar visi būtini laukai yra
            return {
              id: video.id,
              title: video.title || 'Untitled Video',
              category: video.category || 'other',
              type: video.type || 'youtube',
              youtubeId: video.youtubeId || null,
              progress: video.progress || 0,
              createdAt: video.createdAt || new Date().toISOString(),
              updatedAt: video.updatedAt || new Date().toISOString(),
              // Jei yra papildomų laukų, juos taip pat išsaugome
              ...video
            };
          });
          
          // Įrašome duomenis į Firebase su visais reikalingais laukais
          await userRef.set({
            videos: migratedVideos,
            completedIds: completedIds,
            lastUpdated: new Date().toISOString(),
            dataMigrated: true // Žymime, kad duomenys buvo migruoti
          });
          
          console.log('Duomenys sėkmingai perkelti į Firebase');
          return true;
        } else {
          // Jei IndexedDB neveikia, migruojame tik metaduomenis
          await userRef.set({
            videos: videos,
            completedIds: completedIds,
            lastUpdated: new Date().toISOString(),
            dataMigrated: true
          });
          
          console.log('Metaduomenys sėkmingai perkelti į Firebase (be failų)');
          return true;
        }
      } else if (hasFirebaseData) {
        console.log('Firebase jau turi duomenis, migracija nereikalinga');
        return false;
      } else {
        console.log('Nėra nei Firebase, nei lokalių duomenų');
        return false;
      }
    } catch (error) {
      console.error('Klaida migruojant duomenis:', error);
      return false;
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
