import { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { initialCategorias, initialReceitas, initialDespesas, initialMetas, initialReserva, initialConfig } from '../data/initialData';
import { generateId } from '../utils/formatters';

const AppContext = createContext(null);

const defaultData = {
  receitas: initialReceitas,
  despesas: initialDespesas,
  categorias: initialCategorias,
  metas: initialMetas,
  reserva: initialReserva,
  config: initialConfig,
  notificacoes: [],
};

const initialState = {
  ...defaultData,
  activePage: 'dashboard',
  sidebarOpen: true,
  searchQuery: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_DATA':
      return { ...state, ...action.payload };
    case 'RESET_DATA':
      return { ...initialState };

    case 'SET_PAGE':
      return { ...state, activePage: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };

    case 'ADD_RECEITA':
      return { ...state, receitas: [...state.receitas, { ...action.payload, id: generateId() }] };
    case 'UPDATE_RECEITA':
      return { ...state, receitas: state.receitas.map(r => r.id === action.payload.id ? action.payload : r) };
    case 'DELETE_RECEITA':
      return { ...state, receitas: state.receitas.filter(r => r.id !== action.payload) };

    case 'ADD_DESPESA':
      return { ...state, despesas: [...state.despesas, { ...action.payload, id: generateId() }] };
    case 'UPDATE_DESPESA':
      return { ...state, despesas: state.despesas.map(d => d.id === action.payload.id ? action.payload : d) };
    case 'DELETE_DESPESA':
      return { ...state, despesas: state.despesas.filter(d => d.id !== action.payload) };
    case 'TOGGLE_PAGO':
      return {
        ...state,
        despesas: state.despesas.map(d =>
          d.id === action.payload
            ? { ...d, status: d.status === 'Pago' ? 'Não Pago' : 'Pago' }
            : d
        ),
      };

    case 'ADD_CATEGORIA':
      return { ...state, categorias: [...state.categorias, { ...action.payload, id: generateId() }] };
    case 'UPDATE_CATEGORIA':
      return { ...state, categorias: state.categorias.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CATEGORIA':
      return { ...state, categorias: state.categorias.filter(c => c.id !== action.payload) };

    case 'ADD_META':
      return { ...state, metas: [...state.metas, { ...action.payload, id: generateId() }] };
    case 'UPDATE_META':
      return { ...state, metas: state.metas.map(m => m.id === action.payload.id ? action.payload : m) };
    case 'DELETE_META':
      return { ...state, metas: state.metas.filter(m => m.id !== action.payload) };

    case 'ADD_RESERVA':
      return { ...state, reserva: [...state.reserva, { ...action.payload, id: generateId() }] };
    case 'UPDATE_RESERVA':
      return { ...state, reserva: state.reserva.map(r => r.id === action.payload.id ? action.payload : r) };
    case 'DELETE_RESERVA':
      return { ...state, reserva: state.reserva.filter(r => r.id !== action.payload) };

    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };

    case 'ADD_NOTIFICACAO':
      return { ...state, notificacoes: [action.payload, ...state.notificacoes].slice(0, 50) };
    case 'CLEAR_NOTIFICACOES':
      return { ...state, notificacoes: [] };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [dbLoading, setDbLoading] = useState(true);
  const userIdRef = useRef(null);
  const dataLoadedRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        userIdRef.current = user.uid;
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          dispatch({ type: 'LOAD_DATA', payload: docSnap.data() });
        } else {
          await setDoc(docRef, defaultData);
        }
        dataLoadedRef.current = true;
      } else {
        userIdRef.current = null;
        dataLoadedRef.current = false;
        dispatch({ type: 'RESET_DATA' });
      }
      setDbLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!dataLoadedRef.current || !userIdRef.current) return;
    const { activePage, sidebarOpen, searchQuery, ...data } = state;
    setDoc(doc(db, 'users', userIdRef.current), data, { merge: true });
  }, [state.receitas, state.despesas, state.categorias, state.metas, state.reserva, state.config, state.notificacoes]);

  const dedupReceitas = (lista) => {
    const seen = new Set();
    return lista.filter(r => {
      if (!r.originalId) return true;
      const key = `${r.originalId}_${r.data?.slice(0, 7)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const dedupDespesas = (lista) => {
    const seen = new Set();
    return lista.filter(d => {
      if (!d.originalId) return true;
      const key = `${d.originalId}_${d.vencimento?.slice(0, 7)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const getTotalReceitas = (filtro = 'mes') => {
    const now = new Date();
    return dedupReceitas(state.receitas)
      .filter(r => {
        if (filtro === 'mes') {
          const d = new Date(r.data);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        return true;
      })
      .filter(r => r.status === 'Recebido')
      .reduce((sum, r) => sum + r.valor, 0);
  };

  const getTotalDespesas = (filtro = 'mes') => {
    const now = new Date();
    return dedupDespesas(state.despesas)
      .filter(d => {
        if (filtro === 'mes') {
          const date = new Date(d.vencimento);
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }
        return true;
      })
      .filter(d => d.status === 'Pago')
      .reduce((sum, d) => sum + d.valor, 0);
  };

  const getSaldoAtual = () => {
    const receitas = dedupReceitas(state.receitas).filter(r => r.status === 'Recebido').reduce((s, r) => s + r.valor, 0);
    const despesas = dedupDespesas(state.despesas).filter(d => d.status === 'Pago').reduce((s, d) => s + d.valor, 0);
    return (state.config.saldoInicial || 0) + receitas - despesas;
  };

  const getPendentes = () => ({
    aReceber: dedupReceitas(state.receitas).filter(r => r.status === 'Pendente').reduce((s, r) => s + r.valor, 0),
    aPagar: dedupDespesas(state.despesas).filter(d => d.status === 'Não Pago').reduce((s, d) => s + d.valor, 0),
    vencidas: dedupDespesas(state.despesas).filter(d => d.status === 'Vencido').reduce((s, d) => s + d.valor, 0),
  });

  const getCategoriaById = (id) => state.categorias.find(c => c.id === id);

  return (
    <AppContext.Provider value={{ state, dispatch, dbLoading, getTotalReceitas, getTotalDespesas, getSaldoAtual, getPendentes, getCategoriaById }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
