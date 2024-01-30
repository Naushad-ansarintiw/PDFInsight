import Dashboard from "@/components/Dashboard";
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

export default async function Page() {
    const {getUser} = getKindeServerSession();
    const user = getUser();
    console.log(user.id + " Inside Dashboard");

    if(!user || !user.id) redirect('/auth-callback?origin=dashboard');

    const dbUser = await db.user.findFirst({
        where: {
            id: user.id
        }
    }).catch((error) => {
        console.error("Error fetching user from database:", error);
        throw error; // Rethrow the error to propagate it
    });
    console.log(dbUser);
    if(!dbUser) {
        redirect('/auth-callback?origin=dashboard');
    }

    return (
        <Dashboard />
    )
} 