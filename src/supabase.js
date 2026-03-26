import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cmyyvqbttapiuqgdzymu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNteXl2cWJ0dGFwaXVxZ2R6eW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0ODE0MjYsImV4cCI6MjA5MDA1NzQyNn0.7EWjPoF_RJgkv1jREFnkMrUKjRFkKbuJaR9UGG0Wufg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
