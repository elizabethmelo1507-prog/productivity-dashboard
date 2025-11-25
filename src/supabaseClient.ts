import { createClient } from '@supabase/supabase-js';

// Use environment variables for proper deployment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fumsdepbiyvgmcjbrciz.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bXNkZXBiaXl2Z21jamJyY2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODM1NjYsImV4cCI6MjA3OTM1OTU2Nn0.iMpYDDlzwYDJIF7kp3xlMIoCJDeQ851JwDfAlTKFa10';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables!');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
