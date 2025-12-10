'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiPost, apiPut, apiDelete, fetchCSRFToken } from '@/lib/api/client';

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    homepage_position?: number | null;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Category>({
        id: '',
        name: '',
        slug: '',
        description: '',
        image: '',
        homepage_position: null
    });
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCategory, setNewCategory] = useState({
        id: '',
        name: '',
        slug: '',
        description: '',
        image: '',
        homepage_position: null as number | null
    });
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingEditImage, setUploadingEditImage] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const res = await fetch('/api/admin/categories');
            const data = await res.json();

            if (res.ok) {
                setCategories(data);
            } else {
                console.error('Error loading categories:', data);
                alert(data.error || 'Fehler beim Laden der Kategorien');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            alert('Netzwerkfehler beim Laden der Kategorien');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingId(category.id);
        setEditForm({
            ...category,
            homepage_position: category.homepage_position ?? null
        });
    };

    const handleSave = async (id: string) => {
        try {
            await apiPut(`/api/admin/categories/${id}`, editForm);
            await loadCategories();
            setEditingId(null);
        } catch (error) {
            console.error('Error updating category:', error);
            alert('Netzwerkfehler beim Aktualisieren der Kategorie');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Möchten Sie diese Kategorie wirklich löschen?')) return;

        try {
            await apiDelete(`/api/admin/categories/${id}`);
            await loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Netzwerkfehler beim Löschen der Kategorie');
        }
    };

    const handleAdd = async () => {
        if (!newCategory.id || !newCategory.name) {
            alert('ID und Name sind erforderlich');
            return;
        }

        const idRegex = /^[a-z0-9-]+$/;
        if (!idRegex.test(newCategory.id)) {
            alert('ID muss lowercase sein und darf nur Buchstaben, Zahlen und Bindestriche enthalten');
            return;
        }

        try {
            await apiPost('/api/admin/categories', newCategory);
            await loadCategories();
            setShowAddForm(false);
            setNewCategory({ id: '', name: '', slug: '', description: '', image: '', homepage_position: null });
        } catch (error) {
            console.error('Error creating category:', error);
            alert('Netzwerkfehler beim Erstellen der Kategorie');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('Bitte nur JPEG, PNG oder WebP Bilder hochladen');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Bild zu groß. Maximum 5MB');
            return;
        }

        if (isEdit) {
            setUploadingEditImage(true);
        } else {
            setUploadingImage(true);
        }

        try {
            const formData = new FormData();
            formData.append('file', file);

            const csrfToken = await fetchCSRFToken();

            const response = await fetch('/api/admin/products/upload-image', {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: {
                    'X-CSRF-Token': csrfToken
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const data = await response.json();

            if (isEdit) {
                setEditForm({ ...editForm, image: data.url });
            } else {
                setNewCategory({ ...newCategory, image: data.url });
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Fehler beim Hochladen des Bildes');
        } finally {
            if (isEdit) {
                setUploadingEditImage(false);
            } else {
                setUploadingImage(false);
            }
        }
    };

    // Получить занятые позиции (исключая текущую категорию при редактировании)
    const getOccupiedPositions = (excludeId?: string): number[] => {
        return categories
            .filter(c => c.homepage_position && c.id !== excludeId)
            .map(c => c.homepage_position as number);
    };

    // Компонент выбора позиции
    const PositionSelector = ({
        value,
        onChange,
        excludeId
    }: {
        value: number | null;
        onChange: (pos: number | null) => void;
        excludeId?: string;
    }) => {
        const occupied = getOccupiedPositions(excludeId);

        return (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position auf Startseite
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${value === null
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }`}
                    >
                        Keine
                    </button>
                    {[1, 2, 3, 4].map(pos => {
                        const isOccupied = occupied.includes(pos);
                        const isSelected = value === pos;

                        return (
                            <button
                                key={pos}
                                type="button"
                                onClick={() => !isOccupied && onChange(pos)}
                                disabled={isOccupied}
                                className={`w-12 h-10 rounded-lg border text-sm font-medium transition ${isSelected
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : isOccupied
                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                    }`}
                                title={isOccupied ? 'Position bereits belegt' : `Position ${pos}`}
                            >
                                {pos}
                            </button>
                        );
                    })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Wähle eine Position 1-4 für die Startseite oder &quot;Keine&quot; um nicht anzuzeigen
                </p>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <p>Laden...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white py-16 px-6">
            <div className="max-w-6xl mx-auto">
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zum Admin Dashboard
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-light text-gray-900 mb-2">Kategorien verwalten</h1>
                        <p className="text-gray-600">Produktkategorien hinzufügen, bearbeiten oder löschen</p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition"
                    >
                        <Plus className="w-5 h-5" />
                        Neue Kategorie
                    </button>
                </div>

                {/* Add Form */}
                {showAddForm && (
                    <div className="mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                        <h3 className="text-lg font-medium mb-4">Neue Kategorie erstellen</h3>
                        <div className="grid gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Kategorie-ID * (nur lowercase: a-z, 0-9, -)
                                </label>
                                <input
                                    type="text"
                                    value={newCategory.id}
                                    onChange={(e) => setNewCategory({ ...newCategory, id: e.target.value.toLowerCase() })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    placeholder="z.B. perfume"
                                    pattern="[a-z0-9-]+"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                                <input
                                    type="text"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    placeholder="z.B. Parfüm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                                <input
                                    type="text"
                                    value={newCategory.slug}
                                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    placeholder="z.B. parfum"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
                                <input
                                    type="text"
                                    value={newCategory.description}
                                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    placeholder="z.B. Düfte und Eau de Toilette"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bild</label>
                                <div className="space-y-3">
                                    {newCategory.image && (
                                        <div className="relative inline-block">
                                            <img
                                                src={newCategory.image}
                                                alt="Preview"
                                                className="w-32 h-32 object-cover rounded-lg"
                                            />
                                            <button
                                                onClick={() => setNewCategory({ ...newCategory, image: '' })}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    <div>
                                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition">
                                            {uploadingImage ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Hochladen...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-4 h-4" />
                                                    Bild hochladen
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                onChange={(e) => handleImageUpload(e, false)}
                                                className="hidden"
                                                disabled={uploadingImage}
                                            />
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1">JPEG, PNG oder WebP (max 5MB)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Position Selector */}
                            <PositionSelector
                                value={newCategory.homepage_position}
                                onChange={(pos) => setNewCategory({ ...newCategory, homepage_position: pos })}
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={handleAdd}
                                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                                >
                                    Erstellen
                                </button>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Abbrechen
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Categories List */}
                <div className="space-y-4">
                    {categories.map((category) => (
                        <div key={category.id} className="bg-white border border-gray-200 rounded-2xl p-6">
                            {editingId === category.id ? (
                                <div className="grid gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                                        <input
                                            type="text"
                                            value={editForm.slug}
                                            onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
                                        <input
                                            type="text"
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Bild</label>
                                        <div className="space-y-3">
                                            {editForm.image && (
                                                <div className="relative inline-block">
                                                    <img
                                                        src={editForm.image}
                                                        alt="Preview"
                                                        className="w-32 h-32 object-cover rounded-lg"
                                                    />
                                                    <button
                                                        onClick={() => setEditForm({ ...editForm, image: '' })}
                                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                            <div>
                                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition">
                                                    {uploadingEditImage ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Hochladen...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-4 h-4" />
                                                            Bild hochladen
                                                        </>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                                        onChange={(e) => handleImageUpload(e, true)}
                                                        className="hidden"
                                                        disabled={uploadingEditImage}
                                                    />
                                                </label>
                                                <p className="text-xs text-gray-500 mt-1">JPEG, PNG oder WebP (max 5MB)</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Position Selector (Edit) */}
                                    <PositionSelector
                                        value={editForm.homepage_position ?? null}
                                        onChange={(pos) => setEditForm({ ...editForm, homepage_position: pos })}
                                        excludeId={category.id}
                                    />

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleSave(category.id)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                                        >
                                            <Save className="w-4 h-4" />
                                            Speichern
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                            <X className="w-4 h-4" />
                                            Abbrechen
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                                {category.id}
                                            </span>
                                            {category.homepage_position && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                                                    Startseite #{category.homepage_position}
                                                </span>
                                            )}
                                        </div>
                                        {category.description && (
                                            <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                                        )}
                                        {category.image && (
                                            <img src={category.image} alt={category.name} className="w-32 h-20 object-cover rounded-lg mt-2" />
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(category)}
                                            className="p-2 text-gray-600 hover:text-black transition"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category.id)}
                                            className="p-2 text-red-600 hover:text-red-700 transition"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}