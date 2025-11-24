import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../src/supabaseClient';
import { updateProfile } from '../src/api/profile';
type SettingsTab = 'profile' | 'appearance' | 'widgets' | 'notifications' | 'security';
type Theme = 'light' | 'dark' | 'system';

import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [profileImage, setProfileImage] = useState<string>(
    localStorage.getItem('profileImage') || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTvp_UvYm74YiK4argbN7IdjZqoVuwlFZup0IVGX0fsXBTS5UwGiEQstgdgdPxeM91-Nf97OABGT5UWUlIyWBYisONPPTzFTid7EMoL8PRNnV69nm66mNCPKXbCQCrx7xshoJo6HWnUffFgwsNX_PY8ygWkXyuRvTNAv5mASlM0dPHEhBJ_WqoBGFZ2ncCl5c3PjSrw9r2_XlXhemWV5r6G7U_xJDwO33ylIwNzGOdkq6S-FWSevAz-AToUlPZZA2lj_sTf3chFnA'
  );
  const [name, setName] = useState(localStorage.getItem('userName') || 'Hanna D.');
  const [email, setEmail] = useState(localStorage.getItem('userEmail') || 'hanna.d@email.com');
  const [bio, setBio] = useState(localStorage.getItem('userBio') || 'Entusiasta de produtividade e líder de design.');
  const [location, setLocation] = useState(localStorage.getItem('userLocation') || 'São Paulo, SP');

  const [theme, setTheme] = useState<Theme>((localStorage.getItem('theme') as Theme) || 'dark');
  const [emailNotifications, setEmailNotifications] = useState(localStorage.getItem('emailNotifications') !== 'false');
  const [pushNotifications, setPushNotifications] = useState(localStorage.getItem('pushNotifications') !== 'false');
  const [taskReminders, setTaskReminders] = useState(localStorage.getItem('taskReminders') !== 'false');
  const [weeklyReport, setWeeklyReport] = useState(localStorage.getItem('weeklyReport') !== 'false');

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(localStorage.getItem('twoFactorEnabled') === 'true');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
    weather: false,
    quickNotes: false,
    achievements: true,
  };

  const [enabledWidgets, setEnabledWidgets] = useState(() => {
    const saved = localStorage.getItem('enabledWidgets');
    return saved ? JSON.parse(saved) : defaultWidgets;
  });

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Clear ALL user-specific data from localStorage
      const keysToRemove = [
        'isAuthenticated',
        'userName',
        'userEmail',
        'userBio',
        'userLocation',
        'profileImage',
        'theme',
        'enabledWidgets',
        'widgetLayout_v3',
        'dashboardLayout',
        'dashboardOrder',
        'emailNotifications',
        'pushNotifications',
        'taskReminders',
        'weeklyReport',
        'twoFactorEnabled'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));

      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply theme on load and change
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const applyTheme = (selectedTheme: Theme) => {
    const html = document.documentElement;

    if (selectedTheme === 'light') {
      html.classList.remove('dark');
    } else if (selectedTheme === 'dark') {
      html.classList.add('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result as string;
        setProfileImage(imageData);
        localStorage.setItem('profileImage', imageData);

        // Dispatch storage event to update other components immediately (like the sidebar)
        window.dispatchEvent(new Event('storage'));

        // Persist avatar in Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            console.log('Tentando salvar avatar para usuário:', user.id);
            await updateProfile(user.id, { avatar_url: imageData });
            console.log('Avatar salvo com sucesso!');
          } catch (error: any) {
            console.error('Exceção ao salvar avatar:', error);

            if (error.message?.includes('relation "public.profiles" does not exist') ||
              error.code === '42P01') {
              alert('⚠️ A tabela de perfis não foi encontrada no banco de dados.\n\nPor favor, execute o script SQL "supabase_schema.sql" no painel do Supabase para criar as tabelas necessárias.');
            } else if (error.code === '23505') {
              // Duplicate key, should be handled by upsert but just in case
              console.log('Chave duplicada, ignorando...');
            } else {
              alert(`Erro ao salvar foto: ${error.message || 'Erro desconhecido'}`);
            }
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage('https://lh3.googleusercontent.com/aida-public/AB6AXuDTvp_UvYm74YiK4argbN7IdjZqoVuwlFZup0IVGX0fsXBTS5UwGiEQstgdgdPxeM91-Nf97OABGT5UWUlIyWBYisONPPTzFTid7EMoL8PRNnV69nm66mNCPKXbCQCrx7xshoJo6HWnUffFgwsNX_PY8ygWkXyuRvTNAv5mASlM0dPHEhBJ_WqoBGFZ2ncCl5c3PjSrw9r2_XlXhemWV5r6G7U_xJDwO33ylIwNzGOdkq6S-FWSevAz-AToUlPZZA2lj_sTf3chFnA');
    localStorage.removeItem('profileImage');
    window.dispatchEvent(new Event('storage'));
  };

  const handleSaveProfile = async () => {
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userBio', bio);
    localStorage.setItem('userLocation', location);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await updateProfile(user.id, {
          full_name: name,
          email: email,
          bio: bio,
          location: location
        });

        // Also update auth metadata as backup
        await supabase.auth.updateUser({
          data: { full_name: name }
        });
      }
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Erro ao salvar perfil. Tente novamente.');
    }

    // Dispatch storage event to update other components immediately
    window.dispatchEvent(new Event('storage'));
  };

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await updateProfile(user.id, { theme: newTheme });
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const handleSaveNotifications = async () => {
    localStorage.setItem('emailNotifications', String(emailNotifications));
    localStorage.setItem('pushNotifications', String(pushNotifications));
    localStorage.setItem('taskReminders', String(taskReminders));
    localStorage.setItem('weeklyReport', String(weeklyReport));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await updateProfile(user.id, {
          notifications_preferences: {
            email: emailNotifications,
            push: pushNotifications,
            taskReminders,
            weeklyReport
          }
        });
      }
      alert('Configurações de notificações salvas!');
    } catch (error) {
      console.error('Error saving notifications:', error);
      alert('Erro ao salvar notificações.');
    }
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Por favor, preencha todos os campos');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }
    if (newPassword.length < 8) {
      alert('A senha deve ter no mínimo 8 caracteres');
      return;
    }
    // Simulate password change
    alert('Senha alterada com sucesso!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const toggleTwoFactor = () => {
    const newValue = !twoFactorEnabled;
    setTwoFactorEnabled(newValue);
    localStorage.setItem('twoFactorEnabled', String(newValue));
    alert(newValue ? 'Autenticação de dois fatores ativada!' : 'Autenticação de dois fatores desativada!');
  };

  const toggleWidget = async (widgetKey: string) => {
    const updated = { ...enabledWidgets, [widgetKey]: !enabledWidgets[widgetKey] };
    setEnabledWidgets(updated);
    localStorage.setItem('enabledWidgets', JSON.stringify(updated));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await updateProfile(user.id, { enabled_widgets: updated });
      }
    } catch (error) {
      console.error('Error saving widget preferences:', error);
    }
  };

  const tabs = [
    { id: 'profile' as SettingsTab, icon: 'person', label: 'Perfil' },
    { id: 'appearance' as SettingsTab, icon: 'palette', label: 'Aparência' },
    { id: 'widgets' as SettingsTab, icon: 'dashboard_customize', label: 'Widgets' },
    { id: 'notifications' as SettingsTab, icon: 'notifications', label: 'Notificações' },
    { id: 'security' as SettingsTab, icon: 'lock', label: 'Segurança' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Configurações</h1>
          <p className="text-subtext-dark">Personalize o seu painel e as preferências da conta.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-surface-dark p-4 rounded-2xl border border-border-dark">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center p-3 rounded-xl font-medium transition-colors ${activeTab === tab.id
                    ? 'bg-background-dark text-text-dark'
                    : 'text-subtext-dark hover:bg-background-dark hover:text-text-dark'
                    }`}
                >
                  <span className={`material-icons-outlined mr-3 ${activeTab === tab.id ? 'text-primary' : ''}`}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>
            <div className="pt-4 mt-4 border-t border-border-dark">
              <button
                onClick={handleLogout}
                className="w-full flex items-center p-3 rounded-xl font-medium transition-colors text-chart-red hover:bg-chart-red/10"
              >
                <span className="material-icons-outlined mr-3">logout</span>
                Sair da Conta
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark">
              <h3 className="text-xl font-bold mb-6 text-text-dark">Perfil</h3>

              {/* Profile Image Upload */}
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
                <img
                  alt="User avatar"
                  className="w-20 h-20 rounded-full border-4 border-background-dark shadow-md object-cover"
                  src={profileImage}
                />
                <div className="flex items-center space-x-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                  >
                    Alterar foto
                  </button>
                  <button
                    onClick={handleRemoveImage}
                    className="px-4 py-2 text-sm font-semibold rounded-xl border border-border-dark hover:bg-background-dark text-text-dark transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-sm font-medium text-subtext-dark" htmlFor="name">Nome</label>
                  <input
                    className="w-full mt-2 p-3 rounded-xl bg-background-dark border-none focus:ring-2 focus:ring-primary text-text-dark placeholder-subtext-dark"
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-subtext-dark" htmlFor="email">E-mail</label>
                  <input
                    className="w-full mt-2 p-3 rounded-xl bg-background-dark border-none focus:ring-2 focus:ring-primary text-text-dark placeholder-subtext-dark"
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-subtext-dark" htmlFor="bio">Biografia</label>
                  <textarea
                    className="w-full mt-2 p-3 rounded-xl bg-background-dark border-none focus:ring-2 focus:ring-primary h-24 text-text-dark placeholder-subtext-dark resize-none"
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-subtext-dark" htmlFor="location">Localização (Cidade)</label>
                  <input
                    className="w-full mt-2 p-3 rounded-xl bg-background-dark border-none focus:ring-2 focus:ring-primary text-text-dark placeholder-subtext-dark"
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: São Paulo, SP"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  className="px-8 py-3 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                >
                  Salvar alterações
                </button>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark">
              <h3 className="text-xl font-bold mb-6 text-text-dark">Aparência</h3>
              <div className="space-y-4">
                <p className="text-sm font-medium text-subtext-dark">Tema</p>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`p-4 rounded-xl border transition-colors flex flex-col items-center justify-center gap-2 group relative ${theme === 'light' ? 'border-2 border-primary bg-primary/10' : 'border-border-dark hover:border-primary bg-background-dark'
                      }`}
                  >
                    {theme === 'light' && <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></div>}
                    <span className={`material-icons-outlined ${theme === 'light' ? 'text-primary' : 'text-subtext-dark group-hover:text-primary'}`}>
                      light_mode
                    </span>
                    <span className="font-semibold text-sm text-text-dark">Claro</span>
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`p-4 rounded-xl border transition-colors flex flex-col items-center justify-center gap-2 relative ${theme === 'dark' ? 'border-2 border-primary bg-primary/10' : 'border-border-dark hover:border-primary bg-background-dark'
                      }`}
                  >
                    {theme === 'dark' && <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></div>}
                    <span className={`material-icons-outlined ${theme === 'dark' ? 'text-primary' : 'text-subtext-dark hover:text-primary'}`}>
                      dark_mode
                    </span>
                    <span className="font-semibold text-sm text-text-dark">Escuro</span>
                  </button>
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`p-4 rounded-xl border transition-colors flex flex-col items-center justify-center gap-2 group relative ${theme === 'system' ? 'border-2 border-primary bg-primary/10' : 'border-border-dark hover:border-primary bg-background-dark'
                      }`}
                  >
                    {theme === 'system' && <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></div>}
                    <span className={`material-icons-outlined ${theme === 'system' ? 'text-primary' : 'text-subtext-dark group-hover:text-primary'}`}>
                      devices
                    </span>
                    <span className="font-semibold text-sm text-text-dark">Sistema</span>
                  </button>
                </div>
                <p className="text-xs text-subtext-dark mt-4">
                  {theme === 'system' ? 'O tema seguirá as configurações do seu sistema operacional' : `Tema ${theme === 'light' ? 'claro' : 'escuro'} selecionado`}
                </p>
              </div>
            </div>
          )}

          {/* Widgets Tab */}
          {activeTab === 'widgets' && (
            <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark">
              <h3 className="text-xl font-bold mb-2 text-text-dark">Widgets do Dashboard</h3>
              <p className="text-sm text-subtext-dark mb-6">
                Personalize quais widgets aparecem no seu painel principal
              </p>

              <div className="space-y-4">
                {/* Urgent Banner Widget */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-border-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent3/20 flex items-center justify-center">
                      <span className="material-icons-outlined text-accent3">priority_high</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">Banner de Urgência</p>
                      <p className="text-sm text-subtext-dark">Exibe tarefas urgentes em destaque</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWidget('urgentBanner')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledWidgets.urgentBanner ? 'bg-primary' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledWidgets.urgentBanner ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* Productivity Chart Widget */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-border-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent1/20 flex items-center justify-center">
                      <span className="material-icons-outlined text-accent1">bar_chart</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">Gráfico de Produtividade</p>
                      <p className="text-sm text-subtext-dark">Visualize tarefas concluídas por período</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWidget('productivityChart')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledWidgets.productivityChart ? 'bg-primary' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledWidgets.productivityChart ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* Tasks Today Widget */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-border-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <span className="material-icons-outlined text-primary">check_circle</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">Tarefas de Hoje</p>
                      <p className="text-sm text-subtext-dark">Lista rápida de tarefas pendentes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWidget('tasksToday')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledWidgets.tasksToday ? 'bg-primary' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledWidgets.tasksToday ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* Agenda Widget */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-border-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent2/20 flex items-center justify-center">
                      <span className="material-icons-outlined text-accent2">event</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">Agenda</p>
                      <p className="text-sm text-subtext-dark">Próximos eventos do calendário</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWidget('agenda')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledWidgets.agenda ? 'bg-primary' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledWidgets.agenda ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* AI Assistant Widget */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-border-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-chart-purple/20 flex items-center justify-center">
                      <span className="material-icons-outlined text-chart-purple">smart_toy</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">Assistente IA</p>
                      <p className="text-sm text-subtext-dark">Chat inteligente com contexto do dashboard</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWidget('aiAssistant')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledWidgets.aiAssistant ? 'bg-primary' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledWidgets.aiAssistant ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* Financial Summary Widget */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-border-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-chart-green/20 flex items-center justify-center">
                      <span className="material-icons-outlined text-chart-green">account_balance_wallet</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">Resumo Financeiro</p>
                      <p className="text-sm text-subtext-dark">Saldo, receitas e despesas do mês</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWidget('financialSummary')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledWidgets.financialSummary ? 'bg-primary' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledWidgets.financialSummary ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* Motivational Quote Widget */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-border-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent3/20 flex items-center justify-center">
                      <span className="material-icons-outlined text-accent3">format_quote</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">Mensagem Motivacional</p>
                      <p className="text-sm text-subtext-dark">Frase inspiradora que muda diariamente</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWidget('motivationalQuote')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledWidgets.motivationalQuote ? 'bg-primary' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledWidgets.motivationalQuote ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* Quick Stats Widget */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-border-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent2/20 flex items-center justify-center">
                      <span className="material-icons-outlined text-accent2">analytics</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">Estatísticas Rápidas</p>
                      <p className="text-sm text-subtext-dark">Métricas de produtividade em cards</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWidget('quickStats')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledWidgets.quickStats ? 'bg-primary' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledWidgets.quickStats ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* Daily Goal Widget */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-border-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <span className="material-icons-outlined text-primary">flag</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">Meta do Dia</p>
                      <p className="text-sm text-subtext-dark">Defina e acompanhe sua meta principal</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWidget('dailyGoal')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledWidgets.dailyGoal ? 'bg-primary' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledWidgets.dailyGoal ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* Pomodoro Timer Widget */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-border-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-chart-red/20 flex items-center justify-center">
                      <span className="material-icons-outlined text-chart-red">timer</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">Pomodoro Timer</p>
                      <p className="text-sm text-subtext-dark">Timer de 25min para sessões de foco</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWidget('pomodoroTimer')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledWidgets.pomodoroTimer ? 'bg-primary' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledWidgets.pomodoroTimer ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* Streak Widget */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-border-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <span className="material-icons-outlined text-primary">local_fire_department</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">Sequência (Streak)</p>
                      <p className="text-sm text-subtext-dark">Dias consecutivos completando tarefas</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWidget('streak')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledWidgets.streak ? 'bg-primary' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledWidgets.streak ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* Weekly Progress Widget */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-border-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent1/20 flex items-center justify-center">
                      <span className="material-icons-outlined text-accent1">trending_up</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">Progresso Semanal</p>
                      <p className="text-sm text-subtext-dark">Barra de progresso visual da semana</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWidget('weeklyProgress')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledWidgets.weeklyProgress ? 'bg-primary' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledWidgets.weeklyProgress ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* Weather Widget */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-border-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent2/20 flex items-center justify-center">
                      <span className="material-icons-outlined text-accent2">wb_sunny</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">Clima</p>
                      <p className="text-sm text-subtext-dark">Temperatura e condições do tempo</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWidget('weather')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledWidgets.weather ? 'bg-primary' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledWidgets.weather ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* Quick Notes Widget */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-border-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent3/20 flex items-center justify-center">
                      <span className="material-icons-outlined text-accent3">sticky_note_2</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">Notas Rápidas</p>
                      <p className="text-sm text-subtext-dark">Bloco de notas integrado ao dashboard</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWidget('quickNotes')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledWidgets.quickNotes ? 'bg-primary' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledWidgets.quickNotes ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* Achievements Widget */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-border-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-chart-yellow/20 flex items-center justify-center">
                      <span className="material-icons-outlined text-chart-yellow">emoji_events</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">Conquistas</p>
                      <p className="text-sm text-subtext-dark">Badges e gamificação de produtividade</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWidget('achievements')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledWidgets.achievements ? 'bg-primary' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledWidgets.achievements ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="material-icons-outlined text-primary mt-0.5">info</span>
                  <div>
                    <p className="text-sm font-semibold text-text-dark">Dica</p>
                    <p className="text-sm text-subtext-dark mt-1">
                      As alterações são salvas automaticamente e aplicadas imediatamente no Dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark">
              <h3 className="text-xl font-bold mb-6 text-text-dark">Notificações</h3>
              <div className="space-y-6">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text-dark">Notificações por E-mail</p>
                    <p className="text-sm text-subtext-dark">Receba atualizações importantes por e-mail</p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotifications ? 'bg-primary' : 'bg-gray-600'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text-dark">Notificações Push</p>
                    <p className="text-sm text-subtext-dark">Receba notificações no navegador</p>
                  </div>
                  <button
                    onClick={() => setPushNotifications(!pushNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pushNotifications ? 'bg-primary' : 'bg-gray-600'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {/* Task Reminders */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text-dark">Lembretes de Tarefas</p>
                    <p className="text-sm text-subtext-dark">Seja lembrado sobre tarefas próximas ao prazo</p>
                  </div>
                  <button
                    onClick={() => setTaskReminders(!taskReminders)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${taskReminders ? 'bg-primary' : 'bg-gray-600'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${taskReminders ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {/* Weekly Report */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text-dark">Relatório Semanal</p>
                    <p className="text-sm text-subtext-dark">Receba um resumo semanal da sua produtividade</p>
                  </div>
                  <button
                    onClick={() => setWeeklyReport(!weeklyReport)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${weeklyReport ? 'bg-primary' : 'bg-gray-600'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${weeklyReport ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSaveNotifications}
                  className="px-8 py-3 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                >
                  Salvar preferências
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Change Password */}
              <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark">
                <h3 className="text-xl font-bold mb-6 text-text-dark">Alterar Senha</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-subtext-dark">Senha Atual</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full mt-2 p-3 rounded-xl bg-background-dark border-none focus:ring-2 focus:ring-primary text-text-dark"
                      placeholder="Digite sua senha atual"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-subtext-dark">Nova Senha</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full mt-2 p-3 rounded-xl bg-background-dark border-none focus:ring-2 focus:ring-primary text-text-dark"
                      placeholder="Digite sua nova senha"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-subtext-dark">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full mt-2 p-3 rounded-xl bg-background-dark border-none focus:ring-2 focus:ring-primary text-text-dark"
                      placeholder="Confirme sua nova senha"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    className="w-full px-6 py-3 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    Alterar Senha
                  </button>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark">
                <h3 className="text-xl font-bold mb-4 text-text-dark">Autenticação de Dois Fatores</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text-dark">2FA</p>
                    <p className="text-sm text-subtext-dark">Adicione uma camada extra de segurança à sua conta</p>
                  </div>
                  <button
                    onClick={toggleTwoFactor}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${twoFactorEnabled ? 'bg-primary' : 'bg-gray-600'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;