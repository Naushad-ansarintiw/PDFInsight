import { PineconeClient } from "@pinecone-database/pinecone"
import { downloadPdf } from "./downloadPdf";
import { Document, RecursiveCharacterTextSplitter } from "@pinecone-database/doc-splitter";

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
    // 1. obtain the pdf
    console.log("downloading the pdf");
    const pages = (await downloadPdf(fileKey)) as PDFpage[];
    if (!pages) throw new Error('could not download the pdf');

    // 2. split and segment the pdf
    const documents = await Promise.all(pages.map(page => prepareDocument(page)));

    // 3. vectorize and embed individual document;


}

// async function embedDocument()

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


