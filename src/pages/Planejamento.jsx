import { useState } from 'react';
import { Plus, Edit2, Trash2, Target, TrendingUp, PiggyBank, DollarSign } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, calcularPercentual } from '../utils/formatters';

const TIPOS = [
  { value: 'faturamento', label: 'Faturamento', icon: TrendingUp, color: '#3b82f6' },
  { value: 'reserva', label: 'Reserva', icon: PiggyBank, color: '#8b5cf6' },
  { value: 'economia', label: 'Economia', icon: DollarSign, color: '#10b981' },
  { value: 'investimento', label: 'Investimento', icon: Target, color: '#f59e0b' },
];

const EMPTY = { nome: '', tipo: 'faturamento', meta: '', atual: '', prazo: '', observacoes: '' };

export default function Planejamento() {
  const { state, dispatch } = useApp();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openNew = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (m) => { setForm({ ...m }); setEditId(m.id); setModal(true); };
  const closeModal = () => { setModal(false); setForm(EMPTY); setEditId(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, meta: parseFloat(form.meta) || 0, atual: parseFloat(form.atual) || 0 };
    if (editId) {
      dispatch({ type: 'UPDATE_META', payload: { ...data, id: editId } });
    } else {
      dispatch({ type: 'ADD_META', payload: data });
    }
    closeModal();
  };

  const getTipoInfo = (tipo) => TIPOS.find(t => t.value === tipo) || TIPOS[0];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Planejamento Financeiro</h1>
          <p>Defina e acompanhe suas metas e objetivos</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={15} /> Nova Meta
        </button>
      </div>

      {state.metas.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Target size={40} />
            <p>Nenhuma meta cadastrada ainda</p>
            <button className="btn btn-primary" onClick={openNew}><Plus size={14} /> Criar Primeira Meta</button>
          </div>
        </div>
      ) : (
        <div className="grid-3">
          {state.metas.map(meta => {
            const tipoInfo = getTipoInfo(meta.tipo);
            const Icon = tipoInfo.icon;
            const perc = calcularPercentual(meta.atual, meta.meta);
            const restante = meta.meta - meta.atual;
            const atingido = perc >= 100;
            return (
              <div key={meta.id} className="card" style={{
                borderTop: `3px solid ${tipoInfo.color}`,
                position: 'relative',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: `${tipoInfo.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} style={{ color: tipoInfo.color }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{meta.nome}</div>
                      <span className="badge badge-muted" style={{ fontSize: 10, marginTop: 2 }}>{tipoInfo.label}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-icon btn-sm" onClick={() => openEdit(meta)}><Edit2 size={12} /></button>
                    <button className="btn-icon btn-sm" onClick={() => setConfirmDelete(meta.id)} style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Progresso</span>
                    <span style={{ fontWeight: 700, color: atingido ? 'var(--success)' : tipoInfo.color }}>{perc}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${perc}%`,
                        background: atingido ? 'var(--success)' : tipoInfo.color,
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Atual</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(meta.atual)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Meta</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(meta.meta)}</span>
                  </div>
                  {!atingido && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Faltam</span>
                      <span style={{ fontWeight: 700, color: tipoInfo.color }}>{formatCurrency(restante)}</span>
                    </div>
                  )}
                  {meta.prazo && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Prazo</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{formatDate(meta.prazo)}</span>
                    </div>
                  )}
                </div>

                {atingido && (
                  <div style={{
                    marginTop: 14, padding: '8px 12px', borderRadius: 8,
                    background: 'var(--success-bg)', color: 'var(--success)',
                    fontSize: 12, fontWeight: 600, textAlign: 'center',
                  }}>
                    ✓ Meta atingida!
                  </div>
                )}

                {meta.observacoes && (
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    {meta.observacoes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editId ? 'Editar Meta' : 'Nova Meta'}</h3>
              <button className="btn-icon btn-sm" onClick={closeModal}><span>✕</span></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Nome da Meta *</label>
                    <input className="form-control" placeholder="Ex: Faturamento mensal" required
                      value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select className="form-control" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                      {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row form-row-3">
                  <div className="form-group">
                    <label className="form-label">Valor Meta (R$) *</label>
                    <input type="number" step="0.01" min="0" className="form-control" placeholder="0,00" required
                      value={form.meta} onChange={e => setForm({ ...form, meta: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valor Atual (R$)</label>
                    <input type="number" step="0.01" min="0" className="form-control" placeholder="0,00"
                      value={form.atual} onChange={e => setForm({ ...form, atual: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Prazo</label>
                    <input type="date" className="form-control"
                      value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea className="form-control" rows={2}
                    value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Salvar' : 'Criar Meta'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header"><h3>Confirmar exclusão</h3></div>
            <div className="modal-body"><p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Deseja excluir esta meta?</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => { dispatch({ type: 'DELETE_META', payload: confirmDelete }); setConfirmDelete(null); }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
