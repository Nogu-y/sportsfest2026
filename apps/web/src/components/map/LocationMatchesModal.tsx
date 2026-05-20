'use client';

import Modal from '../common/Modal';
import { MatchCardList } from '../common/MatchCardList';
import { MatchWithEventIdType } from '../../types/SportsFestDataTypes';
import { useEffect, useMemo, useState } from 'react';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    locationName: string;
    matches: MatchWithEventIdType[];
    locationFilters?: Array<{ id: number; name: string }>;
};

export const LocationMatchesModal = ({ isOpen, onClose, locationName, matches, locationFilters = [] }: Props) => {
    const [selectedLocationId, setSelectedLocationId] = useState<number | "all">("all");

    useEffect(() => {
        if (isOpen) {
            setSelectedLocationId("all");
        }
    }, [isOpen, locationName]);

    const filteredMatches = useMemo(() => {
        if (selectedLocationId === "all") return matches;
        return matches.filter((match) => match.locationId === selectedLocationId);
    }, [matches, selectedLocationId]);

    const hasFilter = locationFilters.length > 1;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${locationName} の試合`}>
            {hasFilter && (
                <div className="mb-3 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setSelectedLocationId("all")}
                        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                            selectedLocationId === "all"
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        すべて
                    </button>
                    {locationFilters.map((location) => (
                        <button
                            key={location.id}
                            type="button"
                            onClick={() => setSelectedLocationId(location.id)}
                            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                                selectedLocationId === location.id
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {location.name}
                        </button>
                    ))}
                </div>
            )}
            {filteredMatches.length > 0 ? (
                <div className="py-2">
                    <MatchCardList matches={filteredMatches} />
                </div>
            ) : (
                <p className="py-8 text-center text-sm text-gray-500">
                    現在、この会場での試合予定はありません。
                </p>
            )}
        </Modal>
    );
};
