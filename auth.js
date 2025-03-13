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
    console.log('Initializing Auth module...');
    
    try {
      // Patikriname, ar Firebase yra inicializuotas
      if (!firebase || !firebase.auth) {
        console.error('Firebase Auth is not available. Check if Firebase SDK is properly loaded.');
        this.showAuthError();
        return;
      }
      
      // Patikriname ar yra redirect rezultatas (svarbu mobiliuose įrenginiuose)
      firebase.auth().getRedirectResult().then((result) => {
        if (result.user) {
          console.log('Redirect sign-in successful');
        }
      }).catch((error) => {
        console.error('Redirect sign-in error:', error);
      });
      
      // Pridedame prisijungimo mygtukų klausytojus
      const googleLoginBtn = document.getElementById('login-with-google');
      if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
          this.signInWithGoogle();
        });
      }
      
      const emailLoginBtn = document.getElementById('login-with-email');
      if (emailLoginBtn) {
        emailLoginBtn.addEventListener('click', () => {
          const emailInput = document.getElementById('email');
          const passwordInput = document.getElementById('password');
          
          if (emailInput && passwordInput) {
            const email = emailInput.value;
            const password = passwordInput.value;
            this.signInWithEmail(email, password);
          } else {
            alert('Klaida: negali rasti el. pašto arba slaptažodžio laukų');
          }
        });
      }
      
      // Pridedame registracijos mygtuko klausytoją
      const registerBtn = document.getElementById('register-with-email');
      if (registerBtn) {
        registerBtn.addEventListener('click', () => {
          const emailInput = document.getElementById('email');
          const passwordInput = document.getElementById('password');
          
          if (emailInput && passwordInput) {
            const email = emailInput.value;
            const password = passwordInput.value;
            this.registerWithEmail(email, password);
          } else {
            alert('Klaida: negali rasti el. pašto arba slaptažodžio laukų');
          }
        });
      }
      
      // Pridedame atsijungimo mygtuko klausytoją (diagnostikos tikslais)
      const signOutBtn = document.getElementById('sign-out-btn');
      if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
          this.signOut();
        });
      }
      
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
      
      // Inicializuojame vartotojo ikonėlę
      this.updateUserIcon();
      
      console.log('Auth module initialized successfully');
    } catch (error) {
      console.error('Error initializing Auth module:', error);
      this.showAuthError();
    }
  },
  
  /**
   * Parodo klaidos pranešimą, jei nepavyksta inicializuoti autentifikacijos
   */
  showAuthError() {
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
      authContainer.innerHTML = `
        <div class="auth-header">
          <h2>Klaida inicializuojant autentifikaciją</h2>
        </div>
        <div style="text-align: center; color: red; margin: 20px 0;">
          Nepavyko inicializuoti autentifikacijos sistemos. Patikrinkite interneto ryšį ir perkraukite puslapį.
        </div>
        <button onclick="location.reload()" style="display: block; margin: 0 auto; padding: 10px 20px; background-color: #4a6cfa; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Perkrauti puslapį
        </button>
      `;
    }
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
   * Prisijungimas su Google - supaprastinta versija, kuri visada naudoja popup
   */
  signInWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      
      // Naudojame popup visiems įrenginiams (įskaitant mobiliuosius)
      firebase.auth().signInWithPopup(provider)
        .then((result) => {
          console.log('Google sign in successful');
        })
        .catch((error) => {
          console.error('Google sign in error:', error);
          alert('Klaida prisijungiant su Google: ' + error.message);
        });
    } catch (error) {
      console.error('Error in Google sign in:', error);
      alert('Klaida inicializuojant Google prisijungimą: ' + error.message);
    }
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
        
        // Patobulintas klaidos pranešimas
        let errorMessage = 'Klaida prisijungiant: ';
        switch (error.code) {
          case 'auth/invalid-email':
            errorMessage += 'Neteisingas el. pašto formatas.';
            break;
          case 'auth/user-disabled':
            errorMessage += 'Šis vartotojas yra užblokuotas.';
            break;
          case 'auth/user-not-found':
            errorMessage += 'Vartotojas su tokiu el. paštu nerastas.';
            break;
          case 'auth/wrong-password':
            errorMessage += 'Neteisingas slaptažodis.';
            break;
          default:
            errorMessage += error.message || 'Nežinoma klaida.';
        }
        
        alert(errorMessage);
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
        
        // Patobulintas klaidos pranešimas
        let errorMessage = 'Klaida registruojantis: ';
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage += 'Šis el. paštas jau naudojamas.';
            break;
          case 'auth/invalid-email':
            errorMessage += 'Neteisingas el. pašto formatas.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage += 'El. pašto/slaptažodžio autentifikacija nėra įjungta.';
            break;
          case 'auth/weak-password':
            errorMessage += 'Slaptažodis per silpnas.';
            break;
          default:
            errorMessage += error.message || 'Nežinoma klaida.';
        }
        
        alert(errorMessage);
      });
  },
  
  /**
   * Atnaujina vartotojo ikonėlę
   */
  updateUserIcon() {
    const userIcon = document.getElementById('user-profile');
    
    if (userIcon) {
      if (this.currentUser) {
        // Jei vartotojas turi nuotrauką
        if (this.currentUser.photoURL) {
          userIcon.innerHTML = `<img src="${this.currentUser.photoURL}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%;">`;
        } else {
          // Rodome vartotojo inicialus
          const name = this.currentUser.displayName || this.currentUser.email || 'U';
          const initials = name.charAt(0).toUpperCase();
          userIcon.textContent = initials;
        }
        
        // Pridedame atsijungimo funkciją
        userIcon.onclick = () => {
          if (confirm('Ar tikrai norite atsijungti?')) {
            this.signOut();
          }
        };
      } else {
        // Rodome prisijungimo ikonėlę
        userIcon.innerHTML = '<i style="font-size:18px">▶</i>';
        userIcon.onclick = () => {
          // Rodome prisijungimo formą
          const authContainer = document.getElementById('auth-container');
          const appContainer = document.getElementById('app-container');
          
          if (authContainer && appContainer) {
            authContainer.style.display = 'block';
            appContainer.style.display = 'none';
          }
        };
      }
    }
  },
  
  /**
   * Autorizuoto vartotojo apdorojimas
   * @param {Object} user - Prisijungusio vartotojo objektas
   */
  onUserSignedIn(user) {
    console.log('Prisijungęs vartotojas:', user.displayName || user.email);
    
    // Išsamesnis prisijungimo šaltinio tikrinimas
    const isGoogle = user.providerData.some(provider => provider.providerId === 'google.com');
    const isEmailVerified = user.emailVerified;
    
    console.log('Prisijungimo tipas:', isGoogle ? 'Google' : 'Email');
    console.log('El. paštas patvirtintas:', isEmailVerified);
    
    if (isEmailVerified || isGoogle) {
      // Rodome aplikaciją, slepiame autentifikaciją
      const authContainer = document.getElementById('auth-container');
      const appContainer = document.getElementById('app-container');
      
      if (authContainer) authContainer.style.display = 'none';
      if (appContainer) appContainer.style.display = 'block';
      
      // Atnaujinama vartotojo ikonėlė
      this.updateUserIcon();
      
      // Patikriname, ar reikalinga migruoti duomenis
      this.migrateLocalDataToFirebase(user.uid).then(() => {
        // Užkrauname vartotojo duomenis
        if (DataStore && typeof DataStore.loadUserData === 'function') {
          DataStore.loadUserData(user.uid);
        }
      }).catch(error => {
        console.error('Klaida migruojant duomenis:', error);
        alert('Nepavyko užkrauti vartotojo duomenų: ' + error.message);
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
      // Patikriname, ar Firebase yra pasiekiamas
      if (!firebase || !firebase.database) {
        console.error('Firebase is not available for data migration');
        return Promise.reject(new Error('Firebase duomenų bazė nepasiekiama'));
      }
      
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
        if (DataStore && DataStore.db) {
          console.log('Bandoma migruoti lokalius vaizdo failus...');
          
          // Gauname visus video ID, kurie yra "local" tipo
          const localVideoIds = videos
            .filter(v => v.type === 'local')
            .map(v => v.id);
          
          // Įsitikiname, kad visi video turi reikalingus laukus
          const migratedVideos = videos.map(video => {
            // Tikriname ar visi būtini laukai yra
            return {
              id: video.id || 'v_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
              title: video.title || 'Untitled Video',
              category: video.category || 'other',
              type: video.type || 'youtube',
              progress: video.progress || 0,
              dateAdded: video.dateAdded || video.createdAt || new Date().toISOString(),
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
      return Promise.reject(error);
    }
  },
  
  /**
   * Neautorizuoto vartotojo apdorojimas
   */
  onUserSignedOut() {
    console.log('Vartotojas atsijungęs');
    
    // Rodome autentifikaciją, slepiame aplikaciją
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    
    if (authContainer) authContainer.style.display = 'block';
    if (appContainer) appContainer.style.display = 'none';
    
    // Atnaujinama vartotojo ikonėlė
    this.updateUserIcon();
  },
  
  /**
   * Atsijungimas iš sistemos
   */
  signOut() {
    if (firebase && firebase.auth) {
      firebase.auth().signOut()
        .then(() => {
          console.log('Sėkmingai atsijungta');
          document.getElementById('app-container').style.display = 'none';
          document.getElementById('auth-container').style.display = 'block';
        })
        .catch(error => {
          console.error('Klaida atsijungiant:', error);
        });
    } else {
      console.error('Firebase Auth is not available for sign out');
      // Vis tiek pakeičiame vaizdą į neprisijungusį
      this.onUserSignedOut();
    }
  },
  
  /**
   * Gauna dabartinio prisijungusio vartotojo ID
   * @returns {string|null} - Vartotojo ID arba null
   */
  getCurrentUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }
};
