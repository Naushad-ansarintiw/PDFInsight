"use client"
import { trpc } from "@/app/_trpc/client"
import ChatInput from "./ChatInput"
import Messages from "./Messages"
import { ChevronLeft, Loader2, XCircle } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "../ui/button"
import { useChat } from 'ai/react'
import React from "react"
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query"

interface ChatWrapperProps {
  fileId: string
}

const ChatWrapper = ({ fileId }: ChatWrapperProps) => {

  const {data: data1, isLoading: isLoading1, fetchNextPage} = trpc.getFileMessages.useInfiniteQuery({
    fileId,
    limit: INFINITE_QUERY_LIMIT,
  }, {
    getNextPageParam: (lastPage) => lastPage?.nextCursor,  // check for the last index message for loading new msg 
    keepPreviousData: true
  });

  const previousMessage = data1?.pages.flatMap((page) => page?.messages); 

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/message",
    body: {
      fileId: fileId
    },
    initialMessages: previousMessage || []
  });

  const { data, isLoading } = trpc.getFileUploadStatus.useQuery({
    fileId,
  }, {
    refetchInterval: (data) =>
      data?.status === "SUCCESS" || data?.status === "FAILED" ? false : 500
  }
  );

  const messageContainerRef = useChatScroll(messages);

  if (isLoading)
    return (
      <div className="relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
        <div className="flex-1 flex justify-center items-center flex-col mb-28">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <h3 className="font-semibold text-xl">Loading...</h3>
            <p className="text-zinc-500 text-sm">
              We&apos;re preparing your PDF.
            </p>
          </div>
        </div>
        <ChatInput isDisabled />
      </div>
    )

  if (data?.status === "PROCESSING") return (
    <div className="relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
      <div className="flex-1 flex justify-center items-center flex-col mb-28">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <h3 className="font-semibold text-xl">Processing...</h3>
          <p className="text-zinc-500 text-sm">
            This Won&apos;t take long.
          </p>
        </div>
      </div>
      <ChatInput isDisabled />
    </div>
  )

  if (data?.status === "FAILED") return (
    <div className="relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
      <div className="flex-1 flex justify-center items-center flex-col mb-28">
        <div className="flex flex-col items-center gap-2">
          <XCircle className="h-8 w-8 text-red-500" />
          <h3 className="font-semibold text-xl">Too many pages in PDF</h3>
          <p className="text-zinc-500 text-sm">
            Your <span className="font-medium">Free</span>{' '} plan supports up to 5 pages per PDF.
          </p>
          <Link
            href='/dashboard'
            className={buttonVariants({
              variant: "secondary",
              className: "mt-4"
            })}>
            <ChevronLeft className="h-3 w-3 mr-1.5" />Back
          </Link>
        </div>
      </div>
      <ChatInput isDisabled />
    </div>
  )

  return (
    <div className="relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
      {/* Messages */}
      <div ref={messageContainerRef} className="flex-1 justify-between flex flex-col mb-28">
        <Messages messages={messages} isLoading={isLoading1} />
      </div>

      {/* chat input */}
      <ChatInput input={input} handleInputChange={handleInputChange} handleSubmit={handleSubmit} />
    </div>
  )
}

// Handling the scroll down logic
function useChatScroll<T>(dep: T): React.MutableRefObject<HTMLDivElement> {
  const ref = React.useRef<HTMLDivElement>(null!);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [dep]);
  return ref;
}

export default ChatWrapper

