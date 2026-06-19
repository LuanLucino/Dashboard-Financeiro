import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, addMonths, subMonths, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MesNavegador({ mes, onChange }) {
  const isAtual = isThisMonth(mes);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-sm)',
      padding: '4px 6px',
    }}>
      <button
        className="btn-icon btn-sm"
        onClick={() => onChange(subMonths(mes, 1))}
        title="Mês anterior"
        style={{ border: 'none', background: 'transparent' }}
      >
        <ChevronLeft size={15} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px', minWidth: 130, justifyContent: 'center' }}>
        <Calendar size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>
          {format(mes, 'MMMM yyyy', { locale: ptBR })}
        </span>
      </div>

      <button
        className="btn-icon btn-sm"
        onClick={() => onChange(addMonths(mes, 1))}
        title="Próximo mês"
        style={{ border: 'none', background: 'transparent' }}
      >
        <ChevronRight size={15} />
      </button>

      {!isAtual && (
        <button
          onClick={() => onChange(new Date())}
          style={{
            fontSize: 11, fontWeight: 600, padding: '3px 8px',
            borderRadius: 6, background: 'var(--primary-glow)',
            color: 'var(--primary)', border: '1px solid rgba(59,130,246,0.2)',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
          title="Voltar ao mês atual"
        >
          Hoje
        </button>
      )}
    </div>
  );
}
