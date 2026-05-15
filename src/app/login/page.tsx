"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch('/api/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username,password}) });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || 'Usuario o contraseña incorrectos');
      return;
    }
    localStorage.setItem('fm_token', body.token);
    localStorage.setItem('fm_token_user', JSON.stringify(body.user));
    window.dispatchEvent(new Event('fm-auth-change'));
    router.push('/sesion');
  }

  return (
    <main>
      <h1>Iniciar sesión</h1>
      <form onSubmit={submit} style={{display:'grid',gap:12}}>
        <input placeholder="Usuario" value={username} onChange={e=>setUsername(e.target.value)} />
        <input placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="submit">Entrar</button>
        {error && <div style={{color:'crimson'}}>{error}</div>}
      </form>
    </main>
  );
}
