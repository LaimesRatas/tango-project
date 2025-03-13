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
    // Įsitikiname, kad DOM elementai jau užkrauti
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupEventListeners();
      });
    } else {
      this.setupEventListeners();
    }
    
    console.log('UI initialized');
  },
  
  /**
   * Nustato event listener'ius
   */
  setupEventListeners() {
    try {
      // Kategorijų išskleidimas/suskleidimas
      document.querySelectorAll('.category-header').forEach(header => {
        if (header) {
          header.addEventListener('click', this.toggleCategory);
        }
      });
      
      // YouTube popup valdymas
      const youtubeUploadBtn = document.getElementById('youtube-upload-btn');
      if (youtubeUploadBtn) {
        youtubeUploadBtn.addEventListener('click', () => {
          const popup = document.getElementById('youtube-popup');
          if (popup) popup.style.display = 'flex';
        });
      }
      
      const addYoutubeBtn = document.getElementById('add-youtube-btn');
      if (addYoutubeBtn) {
        addYoutubeBtn.addEventListener('click', () => {
          this.addYoutubeVideo();
        });
      }
      
      const cancelYoutubeBtn = document.getElementById('cancel-youtube-btn');
      if (cancelYoutubeBtn) {
        cancelYoutubeBtn.addEventListener('click', () => {
          const popup = document.getElementById('youtube-popup');
          const urlInput = document.getElementById('youtube-url');
          const titleInput = document.getElementById('youtube-title');
          
          if (popup) popup.style.display = 'none';
          if (urlInput) urlInput.value = '';
          if (titleInput) titleInput.value = '';
        });
      }
      
      // Failo įkėlimo popup valdymas
      const fileUploadBtn = document.getElementById('file-upload-btn');
      if (fileUploadBtn) {
        fileUploadBtn.addEventListener('click', () => {
          const fileInput = document.getElementById('video-file');
          if (fileInput) fileInput.click();
        });
      }
      
      const videoFile = document.getElementById('video-file');
      if (videoFile) {
        videoFile.addEventListener('change', (e) => {
          this.handleFileSelect(e);
        });
      }
      
      const addFileBtn = document.getElementById('add-file-btn');
      if (addFileBtn) {
        addFileBtn.addEventListener('click', () => {
          this.uploadLocalVideo();
        });
      }
      
      const cancelFileBtn = document.getElementById('cancel-file-btn');
      if (cancelFileBtn) {
        cancelFileBtn.addEventListener('click', () => {
          const popup = document.getElementById('file-popup');
          const titleInput = document.getElementById('file-title');
          const categorySelect = document.getElementById('file-category');
          const fileSizeLimit = document.getElementById('file-size-limit');
          const uploadProgress = document.getElementById('upload-progress');
          
          if (popup) popup.style.display = 'none';
          if (titleInput) titleInput.value = '';
          if (categorySelect) categorySelect.value = 'tango';
          if (fileSizeLimit) fileSizeLimit.style.display = 'none';
          if (uploadProgress) uploadProgress.style.display = 'none';
          this.selectedFile = null;
        });
      }
      
      console.log('Event listeners set up successfully');
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  },
  
  /**
   * Kategorijos išskleidimas/suskleidimas
   */
  toggleCategory() {
    try {
      const container = this.nextElementSibling;
      const icon = this.querySelector('.toggle-icon');
      
      if (container && icon) {
        if (container.classList.contains('active')) {
          container.classList.remove('active');
          icon.textContent = '+';
        } else {
          container.classList.add('active');
          icon.textContent = '-';
        }
      }
    } catch (error) {
      console.error('Error toggling category:', error);
    }
  },
  
  /**
   * Rodo konkrečią kategoriją
   * @param {string} category - Kategorijos pavadinimas
   */
  showCategory(category) {
    try {
      // Gauname kategorijos konteinerio ID
      const containerId = DataStore.getCategoryContainerId(category);
      const container = document.getElementById(containerId);
      
      if (container) {
        // Randame atitinkamą antraštę
        const header = container.previousElementSibling;
        if (header) {
          const icon = header.querySelector('.toggle-icon');
          
          // Atidarome kategoriją
          container.classList.add('active');
          if (icon) icon.textContent = '-';
        }
      }
    } catch (error) {
      console.error('Error showing category:', error);
    }
  },
  
  /**
   * Atnaujina skaitliukus
   */
  updateCounters() {
    try {
      // Užbaigtų video skaitliukas
      const completedCount = DataStore.completedIds.length;
      
      // Atnaujinti naują skaitliuką su skydo ikona
      const newCompletedCountElement = document.getElementById('completed-count-new');
      if (newCompletedCountElement) {
        newCompletedCountElement.textContent = completedCount;
      }
      
      // Atnaujinti senuosius skaitliukus (diagnostikos tikslais)
      const activeCountElement = document.getElementById('active-count');
      if (activeCountElement) {
        const activeCount = DataStore.getActiveVideos().length;
        activeCountElement.textContent = activeCount;
      }
      
      const completedCountElement = document.getElementById('completed-count');
      if (completedCountElement) {
        completedCountElement.textContent = completedCount;
      }
      
      console.log('Counters updated: completed =', completedCount);
    } catch (error) {
      console.error('Error updating counters:', error);
    }
  },
  
  /**
   * Apdoroja failo pasirinkimą
   * @param {Event} e - Failo pasirinkimo įvykis
   */
  handleFileSelect(e) {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      this.selectedFile = file;
      
      // Rodome popup
      const popup = document.getElementById('file-popup');
      const titleInput = document.getElementById('file-title');
      const fileSizeLimit = document.getElementById('file-size-limit');
      const addFileBtn = document.getElementById('add-file-btn');
      
      if (popup) popup.style.display = 'flex';
      if (titleInput) titleInput.value = file.name;
      
      // Tikriname failo dydį (500MB limitas)
      const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
      if (file.size > MAX_FILE_SIZE) {
        if (fileSizeLimit) fileSizeLimit.style.display = 'block';
        if (addFileBtn) addFileBtn.disabled = true;
      } else {
        if (fileSizeLimit) fileSizeLimit.style.display = 'none';
        if (addFileBtn) addFileBtn.disabled = false;
      }
    } catch (error) {
      console.error('Error handling file select:', error);
    }
  },
  
  /**
   * Prideda YouTube video
   */
  addYoutubeVideo() {
    try {
      const urlInput = document.getElementById('youtube-url');
      const titleInput = document.getElementById('youtube-title');
      const categorySelect = document.getElementById('youtube-category');
      
      if (!urlInput || !titleInput || !categorySelect) {
        console.error('Missing required elements for YouTube video addition');
        return;
      }
      
      const urlValue = urlInput.value.trim();
      const titleValue = titleInput.value.trim();
      const selectedCategory = categorySelect.value;
      
      // Validacija
      if (!urlValue) {
        alert('Prašome įvesti YouTube nuorodą');
        return;
      }
      
      if (!titleValue) {
        alert('Prašome įvesti video pavadinimą');
        return;
      }
      
      // Ištraukiame video ID iš nuorodos
      let videoId = '';
      try {
        const urlObj = new URL(urlValue);
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
        title: titleValue,
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
      const popup = document.getElementById('youtube-popup');
      if (popup) popup.style.display = 'none';
      if (urlInput) urlInput.value = '';
      if (titleInput) titleInput.value = '';
      if (categorySelect) categorySelect.value = 'tango';
      
      // Rodome kategoriją, kurioje yra naujas video
      this.showCategory(selectedCategory);
    } catch (error) {
      console.error('Error adding YouTube video:', error);
      alert('Klaida pridedant YouTube video');
    }
  },
  
  /**
   * Įkelia lokalų video failą
   */
  async uploadLocalVideo() {
    try {
      if (!this.selectedFile) {
        alert('Prašome pasirinkti failą');
        return;
      }
      
      const titleInput = document.getElementById('file-title');
      if (!titleInput) {
        console.error('File title input not found');
        return;
      }
      
      const fileTitle = titleInput.value.trim();
      if (!fileTitle) {
        alert('Prašome įvesti video pavadinimą');
        return;
      }
      
      const categorySelect = document.getElementById('file-category');
      const uploadProgress = document.getElementById('upload-progress');
      const uploadProgressBar = document.getElementById('upload-progress-bar');
      
      if (!categorySelect || !uploadProgress || !uploadProgressBar) {
        console.error('Required elements for file upload not found');
        return;
      }
      
      const category = categorySelect.value;
      
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
        const popup = document.getElementById('file-popup');
        const titleInput = document.getElementById('file-title');
        const categorySelect = document.getElementById('file-category');
        const fileSizeLimit = document.getElementById('file-size-limit');
        const uploadProgress = document.getElementById('upload-progress');
        const videoFile = document.getElementById('video-file');
        
        if (popup) popup.style.display = 'none';
        if (titleInput) titleInput.value = '';
        if (categorySelect) categorySelect.value = 'tango';
        if (fileSizeLimit) fileSizeLimit.style.display = 'none';
        if (uploadProgress) uploadProgress.style.display = 'none';
        if (videoFile) videoFile.value = null;
        
        this.selectedFile = null;
      }, 1000);
      
      // Rodome kategoriją, kurioje yra naujas video
      this.showCategory(category);
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Nepavyko įkelti video');
      
      const popup = document.getElementById('file-popup');
      const videoFile = document.getElementById('video-file');
      
      if (popup) popup.style.display = 'none';
      if (videoFile) videoFile.value = null;
    }
  },
  
  /**
   * Sukuria video kortelę
   * @param {Object} video - Video objektas
   * @param {number} index - Video indeksas masyve
   * @returns {HTMLElement} - Video kortelės elementas
   */
  createVideoCard(video, index) {
    try {
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
        thumbnail.onerror = () => {
          thumbnail.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 640 360%22%3E%3Crect width%3D%22640%22 height%3D%22360%22 fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Ctext x%3D%22320%22 y%3D%22180%22 text-anchor%3D%22middle%22 dominant-baseline%3D%22middle%22 font-family%3D%22sans-serif%22 font-size%3D%2224%22 fill%3D%22%23999%22%3EThumbnail not found%3C%2Ftext%3E%3C%2Fsvg%3E';
        };
        
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
      title.textContent = video.title || 'Untitled Video';
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
      progress.value = video.progress || 0;
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
    } catch (error) {
      console.error('Error creating video card:', error, video);
      
      // Sukuriame paprastą kortelę klaidos atveju
      const errorCard = document.createElement('div');
      errorCard.className = 'video-card';
      errorCard.textContent = 'Error loading video';
      return errorCard;
    }
  },
  
  /**
   * Atvaizduoja visus video
   */
  renderVideos() {
    try {
      // Išvalome visus konteinerius
      document.querySelectorAll('.video-container').forEach(container => {
        if (container) container.innerHTML = '';
      });
      
      // Užbaigtų video atvaizdavimas
      const completedVideos = DataStore.getCompletedVideos();
      const completedContainer = document.getElementById('completed-videos');
      
      if (completedContainer) {
        completedVideos.forEach((video, index) => {
          const card = this.createVideoCard(video, index);
          completedContainer.appendChild(card);
        });
      }
      
      // Aktyvių video atvaizdavimas pagal kategorijas
      const activeVideos = DataStore.getActiveVideos();
      
      activeVideos.forEach((video, index) => {
        if (!video.category) {
          video.category = 'other';
        }
        
        const containerId = DataStore.getCategoryContainerId(video.category);
        const container = document.getElementById(containerId);
        
        if (container) {
          const card = this.createVideoCard(video, index);
          container.appendChild(card);
        }
      });
      
      console.log('Videos rendered');
    } catch (error) {
      console.error('Error rendering videos:', error);
    }
  },
  
  /**
   * Redaguoja video pavadinimą
   * @param {string} videoId - Video ID
   */
  editVideoTitle(videoId) {
    try {
      const video = DataStore.videos.find(v => v.id === videoId);
      if (!video) {
        console.error('Video not found for editing:', videoId);
        return;
      }
      
      const newTitle = prompt('Įveskite naują video pavadinimą:', video.title);
      if (newTitle && newTitle.trim() !== '') {
        DataStore.updateVideo(videoId, { title: newTitle.trim() });
        this.renderVideos();
      }
    } catch (error) {
      console.error('Error editing video title:', error);
    }
  },
  
  /**
   * Ištrina video
   * @param {string} videoId - Video ID
   */
  async deleteVideo(videoId) {
    try {
      if (confirm('Ar tikrai norite ištrinti šį video?')) {
        const success = await DataStore.deleteVideo(videoId);
        
        if (success) {
          this.renderVideos();
          this.updateCounters();
        }
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  }
};
