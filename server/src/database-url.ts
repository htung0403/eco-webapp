export const getDatabaseUrl = (env: NodeJS.ProcessEnv = process.env) => {
  return env.SUPABASE_POOLER_DATABASE_URL || env.DATABASE_POOLER_URL || env.DATABASE_URL;
};

export const isSupabaseDirectDatabaseUrl = (databaseUrl: string | undefined) => {
  if (!databaseUrl) return false;

  try {
    return new URL(databaseUrl).hostname.endsWith('.supabase.co') && new URL(databaseUrl).hostname.startsWith('db.');
  } catch {
    return false;
  }
};

export const getDatabaseUrlHelp = () => [
  'Supabase direct database hosts db.<project-ref>.supabase.co are IPv6-only unless the IPv4 add-on is enabled.',
  'For environments without IPv6/no IPv4 add-on, set SUPABASE_POOLER_DATABASE_URL to the Session pooler URL from Supabase Dashboard > Connect.',
  'Expected format: postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres',
].join(' ');
