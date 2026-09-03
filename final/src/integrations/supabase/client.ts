import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://phofbsnkmppclqzrdfkj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBob2Zic25rbXBwY2xxenJkZmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNTk1ODcsImV4cCI6MjA5NjczNTU4N30.E8gks0w_STqiW0QqurRUVkRG9TizC7eNeWs8q35XdE8";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
