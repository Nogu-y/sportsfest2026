'use client';

import Modal from '../common/Modal';
import { MatchCardList } from '../common/MatchCardList';
import { MatchWithEventIdType } from '../../types/SportsFestDataTypes';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    locationName: string;
    matches: MatchWithEventIdType[];
};

export const LocationMatchesModal = ({ isOpen, onClose, locationName, matches }: Props) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${locationName} の試合`}>
            {matches.length > 0 ? (
                <div className="py-2">
                    <MatchCardList matches={matches} />
                </div>
            ) : (
                <p className="py-8 text-center text-sm text-gray-500">
                    現在、この会場での試合予定はありません。
                </p>
            )}
        </Modal>
    );
};