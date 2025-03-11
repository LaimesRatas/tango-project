/**
 * Duomenų valdymo modulis
 * Atsakingas už duomenų išsaugojimą, užkrovimą ir manipuliavimą
 */
const DataStore = {
  // Duomenų kintamieji
  videos: [],
  completedIds: [],
  userId: null,
  
  // Duomenų bazės konfigūracija
  db: null,
  dbConfig: {
    name: 'VideoStoreDB',
    version: 2,
    store: 'videoFiles'
  },
  
  /**
   * Inicializuoja duomenų saugyklą
   */
  async init() {
    try {
      // Bandome inicializuoti IndexedDB, bet jei nepavyksta - tęsiame
      try {
        await this.initDatabase();
        console.log('IndexedDB initialized successfully');
      } catch (dbError) {
        console.warn('IndexedDB initialization failed, will use Firebase only:', dbError);
        // Tęsiame net jei IndexedDB nepavyko - naudosime tik Firebase ir localStorage
      }
      
      // Užkrauname išsaugotus lokalius duomenis (jei nėra prisijungusio vartotojo)
      this.loadLocalData();
      
      console.log('Data Store initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize data store:', error);
      // Net jei yra klaida, grąžiname true, kad aplikacija galėtų veikti
      return true;
    }
  },
  
  /**
   * Inicializuoja IndexedDB duomenų bazę
   */
  initDatabase() {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbConfig.name, this.dbConfig.version);
        
        request.onerror = (event) => {
          console.error('Database error:', event.target.errorCode);
          reject('Failed to open database');
        };
        
        request.onupgradeneeded = (event) => {
          try {
            const db = event.target.result;
            
            // Sukuriame objektų saugyklą, jei jos dar nėra
            if (!db.objectStoreNames.contains(this.dbConfig.store)) {
              db.createObjectStore(this.dbConfig.store, { keyPath: 'id' });
              console.log('Created object store:', this.dbConfig.store);
            }
          } catch (error) {
            console.error('Error during database upgrade:', error);
          }
        };
        
        request.onsuccess = (event) => {
          try {
            this.db = event.target.result;
            console.log('Database opened successfully');
            resolve(this.db);
          } catch (error) {
            console.error('Error in database success handler:', error);
            reject(error);
          }
        };
      } catch (error) {
        console.error('Error setting up IndexedDB:', error);
        reject(error);
      }
    });
  },
  
  /**
   * Užkrauna vartotojo duomenis iš Firebase
   * @param {string} userId - Vartotojo ID
   */
  async loadUserData(userId) {
    this.userId = userId;
    console.log('Loading user data for ID:', userId);
    
    try {
      // Gauname duomenis iš Firebase
      const userRef = firebase.database().ref('users/' + userId);
      const snapshot = await userRef.once('value');
      const userData = snapshot.val() || {};
      
      // Nustatome video ir completedIds
      if (userData.videos) {
        this.videos = userData.videos;
        console.log(`Loaded ${this.videos.length} videos from Firebase`);
      } else {
        this.videos = [];
        console.log('No videos found in Firebase, starting with empty list');
      }
      
      if (userData.completedIds) {
        this.completedIds = userData.completedIds;
        console.log(`Loaded ${this.completedIds.length} completed IDs from Firebase`);
      } else {
        this.completedIds = [];
      }
      
      // Atnaujiname UI
      UI.renderVideos();
      UI.updateCounters();
    } catch (error) {
      console.error('Error loading user data from Firebase:', error);
      
      // Jei Firebase nepavyko, bandome užkrauti iš localStorage
      this.loadLocalData();
      
      // Atnaujiname UI
      UI.renderVideos();
      UI.updateCounters();
    }
  },
  
  /**
   * Užkrauna išsaugotus duomenis iš localStorage (atsarginis variantas)
   */
  loadLocalData() {
    try {
      // Bandome užkrauti išsaugotus video
      const videosData = localStorage.getItem('tangoVideos');
      if (videosData) {
        this.videos = JSON.parse(videosData);
        console.log(`Loaded ${this.videos.length} videos from local storage`);
      }
      
      // Bandome užkrauti užbaigtų video ID sąrašą
      const completedData = localStorage.getItem('tangoCompletedIds');
      if (completedData) {
        this.completedIds = JSON.parse(completedData);
        console.log(`Loaded ${this.completedIds.length} completed video IDs from local storage`);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      // Jei nepavyko užkrauti - inicializuojame tuščius masyvus
      this.videos = [];
      this.completedIds = [];
    }
  },
  
  /**
   * Išsaugo duomenis į Firebase ir localStorage
   */
  async saveData() {
    try {
      // Išsaugome duomenis į localStorage kaip atsarginę kopiją
      localStorage.setItem('tangoVideos', JSON.stringify(this.videos));
      localStorage.setItem('tangoCompletedIds', JSON.stringify(this.completedIds));
      console.log('Data saved to local storage');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
    
    // Jei turime prisijungusį vartotoją, išsaugome duomenis į Firebase
    if (this.userId) {
      try {
        const userRef = firebase.database().ref('users/' + this.userId);
        await userRef.update({
          videos: this.videos,
          completedIds: this.completedIds,
          lastUpdated: new Date().toISOString()
        });
        console.log('Data saved to Firebase');
      } catch (error) {
        console.error('Error saving data to Firebase:', error);
      }
    } else {
      console.log('Data not saved to Firebase: user not authenticated');
    }
  },
  
  /**
   * Išsaugo video failą į IndexedDB
   * @param {string} id - Video ID
   * @param {File} file - Video failas
   * @returns {Promise} - Sėkmės arba klaidos promise
   */
  saveVideoFile(id, file) {
    return new Promise((resolve, reject) => {
      // Jei IndexedDB nėra inicializuota, išsaugome tik duomenis
      if (!this.db) {
        console.warn('IndexedDB not available, skipping file storage');
        resolve(true);
        return;
      }
      
      try {
        const transaction = this.db.transaction([this.dbConfig.store], 'readwrite');
        const store = transaction.objectStore(this.dbConfig.store);
        const request = store.put({ id, file });
        
        request.onsuccess = () => {
          console.log('Video file saved to database:', id);
          resolve(true);
        };
        
        request.onerror = (e) => {
          console.error('Error saving video file:', e);
          // Vis tiek grąžiname true, kad aplikacija galėtų tęsti
          resolve(true);
        };
      } catch (error) {
        console.error('Error in saveVideoFile:', error);
        // Vis tiek grąžiname true, kad aplikacija galėtų tęsti
        resolve(true);
      }
    });
  },
  
  /**
   * Gauna video failą iš IndexedDB
   * @param {string} id - Video ID
   * @returns {Promise<File|null>} - Video failas arba null
   */
  getVideoFile(id) {
    return new Promise((resolve, reject) => {
      // Jei IndexedDB nėra inicializuota, grąžiname null
      if (!this.db) {
        console.warn('IndexedDB not available, cannot retrieve file');
        resolve(null);
        return;
      }
      
      try {
        const transaction = this.db.transaction([this.dbConfig.store], 'readonly');
        const store = transaction.objectStore(this.dbConfig.store);
        const request = store.get(id);
        
        request.onsuccess = (event) => {
          const result = event.target.result;
          
          if (result && result.file) {
            console.log('Video file retrieved from database:', id);
            resolve(result.file);
          } else {
            console.log('Video file not found in database:', id);
            resolve(null);
          }
        };
        
        request.onerror = (e) => {
          console.error('Error getting video file:', e);
          resolve(null);
        };
      } catch (error) {
        console.error('Error in getVideoFile:', error);
        resolve(null);
      }
    });
  },
  
  /**
   * Prideda naują video
   * @param {Object} video - Video objektas
   */
  addVideo(video) {
    // Pridedame video į sąrašo pradžią
    this.videos.unshift(video);
    
    // Išsaugome duomenis
    this.saveData();
    
    console.log('Video added:', video.id);
    return video;
  },
  
  /**
   * Atnaujina video duomenis
   * @param {string} id - Video ID
   * @param {Object} updates - Atnaujinimo objektas
   */
  updateVideo(id, updates) {
    // Randame video pagal ID
    const index = this.videos.findIndex(v => v.id === id);
    
    if (index !== -1) {
      // Jei nustatomas progress 100%, pridedame prie užbaigtų
      if (updates.progress === 100 && !this.completedIds.includes(id)) {
        this.completedIds.push(id);
      }
      // Jei progresas sumažinamas žemiau 100%, pašaliname iš užbaigtų sąrašo
      else if (updates.progress < 100 && this.completedIds.includes(id)) {
        const completedIndex = this.completedIds.indexOf(id);
        if (completedIndex !== -1) {
          this.completedIds.splice(completedIndex, 1);
        }
      }
      
      // Atnaujiname video
      this.videos[index] = { ...this.videos[index], ...updates };
      
      // Išsaugome duomenis
      this.saveData();
      
      console.log('Video updated:', id);
      return this.videos[index];
    }
    
    console.log('Video not found for update:', id);
    return null;
  },
  
  /**
   * Ištrina video
   * @param {string} id - Video ID
   */
  async deleteVideo(id) {
    // Randame video pagal ID
    const index = this.videos.findIndex(v => v.id === id);
    
    if (index !== -1) {
      const video = this.videos[index];
      
      // Šaliname iš video sąrašo
      this.videos.splice(index, 1);
      
      // Jei tai lokalus video, bandome šalinti failą (jei IndexedDB veikia)
      if (video.type === 'local' && this.db) {
        try {
          await this.deleteVideoFile(id);
        } catch (error) {
          console.error('Failed to delete video file:', error);
          // Tęsiame net jei nepavyko ištrinti failo
        }
      }
      
      // Jei video buvo užbaigtas, šaliname iš completedIds sąrašo
      const completedIndex = this.completedIds.indexOf(id);
      if (completedIndex !== -1) {
        this.completedIds.splice(completedIndex, 1);
      }
      
      // Išsaugome duomenis
      this.saveData();
      
      console.log('Video deleted:', id);
      return true;
    }
    
    console.log('Video not found for deletion:', id);
    return false;
  },
  
  /**
   * Ištrina video failą iš IndexedDB
   * @param {string} id - Video ID
   * @returns {Promise} - Sėkmės arba klaidos promise
   */
  deleteVideoFile(id) {
    return new Promise((resolve, reject) => {
      // Jei IndexedDB nėra inicializuota, tiesiog pranešame sėkmę
      if (!this.db) {
        console.warn('IndexedDB not available, cannot delete file');
        resolve(true);
        return;
      }
      
      try {
        const transaction = this.db.transaction([this.dbConfig.store], 'readwrite');
        const store = transaction.objectStore(this.dbConfig.store);
        const request = store.delete(id);
        
        request.onsuccess = () => {
          console.log('Video file deleted from database:', id);
          resolve(true);
        };
        
        request.onerror = (e) => {
          console.error('Error deleting video file:', e);
          // Vis tiek grąžiname true, kad aplikacija galėtų tęsti
          resolve(true);
        };
      } catch (error) {
        console.error('Error in deleteVideoFile:', error);
        // Vis tiek grąžiname true, kad aplikacija galėtų tęsti
        resolve(true);
      }
    });
  },
  
  /**
   * Gauna aktyvius (neužbaigtus) video
   */
  getActiveVideos() {
    return this.videos.filter(v => v.progress < 100);
  },
  
  /**
   * Gauna užbaigtus video
   */
  getCompletedVideos() {
    return this.videos.filter(v => v.progress === 100);
  },
  
  /**
   * Gauna kategorijos konteinerio ID pagal kategorijos pavadinimą
   * @param {string} category - Kategorijos pavadinimas
   */
  getCategoryContainerId(category) {
    const mapping = {
      'tango': 'tango-videos',
      'milonga': 'milonga-videos',
      'vals': 'vals-videos',
      'valsas': 'vals-videos', // Atgalinis suderinamumas
      'milonguero': 'milonguero-videos',
      'milongueros': 'milonguero-videos', // Atgalinis suderinamumas
      'nuevo': 'nuevo-videos',
      'embellishments': 'embellishments-videos',
      'other': 'other-videos',
      'kita': 'other-videos' // Atgalinis suderinamumas
    };
    
    // Grąžiname atitinkamą ID arba 'other-videos', jei kategorija nerasta
    if (!category) return 'other-videos';
    return mapping[category.toLowerCase()] || 'other-videos';
  }
};