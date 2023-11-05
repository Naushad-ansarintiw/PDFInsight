import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

interface PageProps {
    params: {
        fileid: string
    }
}

const Page = async ({ params }: PageProps) => {
    // retrieve the file id 
    const { fileid } = params;

    const { getUser } = getKindeServerSession();
    const user = getUser();

    if (!user || !user.id) redirect(`/auth-callback?origin=dashboard/${fileid}`);

    // make database call

    const file = await db.file.findFirst({
        where: {
            id: fileid,
            userId: user.id
        }
    })

}

export default Page