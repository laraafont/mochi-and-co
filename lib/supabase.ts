import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://miqiapjkyofyukefrhbs.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcWlhcGpreW9meXVrZWZyaGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMjg2OTUsImV4cCI6MjA4NjYwNDY5NX0.jQN_6-ZoMQFGBrYohaUE22uROsVT5qQQYWUITT-aQQo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
