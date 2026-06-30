import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { SignInForm } from "@/components/sign-in-form"

export const metadata = {
  title: "Đăng nhập | NebulaPhone",
}

export default async function SignInPage() {
  const session = await getSession()
  if (session?.user) {
    redirect(session.user.role === "admin" ? "/admin" : "/dashboard")
  }
  return <SignInForm />
}
