import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SECRET_KEY are required.');
}

// Disables browser session storage and refresh timers for Node.js
export const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

export default supabase;