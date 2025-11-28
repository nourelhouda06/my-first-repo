require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require = require('cors');
const path = require('path');


const produitRoutes = require('./routes/produitRoutes');


const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


// API Routes
app.use('/api/produits', produitRoutes);


// Servir le frontend statique
app.use(express.static(path.join(__dirname, '../frontend/public')));


// Ligne CORRIGÉE : Fallback SPA pour capturer tous les autres chemins
// Utilisation de '/*' avec un paramètre pour compatibilité maximale et éviter PathError.
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});


// Error middleware
app.use((err, req, res, next) => {
    console.error('MIDDLEWARE ERROR:', err);
    res.status(500).json({ message: err.message || 'Erreur serveur' });
});


mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connecté à MongoDB ✅');
        app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));
    })
    .catch(err => {
        console.error('Erreur MongoDB:', err);
        process.exit(1);
    });