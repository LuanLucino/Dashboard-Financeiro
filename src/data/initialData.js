export const initialCategorias = [
  { id: 'c1', nome: 'Salário', tipo: 'receita', cor: '#10b981', icone: 'DollarSign' },
  { id: 'c2', nome: 'Freelance', tipo: 'receita', cor: '#3b82f6', icone: 'Briefcase' },
  { id: 'c3', nome: 'Investimentos', tipo: 'receita', cor: '#8b5cf6', icone: 'TrendingUp' },
  { id: 'c4', nome: 'Vendas', tipo: 'receita', cor: '#f59e0b', icone: 'ShoppingBag' },
  { id: 'c5', nome: 'Aluguel', tipo: 'despesa', cor: '#ef4444', icone: 'Home' },
  { id: 'c6', nome: 'Energia', tipo: 'despesa', cor: '#f97316', icone: 'Zap' },
  { id: 'c7', nome: 'Internet', tipo: 'despesa', cor: '#06b6d4', icone: 'Wifi' },
  { id: 'c8', nome: 'Marketing', tipo: 'despesa', cor: '#ec4899', icone: 'Megaphone' },
  { id: 'c9', nome: 'Impostos', tipo: 'despesa', cor: '#dc2626', icone: 'FileText' },
  { id: 'c10', nome: 'Ferramentas', tipo: 'despesa', cor: '#64748b', icone: 'Wrench' },
  { id: 'c11', nome: 'Alimentação', tipo: 'despesa', cor: '#84cc16', icone: 'Coffee' },
  { id: 'c12', nome: 'Transporte', tipo: 'despesa', cor: '#a78bfa', icone: 'Car' },
];

export const initialReceitas = [];
export const initialDespesas = [];
export const initialMetas = [];
export const initialReserva = [];

export const initialConfig = {
  empresa: 'Minha Empresa',
  moeda: 'BRL',
  saldoInicial: 0,
  notificacoesAtivas: true,
  backupAuto: true,
};

export const DATA_VERSION = 'v2';
