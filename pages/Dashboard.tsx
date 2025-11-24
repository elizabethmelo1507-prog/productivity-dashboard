import React, { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import GridLayout, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';

const ResponsiveGridLayout = WidthProvider(GridLayout);

interface ProductivityData {
  name: string;
  value: number; // Represents completed tasks
  active?: boolean;
}

type ChartView = 'today' | 'week' | 'month';

// Mock Data for different views
const mockChartData: Record<ChartView, ProductivityData[]> = {
  today: [
    { name: '08h', value: 2 },
    { name: '10h', value: 4 },
    { name: '12h', value: 1 },
    { name: '14h', value: 5 },
    { name: '16h', value: 3, active: true }, // Current approximate time
    { name: '18h', value: 0 },
  ],
  week: [
    { name: 'Dom', value: 2 },
    { name: 'Seg', value: 8 },
    { name: 'Ter', value: 12 },
    { name: 'Qua', value: 7, active: true }, // Current day
    { name: 'Qui', value: 0 },
    { name: 'Sex', value: 0 },
    { name: 'Sáb', value: 0 },
  ],
  month: [
    { name: 'Sem 1', value: 32 },
    { name: 'Sem 2', value: 45 },
    { name: 'Sem 3', value: 28, active: true }, // Current week
    { name: 'Sem 4', value: 0 },
  ]
};

// Dados financeiros mockados para contexto da IA (espelhando Expenses.tsx)
const financialContext = {
  saldoTotal: "R$ 12.450,00",
  receitas: "R$ 15.900,00",
  despesas: "R$ 3.450,00",
  distribuicaoGastos: {
    alimentacao: "R$ 850,00",
    transporte: "R$ 420,00",
    moradia: "R$ 1.500,00",
    lazer: "R$ 380,00",
    outros: "R$ 300,00"
  },
  ultimasTransacoes: [
    { local: "Restaurante Sabor Divino", valor: "R$ 75,50", data: "20 Maio" },
    { local: "Recarga Bilhete Único", valor: "R$ 50,00", data: "19 Maio" },
    { local: "Salário", valor: "R$ 5.200,00", data: "18 Maio" }
  ]
};

import { Task, Transaction } from '../types';

interface DashboardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  transactions: Transaction[];
  events: any[]; // Events from Supabase
}

interface Message {
  id: number;
  role: 'user' | 'ai';
  text: string;
}

interface NotificationItem {
  id: string;
  type: 'urgent' | 'finance' | 'event' | 'info';
  title: string;
  description: string;
  time: string;
  icon: string;
  color: string;
  bgColor: string;
  path: string;
}

import { NotificationContext } from '../App';
import { supabase } from '../src/supabaseClient';
import { savePomodoro } from '../src/api/pomodoro';
import { updateProfile } from '../src/api/profile';

