import { PDFLoader } from "langchain/document_loaders/fs/pdf";

export async function downloadPdf(file_key: string) {
    try {
        const response = await fetch(`https://utfs.io/f/${file_key}`);// fetching the pdf
        // console.log(`https://utfs.io/f/${file_key}`);
        console.log(response);
        const blob = await response.blob(); // convert into the blob object
        console.log(2);
        console.log(blob);
        const loader = new PDFLoader(blob); // It represents a document loader that loads documents from PDF files.
        console.log(3);
        console.log(loader);
        const pageContent = await loader.load(); // extract the page content from the PDF
        // const pagesAmt = pageContent.length;
        console.log(4);
        console.log(pageContent);
        return pageContent;
    } catch (error) {
        console.log("downloadPdf");
        console.log(error);
        return null;
    }
}