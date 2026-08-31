import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://azbauzivvqacistxzuyb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YmF1eml2dnFhY2lzdHh6dXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NTQxNzEsImV4cCI6MjEwMzIzMDE3MX0.w5GtQXDZw4bAiRMl02KffJs8XDcn_BeWRxygvP_DlZ0'

export const supabase = createClient(supabaseUrl, supabaseKey)
