import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getStatusColor } from '../utils/formatters';
import { gerarProjecoesDespesas } from '../utils/projecoes';
import { isPast, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import MesNavegador from '../components/ui/MesNavegador';

const EMPTY = {
  descricao: '', categoria: '', fornecedor: '', vencimento: '', valor: '',
  status: 'Não Pago', recorrente: false, recorrenciaFreq: 'mensal',
  reajusteFixo: '', reajustePercentual: '', observacoes: ''
};

export default function Despesas() {
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

  const catDespesas = state.categorias.filter(c => c.tipo === 'despesa');

  const despesas = useMemo(() => {
    const start = startOfMonth(mesAtual);
    const end = endOfMonth(mesAtual);

    // Lançamentos reais do mês selecionado (com status vencido automático)
    const reais = state.despesas
      .filter(d => isWithinInterval(parseISO(d.vencimento), { start, end }))
      .map(d => {
        if (d.status === 'Não Pago' && isPast(parseISO(d.vencimento))) {
          return { ...d, status: 'Vencido' };
        }
        return d;
      });

    // Projeções de recorrentes (só se habilitado)
    const projecoes = mostrarProjecoes ? gerarProjecoesDespesas(state.despesas, mesAtual) : [];

    return [...reais, ...projecoes]
      .filter(d => {
        if (filtroStatus && d.status !== filtroStatus) return false;
        if (filtroCat && d.categoria !== filtroCat) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            d.descricao?.toLowerCase().includes(q) ||
            d.fornecedor?.toLowerCase().includes(q) ||
            getCategoriaById(d.categoria)?.nome?.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));
  }, [state.despesas, mesAtual, mostrarProjecoes, search, filtroStatus, filtroCat]);

  const totais = useMemo(() => ({
    pago: despesas.filter(d => d.status === 'Pago').reduce((s, d) => s + d.valor, 0),
    nao_pago: despesas.filter(d => d.status === 'Não Pago' || d.status === 'Vencido').reduce((s, d) => s + d.valor, 0),
    total: despesas.reduce((s, d) => s + d.valor, 0),
  }), [despesas]);

  const openNew = () => {
    const hoje = new Date();
    const dataDefault = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), hoje.getDate());
    setForm({ ...EMPTY, vencimento: dataDefault.toISOString().split('T')[0] });
    setEditId(null);
    setModal(true);
  };
  const openEdit = (d) => { setForm({ ...d }); setEditId(d.id); setModal(true); };
  const closeModal = () => { setModal(false); setForm(EMPTY); setEditId(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      valor: parseFloat(form.valor) || 0,
      reajusteFixo: parseFloat(form.reajusteFixo) || 0,
      reajustePercentual: parseFloat(form.reajustePercentual) || 0,
    };
    if (editId) {
      dispatch({ type: 'UPDATE_DESPESA', payload: { ...data, id: editId } });
    } else {
      dispatch({ type: 'ADD_DESPESA', payload: data });
    }
    closeModal();
  };

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_DESPESA', payload: id });
    setConfirmDelete(null);
  };

  const togglePago = (id) => dispatch({ type: 'TOGGLE_PAGO', payload: id });

  const confirmarProjecao = (d) => {
    const { id, projetado, ...resto } = d;
    dispatch({ type: 'ADD_DESPESA', payload: { ...resto, status: 'Pago' } });
  };

  const openEditProjecao = (d) => {
    const original = state.despesas.find(dep => dep.id === d.originalId);
    if (original) { setForm({ ...original }); setEditId(original.id); setModal(true); }
  };

  const deleteProjecao = (d) => setConfirmDelete(d.originalId);

  const qtdProjecoes = despesas.filter(d => d.projetado).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Despesas</h1>
          <p>Controle seus gastos — reais e previstos</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <MesNavegador mes={mesAtual} onChange={setMesAtual} />
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={15} /> Nova Despesa
          </button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card success">
          <div className="stat-label">Pagas</div>
          <div className="stat-value text-success">{formatCurrency(totais.pago)}</div>
          <div className="stat-sub">{despesas.filter(d => d.status === 'Pago').length} itens</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Não Pagas</div>
          <div className="stat-value">{formatCurrency(totais.nao_pago)}</div>
          <div className="stat-sub">{despesas.filter(d => d.status === 'Não Pago' || d.status === 'Vencido').length} itens</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-label">Total do Mês</div>
          <div className="stat-value">{formatCurrency(totais.total)}</div>
          <div className="stat-sub">{despesas.length} registros no mês</div>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-bar">
              <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input placeholder="Buscar despesa..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-control" style={{ width: 'auto' }} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos os status</option>
              <option>Pago</option>
              <option>Não Pago</option>
              <option>Vencido</option>
            </select>
            <select className="form-control" style={{ width: 'auto' }} value={filtroCat} onChange={e => setFiltroCat(e.target.value)}>
              <option value="">Todas categorias</option>
              {catDespesas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="toolbar-right">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setMostrarProjecoes(p => !p)}
              style={{ gap: 6 }}
            >
              <RefreshCw size={13} style={{ color: mostrarProjecoes ? 'var(--info)' : 'var(--text-muted)' }} />
              {mostrarProjecoes ? `Projeções ativas (${qtdProjecoes})` : 'Mostrar projeções'}
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{despesas.length} registro(s)</span>
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
              <strong>{qtdProjecoes} despesa(s) recorrente(s)</strong> projetada(s) para este mês. Elas aparecem automaticamente para planejar seu fluxo de caixa.
            </span>
          </div>
        )}

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pago?</th>
                <th>Descrição</th>
                <th>Fornecedor</th>
                <th>Categoria</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {despesas.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <TrendingDown size={32} />
                    <p>Nenhuma despesa neste mês</p>
                    <button className="btn btn-primary btn-sm" onClick={openNew}><Plus size={13} /> Adicionar</button>
                  </div>
                </td></tr>
              ) : despesas.map(d => {
                const cat = getCategoriaById(d.categoria);
                const isPago = d.status === 'Pago';
                const isProjetado = !!d.projetado;
                return (
                  <tr key={d.id} style={{ opacity: isPago ? 0.7 : isProjetado ? 0.8 : 1 }}>
                    <td>
                      {!isProjetado ? (
                        <button
                          className="btn-icon btn-sm"
                          onClick={() => togglePago(d.id)}
                          style={{
                            background: isPago ? 'var(--success-bg)' : 'var(--bg-elevated)',
                            color: isPago ? 'var(--success)' : 'var(--text-muted)',
                            borderColor: isPago ? 'rgba(16,185,129,0.3)' : 'var(--border)',
                          }}
                          title={isPago ? 'Marcar como não pago' : 'Marcar como pago'}
                        >
                          {isPago ? '✓' : '○'}
                        </button>
                      ) : (
                        <button
                          className="btn-icon btn-sm"
                          onClick={() => confirmarProjecao(d)}
                          style={{ background: 'var(--bg-elevated)', color: 'var(--info)', borderColor: 'rgba(6,182,212,0.3)' }}
                          title="Confirmar como pago"
                        >
                          ✓
                        </button>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, textDecoration: isPago ? 'line-through' : 'none' }}>{d.descricao}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                        {d.recorrente && <span className="badge badge-muted" style={{ fontSize: 10 }}>Recorrente</span>}
                        {isProjetado && <span className="badge badge-info" style={{ fontSize: 10 }}>Projeção</span>}
                        {(d.reajusteFixo > 0 || d.reajustePercentual > 0) && (
                          <span className="badge badge-warning" style={{ fontSize: 10 }} title={`Reajuste mensal: ${d.reajusteFixo > 0 ? `+R$${d.reajusteFixo}` : ''}${d.reajusteFixo > 0 && d.reajustePercentual > 0 ? ' + ' : ''}${d.reajustePercentual > 0 ? `+${d.reajustePercentual}%` : ''}`}>
                            Reajuste
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{d.fornecedor || '-'}</td>
                    <td>
                      {cat ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="color-dot" style={{ background: cat.cor }} />
                          {cat.nome}
                        </span>
                      ) : <span className="text-muted">-</span>}
                    </td>
                    <td style={{
                      color: d.status === 'Vencido' ? 'var(--danger)' : isProjetado ? 'var(--warning)' : 'var(--text-secondary)',
                      fontWeight: d.status === 'Vencido' ? 600 : 400,
                    }}>
                      {formatDate(d.vencimento)}
                      {d.status === 'Vencido' && <AlertCircle size={12} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
                    </td>
                    <td style={{
                      fontWeight: 700,
                      color: isPago ? 'var(--text-muted)' : isProjetado ? 'var(--warning)' : 'var(--danger)',
                    }}>
                      -{formatCurrency(d.valor)}
                    </td>
                    <td>
                      <span className={`badge badge-${getStatusColor(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {!isProjetado ? (
                          <>
                            <button className="btn-icon btn-sm" onClick={() => openEdit(d)} title="Editar"><Edit2 size={13} /></button>
                            <button className="btn-icon btn-sm" onClick={() => setConfirmDelete(d.id)} title="Excluir"
                              style={{ color: 'var(--danger)' }}><Trash2 size={13} /></button>
                          </>
                        ) : (
                          <>
                            <button className="btn-icon btn-sm" onClick={() => openEditProjecao(d)} title="Editar recorrência"><Edit2 size={13} /></button>
                            <button className="btn-icon btn-sm" onClick={() => deleteProjecao(d)} title="Excluir recorrência"
                              style={{ color: 'var(--danger)' }}><Trash2 size={13} /></button>
                          </>
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

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editId ? 'Editar Despesa' : 'Nova Despesa'}</h3>
              <button className="btn-icon btn-sm" onClick={closeModal}><span>✕</span></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Descrição *</label>
                    <input className="form-control" placeholder="Ex: Conta de energia" required
                      value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fornecedor</label>
                    <input className="form-control" placeholder="Nome do fornecedor"
                      value={form.fornecedor} onChange={e => setForm({ ...form, fornecedor: e.target.value })} />
                  </div>
                </div>
                <div className="form-row form-row-3">
                  <div className="form-group">
                    <label className="form-label">Categoria</label>
                    <select className="form-control" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                      <option value="">Selecionar...</option>
                      {catDespesas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vencimento *</label>
                    <input type="date" className="form-control" required
                      value={form.vencimento} onChange={e => setForm({ ...form, vencimento: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valor (R$) *</label>
                    <input type="number" step="0.01" min="0" className="form-control" placeholder="0,00" required
                      value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
                  </div>
                </div>
                <div className="form-row form-row-3">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option>Não Pago</option>
                      <option>Pago</option>
                    </select>
                  </div>
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
                {form.recorrente && (
                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <label className="form-label">Reajuste fixo por mês (R$)</label>
                      <input type="number" step="0.01" min="0" className="form-control" placeholder="Ex: 50,00"
                        value={form.reajusteFixo} onChange={e => setForm({ ...form, reajusteFixo: e.target.value })} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                        Valor somado ao total a cada mês
                      </span>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Reajuste percentual por mês (%)</label>
                      <input type="number" step="0.01" min="0" max="100" className="form-control" placeholder="Ex: 2,5"
                        value={form.reajustePercentual} onChange={e => setForm({ ...form, reajustePercentual: e.target.value })} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                        Percentual aplicado sobre o valor mês a mês
                      </span>
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea className="form-control" rows={2} placeholder="Observações..."
                    value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Salvar Alterações' : 'Adicionar Despesa'}</button>
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
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Tem certeza que deseja excluir esta despesa?</p>
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
