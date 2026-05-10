import { ShareSiteChrome } from "@/components/share-site-chrome";
import { getCurrentUser } from "@/lib/auth";

export default async function ShareLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = await getCurrentUser();
  const user = sessionUser ? { name: sessionUser.name, role: sessionUser.role } : null;

  return <ShareSiteChrome user={user}>{children}</ShareSiteChrome>;
}
