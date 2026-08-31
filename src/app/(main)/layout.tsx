import { redirect } from "next/navigation";
import { AppShell, loadShellData } from "@/components/layout/app-shell";

// The await has to happen here, not inside AppShell — see loadShellData.
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const data = await loadShellData();
  if (!data) redirect("/login");

  return <AppShell data={data}>{children}</AppShell>;
}
