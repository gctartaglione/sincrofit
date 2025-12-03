// Criando a conexão com o Banco de Dados
const supabaseUrl = 'https://mphfbsgzxzefgxsznuxd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1waGZic2d6eHplZmd4c3pudXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjA0OTUsImV4cCI6MjA4MDI5NjQ5NX0.jZKIgWpL_0jya6Sd0P4oJzizwvOwfVWWanTYb3LOQeE';

// Inicializa o cliente (o "porteiro" que vai buscar os dados)
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Teste rápido no console para ver se funcionou
console.log("Supabase conectado!", _supabase);