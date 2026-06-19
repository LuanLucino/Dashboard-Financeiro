import { useState } from 'react';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';

const CORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#64748b', '#dc2626', '#a78bfa'];

const EMPTY = { nome: '', tipo: 'despesa', cor: '#3b82f6' };

export default function Categorias() {
  const { state, dispatch } = useApp();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('');

  const openNew = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (c) => { setForm({ ...c }); setEditId(c.id); setModal(true); };
  const closeModal = () => { setModal(false); setForm(EMPTY); setEditId(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      dispatch({ type: 'UPDATE_CATEGORIA', payload: { ...form, id: editId } });
    } else {
      dispatch({ type: 'ADD_CATEGORIA', payload: form });
    }
    closeModal();
  };

  const getCategoriaUsageCount = (id) => {
    return state.receitas.filter(r => r.categoria === id).length +
      state.despesas.filter(d => d.categoria === id).length;
  };

  const categorias = state.categorias.filter(c => !filtroTipo || c.tipo === filtroTipo);
  const catReceitas = categorias.filter(c => c.tipo === 'receita');
  const catDespesas = categorias.filter(c => c.tipo === 'despesa');

  const CatCard = ({ cat }) => {
    const uso = getCategoriaUsageCount(cat.id);
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', borderRadius: 9,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        transition: 'all var(--transition)',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${cat.cor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Tag size={16} style={{ color: cat.cor }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{cat.nome}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {uso} lançamento(s)
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: cat.cor }} />
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn-icon btn-sm" onClick={() => openEdit(cat)}><Edit2 size={12} /></button>
            <button
              className="btn-icon btn-sm"
              onClick={() => setConfirmDelete(cat.id)}
              style={{ color: uso > 0 ? 'var(--text-muted)' : 'var(--danger)' }}
              title={uso > 0 ? 'Categoria em uso' : 'Excluir'}
            ><Trash2 size={12} /></button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Categorias</h1>
          <p>Organize seus lançamentos com categorias personalizadas</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="tabs">
            <button className={`tab ${filtroTipo === '' ? 'active' : ''}`} onClick={() => setFiltroTipo('')}>Todas</button>
            <button className={`tab ${filtroTipo === 'receita' ? 'active' : ''}`} onClick={() => setFiltroTipo('receita')}>Receitas</button>
            <button className={`tab ${filtroTipo === 'despesa' ? 'active' : ''}`} onClick={() => setFiltroTipo('despesa')}>Despesas</button>
          </div>
          <button className="btn btn-primary" onClick={openNew}><Plus size={15} /> Nova Categoria</button>
        </div>
      </div>

      <div className="grid-2">
        {(filtroTipo === '' || filtroTipo === 'receita') && (
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--success)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
              Receitas ({catReceitas.length})
            </div>
            {catReceitas.length === 0 ? (
              <div className="card" style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Nenhuma categoria de receita
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {catReceitas.map(c => <CatCard key={c.id} cat={c} />)}
              </div>
            )}
          </div>
        )}

        {(filtroTipo === '' || filtroTipo === 'despesa') && (
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--danger)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)' }} />
              Despesas ({catDespesas.length})
            </div>
            {catDespesas.length === 0 ? (
              <div className="card" style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Nenhuma categoria de despesa
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {catDespesas.map(c => <CatCard key={c.id} cat={c} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>{editId ? 'Editar Categoria' : 'Nova Categoria'}</h3>
              <button className="btn-icon btn-sm" onClick={closeModal}><span>✕</span></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome da Categoria *</label>
                  <input className="form-control" placeholder="Ex: Aluguel, Marketing..." required
                    value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <div className="tabs" style={{ width: 'fit-content' }}>
                    <button type="button" className={`tab ${form.tipo === 'despesa' ? 'active' : ''}`} onClick={() => setForm({ ...form, tipo: 'despesa' })}>Despesa</button>
                    <button type="button" className={`tab ${form.tipo === 'receita' ? 'active' : ''}`} onClick={() => setForm({ ...form, tipo: 'receita' })}>Receita</button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Cor</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {CORES.map(cor => (
                      <button
                        key={cor}
                        type="button"
                        onClick={() => setForm({ ...form, cor })}
                        style={{
                          width: 28, height: 28, borderRadius: 7,
                          background: cor,
                          border: form.cor === cor ? `3px solid white` : '3px solid transparent',
                          boxShadow: form.cor === cor ? `0 0 0 2px ${cor}` : 'none',
                          transition: 'all var(--transition)',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${form.cor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Tag size={15} style={{ color: form.cor }} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{form.nome || 'Prévia da categoria'}</span>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: form.cor, marginLeft: 'auto' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Salvar' : 'Criar Categoria'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header"><h3>Confirmar exclusão</h3></div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {getCategoriaUsageCount(confirmDelete) > 0
                  ? 'Esta categoria está sendo usada em lançamentos. Ao excluir, os lançamentos perderão a categoria.'
                  : 'Deseja excluir esta categoria?'}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => { dispatch({ type: 'DELETE_CATEGORIA', payload: confirmDelete }); setConfirmDelete(null); }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
