"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppIcon from "@/components/AppIcon";
import type { FormEvent } from "react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/");
  };

  return (
    <main className="container auth-shell">
      <div className="hero-panel" style={{ marginBottom: 20 }}>
        <div className="hero-copy">
          <p className="eyebrow">Private Access</p>
          <h1>Login</h1>
          <p>Unlock your saved recipes, notes, imports, and family cookbook tools.</p>
        </div>
      </div>

      <form onSubmit={handleLogin} className="card auth-card">
        <input
          type="email"
          placeholder="Enter email"
          className="input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />

        <input
          type="password"
          placeholder="Enter password"
          className="input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <p
            role="alert"
            style={{
              color: "#dc2626",
              fontSize: "0.875rem",
              padding: "0.5rem 0.75rem",
              background: "rgba(220,38,38,0.08)",
              borderRadius: "0.5rem",
              margin: 0,
            }}
          >
            {error}
          </p>
        )}

        <button className="button button-primary" type="submit" disabled={loading}>
          <AppIcon name="login" size={16} />
          {loading ? "Logging in…" : "Login"}
        </button>
      </form>
    </main>
  );
}
