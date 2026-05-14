import {MessagePageLayout} from "./MessagePageLayout";

export const ComingSoon = () => {
 return (
     <MessagePageLayout>
         <div className={"h-full w-full flex flex-col justify-center items-center"}>
             
         <p className={"text-white text-xl"}>一関高専</p> 
         <p className={"text-white text-3xl mt-1"}>校内体育大会2026</p>
         <p className={"text-white mt-6"}>Coming Soon...</p>
         </div>
     </MessagePageLayout>
 )   
}