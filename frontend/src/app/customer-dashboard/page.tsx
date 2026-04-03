import { redirect } from "next/navigation";

/** @deprecated Use `/customer` — kept for bookmarks and old links. */
export default function CustomerDashboardRootRedirect() {
  redirect("/customer");
}
