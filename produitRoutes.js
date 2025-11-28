const express = require('express');
const router = express.Router();
const Produit = require('../models/Produit');

// GET /api/produits (lister / recherche)
router.get('/', async (req, res) => {
    try {
        const q = req.query.q;
        let query = {};
        if (q) {
            const regex = new RegExp(q, 'i');
            // Recherche par nom, description ou catégories
            query = { $or: [{ nom: regex }, { description: regex }, { categories: regex }] };
        }
        const produits = await Produit.find(query).sort({ nom: 1 });
        res.json(produits);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/produits (créer)
router.post('/', async (req, res) => {
    try {
        const produit = new Produit(req.body);
        await produit.save();
        res.status(201).json(produit);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET /api/produits/:id (détail)
router.get('/:id', async (req, res) => {
    try {
        const produit = await Produit.findById(req.params.id);
        if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });
        res.json(produit);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/produits/:id (modifier)
router.put('/:id', async (req, res) => {
    try {
        // new: true pour retourner le document mis à jour
        // runValidators: true pour appliquer les règles de validation du schéma
        const produit = await Produit.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });
        res.json(produit);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/produits/:id (supprimer)
router.delete('/:id', async (req, res) => {
    try {
        const produit = await Produit.findByIdAndDelete(req.params.id);
        if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });
        // 204 No Content pour une suppression réussie
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;