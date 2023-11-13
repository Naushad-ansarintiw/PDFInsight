"use client"
import { ChevronDown, ChevronUp, Loader2, RotateCw, Search } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useToast } from "./ui/use-toast";
import { useResizeDetector } from "react-resize-detector";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { DropdownMenuTrigger, DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
import SimpleBar from "simplebar-react";
import PdfFullscreen from "./PdfFullscreen";


interface PdfRendererProps {
  url: string,
}

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

const PdfRenderer = ({ url }: PdfRendererProps) => {
  const { toast } = useToast();

  const [numPages, setNumPages] = useState<number>();
  const [currPage, setCurrPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  const CustomPageValidator = z.object({
    page: z.string().refine((num) => Number(num) > 0 && Number(num) <= numPages!)
  })

  type TCustomPageValidator = z.infer<typeof CustomPageValidator>

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<TCustomPageValidator>({
    defaultValues: {
      page: "1"
    },
    resolver: zodResolver(CustomPageValidator)
  })

  const { width, ref } = useResizeDetector();

  const handlePageSubmit = ({ page }: TCustomPageValidator) => {
    // console.log("hd");
    setCurrPage(Number(page));
    setValue("page", String(page));
  }

  return (
    <div className="w-full bg-white rounded-md shadow flex flex-col items-center">
      {/* TopBar  */}
      <div className="h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2">
        {/* Adjust Pages */}
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" aria-label="previous-page"
            disabled={currPage <= 1}
            onClick={() => {
              setCurrPage((prev) => {
                const updatedValue = (prev - 1 > 1 ? prev - 1 : 1);
                setValue("page", String(updatedValue));
                return updatedValue;
              });
            }}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1.5">
            <Input
              {...register("page", { required: true })}
              className={cn("w-12 h-8", errors?.page && "ring-red-500")} // Fix Later errors.page not work properly
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // console.log("inside");
                  handleSubmit(handlePageSubmit)()
                }
              }} />
            <p className="text-zinc-700 text-sm space-x-1">
              <span>/</span>
              <span>{numPages ?? "x"}</span>
            </p>
          </div>

          <Button variant="ghost" aria-label="next-page"
            disabled={numPages === undefined || currPage === numPages}
            onClick={() => {
              setCurrPage((prev) => {
                const updatedValue = (prev + 1 < numPages! ? prev + 1 : numPages!);
                setValue("page", String(updatedValue));
                return updatedValue;
              })
            }}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom  */}
        <div className="space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="zoom" variant='ghost' className="gap-1.5 ">
                <Search className="h-4 w-4" />
                {scale * 100}%<ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setScale(1.0)}>
                100%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(1.5)}>
                150%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(2.0)}>
                200%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(2.5)}>
                250%
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Rotatate Button  */}
          <Button variant="ghost" aria-label="rotate-90-deg" 
            onClick={() => setRotation((prev) => prev + 90)}
          >
            <RotateCw className="h-4 w-4"/>
          </Button>

          {/* FUll Screen Mode Pdf */}
          <PdfFullscreen />
        </div>

      </div>

      {/* Pdf Render */}
      <div className="flex-1 w-full max-h-screen">
        <SimpleBar autoHide={false} className="max-h-[calc(100vh-rem)]">
          <div ref={ref}>
            <Document loading={
              <div className="flex justify-center">
                <Loader2 className="my-24 h-6 w-6 animate-spin" />
              </div>
            }
              onLoadError={() => {
                toast({
                  title: "Error Loading Pdf",
                  description: "Please try again later",
                  variant: "destructive"
                })
              }}
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages);
              }}
              file={url} className="max-h-full">
              <Page width={width ? width : 1} pageNumber={currPage} scale={scale} rotate={rotation} />
            </Document>
          </div>
        </SimpleBar>
      </div>
    </div>
  )
}

export default PdfRenderer
