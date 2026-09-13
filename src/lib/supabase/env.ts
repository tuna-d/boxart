function required(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env.local and fill it in.`);
  }
  return value;
}

// Read with literal property access so Next.js can inline them in the browser bundle.
export const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseKey = required(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
