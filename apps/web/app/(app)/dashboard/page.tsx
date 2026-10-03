import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) {
    redirect("/login")
  }
  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  )
}
