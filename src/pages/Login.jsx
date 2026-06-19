import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart2, Shield, TrendingUp, PiggyBank, AlertCircle } from 'lucide-react';

const FEATURES = [
  { icon: TrendingUp, text: 'Controle de receitas e despesas' },
  { icon: BarChart2, text: 'Fluxo de caixa e relatórios' },
  { icon: PiggyBank, text: 'Metas e reserva financeira' },
  { icon: Shield, text: 'Seus dados salvos com segurança' },
];

export default function Login() {
  const { loginComGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleLogin = async () => {
    setErro('');
    setLoading(true);
    try {
      await loginComGoogle();
    } catch (err) {
      setErro('Não foi possível fazer login. Verifique as configurações do Firebase.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', width: '100%', maxWidth: 920, gap: 48, alignItems: 'center', zIndex: 1 }}>

        {/* Left — brand */}
        <div style={{ flex: 1, display: 'none' }} className="login-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--primary), var(--purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BarChart2 size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>FinancePro</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gestão Financeira</div>
            </div>
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
            Suas finanças,<br />
            <span style={{ background: 'linear-gradient(90deg, var(--primary), var(--purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              sob controle.
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 36 }}>
            Dashboard profissional para autônomos, MEIs e pequenas empresas gerenciarem receitas, despesas e planejamento financeiro.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--primary-glow)', border: '1px solid rgba(59,130,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={15} style={{ color: 'var(--primary)' }} />
                </div>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — login card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 20,
          padding: '40px 36px',
          width: '100%',
          maxWidth: 420,
          margin: '0 auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, var(--primary), var(--purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BarChart2 size={26} color="#fff" />
            </div>
          </div>

          <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            Bem-vindo ao FinancePro
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
            Entre com sua conta Google para continuar
          </p>

          {erro && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px', borderRadius: 9, marginBottom: 20,
              background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--danger)', fontSize: 13,
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{erro}</span>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              padding: '13px 20px',
              borderRadius: 10,
              background: loading ? 'var(--bg-elevated)' : '#fff',
              color: '#1f2937',
              fontWeight: 600, fontSize: 15,
              border: '1px solid #e5e7eb',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'; }}
          >
            {loading ? (
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '2px solid #d1d5db', borderTopColor: '#6b7280',
                animation: 'spin 0.7s linear infinite',
              }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Entrando...' : 'Entrar com Google'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 24, lineHeight: 1.6 }}>
            Ao entrar, você concorda com os termos de uso.<br />
            Seus dados ficam salvos localmente neste dispositivo.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 700px) {
          .login-left { display: block !important; }
        }
      `}</style>
    </div>
  );
}
