import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, addWeeks, addMonths, addYears } from 'date-fns';

const proximaDataRecorrente = (dataBase, freq, mesAlvo) => {
  const base = parseISO(dataBase);
  const alvoStart = startOfMonth(mesAlvo);
  const alvoEnd = endOfMonth(mesAlvo);

  if (freq === 'mensal') {
    const candidata = new Date(mesAlvo.getFullYear(), mesAlvo.getMonth(), base.getDate());
    return isWithinInterval(candidata, { start: alvoStart, end: alvoEnd }) ? format(candidata, 'yyyy-MM-dd') : null;
  }

  if (freq === 'anual') {
    const candidata = new Date(mesAlvo.getFullYear(), base.getMonth(), base.getDate());
    return isWithinInterval(candidata, { start: alvoStart, end: alvoEnd }) ? format(candidata, 'yyyy-MM-dd') : null;
  }

  if (freq === 'quinzenal') {
    let current = base;
    while (current < alvoStart) current = addWeeks(current, 2);
    const ocorrencias = [];
    while (isWithinInterval(current, { start: alvoStart, end: alvoEnd })) {
      ocorrencias.push(format(current, 'yyyy-MM-dd'));
      current = addWeeks(current, 2);
    }
    return ocorrencias.length ? ocorrencias[0] : null;
  }

  if (freq === 'semanal') {
    let current = base;
    while (current < alvoStart) current = addWeeks(current, 1);
    return isWithinInterval(current, { start: alvoStart, end: alvoEnd }) ? format(current, 'yyyy-MM-dd') : null;
  }

  return null;
};

export const gerarProjecoesReceitas = (receitas, mesAlvo) => {
  const start = startOfMonth(mesAlvo);
  const end = endOfMonth(mesAlvo);

  return receitas
    .filter(r => r.recorrente && r.recorrenciaFreq)
    .flatMap(r => {
      // Já existe lançamento real neste mês para esta receita?
      const jaExisteReal = isWithinInterval(parseISO(r.data), { start, end });
      if (jaExisteReal) return [];

      // A origem da recorrência deve ser anterior ao mês alvo
      if (parseISO(r.data) >= start) return [];

      const dataProjetada = proximaDataRecorrente(r.data, r.recorrenciaFreq, mesAlvo);
      if (!dataProjetada) return [];

      return [{
        ...r,
        id: `proj_${r.id}_${format(mesAlvo, 'yyyy-MM')}`,
        data: dataProjetada,
        status: 'Pendente',
        projetado: true,
      }];
    });
};

export const gerarProjecoesDespesas = (despesas, mesAlvo) => {
  const start = startOfMonth(mesAlvo);
  const end = endOfMonth(mesAlvo);

  return despesas
    .filter(d => d.recorrente && d.recorrenciaFreq)
    .flatMap(d => {
      const jaExisteReal = isWithinInterval(parseISO(d.vencimento), { start, end });
      if (jaExisteReal) return [];

      if (parseISO(d.vencimento) >= start) return [];

      const dataProjetada = proximaDataRecorrente(d.vencimento, d.recorrenciaFreq, mesAlvo);
      if (!dataProjetada) return [];

      return [{
        ...d,
        id: `proj_${d.id}_${format(mesAlvo, 'yyyy-MM')}`,
        vencimento: dataProjetada,
        status: 'Não Pago',
        projetado: true,
      }];
    });
};
