import { redirect } from "next/navigation";

export default function SuperAdminHome() {
  redirect("/superadmin/settings/manage-admins");
}

