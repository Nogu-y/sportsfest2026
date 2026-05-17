import useSWR from 'swr';
import {useMemo, useRef} from 'react';
import {api} from '../lib/api/client';
import type {PublicMasterResponse} from '../../../api/src/schemas/public/master';
import type {LiveResponse} from '../../../api/src/schemas/public/live';

export function useSportsFestData() {
    const latestMasterRef = useRef<PublicMasterResponse | null>(null);
    const latestLiveRef = useRef<LiveResponse | null>(null);
    const masterEtagRef = useRef<string>('');
    const liveEtagRef = useRef<string>('');


    // SWRに渡すフェっチャー関数
    const fetchMaster = async (): Promise<PublicMasterResponse> => {
        const headers: Record<string, string> = {};
        if (masterEtagRef.current) headers['If-None-Match'] = masterEtagRef.current;

        const res = await api.api.public.master.$get({}, {headers});

        if (res.status === 304 && latestMasterRef.current) {
            return latestMasterRef.current;
        }
        if (!res.ok) throw new Error('マスタデータの取得に失敗しました');

        const etag = res.headers.get('ETag');
        if (etag) masterEtagRef.current = etag;

        const json = await res.json();
        latestMasterRef.current = json as PublicMasterResponse;
        return json as PublicMasterResponse;
    };

    // SWRに渡すフェっチャー関数
    const fetchLive = async (): Promise<LiveResponse> => {
        const headers: Record<string, string> = {};
        if (liveEtagRef.current) headers['If-None-Match'] = liveEtagRef.current;

        const res = await api.api.public.live.$get({}, {headers});

        if (res.status === 304 && latestLiveRef.current) {
            return latestLiveRef.current;
        }
        if (!res.ok) throw new Error('ライブデータの取得に失敗しました');

        const etag = res.headers.get('ETag');
        if (etag) liveEtagRef.current = etag;

        const json = await res.json();
        latestLiveRef.current = json as LiveResponse;
        return json as LiveResponse;
    };


    const {
        data: masterData,
        mutate: mutateMaster,
        error: masterError
    } = useSWR<PublicMasterResponse>('api/public/master', fetchMaster, {  // URLでは無くあくまでkey
        revalidateOnFocus: false,
    });

    const {
        data: liveData,
        error: liveError
    } = useSWR<LiveResponse>('api/public/live', fetchLive, {  // URLでは無くあくまでkey
        refreshInterval: 15000, // 15秒ごとに自動更新
        dedupingInterval: 2000,  // 2秒以内の重複リクエストは1つにまとめる.
    });

    /**
     * マスタの全試合(開始前含む)をベースに, 進行中･終了した試合をライブデータで上書き統合
     */
    const integratedMatches = useMemo(() => {
        if (!masterData?.matches) return [];

        // ライブデータがまだない, または空の場合はマスタの全予定(Waiting)をそのまま返す
        if (!liveData?.matches || liveData.matches.length === 0) {
            return masterData.matches;
        }

        // O(1)でライブデータを検索できるようMap化
        const liveMatchesMap = new Map(liveData.matches.map((m) => [m.id, m]));

        // マスタの全試合スケジュールを走査
        return masterData.matches.map((masterMatch) => {
            const liveMatch = liveMatchesMap.get(masterMatch.id);  // liveデータの対応するidの試合を取得 

            // ライブデータ(進行中･終了)に存在しない試合は未開始(Waiting)のままスケジュールを表示
            if (!liveMatch) return masterMatch;

            // 進行中･終了した試合は最新のステータス, 実績時間, スコア･順位で上書き
            return {
                ...masterMatch,
                status: liveMatch.status,
                startedAt: liveMatch.startedAt,
                endedAt: liveMatch.endedAt,
                note: liveMatch.note,
                participants: liveMatch.participants, // スコアや順位, 失格フラグの同期
            };
        });
    }, [masterData?.matches, liveData?.matches]);

    // マスタデータの鮮度の検証
    // 現段階ではライブデータに.mvを載せていないので死文. 実装したらコメントを解除する.
    /**
     useEffect(() => {
     if (!liveData || !masterData) return;

     const liveMasterVersion = (liveData as any).mv;
     const currentMasterVersion = masterData.systemInfo.masterVersion;

     if (liveMasterVersion && liveMasterVersion !== currentMasterVersion) {
     mutateMaster();
     }
     }, [liveData, masterData, mutateMaster]);
     **/

    // 外部コンポーネントに公開.
    return {
        isLoading: (!masterData && !masterError) || (!liveData && !liveError),
        isError: !!(masterError || liveError),

        // マスタのメタ情報
        systemInfo: masterData?.systemInfo,
        maps: masterData?.maps || [],
        locations: masterData?.locations || [],
        teams: masterData?.teams || [],
        events: masterData?.events || [],

        // ライブデータで上書きした情報
        matches: integratedMatches,
        blockRankings: liveData?.blockRankings || [],
        scores: liveData?.scores || [],

        refreshMaster: mutateMaster,
    };
}