import RouteModal from "../../../../../components/common/RouteModal";
import { MatchDetailView } from "../../../../../components/layouts/publicMatch/MatchDetailView";

export default async function MatchInterceptedPage({
                                                       params,
                                                   }: {
    params: Promise<{ match_id: string }>;
}) {
    const { match_id } = await params;
    const matchId = parseInt(match_id, 10);

    return (
        <RouteModal title={`#${match_id}`}>
            <MatchDetailView matchId={matchId} />
        </RouteModal>
    );
}