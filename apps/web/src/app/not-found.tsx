import {MessagePageLayout} from "../components/layouts/messagePage/MessagePageLayout";

export default function NotFound() {
    return (
        <MessagePageLayout>
            <div className={"w-full h-full flex flex-col justify-center items-center opacity-80"}>
                
                <p className={"text-white text-xl"}>体育大会2026</p>
                <p className={"text-white text-3xl mt-4"}>４０４</p>
                <p className={"text-white mt-3"}>お探しのページは存在しません.</p>
            </div>
        </MessagePageLayout>
    )
}