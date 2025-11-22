import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";

// Configuration des variables d'environnement
dotenv.config();

// Connexion à la base de données
connectDB();

const app = express();

// Middleware CORS
app.use(cors({ 
  origin: process.env.CLIENT_URL || "http://localhost:5173", 
  credentials: true 
}));

// Middleware pour parser le JSON
app.use(express.json());

// Middleware pour parser les URL-encoded
app.use(express.urlencoded({ extended: true }));

// Route de test
app.get("/", (req, res) => {
  res.json({
    message: "🎮 Bienvenue sur l'API Souls RPG !",
    version: "1.0.0",
    endpoints: {
      games: "/api/games",
      gameById: "/api/games/:id",
      stats: "/api/games/stats"
    }
  });
});

// Middleware de gestion des routes non trouvées (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} non trouvée`
  });
});

// Middleware de gestion d'erreurs globale
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📝 Environnement : ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 Frontend autorisé : ${process.env.CLIENT_URL || "http://localhost:5173"}`);
  console.log(`📡 API disponible sur : http://localhost:${PORT}/api/games\n`);
});