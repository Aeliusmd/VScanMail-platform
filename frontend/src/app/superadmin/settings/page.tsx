import { redirect } from "next/navigation";

export default function SuperAdminSettingsIndexPage() {
  redirect("/superadmin/settings/manage-admins");
}

