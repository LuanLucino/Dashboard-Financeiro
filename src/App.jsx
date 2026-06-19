import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Receitas from './pages/Receitas';
import Despesas from './pages/Despesas';
import ContasPagar from './pages/ContasPagar';
import FluxoCaixa from './pages/FluxoCaixa';
import Planejamento from './pages/Planejamento';
import Reserva from './pages/Reserva';
import Categorias from './pages/Categorias';
import Relatorios from './pages/Relatorios';

const PAGES = {
  'dashboard': Dashboard,
  'receitas': Receitas,
  'despesas': Despesas,
  'contas-pagar': ContasPagar,
  'fluxo-caixa': FluxoCaixa,
  'planejamento': Planejamento,
  'reserva': Reserva,
  'categorias': Categorias,
  'relatorios': Relatorios,
};

function AppContent() {
  const { user, carregando } = useAuth();
  const { state } = useApp();

  if (carregando) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid var(--border-light)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 0.7s linear infinite',
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Login />;

  const Page = PAGES[state.activePage] || Dashboard;
  return (
    <Layout>
      <Page />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
