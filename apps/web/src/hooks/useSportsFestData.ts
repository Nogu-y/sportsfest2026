import useSWR from 'swr';
import {useMemo, useRef} from 'react';
import {api} from '../lib/api/client';
import type {PublicMasterResponse} from '../../../api/src/schemas/public/master';
import type {LiveResponse} from '../../../api/src/schemas/public/live';
import type {MatchWithEventIdType} from '../types/SportsFestDataTypes';
import {ParticipantType} from "../../../api/src/schemas/sportsData";

export function useSportsFestData() {
    const latestMasterRef = useRef<PublicMasterResponse | null>(null);
    const latestLiveRef = useRef<LiveResponse | null>(null);
    const masterEtagRef = useRef<string>('');
    const liveEtagRef = useRef<string>('');


    // SWRに渡すフェッチャー関数
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

    // SWRに渡すフェッチャー関数
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
    const integratedMatches = useMemo((): MatchWithEventIdType[] => {
        if (!masterData?.matches) return [];

        // matchにeventIdを付加するためにまずblockIdとそのeventIdをMap化
        const blockIdToEventIdMap = new Map<number, number>();
        if (masterData.blocks) {
            masterData.blocks.forEach(block => {
                blockIdToEventIdMap.set(block.id, block.eventId);
            });
        }
        

        // ライブデータがまだない, または空の場合はマスタの全予定(Waiting)をそのまま返す
        if (!liveData?.matches || liveData.matches.length === 0) {
            return masterData.matches.map(m => ({
                ...m,
                eventId: blockIdToEventIdMap.get(m.eventBlockId) || 0,
            }));
        }

        // O(1)でライブデータを検索できるようMap化
        const liveMatchesMap = new Map(liveData.matches.map((m) => [m.id, m]));

        // マスタの全試合スケジュールを走査
        return masterData.matches.map((masterMatch) => {
            const liveMatch = liveMatchesMap.get(masterMatch.id);  // liveデータの対応するidの試合を取得 
            const eventId = blockIdToEventIdMap.get(masterMatch.eventBlockId) || 0;  // blockIdとeventIdのMapを使用してmatchにeventIdを紐づける

            // ライブデータ(進行中･終了)に存在しない試合は未開始(Waiting)のままスケジュールを表示
            if (!liveMatch) {
                return {
                    ...masterMatch,
                    eventId,
                };
            }

            // 進行中･終了した試合は最新のステータス, 実績時間, スコア･順位で上書き
            return {
                ...masterMatch,
                status: liveMatch.status,
                startedAt: liveMatch.startedAt,
                endedAt: liveMatch.endedAt,
                note: liveMatch.note,
                participants: liveMatch.participants, // スコアや順位, 失格フラグの同期
                eventId,
            };
        });
    }, [masterData?.matches, masterData?.blocks, liveData?.matches]);

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
    
    
    // systemInfoの日付データを使用し, 与えられた試合が1日目か2日目かを返す
    const dayLabelConverter = (startTime: Date) => {
        if (!masterData ) return null
        const day2 = new Date(masterData.systemInfo.day2);

        if (startTime < day2) {
            return "Day1";
        }else {
            return "Day2";
        }
    }
    
    
    const eventsMap = useMemo(() => new Map(masterData?.events.map((e) => [e.id, e])), [masterData?.events]);
    const locationsMap = useMemo(() => new Map(masterData?.locations.map((l) => [l.id, l])), [masterData?.locations]);
    const teamsMap = useMemo(() => new Map(masterData?.teams.map((t) => [t.id, t])), [masterData?.teams]);
    const blocksMap = useMemo(() => new Map(masterData?.blocks.map((b) => [b.id, b])), [masterData?.blocks]);
    const masterMatchesMap = useMemo(() => new Map(masterData?.matches?.map((m) => [m.id, m])), [masterData?.matches]);

    
    const getEvent = (eventId: number) => eventsMap.get(eventId);
    const getLocation = (locationId: number) => locationsMap.get(locationId);

    /**
     * participants を解析し、「〇〇 vs 〇〇」や「〇〇の勝者 vs 〇〇」の文字列を生成する
     */
    const getMatchTeamsLabel = (participants?: ParticipantType[]): string => {
        if (!participants || participants.length === 0) return "対戦カード未定";

        const teamNames = participants.map((p) => {
            // 1. チームが確定している場合
            if (p.teamId) {
                return teamsMap.get(p.teamId)?.name ?? "不明なチーム";
            }

            // 2. チームが未確定で, 前提試合(勝ち上がり元)が設定されている場合
            if (p.prereqMatchId) {
                const prereqMatch = masterMatchesMap.get(p.prereqMatchId);
                return prereqMatch?.name ? `${prereqMatch.name}の勝者` : "未定の勝者";
            }

            // 3. チームが未確定で, 前提ブロック(リーグ予選抜け等)が設定されている場合
            if (p.prereqBlockId) {
                const prereqBlock = blocksMap.get(p.prereqBlockId);
                // 順位条件(prereqRank)がある場合は「Aブロック 1位」のようにする
                const rankText = p.prereqRank ? ` ${p.prereqRank}位` : " 代表";
                return prereqBlock?.name ? `${prereqBlock.name}${rankText}` : `未定の${rankText}`;
            }

            return "未定";
        });

        // " vs " で結合して返す（3チーム以上の対戦にも自動対応）
        return teamNames.join(' vs ');
    };
    
    const getMatch = (matchId: number) => {
        return integratedMatches.find((m) => m.id === matchId);
    }
        

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
        eventBlocks: masterData?.blocks,
        // ライブデータで上書きした情報
        matches: integratedMatches,
        blockRankings: liveData?.blockRankings || [],
        scores: liveData?.scores || [],

        refreshMaster: mutateMaster,
        dayLabelConverter,
        getEvent,
        getLocation,
        getMatchTeamsLabel,
        getMatch,
    };
}