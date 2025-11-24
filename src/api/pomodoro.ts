import { supabase } from '../supabaseClient';
import { Pomodoro } from '../../types';

/**
 * Save a pomodoro session.
 * `duration` is in minutes.
 */
export const savePomodoro = async (session: Omit<Pomodoro, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('pomodoros').insert(session).select();
    if (error) throw error;
    return data as Pomodoro[];
};

/** Retrieve all pomodoro sessions for a user */
export const fetchPomodoros = async (userId: string) => {
    const { data, error } = await supabase
        .from('pomodoros')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Pomodoro[];
};
