"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch('/api/auth/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username,password,role}) });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || 'No se pudo completar el registro');
      return;
    }
    // auto-login: call login
    const login = await fetch('/api/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username,password}) });
    const loginBody = await login.json();
    if (login.ok) {
      localStorage.setItem('fm_token', loginBody.token);
      localStorage.setItem('fm_token_user', JSON.stringify(loginBody.user));
      window.dispatchEvent(new Event('fm-auth-change'));
      router.push('/sesion');
    } else {
      setError('Registro completado, pero no se pudo iniciar sesión automáticamente.');
    }
  }

  return (
    <main>
      <h1>Registro</h1>
      <form onSubmit={submit} style={{display:'grid',gap:12}}>
        <input placeholder="Usuario" value={username} onChange={e=>setUsername(e.target.value)} />
        <input placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <label style={{display:'flex',gap:8,alignItems:'center'}}>
          <input type="radio" checked={role==='user'} onChange={()=>setRole('user')} /> Usuario
          <input type="radio" checked={role==='admin'} onChange={()=>setRole('admin')} style={{marginLeft:12}}/> Admin
        </label>
        <button type="submit">Crear cuenta</button>
        {error && <div style={{color:'crimson'}}>{error}</div>}
      </form>
    </main>
  );
}
