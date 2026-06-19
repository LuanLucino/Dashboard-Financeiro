import { useMemo } from 'react';
import { CreditCard, AlertCircle, Clock, CheckCircle, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { isPast, isToday, parseISO, isThisWeek, isThisMonth, differenceInDays } from 'date-fns';

export default function ContasPagar() {
  const { state, dispatch, getCategoriaById } = useApp();

  const despesas = useMemo(() => {
    return state.despesas
      .filter(d => d.status !== 'Pago')
      .map(d => {
        const date = parseISO(d.vencimento);
        const past = isPast(date) && !isToday(date);
        return { ...d, status: past ? 'Vencido' : d.status };
      })
      .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));
  }, [state.despesas]);

  const grupos = useMemo(() => {
    const vencidas = despesas.filter(d => d.status === 'Vencido');
    const hoje = despesas.filter(d => isToday(parseISO(d.vencimento)));
    const semana = despesas.filter(d => {
      const date = parseISO(d.vencimento);
      return !isToday(date) && isThisWeek(date, { weekStartsOn: 1 });
    });
    const mes = despesas.filter(d => {
      const date = parseISO(d.vencimento);
      return isThisMonth(date) && !isThisWeek(date, { weekStartsOn: 1 }) && !isToday(date);
    });
    const futuro = despesas.filter(d => {
      const date = parseISO(d.vencimento);
      return !isThisMonth(date) && !isToday(date);
    });
    return { vencidas, hoje, semana, mes, futuro };
  }, [despesas]);

  const totais = useMemo(() => ({
    vencidas: grupos.vencidas.reduce((s, d) => s + d.valor, 0),
    hoje: grupos.hoje.reduce((s, d) => s + d.valor, 0),
    semana: grupos.semana.reduce((s, d) => s + d.valor, 0),
    mes: grupos.mes.reduce((s, d) => s + d.valor, 0),
    total: despesas.reduce((s, d) => s + d.valor, 0),
  }), [grupos, despesas]);

  const togglePago = (id) => dispatch({ type: 'TOGGLE_PAGO', payload: id });

  const DespesaItem = ({ d, variant }) => {
    const cat = getCategoriaById(d.categoria);
    const dias = differenceInDays(parseISO(d.vencimento), new Date());
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', borderRadius: 9,
        background: 'var(--bg-card)',
        border: `1px solid ${variant === 'danger' ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
        marginBottom: 8,
        transition: 'all var(--transition)',
      }}>
        <button
          onClick={() => togglePago(d.id)}
          style={{
            width: 22, height: 22, borderRadius: 6,
            border: `2px solid ${variant === 'danger' ? 'var(--danger)' : 'var(--border-light)'}`,
            background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: 'pointer', color: 'var(--success)',
            transition: 'all var(--transition)',
          }}
          title="Marcar como pago"
        >
          <span style={{ fontSize: 12 }}></span>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{d.descricao}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8 }}>
            {cat && <span style={{ color: cat.cor }}>{cat.nome}</span>}
            {d.fornecedor && <span>• {d.fornecedor}</span>}
            {d.recorrente && <span className="badge badge-muted" style={{ fontSize: 10 }}>Recorrente</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, color: variant === 'danger' ? 'var(--danger)' : 'var(--text-primary)', fontSize: 14 }}>
            {formatCurrency(d.valor)}
          </div>
          <div style={{ fontSize: 11, color: variant === 'danger' ? 'var(--danger)' : 'var(--text-muted)', marginTop: 2 }}>
            {variant === 'danger'
              ? `${Math.abs(dias)} dia(s) em atraso`
              : `Vence ${formatDate(d.vencimento)}`
            }
          </div>
        </div>
      </div>
    );
  };

  const GrupoSection = ({ titulo, items, valor, variant, icon: Icon, iconColor }) => {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
          padding: '10px 14px', borderRadius: 8,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        }}>
          <Icon size={16} style={{ color: iconColor, flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>{titulo}</span>
          <span className={`badge badge-${variant}`}>{items.length}</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: iconColor }}>{formatCurrency(valor)}</span>
        </div>
        {items.map(d => <DespesaItem key={d.id} d={d} variant={variant} />)}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Contas a Pagar</h1>
          <p>Acompanhe e gerencie todos os seus compromissos financeiros</p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card danger">
          <div className="stat-label">Vencidas</div>
          <div className="stat-value text-danger">{formatCurrency(totais.vencidas)}</div>
          <div className="stat-sub">{grupos.vencidas.length} conta(s)</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Vencem Hoje</div>
          <div className="stat-value">{formatCurrency(totais.hoje)}</div>
          <div className="stat-sub">{grupos.hoje.length} conta(s)</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Esta Semana</div>
          <div className="stat-value">{formatCurrency(totais.semana)}</div>
          <div className="stat-sub">{grupos.semana.length} conta(s)</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-label">Total Pendente</div>
          <div className="stat-value">{formatCurrency(totais.total)}</div>
          <div className="stat-sub">{despesas.length} conta(s)</div>
        </div>
      </div>

      {despesas.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <CheckCircle size={40} style={{ color: 'var(--success)', opacity: 1 }} />
            <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: 15 }}>Tudo em dia!</p>
            <p>Não há contas pendentes no momento.</p>
          </div>
        </div>
      ) : (
        <div>
          <GrupoSection
            titulo="Contas Vencidas"
            items={grupos.vencidas}
            valor={totais.vencidas}
            variant="danger"
            icon={AlertCircle}
            iconColor="var(--danger)"
          />
          <GrupoSection
            titulo="Vencem Hoje"
            items={grupos.hoje}
            valor={totais.hoje}
            variant="warning"
            icon={Clock}
            iconColor="var(--warning)"
          />
          <GrupoSection
            titulo="Esta Semana"
            items={grupos.semana}
            valor={totais.semana}
            variant="warning"
            icon={Calendar}
            iconColor="var(--warning)"
          />
          <GrupoSection
            titulo="Este Mês"
            items={grupos.mes}
            valor={totais.mes}
            variant="primary"
            icon={CreditCard}
            iconColor="var(--primary)"
          />
          <GrupoSection
            titulo="Próximos Meses"
            items={grupos.futuro}
            valor={grupos.futuro.reduce((s, d) => s + d.valor, 0)}
            variant="muted"
            icon={Calendar}
            iconColor="var(--text-secondary)"
          />
        </div>
      )}
    </div>
  );
}
