 "use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MatchCard from "./MatchCard";
import {MatchWithEventIdType} from "../../types/SportsFestDataTypes";

const INITIAL_RENDER_COUNT = 24;
const RENDER_CHUNK_SIZE = 24;

export const MatchCardList = ({matches, horizontal = false}: {
    matches: MatchWithEventIdType[]
    horizontal?: boolean,
}) => {
    const [visibleCount, setVisibleCount] = useState(INITIAL_RENDER_COUNT);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const visibleMatches = useMemo(
        () => (horizontal ? matches : matches.slice(0, visibleCount)),
        [horizontal, matches, visibleCount]
    );

    useEffect(() => {
        setVisibleCount(INITIAL_RENDER_COUNT);
    }, [matches]);

    useEffect(() => {
        if (horizontal) {
            return;
        }

        const sentinel = loadMoreRef.current;
        if (!sentinel) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (!entry?.isIntersecting) {
                    return;
                }

                setVisibleCount((current) =>
                    Math.min(current + RENDER_CHUNK_SIZE, matches.length)
                );
            },
            {
                rootMargin: "320px 0px",
            }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [horizontal, matches.length]);

    return (
        <div className={`flex gap-2 scrollbar-none ${horizontal? "flex-row overflow-y-hidden": "flex-col overflow-x-hidden"}`}>
            {
                visibleMatches.map((match: MatchWithEventIdType) => <MatchCard match={match} key={match.id}/>)
            }
            {!horizontal && visibleCount < matches.length ? (
                <div
                    ref={loadMoreRef}
                    className="h-6 w-full"
                    aria-hidden="true"
                />
            ) : null}
        </div>
    )
}
