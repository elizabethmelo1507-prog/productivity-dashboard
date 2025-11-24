import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent } from '../types';

import { supabase } from '../src/supabaseClient';

const Calendar: React.FC = () => {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventMenuOpen, setEventMenuOpen] = useState<number | null>(null);
  const [newNote, setNewNote] = useState('');

  // Form states
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventStartTime, setNewEventStartTime] = useState('');
  const [newEventEndTime, setNewEventEndTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<CalendarEvent['category']>('Outros');

  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('calendar_events')
          .select('*')
          .order('start_time', { ascending: true });

        if (error) throw error;

        if (data) {
          const mappedEvents: CalendarEvent[] = data.map(e => {
            // Extract time from timestamp or use stored time string if I decide to change schema.
            // Current schema has start_time as timestamptz.
            // But the UI expects "HH:MM".
            // If I stored full timestamp, I need to extract HH:MM.
            // However, when I insert, I'll construct the timestamp.

            const start = new Date(e.start_time);
            const end = new Date(e.end_time);

            return {
              id: e.id,
              title: e.title,
              date: e.event_date,
              startTime: start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              endTime: end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              location: '', // Not in DB yet
              category: e.color as any, // Storing category in 'color' column
              notes: e.description ? [e.description] : []
            };
          });
          setEvents(mappedEvents);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // Category color mapping
  const categoryColors = {
    'Trabalho': { bg: 'bg-chart-green/20', border: 'border-chart-green', text: 'text-chart-green' },
    'Projetos Pessoais': { bg: 'bg-chart-yellow/20', border: 'border-chart-yellow', text: 'text-chart-yellow' },
    'Importante': { bg: 'bg-chart-red/20', border: 'border-chart-red', text: 'text-chart-red' },
    'Outros': { bg: 'bg-chart-blue/20', border: 'border-chart-blue', text: 'text-chart-blue' }
  };

  // Close event menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (eventMenuOpen !== null) {
        setEventMenuOpen(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [eventMenuOpen]);

  // Date navigation
  const goToToday = () => {
    setShowTodayOnly(true);
    setCurrentDate(new Date());
  };

  const navigatePrev = () => {
    setShowTodayOnly(false);
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    setShowTodayOnly(false);
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Get week days
  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Get month days
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    // const lastDay = new Date(year, month + 1, 0); // This line is not used in the current logic

    // Start from the Sunday before the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Generate 6 weeks (42 days) to cover all possible month layouts
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i); // Corrected: Add 'i' days to the *current* date object
      days.push(date);
    }

    return days;
  };

  const weekDays = useMemo(() => getWeekDays(), [currentDate]);
  const monthDays = useMemo(() => getMonthDays(), [currentDate]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Add event
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventDate || !newEventStartTime || !newEventEndTime || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Usuário não autenticado');
        return;
      }

      // Construct timestamps
      const startDateTime = new Date(`${newEventDate}T${newEventStartTime}`);
      const endDateTime = new Date(`${newEventDate}T${newEventEndTime}`);

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
          user_id: user.id,
          title: newEventTitle,
          description: '', // Initial description empty
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          color: newEventCategory, // Storing category in color column
          event_date: newEventDate
        }])
        .select();

      if (error) throw error;

      if (data) {
        const newEvent: CalendarEvent = {
          id: data[0].id,
          title: data[0].title,
          date: data[0].event_date,
          startTime: newEventStartTime,
          endTime: newEventEndTime,
          location: newEventLocation,
          category: data[0].color as any,
          notes: []
        };
        setEvents([...events, newEvent]);
      }

      // Reset form
      setNewEventTitle('');
      setNewEventDate('');
      setNewEventStartTime('');
      setNewEventEndTime('');
      setNewEventLocation('');
      setNewEventCategory('Outros');
      setIsAddingEvent(false);

    } catch (error) {
      console.error('Error adding event:', error);
      alert('Erro ao adicionar evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId: number) => {
    try {
      const { error } = await supabase.from('calendar_events').delete().eq('id', eventId);
      if (error) throw error;
      setEvents(events.filter(e => e.id !== eventId));
      setEventMenuOpen(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Erro ao excluir evento');
    }
  };

  // Add note to event
  const handleAddNote = async () => {
    if (!selectedEvent || !newNote.trim()) return;

    // We are storing notes in 'description'. 
    // If there are existing notes, we append.
    // Since the UI treats notes as an array, we'll join them.
    const updatedNotes = [...selectedEvent.notes, newNote];
    const description = updatedNotes.join('\n');

    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({ description: description })
        .eq('id', selectedEvent.id);

      if (error) throw error;

      setEvents(events.map(e =>
        e.id === selectedEvent.id
          ? { ...e, notes: updatedNotes }
          : e
      ));

      setSelectedEvent({
        ...selectedEvent,
        notes: updatedNotes
      });

      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Erro ao adicionar nota');
    }
  };

  // Format date range display
  const getDateRangeText = () => {
    if (view === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.getDate()}-${end.getDate()} de ${start.toLocaleDateString('pt-BR', { month: 'long' })}, ${start.getFullYear()}`;
    } else {
      return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const dayLabels = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col h-full pb-24">
      <header className="flex items-center justify-between mb-8 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Calendário</h1>
          <p className="text-subtext-dark">Visão geral da sua semana e próximos eventos.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsAddingEvent(true)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors"
          >
            <span className="material-icons-outlined">add</span>
          </button>
        </div>
      </header>

      <div className="bg-surface-dark p-4 md:p-6 rounded-2xl flex flex-col flex-grow border border-border-dark overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row items-center justify-between mb-6 gap-4 flex-shrink-0">
          <div className="flex items-center space-x-2 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setView('week');
                  setShowTodayOnly(false);
                }}
                className={`px-4 py-2 ${view === 'week' ? 'bg-primary text-white' : 'text-subtext-dark hover:bg-background-dark'} rounded-full text-sm font-semibold transition-colors`}
              >
                Semana
              </button>
              <button
                onClick={() => {
                  setView('month');
                  setShowTodayOnly(false);
                }}
                className={`px-4 py-2 ${view === 'month' ? 'bg-primary text-white' : 'text-subtext-dark hover:bg-background-dark'} rounded-full text-sm font-semibold transition-colors`}
              >
                Mês
              </button>
            </div>
          </div>

          <div className="flex items-center text-sm">
            <button
              onClick={navigatePrev}
              className="p-2 rounded-full hover:bg-background-dark text-text-dark transition-colors"
            >
              <span className="material-icons-outlined">chevron_left</span>
            </button>
            <span className="font-semibold text-text-dark text-base mx-4 min-w-[200px] text-center">{getDateRangeText()}</span>
            <button
              onClick={navigateNext}
              className="p-2 rounded-full hover:bg-background-dark text-text-dark transition-colors"
            >
              <span className="material-icons-outlined">chevron_right</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 w-full lg:w-auto justify-end">
            <button
              onClick={goToToday}
              className="flex items-center space-x-2 px-4 py-2 text-subtext-dark hover:bg-background-dark rounded-full text-sm font-semibold transition-colors"
            >
              <span className="material-icons-outlined text-base">today</span>
              <span>Hoje</span>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        {showTodayOnly ? (
          // Today Only View
          <div className="flex-grow flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-dark">Eventos de Hoje</h2>
              <button
                onClick={() => setShowTodayOnly(false)}
                className="text-sm text-subtext-dark hover:text-text-dark transition-colors"
              >
                Ver calendário completo
              </button>
            </div>
            {(() => {
              const today = new Date();
              const todayEvents = getEventsForDate(today);

              if (todayEvents.length === 0) {
                return (
                  <div className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                      <span className="material-icons-outlined text-6xl text-subtext-dark/30 mb-4">event_busy</span>
                      <p className="text-lg text-subtext-dark">Não há eventos para hoje</p>
                      <p className="text-sm text-subtext-dark/70 mt-2">Aproveite seu dia livre!</p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-3 overflow-y-auto">
                  {todayEvents.map(event => {
                    const colors = categoryColors[event.category];
                    return (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`${colors.bg} border-l-4 ${colors.border} p-4 rounded-xl hover:brightness-110 cursor-pointer transition-all`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-grow">
                            <p className="text-lg font-semibold text-text-dark mb-1">{event.title}</p>
                            <div className="flex items-center gap-4 text-sm text-subtext-dark">
                              <div className="flex items-center gap-1">
                                <span className="material-icons-outlined text-base">schedule</span>
                                <span>{event.startTime} - {event.endTime}</span>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <span className="material-icons-outlined text-base">location_on</span>
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.text} ${colors.bg}`}>
                            {event.category}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ) : view === 'week' ? (
          // Week View
          <div className="flex-grow grid grid-cols-7 gap-px bg-border-dark border border-border-dark rounded-lg overflow-hidden">
            {weekDays.map((day, i) => {
              const dayEvents = getEventsForDate(day);
              const today = isToday(day);

              return (
                <div key={i} className="bg-surface-dark flex flex-col relative group">
                  <div className={`p-2 text-center border-b border-border-dark transition-colors ${today ? 'bg-primary/5' : ''}`}>
                    <p className="text-[10px] md:text-xs text-subtext-dark uppercase tracking-wider">{dayLabels[i]}</p>
                    <div className="relative inline-block">
                      <p className={`text-lg md:text-xl font-bold ${today ? 'text-primary' : 'text-text-dark'}`}>
                        {day.getDate()}
                      </p>
                      {today && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 bg-primary rounded-full"></div>}
                    </div>
                  </div>

                  <div className="flex-grow bg-background-dark/30 p-1 md:p-2 space-y-2 min-h-[100px] overflow-y-auto">
                    {dayEvents.map(event => {
                      const colors = categoryColors[event.category];
                      const isMenuOpen = eventMenuOpen === event.id;

                      return (
                        <div
                          key={event.id}
                          className={`${colors.bg} border-l-4 ${colors.border} p-1.5 md:p-2.5 rounded-md hover:brightness-110 cursor-pointer transition-all relative group`}
                        >
                          <div onClick={() => setSelectedEvent(event)}>
                            <p className="text-[10px] md:text-sm font-semibold text-text-dark truncate pr-6">{event.title}</p>
                            <p className="text-[9px] md:text-xs text-subtext-dark">{event.startTime} - {event.endTime}</p>
                          </div>

                          {/* Three dots menu button - appears on hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEventMenuOpen(isMenuOpen ? null : event.id);
                            }}
                            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background-dark/50 rounded"
                          >
                            <span className="material-icons-outlined text-text-dark text-sm">more_vert</span>
                          </button>

                          {/* Delete dropdown menu */}
                          {isMenuOpen && (
                            <div className="absolute top-8 right-1 bg-surface-dark border border-border-dark rounded-lg shadow-xl z-10 min-w-[140px] overflow-hidden">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEvent(event.id);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-chart-red hover:bg-background-dark transition-colors flex items-center gap-2"
                              >
                                <span className="material-icons-outlined text-base">delete</span>
                                <span>Excluir evento</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Month View - Simple traditional calendar
          <div className="flex-grow flex flex-col overflow-hidden">
            {/* Day labels header */}
            <div className="grid grid-cols-7 gap-px bg-border-dark flex-shrink-0">
              {dayLabels.map((label, i) => (
                <div key={i} className="bg-surface-dark py-3 text-center">
                  <p className="text-xs text-subtext-dark uppercase tracking-wider font-semibold">{label}</p>
                </div>
              ))}
            </div>

            {/* Calendar grid - 7 columns x 6 rows */}
            <div className="flex-grow grid grid-cols-7 grid-rows-6 gap-px bg-border-dark border border-border-dark overflow-auto">
              {monthDays.map((day, i) => {
                const dayEvents = getEventsForDate(day);
                const today = isToday(day);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={i}
                    className="bg-surface-dark p-2 overflow-hidden flex flex-col min-h-0"
                  >
                    {/* Day number at the top */}
                    <div className={`flex-shrink-0 mb-1 ${today ? 'bg-primary/10 -m-2 mb-1 p-2' : ''}`}>
                      <p className={`text-sm font-bold ${today ? 'text-primary' : isCurrentMonth ? 'text-text-dark' : 'text-subtext-dark/40'
                        }`}>
                        {day.getDate()}
                      </p>
                    </div>

                    {/* Events list below the day number */}
                    <div className="flex-grow overflow-y-auto overflow-x-hidden space-y-1">
                      {dayEvents.map(event => {
                        const colors = categoryColors[event.category];
                        return (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className={`${colors.bg} border-l-2 ${colors.border} px-1.5 py-1 rounded text-[10px] cursor-pointer hover:brightness-110 transition-all`}
                          >
                            <p className="font-semibold text-text-dark truncate">{event.title}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {isAddingEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <form onSubmit={handleAddEvent} className="bg-surface-dark w-full max-w-md rounded-2xl border border-border-dark shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border-dark flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-dark">Novo Evento</h3>
              <button type="button" onClick={() => setIsAddingEvent(false)} className="text-subtext-dark hover:text-text-dark">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-subtext-dark uppercase mb-1">Nome do Evento</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Ex: Reunião de Equipe"
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-text-dark outline-none focus:border-primary transition-colors"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-subtext-dark uppercase mb-1">Data</label>
                <input
                  type="date"
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-text-dark outline-none focus:border-primary transition-colors"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-subtext-dark uppercase mb-1">Hora Início</label>
                  <input
                    type="time"
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-text-dark outline-none focus:border-primary transition-colors"
                    value={newEventStartTime}
                    onChange={(e) => setNewEventStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-subtext-dark uppercase mb-1">Hora Fim</label>
                  <input
                    type="time"
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-text-dark outline-none focus:border-primary transition-colors"
                    value={newEventEndTime}
                    onChange={(e) => setNewEventEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-subtext-dark uppercase mb-1">Localização</label>
                <input
                  type="text"
                  placeholder="Ex: Sala de Conferências A"
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-text-dark outline-none focus:border-primary transition-colors"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-subtext-dark uppercase mb-2">Categoria</label>
                <div className="flex flex-wrap gap-2">
                  {(['Trabalho', 'Projetos Pessoais', 'Importante', 'Outros'] as const).map(cat => {
                    const colors = categoryColors[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewEventCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${newEventCategory === cat
                          ? `${colors.bg} ${colors.border} ${colors.text} border-2`
                          : 'bg-background-dark border-border-dark text-subtext-dark hover:border-gray-500'
                          }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border-dark bg-background-dark/50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsAddingEvent(false)}
                className="px-4 py-2 text-sm font-medium text-subtext-dark hover:text-text-dark transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Criando...' : 'Criar Evento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-dark w-full max-w-2xl rounded-2xl border border-border-dark shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border-dark flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-12 rounded-full ${categoryColors[selectedEvent.category].border.replace('border-', 'bg-')}`}></div>
                <div>
                  <h3 className="text-xl font-bold text-text-dark">{selectedEvent.title}</h3>
                  <p className="text-sm text-subtext-dark">{selectedEvent.category}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedEvent(null)} className="text-subtext-dark hover:text-text-dark">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <span className="material-icons-outlined text-primary">event</span>
                  <div>
                    <p className="text-xs text-subtext-dark uppercase">Data</p>
                    <p className="text-text-dark font-semibold">
                      {new Date(selectedEvent.date).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-icons-outlined text-primary">schedule</span>
                  <div>
                    <p className="text-xs text-subtext-dark uppercase">Horário</p>
                    <p className="text-text-dark font-semibold">{selectedEvent.startTime} - {selectedEvent.endTime}</p>
                  </div>
                </div>
              </div>

              {selectedEvent.location && (
                <div className="flex items-start gap-3">
                  <span className="material-icons-outlined text-primary">location_on</span>
                  <div>
                    <p className="text-xs text-subtext-dark uppercase">Localização</p>
                    <p className="text-text-dark font-semibold">{selectedEvent.location}</p>
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div className="border-t border-border-dark pt-6">
                <h4 className="text-lg font-bold text-text-dark mb-4">Notas</h4>

                <div className="space-y-3 mb-4">
                  {selectedEvent.notes.length === 0 ? (
                    <p className="text-sm text-subtext-dark italic">Nenhuma nota adicionada ainda.</p>
                  ) : (
                    selectedEvent.notes.map((note, idx) => (
                      <div key={idx} className="bg-background-dark p-3 rounded-lg border border-border-dark">
                        <p className="text-sm text-text-dark">{note}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar uma nota..."
                    className="flex-1 bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-text-dark text-sm outline-none focus:border-primary transition-colors"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-semibold text-sm"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;