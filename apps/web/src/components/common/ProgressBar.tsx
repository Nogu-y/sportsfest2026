import {useEffect, useState} from 'react';
import {calculateMatchProgress} from '../../lib/matchUtils';

type ProgressBarProps = {
    scheduledStartTime: string;
    scheduledEndTime: string;
    startedAt?: string | null; // 実際の開始時刻を追加
    updateIntervalMs?: number;
};

export const ProgressBar = ({
                                scheduledStartTime,
                                scheduledEndTime,
                                startedAt,
                                updateIntervalMs = 15000,
                            }: ProgressBarProps) => {
    // 状態をオブジェクトで保持するように変更
    const [status, setStatus] = useState(() =>
        calculateMatchProgress(scheduledStartTime, scheduledEndTime, startedAt)
    );

    useEffect(() => {
        if (!scheduledStartTime || !scheduledEndTime) return;

        const timer = setInterval(() => {
            setStatus(calculateMatchProgress(scheduledStartTime, scheduledEndTime, startedAt));
        }, updateIntervalMs);

        return () => clearInterval(timer);
    }, [scheduledStartTime, scheduledEndTime, startedAt, updateIntervalMs]);

    if (!scheduledStartTime || !scheduledEndTime) return null;

    // 超過時はやや赤い色, 通常時は白にする
    const barColorClass = status.isOvertime ? "bg-red-400" : "bg-white";

    return (
        <div
            className="h-[5px] w-full overflow-hidden rounded-full bg-black/45"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={status.progress}
        >
            <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${barColorClass}`}
                style={{width: `${status.progress}%`}}
            />
        </div>
    );
};