/**
 * Duomenų valdymo modulis
 * Atsakingas už duomenų išsaugojimą, užkrovimą ir manipuliavimą
 */
const DataStore = {
  // Duomenų kintamieji
  videos: [],
  completedIds: [],
  userId: null,
  
  // Firebase Storage nuoroda
  storage: null,
  
  /**
   * Inicializuoja duomenų saugyklą
   */
  async init() {
    try {
      console.log('Initializing Data Store...');
      
      // Inicializuojame Firebase Storage
      if (firebase && firebase.storage) {
        this.storage = firebase.storage();
        console.log('Firebase Storage initialized successfully');
      } else {
        console.warn('Firebase Storage is not available');
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
   * Užkrauna vartotojo duomenis iš Firebase
   * @param {string} userId - Vartotojo ID
   */
  async loadUserData(userId) {
    try {
      this.userId = userId;
      console.log('Loading user data for ID:', userId);
      
      // Patikrinimas, ar Firebase yra pasiekiamas
      if (!firebase || !firebase.database) {
        console.error('Firebase is not available');
        this.loadLocalData();
        return;
      }
      
      // Gauname duomenis iš Firebase
      const userRef = firebase.database().ref('users/' + userId);
      const snapshot = await userRef.once('value');
      const userData = snapshot.val() || {};
      
      // Jei nėra vartotojo duomenų, bandome gauti laikinus
      if (!userData.videos || userData.videos.length === 0) {
        try {
          const tempRef = firebase.database().ref('temporary_videos');
          const tempSnapshot = await tempRef.once('value');
          const tempData = tempSnapshot.val() || {};
          
          if (tempData.videos && tempData.videos.length > 0) {
            userData.videos = tempData.videos;
            userData.completedIds = tempData.completedIds || [];
            console.log('Loaded temporary videos');
          }
        } catch (tempError) {
          console.warn('Error loading temporary videos:', tempError);
        }
      }
      
      // Nustatome video ir completedIds
      if (userData.videos && Array.isArray(userData.videos)) {
        // Įsitikiname, kad visi video turi reikalingus laukus
        this.videos = userData.videos.map(video => {
          if (!video) return null; // Ignoruojame null vertes
          
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
        }).filter(video => video !== null); // Pašaliname null vertes
        
        console.log(`Loaded ${this.videos.length} videos from Firebase`);
      } else {
        this.videos = [];
        console.log('No videos found in Firebase, starting with empty list');
      }
      
      if (userData.completedIds && Array.isArray(userData.completedIds)) {
        this.completedIds = userData.completedIds;
        console.log(`Loaded ${this.completedIds.length} completed IDs from Firebase`);
      } else {
        this.completedIds = [];
      }
      
      // Atnaujiname UI
      if (UI && typeof UI.renderVideos === 'function') {
        UI.renderVideos();
      }
      if (UI && typeof UI.updateCounters === 'function') {
        UI.updateCounters();
      }
    } catch (error) {
      console.error('Error loading user data from Firebase:', error);
      
      // Jei Firebase nepavyko, bandome užkrauti iš localStorage
      this.loadLocalData();
      
      // Atnaujiname UI
      if (UI && typeof UI.renderVideos === 'function') {
        UI.renderVideos();
      }
      if (UI && typeof UI.updateCounters === 'function') {
        UI.updateCounters();
      }
    }
  },
  
  /**
   * Suderinamumo metodas su senuoju kodu (tiesiog kviečia loadLocalData)
   */
  loadData() {
    console.log('Legacy loadData() method called, using loadLocalData() instead');
    this.loadLocalData();
  },
  
  /**
   * Užkrauna išsaugotus duomenis iš localStorage (atsarginis variantas)
   */
  loadLocalData() {
    try {
      console.log('Loading data from local storage...');
      
      // Bandome užkrauti išsaugotus video
      const videosData = localStorage.getItem('tangoVideos');
      if (videosData) {
        try {
          const parsedVideos = JSON.parse(videosData);
          
          if (Array.isArray(parsedVideos)) {
            // Įsitikiname, kad visi video turi reikalingus laukus
            this.videos = parsedVideos.map(video => {
              if (!video) return null; // Ignoruojame null vertes
              
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
            }).filter(video => video !== null); // Pašaliname null vertes
            
            console.log(`Loaded ${this.videos.length} videos from local storage`);
          } else {
            console.error('Parsed videos is not an array');
            this.videos = [];
          }
        } catch (parseError) {
          console.error('Error parsing videos from localStorage:', parseError);
          this.videos = [];
        }
      } else {
        this.videos = [];
      }
      
      // Bandome užkrauti užbaigtų video ID sąrašą
      const completedData = localStorage.getItem('tangoCompletedIds');
      if (completedData) {
        try {
          const parsed = JSON.parse(completedData);
          if (Array.isArray(parsed)) {
            this.completedIds = parsed;
            console.log(`Loaded ${this.completedIds.length} completed video IDs from local storage`);
          } else {
            console.error('Parsed completedIds is not an array');
            this.completedIds = [];
          }
        } catch (parseError) {
          console.error('Error parsing completedIds from localStorage:', parseError);
          this.completedIds = [];
        }
      } else {
        this.completedIds = [];
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      // Jei nepavyko užkrauti - inicializuojame tuščius masyvus
      this.videos = [];
      this.completedIds = [];
    }
  },
  
  /**
   * Migruoja senus vaizdo įrašus į naują formatą
   */
  async migrateOldVideos() {
    console.log('Starting video migration process');
    
    try {
      // Bandome gauti senus vaizdo įrašų duomenis (iš senų localStorage raktų)
      const oldKeys = [
        'tangoVideos',      // Dabartinis raktas
        'tangoVideoItems',  // Galimas senas raktas
        'videos',           // Galimas senas raktas
        'videoItems'        // Galimas senas raktas
      ];
      
      let oldVideos = [];
      let migrationNeeded = false;
      
      // Patikriname visus galimus senus raktus
      for (const key of oldKeys) {
        const data = localStorage.getItem(key);
        if (data && key !== 'tangoVideos') { // Nemigruojame dabartinių duomenų
          try {
            const parsedData = JSON.parse(data);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              console.log(`Rasti seni vaizdo įrašai raktu '${key}'`);
              oldVideos = [...oldVideos, ...parsedData];
              migrationNeeded = true;
            }
          } catch (parseError) {
            console.error(`Klaida nuskaitant senus duomenis iš rakto '${key}':`, parseError);
          }
        }
      }
      
      // Jei reikia migruoti
      if (migrationNeeded && oldVideos.length > 0) {
        console.log(`Rasta ${oldVideos.length} senų vaizdo įrašų, atliekama migracija...`);
        
        // Transformuojame senus duomenis į naują formatą
        const migratedVideos = oldVideos.map(oldVideo => {
          // Generuojame ID, jei jo nėra
          const id = oldVideo.id || ('v_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
          
          return {
            id: id,
            title: oldVideo.title || oldVideo.name || 'Neįvardintas vaizdo įrašas',
            category: oldVideo.category || 'other',
            type: oldVideo.type || (oldVideo.youtubeId ? 'youtube' : 'local'),
            youtubeId: oldVideo.youtubeId || null,
            progress: oldVideo.progress || 0,
            dateAdded: oldVideo.dateAdded || oldVideo.createdAt || new Date().toISOString(),
            migratedFrom: true
          };
        });
        
        // Pridedame migruotus vaizdo įrašus į esamus (jei jų nėra su tokiais pat ID)
        const existingIds = this.videos.map(v => v.id);
        const newVideos = migratedVideos.filter(v => !existingIds.includes(v.id));
        
        if (newVideos.length > 0) {
          this.videos = [...newVideos, ...this.videos];
          console.log(`Pridėta ${newVideos.length} naujų vaizdo įrašų iš senų duomenų`);
          
          // Išsaugome duomenis
          await this.saveData();
          
          // Jei prisijungęs vartotojas, išsaugome ir į Firebase
          if (this.userId && firebase && firebase.database) {
            try {
              const userRef = firebase.database().ref('users/' + this.userId);
              await userRef.update({
                videos: this.videos,
                lastUpdated: new Date().toISOString(),
                dataMigrated: true
              });
              console.log('Migruoti duomenys išsaugoti Firebase');
            } catch (firebaseError) {
              console.error('Klaida išsaugant migruotus duomenis į Firebase:', firebaseError);
            }
          }
          
          return true;
        } else {
          console.log('Visi seni vaizdo įrašai jau buvo migruoti');
          return false;
        }
      } else {
        console.log('Senų vaizdo įrašų nerasta, migracija nereikalinga');
        return false;
      }
    } catch (error) {
      console.error('Klaida migruojant senus vaizdo įrašus:', error);
      return false;
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
    
    // Pridedame papildomą Firebase išsaugojimą net be prisijungimo
    try {
      if (firebase && firebase.database) {
        const tempRef = firebase.database().ref('temporary_videos');
        await tempRef.set({
          videos: this.videos,
          completedIds: this.completedIds,
          lastUpdated: new Date().toISOString()
        });
        console.log('Temporary data saved to Firebase');
      }
    } catch (error) {
      console.error('Error saving temporary data to Firebase:', error);
    }
    
    // Jei turime prisijungusį vartotoją, išsaugome duomenis į Firebase
    if (this.userId && firebase && firebase.database) {
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
      console.log('Data not saved to Firebase: user not authenticated or Firebase not available');
    }
  },
  
  /**
   * Išsaugo video failą į Firebase Storage
   * @param {string} id - Video ID
   * @param {File} file - Video failas
   * @returns {Promise} - Sėkmės arba klaidos promise
   */
  saveVideoFile(id, file) {
    return new Promise(async (resolve, reject) => {
      try {
        // Patikrinti ar turime Firebase Storage
        if (!this.storage) {
          console.warn('Firebase Storage not available, cannot save file');
          reject(new Error('Firebase Storage neprieinamas'));
          return;
        }
        
        // Patikrinti ar turime vartotojo ID
        const userId = this.userId || 'anonymous';
        
        // Sukurti kelią iki failo
        const filePath = `videos/${userId}/${id}`;
        const storageRef = this.storage.ref(filePath);
        
        // Paruošiame upload task
        const uploadTask = storageRef.put(file);
        
        // Stebime progresą
        uploadTask.on('state_changed', 
          // Progress funkcija
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Įkėlimo progresas: ${progress.toFixed(2)}%`);
            
            // Jei turime upload-progress-bar elementą, atnaujiname jį
            const progressBar = document.getElementById('upload-progress-bar');
            if (progressBar) {
              progressBar.style.width = `${progress}%`;
            }
          },
          // Error funkcija
          (error) => {
            console.error('Klaida įkeliant failą į Firebase Storage:', error);
            reject(error);
          },
          // Completion funkcija
          () => {
            console.log('Failas sėkmingai įkeltas į Firebase Storage:', filePath);
            
            // Gauname failo URL ir atnaujiname video objektą
            uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
              // Randame video objektą
              const videoIndex = this.videos.findIndex(v => v.id === id);
              if (videoIndex !== -1) {
                // Atnaujiname video objektą su failo URL
                this.videos[videoIndex].fileURL = downloadURL;
                this.videos[videoIndex].storagePath = filePath;
                
                // Išsaugome duomenis
                this.saveData();
              }
              
              resolve(downloadURL);
            }).catch(error => {
              console.error('Klaida gaunant failo URL:', error);
              reject(error);
            });
          }
        );
      } catch (error) {
        console.error('Klaida išsaugant vaizdo failą:', error);
        reject(error);
      }
    });
  },
  
  /**
   * Gauna video failą iš Firebase Storage
   * @param {string} id - Video ID
   * @returns {Promise<string|null>} - Video failo URL arba null
   */
  getVideoFile(id) {
    return new Promise(async (resolve, reject) => {
      try {
        // Randame video pagal ID
        const video = this.videos.find(v => v.id === id);
        
        if (!video) {
          console.log('Video not found:', id);
          resolve(null);
          return;
        }
        
        // Jei turime jau išsaugotą URL, grąžiname jį
        if (video.fileURL) {
          console.log('Using cached video URL:', video.fileURL);
          resolve(video.fileURL);
          return;
        }
        
        // Patikrinti ar turime Firebase Storage
        if (!this.storage) {
          console.warn('Firebase Storage not available, cannot get file');
          reject(new Error('Firebase Storage neprieinamas'));
          return;
        }
        
        // Jei turime storage path, bandome gauti URL
        if (video.storagePath) {
          const storageRef = this.storage.ref(video.storagePath);
          
          try {
            const url = await storageRef.getDownloadURL();
            
            // Išsaugome URL video objekte
            const videoIndex = this.videos.findIndex(v => v.id === id);
            if (videoIndex !== -1) {
              this.videos[videoIndex].fileURL = url;
              this.saveData();
            }
            
            resolve(url);
          } catch (error) {
            console.error('Klaida gaunant failo URL iš Storage:', error);
            resolve(null);
          }
        } else {
          // Jei neturime storage path, bandome sukurti jį
          const userId = this.userId || 'anonymous';
          const filePath = `videos/${userId}/${id}`;
          
          const storageRef = this.storage.ref(filePath);
          
          try {
            const url = await storageRef.getDownloadURL();
            
            // Išsaugome URL ir path video objekte
            const videoIndex = this.videos.findIndex(v => v.id === id);
            if (videoIndex !== -1) {
              this.videos[videoIndex].fileURL = url;
              this.videos[videoIndex].storagePath = filePath;
              this.saveData();
            }
            
            resolve(url);
          } catch (error) {
            console.log('Failas nerastas Storage:', filePath);
            resolve(null);
          }
        }
      } catch (error) {
        console.error('Klaida gaunant vaizdo failą:', error);
        resolve(null);
      }
    });
  },
  
  /**
   * Prideda naują video
   * @param {Object} video - Video objektas
   */
  addVideo(video) {
    // Įsitikiname, kad video turi visus reikalingus laukus
    const safeVideo = {
      id: video.id || 'v_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      title: video.title || 'Untitled Video',
      category: video.category || 'other',
      type: video.type || 'youtube',
      progress: video.progress || 0,
      dateAdded: video.dateAdded || new Date().toISOString(),
      ...video
    };
    
    // Pridedame video į sąrašo pradžią
    this.videos.unshift(safeVideo);
    
    // Išsaugome duomenis
    this.saveData();
    
    console.log('Video added:', safeVideo.id);
    return safeVideo;
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
      this.videos[index] = { 
        ...this.videos[index], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      
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
      
      // Jei tai lokalus video ir turime storagePath, bandome šalinti failą iš Storage
      if (video.type === 'local' && video.storagePath && this.storage) {
        try {
          await this.deleteVideoFile(id);
        } catch (error) {
          console.error('Failed to delete video file from Storage:', error);
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
   * Ištrina video failą iš Firebase Storage
   * @param {string} id - Video ID
   * @returns {Promise} - Sėkmės arba klaidos promise
   */
  deleteVideoFile(id) {
    return new Promise(async (resolve, reject) => {
      try {
        // Patikrinti ar turime Firebase Storage
        if (!this.storage) {
          console.warn('Firebase Storage not available, cannot delete file');
          resolve(true);
          return;
        }
        
        // Randame video pagal ID
        const video = this.videos.find(v => v.id === id);
        
        if (!video || !video.storagePath) {
          console.log('Video not found or no storage path available');
          resolve(true);
          return;
        }
        
        // Pašaliname failą iš Firebase Storage
        const storageRef = this.storage.ref(video.storagePath);
        
        try {
          await storageRef.delete();
          console.log('Video file deleted from Firebase Storage:', video.storagePath);
          resolve(true);
        } catch (error) {
          console.error('Error deleting video file from Storage:', error);
          // Vis tiek grąžiname true, kad aplikacija galėtų tęsti
          resolve(true);
        }
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
