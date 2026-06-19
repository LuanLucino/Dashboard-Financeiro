import {
  LayoutDashboard, TrendingUp, TrendingDown, CreditCard,
  BarChart2, Target, PiggyBank, Tag, FileText,
  ChevronLeft, ChevronRight, LogOut, Building2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { id: 'receitas', label: 'Receitas', icon: TrendingUp, group: 'lancamentos' },
  { id: 'despesas', label: 'Despesas', icon: TrendingDown, group: 'lancamentos' },
  { id: 'contas-pagar', label: 'Contas a Pagar', icon: CreditCard, group: 'lancamentos' },
  { id: 'fluxo-caixa', label: 'Fluxo de Caixa', icon: BarChart2, group: 'analise' },
  { id: 'planejamento', label: 'Planejamento', icon: Target, group: 'analise' },
  { id: 'reserva', label: 'Reserva Financeira', icon: PiggyBank, group: 'analise' },
  { id: 'categorias', label: 'Categorias', icon: Tag, group: 'config' },
  { id: 'relatorios', label: 'Relatórios', icon: FileText, group: 'config' },
];

const groups = {
  main: '',
  lancamentos: 'Lançamentos',
  analise: 'Análise',
  config: 'Configurações',
};

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const { user, logout } = useAuth();
  const { activePage, sidebarOpen } = state;

  const pendentes = state.despesas.filter(d => d.status === 'Não Pago' || d.status === 'Vencido');
  const notifs = pendentes.length;

  const groups_ordered = ['main', 'lancamentos', 'analise', 'config'];

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          {sidebarOpen && (
            <div className="sidebar-brand">
              <div className="brand-icon">
                <Building2 size={18} />
              </div>
              <div>
                <div className="brand-name">{state.config.empresa || 'FinancePro'}</div>
                <div className="brand-sub">Gestão Financeira</div>
              </div>
            </div>
          )}
          <button
            className="sidebar-toggle"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            title={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {groups_ordered.map((group) => {
            const items = navItems.filter(i => i.group === group);
            return (
              <div key={group} className="nav-group">
                {sidebarOpen && groups[group] && (
                  <div className="nav-group-label">{groups[group]}</div>
                )}
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  const hasBadge = item.id === 'contas-pagar' && notifs > 0;
                  return (
                    <button
                      key={item.id}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => dispatch({ type: 'SET_PAGE', payload: item.id })}
                      title={!sidebarOpen ? item.label : ''}
                    >
                      <Icon size={17} className="nav-icon" />
                      {sidebarOpen && <span className="nav-label">{item.label}</span>}
                      {hasBadge && (
                        <span className="nav-badge">{notifs > 9 ? '9+' : notifs}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen ? (
            <div className="sidebar-user">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="user-avatar">
                  <span>{(user?.displayName || user?.email || 'U')[0].toUpperCase()}</span>
                </div>
              )}
              <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
                <div className="user-name">{user?.displayName || user?.email || 'Usuário'}</div>
                <div className="user-plan" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </div>
              </div>
              <button
                onClick={logout}
                title="Sair"
                style={{
                  flexShrink: 0, padding: 6, borderRadius: 7,
                  color: 'var(--text-muted)', transition: 'all var(--transition)',
                  background: 'transparent',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              title="Sair"
              style={{
                width: '100%', padding: '8px', borderRadius: 8,
                color: 'var(--text-muted)', display: 'flex', justifyContent: 'center',
                background: 'transparent', transition: 'all var(--transition)',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          transition: width var(--transition);
          flex-shrink: 0;
          overflow: hidden;
          position: relative;
          z-index: 100;
        }
        .sidebar.collapsed { width: 60px; }
        .sidebar-overlay {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 99;
        }
        .sidebar-header {
          padding: 16px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
          min-height: var(--header-height);
          gap: 8px;
        }
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }
        .brand-icon {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, var(--primary), var(--purple));
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }
        .brand-name {
          font-size: 14px; font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .brand-sub { font-size: 11px; color: var(--text-muted); }
        .sidebar-toggle {
          width: 28px; height: 28px;
          border-radius: 7px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          display: flex; align-items: center; justify-content: center;
          transition: all var(--transition);
          flex-shrink: 0;
        }
        .sidebar-toggle:hover { color: var(--text-primary); border-color: var(--border-light); }
        .sidebar-nav { flex: 1; overflow-y: auto; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; }
        .nav-group { display: flex; flex-direction: column; gap: 1px; margin-bottom: 6px; }
        .nav-group-label {
          font-size: 10px; font-weight: 600; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.8px;
          padding: 6px 8px 4px; margin-top: 4px;
        }
        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px;
          border-radius: 9px;
          color: var(--text-secondary);
          font-size: 13px; font-weight: 500;
          transition: all var(--transition);
          position: relative;
          white-space: nowrap;
          width: 100%;
          text-align: left;
        }
        .nav-item:hover { background: var(--bg-elevated); color: var(--text-primary); }
        .nav-item.active {
          background: var(--primary-glow);
          color: var(--primary);
          border: 1px solid rgba(59,130,246,0.2);
        }
        .nav-item.active .nav-icon { color: var(--primary); }
        .nav-icon { flex-shrink: 0; }
        .nav-label { flex: 1; }
        .nav-badge {
          background: var(--danger);
          color: #fff;
          font-size: 10px; font-weight: 700;
          padding: 1px 5px;
          border-radius: 10px;
          line-height: 1.4;
        }
        .sidebar.collapsed .nav-item { padding: 10px; justify-content: center; }
        .sidebar.collapsed .nav-group-label { display: none; }
        .sidebar-footer {
          padding: 12px;
          border-top: 1px solid var(--border);
        }
        .sidebar-user {
          display: flex; align-items: center; gap: 10px;
          padding: 10px;
          border-radius: 9px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
        }
        .user-avatar {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--primary), var(--purple));
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #fff;
          flex-shrink: 0;
        }
        .user-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-plan { font-size: 11px; color: var(--text-muted); }
        @media (max-width: 768px) {
          .sidebar { position: fixed; left: 0; top: 0; z-index: 200; transform: translateX(-100%); width: var(--sidebar-width) !important; }
          .sidebar.open { transform: translateX(0); }
          .sidebar-overlay { display: block; }
        }
      `}</style>
    </>
  );
}
