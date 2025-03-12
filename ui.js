/**
 * Vartotojo sąsajos valdymo modulis
 * Atsakingas už vartotojo sąsajos elementų valdymą ir atvaizdavimą
 */
const UI = {
  // Laikinųjų duomenų kintamieji
  selectedFile: null,
  
  /**
   * Inicializuoja vartotojo sąsają
   */
  init() {
    // Nustatome event listener'ius
    this.setupEventListeners();
    
    // Nustatome mobilios versijos pritaikymą
    this.setupMobileResponsiveness();
    
    // Rodome vartotojo profilį
    this.displayUserProfile();
    
    console.log('UI initialized');
  },
  
  /**
   * Nustato pritaikymą mobiliems įrenginiams
   */
  setupMobileResponsiveness() {
    // Pridedame viewport meta tag jei jo nėra
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
      document.head.appendChild(meta);
    }
    
    // Pridedame stilius mobiliems įrenginiams
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .header {
          flex-direction: column;
          padding: 10px;
        }
        
        .nav-menu {
          margin-bottom: 15px;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .nav-item {
          font-size: 20px;
          margin: 5px 10px;
        }
        
        .counter-container {
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .upload-section {
          flex-direction: column;
          align-items: center;
        }
        
        .upload-button {
          width: 80%;
          margin: 5px 0;
        }
        
        .video-card {
          width: 100%;
        }
      }
      
      /* Stiliaus pataisymas, kad footer būtų visada matomas */
      body {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }
      
      #app-container {
        flex: 1;
        padding-bottom: 60px; /* Daugiau vietos footeriui */
      }
      
      .privacy-links {
        position: relative !important;
        bottom: auto !important;
        padding: 10px 0;
        margin-top: 20px;
      }
    `;
    
    document.head.appendChild(style);
  },
  
  /**
   * Rodo prisijungusio vartotojo profilį
   */
  displayUserProfile() {
    const user = firebase.auth().currentUser;
    const futureMenuDiv = document.querySelector('.future-menu');
    
    if (user && futureMenuDiv) {
      // Pakeičiame "Space for future menu" į vartotojo profilį
      futureMenuDiv.innerHTML = '';
      futureMenuDiv.className = 'user-profile';
      
      // Stilius vartotojo profiliui
      futureMenuDiv.style.display = 'flex';
      futureMenuDiv.style.alignItems = 'center';
      futureMenuDiv.style.justifyContent = 'center';
      futureMenuDiv.style.background = 'none';
      futureMenuDiv.style.height = 'auto';
      
      if (user.photoURL) {
        // Jei yra profilio nuotrauka, rodome ją
        const img = document.createElement('img');
        img.src = user.photoURL;
        img.alt = 'User Profile';
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.borderRadius = '50%';
        futureMenuDiv.appendChild(img);
      } else {
        // Jei nėra nuotraukos, rodome inicialus
        const initials = document.createElement('div');
        const displayName = user.displayName || user.email || 'User';
        initials.textContent = displayName.charAt(0).toUpperCase();
        initials.style.width = '40px';
        initials.style.height = '40px';
        initials.style.borderRadius = '50%';
        initials.style.backgroundColor = '#4a6cfa';
        initials.style.color = 'white';
        initials.style.display = 'flex';
        initials.style.alignItems = 'center';
        initials.style.justifyContent = 'center';
        initials.style.fontWeight = 'bold';
        initials.style.fontSize = '20px';
        futureMenuDiv.appendChild(initials);
      }
      
      // Pridedame vartotojo vardą, jei yra
      if (user.displayName) {
        const nameSpan = document.createElement('span');
        nameSpan.textContent = user.displayName;
        nameSpan.style.marginLeft = '10px';
        nameSpan.style.color = '#333';
        nameSpan.style.fontSize = '14px';
        
        // Mobiliuose įrenginiuose slepiame vardą
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        if (mediaQuery.matches) {
          nameSpan.style.display = 'none';
        }
        
        futureMenuDiv.appendChild(nameSpan);
      }
    }
  },
  
  /**
   * Nustato event listener'ius
   */
  setupEventListeners() {
    // Kategorijų išskleidimas/suskleidimas
    document.querySelectorAll('.category-header').forEach(header => {
      header.addEventListener('click', this.toggleCategory);
    });
    
    // YouTube popup valdymas
    document.getElementById('youtube-upload-btn').addEventListener('click', () => {
      document.getElementById('youtube-popup').style.display = 'flex';
    });
    
    document.getElementById('add-youtube-btn').addEventListener('click', () => {
      this.addYoutubeVideo();
    });
    
    document.getElementById('cancel-youtube-btn').addEventListener('click', () => {
      document.getElementById('youtube-popup').style.display = 'none';
      document.getElementById('youtube-url').value = '';
      document.getElementById('youtube-title').value = '';
    });
    
    // Failo įkėlimo popup valdymas
    document.getElementById('file-upload-btn').addEventListener('click', () => {
      document.getElementById('video-file').click();
    });
    
    document.getElementById('video-file').addEventListener('change', (e) => {
      this.handleFileSelect(e);
    });
    
    document.getElementById('add-file-btn').addEventListener('click', () => {
      this.uploadLocalVideo();
    });
    
    document.getElementById('cancel-file-btn').addEventListener('click', () => {
      document.getElementById('file-popup').style.display = 'none';
      document.getElementById('file-title').value = '';
      document.getElementById('file-category').value = 'tango';
      document.getElementById('file-size-limit').style.display = 'none';
      document.getElementById('upload-progress').style.display = 'none';
      this.selectedFile = null;
    });
    
    // Pašalinamas atsijungimo mygtuko event listener, nes mygtukas bus pasleptas
    // document.getElementById('sign-out-btn').addEventListener('click', () => {
    //   Auth.signOut();
    // });
    
    // Slepiame atsijungimo mygtuką
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
      signOutBtn.style.display = 'none';
    }
    
    console.log('Event listeners set up');
  },
  
  /**
   * Kategorijos išskleidimas/suskleidimas
   */
  toggleCategory() {
    const container = this.nextElementSibling;
    const icon = this.querySelector('.toggle-icon');
    
    if (container.classList.contains('active')) {
      container.classList.remove('active');
      icon.textContent = '+';
    } else {
      container.classList.add('active');
      icon.textContent = '-';
    }
    
    // Užtikriname, kad footer neužsidengtu
    document.body.style.paddingBottom = '60px';
  },
  
  /**
   * Rodo konkrečią kategoriją
   * @param {string} category - Kategorijos pavadinimas
   */
  showCategory(category) {
    // Gauname kategorijos konteinerio ID
    const containerId = DataStore.getCategoryContainerId(category);
    const container = document.getElementById(containerId);
    
    if (container) {
      // Randame atitinkamą antraštę
      const header = container.previousElementSibling;
      const icon = header.querySelector('.toggle-icon');
      
      // Atidarome kategoriją
      container.classList.add('active');
      icon.textContent = '-';
    }
  },
  
  /**
   * Atnaujina skaitliukus
   */
  updateCounters() {
    // Aktyvių video skaitliukas
    const activeCount = DataStore.getActiveVideos().length;
    document.getElementById('active-count').textContent = activeCount;
    
    // Užbaigtų video skaitliukas
    const completedCount = DataStore.completedIds.length;
    document.getElementById('completed-count').textContent = completedCount;
    
    console.log('Counters updated: active =', activeCount, 'completed =', completedCount);
  },
  
  /**
   * Apdoroja failo pasirinkimą
   * @param {Event} e - Failo pasirinkimo įvykis
   */
  handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    this.selectedFile = file;
    
    // Rodome popup
    document.getElementById('file-popup').style.display = 'flex';
    document.getElementById('file-title').value = file.name;
    
    // Tikriname failo dydį (500MB limitas)
    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
    if (file.size > MAX_FILE_SIZE) {
      document.getElementById('file-size-limit').style.display = 'block';
      document.getElementById('add-file-btn').disabled = true;
    } else {
      document.getElementById('file-size-limit').style.display = 'none';
      document.getElementById('add-file-btn').disabled = false;
    }
  },
  
  /**
   * Prideda YouTube video
   */
  addYoutubeVideo() {
    const urlInput = document.getElementById('youtube-url').value.trim();
    const titleInput = document.getElementById('youtube-title').value.trim();
    const categorySelect = document.getElementById('youtube-category');
    const selectedCategory = categorySelect.value;
    
    // Validacija
    if (!urlInput) {
      alert('Prašome įvesti YouTube nuorodą');
      return;
    }
    
    if (!titleInput) {
      alert('Prašome įvesti video pavadinimą');
      return;
    }
    
    // Ištraukiame video ID iš nuorodos
    let videoId = '';
    try {
      const urlObj = new URL(urlInput);
      if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v');
      }
    } catch (error) {
      alert('Neteisinga YouTube nuoroda');
      return;
    }
    
    if (!videoId) {
      alert('Neteisinga YouTube nuoroda');
      return;
    }
    
    // Sukuriame naują video objektą
    const newVideo = {
      id: videoId,
      type: 'youtube',
      title: titleInput,
      category: selectedCategory,
      progress: 0,
      dateAdded: new Date().toISOString()
    };
    
    // Pridedame į duomenų saugyklą
    DataStore.addVideo(newVideo);
    
    // Atnaujiname vaizdą
    this.renderVideos();
    this.updateCounters();
    
    // Uždarome popup
    document.getElementById('youtube-popup').style.display = 'none';
    document.getElementById('youtube-url').value = '';
    document.getElementById('youtube-title').value = '';
    document.getElementById('youtube-category').value = 'tango';
    
    // Rodome kategoriją, kurioje yra naujas video
    this.showCategory(selectedCategory);
  },
  
  /**
   * Įkelia lokalų video failą
   */
  async uploadLocalVideo() {
    if (!this.selectedFile) {
      alert('Prašome pasirinkti failą');
      return;
    }
    
    const fileTitle = document.getElementById('file-title').value.trim();
    if (!fileTitle) {
      alert('Prašome įvesti video pavadinimą');
      return;
    }
    
    const category = document.getElementById('file-category').value;
    const uploadProgress = document.getElementById('upload-progress');
    const uploadProgressBar = document.getElementById('upload-progress-bar');
    
    try {
      // Rodome progreso juostą
      uploadProgress.style.display = 'block';
      uploadProgressBar.style.width = '0%';
      
      // Sukuriame unikalų ID
      const videoId = 'local_' + Date.now();
      
      // Išsaugome video failą
      await DataStore.saveVideoFile(videoId, this.selectedFile);
      
      // Rodome 100% progresą
      uploadProgressBar.style.width = '100%';
      
      // Sukuriame naują video objektą
      const newVideo = {
        id: videoId,
        type: 'local',
        title: fileTitle,
        category: category,
        progress: 0,
        dateAdded: new Date().toISOString()
      };
      
      // Pridedame į duomenų saugyklą
      DataStore.addVideo(newVideo);
      
      // Atnaujiname vaizdą
      this.renderVideos();
      this.updateCounters();
      
      // Uždarome popup po 1s
      setTimeout(() => {
        document.getElementById('file-popup').style.display = 'none';
        document.getElementById('file-title').value = '';
        document.getElementById('file-category').value = 'tango';
        document.getElementById('file-size-limit').style.display = 'none';
        uploadProgress.style.display = 'none';
        this.selectedFile = null;
        document.getElementById('video-file').value = null;
      }, 1000);
      
      // Rodome kategoriją, kurioje yra naujas video
      this.showCategory(category);
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Nepavyko įkelti video');
      document.getElementById('file-popup').style.display = 'none';
      document.getElementById('video-file').value = null;
    }
  },
  
  /**
   * Sukuria video kortelę
   * @param {Object} video - Video objektas
   * @param {number} index - Video indeksas masyve
   * @returns {HTMLElement} - Video kortelės elementas
   */
  createVideoCard(video, index) {
    const card = document.createElement('div');
    card.className = 'video-card';
    
    // Ištrinimo mygtukas
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'X';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      this.deleteVideo(video.id);
    };
    card.appendChild(deleteBtn);
    
    // Video konteineris
    const videoContainer = document.createElement('div');
    videoContainer.style.position = 'relative';
    
    if (video.type === 'youtube') {
      // YouTube video
      const thumbnail = document.createElement('img');
      thumbnail.src = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
      thumbnail.className = 'thumbnail';
      
      // Jei progresas 100%, pridedame blur efektą
      if (video.progress === 100) {
        thumbnail.classList.add('blurred-thumbnail');
      }
      
      // Play mygtukas
      const playOverlay = document.createElement('div');
      playOverlay.className = 'play-overlay';
      
      const playButton = document.createElement('div');
      playButton.className = 'play-button';
      
      playOverlay.appendChild(playButton);
      videoContainer.appendChild(thumbnail);
      videoContainer.appendChild(playOverlay);
      
      // Paspaudus ant thumbnail, rodome iframe su YouTube video
      videoContainer.onclick = () => {
        const iframe = document.createElement('iframe');
        iframe.className = 'video-iframe';
        iframe.src = `https://www.youtube.com/embed/${video.id}?autoplay=1`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        
        videoContainer.innerHTML = '';
        videoContainer.appendChild(iframe);
      };
    } else if (video.type === 'local') {
      // Lokalus video failas
      const videoElement = document.createElement('video');
      videoElement.controls = true;
      videoElement.className = 'thumbnail';
      
      // Bandome gauti video failą
      DataStore.getVideoFile(video.id)
        .then(file => {
          if (file) {
            videoElement.src = URL.createObjectURL(file);
          } else {
            videoElement.poster = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 640 360%22%3E%3Crect width%3D%22640%22 height%3D%22360%22 fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Ctext x%3D%22320%22 y%3D%22180%22 text-anchor%3D%22middle%22 dominant-baseline%3D%22middle%22 font-family%3D%22sans-serif%22 font-size%3D%2224%22 fill%3D%22%23999%22%3EVideo not found%3C%2Ftext%3E%3C%2Fsvg%3E';
          }
        })
        .catch(error => {
          console.error('Error loading video file:', error);
          videoElement.poster = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 640 360%22%3E%3Crect width%3D%22640%22 height%3D%22360%22 fill%3D%22%23f8d7da%22%3E%3C%2Frect%3E%3Ctext x%3D%22320%22 y%3D%22180%22 text-anchor%3D%22middle%22 dominant-baseline%3D%22middle%22 font-family%3D%22sans-serif%22 font-size%3D%2224%22 fill%3D%22%23721c24%22%3EError loading video%3C%2Ftext%3E%3C%2Fsvg%3E';
        });
      
      videoContainer.appendChild(videoElement);
    }
    
    card.appendChild(videoContainer);
    
    // Video pavadinimas
    const title = document.createElement('h3');
    title.className = 'video-title';
    title.textContent = video.title;
    title.onclick = (e) => {
      e.stopPropagation();
      this.editVideoTitle(video.id);
    };
    card.appendChild(title);
    
    // Metaduomenų konteineris (kategorija ir progresas)
    const metaContainer = document.createElement('div');
    metaContainer.className = 'meta-container';
    
    // Kategorijų pasirinkimas
    const categorySelect = document.createElement('select');
    
    // Kategorijų sąrašas
    const categories = [
      { value: 'tango', text: 'Tango' },
      { value: 'milonga', text: 'Milonga' },
      { value: 'vals', text: 'Vals' },
      { value: 'milonguero', text: 'Milonguero style' },
      { value: 'nuevo', text: 'Nuevo style' },
      { value: 'embellishments', text: 'Embellishments' },
      { value: 'other', text: 'Other' }
    ];
    
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.value;
      option.textContent = cat.text;
      option.selected = video.category === cat.value;
      categorySelect.appendChild(option);
    });
    
    categorySelect.onchange = () => {
      DataStore.updateVideo(video.id, { category: categorySelect.value });
      this.renderVideos();
    };
    
    // Progreso slankiklis
    const progressContainer = document.createElement('div');
    progressContainer.style.display = 'flex';
    progressContainer.style.flexDirection = 'column';
    
    // Progreso žymės (0%, 50%, 100%)
    const sliderLabels = document.createElement('div');
    sliderLabels.className = 'slider-labels';
    
    const label0 = document.createElement('span');
    label0.textContent = '0%';
    
    const label50 = document.createElement('span');
    label50.textContent = '50%';
    
    const label100 = document.createElement('span');
    label100.textContent = '100%';
    
    sliderLabels.append(label0, label50, label100);
    
    // Progreso slankiklis
    const progress = document.createElement('input');
    progress.type = 'range';
    progress.min = '0';
    progress.max = '100';
    progress.step = '50'; // Tik 0%, 50%, 100% reikšmės
    progress.value = video.progress;
    progress.className = 'progress';
    
    progress.oninput = () => {
      const newProgress = parseInt(progress.value);
      DataStore.updateVideo(video.id, { progress: newProgress });
      this.renderVideos();
      this.updateCounters();
    };
    
    progressContainer.appendChild(sliderLabels);
    progressContainer.appendChild(progress);
    
    metaContainer.appendChild(categorySelect);
    metaContainer.appendChild(progressContainer);
    
    card.appendChild(metaContainer);
    
    return card;
  },
  
  /**
   * Atvaizduoja visus video
   */
  renderVideos() {
    // Išvalome visus konteinerius
    document.querySelectorAll('.video-container').forEach(container => {
      container.innerHTML = '';
    });
    
    // Užbaigtų video atvaizdavimas
    const completedVideos = DataStore.getCompletedVideos();
    const completedContainer = document.getElementById('completed-videos');
    
    completedVideos.forEach((video, index) => {
      const card = this.createVideoCard(video, index);
      completedContainer.appendChild(card);
    });
    
    // Aktyvių video atvaizdavimas pagal kategorijas
    const activeVideos = DataStore.getActiveVideos();
    
    activeVideos.forEach((video, index) => {
      const containerId = DataStore.getCategoryContainerId(video.category);
      const container = document.getElementById(containerId);
      
      if (container) {
        const card = this.createVideoCard(video, index);
        container.appendChild(card);
      }
    });
    
    console.log('Videos rendered');
  },
  
  /**
   * Redaguoja video pavadinimą
   * @param {string} videoId - Video ID
   */
  editVideoTitle(videoId) {
    const video = DataStore.videos.find(v => v.id === videoId);
    if (!video) return;
    
    const newTitle = prompt('Įveskite naują video pavadinimą:', video.title);
    if (newTitle && newTitle.trim() !== '') {
      DataStore.updateVideo(videoId, { title: newTitle.trim() });
      this.renderVideos();
    }
  },
  
  /**
   * Ištrina video
   * @param {string} videoId - Video ID
   */
  async deleteVideo(videoId) {
    if (confirm('Ar tikrai norite ištrinti šį video?')) {
      const success = await DataStore.deleteVideo(videoId);
      
      if (success) {
        this.renderVideos();
        this.updateCounters();
      }
    }
  }
};
