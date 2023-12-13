import { PineconeClient } from "@pinecone-database/pinecone";
import { getEmbeddings } from "./embeddings";


type Metadata = {
    text: string,
    pageNumber: number 
}

export async function getMatchesFromEmbeddings(embeddings: number[], filekey: string) {
    const pinecone = new PineconeClient();
    await pinecone.init({
        apiKey: process.env.PINECONE_API_KEY!,
        environment: process.env.PINECONE_ENVIRONMENT_VARIABLE!,
    });

    const pineconeIndex = pinecone.Index("pdf");

    try {
        const queryResult = await pineconeIndex.query({
           queryRequest: {
            topK: 5,
            vector: embeddings,
            includeMetadata: true,
            includeValues: true
           }
        });
        return queryResult.matches || [];
    } catch (error) {
        console.log('error quering message ', error);
        throw error;
    }
}

export async function getContext(query: string, filekey: string){
    const queryEmbeddings = await getEmbeddings(query);
    // console.log(queryEmbeddings, " Embeddings");
    const matches = await getMatchesFromEmbeddings(queryEmbeddings, filekey);
    // console.log(matches, " Matches embeddings");
    const qualifyingDocs = matches.filter(match => match.score && match.score > 0.7);

    let docs = qualifyingDocs.map(match => (match.metadata as Metadata).text);
    // console.log(docs, " useful docs");
    return docs.join('\n').substring(0, 3000);
}