import OpenAI from 'openai';

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});


// convert the text into vector
export async function getEmbeddings(text: string){
    try {
        console.log("ENTER in embeddings");
        const result = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: text.replace(/\n/g, ''),
        });
        console.log('OpenAI API Response:');
        if (Array.isArray(result.data) && result.data.length > 0) {
            console.log("LEeaving");
            return result.data[0].embedding as number[];
        } else {
            // Handle the case where result.data is not as expected
            console.error('Unexpected format of result.data:', result.data);
            throw new Error('Unexpected format of result.data');
        }

    } catch (error) {
        console.log("error in embeddings.ts ", error);
        throw error 
    }
}