
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LostPage from "../components/lostItems/lost";
import Navbar from "../components/Navebar/navbar";

export default async function Lost() {
 const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;


  if (!token) {
    redirect("/loginPage");
  }

 
  return (
    <div>
      <Navbar />
      <LostPage />
    </div>
  );
}
