import { createClient } from '@supabase/supabase-js'

// Estas variables deben definirse en .env y solo usar claves públicas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL no está definida")
}

if (!supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_ANON_KEY no está definida")
}

// Cliente central de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
