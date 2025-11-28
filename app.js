const API = 'http://localhost:5000/api/produits';
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const tableBody = $('#produits-table tbody'), search = $('#search'), countEl = $('#count');
const btnAdd = $('#btn-add'), detailModal = $('#detail-modal'), detailContent = $('#detail-content');
const detailEdit = $('#detail-edit'), detailDelete = $('#detail-delete');
const formModal = $('#form-modal'), formTitle = $('#form-title'), form = $('#produit-form'), btnCancel = $('#btn-cancel');
const toastsWrap = $('#toasts');
let produitsCache = [], currentDetailId = null;

function showToast(msg, type = 'info', timeout = 2500) {
    const el = document.createElement('div'); el.className = `toast ${type} show`; el.textContent = msg; toastsWrap.appendChild(el);
    setTimeout(() => { el.classList.remove('show'); el.style.opacity = '0'; }, timeout);
    setTimeout(() => el.remove(), timeout + 400);
}

// escape html
function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// fetch produits
async function fetchProduits(q = '') {
    try {
        const url = q ? `${API}?q=${encodeURIComponent(q)}` : API;
        const res = await fetch(url);
        if (!res.ok) throw '';
        const data = await res.json();
        produitsCache = Array.isArray(data) ? data : [];
        renderTable(produitsCache);
    } catch (e) {
        showToast('Impossible de charger les produits', 'error');
    }
}

// render table
function renderTable(items) {
    tableBody.innerHTML = '';
    if (!items.length) { tableBody.innerHTML = '<tr><td colspan="5" style="padding:18px;color:var(--muted)">Aucun produit</td></tr>'; countEl.textContent = ''; return; }
    countEl.textContent = `${items.length} produit(s)`;
    items.forEach(p => {
        const tr = document.createElement('tr'); tr.className = 'row-click';
        tr.innerHTML = `
            <td><strong>${escapeHtml(p.nom)}</strong><div class="muted small">${(p.categories || []).slice(0, 3).map(c => `<span class="tag">${escapeHtml(c)}</span>`).join(' ')}</div></td>
            <td>${p.prix != null ? Number(p.prix).toFixed(2) + ' €' : '-'}</td>
            <td>${p.stock ?? 0}</td>
            <td>${p.est_disponible ? '<span class="tag">Oui</span>' : '<span class="tag">Non</span>'}</td>
            <td>
                <button class="btn" data-id="${p._id}" data-action="view"><i class="fa fa-eye"></i></button>
                <button class="btn" data-id="${p._id}" data-action="edit"><i class="fa fa-edit"></i></button>
                <button class="btn danger" data-id="${p._id}" data-action="delete"><i class="fa fa-trash"></i></button>
            </td>`;
        tableBody.appendChild(tr);
    });
}

// modals
function openModal(mod) { mod.classList.add('show'); mod.setAttribute('aria-hidden', 'false'); }
function closeModal(mod) { mod.classList.remove('show'); mod.setAttribute('aria-hidden', 'true'); }
$$('.modal-close').forEach(b => b.addEventListener('click', e => closeModal(e.target.closest('.modal'))));
window.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(detailModal); closeModal(formModal); } });
detailModal.addEventListener('click', e => { if (e.target === detailModal) closeModal(detailModal); });
formModal.addEventListener('click', e => { if (e.target === formModal) closeModal(formModal); });

// open detail
async function openDetail(id) {
    try {
        const res = await fetch(`${API}/${id}`);
        if (!res.ok) throw '';
        const p = await res.json();
        currentDetailId = p._id;
        detailContent.innerHTML = `
            <h2 style="margin-top:0">${escapeHtml(p.nom)}</h2>
            <p class="muted">ID: ${p._id}</p>
            <p><strong>Prix:</strong> ${p.prix != null ? Number(p.prix).toFixed(2) + ' €' : '-'}</p>
            <p><strong>Quantité:</strong> ${p.stock ?? 0}</p>
            <p><strong>Disponible:</strong> ${p.est_disponible ? 'Oui' : 'Non'}</p>
            <p><strong>Catégories:</strong> ${(p.categories || []).map(c => `<span class="tag">${escapeHtml(c)}</span>`).join(' ')}</p>
            <p><strong>Description:</strong><br>${escapeHtml(p.description || '—')}</p>`;
        openModal(detailModal);
    } catch (e) {
        showToast('Impossible de charger le détail', 'error');
    }
}

// open form
function openForm(p = null) {
    form.reset();
    $('#produit-id').value = p ? p._id : '';
    $('#nom').value = p ? p.nom : '';
    $('#description').value = p ? p.description : '';
    $('#prix').value = p ? p.prix : 0;
    $('#stock').value = p ? p.stock : 0;
    $('#categories').value = p ? (p.categories || []).join(', ') : '';
    $('#est_disponible').checked = p ? !!p.est_disponible : true;
    formTitle.textContent = p ? 'Modifier le produit' : 'Créer un produit';
    openModal(formModal);
}

// submit form
form.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
        nom: $('#nom').value.trim(),
        description: $('#description').value.trim(),
        prix: parseFloat($('#prix').value) || 0,
        stock: parseInt($('#stock').value) || 0,
        categories: ($('#categories').value || '').split(',').map(s => s.trim()).filter(Boolean),
        est_disponible: $('#est_disponible').checked
    };
    const id = $('#produit-id').value;
    try {
        if (id) {
            await fetch(`${API}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            showToast('Produit modifié', 'success');
        } else {
            await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            showToast('Produit ajouté', 'success');
        }
        closeModal(formModal);
        fetchProduits(search.value.trim());
    } catch (e) {
        showToast('Erreur lors de l\'opération', 'error');
    }
});
btnCancel.addEventListener('click', () => closeModal(formModal));

// actions table
tableBody.addEventListener('click', async e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id, action = btn.dataset.action;
    if (action === 'view') openDetail(id);
    else if (action === 'edit') {
        try {
            const res = await fetch(`${API}/${id}`);
            if (!res.ok) throw '';
            const p = await res.json();
            openForm(p);
        } catch (e) {
            showToast('Impossible de charger', 'error');
        }
    } else if (action === 'delete') {
        if (!confirm('Supprimer ce produit ?')) return;
        try {
            await fetch(`${API}/${id}`, { method: 'DELETE' });
            showToast('Produit supprimé', 'success');
            fetchProduits(search.value.trim());
            closeModal(detailModal);
        } catch (e) {
            showToast('Impossible de supprimer', 'error');
        }
    }
});

// detail modal actions
detailEdit.addEventListener('click', async () => {
    if (!currentDetailId) return;
    try {
        const res = await fetch(`${API}/${currentDetailId}`);
        if (!res.ok) throw '';
        const p = await res.json();
        closeModal(detailModal);
        openForm(p);
    } catch (e) {
        showToast('Impossible de charger', 'error');
    }
});
detailDelete.addEventListener('click', async () => {
    if (!currentDetailId) return;
    if (!confirm('Supprimer ce produit ?')) return;
    try {
        await fetch(`${API}/${currentDetailId}`, { method: 'DELETE' });
        showToast('Produit supprimé', 'success');
        fetchProduits(search.value.trim());
        closeModal(detailModal);
    } catch (e) {
        showToast('Impossible de supprimer', 'error');
    }
});

// add button
btnAdd.addEventListener('click', () => openForm());

// search
search.addEventListener('input', e => fetchProduits(e.target.value.trim()));

// init
fetchProduits();