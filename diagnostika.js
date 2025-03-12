// diagnostika.js
document.addEventListener('DOMContentLoaded', function() {
  // Diagnostikos elementas
  const diagDiv = document.createElement('div');
  diagDiv.style.position = 'fixed';
  diagDiv.style.bottom = '10px';
  diagDiv.style.left = '10px';
  diagDiv.style.right = '10px';
  diagDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
  diagDiv.style.color = 'white';
  diagDiv.style.padding = '10px';
  diagDiv.style.fontSize = '12px';
  diagDiv.style.maxHeight = '150px';
  diagDiv.style.overflow = 'auto';
  diagDiv.style.zIndex = '9999';
  diagDiv.id = 'diagnostics';
  document.body.appendChild(diagDiv);

  // Logavimo funkcija
  window.logDiag = function(message) {
    const diagDiv = document.getElementById('diagnostics');
    if (diagDiv) {
      diagDiv.innerHTML += `<div>${new Date().toISOString().substring(11, 19)}: ${message}</div>`;
      diagDiv.scrollTop = diagDiv.scrollHeight;
    }
    console.log(message);
  };

  // Pradinis testavimas
  logDiag(`Naršyklė: ${navigator.userAgent}`);
  logDiag(`Laikas: ${new Date().toISOString()}`);
  
  // Firebase versijos tikrinimas
  if (firebase && firebase.SDK_VERSION) {
    logDiag(`Firebase SDK versija: ${firebase.SDK_VERSION}`);
  }

  // Įterpiame papildomą Google prisijungimo mygtuką tiesiogiai HTML
  const altLoginBtn = document.createElement('button');
  altLoginBtn.textContent = 'Bandyti kitą Google prisijungimą';
  altLoginBtn.style.marginTop = '10px';
  altLoginBtn.style.padding = '10px';
  altLoginBtn.style.display = 'block';
  altLoginBtn.style.width = '100%';
  altLoginBtn.style.backgroundColor = '#4285F4';
  altLoginBtn.style.color = 'white';
  altLoginBtn.style.border = 'none';
  altLoginBtn.style.borderRadius = '4px';
  
  const authButtons = document.querySelector('.auth-buttons');
  if (authButtons) {
    authButtons.appendChild(altLoginBtn);
  }
  
  // Pridedame naują prisijungimo funkciją
  altLoginBtn.addEventListener('click', function() {
    logDiag('Bandomas alternatyvus Google prisijungimas...');
    
    try {
      // Tiesioginis Google prisijungimas
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      // Nustatome custom parametrus
      provider.setCustomParameters({
        'prompt': 'select_account'
      });
      
      // Visada naudojame popup, nepriklausomai nuo įrenginio
      logDiag('Naudojamas popup metodas visiems įrenginiams');
      
      firebase.auth().signInWithPopup(provider)
        .then(result => {
          logDiag('Google prisijungimas sėkmingas (popup)');
        })
        .catch(error => {
          logDiag(`Google prisijungimo klaida (popup): ${error.code} - ${error.message}`);
          alert('Klaida prisijungiant su Google: ' + error.message);
        });
    } catch (error) {
      logDiag(`Google prisijungimo inicializavimo klaida: ${error.message}`);
      alert('Klaida inicializuojant Google prisijungimą: ' + error.message);
    }
  });
  
  // Pakeičiame originalų Google mygtuką
  const googleLoginBtn = document.getElementById('login-with-google');
  if (googleLoginBtn) {
    // Išsaugome originalią onclick funkciją
    const originalClick = googleLoginBtn.onclick;
    
    googleLoginBtn.onclick = function(e) {
      e.preventDefault();
      logDiag('Paspaustas originalus Google mygtukas');
      
      // Mobiliuose įrenginiuose naudojame alternatyvų metodą
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        logDiag('Mobilusis įrenginys - bandomas tiesioginis popup');
        
        try {
          const provider = new firebase.auth.GoogleAuthProvider();
          
          // Nustatome custom parametrus
          provider.setCustomParameters({
            'prompt': 'select_account'
          });
          
          firebase.auth().signInWithPopup(provider)
            .then(result => {
              logDiag('Google prisijungimas sėkmingas (popup)');
            })
            .catch(error => {
              logDiag(`Google prisijungimo klaida (popup): ${error.code} - ${error.message}`);
              
              // Jei popup nepavyksta, bandome redirect
              logDiag('Bandomas redirect metodas...');
              firebase.auth().signInWithRedirect(provider)
                .catch(redirectError => {
                  logDiag(`Redirect klaida: ${redirectError.message}`);
                });
            });
        } catch (error) {
          logDiag(`Google prisijungimo klaida: ${error.message}`);
        }
      } else {
        // Kompiuteryje paliekame originalų veikimą
        if (originalClick) originalClick.call(this, e);
      }
    };
  }
  
  // Tikriname Firebase DB prisijungimą
  setTimeout(function() {
    try {
      if (firebase && firebase.database) {
        logDiag('Testuojamas DB prisijungimas...');
        
        firebase.database().ref('.info/connected').on('value', function(snap) {
          if (snap.val() === true) {
            logDiag('✓ Prisijungta prie Firebase DB');
          } else {
            logDiag('✗ Neprisijungta prie Firebase DB');
          }
        }, function(error) {
          logDiag(`✗ DB prisijungimo klaida: ${error.code} - ${error.message}`);
        });
      }
    } catch (e) {
      logDiag(`✗ Firebase DB testavimo klaida: ${e.message}`);
    }
  }, 3000);
  
  // Tikriname redirect rezultatą
  if (firebase && firebase.auth) {
    firebase.auth().getRedirectResult()
      .then(function(result) {
        if (result.user) {
          logDiag(`✓ Redirect rezultatas: prisijungta kaip ${result.user.email}`);
        } else {
          logDiag('ℹ️ Nėra redirect rezultato');
        }
      })
      .catch(function(error) {
        logDiag(`✗ Redirect klaida: ${error.code} - ${error.message}`);
      });
  }
});
