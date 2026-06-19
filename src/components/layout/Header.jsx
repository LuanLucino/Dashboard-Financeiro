import { useState } from 'react';
import { Search, Bell, Menu, X, ChevronDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { isPast, parseISO } from 'date-fns';

const PAGE_TITLES = {
  'dashboard': { title: 'Dashboard', sub: 'Visão geral das suas finanças' },
  'receitas': { title: 'Receitas', sub: 'Gerencie suas entradas financeiras' },
  'despesas': { title: 'Despesas', sub: 'Controle seus gastos e despesas' },
  'contas-pagar': { title: 'Contas a Pagar', sub: 'Acompanhe seus compromissos financeiros' },
  'fluxo-caixa': { title: 'Fluxo de Caixa', sub: 'Movimentação financeira detalhada' },
  'planejamento': { title: 'Planejamento', sub: 'Metas e objetivos financeiros' },
  'reserva': { title: 'Reserva Financeira', sub: 'Gestão de fundos e reservas' },
  'categorias': { title: 'Categorias', sub: 'Organize seus lançamentos' },
  'relatorios': { title: 'Relatórios', sub: 'Análise e exportação de dados' },
};

export default function Header() {
  const { state, dispatch } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const pageInfo = PAGE_TITLES[state.activePage] || PAGE_TITLES['dashboard'];

  const vencidas = state.despesas.filter(d =>
    (d.status === 'Não Pago' || d.status === 'Vencido') &&
    isPast(parseISO(d.vencimento))
  );
  const proximasVencer = state.despesas.filter(d => {
    if (d.status === 'Pago') return false;
    const diff = (parseISO(d.vencimento) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  const totalNotifs = vencidas.length + proximasVencer.length;

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="btn-icon header-menu-btn"
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        >
          <Menu size={18} />
        </button>
        <div>
          <h2 className="header-title">{pageInfo.title}</h2>
          <p className="header-sub">{pageInfo.sub}</p>
        </div>
      </div>

      <div className="header-right">
        {showSearch ? (
          <div className="search-bar header-search">
            <Search size={14} className="text-muted" />
            <input
              autoFocus
              placeholder="Buscar lançamentos..."
              value={state.searchQuery}
              onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
            />
            <button onClick={() => { setShowSearch(false); dispatch({ type: 'SET_SEARCH', payload: '' }); }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <button className="btn-icon" onClick={() => setShowSearch(true)} title="Buscar">
            <Search size={16} />
          </button>
        )}

        <div style={{ position: 'relative' }}>
          <button
            className="btn-icon notif-btn"
            onClick={() => setShowNotifs(!showNotifs)}
            title="Notificações"
          >
            <Bell size={16} />
            {totalNotifs > 0 && <span className="notif-count">{totalNotifs > 9 ? '9+' : totalNotifs}</span>}
          </button>

          {showNotifs && (
            <div className="notif-panel">
              <div className="notif-header">
                <span>Notificações</span>
                <button onClick={() => setShowNotifs(false)}><X size={14} /></button>
              </div>
              <div className="notif-body">
                {vencidas.length === 0 && proximasVencer.length === 0 ? (
                  <div className="notif-empty">
                    <CheckCircle size={28} />
                    <p>Tudo em dia!</p>
                  </div>
                ) : (
                  <>
                    {vencidas.map(d => (
                      <div key={d.id} className="notif-item danger">
                        <AlertTriangle size={14} />
                        <div>
                          <div className="notif-title">{d.descricao}</div>
                          <div className="notif-sub">Venceu em {formatDate(d.vencimento)} • {formatCurrency(d.valor)}</div>
                        </div>
                      </div>
                    ))}
                    {proximasVencer.map(d => (
                      <div key={d.id} className="notif-item warning">
                        <Clock size={14} />
                        <div>
                          <div className="notif-title">{d.descricao}</div>
                          <div className="notif-sub">Vence em {formatDate(d.vencimento)} • {formatCurrency(d.valor)}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="header-date">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
        </div>
      </div>

      <style>{`
        .app-header {
          height: var(--header-height);
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          gap: 16px;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .header-left { display: flex; align-items: center; gap: 14px; }
        .header-menu-btn { display: none; }
        .header-title { font-size: 16px; font-weight: 700; line-height: 1.2; }
        .header-sub { font-size: 11px; color: var(--text-muted); }
        .header-right { display: flex; align-items: center; gap: 8px; }
        .header-search { width: 280px; }
        .notif-btn { position: relative; }
        .notif-count {
          position: absolute; top: -4px; right: -4px;
          background: var(--danger); color: #fff;
          font-size: 10px; font-weight: 700;
          min-width: 16px; height: 16px;
          border-radius: 8px; padding: 0 3px;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--bg-secondary);
        }
        .notif-panel {
          position: absolute; top: calc(100% + 8px); right: 0;
          width: 340px;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          z-index: 200;
          overflow: hidden;
          animation: slideUp 0.15s ease;
        }
        .notif-header {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13px; font-weight: 600;
        }
        .notif-header button { color: var(--text-muted); }
        .notif-header button:hover { color: var(--text-primary); }
        .notif-body { max-height: 320px; overflow-y: auto; padding: 8px; }
        .notif-empty { padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--success); }
        .notif-empty p { color: var(--text-secondary); font-size: 13px; }
        .notif-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 12px; border-radius: 8px;
          margin-bottom: 4px;
          font-size: 12px;
        }
        .notif-item.danger { background: var(--danger-bg); color: var(--danger); }
        .notif-item.warning { background: var(--warning-bg); color: var(--warning); }
        .notif-item svg { flex-shrink: 0; margin-top: 2px; }
        .notif-title { font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
        .notif-sub { color: var(--text-secondary); }
        .header-date { font-size: 12px; color: var(--text-muted); white-space: nowrap; padding: 0 4px; }
        @media (max-width: 768px) {
          .header-menu-btn { display: flex; }
          .header-sub { display: none; }
          .header-date { display: none; }
          .app-header { padding: 0 14px; }
        }
      `}</style>
    </header>
  );
}
