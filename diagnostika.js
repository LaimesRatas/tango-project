/**
 * Diagnostikos modulis
 * Atsakingas už sistemos būsenos diagnostiką ir klaidų aptikimą
 */
const Diagnostika = {
  // Klaidų skaičiuokliai
  errors: {
    firebase: 0,
    indexedDB: 0,
    dom: 0
  },
  
  // Ar diagnostika paleista
  isRunning: false,
  
  /**
   * Paleidžia diagnostiką
   */
  start() {
    if (this.isRunning) {
      console.log('Diagnostika jau paleista');
      return;
    }
    
    this.isRunning = true;
    console.log('Paleidžiama sistemos diagnostika...');
    
    // Sukuriame diagnostikos konteinerį
    this.createDiagnostikosUI();
    
    // Tikriname Firebase
    this.checkFirebase();
    
    // Tikriname IndexedDB
    this.checkIndexedDB();
    
    // Tikriname DOM elementus
    this.checkDOM();
    
    // Tikriname localStorage
    this.checkLocalStorage();
    
    console.log('Diagnostika baigta');
  },
  
  /**
   * Sukuria diagnostikos vartotojo sąsają
   */
  createDiagnostikosUI() {
    // Patikriname, ar jau egzistuoja
    if (document.getElementById('diagnostika-container')) return;
    
    const container = document.createElement('div');
    container.id = 'diagnostika-container';
    container.style.position = 'fixed';
    container.style.bottom = '10px';
    container.style.right = '10px';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    container.style.color = 'white';
    container.style.padding = '15px';
    container.style.borderRadius = '5px';
    container.style.zIndex = '9999';
    container.style.fontSize = '14px';
    container.style.fontFamily = 'monospace';
    container.style.maxWidth = '500px';
    container.style.maxHeight = '400px';
    container.style.overflowY = 'auto';
    
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.marginBottom = '10px';
    
    const title = document.createElement('h3');
    title.textContent = 'Sistemos diagnostika';
    title.style.margin = '0';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'X';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'white';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '16px';
    closeBtn.onclick = () => {
      container.style.display = 'none';
    };
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    const content = document.createElement('div');
    content.id = 'diagnostika-content';
    
    container.appendChild(header);
    container.appendChild(content);
    
    document.body.appendChild(container);
  },
  
  /**
   * Atnaujina diagnostikos informaciją
   * @param {string} text - Diagnostikos tekstas
   * @param {string} status - Būsena (success/error/warning/info)
   */
  updateDiagnostika(text, status = 'info') {
    const content = document.getElementById('diagnostika-content');
    if (!content) return;
    
    const line = document.createElement('div');
    line.style.marginBottom = '5px';
    
    let color = '#999'; // Default info color
    if (status === 'success') color = '#4caf50';
    if (status === 'error') color = '#f44336';
    if (status === 'warning') color = '#ff9800';
    
    line.innerHTML = `<span style="color:${color}">● </span>${text}`;
    
    content.appendChild(line);
    
    // Automatiškai scrolliname žemyn
    content.scrollTop = content.scrollHeight;
    
    // Taip pat registruojame konsolėje
    if (status === 'error') {
      console.error(text);
    } else if (status === 'warning') {
      console.warn(text);
    } else if (status === 'success') {
      console.log('%c' + text, 'color: green');
    } else {
      console.log(text);
    }
  },
  
  /**
   * Patikrina Firebase būseną
   */
  checkFirebase() {
    this.updateDiagnostika('Tikrinama Firebase būsena...', 'info');
    
    try {
      if (typeof firebase === 'undefined') {
        this.errors.firebase++;
        this.updateDiagnostika('KLAIDA: Firebase objektas nerastas. Patikrinkite ar Firebase biblioteka įtraukta.', 'error');
        return;
      }
      
      if (!firebase.app) {
        this.errors.firebase++;
        this.updateDiagnostika('KLAIDA: Firebase neinicializuotas.', 'error');
        return;
      }
      
      // Tikriname auth
      if (!firebase.auth) {
        this.errors.firebase++;
        this.updateDiagnostika('KLAIDA: Firebase Auth modulis nerastas.', 'error');
      } else {
        this.updateDiagnostika('Firebase Auth modulis rastas.', 'success');
      }
      
      // Tikriname database
      if (!firebase.database) {
        this.errors.firebase++;
        this.updateDiagnostika('KLAIDA: Firebase Database modulis nerastas.', 'error');
      } else {
        this.updateDiagnostika('Firebase Database modulis rastas.', 'success');
        
        // Bandome pasiekti bazę
        firebase.database().ref('.info/connected').once('value')
          .then(snapshot => {
            const connected = snapshot.val();
            if (connected) {
              this.updateDiagnostika('Sėkmingai prisijungta prie Firebase duomenų bazės.', 'success');
            } else {
              this.errors.firebase++;
              this.updateDiagnostika('KLAIDA: Nepavyko prisijungti prie Firebase duomenų bazės.', 'error');
            }
          })
          .catch(error => {
            this.errors.firebase++;
            this.updateDiagnostika(`KLAIDA: Firebase Database prisijungimo klaida: ${error.message}`, 'error');
          });
      }
      
      this.updateDiagnostika('Firebase patikrinimas baigtas.', 'info');
    } catch (error) {
      this.errors.firebase++;
      this.updateDiagnostika(`KLAIDA tikrinant Firebase: ${error.message}`, 'error');
    }
  },
  
  /**
   * Patikrina IndexedDB būseną
   */
  checkIndexedDB() {
    this.updateDiagnostika('Tikrinama IndexedDB būsena...', 'info');
    
    try {
      if (!window.indexedDB) {
        this.errors.indexedDB++;
        this.updateDiagnostika('KLAIDA: IndexedDB nepalaikoma šioje naršyklėje.', 'error');
        return;
      }
      
      // Tikriname ar galime atidaryti testinę DB
      const testRequest = indexedDB.open('diagnostic_test', 1);
      
      testRequest.onerror = (event) => {
        this.errors.indexedDB++;
        this.updateDiagnostika(`KLAIDA: Nepavyko atidaryti testinės IndexedDB: ${event.target.error?.message || 'Nežinoma klaida'}`, 'error');
      };
      
      testRequest.onsuccess = (event) => {
        this.updateDiagnostika('IndexedDB testas sėkmingas - galima kurti ir atidaryti duomenų bazes.', 'success');
        
        // Uždarome testinę DB
        event.target.result.close();
        
        // Išvalome testinę DB
        indexedDB.deleteDatabase('diagnostic_test');
      };
      
      this.updateDiagnostika('IndexedDB patikrinimas baigtas.', 'info');
    } catch (error) {
      this.errors.indexedDB++;
      this.updateDiagnostika(`KLAIDA tikrinant IndexedDB: ${error.message}`, 'error');
    }
  },
  
  /**
   * Patikrina svarbius DOM elementus
   */
  checkDOM() {
    this.updateDiagnostika('Tikrinami DOM elementai...', 'info');
    
    // Pagrindinių konteinerių sąrašas
    const criticalElements = [
      'auth-container',
      'app-container',
      'active-count',
      'completed-count',
      'youtube-popup',
      'file-popup'
    ];
    
    // Kategorijų konteinerių sąrašas
    const categoryContainers = [
      'tango-videos',
      'milonga-videos',
      'vals-videos',
      'milonguero-videos',
      'nuevo-videos',
      'embellishments-videos',
      'other-videos',
      'completed-videos'
    ];
    
    // Tikriname pagrindinius elementus
    criticalElements.forEach(elementId => {
      const element = document.getElementById(elementId);
      if (!element) {
        this.errors.dom++;
        this.updateDiagnostika(`KLAIDA: Nerastas svarbus elementas '${elementId}'`, 'error');
      } else {
        this.updateDiagnostika(`Elementas '${elementId}' rastas.`, 'success');
      }
    });
    
    // Tikriname kategorijų konteinerius
    categoryContainers.forEach(elementId => {
      const element = document.getElementById(elementId);
      if (!element) {
        this.updateDiagnostika(`ĮSPĖJIMAS: Nerastas kategorijos konteineris '${elementId}'`, 'warning');
      } else {
        this.updateDiagnostika(`Kategorijos konteineris '${elementId}' rastas.`, 'success');
      }
    });
    
    // Tikriname UI elementus
    const uiElements = [
      { id: 'youtube-upload-btn', name: 'YouTube įkėlimo mygtukas' },
      { id: 'file-upload-btn', name: 'Failo įkėlimo mygtukas' },
      { id: 'sign-out-btn', name: 'Atsijungimo mygtukas' }
    ];
    
    uiElements.forEach(element => {
      const domElement = document.getElementById(element.id);
      if (!domElement) {
        this.updateDiagnostika(`ĮSPĖJIMAS: Nerastas UI elementas '${element.name}' (${element.id})`, 'warning');
      } else {
        this.updateDiagnostika(`UI elementas '${element.name}' rastas.`, 'success');
      }
    });
    
    this.updateDiagnostika('DOM elementų patikrinimas baigtas.', 'info');
  },
  
  /**
   * Patikrina localStorage būseną
   */
  checkLocalStorage() {
    this.updateDiagnostika('Tikrinama localStorage būsena...', 'info');
    
    try {
      // Tikriname ar localStorage yra prieinamas
      if (typeof localStorage === 'undefined') {
        this.updateDiagnostika('KLAIDA: localStorage nepalaikomas šioje naršyklėje.', 'error');
        return;
      }
      
      // Testuojame ar galime įrašyti ir nuskaityti duomenis
      const testKey = '_diagnostika_test_';
      const testValue = 'test_' + Date.now();
      
      localStorage.setItem(testKey, testValue);
      const readValue = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (readValue === testValue) {
        this.updateDiagnostika('localStorage testas sėkmingas - galima rašyti ir skaityti duomenis.', 'success');
      } else {
        this.updateDiagnostika('KLAIDA: localStorage testas nepavyko - negalima rašyti arba skaityti duomenų.', 'error');
      }
      
      // Tikriname ar yra išsaugotų duomenų
      const videosData = localStorage.getItem('tangoVideos');
      const completedData = localStorage.getItem('tangoCompletedIds');
      
      if (videosData) {
        try {
          const videos = JSON.parse(videosData);
          this.updateDiagnostika(`Rasta ${Array.isArray(videos) ? videos.length : 0} išsaugotų video įrašų.`, 'info');
        } catch (error) {
          this.updateDiagnostika('KLAIDA: Negalima apdoroti išsaugotų video duomenų.', 'error');
        }
      } else {
        this.updateDiagnostika('Išsaugotų video nerasta.', 'info');
      }
      
      if (completedData) {
        try {
          const completedIds = JSON.parse(completedData);
          this.updateDiagnostika(`Rasta ${Array.isArray(completedIds) ? completedIds.length : 0} užbaigtų video ID.`, 'info');
        } catch (error) {
          this.updateDiagnostika('KLAIDA: Negalima apdoroti užbaigtų video ID duomenų.', 'error');
        }
      } else {
        this.updateDiagnostika('Užbaigtų video ID nerasta.', 'info');
      }
      
      this.updateDiagnostika('localStorage patikrinimas baigtas.', 'info');
    } catch (error) {
      this.updateDiagnostika(`KLAIDA tikrinant localStorage: ${error.message}`, 'error');
    }
  },
  
  /**
   * Vykdo bendrą sistemos diagnostiką ir pataisymą
   */
  repair() {
    this.updateDiagnostika('Pradedamas sistemos taisymas...', 'info');
    
    // Patikriname ir taisome localStorage formatą
    this.repairLocalStorage();
    
    // Patikriname ir taisome modulių ryšius
    this.repairModuleLinks();
    
    // Baigiame taisymą
    this.updateDiagnostika('Sistemos taisymas baigtas.', 'info');
    
    // Siūlome perkrauti puslapį
    if (confirm('Sistemos taisymas baigtas. Ar norite perkrauti puslapį?')) {
      location.reload();
    }
  },
  
  /**
   * Taiso localStorage formatą
   */
  repairLocalStorage() {
    this.updateDiagnostika('Taisomas localStorage formatas...', 'info');
    
    try {
      // Taisome video duomenis
      const videosData = localStorage.getItem('tangoVideos');
      if (videosData) {
        try {
          let videos = JSON.parse(videosData);
          
          // Patikriname ar tai masyvas
          if (!Array.isArray(videos)) {
            this.updateDiagnostika('KLAIDA: videos nėra masyvas, kuriamas naujas tuščias masyvas.', 'error');
            videos = [];
            localStorage.setItem('tangoVideos', JSON.stringify(videos));
          }
          
          // Patikriname ar visi video turi reikalingus laukus
          const fixedVideos = videos.map(video => {
            if (!video) return null;
            
            return {
              id: video.id || 'v_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
              title: video.title || 'Untitled Video',
              category: video.category || 'other',
              type: video.type || 'youtube',
              progress: video.progress || 0,
              dateAdded: video.dateAdded || video.createdAt || new Date().toISOString(),
              ...video
            };
          }).filter(video => video !== null);
          
          localStorage.setItem('tangoVideos', JSON.stringify(fixedVideos));
          this.updateDiagnostika(`Pataisyta ${fixedVideos.length} video įrašų.`, 'success');
        } catch (error) {
          this.updateDiagnostika(`KLAIDA taisant video duomenis: ${error.message}`, 'error');
          localStorage.setItem('tangoVideos', JSON.stringify([]));
        }
      }
      
      // Taisome užbaigtų video ID
      const completedData = localStorage.getItem('tangoCompletedIds');
      if (completedData) {
        try {
          let completedIds = JSON.parse(completedData);
          
          // Patikriname ar tai masyvas
          if (!Array.isArray(completedIds)) {
            this.updateDiagnostika('KLAIDA: completedIds nėra masyvas, kuriamas naujas tuščias masyvas.', 'error');
            completedIds = [];
            localStorage.setItem('tangoCompletedIds', JSON.stringify(completedIds));
          }
          
          localStorage.setItem('tangoCompletedIds', JSON.stringify(completedIds));
          this.updateDiagnostika(`Pataisyta ${completedIds.length} užbaigtų video ID.`, 'success');
        } catch (error) {
          this.updateDiagnostika(`KLAIDA taisant užbaigtų video ID: ${error.message}`, 'error');
          localStorage.setItem('tangoCompletedIds', JSON.stringify([]));
        }
      }
      
      this.updateDiagnostika('localStorage taisymas baigtas.', 'success');
    } catch (error) {
      this.updateDiagnostika(`KLAIDA taisant localStorage: ${error.message}`, 'error');
    }
  },
  
  /**
   * Taiso modulių ryšius
   */
  repairModuleLinks() {
    this.updateDiagnostika('Taisomi modulių ryšiai...', 'info');
    
    try {
      // Patikriname ar visi moduliai egzistuoja
      if (typeof App === 'undefined') {
        this.updateDiagnostika('KLAIDA: App modulis nerastas.', 'error');
      }
      
      if (typeof UI === 'undefined') {
        this.updateDiagnostika('KLAIDA: UI modulis nerastas.', 'error');
      }
      
      if (typeof DataStore === 'undefined') {
        this.updateDiagnostika('KLAIDA: DataStore modulis nerastas.', 'error');
      }
      
      if (typeof Auth === 'undefined') {
        this.updateDiagnostika('KLAIDA: Auth modulis nerastas.', 'error');
      }
      
      // Buvimo vietos patikrinimas
      const authContainer = document.getElementById('auth-container');
      const appContainer = document.getElementById('app-container');
      
      if (authContainer && appContainer) {
        // Patikrinkime ar vartotojas yra prisijungęs
        if (firebase && firebase.auth) {
          const user = firebase.auth().currentUser;
          
          if (user) {
            // Vartotojas prisijungęs, rodome aplikaciją
            this.updateDiagnostika('Vartotojas prisijungęs, rodoma aplikacija.', 'info');
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
          } else {
            // Vartotojas neprisijungęs, rodome autentifikaciją
            this.updateDiagnostika('Vartotojas neprisijungęs, rodoma autentifikacija.', 'info');
            authContainer.style.display = 'block';
            appContainer.style.display = 'none';
          }
        } else {
          // Firebase auth nėra, bet vis tiek tikriname ar yra lokalių duomenų
          const videosData = localStorage.getItem('tangoVideos');
          if (videosData) {
            // Yra lokalių duomenų, rodome aplikaciją ir įjungiame svečio režimą
            this.updateDiagnostika('Firebase auth nėra, bet rasti lokalūs duomenys. Įjungiamas svečio režimas.', 'warning');
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
          }
        }
      }
      
      this.updateDiagnostika('Modulių ryšių taisymas baigtas.', 'success');
    } catch (error) {
      this.updateDiagnostika(`KLAIDA taisant modulių ryšius: ${error.message}`, 'error');
    }
  }
};

// Paleidžiame diagnostiką, kai puslapis užsikrauna
document.addEventListener('DOMContentLoaded', () => {
  // Pridedam Diagnostikos mygtuką
  const addDiagnosticsButton = () => {
    const button = document.createElement('button');
    button.textContent = 'Diagnostika';
    button.style.position = 'fixed';
    button.style.bottom = '10px';
    button.style.left = '10px';
    button.style.padding = '5px 10px';
    button.style.backgroundColor = '#4a6cfa';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.zIndex = '9999';
    
    button.onclick = () => {
      Diagnostika.start();
    };
    
    document.body.appendChild(button);
  };
  
  // Pridedam mygtuką po 2 sekundžių, kad būtų tikrai užsikrovęs puslapis
  setTimeout(addDiagnosticsButton, 2000);
});

// Pridedame globalią funkciją, kad galėtume kviesti iš konsolės
window.runDiagnostics = () => {
  Diagnostika.start();
};

window.repairSystem = () => {
  Diagnostika.start();
  setTimeout(() => {
    Diagnostika.repair();
  }, 1000);
};
