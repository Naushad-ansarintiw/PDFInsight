"use client"
import { ArrowRight } from "lucide-react"
import { Button } from "./ui/button"
import { trpc } from "@/app/_trpc/client"
import { loadStripe } from '@stripe/stripe-js';
import { useEffect } from "react";

// recreating the `Stripe` object on every render.
const asyncStripe =loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const UpgradeButton = () => {

    useEffect(() => {
        // Check to see if this is a redirect back from Checkout
        const query = new URLSearchParams(window.location.search);
        if (query.get('success')) {
            console.log('Order placed! You will receive an email confirmation.');
        }

        if (query.get('canceled')) {
            console.log('Order canceled -- continue to shop around and checkout when you’re ready.');
        }
    }, []);



    const { mutate: createStripeSession } = trpc.createStripeSession.useMutation({
        onSuccess: ({ url }) => {
            console.log(url, " Succes");
            window.location.href = url ?? "/dashboard/billing"
        }
    })

    return (
            <Button onClick={() => createStripeSession()} className='w-full'>
                Upgrade now <ArrowRight className='h-5 w-5 ml-1.5' />
            </Button>
    )
}

export default UpgradeButton