"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">Login</h1>

      <input
        type="email"
        placeholder="Enter email"
        className="w-full p-2 border mb-4"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Enter password"
        className="w-full p-2 border mb-4"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleLogin}
        className="px-4 py-2 bg-black text-white"
      >
        Login
      </button>
    </main>
  );
}