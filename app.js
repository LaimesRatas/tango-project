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
      
      // Atvaizduojame duomenis
      UI.renderVideos();
      UI.updateCounters();
      
      console.log('Tango Video Tracker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      alert('Klaida inicializuojant aplikaciją. Perkraukite puslapį ir bandykite dar kartą.');
    }
  }
};

// Paleidžiame aplikaciją, kai puslapis užsikrauna
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
