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
      
      // Inicializuojame UI
      UI.init();
      
      // Inicializuojame duomenų saugyklą
      await DataStore.init();
      
      // Inicializuojame autentifikaciją
      Auth.init();
      
      // Pridedame CSS stilius autentifikacijos konteineriui
      this.addAuthStyles();
      
      // Po inicializacijos bandome migruoti senus duomenis
      try {
        await DataStore.migrateOldVideos();
      } catch (migrationError) {
        console.warn('Nepavyko atlikti duomenų migracijos:', migrationError);
        // Tęsiame net jei migracija nepavyko
      }
      
      console.log('Tango Video Tracker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      alert('Klaida inicializuojant aplikaciją. Perkraukite puslapį ir bandykite dar kartą.');
    }
  },
  
  /**
   * Prideda CSS stilius autentifikacijos konteineriui
   */
  addAuthStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Autentifikacijos konteineris */
      #auth-container {
        max-width: 600px;
        margin: 50px auto;
        background-color: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      }
      
      .auth-header {
        text-align: center;
        margin-bottom: 20px;
      }
      
      .auth-header h2 {
        font-family: 'Dancing Script', cursive;
        font-size: 32px;
        color: #ff69b4;
      }
    `;
    document.head.appendChild(style);
  }
};

// Paleidžiame aplikaciją, kai puslapis užsikrauna
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
