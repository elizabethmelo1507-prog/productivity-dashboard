import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import { Task, Transaction, Pomodoro, CalendarEvent } from './types';
import { supabase } from './src/supabaseClient';
import { fetchPomodoros } from './src/api/pomodoro';
import { getProfile } from './src/api/profile';

// --- Context ---
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

interface NotificationContextType {
  notifications: NotificationItem[];
  hasUnread: boolean;
  markAllRead: () => void;
}

export const NotificationContext = React.createContext<NotificationContextType>({
  notifications: [],
  hasUnread: false,
  markAllRead: () => { },
});


// --- Components ---

const SidebarItem = ({ icon, path, active }: { icon: string; path: string; active: boolean }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors duration-200 ${active
        ? 'bg-accent1 text-white'
        : 'text-subtext-dark hover:bg-gray-700'
        }`}
    >
      <span className="material-icons-outlined">{icon}</span>
    </button>
  );
};

const BottomNavItem = ({ icon, label, path, active }: { icon: string; label: string; path: string; active: boolean }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className={`flex flex-col items-center justify-center w-1/5 ${active ? 'text-primary' : 'text-subtext-dark hover:text-text-dark'
        }`}
    >
      <span className="material-icons-outlined mb-1">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
};

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const { notifications, hasUnread, markAllRead } = React.useContext(NotificationContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);
  const [profileImage, setProfileImage] = useState(
    localStorage.getItem('profileImage') || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTvp_UvYm74YiK4argbN7IdjZqoVuwlFZup0IVGX0fsXBTS5UwGiEQstgdgdPxeM91-Nf97OABGT5UWUlIyWBYisONPPTzFTid7EMoL8PRNnV69nm66mNCPKXbCQCrx7xshoJo6HWnUffFgwsNX_PY8ygWkXyuRvTNAv5mASlM0dPHEhBJ_WqoBGFZ2ncCl5c3PjSrw9r2_XlXhemWV5r6G7U_xJDwO33ylIwNzGOdkq6S-FWSevAz-AToUlPZZA2lj_sTf3chFnA'
  );

  // Determine active tab based on path
  const isActive = (path: string) => currentPath === path || (path === '/' && currentPath === '/dashboard');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifRef]);

  // Listen for profile image updates
  useEffect(() => {
    const handleStorageChange = () => {
      const savedImage = localStorage.getItem('profileImage');
      if (savedImage) {
        setProfileImage(savedImage);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleNotifClick = (path: string) => {
    setShowDropdown(false);
    navigate(path);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (hasUnread) markAllRead();
  };

  return (
    <div className="flex h-screen w-full bg-background-dark text-text-dark overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col items-center w-20 p-4 bg-surface-dark border-r border-border-dark z-20">
        <div className="w-10 h-10 rounded-lg bg-text-dark flex items-center justify-center font-bold text-background-dark text-lg mb-10">
          Dg
        </div>
        <nav className="flex flex-col items-center space-y-4">
          <SidebarItem icon="home" path="/" active={isActive('/')} />
          <SidebarItem icon="account_balance_wallet" path="/expenses" active={isActive('/expenses')} />
          <SidebarItem icon="check_circle" path="/tasks" active={isActive('/tasks')} />
          <SidebarItem icon="event" path="/calendar" active={isActive('/calendar')} />
          <SidebarItem icon="show_chart" path="/reports" active={isActive('/reports')} />
          <SidebarItem icon="settings" path="/settings" active={isActive('/settings')} />
        </nav>

        {/* Global Notification Icon in Sidebar (Optional, or keep in top bar of pages) */}
        {/* For this design, we keep notifications in the page headers, but we could add a global indicator here if requested. 
            However, the user request implies the notification *feature* (the dropdown) should be smart. 
            Usually the dropdown is in the top header of the Dashboard/Pages. 
            To make it truly global, we should probably lift the Header to the Layout or provide the data to the pages.
            
            Given the current structure where each page has its own Header, we will provide the Notification Data via Context 
            so each page can render the notification bell correctly with the real data.
        */}

        <div className="mt-auto flex flex-col items-center space-y-4">
          <button className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-dark border border-border-dark text-text-dark hover:bg-gray-700 transition-colors">
            <span className="material-icons-outlined">add</span>
          </button>
          <img
            alt="User avatar"
            className="w-10 h-10 rounded-full object-cover border-2 border-surface-dark"
            src={profileImage}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-background-dark pb-20 lg:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-dark border-t border-border-dark h-16 flex items-center justify-around z-30 safe-area-bottom">
        <BottomNavItem icon="home" label="Início" path="/" active={isActive('/')} />
        <BottomNavItem icon="check_circle" label="Tarefas" path="/tasks" active={isActive('/tasks')} />
        <BottomNavItem icon="account_balance_wallet" label="Finanças" path="/expenses" active={isActive('/expenses')} />
        <BottomNavItem icon="event" label="Calendário" path="/calendar" active={isActive('/calendar')} />
        <BottomNavItem icon="analytics" label="Relatórios" path="/reports" active={isActive('/reports')} />
        <BottomNavItem icon="settings" label="Ajustes" path="/settings" active={isActive('/settings')} />
      </nav>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return <Layout>{children}</Layout>;
};

const initialTasksData: Task[] = [
  { id: 1, title: "Finalizar relatório trimestral", subtitle: "Vence em 4 horas", urgent: true, tag: "Trabalho", tagColor: "bg-accent1/20 text-accent1", completed: false, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTvp_UvYm74YiK4argbN7IdjZqoVuwlFZup0IVGX0fsXBTS5UwGiEQstgdgdPxeM91-Nf97OABGT5UWUlIyWBYisONPPTzFTid7EMoL8PRNnV69nm66mNCPKXbCQCrx7xshoJo6HWnUffFgwsNX_PY8ygWkXyuRvTNAv5mASlM0dPHEhBJ_WqoBGFZ2ncCl5c3PjSrw9r2_XlXhemWV5r6G7U_xJDwO33ylIwNzGOdkq6S-FWSevAz-AToUlPZZA2lj_sTf3chFnA" },
  { id: 2, title: "Planejamento do sprint de design", subtitle: "Vence amanhã", urgent: false, tag: "Projetos", tagColor: "bg-accent2/20 text-accent2", completed: false, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDa8QgwboU5Ob6_pmfhIToo314OEaW3JDgQP_zVyDVbkWiOmPkLlIzEiIl6yaYw8vlOHNSX2rvwcEXtDs5beIIMYuhgf3N2UBrexjfZj866NFyqGnBb_eeglpU2veloFJmt6gVFrKd7NVgwiWd26wHHzLt2f0QicS35vJfm2UxPmuh2I2i0r_JY2jCz-QFE5c3NuB_5xhbwbSpcKvr86Auc600fakClopvZxx0-M2Sss9jBPht_BxC3hzP2HHzSoRHvNYpI8GpdykQ" },
  { id: 3, title: "E-mails de acompanhamento de clientes", subtitle: "Concluído ontem", urgent: false, tag: "Trabalho", tagColor: "bg-gray-700 text-subtext-dark", completed: true, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTvp_UvYm74YiK4argbN7IdjZqoVuwlFZup0IVGX0fsXBTS5UwGiEQstgdgdPxeM91-Nf97OABGT5UWUlIyWBYisONPPTzFTid7EMoL8PRNnV69nm66mNCPKXbCQCrx7xshoJo6HWnUffFgwsNX_PY8ygWkXyuRvTNAv5mASlM0dPHEhBJ_WqoBGFZ2ncCl5c3PjSrw9r2_XlXhemWV5r6G7U_xJDwO33ylIwNzGOdkq6S-FWSevAz-AToUlPZZA2lj_sTf3chFnA" },
  { id: 4, title: "Reservar voo para conferência", subtitle: "Vence em 3 dias", urgent: false, tag: "Pessoal", tagColor: "bg-blue-500/20 text-blue-400", completed: false },
  { id: 5, title: "Preparar apresentação para a reunião", subtitle: "Vence em 5 dias", urgent: false, tag: "Trabalho", tagColor: "bg-accent1/20 text-accent1", completed: false, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTvp_UvYm74YiK4argbN7IdjZqoVuwlFZup0IVGX0fsXBTS5UwGiEQstgdgdPxeM91-Nf97OABGT5UWUlIyWBYisONPPTzFTid7EMoL8PRNnV69nm66mNCPKXbCQCrx7xshoJo6HWnUffFgwsNX_PY8ygWkXyuRvTNAv5mASlM0dPHEhBJ_WqoBGFZ2ncCl5c3PjSrw9r2_XlXhemWV5r6G7U_xJDwO33ylIwNzGOdkq6S-FWSevAz-AToUlPZZA2lj_sTf3chFnA" },
  { id: 6, title: "Comprar mantimentos", subtitle: "Concluído há 2 dias", urgent: false, tag: "Pessoal", tagColor: "bg-blue-500/20 text-blue-400 opacity-50", completed: true },
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [pomodoros, setPomodoros] = useState<Pomodoro[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  // Global initialization state to prevent premature redirects
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);

  useEffect(() => {
    // Check URL hash immediately
    const hash = window.location.hash;
    const isRecovery = hash && (hash.includes('type=recovery') || hash.includes('type=magiclink'));

    if (isRecovery) {
      setIsRecoveryFlow(true);
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryFlow(true);
      }
    });

    // Small delay to allow Supabase client to process hash if present
    setTimeout(() => {
      setIsInitializing(false);
    }, 500);

    return () => subscription.unsubscribe();
  }, []);

  if (isInitializing && window.location.hash.includes('type=recovery')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-dark text-white">
        <div className="flex flex-col items-center">
          <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></span>
          <p>Inicializando segurança...</p>
        </div>
      </div>
    );
  }

  if (isRecoveryFlow) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<ResetPassword />} />
        </Routes>
      </Router>
    );
  }
  const [loading, setLoading] = useState(true);

  // Initialize theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    const theme = savedTheme || 'dark';

    const applyTheme = (selectedTheme: 'light' | 'dark' | 'system') => {
      const html = document.documentElement;

      if (selectedTheme === 'light') {
        html.classList.remove('dark');
      } else if (selectedTheme === 'dark') {
        html.classList.add('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          html.classList.add('dark');
        } else {
          html.classList.remove('dark');
        }
      }
    };

    applyTheme(theme);
  }, []);

  useEffect(() => {
    fetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session) {
        fetchData();
      } else if (event === 'SIGNED_OUT') {
        setTasks([]);
        setTransactions([]);
        setEvents([]);
        setPomodoros([]);

        // Clear sensitive user data from localStorage
        const keysToRemove = [
          'userName', 'userEmail', 'userBio', 'userLocation', 'profileImage',
          'theme', 'enabledWidgets', 'widgetLayout_v3', 'dashboardLayout',
          'dashboardOrder', 'emailNotifications', 'pushNotifications',
          'taskReminders', 'weeklyReport', 'twoFactorEnabled'
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch Tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (tasksError) console.error('Error fetching tasks:', tasksError);
        else if (tasksData) {
          // Map Supabase data to Task type
          const mappedTasks: Task[] = tasksData.map(t => ({
            id: t.id,
            title: t.title,
            subtitle: t.subtitle || '',
            urgent: t.urgent || false,
            tag: t.tag as any, // Cast to specific union type
            tagColor: t.tag_color || 'bg-gray-500/20 text-gray-400',
            completed: t.completed || false,
            date: t.created_at ? new Date(t.created_at).toISOString().split('T')[0] : undefined,
            created_at: t.created_at,
            status: t.status || (t.completed ? 'done' : 'todo'),
          }));
          setTasks(mappedTasks);
        }

        // Fetch Transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });

        if (transactionsError) console.error('Error fetching transactions:', transactionsError);
        else if (transactionsData) {
          const mappedTransactions: Transaction[] = transactionsData.map(t => ({
            id: t.id,
            title: t.title || '',
            amount: Number(t.amount),
            type: t.type as 'income' | 'expense',
            category: t.category as any,
            date: t.date
          }));
          setTransactions(mappedTransactions);
        }

        // Fetch Events (local + Google Calendar)
        const { data: eventsData, error: eventsError } = await supabase
          .from('calendar_events')
          .select('*')
          .gte('event_date', new Date().toISOString().split('T')[0]) // Only future/today events
          .order('start_time', { ascending: true })
          .limit(5);

        let allEvents: any[] = [];

        if (eventsError) console.error('Error fetching events:', eventsError);
        else if (eventsData) {
          const mappedEvents = eventsData.map(e => {
            const start = new Date(e.start_time);
            return {
              id: e.id,
              title: e.title,
              date: e.event_date,
              time: start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              color: e.color === 'Trabalho' ? 'bg-chart-green' :
                e.color === 'Projetos Pessoais' ? 'bg-chart-yellow' :
                  e.color === 'Importante' ? 'bg-chart-red' : 'bg-chart-blue',
              day: new Date(e.event_date).toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '')
            };
          });
          allEvents = [...mappedEvents];
        }

        setEvents(allEvents.slice(0, 5)); // Limit to 5 total events

        // Fetch Pomodoros
        const pomodorosData = await fetchPomodoros(user.id);
        setPomodoros(pomodorosData);

        // Fetch Profile Settings
        const profile = await getProfile(user.id);
        if (profile) {
          // Sync profile settings to localStorage for immediate app-wide availability
          if (profile.full_name) localStorage.setItem('userName', profile.full_name);
          if (profile.email) localStorage.setItem('userEmail', profile.email);
          if (profile.bio) localStorage.setItem('userBio', profile.bio);
          if (profile.location) localStorage.setItem('userLocation', profile.location);
          if (profile.avatar_url) localStorage.setItem('profileImage', profile.avatar_url);

          if (profile.theme) {
            localStorage.setItem('theme', profile.theme);
            // Apply theme immediately
            const html = document.documentElement;
            if (profile.theme === 'light') html.classList.remove('dark');
            else if (profile.theme === 'dark') html.classList.add('dark');
            else {
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (prefersDark) html.classList.add('dark');
              else html.classList.remove('dark');
            }
          }

          if (profile.enabled_widgets) {
            localStorage.setItem('enabledWidgets', JSON.stringify(profile.enabled_widgets));
          }

          if (profile.dashboard_layout) {
            localStorage.setItem('dashboardLayout', JSON.stringify(profile.dashboard_layout));
          }

          if (profile.widgets_order) {
            localStorage.setItem('dashboardOrder', JSON.stringify(profile.widgets_order));
          }

          if (profile.notifications_preferences) {
            localStorage.setItem('emailNotifications', String(profile.notifications_preferences.email));
            localStorage.setItem('pushNotifications', String(profile.notifications_preferences.push));
            localStorage.setItem('taskReminders', String(profile.notifications_preferences.taskReminders));
            localStorage.setItem('weeklyReport', String(profile.notifications_preferences.weeklyReport));
          }

          // Trigger storage event to update components listening to localStorage
          window.dispatchEvent(new Event('storage'));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const financialData = React.useMemo(() => {
    const receitas = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const despesas = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const gastoLazer = transactions.filter(t => t.category === 'Lazer').reduce((acc, t) => acc + t.amount, 0);
    return { receitas, despesas, limiteLazer: 500, gastoLazer };
  }, [transactions]);

  // Global Notification Logic
  useEffect(() => {
    const newNotifs: NotificationItem[] = [];

    // 1. Urgent Tasks
    const urgentTasks = tasks.filter(t => t.urgent && !t.completed);
    urgentTasks.forEach(t => {
      newNotifs.push({
        id: `urgent-${t.id}`,
        type: 'urgent',
        title: 'Tarefa Urgente',
        description: t.title,
        time: t.subtitle || 'Agora',
        icon: 'priority_high',
        color: 'text-chart-red',
        bgColor: 'bg-chart-red/10',
        path: '/tasks'
      });
    });

    // 2. Next Task (if no urgent ones)
    if (urgentTasks.length === 0) {
      const nextTask = tasks.find(t => !t.completed);
      if (nextTask) {
        newNotifs.push({
          id: `next-${nextTask.id}`,
          type: 'info',
          title: 'Próxima Tarefa',
          description: nextTask.title,
          time: 'Em breve',
          icon: 'assignment',
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          path: '/tasks'
        });
      }
    }

    // 3. Next Event
    const nextEvent = events[0];
    if (nextEvent) {
      newNotifs.push({
        id: `event-${nextEvent.id}`,
        type: 'event',
        title: 'Próximo Evento',
        description: nextEvent.title,
        time: nextEvent.time,
        icon: 'event',
        color: 'text-accent1',
        bgColor: 'bg-accent1/10',
        path: '/calendar'
      });
    }

    // 4. Financial Alert
    if (financialData.gastoLazer > financialData.limiteLazer * 0.75) {
      newNotifs.push({
        id: 'fin-alert',
        type: 'finance',
        title: 'Alerta de Gastos',
        description: `Você usou ${(financialData.gastoLazer / financialData.limiteLazer * 100).toFixed(0)}% do orçamento de Lazer.`,
        time: 'Hoje',
        icon: 'account_balance_wallet',
        color: 'text-chart-yellow',
        bgColor: 'bg-chart-yellow/10',
        path: '/expenses'
      });
    }

    setNotifications(newNotifs);
    // Simple logic: if we have notifications, mark as unread (in real app, track read status per item)
    if (newNotifs.length > 0) setHasUnread(true);

  }, [tasks, transactions, events]); // Re-run when tasks or transactions change

  const markAllRead = () => setHasUnread(false);

  return (
    <NotificationContext.Provider value={{ notifications, hasUnread, markAllRead }}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<ProtectedRoute><Dashboard tasks={tasks} setTasks={setTasks} transactions={transactions} events={events} /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Expenses transactions={transactions} setTransactions={setTransactions} /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><Tasks tasks={tasks} setTasks={setTasks} /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports tasks={tasks} pomodoros={pomodoros} /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </Router>
    </NotificationContext.Provider>
  );
}