const Dashboard: React.FC<DashboardProps> = ({ tasks, setTasks, transactions, events }) => {
  const navigate = useNavigate();
  const { notifications, hasUnread, markAllRead } = React.useContext(NotificationContext);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Widget preferences
  const defaultWidgets = {
    urgentBanner: true,
    productivityChart: true,
    tasksToday: true,
    agenda: true,
    aiAssistant: true,
    financialSummary: true,
    motivationalQuote: true,
    quickStats: true,
    dailyGoal: false,
    pomodoroTimer: false,
    streak: true,
    weeklyProgress: true,
    weather: true,
    quickNotes: false,
    achievements: true,
  };

  const [enabledWidgets, setEnabledWidgets] = useState(() => {
    const saved = localStorage.getItem('enabledWidgets');
    return saved ? JSON.parse(saved) : defaultWidgets;
  });

  // Widget order state
  const defaultOrder = [
    'urgentBanner', 'productivityChart', 'tasksToday', 'agenda', 'aiAssistant',
    'financialSummary', 'motivationalQuote', 'quickStats', 'dailyGoal',
    'pomodoroTimer', 'streak', 'weeklyProgress', 'weather', 'quickNotes', 'achievements'
  ];

  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('widgetOrder');
    return saved ? JSON.parse(saved) : defaultOrder;
  });

  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOverWidget, setDragOverWidget] = useState<string | null>(null);

  // Grid Layout state - defines position and size of each widget
  const defaultLayout = [
    { i: 'urgentBanner', x: 0, y: 0, w: 12, h: 2 },
    { i: 'productivityChart', x: 0, y: 2, w: 6, h: 4 },
    { i: 'tasksToday', x: 6, y: 2, w: 6, h: 4 },
    { i: 'agenda', x: 0, y: 6, w: 6, h: 4 },
    { i: 'aiAssistant', x: 6, y: 6, w: 6, h: 4 },
    { i: 'financialSummary', x: 0, y: 10, w: 6, h: 3 },
    { i: 'motivationalQuote', x: 6, y: 10, w: 6, h: 3 },
    { i: 'quickStats', x: 0, y: 13, w: 6, h: 4 },
    { i: 'dailyGoal', x: 6, y: 13, w: 6, h: 3 },
    { i: 'pomodoroTimer', x: 0, y: 17, w: 6, h: 3 },
    { i: 'streak', x: 6, y: 17, w: 3, h: 3 },
    { i: 'weeklyProgress', x: 9, y: 17, w: 3, h: 4 },
    { i: 'weather', x: 0, y: 20, w: 3, h: 3 },
    { i: 'quickNotes', x: 3, y: 20, w: 6, h: 3 },
    { i: 'achievements', x: 9, y: 20, w: 3, h: 4 },
  ];

  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem('widgetLayout');
    if (saved) {
      const parsedSaved = JSON.parse(saved);
      // Merge saved layout with default layout to ensure all widgets have a position
      // This fixes the issue where new widgets wouldn't appear if a layout was already saved
      const mergedLayout = defaultLayout.map(defaultItem => {
        const savedItem = parsedSaved.find((p: any) => p.i === defaultItem.i);
        return savedItem || defaultItem;
      });
      return mergedLayout;
    }
    return defaultLayout;
  });

  // Save layout when it changes
  const onLayoutChange = async (newLayout: any) => {
    setLayout(newLayout);
    localStorage.setItem('widgetLayout', JSON.stringify(newLayout));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await updateProfile(user.id, { dashboard_layout: newLayout });
      }
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  };

  // Listen for changes in widget preferences
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('enabledWidgets');
      if (saved) {
        setEnabledWidgets(JSON.parse(saved));
      }
      const savedOrder = localStorage.getItem('widgetOrder');
      if (savedOrder) {
        setWidgetOrder(JSON.parse(savedOrder));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also check on focus in case settings changed in same tab
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  // States
  // Tasks are now passed via props
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  // Chart State
  const [chartView, setChartView] = useState<ChartView>('week');

  // Calculate Chart Data dynamically
  const chartData = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Helper to parse date correctly (handling timezone issues)
    const getTaskDate = (task: Task) => {
      // Prefer created_at for accurate timestamp, fallback to date string
      if (task.created_at) return new Date(task.created_at);
      if (task.date) {
        // Parse YYYY-MM-DD manually to avoid timezone shifts
        const [year, month, day] = task.date.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      return new Date(); // Fallback to now
    };

    // Filter completed tasks
    const completedTasks = tasks.filter(t => t.completed);

    // 1. Today View (Hourly)
    const todayData: ProductivityData[] = [
      { name: '08h', value: 0 }, { name: '10h', value: 0 },
      { name: '12h', value: 0 }, { name: '14h', value: 0 },
      { name: '16h', value: 0 }, { name: '18h', value: 0 }
    ];

    completedTasks.forEach(task => {
      const date = getTaskDate(task);
      if (date.toDateString() === now.toDateString()) {
        const hour = date.getHours();
        if (hour < 9) todayData[0].value++;
        else if (hour < 11) todayData[1].value++;
        else if (hour < 13) todayData[2].value++;
        else if (hour < 15) todayData[3].value++;
        else if (hour < 17) todayData[4].value++;
        else todayData[5].value++;
      }
    });

    // Mark current time slot as active
    const currentHour = now.getHours();
    if (currentHour < 9) todayData[0].active = true;
    else if (currentHour < 11) todayData[1].active = true;
    else if (currentHour < 13) todayData[2].active = true;
    else if (currentHour < 15) todayData[3].active = true;
    else if (currentHour < 17) todayData[4].active = true;
    else todayData[5].active = true;


    // 2. Week View (Daily)
    const weekData: ProductivityData[] = [
      { name: 'Dom', value: 0 }, { name: 'Seg', value: 0 },
      { name: 'Ter', value: 0 }, { name: 'Qua', value: 0 },
      { name: 'Qui', value: 0 }, { name: 'Sex', value: 0 },
      { name: 'Sáb', value: 0 }
    ];

    // Get start of week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    completedTasks.forEach(task => {
      const date = getTaskDate(task);
      // Reset time for comparison
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (dateOnly >= startOfWeek && dateOnly <= endOfWeek) {
        weekData[date.getDay()].value++;
      }
    });

    // Mark current day as active
    weekData[now.getDay()].active = true;


    // 3. Month View (Weekly)
    const monthData: ProductivityData[] = [
      { name: 'Sem 1', value: 0 }, { name: 'Sem 2', value: 0 },
      { name: 'Sem 3', value: 0 }, { name: 'Sem 4', value: 0 }
    ];

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    completedTasks.forEach(task => {
      const date = getTaskDate(task);
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (dateOnly >= startOfMonth && dateOnly <= endOfMonth) {
        const dayOfMonth = date.getDate();
        if (dayOfMonth <= 7) monthData[0].value++;
        else if (dayOfMonth <= 14) monthData[1].value++;
        else if (dayOfMonth <= 21) monthData[2].value++;
        else monthData[3].value++;
      }
    });

    // Mark current week as active
    const currentDayOfMonth = now.getDate();
    if (currentDayOfMonth <= 7) monthData[0].active = true;
    else if (currentDayOfMonth <= 14) monthData[1].active = true;
    else if (currentDayOfMonth <= 21) monthData[2].active = true;
    else monthData[3].active = true;

    return {
      today: todayData,
      week: weekData,
      month: monthData
    };
  }, [tasks]);

  const [chatMessages, setChatMessages] = useState<Message[]>(() => {
    const userName = localStorage.getItem('userName') || 'Usuário';
    return [
      { id: 1, role: 'ai', text: `Olá, ${userName}. Tenho acesso à sua agenda, tarefas e finanças. Como posso ajudar você hoje?` }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Update AI greeting when name changes
  useEffect(() => {
    const handleStorageChange = () => {
      const userName = localStorage.getItem('userName') || 'Usuário';
      setChatMessages(prev => {
        // Only update the first welcome message if it exists and hasn't been modified
        if (prev.length > 0 && prev[0].id === 1) {
          const newMessages = [...prev];
          newMessages[0] = { ...newMessages[0], text: `Olá, ${userName}. Tenho acesso à sua agenda, tarefas e finanças. Como posso ajudar você hoje?` };
          return newMessages;
        }
        return prev;
      });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Daily Goal State
  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = localStorage.getItem('dailyGoal');
    return saved || '';
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(dailyGoal);

  // Motivational quotes
  const quotes = [
    { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
    { text: "A disciplina é a ponte entre metas e conquistas.", author: "Jim Rohn" },
    { text: "Não espere por oportunidades. Crie-as.", author: "Desconhecido" },
    { text: "O único modo de fazer um ótimo trabalho é amar o que você faz.", author: "Steve Jobs" },
    { text: "Acredite que você pode e você já está no meio do caminho.", author: "Theodore Roosevelt" },
    { text: "O futuro pertence àqueles que acreditam na beleza de seus sonhos.", author: "Eleanor Roosevelt" },
  ];

  const [dailyQuote] = useState(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('quoteDate');
    const savedQuote = localStorage.getItem('dailyQuote');

    if (savedDate === today && savedQuote) {
      return JSON.parse(savedQuote);
    }

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    localStorage.setItem('quoteDate', today);
    localStorage.setItem('dailyQuote', JSON.stringify(randomQuote));
    return randomQuote;
  });

  // Pomodoro Timer State
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes in seconds
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  const [pomodoroStartTime, setPomodoroStartTime] = useState<number | null>(null);

  // Function to save Pomodoro session
  const savePomodoroSession = async (duration: number, completed: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await savePomodoro({
          user_id: user.id,
          duration,
          completed,
        });
      }
    } catch (error) {
      console.error('Error saving pomodoro session:', error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPomodoroRunning && pomodoroTime > 0) {
      // Set start time when timer starts
      if (pomodoroStartTime === null) {
        setPomodoroStartTime(Date.now());
      }
      interval = setInterval(() => {
        setPomodoroTime(prev => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      setIsPomodoroRunning(false);

      // Calculate actual duration worked (in minutes)
      const durationMinutes = pomodoroMode === 'work' ? 25 : 5;

      // Save completed session
      if (pomodoroMode === 'work') {
        savePomodoroSession(durationMinutes, true);
      }

      // Reset start time
      setPomodoroStartTime(null);

      // Auto-switch modes
      if (pomodoroMode === 'work') {
        setPomodoroMode('break');
        setPomodoroTime(5 * 60); // 5 min break
      } else {
        setPomodoroMode('work');
        setPomodoroTime(25 * 60); // 25 min work
      }
    }
    return () => clearInterval(interval);
  }, [isPomodoroRunning, pomodoroTime, pomodoroMode, pomodoroStartTime]);

  // Streak State
  const [currentStreak, setCurrentStreak] = useState(() => {
    const saved = localStorage.getItem('streak');
    return saved ? JSON.parse(saved) : { count: 0, lastDate: null };
  });

  useEffect(() => {
    // Check if user completed tasks today
    const today = new Date().toDateString();
    const completedToday = tasks.some(t => t.completed && new Date(t.date || '').toDateString() === today);

    if (completedToday && currentStreak.lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = currentStreak.lastDate === yesterday.toDateString();

      const newStreak = {
        count: wasYesterday ? currentStreak.count + 1 : 1,
        lastDate: today
      };
      setCurrentStreak(newStreak);
      localStorage.setItem('streak', JSON.stringify(newStreak));
    }
  }, [tasks]);

  // Quick Notes State
  const [quickNote, setQuickNote] = useState(() => {
    return localStorage.getItem('quickNote') || '';
  });

  // Weather State (real data fetched from OpenWeatherMap)
  const [weather, setWeather] = useState({
    temp: 0,
    condition: '',
    location: localStorage.getItem('userLocation') || 'São Paulo, SP',
    icon: 'wb_sunny', // default icon
    time: ''
  });

  // Fetch weather when location changes
  useEffect(() => {
    const fetchWeather = async () => {
      const loc = weather.location;
      if (!loc) return;
      try {
        const apiKey = 'YOUR_OPENWEATHERMAP_API_KEY';
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(loc)}&units=metric&appid=${apiKey}&lang=pt_br`
        );
        if (!response.ok) throw new Error('Failed to fetch weather');
        const data = await response.json();
        const condition = data.weather[0].description;
        const iconCode = data.weather[0].icon;
        const iconMap: { [key: string]: string } = {
          '01d': 'wb_sunny',
          '01n': 'nightlight_round',
          '02d': 'partly_cloudy_day',
          '02n': 'partly_cloudy_night',
          '03d': 'cloud',
          '03n': 'cloud',
          '04d': 'cloud',
          '04n': 'cloud',
          '09d': 'grain',
          '09n': 'grain',
          '10d': 'rainy',
          '10n': 'rainy',
          '11d': 'thunderstorm',
          '11n': 'thunderstorm',
          '13d': 'snowing',
          '13n': 'snowing',
          '50d': 'mist',
          '50n': 'mist'
        };
        const icon = iconMap[iconCode] || 'wb_sunny';
        const now = new Date();
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        setWeather({
          temp: Math.round(data.main.temp),
          condition,
          location: loc,
          icon,
          time: timeStr
        });
      } catch (err) {
        console.error('Weather fetch error:', err);
      }
    };
    fetchWeather();
  }, [weather.location]);

  // Achievements
  // Load events from localStorage

  const achievements = [
    { id: 1, name: 'Primeira Tarefa', description: 'Complete sua primeira tarefa', icon: 'check_circle', unlocked: tasks.some(t => t.completed), color: 'text-chart-green' },
    { id: 2, name: 'Produtivo', description: 'Complete 10 tarefas', icon: 'workspace_premium', unlocked: tasks.filter(t => t.completed).length >= 10, color: 'text-accent1' },
    { id: 3, name: 'Sequência de 7', description: 'Mantenha 7 dias de sequência', icon: 'local_fire_department', unlocked: currentStreak.count >= 7, color: 'text-primary' },
    { id: 4, name: 'Organizado', description: 'Adicione 5 eventos ao calendário', icon: 'event_available', unlocked: events.length >= 5, color: 'text-accent2' },
    { id: 5, name: 'Financeiro', description: 'Registre 20 transações', icon: 'account_balance', unlocked: transactions.length >= 20, color: 'text-chart-green' },
    { id: 6, name: 'Mestre do Foco', description: 'Complete 10 sessões Pomodoro', icon: 'timer', unlocked: false, color: 'text-chart-red' },
  ];

  // --- Effects ---

  // Generate dynamic notifications based on app state


  // Handle click outside notification dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotificationsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef]);

  // Handlers

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', widgetId);
    // Add a slight opacity to the dragged element
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedWidget(null);
    setDragOverWidget(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (widgetId: string) => {
    setDragOverWidget(widgetId);
  };

  const handleDrop = async (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();

    if (!draggedWidget || draggedWidget === targetWidgetId) return;

    const newOrder = [...widgetOrder];
    const draggedIndex = newOrder.indexOf(draggedWidget);
    const targetIndex = newOrder.indexOf(targetWidgetId);

    // Remove dragged item and insert at new position
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedWidget);

    setWidgetOrder(newOrder);
    localStorage.setItem('widgetOrder', JSON.stringify(newOrder));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await updateProfile(user.id, { widgets_order: newOrder });
      }
    } catch (error) {
      console.error('Error saving widget order:', error);
    }
    setDraggedWidget(null);
    setDragOverWidget(null);
  };

  const toggleTask = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newCompleted = !task.completed;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: newCompleted })
        .eq('id', id);

      if (error) throw error;
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) {
      setIsAddingTask(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Usuário não autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          user_id: user.id,
          title: newTaskText,
          subtitle: 'Adicionado via Dashboard',
          urgent: false,
          tag: "Geral",
          tag_color: "bg-gray-500/20 text-gray-400",
          completed: false
        }])
        .select();

      if (error) throw error;

      if (data) {
        const newTask: Task = {
          id: data[0].id,
          title: data[0].title,
          subtitle: data[0].subtitle,
          urgent: data[0].urgent,
          tag: data[0].tag,
          tagColor: data[0].tag_color,
          completed: data[0].completed
        };
        setTasks([newTask, ...tasks]);
      }
      setNewTaskText('');
      setIsAddingTask(false);
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Erro ao adicionar tarefa');
    }
  };

  const toggleNotifications = () => {
    setShowNotificationsDropdown(!showNotificationsDropdown);
    if (hasUnread) markAllRead();
  };

  const handleNotificationClick = (path: string) => {
    setShowNotificationsDropdown(false);
    navigate(path);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    const userMsg: Message = { id: Date.now(), role: 'user', text: userText };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAiTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Coletando contexto atualizado
      // Use real events from Supabase
      const allEvents = events.map(e => {
        const eventDate = new Date(e.date);
        const dayName = eventDate.toLocaleDateString('pt-BR', { weekday: 'short' });
        const dayNumber = eventDate.getDate();
        return `${dayName} ${dayNumber}: ${e.title} às ${e.time}`;
      }).join('; ');

      // Calculate detailed financial context
      const receitas = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const despesas = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const saldoTotal = receitas - despesas;

      // Group expenses by category with percentage
      const expensesByCategory = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

      const expenseAnalysis = Object.entries(expensesByCategory).map(([cat, amount]) => ({
        categoria: cat,
        valor: `R$ ${(amount as number).toFixed(2)}`,
        porcentagem: `${(((amount as number) / despesas) * 100).toFixed(1)}%`
      }));

      const financialContext = {
        resumo: {
          saldoTotal: `R$ ${saldoTotal.toFixed(2)}`,
          totalReceitas: `R$ ${receitas.toFixed(2)}`,
          totalDespesas: `R$ ${despesas.toFixed(2)}`,
          status: saldoTotal >= 0 ? 'Positivo' : 'Negativo (Atenção)'
        },
        analiseGastos: expenseAnalysis,
        historicoTransacoes: transactions.slice(0, 10).map(t => ({
          data: t.date,
          descricao: t.title,
          valor: `R$ ${t.amount.toFixed(2)}`,
          tipo: t.type === 'income' ? 'Receita' : 'Despesa',
          categoria: t.category
        }))
      };

      const contextData = {
        tarefas: tasks.map(t => ({
          id: t.id,
          titulo: t.title,
          status: t.completed ? 'Concluída' : 'Pendente',
          urgencia: t.urgent ? 'Alta' : 'Normal',
          categoria: t.tag,
          vencimento: t.date ? `${t.date} às ${t.time}` : 'Sem data'
        })),
        agenda: events.map(e => {
          const eventDate = new Date(e.date);
          return {
            data: eventDate.toLocaleDateString('pt-BR'),
            evento: e.title,
            horario: e.time
          };
        }),
        financeiro: financialContext,
        dataAtual: new Date().toLocaleDateString('pt-BR'),
        horaAtual: new Date().toLocaleTimeString('pt-BR')
      };

      const systemPrompt = `
        Você é um assistente de produtividade pessoal altamente inteligente integrado a um dashboard.
        
        SEU CONTEXTO ATUAL (Dados Reais do Usuário):
        ${JSON.stringify(contextData, null, 2)}

        SUAS CAPACIDADES:
        1. Analisar finanças: Você vê o saldo exato, receitas, despesas e histórico de transações. Pode dar conselhos sobre onde economizar.
        2. Gerenciar tarefas: Você sabe o que está pendente, o que é urgente e os prazos. Ajude a priorizar.
        3. Organizar agenda: Você vê os próximos eventos.
        
        DIRETRIZES DE RESPOSTA:
        - Seja direto, conciso e útil.
        - Use os dados fornecidos para dar respostas personalizadas (ex: "Vi que você gastou muito com Lazer este mês...").
        - Se o usuário perguntar sobre saldo, gastos ou tarefas, use os números exatos do contexto.
        - Mantenha um tom profissional mas amigável e motivador.
        - Responda sempre em Português do Brasil.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\nUsuário: ' + userText }] }
        ]
      });

      const aiResponseText = response.text || "Desculpe, não consegui processar sua solicitação no momento.";

      const aiMsg: Message = { id: Date.now() + 1, role: 'ai', text: aiResponseText };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Erro na IA:", error);
      const errorMsg: Message = { id: Date.now() + 1, role: 'ai', text: "Tive um problema de conexão. Poderia repetir?" };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const cycleChartView = () => {
    const views: ChartView[] = ['today', 'week', 'month'];
    const currentIndex = views.indexOf(chartView);
    const nextIndex = (currentIndex + 1) % views.length;
    setChartView(views[nextIndex]);
  };

  const getChartViewLabel = () => {
    switch (chartView) {
      case 'today': return 'Hoje';
      case 'week': return 'Semana';
      case 'month': return 'Mês';
      default: return 'Hoje';
    }
  };

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 z-30 relative">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-dark">Painel</h1>
          <p className="text-subtext-dark text-sm md:text-base">Bem-vinda de volta, vamos produzir!</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="w-12 h-12 hidden md:flex items-center justify-center rounded-full bg-surface-dark border border-border-dark text-text-dark hover:bg-gray-700 transition-colors">
            <span className="material-icons-outlined">search</span>
          </button>

          {/* Notification Button & Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={toggleNotifications}
              className={`w-12 h-12 flex items-center justify-center rounded-full border text-text-dark transition-all ${showNotificationsDropdown ? 'bg-primary text-white border-primary' : 'bg-surface-dark border-border-dark hover:bg-gray-700'}`}
            >
              <span className="material-icons-outlined">notifications</span>
              {hasUnread && !showNotificationsDropdown && (
                <span className="absolute top-3 right-3 block h-2.5 w-2.5 rounded-full bg-primary border-2 border-background-dark animate-pulse"></span>
              )}
            </button>

            {/* Dropdown Panel */}
            {showNotificationsDropdown && (
              <div className="absolute right-0 top-full mt-4 w-80 sm:w-96 bg-surface-dark/95 backdrop-blur-xl border border-border-dark rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-border-dark flex items-center justify-between bg-surface-dark">
                  <h3 className="font-bold text-text-dark">Notificações</h3>
                  <button className="text-xs text-primary font-semibold hover:text-primary/80">Marcar lidas</button>
                </div>
                <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-subtext-dark">
                      <span className="material-icons-outlined text-4xl mb-2 opacity-50">notifications_off</span>
                      <p className="text-sm">Nenhuma notificação nova.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.path)}
                        className="flex items-start p-4 border-b border-border-dark/50 hover:bg-background-dark/50 transition-colors cursor-pointer group"
                      >
                        <div className={`w-10 h-10 rounded-full ${notif.bgColor} flex items-center justify-center flex-shrink-0 mt-1`}>
                          <span className={`material-icons-outlined text-lg ${notif.color}`}>{notif.icon}</span>
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm font-bold ${notif.type === 'urgent' ? 'text-chart-red' : 'text-text-dark'}`}>
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-subtext-dark">{notif.time}</span>
                          </div>
                          <p className="text-sm text-subtext-dark leading-snug group-hover:text-text-dark transition-colors">
                            {notif.description}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 bg-background-dark/50 text-center border-t border-border-dark">
                  <button
                    onClick={() => navigate('/settings')}
                    className="text-xs font-medium text-subtext-dark hover:text-text-dark flex items-center justify-center gap-1"
                  >
                    <span className="material-icons-outlined text-sm">settings</span>
                    Configurar notificações
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (window.confirm('Deseja restaurar o layout padrão?')) {
                setLayout(defaultLayout);
                localStorage.removeItem('widgetLayout');
                window.location.reload();
              }
            }}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-dark border border-border-dark text-text-dark hover:bg-gray-700 transition-colors"
            title="Restaurar Layout"
          >
            <span className="material-icons-outlined">restart_alt</span>
          </button>
        </div>
      </header>

      {/* Draggable Grid Layout */}
      {Object.values(enabledWidgets).every(v => !v) ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-icons-outlined text-6xl text-subtext-dark mb-4">widgets</span>
          <h3 className="text-xl font-bold text-text-dark mb-2">Nenhum widget ativado</h3>
          <p className="text-subtext-dark mb-6">Ative os widgets nas configurações para vê-los aqui.</p>
          <button
            onClick={() => navigate('/settings')}
            className="px-6 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Ir para Configurações
          </button>
        </div>
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layout={layout}
          cols={12}
          rowHeight={80}
          onLayoutChange={onLayoutChange}
          isDraggable={true}
          isResizable={true}
          compactType="vertical"
          preventCollision={false}
          draggableHandle=".drag-handle"
        >

          {/* Urgent Banner */}
          {enabledWidgets.urgentBanner && (
            tasks.some(t => t.urgent && !t.completed) ? (
              (() => {
                // Find the most urgent task (first one marked urgent)
                const mostUrgentTask = tasks.find(t => t.urgent && !t.completed);
                if (!mostUrgentTask) return null;

                return (
                  <div key="urgentBanner" className="col-span-1 lg:col-span-3 xl:col-span-4 bg-surface-dark p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between border border-border-dark shadow-sm gap-4">
                    <div className="flex items-center">
                      <div className="w-14 h-14 rounded-xl bg-accent3/20 flex items-center justify-center mr-4 flex-shrink-0">
                        <span className="material-icons-outlined text-3xl text-accent3">priority_high</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-text-dark text-sm md:text-base uppercase">URGENTE: {mostUrgentTask.title}</h3>
                        <p className="text-xs md:text-sm text-subtext-dark mt-1">
                          {mostUrgentTask.subtitle}. Requer atenção imediata.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/tasks')}
                      className="w-full md:w-auto px-6 py-3 md:py-2 bg-accent3/10 hover:bg-accent3/20 text-accent3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <span>Resolver Agora</span>
                      <span className="material-icons-outlined">arrow_forward</span>
                    </button>
                  </div>
                );
              })()
            ) : (
              <div key="urgentBanner" className="col-span-1 lg:col-span-3 xl:col-span-4 bg-surface-dark p-6 rounded-2xl flex items-center justify-between border border-border-dark shadow-sm">
                <div className="flex items-center drag-handle cursor-move">
                  <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="material-icons-outlined text-3xl text-green-500">check_circle</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-text-dark text-sm md:text-base">Tudo sob controle!</h3>
                    <p className="text-xs md:text-sm text-subtext-dark mt-1">
                      Você não tem tarefas urgentes pendentes no momento.
                    </p>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Productivity Chart */}
          {enabledWidgets.productivityChart && (
            <div key="productivityChart" className="col-span-1 lg:col-span-2 bg-accent1 p-6 rounded-2xl flex flex-col shadow-lg shadow-accent1/20 text-white relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

              <div className="flex items-center justify-between mb-4 relative z-10">
                <div>
                  <h3 className="font-bold text-xl drag-handle cursor-move inline-block">TAREFAS CONCLUÍDAS</h3>
                  <p className="text-xs text-white/70 mt-1">Desempenho baseado em tarefas finalizadas</p>
                </div>
                <button
                  onClick={cycleChartView}
                  className="flex items-center bg-white/20 px-3 py-1.5 rounded-full text-sm backdrop-blur-md cursor-pointer hover:bg-white/30 transition-colors select-none"
                >
                  <span>{getChartViewLabel()}</span>
                  <span className="material-icons-outlined text-lg ml-1">expand_more</span>
                </button>
              </div>

              <div className="flex-grow h-48 mt-4 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData[chartView]} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                      contentStyle={{ backgroundColor: '#27272A', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                      {chartData[chartView].map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.active ? '#FFFFFF' : 'rgba(255,255,255,0.3)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tasks Today */}
          {enabledWidgets.tasksToday && (
            <div key="tasksToday" className="col-span-1 xl:col-span-2 bg-surface-dark p-6 rounded-2xl flex flex-col border border-border-dark h-full max-h-[400px] lg:max-h-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl text-text-dark drag-handle cursor-move flex-grow">TAREFAS DE HOJE</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate('/tasks')}
                    className="px-3 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                  >
                    Ver todas as tarefas
                  </button>
                  <button
                    onClick={() => setIsAddingTask(!isAddingTask)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all text-text-dark ${isAddingTask ? 'bg-primary text-white rotate-45' : 'bg-background-dark hover:bg-gray-700'}`}
                  >
                    <span className="material-icons-outlined">add</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 flex-grow overflow-y-auto pr-2 scrollbar-thin">
                {isAddingTask && (
                  <form onSubmit={handleAddTask} className="mb-3 animate-fade-in">
                    <input
                      autoFocus
                      type="text"
                      className="w-full bg-background-dark border border-primary rounded-xl px-3 py-2 text-sm text-white outline-none placeholder-subtext-dark"
                      placeholder="Digite e pressione Enter..."
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onBlur={() => !newTaskText && setIsAddingTask(false)}
                    />
                  </form>
                )}

                {tasks.length === 0 && (
                  <p className="text-subtext-dark text-center py-4 text-sm">Tudo feito! 🎉</p>
                )}

                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className={`group flex items-center justify-between p-3 rounded-xl transition-all ${task.completed ? 'bg-background-dark/30 opacity-50' : 'bg-background-dark hover:bg-background-dark/80'}`}>
                    <div className="flex items-center overflow-hidden w-full">
                      <div
                        onClick={() => toggleTask(task.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center mr-3 cursor-pointer flex-shrink-0 transition-colors ${task.completed ? 'bg-primary border-primary' : 'border-gray-500 hover:border-primary'}`}
                      >
                        {task.completed && <span className="material-icons-outlined text-white text-sm">check</span>}
                      </div>
                      <label
                        onClick={() => toggleTask(task.id)}
                        className={`text-sm truncate cursor-pointer select-none w-full ${task.completed && 'line-through text-subtext-dark'}`}
                      >
                        {task.title}
                      </label>
                    </div>
                    {!task.completed && (
                      <span className="text-[10px] font-medium text-subtext-dark uppercase tracking-wide ml-2 flex-shrink-0">{task.tag}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Schedule */}
          {enabledWidgets.agenda && (
            <div key="agenda" className="col-span-1 lg:col-span-2 xl:col-span-2 bg-surface-dark p-6 rounded-2xl border border-border-dark flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl text-text-dark drag-handle cursor-move flex-grow">AGENDA</h3>
                <button
                  onClick={() => navigate('/calendar')}
                  className="text-sm bg-primary/20 text-primary hover:bg-primary/30 px-4 py-2 rounded-full font-semibold transition-colors"
                >
                  Ver Calendário
                </button>
              </div>
              <div className="space-y-4 flex-grow">
                {Array.from(new Map(events.map((item: any) => [item.id, item])).values()).length === 0 ? (
                  <div className="text-center py-8 text-subtext-dark">
                    <span className="material-icons-outlined text-4xl mb-2 block opacity-50">event_busy</span>
                    <p>Nenhum evento próximo.</p>
                    <button
                      onClick={() => navigate('/calendar')}
                      className="mt-4 text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      Adicionar evento
                    </button>
                  </div>
                ) : (
                  Array.from(new Map(events.map((item: any) => [item.id, item])).values()).slice(0, 5).map((event: any, idx) => {
                    const eventDate = new Date(event.date);
                    const dayName = eventDate.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');
                    const dayNumber = eventDate.getDate().toString();

                    return (
                      <div
                        key={event.id || idx}
                        onClick={() => navigate('/calendar')}
                        className="flex items-center p-4 rounded-xl bg-background-dark hover:bg-background-dark/80 transition-colors cursor-pointer animate-fade-in"
                      >
                        <div className="text-center w-16 mr-4 flex-shrink-0">
                          <p className="text-xs font-bold text-subtext-dark uppercase tracking-wider">{dayName}</p>
                          <p className="text-2xl font-bold text-text-dark">{dayNumber}</p>
                        </div>
                        <div className={`w-1 h-12 ${event.color} rounded-full mr-4 flex-shrink-0`}></div>
                        <div className="overflow-hidden flex-1">
                          <p className="font-semibold text-text-dark truncate">{event.title}</p>
                          <p className="text-sm text-subtext-dark">{event.time}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* AI Assistant */}
          {enabledWidgets.aiAssistant && (
            <div key="aiAssistant" className="col-span-1 lg:col-span-3 xl:col-span-2 bg-surface-dark p-0 rounded-2xl flex flex-col border border-border-dark overflow-hidden h-[450px] lg:h-auto">
              <div className="p-6 border-b border-border-dark bg-surface-dark flex items-center justify-between">
                <div className="flex items-center drag-handle cursor-move flex-grow">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                  <h3 className="font-bold text-xl text-text-dark">ASSISTENTE IA</h3>
                </div>
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-background-dark hover:bg-gray-700 text-text-dark">
                  <span className="material-icons-outlined text-base">more_horiz</span>
                </button>
              </div>

              {/* Chat History */}
              <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-background-dark/30 scrollbar-thin">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {msg.role === 'ai' ? (
                      <img alt="AI" className="w-8 h-8 rounded-full flex-shrink-0 border border-border-dark" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa8QgwboU5Ob6_pmfhIToo314OEaW3JDgQP_zVyDVbkWiOmPkLlIzEiIl6yaYw8vlOHNSX2rvwcEXtDs5beIIMYuhgf3N2UBrexjfZj866NFyqGnBb_eeglpU2veloFJmt6gVFrKd7NVgwiWd26wHHzLt2f0QicS35vJfm2UxPmuh2I2i0r_JY2jCz-QFE5c3NuB_5xhbwbSpcKvr86Auc600fakClopvZxx0-M2Sss9jBPht_BxC3hzP2HHzSoRHvNYpI8GpdykQ" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">EU</div>
                    )}
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[80%] ${msg.role === 'ai'
                      ? 'bg-surface-dark text-text-dark rounded-tl-none'
                      : 'bg-primary text-white rounded-tr-none'
                      }`}>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="flex items-start space-x-3">
                    <img alt="AI" className="w-8 h-8 rounded-full flex-shrink-0 border border-border-dark" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa8QgwboU5Ob6_pmfhIToo314OEaW3JDgQP_zVyDVbkWiOmPkLlIzEiIl6yaYw8vlOHNSX2rvwcEXtDs5beIIMYuhgf3N2UBrexjfZj866NFyqGnBb_eeglpU2veloFJmt6gVFrKd7NVgwiWd26wHHzLt2f0QicS35vJfm2UxPmuh2I2i0r_JY2jCz-QFE5c3NuB_5xhbwbSpcKvr86Auc600fakClopvZxx0-M2Sss9jBPht_BxC3hzP2HHzSoRHvNYpI8GpdykQ" />
                    <div className="p-3 rounded-2xl rounded-tl-none bg-surface-dark text-text-dark text-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-subtext-dark rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-subtext-dark rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-subtext-dark rounded-full animate-bounce delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-surface-dark border-t border-border-dark">
                <form onSubmit={handleChatSubmit} className="flex items-center relative">
                  <input
                    className="w-full pl-4 pr-12 py-3 rounded-full bg-background-dark text-text-dark placeholder-subtext-dark text-sm border border-transparent focus:border-primary focus:ring-0 transition-all outline-none"
                    placeholder="Digite sua mensagem..."
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isAiTyping}
                    className={`absolute right-2 w-9 h-9 flex items-center justify-center rounded-full transition-all ${chatInput.trim() && !isAiTyping
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'text-subtext-dark cursor-not-allowed'
                      }`}
                  >
                    <span className="material-icons-outlined text-lg">send</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Financial Summary Widget */}
          {enabledWidgets.financialSummary && (
            <div key="financialSummary" className="col-span-1 lg:col-span-2 bg-gradient-to-br from-chart-green to-accent2 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4 drag-handle cursor-move">
                  <h3 className="font-bold text-xl">RESUMO FINANCEIRO</h3>
                  <span className="material-icons-outlined">account_balance_wallet</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-sm">Saldo Total</span>
                    <span className="text-2xl font-bold">
                      R$ {(transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) -
                        transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="h-px bg-white/20"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/70 text-xs mb-1">Receitas</p>
                      <p className="text-lg font-semibold">
                        R$ {transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/70 text-xs mb-1">Despesas</p>
                      <p className="text-lg font-semibold">
                        R$ {transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/expenses')}
                  className="mt-4 w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          )}

          {/* Motivational Quote Widget */}
          {enabledWidgets.motivationalQuote && (
            <div key="motivationalQuote" className="col-span-1 lg:col-span-2 bg-gradient-to-br from-accent3 to-primary p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -ml-10 -mb-10 blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 drag-handle cursor-move">
                  <span className="material-icons-outlined text-3xl">format_quote</span>
                  <h3 className="font-bold text-lg">FRASE DO DIA</h3>
                </div>
                <p className="text-lg font-medium leading-relaxed mb-3 italic">
                  "{dailyQuote.text}"
                </p>
                <p className="text-white/80 text-sm">
                  — {dailyQuote.author}
                </p>
              </div>
            </div>
          )}

          {/* Quick Stats Widget */}
          {enabledWidgets.quickStats && (
            <div key="quickStats" className="col-span-1 lg:col-span-2 xl:col-span-2 bg-surface-dark p-4 rounded-2xl border border-border-dark flex flex-col h-full">
              <h3 className="font-bold text-lg mb-3 text-text-dark flex-shrink-0 drag-handle cursor-move">ESTATÍSTICAS</h3>
              <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-y-auto scrollbar-thin">
                <div className="bg-background-dark p-2.5 rounded-xl flex flex-col justify-center items-center text-center">
                  <span className="material-icons-outlined text-primary text-2xl mb-1">check_circle</span>
                  <span className="text-xl font-bold text-text-dark leading-none">
                    {tasks.filter(t => t.completed).length}
                  </span>
                  <p className="text-[10px] text-subtext-dark mt-1 uppercase tracking-wide">Concluídas</p>
                </div>
                <div className="bg-background-dark p-2.5 rounded-xl flex flex-col justify-center items-center text-center">
                  <span className="material-icons-outlined text-accent3 text-2xl mb-1">pending_actions</span>
                  <span className="text-xl font-bold text-text-dark leading-none">
                    {tasks.filter(t => !t.completed).length}
                  </span>
                  <p className="text-[10px] text-subtext-dark mt-1 uppercase tracking-wide">Pendentes</p>
                </div>
                <div className="bg-background-dark p-2.5 rounded-xl flex flex-col justify-center items-center text-center">
                  <span className="material-icons-outlined text-chart-red text-2xl mb-1">priority_high</span>
                  <span className="text-xl font-bold text-text-dark leading-none">
                    {tasks.filter(t => t.urgent && !t.completed).length}
                  </span>
                  <p className="text-[10px] text-subtext-dark mt-1 uppercase tracking-wide">Urgentes</p>
                </div>
                <div className="bg-background-dark p-2.5 rounded-xl flex flex-col justify-center items-center text-center">
                  <span className="material-icons-outlined text-accent2 text-2xl mb-1">event</span>
                  <span className="text-xl font-bold text-text-dark leading-none">
                    {events.length}
                  </span>
                  <p className="text-[10px] text-subtext-dark mt-1 uppercase tracking-wide">Eventos</p>
                </div>
              </div>
            </div>
          )}

          {/* Daily Goal Widget */}
          {enabledWidgets.dailyGoal && (
            <div key="dailyGoal" className="bg-surface-dark p-4 rounded-2xl border border-border-dark flex flex-col h-full">
              <div className="flex items-center justify-between mb-2 flex-shrink-0 drag-handle cursor-move">
                <h3 className="font-bold text-lg text-text-dark flex items-center gap-2">
                  <span className="material-icons-outlined text-primary">flag</span>
                  META DO DIA
                </h3>
                {!isEditingGoal && dailyGoal && (
                  <button
                    onClick={() => {
                      setIsEditingGoal(true);
                      setGoalInput(dailyGoal);
                    }}
                    className="text-subtext-dark hover:text-primary transition-colors"
                  >
                    <span className="material-icons-outlined text-sm">edit</span>
                  </button>
                )}
              </div>
              {isEditingGoal || !dailyGoal ? (
                <div className="flex flex-col flex-1 min-h-0 justify-center gap-2">
                  <input
                    type="text"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="Digite sua meta..."
                    className="w-full px-3 py-2 bg-background-dark border border-border-dark rounded-xl text-text-dark placeholder-subtext-dark focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setDailyGoal(goalInput);
                        localStorage.setItem('dailyGoal', goalInput);
                        setIsEditingGoal(false);
                      }}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors text-xs uppercase tracking-wide"
                    >
                      Salvar
                    </button>
                    {dailyGoal && (
                      <button
                        onClick={() => {
                          setIsEditingGoal(false);
                          setGoalInput(dailyGoal);
                        }}
                        className="px-3 py-1.5 bg-background-dark hover:bg-border-dark text-text-dark rounded-lg transition-colors text-xs uppercase tracking-wide"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-background-dark p-3 rounded-xl flex-1 flex flex-col justify-center items-center text-center min-h-0">
                  <p className="text-text-dark text-base font-medium line-clamp-2">{dailyGoal}</p>
                  <button
                    onClick={() => {
                      setDailyGoal('');
                      localStorage.removeItem('dailyGoal');
                    }}
                    className="mt-2 text-xs text-chart-green hover:text-chart-green/80 font-semibold flex items-center gap-1"
                  >
                    <span className="material-icons-outlined text-sm">check_circle</span>
                    Concluir
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pomodoro Timer Widget */}
          {enabledWidgets.pomodoroTimer && (
            <div key="pomodoroTimer" className="bg-gradient-to-br from-chart-red to-primary p-6 rounded-2xl shadow-lg text-white relative overflow-hidden h-full">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-8 -mt-8 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4 drag-handle cursor-move">
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    <span className="material-icons-outlined">timer</span>
                    POMODORO
                  </h3>
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    {pomodoroMode === 'work' ? 'Foco' : 'Pausa'}
                  </span>
                </div>
                <div className="text-center my-6">
                  <div className="text-6xl font-bold mb-2">
                    {Math.floor(pomodoroTime / 60)}:{(pomodoroTime % 60).toString().padStart(2, '0')}
                  </div>
                  <p className="text-white/70 text-sm">
                    {pomodoroMode === 'work' ? '25 minutos de foco intenso' : '5 minutos de descanso'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPomodoroRunning(!isPomodoroRunning)}
                    className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-icons-outlined">
                      {isPomodoroRunning ? 'pause' : 'play_arrow'}
                    </span>
                    {isPomodoroRunning ? 'Pausar' : 'Iniciar'}
                  </button>
                  <button
                    onClick={async () => {
                      // Save incomplete session if work mode and timer was running
                      if (pomodoroMode === 'work' && pomodoroStartTime !== null && isPomodoroRunning) {
                        const elapsedSeconds = Math.floor((Date.now() - pomodoroStartTime) / 1000);
                        const elapsedMinutes = Math.floor(elapsedSeconds / 60);
                        if (elapsedMinutes > 0) {
                          await savePomodoroSession(elapsedMinutes, false);
                        }
                      }
                      setIsPomodoroRunning(false);
                      setPomodoroTime(pomodoroMode === 'work' ? 25 * 60 : 5 * 60);
                      setPomodoroStartTime(null);
                    }}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-3 rounded-lg transition-colors"
                  >
                    <span className="material-icons-outlined">refresh</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Streak Widget */}
          {enabledWidgets.streak && (
            <div key="streak" className="col-span-1 bg-surface-dark p-6 rounded-2xl border border-border-dark">
              <div className="flex items-center justify-between mb-4 drag-handle cursor-move">
                <h3 className="font-bold text-lg text-text-dark flex items-center gap-2">
                  <span className="material-icons-outlined text-primary">local_fire_department</span>
                  SEQUÊNCIA
                </h3>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-primary mb-2">{currentStreak.count}</div>
                <p className="text-subtext-dark text-sm">
                  {currentStreak.count === 1 ? 'dia consecutivo' : 'dias consecutivos'}
                </p>
                <p className="text-xs text-subtext-dark mt-2">
                  Continue completando tarefas diariamente!
                </p>
              </div>
            </div>
          )}

          {/* Weekly Progress Widget */}
          {enabledWidgets.weeklyProgress && (
            <div key="weeklyProgress" className="col-span-1 lg:col-span-2 bg-surface-dark p-4 rounded-2xl border border-border-dark flex flex-col h-full">
              <h3 className="font-bold text-lg mb-3 text-text-dark flex items-center gap-2 flex-shrink-0 drag-handle cursor-move">
                <span className="material-icons-outlined text-accent1">trending_up</span>
                PROGRESSO
              </h3>
              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto scrollbar-thin pr-1">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => {
                  const today = new Date().getDay();
                  const isToday = idx === today;
                  const isPast = idx < today;
                  const progress = isPast ? 100 : isToday ? 60 : 0;

                  return (
                    <div key={day} className="flex items-center gap-2">
                      <span className={`text-xs font-medium w-8 ${isToday ? 'text-primary' : 'text-subtext-dark'}`}>
                        {day}
                      </span>
                      <div className="flex-1 h-2 bg-background-dark rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isToday ? 'bg-primary' : isPast ? 'bg-chart-green' : 'bg-gray-600'}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-subtext-dark w-8 text-right">{progress}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weather Widget */}
          {enabledWidgets.weather && (
            <div key="weather" className="col-span-1 bg-gradient-to-br from-accent2 to-accent1 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mb-10 blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 drag-handle cursor-move">
                  <span className="material-icons-outlined text-5xl">{weather.icon}</span>
                  <div className="text-right">
                    <div className="text-4xl font-bold">{weather.temp}°</div>
                    <p className="text-sm text-white/80">{weather.condition}</p>
                    <p className="text-xs text-white/60 mt-1">{weather.time}</p>
                  </div>
                </div>
                <p className="text-white/70 text-sm mt-4">{weather.location}</p>
              </div>
            </div>
          )}

          {/* Quick Notes Widget */}
          {enabledWidgets.quickNotes && (
            <div key="quickNotes" className="col-span-1 lg:col-span-2 bg-surface-dark p-6 rounded-2xl border border-border-dark flex flex-col h-full">
              <h3 className="font-bold text-xl mb-4 text-text-dark flex items-center gap-2 drag-handle cursor-move">
                <span className="material-icons-outlined text-accent3">sticky_note_2</span>
                NOTAS RÁPIDAS
              </h3>
              <textarea
                value={quickNote}
                onChange={(e) => {
                  setQuickNote(e.target.value);
                }}
                placeholder="Digite suas anotações aqui..."
                className="w-full flex-1 px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-text-dark placeholder-subtext-dark focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none mb-2"
              />
              <button
                onClick={() => {
                  localStorage.setItem('quickNote', quickNote);
                  alert('Nota salva com sucesso!');
                }}
                className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-lg font-semibold transition-colors text-sm"
              >
                Salvar Nota
              </button>
            </div>
          )}

          {/* Achievements Widget */}
          {enabledWidgets.achievements && (
            <div key="achievements" className="col-span-1 lg:col-span-2 xl:col-span-2 bg-surface-dark p-4 rounded-2xl border border-border-dark flex flex-col h-full">
              <h3 className="font-bold text-lg mb-3 text-text-dark flex items-center gap-2 flex-shrink-0 drag-handle cursor-move">
                <span className="material-icons-outlined text-chart-yellow">emoji_events</span>
                CONQUISTAS
              </h3>
              <div className="grid grid-cols-1 gap-3 flex-1 min-h-0 overflow-y-auto scrollbar-thin pr-2">
                {achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-xl border transition-all flex items-center gap-4 text-left ${achievement.unlocked
                      ? 'bg-background-dark border-primary/30'
                      : 'bg-background-dark/50 border-border-dark opacity-50'
                      }`}
                  >
                    <span className={`material-icons-outlined text-3xl flex-shrink-0 ${achievement.unlocked ? achievement.color : 'text-subtext-dark'}`}>
                      {achievement.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-dark mb-0.5 leading-tight">{achievement.name}</p>
                      <p className="text-xs text-subtext-dark leading-snug">{achievement.description}</p>
                      {achievement.unlocked && (
                        <span className="inline-block mt-1.5 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">
                          Desbloqueado
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </ResponsiveGridLayout>
      )
      }
    </div >
  );
};

export default Dashboard;