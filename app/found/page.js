import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "../components/Navebar/navbar";
import FoundItemForm from "../components/foundItems/found";

export default async function Found() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;


  if (!token) {
    redirect("/loginPage");
  }

  return (
    <div>
      <Navbar />
      <FoundItemForm />
    </div>
  );
}
