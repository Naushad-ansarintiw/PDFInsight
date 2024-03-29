import { db } from "@/db";
import { loadPdfIntoPinecone } from "@/lib/pinecone";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();
 
export const ourFileRouter = {
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const {getUser} = getKindeServerSession();
      const user = getUser();

      if(!user || !user.id) throw new Error("Unauthorized");

      return {userId: user.id};
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const createdFile = await db.file.create({
        data: {
          key: file.key,
          name: file.name,
          userId: metadata.userId,
          url: file.url,
          uploadStatus: "PROCESSING",
        }
      })
      console.log("File CREated ", createdFile);
      console.log(createdFile.url);

      try {

        const pages = await loadPdfIntoPinecone(file.key); 
        console.log(pages);

        await db.file.update({
          data: {
            uploadStatus: "SUCCESS"
          },
          where: {
            id: createdFile.id
          }
        });

      } catch (error) {
          console.log("Hel");
          console.log(error);
          await db.file.update({
            data: {
              uploadStatus: "FAILED"
            },
            where: {
              id: createdFile.id
            }
          })
      }
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;