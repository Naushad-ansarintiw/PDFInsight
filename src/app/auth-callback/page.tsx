"use client"

import { trpc } from "@/app/_trpc/client";
import { Loader } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Page () {
    const router = useRouter();

    const searchParams = useSearchParams();
    const origin = searchParams.get('origin');
    console.log(origin);

    trpc.authCallback.useQuery(undefined, {
        onSuccess: ({success}) => {
            // user is synced to db
            if(success){
                router.push(origin ? `/${origin}` : '/dashboard');
            }
        },
        onError: (err) => {
            console.log(err);
            if(err.data?.code === 'UNAUTHORIZED'){
                router.push("/sign-in");
            }
        },
        retry: true,
        retryDelay: 1000,
    });
    
    return (
        <div className="w-full mt-24 flex justify-center">
            <div className="flex flex-col items-center gap-2">
                <Loader className="h-8 w-8 animate-spin text-zinc-800" />
                <h3 className="font-semibold text-xl">Setting up your account...</h3>
                <p>You will be redirected automatically.</p>
            </div>
        </div>
    )
}