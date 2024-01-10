import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { privateProcedure, publicProcedure, router } from './trpc';
import { TRPCError } from '@trpc/server';
import { db } from '@/db';
import { z } from "zod"
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query';
import { absoluteUrl } from '@/lib/utils';
import {  stripe } from '@/lib/stripe';
import { PLANS } from '@/config/stripe';
import { NextResponse } from 'next/server';

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
        const { userId } = ctx;

        return await db.file.findMany({
            where: {
                userId
            }
        });
    }),
    createStripeSession: privateProcedure.mutation(async ({ ctx }) => {
        const { userId } = ctx;
        console.log(userId, "CreateStripe");
        const return_url = absoluteUrl("/");
        const billingUrl = absoluteUrl("/dashboard/billing");
        // in server side relative path not work so we have to use full path 

        try {
            const { getUser } = getKindeServerSession();
            const user = getUser();
            if (!user) {
                return new NextResponse('unauthorized', { status: 401 })
            }

            const _userSubscription = await db.user.findFirst({
                where: {
                    id: userId
                }
            });
            if (_userSubscription && _userSubscription.stripeCustomerId != null) {
                // trying to cancel at the billing portal 
                const stripeSession = await stripe.billingPortal.sessions.create({
                    customer: _userSubscription.stripeCustomerId,
                    return_url
                })
                return {url: stripeSession.url};
            }

            // user's first time trying to subscribe
            const stripeSession = await stripe.paymentLinks.create({
                line_items: [
                    {
                        price: 'price_1OVTt1SAo6lzH3fcr02J9uYV',
                        quantity: 1,
                    }
                ],
                metadata: {
                    userId
                },
                after_completion: {
                    type: 'redirect',
                    redirect: {
                        url: 'https://localhost:3000/dashboard',
                    }
                }
            });

            return {url: stripeSession.url};
        } catch (error) {
            console.log("stripe error ", error);
            return new NextResponse("internal server error", { status: 500 })
        }
    }),
    getFileMessages: privateProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).nullish(),
                cursor: z.string().nullish(),
                fileId: z.string()
            })
        ).query(async ({ ctx, input }) => {
            const { userId } = ctx;
            const { fileId, cursor } = input;
            const limit = input.limit ?? INFINITE_QUERY_LIMIT
            const file = await db.file.findFirst({
                where: {
                    id: fileId,
                    userId
                }
            });
            if (!file) throw new TRPCError({ code: 'NOT_FOUND' });
            const messages = await db.message.findMany({
                take: limit + 1,
                where: {
                    fileId
                },
                orderBy: {
                    createdAt: "asc"
                },
                cursor: cursor ? { id: cursor } : undefined,
                select: {
                    id: true,
                    role: true,
                    createdAt: true,
                    content: true,
                }
            });
            let nextCursor: typeof cursor | undefined = undefined;
            if (messages.length > limit) {
                const nextItem = messages.pop();
                nextCursor = nextItem?.id;
            }
            return {
                messages,
                nextCursor,
            }
        }),
    getFileUploadStatus: privateProcedure
        .input(z.object({ fileId: z.string() }))
        .query(async ({ input, ctx }) => {
            const file = await db.file.findFirst({
                where: {
                    id: input.fileId,
                    userId: ctx.userId,
                }
            });
            if (!file) return { status: "PENDING" as const }
            return { status: file.uploadStatus }
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

