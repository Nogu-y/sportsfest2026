import type {matchStatusEnumType} from "../../../api/src/schemas/sportsData";
import type { MatchWithEventIdType } from "../types/SportsFestDataTypes";

// 開始時刻を "HH:mm~" 形式に変換する
export const formatTimeLabel = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    // ゼロ埋めして "10:30" のような形式にする
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes} ~`;
};

// ステータスを日本語表記に変換する関数
export const formatStatusLabel = (status: matchStatusEnumType | string): string => {
    switch (status) {
        case 'Waiting':
            return '待機中';
        case 'Preparing':
            return '次の試合';
        case 'Playing':
            return '試合中';
        case 'Finished':
            return '結果入力待ち'; // 企画書の運用フローに準拠
        case 'Completed':
            return '終了済';
        case 'Cancelled':
            return '中止';
        default:
            return status || '';
    }
};

export const getMatchStartDelayMinutes = (
    match: Pick<MatchWithEventIdType, "status" | "scheduledStartTime" | "startedAt">,
    currentTime: Date = new Date(),
): number | null => {
    const scheduledStartMs = new Date(match.scheduledStartTime).getTime();
    if (Number.isNaN(scheduledStartMs)) {
        return null;
    }

    let delayedMs: number | null = null;

    if (match.startedAt) {
        const startedMs = new Date(match.startedAt).getTime();
        if (!Number.isNaN(startedMs)) {
            delayedMs = startedMs - scheduledStartMs;
        }
    } else if (match.status === "Waiting" || match.status === "Preparing") {
        delayedMs = currentTime.getTime() - scheduledStartMs;
    }

    if (delayedMs === null || delayedMs < 3 * 60 * 1000) {
        return null;
    }

    return Math.floor(delayedMs / (60 * 1000));
};

/**
 * 予定開始時刻と予定終了時刻から、現在の進行度を 0 ~ 100 のパーセンテージで返します。 実際の開始時刻を加味して、現在の進行度と超過状態を返します。
 * @param scheduledStartTime 予定開始時刻 (ISO8601等の文字列)
 * @param scheduledEndTime 予定終了時刻 (ISO8601等の文字列)
 * @param startedAt 実際の開始時刻
 * @param currentTime 基準となる現在時刻 (テスト用や固定値計算用に引数で渡せるようにしています。デフォルトは現在時刻)
 */
export const calculateMatchProgress = (
    scheduledStartTime: string,
    scheduledEndTime: string,
    startedAt?: string | null,
    currentTime: Date = new Date() 
): { progress: number; isOvertime: boolean } => {
    if (!scheduledStartTime || !scheduledEndTime) {
        return { progress: 0, isOvertime: false };
    }

    const schStartMs = new Date(scheduledStartTime).getTime();
    const schEndMs = new Date(scheduledEndTime).getTime();
    const nowMs = currentTime.getTime();

    if (isNaN(schStartMs) || isNaN(schEndMs)) {
        return { progress: 0, isOvertime: false };
    }

    // 予定されていた試合時間 (ミリ秒)
    const expectedDuration = schEndMs - schStartMs;
    if (expectedDuration <= 0) return { progress: 0, isOvertime: false };

    // 実際の開始時刻（未開始の場合は予定時刻をベースにする）
    const actualStartMs = startedAt ? new Date(startedAt).getTime() : schStartMs;

    // 実際の開始時刻から計算した「本来終わるべき時刻」
    const expectedEndMs = actualStartMs + expectedDuration;

    // まだ開始されていない場合
    if (nowMs <= actualStartMs) {
        return { progress: 0, isOvertime: false };
    }

    // 予定試合時間を超過しているか
    const isOvertime = nowMs > expectedEndMs;

    // 進行度を計算
    const elapsed = nowMs - actualStartMs;
    const progress = Math.floor((elapsed / expectedDuration) * 100);

    return {
        progress: Math.min(100, Math.max(0, progress)), // 0~100に収める
        isOvertime
    };
};
