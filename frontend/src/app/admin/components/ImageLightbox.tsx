 "use client";
 
 import { Icon } from "@iconify/react";
 import { useEffect } from "react";
 
 export function ImageLightbox({
   open,
   images,
   index,
   onClose,
   onPrev,
   onNext,
 }: {
   open: boolean;
   images: string[];
   index: number;
   onClose: () => void;
   onPrev: () => void;
   onNext: () => void;
 }) {
   useEffect(() => {
     if (!open) return;
     const onKeyDown = (e: KeyboardEvent) => {
       if (e.key === "Escape") onClose();
       if (e.key === "ArrowLeft") onPrev();
       if (e.key === "ArrowRight") onNext();
     };
     window.addEventListener("keydown", onKeyDown);
     return () => window.removeEventListener("keydown", onKeyDown);
   }, [open, onClose, onPrev, onNext]);
 
   if (!open) return null;
 
   return (
     <div
       className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-3 sm:p-6"
       onClick={onClose}
     >
       <div
         className="relative w-full max-w-[1100px] max-h-[92vh] bg-black/20 rounded-2xl border border-white/10 overflow-hidden"
         onClick={(e) => e.stopPropagation()}
       >
         <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
           <button
             type="button"
             onClick={onClose}
             className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow flex items-center justify-center cursor-pointer"
             aria-label="Close"
           >
             <Icon icon="ri:close-line" className="text-xl" />
           </button>
         </div>
 
         {images.length > 1 && (
           <>
             <button
               type="button"
               onClick={onPrev}
               className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow flex items-center justify-center cursor-pointer"
               aria-label="Previous image"
             >
               <Icon icon="ri:arrow-left-s-line" className="text-2xl" />
             </button>
             <button
               type="button"
               onClick={onNext}
               className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow flex items-center justify-center cursor-pointer"
               aria-label="Next image"
             >
               <Icon icon="ri:arrow-right-s-line" className="text-2xl" />
             </button>
             <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-black/60 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
               {index + 1} / {images.length}
             </div>
           </>
         )}
 
         <div className="w-full h-[92vh] max-h-[92vh] flex items-center justify-center">
           <img
             src={images[index]}
             alt={`Scan ${index + 1}`}
             className="max-w-full max-h-full object-contain select-none"
             draggable={false}
           />
         </div>
       </div>
     </div>
   );
 }
