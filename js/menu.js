// ══════════════════════════════════════════════════════════════
// menu.js — Navigation entre les vues (menu ↔ jeu)
// ══════════════════════════════════════════════════════════════

/**
 * Affiche le menu d'accueil et cache le plateau de jeu
 */
function showMenu() {
  const viewMenu = document.getElementById('view-menu');
  const viewGame = document.getElementById('view-game');
  
  if (viewMenu) viewMenu.style.display = 'flex';
  if (viewGame) viewGame.style.display = 'none';
}

/**
 * Affiche le plateau de jeu et cache le menu d'accueil
 */
function showGame() {
  const viewMenu = document.getElementById('view-menu');
  const viewGame = document.getElementById('view-game');
  
  if (viewMenu) viewMenu.style.display = 'none';
  if (viewGame) viewGame.style.display = 'flex';
}

// ── Attacher les écouteurs d'événements au chargement de la page ────

document.addEventListener('DOMContentLoaded', function() {
  
  // ── Bouton "Joueur vs Joueur (Local)" ────────────────────────────
  const btnLocal = document.getElementById('btn-local');
  if (btnLocal) {
    btnLocal.addEventListener('click', function() {
      showGame();
      // Initialiser le jeu en mode local (joueur vs joueur)
      if (typeof initGame === 'function') {
        initGame('local');
      }
    });
  }

  // ── Bouton "Contre l'IA" ──────────────────────────────────────────
  const btnAI = document.getElementById('btn-ai');
  if (btnAI) {
    btnAI.addEventListener('click', function() {
      showGame();
      // Initialiser le jeu en mode IA (joueur vs IA)
      if (typeof initGame === 'function') {
        initGame('ai');
      }
    });
  }

  // ── Bouton "Retour au menu" ───────────────────────────────────────
  const btnBackMenu = document.getElementById('btn-back-menu');
  if (btnBackMenu) {
    btnBackMenu.addEventListener('click', function() {
      showMenu();
      
      // Optionnel : réinitialiser le plateau pour un état propre
      // Si on veut repartir de zéro à chaque retour au menu :
      // (pour l'instant on laisse l'état en place, 
      //  mais on pourrait appeler une fonction resetGame() ici)
    });
  }

});
