import React, { useState, useMemo } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { Transaction } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface ExpensesProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

import { supabase } from '../src/supabaseClient';

const Expenses: React.FC<ExpensesProps> = ({ transactions, setTransactions }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isViewingAll, setIsViewingAll] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<Transaction['category']>('Outros');
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');
  const [activeMenuTransactionId, setActiveMenuTransactionId] = useState<number | null>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (activeMenuTransactionId !== null &&
        !target.closest('.transaction-menu-trigger') &&
        !target.closest('.transaction-menu-dropdown')) {
        setActiveMenuTransactionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuTransactionId]);

  const handleDeleteTransaction = async (id: number) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setTransactions(transactions.filter(t => t.id !== id));
      setActiveMenuTransactionId(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Erro ao excluir transação');
    }
  };

  // Calculations
  const { totalBalance, totalIncome, totalExpenses, categoryTotals, expenseRatio } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    const cats: Record<string, number> = {
      'Alimentação': 0, 'Transporte': 0, 'Moradia': 0, 'Lazer': 0, 'Saúde': 0, 'Educação': 0, 'Outros': 0
    };

    transactions.forEach(t => {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expenses += t.amount;
        if (cats[t.category] !== undefined) {
          cats[t.category] += t.amount;
        } else {
          cats['Outros'] += t.amount;
        }
      }
    });

    return {
      totalBalance: income - expenses,
      totalIncome: income,
      totalExpenses: expenses,
      categoryTotals: cats,
      expenseRatio: income > 0 ? (expenses / income) * 100 : 0
    };
  }, [transactions]);

  // Insights Logic
  const balanceInsight = totalBalance > 0 ? "+12% este mês" : "Atenção ao saldo";
  const incomeInsight = "+5% vs mês anterior"; // Mocked as we don't have historical data yet
  const expenseInsight = expenseRatio > 50
    ? `Consumiu ${expenseRatio.toFixed(0)}% da receita`
    : "-2% vs mês anterior";

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAmount || !newDate) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Usuário não autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          title: newTitle,
          amount: parseFloat(newAmount),
          type: newType,
          category: newType === 'income' ? 'Receita' : newCategory,
          date: newDate
        }])
        .select();

      if (error) throw error;

      if (data) {
        const newTransaction: Transaction = {
          id: data[0].id,
          title: data[0].title,
          amount: Number(data[0].amount),
          type: data[0].type as 'income' | 'expense',
          category: data[0].category as any,
          date: data[0].date
        };
        setTransactions([newTransaction, ...transactions]);
      }

      // Reset
      setNewTitle('');
      setNewAmount('');
      setNewDate('');
      setNewCategory('Outros');
      setNewType('expense');
      setIsAdding(false);

    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Erro ao salvar transação');
    }
  };

  const doughnutData = {
    labels: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Outros'],
    datasets: [
      {
        data: [
          categoryTotals['Alimentação'],
          categoryTotals['Transporte'],
          categoryTotals['Moradia'],
          categoryTotals['Lazer'],
          categoryTotals['Outros'] + categoryTotals['Saúde'] + categoryTotals['Educação']
        ],
        backgroundColor: ['#3B82F6', '#8B5CF6', '#22C55E', '#FBBF24', '#EF4444'],
        borderColor: '#27272A',
        borderWidth: 4,
        cutout: '75%',
      },
    ],
  };

  const barData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        label: 'Gasto por Categoria',
        data: Object.values(categoryTotals),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: '#3B82F6',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#3F3F46' }, ticks: { color: '#A1A1AA' } },
      x: { grid: { display: false }, ticks: { color: '#A1A1AA' } }
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Controle Financeiro</h1>
          <p className="text-subtext-dark">Gerencie seu saldo, receitas e despesas em um só lugar.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
          >
            <span className="material-icons-outlined text-xl">add</span>
            <span className="hidden sm:inline">Nova Transação</span>
          </button>
        </div>
      </header>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark flex flex-col justify-between relative overflow-hidden group hover:border-primary transition-colors">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-icons-outlined text-6xl text-white">account_balance</span>
          </div>
          <div>
            <p className="text-subtext-dark text-sm font-medium mb-1">Saldo Total</p>
            <h3 className="text-3xl font-bold text-white">R$ {totalBalance.toFixed(2)}</h3>
          </div>
          <div className={`mt-4 flex items-center text-sm font-medium w-fit px-2 py-1 rounded-lg ${totalBalance >= 0 ? 'text-chart-green bg-chart-green/10' : 'text-chart-red bg-chart-red/10'}`}>
            <span className="material-icons-outlined text-sm mr-1">{totalBalance >= 0 ? 'trending_up' : 'trending_down'}</span>
            <span>{balanceInsight}</span>
          </div>
        </div>

        <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark flex flex-col justify-between relative overflow-hidden group hover:border-accent2 transition-colors">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-icons-outlined text-6xl text-accent2">trending_up</span>
          </div>
          <div>
            <p className="text-subtext-dark text-sm font-medium mb-1">Receitas</p>
            <h3 className="text-3xl font-bold text-white">R$ {totalIncome.toFixed(2)}</h3>
          </div>
          <div className="mt-4 flex items-center text-accent2 text-sm font-medium bg-accent2/10 w-fit px-2 py-1 rounded-lg">
            <span className="material-icons-outlined text-sm mr-1">arrow_upward</span>
            <span>{incomeInsight}</span>
          </div>
        </div>

        <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark flex flex-col justify-between relative overflow-hidden group hover:border-chart-red transition-colors">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-icons-outlined text-6xl text-chart-red">trending_down</span>
          </div>
          <div>
            <p className="text-subtext-dark text-sm font-medium mb-1">Despesas</p>
            <h3 className="text-3xl font-bold text-white">R$ {totalExpenses.toFixed(2)}</h3>
          </div>
          <div className={`mt-4 flex items-center text-sm font-medium w-fit px-2 py-1 rounded-lg ${expenseRatio > 50 ? 'text-chart-yellow bg-chart-yellow/10' : 'text-chart-red bg-chart-red/10'}`}>
            <span className="material-icons-outlined text-sm mr-1">{expenseRatio > 50 ? 'warning' : 'arrow_downward'}</span>
            <span>{expenseInsight}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Overview Card */}
        <div className="lg:col-span-1 bg-surface-dark p-6 rounded-2xl flex flex-col border border-border-dark">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-xl text-text-dark">Distribuição</h3>
          </div>

          <div className="flex justify-center my-6 relative h-56">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm text-subtext-dark">Total Gasto</span>
              <span className="text-2xl font-bold text-text-dark">R${totalExpenses.toFixed(0)}</span>
            </div>
          </div>

          <div className="space-y-3 mt-2">
            {[
              { name: "Alimentação", val: categoryTotals['Alimentação'], color: "bg-chart-blue" },
              { name: "Transporte", val: categoryTotals['Transporte'], color: "bg-chart-purple" },
              { name: "Moradia", val: categoryTotals['Moradia'], color: "bg-chart-green" },
              { name: "Lazer", val: categoryTotals['Lazer'], color: "bg-chart-yellow" },
              { name: "Outros", val: categoryTotals['Outros'] + categoryTotals['Saúde'] + categoryTotals['Educação'], color: "bg-chart-red" }
            ].map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full ${cat.color} mr-2`}></span>
                  <span className="text-subtext-dark">{cat.name}</span>
                </div>
                <span className="font-semibold text-text-dark">R$ {cat.val.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-surface-dark p-6 rounded-2xl border border-border-dark">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl text-text-dark">Transações Recentes</h3>
            <button onClick={() => setIsViewingAll(true)} className="text-sm bg-accent1/20 text-accent1 hover:bg-accent1/30 px-4 py-2 rounded-full font-semibold transition-colors">Ver Tudo</button>
          </div>
          <div className="space-y-4">
            {transactions.slice(0, 4).map((item) => (
              <div key={item.id} className="group flex items-center justify-between p-4 rounded-xl bg-background-dark hover:bg-background-dark/80 transition-colors cursor-pointer relative">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-xl ${item.type === 'income' ? 'bg-accent2/20' : 'bg-chart-blue/20'} flex items-center justify-center mr-4`}>
                    <span className={`material-icons-outlined ${item.type === 'income' ? 'text-accent2' : 'text-chart-blue'}`}>
                      {item.type === 'income' ? 'arrow_upward' : 'shopping_bag'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-text-dark">{item.title}</p>
                    <p className="text-sm text-subtext-dark">{item.date} • {item.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`font-bold ${item.type === 'income' ? 'text-accent2' : 'text-text-dark'}`}>
                    {item.type === 'income' ? '+' : '-'} R$ {item.amount.toFixed(2)}
                  </p>
                  <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuTransactionId(activeMenuTransactionId === item.id ? null : item.id);
                      }}
                      className="transaction-menu-trigger text-subtext-dark hover:text-text-dark transition-colors p-1 rounded-full hover:bg-surface-dark"
                    >
                      <span className="material-icons-outlined text-xl">more_vert</span>
                    </button>

                    {activeMenuTransactionId === item.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-surface-dark border border-border-dark rounded-xl shadow-xl z-10 overflow-hidden animate-fade-in transaction-menu-dropdown">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTransaction(item.id);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-chart-red hover:bg-chart-red/10 flex items-center gap-2 transition-colors"
                        >
                          <span className="material-icons-outlined text-lg">delete</span>
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spending by Category Bar Chart */}
        <div className="lg:col-span-3 bg-surface-dark p-6 rounded-2xl border border-border-dark">
          <h3 className="font-bold text-xl text-text-dark mb-6">Gastos por Categoria</h3>
          <div className="h-64">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <form onSubmit={handleAddTransaction} className="bg-surface-dark w-full max-w-md rounded-2xl border border-border-dark shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border-dark flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-dark">Nova Transação</h3>
              <button type="button" onClick={() => setIsAdding(false)} className="text-subtext-dark hover:text-text-dark">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex space-x-4 mb-4">
                <button
                  type="button"
                  onClick={() => setNewType('expense')}
                  className={`flex-1 py-2 rounded-xl font-bold transition-colors ${newType === 'expense' ? 'bg-chart-red text-white' : 'bg-background-dark text-subtext-dark'}`}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('income')}
                  className={`flex-1 py-2 rounded-xl font-bold transition-colors ${newType === 'income' ? 'bg-accent2 text-white' : 'bg-background-dark text-subtext-dark'}`}
                >
                  Receita
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-subtext-dark uppercase mb-1">Descrição</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Ex: Supermercado"
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-text-dark outline-none focus:border-primary transition-colors"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-subtext-dark uppercase mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-text-dark outline-none focus:border-primary transition-colors"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-subtext-dark uppercase mb-1">Data</label>
                  <input
                    type="date"
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-text-dark outline-none focus:border-primary transition-colors"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
              </div>

              {newType === 'expense' && (
                <div>
                  <label className="block text-xs font-bold text-subtext-dark uppercase mb-2">Categoria</label>
                  <div className="flex flex-wrap gap-2">
                    {(['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Outros'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${newCategory === cat
                          ? 'bg-primary border-primary text-white'
                          : 'bg-background-dark border-border-dark text-subtext-dark hover:border-gray-500'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border-dark bg-background-dark/50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm font-medium text-subtext-dark hover:text-text-dark transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Adicionar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View All Modal */}
      {isViewingAll && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-dark w-full max-w-4xl h-[80vh] rounded-2xl border border-border-dark shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border-dark flex justify-between items-center">
              <h3 className="text-xl font-bold text-text-dark">Todas as Transações</h3>
              <button type="button" onClick={() => setIsViewingAll(false)} className="text-subtext-dark hover:text-text-dark">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-2">
              {transactions.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-border-dark/50">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-xl ${item.type === 'income' ? 'bg-accent2/20' : 'bg-chart-blue/20'} flex items-center justify-center mr-4`}>
                      <span className={`material-icons-outlined ${item.type === 'income' ? 'text-accent2' : 'text-chart-blue'}`}>
                        {item.type === 'income' ? 'arrow_upward' : 'shopping_bag'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">{item.title}</p>
                      <p className="text-sm text-subtext-dark">{item.date} • {item.category}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${item.type === 'income' ? 'text-accent2' : 'text-text-dark'}`}>
                    {item.type === 'income' ? '+' : '-'} R$ {item.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;