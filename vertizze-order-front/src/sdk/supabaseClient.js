// ============================================================================
// ARCHIVO: src/sdk/supabaseClient.js
// ============================================================================

import { createClient } from '@supabase/supabase-js'

// Leemos las variables directamente de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si por alguna razón siguen sin cargarse, colocamos tus credenciales de respaldo temporalmente
const urlFinal = supabaseUrl || "https://uxcxwcjbpkpiafsrvdhu.supabase.co";
const keyFinal = supabaseAnonKey || "sb_publishable_qBVV54zzm1fX2wMg2kAYvA_e2iJrzog";

export const supabase = createClient(urlFinal, keyFinal);