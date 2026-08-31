"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/admin/actions";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, {});

  return (
    <form action={formAction}>
      {state?.error ? <div className="admin-alert error">{state.error}</div> : null}
      {state?.success ? <div className="admin-alert success">{state.success}</div> : null}
      <div className="af-field">
        <label htmlFor="pw-current">Mevcut Şifre</label>
        <input
          id="pw-current"
          name="current"
          type="password"
          className="af-input"
          autoComplete="current-password"
          required
        />
      </div>
      <div className="admin-grid-2">
        <div className="af-field">
          <label htmlFor="pw-next">Yeni Şifre (en az 8 karakter)</label>
          <input
            id="pw-next"
            name="next"
            type="password"
            className="af-input"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div className="af-field">
          <label htmlFor="pw-next2">Yeni Şifre (tekrar)</label>
          <input
            id="pw-next2"
            name="next2"
            type="password"
            className="af-input"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
      </div>
      <button type="submit" className="btn" disabled={pending}>
        {pending ? "Güncelleniyor..." : "Şifreyi Değiştir"}
      </button>
    </form>
  );
}
