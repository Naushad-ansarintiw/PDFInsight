"use client"
import { Send } from "lucide-react"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"


interface ChatInputProps {
  isDisabled?: boolean
  input?: string
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
}

const ChatInput = ({isDisabled, input, handleInputChange, handleSubmit}: ChatInputProps) => {
  console.log(input, " INPTU")

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement> | React.FormEvent<HTMLFormElement>) => {
    if ('key' in e && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      //@ts-ignore
      handleSubmit?.(e as React.FormEvent<HTMLFormElement>);
    }
  };


  return (
    <div className="absolute bottom-0 left-0 w-full">
      <form className="mx-2 flex flex-row gap-3 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl" onSubmit={handleSubmit}>
        <div className="relative flex h-full flex-1 items-stretch md:flex-col">
          <div className="relative flex flex-col w-full flex-grow p-4">
            <div className="relative">
              <Textarea 
                rows={1} 
                maxRows={4} 
                autoFocus 
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter your question..." 
                className="resize-none pr-12 text-base py-3 scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch"
              />
              <Button className="absolute bottom-1.5 right-[8px]"><Send aria-label="send message" className="h-4 w-4" type="submit"/></Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ChatInput
