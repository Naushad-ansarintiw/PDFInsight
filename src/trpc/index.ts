import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { privateProcedure, publicProcedure, router } from './trpc';
import { TRPCError } from '@trpc/server';
import { db } from '@/db';
import { z } from "zod"

export const appRouter = router({
    authCallback: publicProcedure.query(async () => {
        const { getUser } = getKindeServerSession();
        const user = getUser();
        // console.log(user); 

        if (!user.id || !user.email || !user) {
            // console.log("he");
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        // console.log("hell");
        // check if the user is in the database
        const dbuser = await db.user.findFirst({
            where: {
                id: user.id
            }
        });

        if (!dbuser) {
            // create user in db
            await db.user.create({
                data: {
                    id: user.id,
                    email: user.email
                }
            })
        }

        return { success: true };
    }),
    getUserFiles: privateProcedure.query(async ({ ctx }) => {
        const { userId, user } = ctx;

        return await db.file.findMany({
            where: {
                userId
            }
        });
    }),
    getFileUploadStatus: privateProcedure
        .input(z.object({ fileId: z.string() }))
        .query(async ({input, ctx}) => {
            const file = await db.file.findFirst({
                where: {
                    id: input.fileId,
                    userId: ctx.userId,
                }
            });
            if(!file) return {status: "PENDING" as const}
            return {status: file.uploadStatus}
        }),
    getFile: privateProcedure
        .input(z.object({ key: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { userId } = ctx;

            const file = await db.file.findFirst({
                where: {
                    key: input.key,
                    userId,
                }
            });

            if (!file) throw new TRPCError({ code: "NOT_FOUND" });
            return file;
        }),
    deleteFile: privateProcedure.input(
        z.object({ id: z.string() })
    ).mutation(async ({ ctx, input }) => {
        const { userId } = ctx;

        const datafile = await db.file.findFirst({
            where: {
                id: input.id,
                userId,
            },
        });

        if (!datafile) throw new TRPCError({ code: "NOT_FOUND" });
        await db.file.delete({
            where: {
                id: input.id,
            }
        });

        return datafile
    }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;


// app-index.js:31 TRPCClientError: [
//     {
//       "code": "invalid_type",
//       "expected": "string",
//       "received": "undefined",
//       "path": [
//         "fileId"
//       ],
//       "message": "Required"
//     }
//   ]
//       at TRPCClientError.from (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/@trpc+client@10.43.0_@trpc+server@10.43.0/node_modules/@trpc/client/dist/TRPCClientError-0de4d231.mjs:31:20)
//       at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/@trpc+client@10.43.0_@trpc+server@10.43.0/node_modules/@trpc/client/dist/httpBatchLink-204206a5.mjs:198:105)