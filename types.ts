export interface Task {
    id: number;
    title: string;
    subtitle: string;
    urgent: boolean;
    tag: 'Trabalho' | 'Pessoal' | 'Projetos' | 'Geral';
    tagColor: string;
    completed: boolean;
    avatar?: string;
    deadline?: string; // Combined date and time for display or sorting
    date?: string;
    time?: string;
    created_at?: string; // ISO timestamp from database
    status?: 'todo' | 'in_progress' | 'done';
}

export interface Transaction {
    id: number;
    title: string;
    amount: number;
    type: 'income' | 'expense';
    category: 'Alimentação' | 'Transporte' | 'Moradia' | 'Lazer' | 'Saúde' | 'Educação' | 'Outros' | 'Receita';
    date: string;
}

export interface CalendarEvent {
    id: number;
    title: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    location?: string;
    category: 'Trabalho' | 'Projetos Pessoais' | 'Importante' | 'Outros' | 'Google Agenda';
    notes: string[];
    isGoogleEvent?: boolean;
}
export interface Pomodoro {
    id: number;
    user_id: string;
    duration: number; // minutes
    completed: boolean;
    created_at: string; // ISO timestamp
}

export interface Profile {
    id: string;
    full_name?: string;
    email?: string;
    bio?: string;
    location?: string;
    avatar_url?: string;
    dashboard_layout?: any;
    widgets_order?: string[];
    enabled_widgets?: Record<string, boolean>;
    theme?: 'light' | 'dark' | 'system';
    notifications_preferences?: {
        email: boolean;
        push: boolean;
        taskReminders: boolean;
        weeklyReport: boolean;
    };
    updated_at?: string;
}
