import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Wallet, TrendingUp, TrendingDown, AlertCircle, Clock,
  ArrowUpRight, ArrowDownRight, DollarSign, Target, PiggyBank,
  CheckCircle, ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getStatusColor } from '../utils/formatters';
import { format, subMonths, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-light)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { state, getSaldoAtual, getTotalReceitas, getTotalDespesas, getPendentes, getCategoriaById } = useApp();

  const saldo = getSaldoAtual();
  const receitasMes = getTotalReceitas('mes');
  const despesasMes = getTotalDespesas('mes');
  const lucro = receitasMes - despesasMes;
  const pendentes = getPendentes();

  const evolucaoData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(new Date(), 5 - i);
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const rec = state.receitas
        .filter(r => r.status === 'Recebido' && isWithinInterval(parseISO(r.data), { start, end }))
        .reduce((s, r) => s + r.valor, 0);
      const des = state.despesas
        .filter(d => d.status === 'Pago' && isWithinInterval(parseISO(d.vencimento), { start, end }))
        .reduce((s, d) => s + d.valor, 0);
      return {
        mes: format(month, 'MMM', { locale: ptBR }),
        Receitas: rec,
        Despesas: des,
        Saldo: rec - des,
      };
    });
  }, [state.receitas, state.despesas]);

  const catData = useMemo(() => {
    const map = {};
    state.despesas
      .filter(d => d.status === 'Pago')
      .forEach(d => {
        const cat = getCategoriaById(d.categoria);
        const nome = cat?.nome || 'Outros';
        map[nome] = (map[nome] || 0) + d.valor;
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [state.despesas, state.categorias]);

  const ultimosLancamentos = useMemo(() => {
    const rec = state.receitas.map(r => ({ ...r, tipo: 'receita' }));
    const des = state.despesas.map(d => ({ ...d, tipo: 'despesa', data: d.vencimento }));
    return [...rec, ...des]
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .slice(0, 8);
  }, [state.receitas, state.despesas]);

  const statCards = [
    { label: 'Saldo Atual', value: saldo, variant: saldo >= 0 ? 'success' : 'danger', icon: Wallet, iconBg: 'rgba(16,185,129,0.1)', iconColor: '#10b981', sub: 'Posição em conta' },
    { label: 'Receitas do Mês', value: receitasMes, variant: 'primary', icon: TrendingUp, iconBg: 'rgba(59,130,246,0.1)', iconColor: '#3b82f6', sub: 'Valores recebidos' },
    { label: 'Despesas do Mês', value: despesasMes, variant: 'danger', icon: TrendingDown, iconBg: 'rgba(239,68,68,0.1)', iconColor: '#ef4444', sub: 'Valores pagos' },
    { label: 'Lucro Líquido', value: lucro, variant: lucro >= 0 ? 'success' : 'danger', icon: DollarSign, iconBg: lucro >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', iconColor: lucro >= 0 ? '#10b981' : '#ef4444', sub: 'Receitas - Despesas' },
    { label: 'A Receber', value: pendentes.aReceber, variant: 'warning', icon: Clock, iconBg: 'rgba(245,158,11,0.1)', iconColor: '#f59e0b', sub: 'Pendentes de recebimento' },
    { label: 'A Pagar', value: pendentes.aPagar, variant: 'warning', icon: AlertCircle, iconBg: 'rgba(245,158,11,0.1)', iconColor: '#f59e0b', sub: 'Pendentes de pagamento' },
    { label: 'Contas Vencidas', value: pendentes.vencidas, variant: 'danger', icon: AlertCircle, iconBg: 'rgba(239,68,68,0.1)', iconColor: '#ef4444', sub: 'Requer atenção imediata' },
    { label: 'Reserva Total', value: state.reserva.reduce((s, r) => s + r.atual, 0), variant: 'purple', icon: PiggyBank, iconBg: 'rgba(139,92,246,0.1)', iconColor: '#8b5cf6', sub: 'Fundo + Caixa + Investimentos' },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`stat-card ${card.variant}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="stat-label">{card.label}</div>
                <div className="stat-icon" style={{ background: card.iconBg }}>
                  <Icon size={17} style={{ color: card.iconColor }} />
                </div>
              </div>
              <div className={`stat-value ${card.variant === 'danger' ? 'text-danger' : card.variant === 'success' ? 'text-success' : ''}`}>
                {formatCurrency(card.value)}
              </div>
              <div className="stat-sub">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Evolução Financeira</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Últimos 6 meses</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={evolucaoData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="desGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="mes" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              <Area type="monotone" dataKey="Receitas" stroke="#3b82f6" fill="url(#recGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Despesas" stroke="#ef4444" fill="url(#desGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Gastos por Categoria</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Top 5 despesas</div>
          {catData.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p>Nenhum dado disponível</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                    {catData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {catData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div className="color-dot" style={{ background: COLORS[i % COLORS.length] }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Últimos lançamentos + bar chart */}
      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Últimos Lançamentos</div>
          </div>
          {ultimosLancamentos.length === 0 ? (
            <div className="empty-state"><p>Nenhum lançamento ainda</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {ultimosLancamentos.map((item) => {
                const cat = getCategoriaById(item.categoria);
                const isRec = item.tipo === 'receita';
                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '9px 10px', borderRadius: 8,
                    transition: 'background var(--transition)',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: isRec ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isRec
                        ? <ArrowUpRight size={15} style={{ color: 'var(--success)' }} />
                        : <ArrowDownRight size={15} style={{ color: 'var(--danger)' }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.descricao}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {cat?.nome || 'Sem categoria'} • {formatDate(item.data)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isRec ? 'var(--success)' : 'var(--danger)' }}>
                        {isRec ? '+' : '-'}{formatCurrency(item.valor)}
                      </div>
                      <div style={{ fontSize: 11 }}>
                        <span className={`badge badge-${getStatusColor(item.status)}`}>{item.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Receitas x Despesas</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Comparativo mensal</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={evolucaoData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="mes" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              <Bar dataKey="Receitas" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
