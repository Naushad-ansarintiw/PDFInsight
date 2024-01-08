import Skeleton from 'react-loading-skeleton';
import { MessageSquare } from 'lucide-react';
import IndividualMessage from './Message';
import { Message } from 'ai';

interface Props {
  messages: Message[];
  isLoading: boolean;
}


const Messages = ({ messages, isLoading }: Props) => {

  return (
    <div className="flex flex-col max-h-[calc(100vh-3.5rem-7rem)] border-zinc-200 flex-1 gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch">
      {messages && messages.length > 0 ? (
        messages.map((message, i) => {
          const isNextMessageSamePerson =
            (messages[i - 1]?.role === 'user') ===
            (messages[i]?.role === 'user');

          return (
            <IndividualMessage
              message={message} 
              isNextMessageSamePerson={isNextMessageSamePerson}
              key={message.id}
            />
          );
        })
      ) : isLoading ? (
        <div className="w-full flex flex-col gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <MessageSquare className="h-8 w-8 text-blue-500" />
          <h3 className="font-semibold text-xl">You&pos;re all set!</h3>
          <p className="text-zinc-500 text-sm">
            Ask your first question to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default Messages;
