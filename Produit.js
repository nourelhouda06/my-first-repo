const mongoose = require('mongoose');

const ProduitSchema = new mongoose.Schema({
    nom: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    prix: { type: Number, required: true, min: 0, default: 0 },
    stock: { type: Number, default: 0, min: 0 },
    categories: { type: [String], default: [] },
    est_disponible: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Produit', ProduitSchema);