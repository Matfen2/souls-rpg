import express from 'express';
import {
  createGame,
  getAllGames,
  getGameById,
  searchGames,
  filterGames,
  getGamesByCategory,
  getGamesBySubGenre,
  getSimilarGames,
  getFeaturedGames,
  getStats
} from '../controllers/gameController.js';

const router = express.Router();

// ========================================
// ROUTES SPÉCIALES (doivent être avant /:id)
// ========================================

// Route de recherche
router.get('/search', searchGames);

// Route de filtrage
router.get('/filter', filterGames);

// Route pour les jeux en vedette
router.get('/featured', getFeaturedGames);

// Route des statistiques
router.get('/stats', getStats);

// ========================================
// ROUTES PRINCIPALES
// ========================================

// Routes de base
router.route('/')
  .get(getAllGames)
  .post(createGame);

// ========================================
// ROUTES PAR CATÉGORIE ET SOUS-GENRE
// ========================================

// Routes par catégorie
router.get('/category/:category', getGamesByCategory);

// Routes par sous-genre
router.get('/subgenre/:subGenre', getGamesBySubGenre);

// ========================================
// ROUTES SPÉCIFIQUES À UN JEU
// ========================================

// Jeux similaires (doit être avant /:id)
router.get('/:id/similar', getSimilarGames);

// Récupérer un jeu par ID
router.get('/:id', getGameById);

export default router;