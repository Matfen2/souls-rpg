import Game from '../models/Game.js';

// @desc    Créer un nouveau jeu
// @route   POST /api/games
// @access  Public
export const createGame = async (req, res) => {
  try {
    const game = await Game.create(req.body);
    
    res.status(201).json({
      success: true,
      data: game
    });
  } catch (error) {
    // Gérer les erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: messages
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création du jeu',
      error: error.message
    });
  }
};

// @desc    Récupérer tous les jeux
// @route   GET /api/games
// @access  Public
export const getAllGames = async (req, res) => {
  try {
    const games = await Game.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.status(200).json({
      success: true,
      count: games.length,
      data: games
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des jeux',
      error: error.message
    });
  }
};

// @desc    Récupérer un jeu par ID
// @route   GET /api/games/:id
// @access  Public
export const getGameById = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id).select('-__v');
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Jeu non trouvé'
      });
    }
    
    if (!game.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Ce jeu n\'est plus disponible'
      });
    }
    
    res.status(200).json({
      success: true,
      data: game
    });
  } catch (error) {
    // Gérer les erreurs d'ID invalide
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Jeu non trouvé (ID invalide)'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du jeu',
      error: error.message
    });
  }
};

// @desc    Rechercher des jeux par titre
// @route   GET /api/games/search?q=query
// @access  Public
export const searchGames = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un terme de recherche'
      });
    }
    
    // Recherche textuelle sur le titre
    const games = await Game.find({
      $text: { $search: q },
      isActive: true
    })
      .select('-__v')
      .sort({ score: { $meta: 'textScore' } });
    
    res.status(200).json({
      success: true,
      count: games.length,
      data: games
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
      error: error.message
    });
  }
};

// @desc    Filtrer les jeux
// @route   GET /api/games/filter
// @access  Public
export const filterGames = async (req, res) => {
  try {
    const { category, subGenre, platform, minRating, maxRating, featured, sortBy } = req.query;
    
    let query = { isActive: true };
    
    // Filtrer par catégorie
    if (category) {
      query.category = category.toLowerCase();
    }
    
    // Filtrer par sous-genre
    if (subGenre) {
      query.subGenre = subGenre.toLowerCase();
    }
    
    // Filtrer par plateforme
    if (platform) {
      query.platforms = { $in: [platform] };
    }
    
    // Filtrer par note
    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = parseFloat(minRating);
      if (maxRating) query.rating.$lte = parseFloat(maxRating);
    }
    
    // Filtrer par featured
    if (featured !== undefined) {
      query.featured = featured === 'true';
    }
    
    // Déterminer le tri
    let sortOption = { createdAt: -1 }; // Par défaut: plus récents
    if (sortBy === 'rating') sortOption = { rating: -1 };
    if (sortBy === 'title') sortOption = { title: 1 };
    if (sortBy === 'releaseDate') sortOption = { releaseDate: -1 };
    
    const games = await Game.find(query)
      .sort(sortOption)
      .select('-__v');
    
    res.status(200).json({
      success: true,
      count: games.length,
      filters: {
        category,
        subGenre,
        platform,
        minRating,
        maxRating,
        featured,
        sortBy
      },
      data: games
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du filtrage des jeux',
      error: error.message
    });
  }
};

// @desc    Récupérer les jeux par catégorie
// @route   GET /api/games/category/:category
// @access  Public
export const getGamesByCategory = async (req, res) => {
  try {
    const games = await Game.find({ 
      category: req.params.category.toLowerCase(),
      isActive: true
    })
      .sort({ rating: -1 })
      .select('-__v');
    
    res.status(200).json({
      success: true,
      category: req.params.category,
      count: games.length,
      data: games
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des jeux par catégorie',
      error: error.message
    });
  }
};

// @desc    Récupérer les jeux par sous-genre
// @route   GET /api/games/subgenre/:subGenre
// @access  Public
export const getGamesBySubGenre = async (req, res) => {
  try {
    const games = await Game.find({ 
      subGenre: req.params.subGenre.toLowerCase(),
      isActive: true
    })
      .sort({ rating: -1 })
      .select('-__v');
    
    res.status(200).json({
      success: true,
      subGenre: req.params.subGenre,
      count: games.length,
      data: games
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des jeux par sous-genre',
      error: error.message
    });
  }
};

// @desc    Récupérer les jeux similaires
// @route   GET /api/games/:id/similar
// @access  Public
export const getSimilarGames = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Jeu non trouvé'
      });
    }
    
    // Utiliser la méthode du modèle
    const similarGames = await game.getSimilarGames(4);
    
    res.status(200).json({
      success: true,
      count: similarGames.length,
      basedOn: {
        title: game.title,
        category: game.category,
        subGenre: game.subGenre,
        tags: game.tags
      },
      data: similarGames
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Jeu non trouvé (ID invalide)'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des jeux similaires',
      error: error.message
    });
  }
};

// @desc    Récupérer les jeux en vedette
// @route   GET /api/games/featured
// @access  Public
export const getFeaturedGames = async (req, res) => {
  try {
    const games = await Game.find({ 
      featured: true,
      isActive: true
    })
      .sort({ rating: -1 })
      .select('-__v');
    
    res.status(200).json({
      success: true,
      count: games.length,
      data: games
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des jeux en vedette',
      error: error.message
    });
  }
};

// @desc    Récupérer les statistiques générales
// @route   GET /api/games/stats
// @access  Public
export const getStats = async (req, res) => {
  try {
    const totalGames = await Game.countDocuments({ isActive: true });
    const featuredGames = await Game.countDocuments({ featured: true, isActive: true });
    
    const gamesByCategory = await Game.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    const gamesBySubGenre = await Game.aggregate([
      { $match: { isActive: true, subGenre: { $ne: null } } },
      { $group: { _id: '$subGenre', count: { $sum: 1 } } }
    ]);
    
    const topRatedGames = await Game.find({ isActive: true })
      .sort({ rating: -1 })
      .limit(5)
      .select('title rating category subGenre');
    
    res.status(200).json({
      success: true,
      stats: {
        totalGames,
        featuredGames,
        byCategory: gamesByCategory,
        bySubGenre: gamesBySubGenre,
        topRated: topRatedGames
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};