import { redirect } from "next/navigation";

/** Alias for the live guide experience */
export default function DashboardPage() {
  redirect("/guide");
}
