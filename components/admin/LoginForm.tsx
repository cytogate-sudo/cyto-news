"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <form action={formAction}>
      {state?.error ? <div className="admin-alert error">{state.error}</div> : null}
      <div className="af-field">
        <label htmlFor="username">Kullanıcı Adı</label>
        <input
          id="username"
          name="username"
          className="af-input"
          autoComplete="username"
          required
        />
      </div>
      <div className="af-field">
        <label htmlFor="password">Şifre</label>
        <input
          id="password"
          name="password"
          type="password"
          className="af-input"
          autoComplete="current-password"
          required
        />
      </div>
      <button type="submit" className="btn" disabled={pending} style={{ width: "100%" }}>
        {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );
}
