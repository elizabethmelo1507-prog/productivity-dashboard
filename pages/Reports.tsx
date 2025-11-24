import React, { useState, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Task, Pomodoro } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReportsProps {
  tasks: Task[];
  pomodoros: Pomodoro[];
}

type TimeFilter = 'today' | 'week' | 'month';

const Reports: React.FC<ReportsProps> = ({ tasks, pomodoros }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Debug: Log received data
  // console.log('📊 Reports - Total tasks:', tasks.length);

  // Helper: Get date range based on filter
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (timeFilter) {
      case 'today':
        return { start: today, end: today, label: 'Hoje' };
      case 'week': {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay()); // Sunday
        const end = new Date(start);
        end.setDate(start.getDate() + 6); // Saturday
        return { start, end, label: 'Esta Semana' };
      }
      case 'month': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { start, end, label: 'Este Mês' };
      }
    }
  };

  const dateRange = getDateRange();

  // Filter tasks by date range
  const isTaskInRange = (task: Task) => {
    let taskDate: Date | null = null;

    if (task.date) {
      // Parse YYYY-MM-DD manually to ensure local time
      // new Date("YYYY-MM-DD") parses as UTC, which can be previous day in local time
      const [year, month, day] = task.date.split('-').map(Number);
      taskDate = new Date(year, month - 1, day);
    } else if (task.created_at) {
      taskDate = new Date(task.created_at);
    } else {
      return true;
    }

    // Reset time to start of day for comparison
    const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
    return taskDateOnly >= dateRange.start && taskDateOnly <= dateRange.end;
  };

  const filteredTasks = tasks.filter(isTaskInRange);
  const completedTasks = filteredTasks.filter(t => t.completed);

  // Filter pomodoros by date range
  const isPomodoroInRange = (p: Pomodoro) => {
    const pomDate = new Date(p.created_at);
    return pomDate >= dateRange.start && pomDate <= dateRange.end;
  };
  const filteredPomodoros = pomodoros.filter(isPomodoroInRange);

  // Calculate focus hours from pomodoros (duration in minutes)
  const calculateFocusData = () => {
    const days = timeFilter === 'today' ? 1 : timeFilter === 'week' ? 7 : 30;
    const dayLabels = timeFilter === 'week'
      ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      : timeFilter === 'today'
        ? ['Hoje']
        : Array.from({ length: Math.min(days, 30) }, (_, i) => `${i + 1}`);

    const focusMap: { [key: string]: number } = {};

    filteredPomodoros.forEach(p => {
      const date = new Date(p.created_at);
      let key: string;
      if (timeFilter === 'week') {
        key = dayLabels[date.getDay()];
      } else if (timeFilter === 'today') {
        key = 'Hoje';
      } else {
        key = `${date.getDate()}`;
      }
      // convert minutes to hours
      const hours = p.duration / 60;
      focusMap[key] = (focusMap[key] || 0) + hours;
    });

    return dayLabels.map(label => ({
      name: label,
      hours: Math.round((focusMap[label] || 0) * 10) / 10,
    }));
  };

  // Calculate completion by category
  const calculateCompletion = () => {
    const categories = ['Trabalho', 'Pessoal', 'Projetos'] as const;

    return categories.map(category => {
      const total = filteredTasks.filter(t => t.tag === category).length;
      const completed = filteredTasks.filter(t => t.tag === category && t.completed).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        label: category,
        current: completed,
        total: total,
        color: category === 'Trabalho' ? 'bg-chart-green' : category === 'Pessoal' ? 'bg-chart-yellow' : 'bg-chart-blue',
        width: `${percentage}%`
      };
    });
  };

  // Calculate time distribution
  const calculateDistribution = () => {
    const totalHours = completedTasks.length * 1.5;
    const categories = ['Trabalho', 'Pessoal', 'Projetos'] as const;
    const colors = ['#02A299', '#FBBF24', '#5E5CE6'];

    return categories.map((category, index) => {
      const categoryTasks = completedTasks.filter(t => t.tag === category).length;
      const hours = categoryTasks * 1.5;
      const percentage = totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0;

      return {
        name: category,
        value: percentage,
        color: colors[index]
      };
    }).filter(item => item.value > 0);
  };

  const focusData = calculateFocusData();
  const completionData = calculateCompletion();
  const distributionData = calculateDistribution();
  const totalFocus = filteredPomodoros.reduce((sum, p) => sum + p.duration / 60, 0);
  const totalTasks = completedTasks.length;
  const totalPomodoroSessions = filteredPomodoros.length;

  // Download PDF
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#18181B',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`relatorio_${dateRange.label.toLowerCase().replace(' ', '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  // Share (copy image to clipboard)
  const handleShare = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#18181B',
        logging: false
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            alert('Relatório copiado para a área de transferência!');
          } catch (err) {
            // Fallback: download as image
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `relatorio_${dateRange.label.toLowerCase().replace(' ', '_')}.png`;
            link.click();
            URL.revokeObjectURL(url);
            alert('Relatório baixado como imagem!');
          }
        }
      });
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Erro ao compartilhar. Tente novamente.');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Relatórios</h1>
          <p className="text-subtext-dark">Sua performance detalhada.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadPDF}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-dark hover:bg-gray-700 text-text-dark transition-colors"
            title="Baixar PDF"
          >
            <span className="material-icons-outlined">download</span>
          </button>
          <button
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-dark hover:bg-gray-700 text-text-dark transition-colors"
            title="Compartilhar"
          >
            <span className="material-icons-outlined">share</span>
          </button>
        </div>
      </header>

      <div ref={reportRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Focus Chart */}
        <div className="lg:col-span-2 bg-surface-dark p-6 rounded-2xl border border-border-dark">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-text-dark">Foco</h3>
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center bg-background-dark px-3 py-1.5 rounded-full text-xs text-text-dark cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <span>{dateRange.label}</span>
                <span className="material-icons-outlined text-base ml-1">expand_more</span>
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-surface-dark border border-border-dark rounded-lg shadow-xl z-10 min-w-[150px] overflow-hidden">
                  {[
                    { key: 'today' as TimeFilter, label: 'Hoje' },
                    { key: 'week' as TimeFilter, label: 'Esta Semana' },
                    { key: 'month' as TimeFilter, label: 'Este Mês' }
                  ].map(option => (
                    <button
                      key={option.key}
                      onClick={() => {
                        setTimeFilter(option.key);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${timeFilter === option.key
                        ? 'bg-primary/20 text-primary font-semibold'
                        : 'text-text-dark hover:bg-background-dark'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={focusData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#02A299" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#02A299" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#3F3F46" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#27272A', borderColor: '#3F3F46', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value) => [`${value}h`, 'Foco']}
                />
                <Area type="monotone" dataKey="hours" stroke="#02A299" fillOpacity={1} fill="url(#colorHours)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-1">
          <div className="bg-surface-dark p-4 rounded-xl border border-border-dark flex flex-col justify-center">
            <div className="flex items-center text-subtext-dark mb-2">
              <span className="material-icons-outlined text-base mr-2">task_alt</span>
              <span className="text-sm font-medium">Tarefas</span>
            </div>
            <p className="text-3xl font-bold text-text-dark">{totalTasks}</p>
            <p className="text-xs text-subtext-dark font-medium mt-1">
              concluídas
            </p>
          </div>
          <div className="bg-surface-dark p-4 rounded-xl border border-border-dark flex flex-col justify-center">
            <div className="flex items-center text-subtext-dark mb-2">
              <span className="material-icons-outlined text-base mr-2">timer</span>
              <span className="text-sm font-medium">Foco</span>
            </div>
            <p className="text-3xl font-bold text-text-dark">{totalFocus.toFixed(1)}h</p>
            <p className="text-xs text-subtext-dark font-medium mt-1">
              de trabalho
            </p>
          </div>
          <div className="col-span-2 bg-surface-dark p-4 rounded-xl border border-border-dark">
            <h3 className="font-bold text-lg mb-4 text-text-dark">Conclusão</h3>
            <div className="space-y-4">
              {completionData.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1 text-text-dark">
                    <span>{item.label}</span>
                    <span className="text-subtext-dark">{item.current}/{item.total}</span>
                  </div>
                  <div className="w-full bg-background-dark rounded-full h-2">
                    <div className={`${item.color} h-2 rounded-full transition-all duration-500`} style={{ width: item.width }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Time Distribution */}
        <div className="lg:col-span-1 bg-surface-dark p-6 rounded-2xl border border-border-dark">
          <h3 className="font-bold text-lg mb-4 text-text-dark">Distribuição do Tempo</h3>
          <div className="flex flex-col sm:flex-row items-center">
            <div className="w-40 h-40 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="material-icons-outlined text-3xl text-subtext-dark">schedule</span>
              </div>
            </div>
            <div className="flex-1 space-y-4 mt-6 sm:mt-0 sm:ml-8 w-full">
              {distributionData.length > 0 ? distributionData.map((item, idx) => (
                <div key={idx} className="flex items-center text-sm">
                  <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></span>
                  <span className="text-text-dark">{item.name}</span>
                  <span className="ml-auto font-bold text-text-dark">{item.value}%</span>
                </div>
              )) : (
                <p className="text-sm text-subtext-dark italic">Nenhuma tarefa concluída neste período</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;