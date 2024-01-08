import { cn } from "@/lib/utils"
import { ExtendedMessage } from "@/types/message"
import { Icons } from "../Icons"
import ReactMarkdown from "react-markdown"
import { format } from "date-fns"
import { Message } from "ai"

interface MessageProps {
    message: Message,
    isNextMessageSamePerson: boolean
}

const Message = ({ message, isNextMessageSamePerson }: MessageProps) => {
    return <div className={cn('flex items-end', {
        "justify-end": message.role === "user",
    })}>
        <div className={cn("relative flex h-6 w-6 aspect-square items-center justify-center", {
            "order-2 bg-blue-600 rounded-sm": message.role === "user",
            "order-1 bg-zinc-800 rounded-sm": message.role === "assistant",
            invisible: isNextMessageSamePerson
        })}>
            {message.role === "user" ? (
                <Icons.user className="fill-zinc-200 text-zinc-200 h-3/4 w-3/4" />
            ) : (
                <Icons.logo className="fill-zinc-300 h-3/4 w-3/4" />
            )}
        </div>

        <div className={cn('flex flex-col space-y-2 text-base max-w-md mx-2', {
            'order-1 items-end': message.role === "user",
            'order-2 items-start': message.role === "assistant",
        })}>
            <div className={cn('px-4 py-2 rounded-lg inline-block', {
                'bg-blue-600 text-white': message.role === "user",
                'bg-gray-200 text-gray-900': message.role === "assistant",
                'rounded-br-none': !isNextMessageSamePerson && message.role === "user",
                'rounded-bl-none': !isNextMessageSamePerson && message.role === "assistant",
            })}>
                {typeof message.content === "string" ? (
                    <ReactMarkdown className={cn('prose', {
                        'text-zinc-50': message.role === "user",
                    })}>
                        {message.content}
                    </ReactMarkdown>
                ) : (
                    message.content
                )}
                {
                    message.id !== 'loading-message' ? (
                        <div className={cn('text-xs select-none mt-2 w-full text-right', {
                            'text-zinc-500': message.role === "assistant",
                            'text-blue-300': message.role === "user",
                        })}>
                            {format(
                                new Date(message.createdAt),
                                'HH:mm'
                            )}
                        </div>
                    ) : null
                }
            </div>
        </div>
    </div>
}

export default Message