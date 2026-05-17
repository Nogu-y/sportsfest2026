"use client";

import { useRouter } from "next/navigation";
import Modal from "./Modal"; 

export default function RouteModal({
                                       title,
                                       children,
                                   }: {
    title: string;
    children: React.ReactNode;
}) {
    const router = useRouter();
    
    const handleClose = () => {
        // 閉じるボタンや背景タップでブラウザの｢戻る｣を発火させてURLを元に戻す
        router.back();
    };

    return (
        <Modal isOpen={true} onClose={handleClose} title={title}>
            {children}
        </Modal>
    );
}