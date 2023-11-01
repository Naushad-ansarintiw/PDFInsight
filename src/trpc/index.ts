import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { privateProcedure, publicProcedure, router } from './trpc';
import { TRPCError } from '@trpc/server';
import { db } from '@/db';
 
export const appRouter = router({
    authCallback: publicProcedure.query(async () => {
        const {getUser} = getKindeServerSession();
        const user = getUser();
        // console.log(user); 
        
        if(!user.id || !user.email || !user) {
            // console.log("he");
            throw new TRPCError({code: "UNAUTHORIZED"});
        }
        console.log("hell");
        // check if the user is in the database
        const dbuser = await db.user.findFirst({
            where: {
                id: user.id
            }
        });

        if(!dbuser){
            // create user in db
            await db.user.create({
                data: {
                    id: user.id,
                    email: user.email
                }
            })
        }

        return {success: true};
    }),
    getUserFiles: privateProcedure.query(async({ctx}) => {
        const {userId, user} = ctx;

        return await db.file.findMany({
            where: {
                userId
            }
        });
    })
});
 
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;