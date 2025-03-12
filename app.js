/**
 * Aplikacijos valdymo modulis
 * Atsakingas už aplikacijos inicializavimą ir pagrindinių funkcijų koordinavimą
 */
const App = {
  /**
   * Inicializuoja aplikaciją
   */
  async init() {
    try {
      console.log('Initializing Tango Video Tracker...');
      
      // Pridedame viewport meta tag jei jo nėra (mobiliam pritaikymui)
      this.ensureViewportMeta();
      
      // Inicializuojame duomenų saugyklą
      await DataStore.init();
      
      // Inicializuojame autentifikaciją
      Auth.init();
      
      // Inicializuojame UI
      UI.init();
      
      // Po inicializacijos bandome migruoti senus duomenis
      try {
        await DataStore.migrateOldVideos();
      } catch (migrationError) {
        console.warn('Nepavyko atlikti duomenų migracijos:', migrationError);
        // Tęsiame net jei migracija nepavyko
      }
      
      // Pridedame klausiklį, kuris išvalo Firebase klaidas, kad leistų bandyti dar kartą
      window.addEventListener('error', (e) => {
        if (e.message && (
            e.message.includes('Firebase') || 
            e.message.includes('permission_denied') || 
            e.message.includes('database'))) {
          console.log('Handling Firebase error:', e.message);
          // Bandome atkurti prisijungimą prie duomenų bazės
          this.recoverFirebaseConnection();
        }
      });
      
      console.log('Tango Video Tracker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      alert('Klaida inicializuojant aplikaciją. Perkraukite puslapį ir bandykite dar kartą.');
    }
  },
  
  /**
   * Užtikrina, kad viewport meta tag egzistuoja
   */
  ensureViewportMeta() {
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    }
  },
  
  /**
   * Atkuria prisijungimą prie Firebase duomenų bazės
   */
  recoverFirebaseConnection() {
    try {
      // Bandome laikinai prisijungti anonimiškai
      if (firebase.auth) {
        firebase.auth().signInAnonymously()
          .then(() => {
            console.log("Anonymous auth successful, trying to reconnect to database");
            // Bandome iš naujo prisijungti prie duomenų bazės
            firebase.database().goOnline();
          })
          .catch((error) => {
            console.error("Anonymous auth failed:", error);
          });
      }
    } catch (error) {
      console.error("Recovery attempt failed:", error);
    }
  }
};

// Paleidžiame aplikaciją, kai puslapis užsikrauna
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
