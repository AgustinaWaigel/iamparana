'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Loader2, Save, Plus, Database, FileText, 
  Music, Calendar, Image as ImageIcon, Trash2, AlertCircle 
} from 'lucide-react';

type Entity = 'noticias' | 'canciones' | 'agenda' | 'carousel';

const ENTITY_CONFIG: Record<Entity, { label: string; icon: any; color: string }> = {
  noticias: { label: 'Noticias', icon: FileText, color: 'text-blue-600' },
  canciones: { label: 'Canciones', icon: Music, color: 'text-pink-600' },
  agenda: { label: 'Agenda', icon: Calendar, color: 'text-emerald-600' },
  carousel: { label: 'Carousel', icon: ImageIcon, color: 'text-amber-600' },
};

export default function AdminPage() {
  const [entity, setEntity] = useState<Entity>('noticias');
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [editorValue, setEditorValue] = useState('');
  const [status, setStatus] = useState({ message: 'Listo', isError: false });
  const [loading, setLoading] = useState(false);

  const updateStatus = (msg: string, isError = false) => {
    setStatus({ message: msg, isError });
    if (!isError) setTimeout(() => setStatus({ message: 'Listo', isError: false }), 3000);
  };

  const fetchAdmin = useCallback(async (path: string, init?: RequestInit) => {
    const response = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      credentials: 'include',
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Error ${response.status}`);
    }
    return response.json();
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdmin(`/api/admin/${entity}`);
      setItems(data || []);
      updateStatus(`Sincronizado: ${entity}`);
    } catch (err: any) {
      updateStatus(err.message, true);
    } finally {
      setLoading(false);
    }
  }, [entity, fetchAdmin]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const saveItem = async () => {
    try {
      const payload = JSON.parse(editorValue);
      const isUpdate = !!selectedKey;
      const route = isUpdate ? `/api/admin/${entity}/${selectedKey}` : `/api/admin/${entity}`;
      
      setLoading(true);
      await fetchAdmin(route, { 
        method: isUpdate ? 'PUT' : 'POST', 
        body: JSON.stringify(payload) 
      });
      
      updateStatus('Cambios guardados en la nube');
      loadItems();
    } catch (err: any) {
      updateStatus(err instanceof SyntaxError ? 'Error de sintaxis JSON' : err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async () => {
    if (!selectedKey || !confirm('¿Eliminar este registro permanentemente?')) return;
    setLoading(true);
    try {
      await fetchAdmin(`/api/admin/${entity}/${selectedKey}`, { method: 'DELETE' });
      updateStatus('Registro eliminado');
      setSelectedKey('');
      setEditorValue('');
      loadItems();
    } catch (err: any) {
      updateStatus(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] pt-20 pb-10 font-sans">
      <div className="max-w-[1600px] mx-auto px-6">
        
        {/* Header con Status */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-brand-brown tracking-tight flex items-center gap-3">
              <Database className="text-amber-600" />
              Gestor de Contenidos
            </h1>
            <p className="text-stone-500 font-medium">Administración de datos en tiempo real (Turso DB)</p>
          </div>

          <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all ${
            status.isError ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-stone-200 text-stone-600 shadow-sm'
          }`}>
            {loading ? <Loader2 className="animate-spin text-amber-600" size={18} /> : 
             status.isError ? <AlertCircle size={18} /> : <div className="w-2 h-2 rounded-full bg-green-500" />}
            <span className="text-sm font-bold">{status.message}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          
          {/* Sidebar de Navegación */}
          <aside className="space-y-6">
            <nav className="bg-white p-3 rounded-[2rem] shadow-sm border border-stone-200 space-y-1">
              {(Object.keys(ENTITY_CONFIG) as Entity[]).map((key) => {
                const Config = ENTITY_CONFIG[key];
                return (
                  <button
                    key={key}
                    onClick={() => { setEntity(key); setSelectedKey(''); setEditorValue(''); }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                      entity === key ? 'bg-brand-brown text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'
                    }`}
                  >
                    <Config.icon size={20} className={entity === key ? 'text-amber-400' : Config.color} />
                    {Config.label}
                  </button>
                );
              })}
            </nav>

            <div className="bg-white rounded-[2rem] shadow-sm border border-stone-200 overflow-hidden">
              <div className="p-5 bg-stone-50/50 border-b border-stone-100 flex justify-between items-center">
                <span className="text-xs font-black text-stone-400 uppercase tracking-widest">Registros</span>
                <button 
                  onClick={() => { setSelectedKey(''); setEditorValue('{\n  \n}'); }}
                  className="p-1.5 hover:bg-white rounded-lg text-brand-brown transition-colors border border-transparent hover:border-stone-200"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="max-h-[450px] overflow-y-auto p-3 space-y-2">
                {items.map(item => {
                  const key = item.slug || item.id;
                  const title = item.title || item.evento || item.alt || key;
                  return (
                    <button 
                      key={key}
                      onClick={() => { setSelectedKey(key); setEditorValue(JSON.stringify(item, null, 2)); }}
                      className={`w-full text-left p-4 rounded-2xl text-sm transition-all border ${
                        selectedKey === key 
                        ? 'bg-amber-50 border-amber-200 shadow-sm' 
                        : 'border-transparent hover:bg-stone-50 text-stone-600 font-medium'
                      }`}
                    >
                      <div className={`truncate ${selectedKey === key ? 'text-amber-900 font-bold' : ''}`}>{title}</div>
                      <div className="text-[10px] opacity-40 font-mono mt-1 uppercase">{key}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Área del Editor */}
          <div className="space-y-4">
            <div className="flex justify-end gap-3">
              {selectedKey && (
                <button 
                  onClick={deleteItem}
                  className="flex items-center gap-2 px-5 py-2.5 text-red-600 font-bold text-sm hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                  Eliminar
                </button>
              )}
              <button 
                onClick={saveItem}
                disabled={loading || !editorValue}
                className="flex items-center gap-2 bg-brand-brown text-white px-8 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-stone-800 transition-all disabled:opacity-40 active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {selectedKey ? 'Actualizar Registro' : 'Crear Nuevo'}
              </button>
            </div>

            <div className="relative group">
              {/* Decoración tipo editor de código */}
              <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-bold text-stone-500 bg-white/10 px-2 py-1 rounded border border-white/10 uppercase tracking-widest">JSON Mode</span>
              </div>
              
              <textarea 
                value={editorValue}
                onChange={e => setEditorValue(e.target.value)}
                spellCheck={false}
                className="w-full h-[650px] font-mono text-[13px] p-8 bg-[#1e1e1e] text-amber-100 rounded-[2.5rem] outline-none shadow-2xl focus:ring-8 focus:ring-brand-brown/5 leading-relaxed resize-none border-8 border-stone-800"
                placeholder="// Selecciona un registro para comenzar a editar..."
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}