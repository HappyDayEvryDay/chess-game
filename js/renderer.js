// renderer.js -- Étape 3 : Affichage graphique du plateau
//
// Responsabilité UNIQUE : lire le tableau board[] et produire le HTML visuel.
// Ce fichier ne connaît pas les règles du jeu. Il n'effectue aucun déplacement.
//
// Fonctions exportées :
//   renderBoard(board, containerId)  -- point d'entrée principal


// ─────────────────────────────────────────────
// SYMBOLES UNICODE DES PIÈCES
//
// Chaque pièce a un symbole Unicode unique.
// On utilise un objet imbriqué : PIECE_SYMBOLS[color][type]
// ─────────────────────────────────────────────
const PIECE_SYMBOLS = {
  white: {
    king:   '♔',
    queen:  '♕',
    rook:   '♖',
    bishop: '♗',
    knight: '♘',
    pawn:   '♙'
  },
  black: {
    king:   '♚',
    queen:  '♛',
    rook:   '♜',
    bishop: '♝',
    knight: '♞',
    pawn:   '♟'
  }
};


// ─────────────────────────────────────────────
// getPieceSymbol(piece)
// Retourne le symbole Unicode correspondant à une pièce.
//
// Paramètre :
//   piece -- objet { type, color } ou null
//
// Retourne :
//   une chaîne comme '♔' ou '' si la case est vide
// ─────────────────────────────────────────────
function getPieceSymbol(piece) {
  if (piece === null) return '';
  return PIECE_SYMBOLS[piece.color][piece.type];
}


// ─────────────────────────────────────────────
// createSquareElement(index, piece, isSelected, highlightClass)
// Crée et retourne un élément <div> représentant une case du plateau.
//
// Paramètres :
//   index         -- nombre entre 0 et 63 (position dans board[])
//   piece         -- objet { type, color } ou null
//   isSelected    -- true si cette case est la pièce sélectionnée
//   highlightClass -- 'square--highlight', 'square--capture', ou null
//
// Retourne :
//   un élément DOM <div class="square square--light|dark [...]"> ...
//
// Calcul de la couleur :
//   col = index % 8          → colonne 0 à 7
//   row = Math.floor(index/8)→ rangée 0 à 7
//   si (col + row) est pair  → case sombre (a1 est sombre, conforme aux échecs)
// ─────────────────────────────────────────────
function createSquareElement(index, piece, isSelected, highlightClass) {
  const col = index % 8;
  const row = Math.floor(index / 8);

  // Création de la case
  const square = document.createElement('div');
  square.classList.add('square');
  square.classList.add((col + row) % 2 === 0 ? 'square--dark' : 'square--light');

  // Attribut data pour la gestion des événements (game.js lit cet attribut)
  square.dataset.index = index;

  // Surbrillance : pièce sélectionnée
  if (isSelected) {
    square.classList.add('square--selected');
  }

  // Surbrillance : case accessible (vide) ou case de capture (ennemi)
  if (highlightClass) {
    square.classList.add(highlightClass);
  }

  // Ajout du symbole de pièce si la case n'est pas vide
  if (piece !== null) {
    const pieceEl = document.createElement('span');
    pieceEl.classList.add('piece');
    pieceEl.classList.add('piece--' + piece.color); // 'piece--white' ou 'piece--black'
    pieceEl.textContent = getPieceSymbol(piece);
    square.appendChild(pieceEl);
  }

  return square;
}


// ─────────────────────────────────────────────
// renderBoard(board, containerId, selectedIndex, highlights)
// Point d'entrée principal. Lit le tableau board[] et insère
// les 64 cases dans le <div> ciblé.
//
// Paramètres :
//   board         -- tableau de 64 cases (de board.js + pieces.js)
//   containerId   -- id de l'élément HTML qui recevra le plateau (ex: 'board')
//   selectedIndex -- index de la case sélectionnée, ou null
//   highlights    -- tableau d'index à mettre en surbrillance, ou []
//                    Chaque index peut être une case vide (.square--highlight)
//                    ou une case ennemie (.square--capture)
//
// Ordre de rendu :
//   On affiche la rangée 8 en HAUT (côté noir) et la rangée 1 en BAS (côté blanc).
//   Donc on parcourt les rangées de 7 → 0.
//
// Ne retourne rien -- modifie directement le DOM.
// ─────────────────────────────────────────────
function renderBoard(board, containerId, selectedIndex, highlights) {
  const container = document.getElementById(containerId);

  // Sécurité : si l'élément n'existe pas, on arrête proprement
  if (!container) {
    console.error('renderBoard : élément #' + containerId + ' introuvable.');
    return;
  }

  // Valeurs par défaut pour les paramètres optionnels
  const selected = (selectedIndex !== undefined && selectedIndex !== null) ? selectedIndex : -1;
  const highlightSet = new Set(highlights || []); // Set pour une recherche en O(1)

  // Vide le contenu précédent (utile si renderBoard est rappelée plus tard)
  container.innerHTML = '';

  // Parcours visuel : rangée 8 en haut → rangée 1 en bas
  for (let row = 7; row >= 0; row--) {
    for (let col = 0; col < 8; col++) {
      const index = row * 8 + col;
      const piece = board[index];

      // Est-ce la case sélectionnée ?
      const isSelected = (index === selected);

      // Quelle surbrillance appliquer ?
      // Si l'index est dans les highlights : vide → .square--highlight, ennemi → .square--capture
      let highlightClass = null;
      if (highlightSet.has(index)) {
        highlightClass = (piece !== null) ? 'square--capture' : 'square--highlight';
      }

      const squareEl = createSquareElement(index, piece, isSelected, highlightClass);
      container.appendChild(squareEl);
    }
  }
}
