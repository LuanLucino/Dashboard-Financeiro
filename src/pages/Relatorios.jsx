import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { FileText, TrendingUp, TrendingDown, DollarSign, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import {
  startOfMonth, endOfMonth, parseISO, isWithinInterval,
  format, subMonths, startOfQuarter, endOfQuarter,
  startOfYear, endOfYear
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  );
};

const PERIODOS = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

export default function Relatorios() {
  const { state, getCategoriaById } = useApp();
  const [periodo, setPeriodo] = useState('mensal');

  const getRange = () => {
    const now = new Date();
    switch (periodo) {
      case 'mensal': return { start: startOfMonth(now), end: endOfMonth(now), label: format(now, 'MMMM yyyy', { locale: ptBR }) };
      case 'trimestral': return { start: startOfQuarter(now), end: endOfQuarter(now), label: `Trimestre ${Math.ceil((now.getMonth() + 1) / 3)} de ${now.getFullYear()}` };
      case 'semestral': return { start: new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1), end: new Date(now.getFullYear(), now.getMonth() < 6 ? 5 : 11, 31), label: `${now.getMonth() < 6 ? '1º' : '2º'} Semestre ${now.getFullYear()}` };
      case 'anual': return { start: startOfYear(now), end: endOfYear(now), label: `Ano ${now.getFullYear()}` };
      default: return { start: startOfMonth(now), end: endOfMonth(now), label: '' };
    }
  };

  const { start, end, label } = getRange();

  const dadosFiltrados = useMemo(() => {
    const receitas = state.receitas.filter(r => {
      const d = parseISO(r.data);
      return isWithinInterval(d, { start, end }) && r.status === 'Recebido';
    });
    const despesas = state.despesas.filter(d => {
      const date = parseISO(d.vencimento);
      return isWithinInterval(date, { start, end }) && d.status === 'Pago';
    });
    const totalRec = receitas.reduce((s, r) => s + r.valor, 0);
    const totalDes = despesas.reduce((s, d) => s + d.valor, 0);
    return { receitas, despesas, totalRec, totalDes, lucro: totalRec - totalDes };
  }, [state, start, end]);

  const gastosPorCategoria = useMemo(() => {
    const map = {};
    dadosFiltrados.despesas.forEach(d => {
      const cat = getCategoriaById(d.categoria);
      const nome = cat?.nome || 'Outros';
      map[nome] = (map[nome] || 0) + d.valor;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [dadosFiltrados.despesas]);

  const receitasPorCategoria = useMemo(() => {
    const map = {};
    dadosFiltrados.receitas.forEach(r => {
      const cat = getCategoriaById(r.categoria);
      const nome = cat?.nome || 'Outros';
      map[nome] = (map[nome] || 0) + r.valor;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [dadosFiltrados.receitas]);

  const comparativo = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(new Date(), 5 - i);
      const mStart = startOfMonth(month);
      const mEnd = endOfMonth(month);
      const rec = state.receitas.filter(r => {
        const d = parseISO(r.data);
        return isWithinInterval(d, { start: mStart, end: mEnd }) && r.status === 'Recebido';
      }).reduce((s, r) => s + r.valor, 0);
      const des = state.despesas.filter(d => {
        const date = parseISO(d.vencimento);
        return isWithinInterval(date, { start: mStart, end: mEnd }) && d.status === 'Pago';
      }).reduce((s, d) => s + d.valor, 0);
      return { mes: format(month, 'MMM/yy', { locale: ptBR }), Receitas: rec, Despesas: des, Lucro: rec - des };
    });
  }, [state]);

  const exportCSV = () => {
    const rows = [
      ['Tipo', 'Descrição', 'Categoria', 'Data', 'Valor', 'Status'],
      ...dadosFiltrados.receitas.map(r => ['Receita', r.descricao, getCategoriaById(r.categoria)?.nome || '', r.data, r.valor, r.status]),
      ...dadosFiltrados.despesas.map(d => ['Despesa', d.descricao, getCategoriaById(d.categoria)?.nome || '', d.vencimento, d.valor, d.status]),
    ];
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `relatorio_${periodo}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Relatórios</h1>
          <p>Análise e exportação de dados financeiros — {label}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="tabs">
            {PERIODOS.map(p => (
              <button key={p.value} className={`tab ${periodo === p.value ? 'active' : ''}`} onClick={() => setPeriodo(p.value)}>
                {p.label}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary" onClick={exportCSV}>
            <Download size={14} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card success">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-label">Receita Total</div>
            <TrendingUp size={16} style={{ color: 'var(--success)' }} />
          </div>
          <div className="stat-value text-success">{formatCurrency(dadosFiltrados.totalRec)}</div>
          <div className="stat-sub">{dadosFiltrados.receitas.length} lançamentos recebidos</div>
        </div>
        <div className="stat-card danger">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-label">Despesa Total</div>
            <TrendingDown size={16} style={{ color: 'var(--danger)' }} />
          </div>
          <div className="stat-value text-danger">{formatCurrency(dadosFiltrados.totalDes)}</div>
          <div className="stat-sub">{dadosFiltrados.despesas.length} despesas pagas</div>
        </div>
        <div className={`stat-card ${dadosFiltrados.lucro >= 0 ? 'success' : 'danger'}`}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-label">Lucro Líquido</div>
            <DollarSign size={16} style={{ color: dadosFiltrados.lucro >= 0 ? 'var(--success)' : 'var(--danger)' }} />
          </div>
          <div className={`stat-value ${dadosFiltrados.lucro >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(dadosFiltrados.lucro)}</div>
          <div className="stat-sub">Margem: {dadosFiltrados.totalRec > 0 ? ((dadosFiltrados.lucro / dadosFiltrados.totalRec) * 100).toFixed(1) : 0}%</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Gastos por Categoria</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Distribuição das despesas</div>
          {gastosPorCategoria.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}><p>Sem dados no período</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={gastosPorCategoria} cx="50%" cy="50%" outerRadius={90} dataKey="value" paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {gastosPorCategoria.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Receitas por Categoria</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Distribuição das entradas</div>
          {receitasPorCategoria.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}><p>Sem dados no período</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {receitasPorCategoria.slice(0, 6).map((item, i) => (
                <div key={item.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span className="color-dot" style={{ background: COLORS[i % COLORS.length] }} />
                      {item.name}
                    </span>
                    <span style={{ fontWeight: 700 }}>{formatCurrency(item.value)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(item.value / dadosFiltrados.totalRec) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Comparativo dos Últimos 6 Meses</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Receitas, despesas e lucro líquido</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={comparativo} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="mes" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
            <Bar dataKey="Receitas" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Maiores gastos */}
      {gastosPorCategoria.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Maiores Gastos — {label}</div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Total Gasto</th>
                  <th>% do Total</th>
                  <th>Proporção</th>
                </tr>
              </thead>
              <tbody>
                {gastosPorCategoria.map((item, i) => (
                  <tr key={item.name}>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="color-dot" style={{ background: COLORS[i % COLORS.length] }} />
                        {item.name}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(item.value)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {dadosFiltrados.totalDes > 0 ? ((item.value / dadosFiltrados.totalDes) * 100).toFixed(1) : 0}%
                    </td>
                    <td style={{ width: 160 }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${dadosFiltrados.totalDes > 0 ? (item.value / dadosFiltrados.totalDes) * 100 : 0}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
