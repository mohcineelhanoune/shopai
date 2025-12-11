
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sluoqskwiudyilnehttv.supabase.co';
const supabaseKey = 'sb_publishable_iA4TMHlqOGIm_2HF140qdg_uwLggXCl';

export const supabase = createClient(supabaseUrl, supabaseKey);
