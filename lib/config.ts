import "server-only";

export type DemoAccount = {
  email: string;
  password: string;
};

export type DemoAccounts = {
  jury: DemoAccount | null;
  admin: DemoAccount | null;
};

export const DEMO_SESSION_COOKIE = "koperasihub_demo_session";

function readDemoAccount(emailKey: string, passwordKey: string): DemoAccount | null {
  const email = process.env[emailKey]?.trim();
  const password = process.env[passwordKey];

  return email && password ? { email, password } : null;
}

export function getDemoAccounts(): DemoAccounts {
  return {
    jury: readDemoAccount("DEMO_JURY_EMAIL", "DEMO_JURY_PASSWORD"),
    admin: readDemoAccount("DEMO_ADMIN_EMAIL", "DEMO_ADMIN_PASSWORD"),
  };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
