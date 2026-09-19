import AppShell from "@/components/layout/AppShell";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("zedwix_session")?.value;

  if (!token) {
    redirect("/login");
  }

  if (typeof window !== "undefined") {
    const session = getSession();
    if (!session || session.token !== token) {
      redirect("/login");
    }
  }

  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
