import { useState } from 'react';
import { Plus, Edit2, Trash2, PiggyBank, Shield, Briefcase, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, calcularPercentual } from '../utils/formatters';

const TIPOS = [
  { value: 'emergencia', label: 'Fundo de Emergência', icon: Shield, color: '#ef4444', desc: 'Reserve para imprevistos' },
  { value: 'operacional', label: 'Caixa Operacional', icon: Briefcase, color: '#3b82f6', desc: 'Capital de giro do negócio' },
  { value: 'investimento', label: 'Investimentos', icon: TrendingUp, color: '#8b5cf6', desc: 'Renda fixa, tesouro e mais' },
];

const EMPTY = { nome: '', tipo: 'emergencia', meta: '', atual: '', observacoes: '' };

export default function Reserva() {
  const { state, dispatch } = useApp();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openNew = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (r) => { setForm({ ...r }); setEditId(r.id); setModal(true); };
  const closeModal = () => { setModal(false); setForm(EMPTY); setEditId(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, meta: parseFloat(form.meta) || 0, atual: parseFloat(form.atual) || 0 };
    if (editId) {
      dispatch({ type: 'UPDATE_RESERVA', payload: { ...data, id: editId } });
    } else {
      dispatch({ type: 'ADD_RESERVA', payload: data });
    }
    closeModal();
  };

  const totalReserva = state.reserva.reduce((s, r) => s + r.atual, 0);
  const totalMeta = state.reserva.reduce((s, r) => s + r.meta, 0);

  const getTipoInfo = (tipo) => TIPOS.find(t => t.value === tipo) || TIPOS[0];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reserva Financeira</h1>
          <p>Gerencie seus fundos, caixa operacional e investimentos</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={15} /> Nova Reserva
        </button>
      </div>

      {/* Total summary */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #111827 0%, #1a2035 100%)', borderColor: 'var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PiggyBank size={24} style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reserva Total Acumulada</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#8b5cf6' }}>{formatCurrency(totalReserva)}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Meta Total</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{formatCurrency(totalMeta)}</div>
            <div style={{ fontSize: 13, color: totalReserva >= totalMeta * 0.8 ? 'var(--success)' : 'var(--warning)' }}>
              {calcularPercentual(totalReserva, totalMeta)}% atingido
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div className="progress-bar" style={{ height: 8 }}>
            <div
              className="progress-fill"
              style={{
                width: `${calcularPercentual(totalReserva, totalMeta)}%`,
                background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
              }}
            />
          </div>
        </div>
      </div>

      {state.reserva.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <PiggyBank size={40} />
            <p>Nenhuma reserva cadastrada</p>
            <button className="btn btn-primary" onClick={openNew}><Plus size={14} /> Criar Reserva</button>
          </div>
        </div>
      ) : (
        <div className="grid-3">
          {state.reserva.map(res => {
            const tipoInfo = getTipoInfo(res.tipo);
            const Icon = tipoInfo.icon;
            const perc = calcularPercentual(res.atual, res.meta);
            const atingido = perc >= 100;
            return (
              <div key={res.id} className="card" style={{ borderLeft: `4px solid ${tipoInfo.color}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${tipoInfo.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} style={{ color: tipoInfo.color }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{res.nome}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tipoInfo.label}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-icon btn-sm" onClick={() => openEdit(res)}><Edit2 size={12} /></button>
                    <button className="btn-icon btn-sm" onClick={() => setConfirmDelete(res.id)} style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: tipoInfo.color }}>{formatCurrency(res.atual)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>de {formatCurrency(res.meta)} na meta</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Progresso</span>
                    <span style={{ fontWeight: 700, color: atingido ? 'var(--success)' : tipoInfo.color }}>{perc}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${perc}%`, background: atingido ? 'var(--success)' : tipoInfo.color }} />
                  </div>
                </div>

                {!atingido && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Faltam</span>
                    <span style={{ fontWeight: 600, color: tipoInfo.color }}>{formatCurrency(res.meta - res.atual)}</span>
                  </div>
                )}

                {atingido && (
                  <div style={{ padding: '6px 10px', borderRadius: 6, background: 'var(--success-bg)', color: 'var(--success)', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
                    ✓ Meta atingida!
                  </div>
                )}

                {res.observacoes && (
                  <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    {res.observacoes}
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
              <h3>{editId ? 'Editar Reserva' : 'Nova Reserva'}</h3>
              <button className="btn-icon btn-sm" onClick={closeModal}><span>✕</span></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Nome *</label>
                    <input className="form-control" placeholder="Ex: Fundo de emergência" required
                      value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select className="form-control" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                      {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Meta (R$) *</label>
                    <input type="number" step="0.01" min="0" className="form-control" placeholder="0,00" required
                      value={form.meta} onChange={e => setForm({ ...form, meta: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valor Atual (R$)</label>
                    <input type="number" step="0.01" min="0" className="form-control" placeholder="0,00"
                      value={form.atual} onChange={e => setForm({ ...form, atual: e.target.value })} />
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
                <button type="submit" className="btn btn-primary">{editId ? 'Salvar' : 'Criar Reserva'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header"><h3>Confirmar exclusão</h3></div>
            <div className="modal-body"><p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Deseja excluir esta reserva?</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => { dispatch({ type: 'DELETE_RESERVA', payload: confirmDelete }); setConfirmDelete(null); }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
