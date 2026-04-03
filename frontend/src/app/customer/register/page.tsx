import { redirect } from "next/navigation";

/** Legacy /customer/register URLs; main flow is `/register`. */
export default function CustomerRegisterRedirect() {
  redirect("/register");
}
