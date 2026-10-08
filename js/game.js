// game.js -- Étape 5 + Bloc 1 : Interaction joueur et règles complètes
//
// Responsabilité : gérer l'état de la partie et les événements joueur.
//
// Dépendances (ordre de chargement dans index.html) :
//   board.js    → createBoard(), squareToIndex()
//   pieces.js   → initBoard(), createPiece()
//   moves.js    → getLegalMoves(), isKingInCheck(), getGameStatus()
//   renderer.js → renderBoard()


// ═══════════════════════════════════════════════════════════════════
// ÉTAT DE LA PARTIE
// ═══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// gameState
//
// La "mémoire" complète de la partie en cours.
//
// Propriétés :
//   board           -- tableau de 64 cases
//   selectedIndex   -- index de la pièce sélectionnée, ou null
//   legalMoves      -- cases accessibles pour la pièce sélectionnée
//   currentPlayer   -- 'white' ou 'black'
//   status          -- 'playing' | 'check' | 'checkmate' | 'stalemate'
//   castlingRights  -- droits de roque pour chaque côté
//   enPassantTarget -- index de la case cible en passant, ou null
// ─────────────────────────────────────────────
const gameState = {
  board: [],
  selectedIndex: null,
  legalMoves: [],
  currentPlayer: 'white',
  status: 'playing',

  // Droits de roque : true = le roi/la tour n'a PAS encore bougé
  castlingRights: {
    whiteKingside:  true,
    whiteQueenside: true,
    blackKingside:  true,
    blackQueenside: true,
  },

  // Index de la case "traversée" par un pion qui vient d'avancer de 2 cases.
  // null = pas de prise en passant disponible ce tour.
  enPassantTarget: null,

  // Mode de jeu : 'local' (joueur vs joueur) ou 'ai' (joueur vs IA)
  gameMode: 'local',

  // État de réflexion de l'IA : true pendant le délai (bloque les clics)
  aiThinking: false,
};


// ═══════════════════════════════════════════════════════════════════
// FONCTIONS INTERNES
// ═══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// render()
// Re-dessine le plateau avec l'état actuel.
// ─────────────────────────────────────────────
function render() {
  renderBoard(
    gameState.board,
    'board',
    gameState.selectedIndex,
    gameState.legalMoves
  );
}


// ─────────────────────────────────────────────
// selectPiece(index)
// Sélectionne une pièce et calcule ses mouvements légaux.
// Passe les droits de roque et la cible en passant à getLegalMoves.
// ─────────────────────────────────────────────
function selectPiece(index) {
  gameState.selectedIndex = index;
  gameState.legalMoves = getLegalMoves(
    gameState.board,
    index,
    gameState.castlingRights,
    gameState.enPassantTarget
  );
  render();
}


// ─────────────────────────────────────────────
// clearSelection()
// Efface la sélection et les surbrillances.
// ─────────────────────────────────────────────
function clearSelection() {
  gameState.selectedIndex = null;
  gameState.legalMoves = [];
  render();
}


// ─────────────────────────────────────────────
// updateGameInfo()
// Met à jour la zone #game-info selon l'état actuel de la partie.
// Affiche l'indicateur de tour et les messages de fin de partie.
// Affiche le bouton "Nouvelle partie" en overlay uniquement en fin de partie.
// À appeler après chaque coup et lors de l'initialisation.
// ─────────────────────────────────────────────
function updateGameInfo() {
  const indicator = document.getElementById('turn-indicator');
  const btnNewGame = document.getElementById('btn-new-game');
  
  // Si l'indicateur n'existe pas (pas encore dans le DOM), on ne fait rien
  if (!indicator) return;

  // ── CAS SPÉCIAL : IA en réflexion ─────────────────────────────
  if (gameState.aiThinking) {
    indicator.textContent = '🤖 L\'IA réfléchit...';
    indicator.className = 'status--ai-thinking';
    return;
  }

  const status = gameState.status;
  const player = gameState.currentPlayer;

  // Par défaut, cacher le bouton "Nouvelle partie"
  if (btnNewGame) {
    btnNewGame.style.display = 'none';
  }

  if (status === 'playing') {
    const icon = player === 'white' ? '⬜' : '⬛';
    const name = player === 'white' ? 'Blancs' : 'Noirs';
    indicator.textContent = `${icon} ${name} jouent`;
    indicator.className = 'status--playing';

  } else if (status === 'check') {
    const icon = player === 'white' ? '⬜' : '⬛';
    const name = player === 'white' ? 'Blancs' : 'Noirs';
    indicator.textContent = `⚠️ ${name} sont en échec !`;
    indicator.className = 'status--check';

  } else if (status === 'checkmate') {
    // Le joueur actif n'a plus de coups → l'adversaire a gagné
    const winner = player === 'white' ? 'Noirs' : 'Blancs';
    indicator.textContent = `♟ Les ${winner} gagnent — Échec et mat !`;
    indicator.className = 'status--checkmate';
    
    // Afficher le bouton "Nouvelle partie" en overlay
    if (btnNewGame) {
      btnNewGame.style.display = 'block';
    }

  } else if (status === 'stalemate') {
    indicator.textContent = '🤝 Match nul — Pat !';
    indicator.className = 'status--stalemate';
    
    // Afficher le bouton "Nouvelle partie" en overlay
    if (btnNewGame) {
      btnNewGame.style.display = 'block';
    }
  }
}


