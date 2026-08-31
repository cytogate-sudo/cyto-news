import { redirect } from "next/navigation";
import { getAdminUsername } from "@/lib/admin/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function AdminLoginPage() {
  const username = await getAdminUsername();
  if (username) redirect("/admin");

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Cytogate</h1>
        <div className="sub">Yönetim Paneli</div>
        <LoginForm />
      </div>
    </div>
  );
}
