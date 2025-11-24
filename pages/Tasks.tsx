import React, { useState } from 'react';
import confetti from 'canvas-confetti';

import { Task } from '../types';

interface TasksProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}


import { supabase } from '../src/supabaseClient';

const Tasks: React.FC<TasksProps> = ({ tasks, setTasks }) => {
  const [filter, setFilter] = useState<string>('Todas');
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskTag, setNewTaskTag] = useState<'Trabalho' | 'Pessoal' | 'Projetos' | 'Geral'>('Geral');

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<number | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Set transparent drag image or custom styling if needed
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: 'todo' | 'in_progress' | 'done') => {
    e.preventDefault();
    if (draggedTaskId === null) return;

    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task) return;

    // Optimistic update
    const updatedTasks = tasks.map(t => {
      if (t.id === draggedTaskId) {
        return {
          ...t,
          status: newStatus,
          completed: newStatus === 'done'
        };
      }
      return t;
    });
    setTasks(updatedTasks);
    setDraggedTaskId(null);

    // Persist to Supabase
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed: newStatus === 'done'
        })
        .eq('id', draggedTaskId);

      if (error) throw error;

      if (newStatus === 'done' && !task.completed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#EF6461', '#5E5CE6', '#02A299', '#FBBF24'],
          disableForReducedMotion: true
        });
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Erro ao atualizar status da tarefa');
    }
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (activeMenuTaskId !== null &&
        !target.closest('.task-menu-trigger') &&
        !target.closest('.task-menu-dropdown')) {
        setActiveMenuTaskId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuTaskId]);

  const handleEditClick = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskDate(task.date || '');
    setNewTaskTime(task.time || '');
    setNewTaskTag(task.tag);
    setIsUrgent(task.urgent);
    setIsAdding(true);
    setActiveMenuTaskId(null);
  };

  const handleDeleteClick = async (id: number) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== id));
      setActiveMenuTaskId(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Erro ao excluir tarefa');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    let tagColor = 'bg-gray-500/20 text-gray-400';
    if (newTaskTag === 'Trabalho') tagColor = 'bg-accent1/20 text-accent1';
    if (newTaskTag === 'Pessoal') tagColor = 'bg-blue-500/20 text-blue-400';
    if (newTaskTag === 'Projetos') tagColor = 'bg-accent2/20 text-accent2';

    const subtitle = newTaskDate && newTaskTime ? `Vence em ${newTaskDate} às ${newTaskTime}` :
      newTaskDate ? `Vence em ${newTaskDate}` : 'Sem prazo definido';

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Usuário não autenticado');
        return;
      }

      if (editingTaskId) {
        // Update existing task
        const { error } = await supabase
          .from('tasks')
          .update({
            title: newTaskTitle,
            subtitle: subtitle,
            urgent: isUrgent,
            tag: newTaskTag,
            tag_color: tagColor,
            // date and time are not separate columns in my schema, but I can store them in created_at or add columns.
            // For now, I'll rely on client-side state or update schema. 
            // Wait, I should probably use the columns if I want to query by date.
            // The schema I saw earlier: id, user_id, title, subtitle, urgent, tag, tag_color, completed, created_at.
            // It does NOT have separate date/time columns. I will stick to created_at or just subtitle for display for now, 
            // OR I can add them. For simplicity, I will just update the fields I have.
          })
          .eq('id', editingTaskId);

        if (error) throw error;

        setTasks(tasks.map(t => t.id === editingTaskId ? {
          ...t,
          title: newTaskTitle,
          subtitle,
          urgent: isUrgent,
          tag: newTaskTag,
          tagColor,
          date: newTaskDate,
          time: newTaskTime
        } : t));

      } else {
        // Create new task
        const { data, error } = await supabase
          .from('tasks')
          .insert([{
            user_id: user.id,
            title: newTaskTitle,
            subtitle: subtitle,
            urgent: isUrgent,
            tag: newTaskTag,
            tag_color: tagColor,
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
            completed: data[0].completed,
            date: newTaskDate,
            time: newTaskTime
          };
          setTasks([newTask, ...tasks]);
        }
      }

      // Reset form
      setNewTaskTitle('');
      setNewTaskDate('');
      setNewTaskTime('');
      setNewTaskTag('Geral');
      setIsUrgent(false);
      setIsAdding(false);
      setEditingTaskId(null);

    } catch (error) {
      console.error('Error saving task:', error);
      alert('Erro ao salvar tarefa');
    }
  };


  const toggleTask = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newCompletedStatus = !task.completed;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: newCompletedStatus })
        .eq('id', id);

      if (error) throw error;

      setTasks(tasks.map(t => {
        if (t.id === id) {
          if (newCompletedStatus) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#EF6461', '#5E5CE6', '#02A299', '#FBBF24'],
              disableForReducedMotion: true
            });
          }
          return { ...t, completed: newCompletedStatus };
        }
        return t;
      }));
    } catch (error) {
      console.error('Error toggling task:', error);
      alert('Erro ao atualizar tarefa');
    }
  };

  const filteredTasks = filter === 'Todas' ? tasks : tasks.filter(t => t.tag === filter);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Lista de Tarefas</h1>
          <p className="text-subtext-dark">Organize, priorize e conquiste suas tarefas.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-dark border border-border-dark text-text-dark hover:bg-gray-700 transition-colors">
            <span className="material-icons-outlined">search</span>
          </button>
          <button className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-dark border border-border-dark relative text-text-dark hover:bg-gray-700 transition-colors">
            <span className="material-icons-outlined">notifications</span>
            <span className="absolute top-3 right-3 block h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          </button>
        </div>
      </header>

      <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark">
        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
            {['Todas', 'Trabalho', 'Pessoal', 'Projetos'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${filter === f
                  ? 'bg-accent1/20 text-accent1'
                  : 'text-subtext-dark hover:bg-background-dark hover:text-text-dark'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
          <button className="flex items-center space-x-2 text-subtext-dark hover:text-text-dark transition-colors">
            <span className="material-icons-outlined text-xl">filter_list</span>
            <span className="text-sm">Filtrar</span>
          </button>
          <button className="flex items-center space-x-2 text-subtext-dark hover:text-text-dark transition-colors">
            <span className="material-icons-outlined text-xl">sort</span>
            <span className="text-sm">Ordenar</span>
          </button>
          <button
            onClick={() => {
              setEditingTaskId(null);
              setNewTaskTitle('');
              setNewTaskDate('');
              setNewTaskTime('');
              setNewTaskTag('Geral');
              setIsUrgent(false);
              setIsAdding(!isAdding);
            }}
            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
          >
            <span className="material-icons-outlined text-xl">add</span>
            <span className="hidden sm:inline">Nova Tarefa</span>
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <form onSubmit={handleAddTask} className="bg-surface-dark w-full max-w-md rounded-2xl border border-border-dark shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border-dark flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-dark">{editingTaskId ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
              <button type="button" onClick={() => setIsAdding(false)} className="text-subtext-dark hover:text-text-dark">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-subtext-dark uppercase mb-1">Título da Tarefa</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Ex: Finalizar apresentação..."
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-text-dark outline-none focus:border-primary transition-colors"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-subtext-dark uppercase mb-1">Data</label>
                  <input
                    type="date"
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-text-dark outline-none focus:border-primary transition-colors"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-subtext-dark uppercase mb-1">Horário</label>
                  <input
                    type="time"
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-text-dark outline-none focus:border-primary transition-colors"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-subtext-dark uppercase mb-2">Categoria</label>
                <div className="flex flex-wrap gap-2">
                  {(['Trabalho', 'Pessoal', 'Projetos', 'Geral'] as const).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNewTaskTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${newTaskTag === tag
                        ? 'bg-primary border-primary text-white'
                        : 'bg-background-dark border-border-dark text-subtext-dark hover:border-gray-500'
                        }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-background-dark rounded-xl border border-border-dark cursor-pointer" onClick={() => setIsUrgent(!isUrgent)}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isUrgent ? 'bg-chart-red border-chart-red' : 'border-gray-500'}`}>
                  {isUrgent && <span className="material-icons-outlined text-white text-xs">check</span>}
                </div>
                <span className={`text-sm font-medium ${isUrgent ? 'text-chart-red' : 'text-subtext-dark'}`}>Marcar como Urgente</span>
              </div>
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
                {editingTaskId ? 'Salvar Alterações' : 'Criar Tarefa'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center p-4 rounded-xl bg-background-dark border-l-4 transition-all hover:bg-background-dark/80 ${task.urgent && !task.completed ? 'border-primary' :
              task.tag === 'Projetos' && !task.completed ? 'border-accent2' :
                'border-transparent'
              }`}
          >
            <div
              onClick={() => toggleTask(task.id)}
              className={`h-6 w-6 rounded-md border flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${task.completed ? 'bg-primary border-primary opacity-60' : 'border-subtext-dark hover:border-primary'
                }`}
            >
              {task.completed && <span className="material-icons-outlined text-white text-sm">check</span>}
            </div>

            <div className="ml-4 flex-grow min-w-0">
              <p className={`font-semibold truncate ${task.completed ? 'text-subtext-dark line-through' : 'text-text-dark'}`}>
                {task.title}
              </p>
              <p className={`text-xs truncate ${task.completed ? 'text-subtext-dark line-through' : 'text-subtext-dark'}`}>
                {task.subtitle}
              </p>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 ml-4 flex-shrink-0">
              {task.urgent && !task.completed && (
                <span className="hidden sm:inline-block text-xs font-medium px-2 py-1 rounded-full bg-accent3/20 text-accent3">Urgente</span>
              )}
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${task.tagColor}`}>
                {task.tag}
              </span>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id);
                  }}
                  className="task-menu-trigger text-subtext-dark hover:text-text-dark transition-colors p-1 rounded-full hover:bg-surface-dark"
                >
                  <span className="material-icons-outlined text-xl">more_vert</span>
                </button>

                {activeMenuTaskId === task.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface-dark border border-border-dark rounded-xl shadow-xl z-10 overflow-hidden animate-fade-in task-menu-dropdown">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(task);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-text-dark hover:bg-background-dark flex items-center gap-2 transition-colors"
                    >
                      <span className="material-icons-outlined text-lg">edit</span>
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(task.id);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-chart-red hover:bg-chart-red/10 flex items-center gap-2 transition-colors border-t border-border-dark"
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

      {/* Kanban Board Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-text-dark mb-6">Quadro Kanban</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* To Do Column */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'todo')}
            className="bg-surface-dark/50 p-4 rounded-2xl border border-border-dark min-h-[400px]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-dark flex items-center">
                <div className="w-3 h-3 rounded-full bg-subtext-dark mr-2"></div>
                A Fazer
              </h3>
              <span className="bg-background-dark text-subtext-dark text-xs px-2 py-1 rounded-full">
                {filteredTasks.filter(t => !t.completed && (!t.status || t.status === 'todo')).length}
              </span>
            </div>
            <div className="space-y-3">
              {filteredTasks.filter(t => !t.completed && (!t.status || t.status === 'todo')).map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="bg-background-dark p-4 rounded-xl border border-border-dark cursor-move hover:border-primary transition-colors shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${task.tagColor}`}>{task.tag}</span>
                    <div className="flex items-center space-x-1">
                      {task.urgent && <span className="material-icons-outlined text-chart-red text-base">priority_high</span>}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(task.id);
                        }}
                        className="text-subtext-dark hover:text-chart-red transition-colors"
                        title="Excluir tarefa"
                      >
                        <span className="material-icons-outlined text-base">close</span>
                      </button>
                    </div>
                  </div>
                  <h4 className="font-semibold text-text-dark text-sm mb-1">{task.title}</h4>
                  <p className="text-xs text-subtext-dark">{task.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          {/* In Progress Column */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'in_progress')}
            className="bg-surface-dark/50 p-4 rounded-2xl border border-border-dark min-h-[400px]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-dark flex items-center">
                <div className="w-3 h-3 rounded-full bg-chart-blue mr-2"></div>
                Em Progresso
              </h3>
              <span className="bg-background-dark text-subtext-dark text-xs px-2 py-1 rounded-full">
                {filteredTasks.filter(t => !t.completed && t.status === 'in_progress').length}
              </span>
            </div>
            <div className="space-y-3">
              {filteredTasks.filter(t => !t.completed && t.status === 'in_progress').map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="bg-background-dark p-4 rounded-xl border-l-4 border-chart-blue cursor-move hover:bg-background-dark/80 transition-colors shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${task.tagColor}`}>{task.tag}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(task.id);
                      }}
                      className="text-subtext-dark hover:text-chart-red transition-colors"
                      title="Excluir tarefa"
                    >
                      <span className="material-icons-outlined text-base">close</span>
                    </button>
                  </div>
                  <h4 className="font-semibold text-text-dark text-sm mb-1">{task.title}</h4>
                  <p className="text-xs text-subtext-dark">{task.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Done Column */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'done')}
            className="bg-surface-dark/50 p-4 rounded-2xl border border-border-dark min-h-[400px]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-dark flex items-center">
                <div className="w-3 h-3 rounded-full bg-chart-green mr-2"></div>
                Concluído
              </h3>
              <span className="bg-background-dark text-subtext-dark text-xs px-2 py-1 rounded-full">
                {filteredTasks.filter(t => t.completed || t.status === 'done').length}
              </span>
            </div>
            <div className="space-y-3">
              {filteredTasks.filter(t => t.completed || t.status === 'done').map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="bg-background-dark p-4 rounded-xl border border-border-dark opacity-60 cursor-move hover:opacity-100 transition-opacity shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${task.tagColor}`}>{task.tag}</span>
                    <div className="flex items-center space-x-1">
                      <span className="material-icons-outlined text-chart-green text-base">check_circle</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(task.id);
                        }}
                        className="text-subtext-dark hover:text-chart-red transition-colors ml-1"
                        title="Excluir tarefa"
                      >
                        <span className="material-icons-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                  <h4 className="font-semibold text-text-dark text-sm mb-1 line-through">{task.title}</h4>
                  <p className="text-xs text-subtext-dark">{task.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default Tasks;