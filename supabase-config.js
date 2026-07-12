/* ==================================================
   POLO DISTRICT — Supabase connection
   Paste your project's values below (Settings -> API
   in your Supabase dashboard). Both values are safe
   to expose publicly — the anon key only ever has the
   permissions you grant it via Row Level Security.
   ================================================== */
const SUPABASE_URL = "https://wkvgxbqgjbabtlhzrvll.supabase.co";       // e.g. https://abcdEFGH.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indrdmd4YnFnamJhYnRsaHpydmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MzkwNDgsImV4cCI6MjA5OTQxNTA0OH0.bWAXdErncpLGqypc9lD6tpg67B6huzY8n0SMJLOofPU";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);