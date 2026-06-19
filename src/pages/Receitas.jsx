import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, TrendingUp, RefreshCw, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getStatusColor } from '../utils/formatters';
import { gerarProjecoesReceitas } from '../utils/projecoes';
import { startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import MesNavegador from '../components/ui/MesNavegador';

const EMPTY = {
  descricao: '', categoria: '', cliente: '', data: '', valor: '',
  formaPagamento: 'PIX', status: 'Pendente', recorrente: false,
  recorrenciaFreq: 'mensal', observacoes: ''
};

export default function Receitas() {
  const { state, dispatch, getCategoriaById } = useApp();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroCat, setFiltroCat] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [mesAtual, setMesAtual] = useState(new Date());
  const [mostrarProjecoes, setMostrarProjecoes] = useState(true);

  const catReceitas = state.categorias.filter(c => c.tipo === 'receita');

  const receitas = useMemo(() => {
    const start = startOfMonth(mesAtual);
    const end = endOfMonth(mesAtual);

    // Lançamentos reais do mês selecionado
    const reais = state.receitas.filter(r =>
      isWithinInterval(parseISO(r.data), { start, end })
    );

    // Projeções de recorrentes (só se habilitado)
    const projecoes = mostrarProjecoes ? gerarProjecoesReceitas(state.receitas, mesAtual) : [];

    return [...reais, ...projecoes]
      .filter(r => {
        if (filtroStatus && r.status !== filtroStatus) return false;
        if (filtroCat && r.categoria !== filtroCat) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            r.descricao?.toLowerCase().includes(q) ||
            r.cliente?.toLowerCase().includes(q) ||
            getCategoriaById(r.categoria)?.nome?.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(a.data) - new Date(b.data));
  }, [state.receitas, mesAtual, mostrarProjecoes, search, filtroStatus, filtroCat]);

  const totais = useMemo(() => ({
    recebido: receitas.filter(r => r.status === 'Recebido').reduce((s, r) => s + r.valor, 0),
    pendente: receitas.filter(r => r.status === 'Pendente').reduce((s, r) => s + r.valor, 0),
    total: receitas.reduce((s, r) => s + r.valor, 0),
  }), [receitas]);

  const openNew = () => {
    const hoje = new Date();
    const dataDefault = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), hoje.getDate());
    setForm({ ...EMPTY, data: dataDefault.toISOString().split('T')[0] });
    setEditId(null);
    setModal(true);
  };
  const openEdit = (r) => { setForm({ ...r }); setEditId(r.id); setModal(true); };
  const closeModal = () => { setModal(false); setForm(EMPTY); setEditId(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, valor: parseFloat(form.valor) || 0 };
    if (editId) {
      dispatch({ type: 'UPDATE_RECEITA', payload: { ...data, id: editId } });
    } else {
      dispatch({ type: 'ADD_RECEITA', payload: data });
    }
    closeModal();
  };

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_RECEITA', payload: id });
    setConfirmDelete(null);
  };

  const qtdProjecoes = receitas.filter(r => r.projetado).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Receitas</h1>
          <p>Gerencie suas entradas — reais e previstas</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <MesNavegador mes={mesAtual} onChange={setMesAtual} />
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={15} /> Nova Receita
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card success">
          <div className="stat-label">Recebido</div>
          <div className="stat-value text-success">{formatCurrency(totais.recebido)}</div>
          <div className="stat-sub">{receitas.filter(r => r.status === 'Recebido').length} confirmados</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Pendente</div>
          <div className="stat-value">{formatCurrency(totais.pendente)}</div>
          <div className="stat-sub">{receitas.filter(r => r.status === 'Pendente').length} aguardando</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-label">Total do Mês</div>
          <div className="stat-value">{formatCurrency(totais.total)}</div>
          <div className="stat-sub">{receitas.length} registros no mês</div>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-bar">
              <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input placeholder="Buscar receita..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-control" style={{ width: 'auto' }} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos os status</option>
              <option>Recebido</option>
              <option>Pendente</option>
            </select>
            <select className="form-control" style={{ width: 'auto' }} value={filtroCat} onChange={e => setFiltroCat(e.target.value)}>
              <option value="">Todas categorias</option>
              {catReceitas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="toolbar-right">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setMostrarProjecoes(p => !p)}
              title={mostrarProjecoes ? 'Ocultar projeções' : 'Mostrar projeções'}
              style={{ gap: 6 }}
            >
              <RefreshCw size={13} style={{ color: mostrarProjecoes ? 'var(--info)' : 'var(--text-muted)' }} />
              {mostrarProjecoes ? `Projeções ativas (${qtdProjecoes})` : 'Mostrar projeções'}
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{receitas.length} registro(s)</span>
          </div>
        </div>

        {/* Aviso de projeção */}
        {mostrarProjecoes && qtdProjecoes > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', marginBottom: 12,
            background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)',
            borderRadius: 8, fontSize: 12, color: 'var(--info)',
          }}>
            <RefreshCw size={13} />
            <span>
              <strong>{qtdProjecoes} receita(s) recorrente(s)</strong> projetada(s) para este mês com base no histórico. Confirme ao receber.
            </span>
          </div>
        )}

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Cliente</th>
                <th>Categoria</th>
                <th>Data</th>
                <th>Forma Pgto</th>
                <th>Valor</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {receitas.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <TrendingUp size={32} />
                    <p>Nenhuma receita neste mês</p>
                    <button className="btn btn-primary btn-sm" onClick={openNew}><Plus size={13} /> Adicionar</button>
                  </div>
                </td></tr>
              ) : receitas.map(r => {
                const cat = getCategoriaById(r.categoria);
                const isProjetado = !!r.projetado;
                return (
                  <tr key={r.id} style={{ opacity: isProjetado ? 0.75 : 1 }}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.descricao}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                        {r.recorrente && <span className="badge badge-primary" style={{ fontSize: 10 }}>Recorrente</span>}
                        {isProjetado && <span className="badge badge-info" style={{ fontSize: 10 }}>Projeção</span>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.cliente || '-'}</td>
                    <td>
                      {cat ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="color-dot" style={{ background: cat.cor }} />
                          {cat.nome}
                        </span>
                      ) : <span className="text-muted">-</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatDate(r.data)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.formaPagamento}</td>
                    <td style={{ fontWeight: 700, color: isProjetado ? 'var(--warning)' : 'var(--success)' }}>
                      +{formatCurrency(r.valor)}
                    </td>
                    <td>
                      <span className={`badge badge-${getStatusColor(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {!isProjetado ? (
                          <>
                            <button className="btn-icon btn-sm" onClick={() => openEdit(r)} title="Editar"><Edit2 size={13} /></button>
                            <button className="btn-icon btn-sm" onClick={() => setConfirmDelete(r.id)} title="Excluir"
                              style={{ color: 'var(--danger)' }}><Trash2 size={13} /></button>
                          </>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '0 4px' }}>projetado</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editId ? 'Editar Receita' : 'Nova Receita'}</h3>
              <button className="btn-icon btn-sm" onClick={closeModal}><span>✕</span></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Descrição *</label>
                    <input className="form-control" placeholder="Ex: Consultoria mensal" required
                      value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cliente</label>
                    <input className="form-control" placeholder="Nome do cliente"
                      value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} />
                  </div>
                </div>
                <div className="form-row form-row-3">
                  <div className="form-group">
                    <label className="form-label">Categoria</label>
                    <select className="form-control" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                      <option value="">Selecionar...</option>
                      {catReceitas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data *</label>
                    <input type="date" className="form-control" required
                      value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valor (R$) *</label>
                    <input type="number" step="0.01" min="0" className="form-control" placeholder="0,00" required
                      value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
                  </div>
                </div>
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Forma de Pagamento</label>
                    <select className="form-control" value={form.formaPagamento} onChange={e => setForm({ ...form, formaPagamento: e.target.value })}>
                      {['PIX', 'Transferência', 'Boleto', 'Cartão', 'Dinheiro', 'Cheque'].map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option>Recebido</option>
                      <option>Pendente</option>
                    </select>
                  </div>
                </div>
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Recorrente?</label>
                    <select className="form-control" value={form.recorrente ? 'sim' : 'nao'} onChange={e => setForm({ ...form, recorrente: e.target.value === 'sim' })}>
                      <option value="nao">Não</option>
                      <option value="sim">Sim</option>
                    </select>
                  </div>
                  {form.recorrente && (
                    <div className="form-group">
                      <label className="form-label">Frequência</label>
                      <select className="form-control" value={form.recorrenciaFreq} onChange={e => setForm({ ...form, recorrenciaFreq: e.target.value })}>
                        <option value="semanal">Semanal</option>
                        <option value="quinzenal">Quinzenal</option>
                        <option value="mensal">Mensal</option>
                        <option value="anual">Anual</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea className="form-control" rows={2} placeholder="Observações adicionais..."
                    value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Salvar Alterações' : 'Adicionar Receita'}</button>
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
                Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
