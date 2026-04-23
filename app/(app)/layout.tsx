import { VaultShell } from "@/components/VaultShell";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <VaultShell>{children}</VaultShell>;
}
