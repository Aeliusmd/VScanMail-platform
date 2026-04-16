import { redirect } from "next/navigation";

/** Notification preferences are managed under Super Admin (per organization). */
export default function AdminNotificationsRedirectPage() {
  redirect("/admin/settings/profile");
}
