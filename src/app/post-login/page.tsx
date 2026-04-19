import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Route that picks the right home per account type. Used as the post-signIn
// destination so login/signup flows don't need to know about role wiring.
export default async function PostLoginPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");
  if (session.user.brandId) redirect("/dashboard");
  if (session.user.influencerId) redirect("/creator");
  redirect("/signup");
}
