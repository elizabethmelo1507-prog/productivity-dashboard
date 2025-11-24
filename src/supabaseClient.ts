import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fumsdepbiyvgmcjbrciz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bXNkZXBiaXl2Z21jamJyY2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODM1NjYsImV4cCI6MjA3OTM1OTU2Nn0.iMpYDDlzwYDJIF7kp3xlMIoCJDeQ851JwDfAlTKFa10';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
