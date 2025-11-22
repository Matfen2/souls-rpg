import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Le titre du jeu est obligatoire'],
      trim: true,
      maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
    },
    
    category: {
      type: String,
      required: [true, 'La catégorie est obligatoire'],
      enum: {
        values: ['action-rpg', 'jrpg', 'crpg'],
        message: '{VALUE} n\'est pas une catégorie valide. Utilisez: action-rpg, jrpg, ou crpg'
      },
      lowercase: true
    },
    
    subGenre: {
      type: String,
      enum: {
        values: [
          'souls-like',      // Dark Souls, Bloodborne, Sekiro, Elden Ring
          'metroidvania',    // Hollow Knight, Blasphemous
          'open-world',      // The Witcher 3, Skyrim
          'hack-and-slash',  // Devil May Cry, Bayonetta
          'turn-based',      // Persona, Final Fantasy
          'tactical',        // Fire Emblem, XCOM
          'dungeon-crawler', // Diablo, Path of Exile
          'monster-hunter',  // Monster Hunter series
          'story-driven',    // The Last of Us, God of War
          'classic',         // Chrono Trigger, classic JRPGs
          'modern',          // FF7 Remake, newer JRPGs
          'isometric',       // Baldur's Gate, Divinity
          'narrative',       // Disco Elysium, Planescape
          null
        ],
        message: '{VALUE} n\'est pas un sous-genre valide'
      }
    },
    
    description: {
      type: String,
      required: [true, 'La description est obligatoire'],
      maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
    },
    
    shortDescription: {
      type: String,
      maxlength: [200, 'La description courte ne peut pas dépasser 200 caractères'],
      default: function() {
        return this.description.substring(0, 150) + '...';
      }
    },
    
    image: {
      type: String,
      required: [true, 'L\'image est obligatoire'],
    },
    
    coverImage: {
      type: String,
    },
    
    developer: {
      type: String,
      required: [true, 'Le développeur est obligatoire'],
      trim: true
    },
    
    publisher: {
      type: String,
      trim: true
    },
    
    releaseDate: {
      type: Date,
      required: [true, 'La date de sortie est obligatoire']
    },
    
    platforms: {
      type: [String],
      default: [],
      enum: {
        values: ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'],
        message: '{VALUE} n\'est pas une plateforme valide'
      }
    },
    
    rating: {
      type: Number,
      min: [0, 'La note ne peut pas être inférieure à 0'],
      max: [10, 'La note ne peut pas être supérieure à 10'],
      default: 0
    },
    
    gameplayDuration: {
      type: Number, // en heures
      min: [0, 'La durée ne peut pas être négative']
    },
    
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 6;
        },
        message: 'Un jeu ne peut pas avoir plus de 6 tags'
      }
    },
    
    officialWebsite: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'L\'URL du site officiel doit être valide'
      }
    },
    
    featured: {
      type: Boolean,
      default: false
    },
    
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true, 
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index pour la recherche textuelle sur le titre du jeu via input Search
gameSchema.index({ title: 'text' });

// Index pour filtrer les jeux par genre et sous-genre
gameSchema.index({ category: 1, subGenre: 1 });

// Index pour trier les jeux par note et date de sortie
gameSchema.index({ rating: -1, releaseDate: -1 });

// Index pour les jeux en vedette
gameSchema.index({ featured: 1 });

// Index pour les tags
gameSchema.index({ tags: 1 });

// ==================== MÉTHODES ====================

// Méthode pour obtenir les jeux similaires intelligemment
gameSchema.methods.getSimilarGames = async function(limit = 4) {
  let similarGames = [];
  
  // 1. Priorité : Même sous-genre (ex: souls-like → souls-like)
  if (this.subGenre) {
    similarGames = await this.constructor.find({
      subGenre: this.subGenre,
      _id: { $ne: this._id },
      isActive: true
    })
    .select('title image rating category subGenre releaseDate')
    .sort({ rating: -1 })
    .limit(limit)
    .lean();
  }
  
  // 2. Si pas assez : Même catégorie + tags communs
  if (similarGames.length < limit && this.tags && this.tags.length > 0) {
    const remainingLimit = limit - similarGames.length;
    const excludeIds = [this._id, ...similarGames.map(g => g._id)];
    
    const tagMatches = await this.constructor.find({
      tags: { $in: this.tags },
      category: this.category,
      _id: { $nin: excludeIds },
      isActive: true
    })
    .select('title image rating category subGenre releaseDate')
    .sort({ rating: -1 })
    .limit(remainingLimit)
    .lean();
    
    similarGames = [...similarGames, ...tagMatches];
  }
  
  // 3. Si toujours pas assez : Même catégorie
  if (similarGames.length < limit) {
    const remainingLimit = limit - similarGames.length;
    const excludeIds = [this._id, ...similarGames.map(g => g._id)];
    
    const categoryMatches = await this.constructor.find({
      category: this.category,
      _id: { $nin: excludeIds },
      isActive: true
    })
    .select('title image rating category subGenre releaseDate')
    .sort({ rating: -1 })
    .limit(remainingLimit)
    .lean();
    
    similarGames = [...similarGames, ...categoryMatches];
  }
  
  return similarGames;
};

const Game = mongoose.model('Game', gameSchema);

export default Game;