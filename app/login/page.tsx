"use client";

import { useState } from "react";
import AppIcon from "@/components/AppIcon";
import type { FormEvent } from "react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    // Supabase handles the actual authentication; this page just collects credentials
    // and redirects to the private cookbook once login succeeds.
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/";
  };

  return (
    <main className="container" style={{ maxWidth: 520 }}>
      {/* Login stays intentionally simple because it only needs to unlock the private cookbook. */}
      <div className="hero-panel" style={{ marginBottom: 20 }}>
        <div>
          <p className="eyebrow">Private Access</p>
          <h1>Login</h1>
        </div>
      </div>

      <form onSubmit={handleLogin} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="email"
          placeholder="Enter email"
          className="input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <input
          type="password"
          placeholder="Enter password"
          className="input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button className="button button-primary" type="submit" disabled={loading}>
          <AppIcon name="login" size={16} />
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
