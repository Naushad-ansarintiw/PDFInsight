import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/trpc';
 
export const trpc = createTRPCReact<AppRouter>();