// ─────────────────────────────────────────────
// triggerAI()
// Déclenche le coup de l'IA après un délai de 300ms.
// Bloque le plateau pendant la réflexion.
// Ne fait rien si la partie est terminée.
// ─────────────────────────────────────────────
function triggerAI() {
  // Ne pas jouer si la partie est terminée
  if (gameState.status !== 'playing' && gameState.status !== 'check') return;

  // Bloquer le plateau
  gameState.aiThinking = true;
  updateGameInfo(); // affiche "🤖 L'IA réfléchit..."

  // Délai de 300ms avant le coup
  setTimeout(function() {
    // Obtenir le meilleur coup
    const move = getBestMove(
      gameState.board,
      'black',
      gameState.castlingRights,
      gameState.enPassantTarget
    );

    // Si un coup existe, l'exécuter
    if (move) {
      gameState._epTargetBeforeMove = gameState.enPassantTarget;
      applyMove(move.from, move.to);
    }

    // Débloquer le plateau
    gameState.aiThinking = false;
  }, 300);
}


// ─────────────────────────────────────────────
// applyMove(from, to)
// Déplace une pièce de 'from' vers 'to'.
// Gère tous les cas spéciaux : roque, en passant, promotion.
// Met à jour les droits de roque et la cible en passant.
// Bascule le tour et vérifie l'état de la partie.
//
// Remplace l'ancienne fonction movePiece().
// ─────────────────────────────────────────────
function applyMove(from, to) {
  const piece = gameState.board[from];
  const board = gameState.board;

  // ── Réinitialisation de la cible en passant ────────────────────
  // Par défaut, la prise en passant n'est plus disponible au prochain tour.
  // Elle sera re-définie plus bas si ce coup est une avance de 2 cases.
  gameState.enPassantTarget = null;

  // ── CAS SPÉCIAL 1 : Roque ──────────────────────────────────────
  // Détection : le roi se déplace de 2 cases sur l'horizontale.
  if (piece.type === 'king') {
    const colFrom = from % 8;
    const colTo   = to % 8;

    if (Math.abs(colTo - colFrom) === 2) {
      // C'est un roque. On déplace aussi la tour.
      const row = Math.floor(from / 8);

      if (colTo === 6) {
        // Petit roque : tour de h → f
        board[row * 8 + 5] = board[row * 8 + 7]; // tour vers f
        board[row * 8 + 7] = null;                // h vide
      } else if (colTo === 2) {
        // Grand roque : tour de a → d
        board[row * 8 + 3] = board[row * 8 + 0]; // tour vers d
        board[row * 8 + 0] = null;                // a vide
      }
    }

    // Le roi a bougé : perte de tous les droits de roque pour cette couleur
    if (piece.color === 'white') {
      gameState.castlingRights.whiteKingside  = false;
      gameState.castlingRights.whiteQueenside = false;
    } else {
      gameState.castlingRights.blackKingside  = false;
      gameState.castlingRights.blackQueenside = false;
    }
  }

  // ── Mise à jour des droits de roque si une tour bouge ─────────
  // (ou si une tour est capturée sur sa case de départ)
  const rookStartSquares = {
    0:  'whiteQueenside',
    7:  'whiteKingside',
    56: 'blackQueenside',
    63: 'blackKingside',
  };
  if (rookStartSquares[from]) {
    gameState.castlingRights[rookStartSquares[from]] = false;
  }
  if (rookStartSquares[to]) {
    // Tour capturée sur sa case de départ → perte du droit de ce côté
    gameState.castlingRights[rookStartSquares[to]] = false;
  }

  // ── CAS SPÉCIAL 2 : Prise en passant ──────────────────────────
  // Le pion se déplace en diagonale vers la case enPassantTarget (vide).
  // Le pion adverse à capturer est sur la même rangée que 'from', même colonne que 'to'.
  // gameState._epTargetBeforeMove a été sauvegardé par handleSquareClick avant cet appel.
  if (piece.type === 'pawn' && to === gameState._epTargetBeforeMove) {
    const direction = piece.color === 'white' ? -1 : +1;
    const capturedPawnIndex = to + direction * 8;
    board[capturedPawnIndex] = null;
  }

  // ── Déplacement normal ─────────────────────────────────────────
  board[to]   = board[from];
  board[from] = null;

  // ── CAS SPÉCIAL 3 : Promotion du pion ─────────────────────────
  // Un pion atteignant la dernière rangée devient automatiquement une dame.
  if (piece.type === 'pawn') {
    const toRow = Math.floor(to / 8);
    if ((piece.color === 'white' && toRow === 7) ||
        (piece.color === 'black' && toRow === 0)) {
      board[to] = createPiece('queen', piece.color);
    }

    // ── Mise à jour de la cible en passant pour le prochain tour ──
    // Si ce pion vient d'avancer de 2 cases, on enregistre la case traversée.
    const fromRow = Math.floor(from / 8);
    if (Math.abs(toRow - fromRow) === 2) {
      const direction = piece.color === 'white' ? +1 : -1;
      gameState.enPassantTarget = from + direction * 8;
    }
  }

  // ── Alternance des tours ───────────────────────────────────────
  gameState.currentPlayer = (gameState.currentPlayer === 'white') ? 'black' : 'white';

  // ── Vérification de l'état de la partie ───────────────────────
  gameState.status = getGameStatus(
    gameState.board,
    gameState.currentPlayer,
    gameState.castlingRights,
    gameState.enPassantTarget
  );

  // Log de l'état en console (utile pour le développement)
  if (gameState.status !== 'playing') {
    console.log('État de la partie :', gameState.status);
  }

  // ── Effacer la sélection et re-dessiner ───────────────────────
  gameState.selectedIndex = null;
  gameState.legalMoves = [];
  render();
  updateGameInfo();

  // ── Déclencher l'IA si c'est son tour ─────────────────────────
  if (gameState.gameMode === 'ai' && gameState.currentPlayer === 'black') {
    triggerAI();
  }
}


