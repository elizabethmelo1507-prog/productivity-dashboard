import { supabase } from '../supabaseClient';

export const getGoogleCalendarEvents = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !session.provider_token) {
        console.warn('No provider token found. User might not be logged in with Google.');
        return [];
    }

    try {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + new Date().toISOString() + '&singleEvents=true&orderBy=startTime', {
            headers: {
                'Authorization': `Bearer ${session.provider_token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch Google Calendar events');
        }

        const data = await response.json();

        return data.items.map((item: any) => ({
            id: item.id,
            title: item.summary,
            date: item.start.dateTime ? item.start.dateTime.split('T')[0] : item.start.date,
            startTime: item.start.dateTime ? new Date(item.start.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Dia todo',
            endTime: item.end.dateTime ? new Date(item.end.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
            location: item.location,
            category: 'Google Agenda', // Special category for Google events
            notes: [item.description || ''],
            isGoogleEvent: true
        }));

    } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        return [];
    }
};

export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            scopes: 'https://www.googleapis.com/auth/calendar.readonly',
            redirectTo: window.location.origin
        }
    });

    if (error) throw error;
    return data;
};
