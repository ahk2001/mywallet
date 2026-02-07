'use client'; // Necessário para Next.js App Router

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  LayoutDashboard, LogOut, Mic, Sparkles, CreditCard, 
  PieChart, Wallet, User, Loader2, X 
} from 'lucide-react';

// --- CONFIGURAÇÃO (COLOQUE SUAS CHAVES AQUI) ---
const SUPABASE_URL = "https://ovujisfkgipfmwzdkzif.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92dWppc2ZrZ2lwZm13emRremlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjI3NTgsImV4cCI6MjA4NjAzODc1OH0.TkQmAa4mumQWvKtl8MOdKcqHqnYOCJtN-x9bt4zbrYc";
const GEMINI_KEY = "AIzaSyAogdNRC9iWq9vbXwCB_EdXHZ72YPSVQQY";

// Inicialização dos Clientes
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

const CATEGORIES = [
  { id: 'alimentacao', name: 'Alimentação', color: 'bg-orange-500' },
  { id: 'transporte', name: 'Transporte', color: 'bg-blue-500' },
  { id: 'moradia', name: 'Moradia', color: 'bg-indigo-500' },
  { id: 'lazer', name: 'Lazer', color: 'bg-pink-500' },
  { id: 'saude', name: 'Saúde', color: 'bg-green-500' },
  { id: 'outros', name: 'Outros', color: 'bg-gray-500' },
];

export default function Home() {
  const [user, setUser] = useState('Duda & Você'); 
  const [view, setView] = useState('dashboard');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de IA e Input
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [parsedData, setParsedData] = useState(null);

  // --- 1. CARREGAR DADOS DO SUPABASE ---
  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('id', { ascending: false }); // Mais recentes primeiro
      
      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Erro ao buscar gastos:', error);
    } finally {
      setLoading(false);
    }
  }

  // --- 2. IA GEMINI (Texto/Áudio) ---
  const handleAnalyze = async () => {
    if (!inputText) return;
    setIsProcessing(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `
        Aja como um extrator de dados financeiros. 
        Categorias válidas: alimentacao, transporte, moradia, lazer, saude, outros.
        Texto do usuário: "${inputText}"
        Responda APENAS um JSON válido neste formato, sem markdown: 
        {"amount": number, "category": string, "description": string}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Limpeza de JSON
      const cleanJson = text.replace(/```json|```/g, '').trim();
      setParsedData(JSON.parse(cleanJson));
    } catch (err) {
      console.error("Erro IA:", err);
      alert("Erro ao processar com IA. Verifique a chave ou tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 3. SALVAR NO SUPABASE ---
  const confirmAddExpense = async () => {
    if (!parsedData) return;
    setIsProcessing(true); // Reutilizando loading state visual

    const newExpense = {
      description: parsedData.description,
      amount: parsedData.amount,
      category: parsedData.category,
      user_name: 'App', // Pode mudar para lógica de usuário depois
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const { error } = await supabase.from('expenses').insert([newExpense]);
      if (error) throw error;
      
      await fetchExpenses(); // Recarrega a lista
      setParsedData(null);
      setInputText('');
      setView('dashboard');
    } catch (error) {
      alert('Erro ao salvar no banco de dados.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- LÓGICA DE ÁUDIO SIMULADO ---
  useEffect(() => {
    let timeout;
    if (isRecording) {
      timeout = setTimeout(() => {
        setIsRecording(false);
        const exemplos = ["Jantar 180 reais", "Gasolina 250", "Farmácia 35 reais"];
        setInputText(exemplos[Math.floor(Math.random() * exemplos.length)]);
      }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [isRecording]);

  // Cálculos
  const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  // --- RENDERIZAÇÃO ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg"><Wallet className="w-5 h-5 text-white" /></div>
            <span className="font-bold text-xl tracking-tight text-slate-900">MyWallet</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-sm font-medium">
              <User className="w-4 h-4 text-slate-500" />
              {user}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Navegação */}
        <div className="flex p-1 bg-slate-200 rounded-xl w-full max-w-sm mx-auto">
          <button onClick={() => setView('dashboard')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${view === 'dashboard' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Dashboard</button>
          <button onClick={() => setView('add')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${view === 'add' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Novo Gasto</button>
        </div>

        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-600" /></div>
        ) : view === 'dashboard' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {/* Cards Dashboard */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><CreditCard /></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentMonth}</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">Saldo Utilizado</p>
              <h2 className="text-4xl font-black text-slate-900 mt-1">R$ {totalExpenses.toFixed(2)}</h2>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:col-span-2">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><PieChart className="w-5 h-5 text-indigo-500" /> Divisão por Categoria</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {CATEGORIES.map(cat => {
                  const catTotal = expenses.filter(e => e.category === cat.id).reduce((acc, curr) => acc + Number(curr.amount), 0);
                  if (catTotal === 0) return null;
                  const percent = (catTotal / totalExpenses) * 100;
                  return (
                    <div key={cat.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                        <span className="text-slate-400">{cat.name}</span>
                        <span className="text-slate-700">R$ {catTotal.toFixed(2)}</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lista */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm md:col-span-3 overflow-hidden">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100"><h3 className="font-bold text-slate-800">Transações Recentes</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4 font-bold text-slate-700">{expense.description}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-white ${CATEGORIES.find(c => c.id === expense.category)?.color}`}>
                            {CATEGORIES.find(c => c.id === expense.category)?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-900">R$ {Number(expense.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* View Adicionar Gasto */
          <div className="max-w-xl mx-auto animate-in zoom-in-95 duration-300">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <div className="text-center mb-8">
                <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3"><Sparkles className="w-8 h-8 text-indigo-600" /></div>
                <h2 className="text-2xl font-black text-slate-900">Novo Gasto</h2>
              </div>

              <div className="relative mb-6">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ex: 'Sushi ontem 120 reais'..."
                  className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl min-h-[160px] focus:border-indigo-500 focus:bg-white outline-none transition-all text-lg font-medium"
                />
                <button 
                  onClick={() => setIsRecording(!isRecording)} 
                  className={`absolute bottom-4 right-4 p-4 rounded-xl shadow-lg transition-all ${isRecording ? 'bg-red-500 text-white animate-bounce' : 'bg-white text-indigo-600 hover:scale-110'}`}
                >
                  <Mic className="w-6 h-6" />
                </button>
              </div>

              {!parsedData ? (
                <button 
                  onClick={handleAnalyze} 
                  disabled={!inputText || isProcessing} 
                  className="w-full py-4 text-lg bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : "Processar IA ✨"}
                </button>
              ) : (
                <div className="bg-indigo-50 p-6 rounded-2xl border-2 border-indigo-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Confirmação</span>
                    <button onClick={() => setParsedData(null)}><X className="w-5 h-5 text-slate-400" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Valor</p>
                      <p className="text-xl font-black">R$ {parsedData.amount}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Categoria</p>
                      <p className="text-sm font-black">{CATEGORIES.find(c => c.id === parsedData.category)?.name || parsedData.category}</p>
                    </div>
                  </div>
                  <button 
                    onClick={confirmAddExpense} 
                    className="w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700"
                  >
                    {isProcessing ? <Loader2 className="animate-spin mx-auto" /> : "Confirmar e Salvar"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
