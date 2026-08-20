'use client';

import { useState, useCallback, useEffect } from 'react';
import { Loader2, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { AdminActionButton } from '@/app/components/common/admin-action-button';

// Editor flotante para agregar, modificar o borrar juegos del módulo Animación.
interface Juego {
  id: number;
  slug: string;
  title: string;
  description: string;
  youtubeId: string | null;
  category: string;
  sectionId: number | null;
  order: number;
}

interface JuegoSection {
  id: number;
  slug: string;
  title: string;
  position: number;
}

interface JuegosEditorProps {
  onRefresh?: () => void;
}

function normalizeSlug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function youtubeIdFromInput(value: string | null | undefined) {
  const input = String(value || '').trim();
  if (!input) return '';
  const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{6,})/);
  return match?.[1] || input;
}

export function JuegosEditor({ onRefresh }: JuegosEditorProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [juegos, setJuegos] = useState<Juego[]>([]);
  const [sections, setSections] = useState<JuegoSection[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [deleteSectionConfirm, setDeleteSectionConfirm] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<Partial<Juego>>({
    title: '',
    description: '',
    youtubeId: '',
    category: 'general',
    sectionId: null,
    order: 999,
    slug: '',
  });
  const [sectionForm, setSectionForm] = useState({ title: '', slug: '' });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.status === 401) {
        setIsAdmin(false);
        return;
      }
      const data = await response.json();
      setIsAdmin(data?.role === 'admin' || data?.role === 1);
    } catch {
      setIsAdmin(false);
    }
  };

  const loadJuegos = useCallback(async () => {
    setIsLoading(true);
    try {
      // Carga la lista completa para editarla desde el panel.
      const response = await fetch('/api/admin/juegos', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Error al cargar juegos');
      const data = await response.json();
      setJuegos(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSections = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/juegos-sections', { credentials: 'include' });
      if (!response.ok) throw new Error('Error al cargar secciones');
      const data = await response.json();
      setSections(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (!isAdmin) return null;

  const resetGameForm = () => {
    setFormData({ title: '', description: '', youtubeId: '', category: 'general', sectionId: null, order: 999, slug: '' });
    setEditingId(null);
  };

  const handleOpenEditor = () => {
    setFormData({ title: '', description: '', youtubeId: '', category: 'general', sectionId: null, order: 999, slug: '' });
    setEditingId(null);
    setEditingSectionId(null);
    setSectionForm({ title: '', slug: '' });
    loadJuegos();
    loadSections();
    setIsOpen(true);
  };

  const handleEdit = (juego: Juego) => {
    setFormData(juego);
    setEditingId(juego.id);
  };

  const handleEditSection = (section: JuegoSection) => {
    setSectionForm({ title: section.title, slug: section.slug });
    setEditingSectionId(section.id);
  };

  const handleSaveSection = async () => {
    setError('');
    setSuccess('');

    if (!sectionForm.title.trim()) {
      setError('Completa el titulo de la seccion');
      return;
    }

    setIsLoading(true);
    try {
      const url = editingSectionId
        ? `/api/admin/juegos-sections/${editingSectionId}`
        : '/api/admin/juegos-sections';
      const method = editingSectionId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: sectionForm.title,
          slug: sectionForm.slug,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Error al guardar la seccion');
      }

      setSuccess(editingSectionId ? 'Seccion actualizada' : 'Seccion creada');
      setSectionForm({ title: '', slug: '' });
      setEditingSectionId(null);
      await loadSections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSection = async (id: number) => {
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/juegos-sections/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Error al eliminar la seccion');
      }
      setSuccess('Seccion eliminada');
      setDeleteSectionConfirm(null);
      await loadSections();
      await loadJuegos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!formData.title?.trim() || !formData.description?.trim()) {
      setError('Completá el título y la descripción');
      setIsLoading(false);
      return;
    }

    try {
      const url = editingId ? `/api/admin/juegos/${editingId}` : '/api/admin/juegos';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          slug: editingId ? formData.slug : normalizeSlug(formData.title),
          youtubeId: youtubeIdFromInput(formData.youtubeId),
          order: formData.order ?? 999,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar');
      }

      setSuccess(editingId ? 'Juego actualizado' : 'Juego creado');
      resetGameForm();
      await loadJuegos();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/juegos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar');
      }

      setSuccess('Juego eliminado');
      setDeleteConfirm(null);
      await loadJuegos();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante para agregar juego */}
      <AdminActionButton
        onClick={handleOpenEditor}
        action="add"
        label="Agregar Juego"
        className="fixed bottom-8 right-8 z-40 shadow-lg hover:shadow-xl"
      />

      {isOpen && (
        <div className="modal-overlay-unified">
          <div className="modal-panel-unified max-h-[90vh] max-w-4xl overflow-y-auto">
            <div className="modal-header-unified flex items-center justify-between">
              <div>
                <h2 className="modal-title-unified">Gestionar Juegos</h2>
                <p className="modal-subtitle-unified">Crear, editar o eliminar juegos</p>
              </div>
              <AdminActionButton
                onClick={() => setIsOpen(false)}
                action="close"
                tone="neutral"
                compact
                className="p-1"
              />
            </div>

            <div className="modal-body-unified">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl text-xs font-bold">
                  {success}
                </div>
              )}

              {/* Secciones */}
              <div className="space-y-4 rounded-2xl bg-white border border-stone-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="modal-label-unified">Secciones de juegos</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSectionForm({ title: '', slug: '' }); setEditingSectionId(null); }}
                    className="modal-btn-secondary-unified"
                  >
                    Nueva seccion
                  </button>
                </div>

                <div>
                  <div>
                    <label className="modal-label-unified">Titulo</label>
                    <input
                      type="text"
                      value={sectionForm.title}
                      onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                      placeholder="Ej: Juegos cooperativos"
                      className="modal-input-unified"
                    />
                  </div>
                </div>

                <div className="modal-actions-unified">
                  <button
                    type="button"
                    onClick={handleSaveSection}
                    disabled={isLoading}
                    className="modal-btn-primary-unified"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Guardar seccion'}
                  </button>
                  {editingSectionId && (
                    <button
                      type="button"
                      onClick={() => { setEditingSectionId(null); setSectionForm({ title: '', slug: '' }); }}
                      className="modal-btn-secondary-unified"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {sections.length === 0 ? (
                    <p className="text-xs text-stone-500">No hay secciones aun.</p>
                  ) : (
                    sections.map((section) => (
                      <div key={section.id} className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 px-3 py-2">
                        <p className="font-bold text-stone-800 text-sm">{section.title}</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditSection(section)}
                            className="p-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteSectionConfirm(section.id)}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {deleteSectionConfirm && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                    <p className="mb-3 text-xs font-bold text-red-700">¿Eliminar esta seccion?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(deleteSectionConfirm)}
                        className="modal-btn-primary-unified bg-red-600 hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteSectionConfirm(null)}
                        className="modal-btn-secondary-unified"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Editor */}
              <div className="space-y-4 rounded-2xl bg-stone-50 p-5">
                <div>
                  <p className="modal-label-unified">{editingId ? 'Editar' : 'Nuevo'} juego</p>
                </div>

                <div>
                  <div>
                    <label className="modal-label-unified">Título del juego *</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Titulo del juego"
                      className="modal-input-unified"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="modal-label-unified">Video de YouTube (opcional)</label>
                    <input
                      type="text"
                      value={formData.youtubeId || ''}
                      onChange={(e) => setFormData({ ...formData, youtubeId: e.target.value })}
                      placeholder="Pegá el enlace completo del video"
                      className="modal-input-unified"
                    />
                  </div>
                  <div>
                    <label className="modal-label-unified">Sección</label>
                    <select
                      value={formData.sectionId ?? ''}
                      onChange={(e) => setFormData({ ...formData, sectionId: e.target.value ? Number(e.target.value) : null })}
                      className="modal-input-unified"
                    >
                      <option value="">General</option>
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="modal-label-unified">Tipo de juego</label>
                    <select
                      value={formData.category || 'general'}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="modal-input-unified"
                    >
                      <option value="general">General</option>
                      <option value="cooperativo">Cooperativo</option>
                      <option value="competitivo">Competitivo</option>
                      <option value="ronda">En ronda</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="modal-label-unified">Descripción *</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripcion"
                    className="modal-input-unified min-h-[110px]"
                  />
                </div>

                <div className="modal-actions-unified">
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="modal-btn-primary-unified"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Guardar'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetGameForm}
                      className="modal-btn-secondary-unified"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              {/* Lista */}
              <div>
                <h3 className="font-black text-lg mb-4 text-stone-800">Juegos existentes</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center py-4 text-sm text-stone-500">Cargando...</div>
                  ) : juegos.length === 0 ? (
                    <p className="text-stone-500">No hay juegos aun</p>
                  ) : (
                    juegos.map((juego) => (
                      <div key={juego.id} className="p-3 bg-stone-50 rounded-xl flex justify-between items-center border border-stone-100">
                        <div className="flex-1">
                          <p className="font-bold text-stone-800">{juego.title}</p>
                          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">{juego.category}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(juego)}
                            className="p-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(juego.id)}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {deleteConfirm && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                  <p className="mb-3 text-sm font-bold text-red-700">¿Eliminar este juego?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(deleteConfirm)}
                      className="modal-btn-primary-unified bg-red-600 hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="modal-btn-secondary-unified"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
