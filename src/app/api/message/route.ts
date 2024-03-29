import { db } from '@/db'
import { getContext } from '@/lib/contextquery'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { Message, OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai';

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});


// IMPORTANT! Set the runtime to edge
// export const runtime = 'edge'

export async function POST(req: Request) {
  // checking if user exist or not 
  const { getUser } = getKindeServerSession();
  const user = getUser();

  const { id: userId } = user;

  if (!userId) return new Response("Unauthorized", { status: 401 });

  // Extract the `messages` from the body of the request
  const { messages, fileId } = await req.json();
  const lastMessage: Message = messages[messages.length - 1];
  console.log(lastMessage);

  const file = await db.file.findFirst({
    where: {
      id: fileId
    }
  })

  if (!file) return new Response("Not Found", { status: 404 });

  await db.message.create({
    data: {
      content: lastMessage.content,
      role: "user",
      fileId,
      userId
    }
  })

  const filekey = file.id;

  const context = await getContext(lastMessage.content, filekey); // this return whole paragraph of relevent vector embeddings
  console.log(context, " question context");

  const prompt = {
    role: "system",
    content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
    The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
    AI is a well-behaved and well-mannered individual.
    AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
    AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
    AI assistant is a big fan of Pinecone and Vercel.
    START CONTEXT BLOCK
    ${context}
    END OF CONTEXT BLOCK
    AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
    If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
    AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
    AI assistant will not invent anything that is not drawn directly from the context.
    `,
  };

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      prompt,
      ...messages.filter((message: Message) => message.role === "user"),
    ],
    stream: true,
  });
  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      await db.message.create({
        data: {
          content: completion,
          role: "assistant",
          fileId,
          userId,
        },
      })
    },
  })
  // Respond with the stream
  return new StreamingTextResponse(stream)
}