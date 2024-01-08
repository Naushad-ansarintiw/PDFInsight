import { PineconeClient, Vector , utils as PineconeUtils} from "@pinecone-database/pinecone"
import { downloadPdf } from "./downloadPdf";
import { Document, RecursiveCharacterTextSplitter } from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embeddings";
import md5 from "md5";

let pinecone: PineconeClient | null = null;

export const getPineconeClient = async () => {
    if (!pinecone) {
        pinecone = new PineconeClient();
        await pinecone.init({
            apiKey: process.env.PINECONE_API_KEY!,
            environment: process.env.PINECONE_ENVIRONMENT_VARIABLE!,
        })
    }
    return pinecone;
}

type PDFpage = {
    pageContent: string,
    metadata: {
        loc: { pageNumber: number }
    }
}

export async function loadPdfIntoPinecone(fileKey: string) {
    try {
        // 1. obtain the pdf
        console.log("downloading the pdf");
        const pages = (await downloadPdf(fileKey)) as PDFpage[];
        if (!pages) throw new Error('could not download the pdf');
        console.log("Download done");
        // 2. split and segment the pdf
        console.log("Enter in 2");
        const documents = await prepareDocuments(pages);
        console.log("Done Second");
        // 3. vectorize and embed individual document;
        console.log("Enter in vectors 3");
        const vectors = await embedDocuments(documents);
        console.log("Done 3");

        // 4.upload to pinecone;
        console.log("enter in 4");
        const client = await getPineconeClient();
        const pineconeIndex = client.Index("pdf");
        console.log("done 4");
        console.log("inserting vector into pinecone");
        // const namespace = convertToAscii(fileKey);
        PineconeUtils.chunkedUpsert(pineconeIndex, vectors, '' , 10);
        return documents[0];
    } catch (error) {
        console.error("Error in loadPdfIntoPinecone:", error);
        throw error;
    }
}

async function prepareDocuments(pages: PDFpage[]) {
    const prepareDocumentPromises = pages.map(page => prepareDocument(page));
    return Promise.all(prepareDocumentPromises);
}

async function embedDocuments(documents: Document[][]) {
    const results: Vector[] = [];

    for (const doc of documents.flat()) {
        // Check if we have processed 3 requests, and if so, wait for 20 seconds
        if (results.length % 3 === 0 && results.length > 0) {
            console.log("Waiting for 65 seconds...");
            await new Promise(resolve => setTimeout(resolve, 65000));
        }
        const vector = await embedDocument(doc);
        results.push(vector);
    }
    return results;
}

async function embedDocument(doc: Document) {
    try {
        const embeddings = await getEmbeddings(doc.pageContent);
        console.log("check embeddings");
        const hash = md5(doc.pageContent);

        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber,
            }
        } as Vector;
    } catch (error) {
        console.log("error embeddings document ", error);
        throw error;
    }
}
const truncateStringByButes = (str: string, bytes: number) => {
    const enc = new TextEncoder();
    return new TextDecoder('utf-8').decode(enc.encode(str).slice(0, bytes)); // this ensure the string we pass is cut down to a smaller chunks 
}


async function prepareDocument(page: PDFpage) {
    let { pageContent, metadata } = page;
    pageContent = pageContent.replace(/\n/g, '');
    // split the docs
    const splitter = new RecursiveCharacterTextSplitter();
    const docs = await splitter.splitDocuments([
        new Document({
            pageContent,
            metadata: {
                pageNumber: metadata.loc.pageNumber,
                text: truncateStringByButes(pageContent, 36000),
            },
        }),
    ]);
    return docs;
}


