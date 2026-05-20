'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSportsFestData } from '../../hooks/useSportsFestData';
import { useCampusGps } from '../../hooks/useCampusGps';
import { MapViewer, MapPin } from './MapViewer';
import { LocationMatchesModal } from './LocationMatchesModal';

const TRAILING_SEPARATORS_PATTERN = /[\s\-_/・,，、。]+$/u;

const getCommonPrefix = (values: string[]) => {
    if (values.length === 0) return '';
    let prefix = values[0];
    for (let i = 1; i < values.length; i += 1) {
        const value = values[i];
        let j = 0;
        const limit = Math.min(prefix.length, value.length);
        while (j < limit && prefix[j] === value[j]) {
            j += 1;
        }
        prefix = prefix.slice(0, j);
        if (prefix.length === 0) break;
    }
    return prefix;
};

const getMergedPinLabel = (names: string[]) => {
    const normalized = names.map((name) => name.trim()).filter((name) => name.length > 0);
    if (normalized.length === 0) return '';
    if (normalized.length === 1) return normalized[0];

    const commonPrefix = getCommonPrefix(normalized).replace(TRAILING_SEPARATORS_PATTERN, '').trim();
    if (commonPrefix.length > 0) return commonPrefix;

    return [...normalized].sort((left, right) => left.length - right.length || left.localeCompare(right))[0];
};

export const InteractiveMap = () => {
    const { maps, locations, matches, isLoading } = useSportsFestData();
    const [activeMapId, setActiveMapId] = useState<number | null>(null);
    const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);

    // activeMapIdが未設定なら最初のマップ（全体マップ等）を選択
    const currentMapId = activeMapId ?? maps?.[0]?.id;
    const activeMap = maps?.find(m => m.id === currentMapId);

    // 現在のマップに属する会場（ピン）を抽出
    const activeLocations = locations?.filter(l => l.mapId === currentMapId) || [];

    // GPSはキャンパスマップ（id: 1を想定）のときのみ有効化
    const isCampusMap = currentMapId === 1;
    const { currentPos, errorMsg } = useCampusGps(isCampusMap);

    useEffect(() => {
        setSelectedPin(null);
    }, [currentMapId]);

    // 座標が完全一致する会場はピンを1つに統合
    const pins: MapPin[] = useMemo(() => {
        const groupedByCoordinate = new Map<string, typeof activeLocations>();

        for (const location of activeLocations) {
            const key = `${location.xRatio}:${location.yRatio}`;
            const current = groupedByCoordinate.get(key) ?? [];
            current.push(location);
            groupedByCoordinate.set(key, current);
        }

        return [...groupedByCoordinate.values()].map((group, index) => {
            const primary = group[0];
            const locationIds = group.map((location) => location.id);
            const isMerged = group.length > 1;
            const label = getMergedPinLabel(group.map((location) => location.name)) || primary.name;

            return {
                id: isMerged ? -(currentMapId * 1000 + index + 1) : primary.id,
                label,
                xRatio: primary.xRatio,
                yRatio: primary.yRatio,
                isHighlighted: false,
                locationIds,
            };
        });
    }, [activeLocations, currentMapId]);

    const selectedLocationIds = selectedPin?.locationIds ?? [];
    const selectedLocations = locations.filter((location) => selectedLocationIds.includes(location.id));
    const selectedLocationName = selectedPin?.label ?? selectedLocations[0]?.name ?? '';

    const locationMatches = matches.filter(
        (match) => match.locationId !== null && selectedLocationIds.includes(match.locationId),
    );

    if (isLoading || !activeMap) {
        return <div className="flex h-full items-center justify-center text-gray-500">読み込み中...</div>;
    }

    return (
        <div className="flex flex-col h-full w-full bg-white relative">
            {/* GPSエラー等のトースト表示 */}
            {errorMsg && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 rounded bg-red-500/90 px-4 py-2 text-xs font-bold text-white shadow">
                    {errorMsg}
                </div>
            )}

            {/* マップ切り替えタブ (マップが複数ある場合のみ表示) */}
            {maps.length > 1 && (
                <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 scrollbar-none">
                    {maps.map(map => (
                        <button
                            key={map.id}
                            onClick={() => setActiveMapId(map.id)}
                            className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors ${
                                currentMapId === map.id
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            {map.displayName}
                        </button>
                    ))}
                </div>
            )}

            {/* マップ描画領域 */}
            <div className="flex-1 relative">
                <MapViewer
                    imageUrl={activeMap.filePath}
                    imageWidth={activeMap.width}
                    imageHeight={activeMap.height}
                    pins={pins}
                    currentPos={currentPos}
                    onPinClick={(pin) => setSelectedPin(pin)}
                />
            </div>

            {/* 会場ピンクリック時の試合一覧モーダル */}
            <LocationMatchesModal
                isOpen={selectedPin !== null}
                onClose={() => setSelectedPin(null)}
                locationName={selectedLocationName}
                matches={locationMatches}
                locationFilters={selectedLocations.map((location) => ({ id: location.id, name: location.name }))}
            />
        </div>
    );
};