// ═══════════════════════════════════════════════════════════════════
// LOGIQUE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// handleSquareClick(index)
// Logique de clic : sélection, désélection, déplacement.
// Ignore les clics si la partie est terminée.
// ─────────────────────────────────────────────
function handleSquareClick(index) {
  // Bloquer les clics pendant la réflexion de l'IA
  if (gameState.aiThinking) return;

  // Si la partie est terminée, on n'accepte plus de coups
  if (gameState.status === 'checkmate' || gameState.status === 'stalemate') return;

  const piece = gameState.board[index];
  const hasPieceSelected = gameState.selectedIndex !== null;

  // ── Situation A : une pièce est déjà sélectionnée ─────────────
  if (hasPieceSelected) {

    // A1 — clic sur une case surlignée → déplacer
    if (gameState.legalMoves.includes(index)) {
      // Sauvegarder la cible en passant AVANT applyMove la réinitialise
      gameState._epTargetBeforeMove = gameState.enPassantTarget;
      applyMove(gameState.selectedIndex, index);
      return;
    }

    // A2 — clic sur une autre pièce alliée → changer la sélection
    if (piece !== null && piece.color === gameState.currentPlayer) {
      selectPiece(index);
      return;
    }

    // A3 — clic ailleurs → désélectionner
    clearSelection();
    return;
  }

  // ── Situation B : rien n'est sélectionné ──────────────────────

  // B1 — clic sur une pièce du joueur actif → sélectionner
  if (piece !== null && piece.color === gameState.currentPlayer) {
    selectPiece(index);
    return;
  }

  // B2 — clic ailleurs → rien
}


// ═══════════════════════════════════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// initGame(mode)
// Point d'entrée. Initialise le plateau, les droits de roque,
// la cible en passant, affiche le rendu et attache les écouteurs.
//
// Paramètres :
//   mode -- 'local' (joueur vs joueur) ou 'ai' (joueur vs IA). Défaut : 'local'
// ─────────────────────────────────────────────
function initGame(mode = 'local') {
  // Initialisation du plateau
  gameState.board          = createBoard();
  initBoard(gameState.board);
  gameState.selectedIndex  = null;
  gameState.legalMoves     = [];
  gameState.currentPlayer  = 'white';
  gameState.status         = 'playing';
  gameState.enPassantTarget = null;
  gameState._epTargetBeforeMove = null;
  gameState.gameMode       = mode;
  gameState.aiThinking     = false;
  gameState.castlingRights = {
    whiteKingside:  true,
    whiteQueenside: true,
    blackKingside:  true,
    blackQueenside: true,
  };

  // Premier rendu
  render();
  updateGameInfo();

  // Écouteurs d'événements (délégation sur #board, un seul écouteur)
  const boardEl = document.getElementById('board');

  // Clic souris
  boardEl.addEventListener('click', function(event) {
    const squareEl = event.target.closest('.square');
    if (!squareEl) return;
    const index = parseInt(squareEl.dataset.index, 10);
    handleSquareClick(index);
  });

  // Toucher mobile
  boardEl.addEventListener('touchstart', function(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const elementAtTouch = document.elementFromPoint(touch.clientX, touch.clientY);
    const squareEl = elementAtTouch ? elementAtTouch.closest('.square') : null;
    if (!squareEl) return;
    const index = parseInt(squareEl.dataset.index, 10);
    handleSquareClick(index);
  }, { passive: false });

  // Bouton "Nouvelle partie"
  const btnNewGame = document.getElementById('btn-new-game');
  if (btnNewGame) {
    // Retirer l'ancien écouteur s'il existe pour éviter les doublons
    btnNewGame.replaceWith(btnNewGame.cloneNode(true));
    const freshBtn = document.getElementById('btn-new-game');
    freshBtn.addEventListener('click', function() {
      initGame();
    });
  }
}
