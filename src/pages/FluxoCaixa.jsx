import { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import { gerarProjecoesReceitas, gerarProjecoesDespesas } from '../utils/projecoes';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO,
  addMonths, subMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
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

export default function FluxoCaixa() {
  const { state } = useApp();
  const [mesRef, setMesRef] = useState(new Date());
  const [aba, setAba] = useState('diario');
  const [filtroTipo, setFiltroTipo] = useState('ambos'); // 'ambos' | 'entradas' | 'saidas'

  // ── Dados diários (mês selecionado) ──────────────────────────────────────
  const dadosDiarios = useMemo(() => {
    const start = startOfMonth(mesRef);
    const end = endOfMonth(mesRef);
    const days = eachDayOfInterval({ start, end });

    const projecoesRec = gerarProjecoesReceitas(state.receitas, mesRef);
    const projecoesDesp = gerarProjecoesDespesas(state.despesas, mesRef);

    const receitasMes = state.receitas.filter(r => {
      const d = parseISO(r.data);
      return d >= start && d <= end;
    });
    const despesasMes = state.despesas.filter(d => {
      const dt = parseISO(d.vencimento);
      return dt >= start && dt <= end;
    });

    let saldoReal = state.config.saldoInicial || 0;
    let saldoPrev = state.config.saldoInicial || 0;

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');

      const ent = receitasMes
        .filter(r => r.data === dayStr && r.status === 'Recebido')
        .reduce((s, r) => s + r.valor, 0);

      const entPrev = [
        ...receitasMes.filter(r => r.data === dayStr && r.status !== 'Recebido'),
        ...projecoesRec.filter(r => r.data === dayStr),
      ].reduce((s, r) => s + r.valor, 0);

      const sai = despesasMes
        .filter(d => d.vencimento === dayStr && d.status === 'Pago')
        .reduce((s, d) => s + d.valor, 0);

      const saiPrev = [
        ...despesasMes.filter(d => d.vencimento === dayStr && d.status !== 'Pago'),
        ...projecoesDesp.filter(d => d.vencimento === dayStr),
      ].reduce((s, d) => s + d.valor, 0);

      saldoReal += ent - sai;
      saldoPrev += (ent + entPrev) - (sai + saiPrev);

      return {
        dia: format(day, 'dd/MM'),
        'Entradas': ent,
        'A Receber': entPrev,
        'Saídas': sai,
        'A Pagar': saiPrev,
        'Saldo': saldoReal,
        'Saldo Previsto': saldoPrev,
      };
    });
  }, [mesRef, state.receitas, state.despesas, state.config.saldoInicial]);

  // ── Dados mensais (ano do mês selecionado) ────────────────────────────────
  const dadosMensais = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = addMonths(new Date(mesRef.getFullYear(), 0, 1), i);
      const start = startOfMonth(month);
      const end = endOfMonth(month);

      const projecoesRec = gerarProjecoesReceitas(state.receitas, month);
      const projecoesDesp = gerarProjecoesDespesas(state.despesas, month);

      const ent = state.receitas
        .filter(r => { const d = parseISO(r.data); return d >= start && d <= end && r.status === 'Recebido'; })
        .reduce((s, r) => s + r.valor, 0);

      const entPrev = [
        ...state.receitas.filter(r => { const d = parseISO(r.data); return d >= start && d <= end && r.status !== 'Recebido'; }),
        ...projecoesRec,
      ].reduce((s, r) => s + r.valor, 0);

      const sai = state.despesas
        .filter(d => { const dt = parseISO(d.vencimento); return dt >= start && dt <= end && d.status === 'Pago'; })
        .reduce((s, d) => s + d.valor, 0);

      const saiPrev = [
        ...state.despesas.filter(d => { const dt = parseISO(d.vencimento); return dt >= start && dt <= end && d.status !== 'Pago'; }),
        ...projecoesDesp,
      ].reduce((s, d) => s + d.valor, 0);

      return {
        mes: format(month, 'MMM', { locale: ptBR }),
        'Entradas': ent,
        'A Receber': entPrev,
        'Saídas': sai,
        'A Pagar': saiPrev,
        'Saldo': ent - sai,
        'Saldo Previsto': (ent + entPrev) - (sai + saiPrev),
      };
    });
  }, [mesRef, state.receitas, state.despesas]);

  // ── Totais do mês (cards) ─────────────────────────────────────────────────
  const totaisMes = useMemo(() => {
    const start = startOfMonth(mesRef);
    const end = endOfMonth(mesRef);

    const projecoesRec = gerarProjecoesReceitas(state.receitas, mesRef);
    const projecoesDesp = gerarProjecoesDespesas(state.despesas, mesRef);

    const ent = state.receitas
      .filter(r => { const d = parseISO(r.data); return d >= start && d <= end && r.status === 'Recebido'; })
      .reduce((s, r) => s + r.valor, 0);

    const entPrev = [
      ...state.receitas.filter(r => { const d = parseISO(r.data); return d >= start && d <= end && r.status !== 'Recebido'; }),
      ...projecoesRec,
    ].reduce((s, r) => s + r.valor, 0);

    const sai = state.despesas
      .filter(d => { const dt = parseISO(d.vencimento); return dt >= start && dt <= end && d.status === 'Pago'; })
      .reduce((s, d) => s + d.valor, 0);

    const saiPrev = [
      ...state.despesas.filter(d => { const dt = parseISO(d.vencimento); return dt >= start && dt <= end && d.status !== 'Pago'; }),
      ...projecoesDesp,
    ].reduce((s, d) => s + d.valor, 0);

    return {
      ent, entPrev, sai, saiPrev,
      saldo: ent - sai,
      saldoPrev: (ent + entPrev) - (sai + saiPrev),
    };
  }, [mesRef, state.receitas, state.despesas]);

  const dadosAtivos = aba === 'diario' ? dadosDiarios : dadosMensais;
  const xKey = aba === 'diario' ? 'dia' : 'mes';
  const showEnt = filtroTipo === 'ambos' || filtroTipo === 'entradas';
  const showSai = filtroTipo === 'ambos' || filtroTipo === 'saidas';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Fluxo de Caixa</h1>
          <p>Movimentação financeira com projeções de recorrentes</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn-icon" onClick={() => setMesRef(subMonths(mesRef, 1))}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontWeight: 600, fontSize: 14, minWidth: 130, textAlign: 'center' }}>
            {format(mesRef, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button className="btn-icon" onClick={() => setMesRef(addMonths(mesRef, 1))}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card success">
          <div className="stat-label">Entradas Realizadas</div>
          <div className="stat-value text-success">{formatCurrency(totaisMes.ent)}</div>
          <div className="stat-sub">+ {formatCurrency(totaisMes.entPrev)} a receber</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">Saídas Realizadas</div>
          <div className="stat-value text-danger">{formatCurrency(totaisMes.sai)}</div>
          <div className="stat-sub">+ {formatCurrency(totaisMes.saiPrev)} a pagar</div>
        </div>
        <div className={`stat-card ${totaisMes.saldo >= 0 ? 'success' : 'danger'}`}>
          <div className="stat-label">Saldo Realizado</div>
          <div className={`stat-value ${totaisMes.saldo >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(totaisMes.saldo)}
          </div>
          <div className="stat-sub">Resultado confirmado</div>
        </div>
        <div className={`stat-card ${totaisMes.saldoPrev >= 0 ? 'primary' : 'danger'}`}>
          <div className="stat-label">Previsão de Saldo</div>
          <div className="stat-value">{formatCurrency(totaisMes.saldoPrev)}</div>
          <div className="stat-sub">Incl. pendentes e recorrentes</div>
        </div>
      </div>

      {/* Gráfico principal */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16, flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontWeight: 600 }}>Movimentação Financeira</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Sólido = realizado &nbsp;·&nbsp; Tracejado = pendente / recorrente projetado
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div className="tabs">
              <button
                className={`tab ${filtroTipo === 'ambos' ? 'active' : ''}`}
                onClick={() => setFiltroTipo('ambos')}
              >Ambos</button>
              <button
                className={`tab ${filtroTipo === 'entradas' ? 'active' : ''}`}
                onClick={() => setFiltroTipo('entradas')}
              >Entradas</button>
              <button
                className={`tab ${filtroTipo === 'saidas' ? 'active' : ''}`}
                onClick={() => setFiltroTipo('saidas')}
              >Saídas</button>
            </div>
            <div className="tabs">
              <button
                className={`tab ${aba === 'diario' ? 'active' : ''}`}
                onClick={() => setAba('diario')}
              >Diário</button>
              <button
                className={`tab ${aba === 'mensal' ? 'active' : ''}`}
                onClick={() => setAba('mensal')}
              >Anual</button>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={dadosAtivos} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="entGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="entPrevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="saiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="saiPrevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey={xKey}
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={false} tickLine={false}
              interval={aba === 'diario' ? 4 : 0}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
            <ReferenceLine y={0} stroke="var(--border-light)" />

            <Area hide={!showEnt} type="monotone" dataKey="Entradas"
              stroke="#10b981" fill="url(#entGrad)" strokeWidth={2} dot={false} />
            <Area hide={!showEnt} type="monotone" dataKey="A Receber"
              stroke="#10b981" fill="url(#entPrevGrad)" strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
            <Area hide={!showSai} type="monotone" dataKey="Saídas"
              stroke="#ef4444" fill="url(#saiGrad)" strokeWidth={2} dot={false} />
            <Area hide={!showSai} type="monotone" dataKey="A Pagar"
              stroke="#ef4444" fill="url(#saiPrevGrad)" strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Saldo diário */}
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          Saldo Diário — {format(mesRef, 'MMMM yyyy', { locale: ptBR })}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Azul = saldo realizado &nbsp;·&nbsp; Verde = saldo previsto (incl. pendentes e recorrentes)
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dadosDiarios} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="dia" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
            <ReferenceLine y={0} stroke="var(--border-light)" />
            <Bar dataKey="Saldo" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={20} />
            <Bar dataKey="Saldo Previsto" fill="#10b981" fillOpacity={0.55} radius={[3, 3, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
