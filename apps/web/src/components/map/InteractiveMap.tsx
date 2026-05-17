'use client';

import { useState } from 'react';
import { useSportsFestData } from '../../hooks/useSportsFestData';
import { useCampusGps } from '../../hooks/useCampusGps';
import { MapViewer, MapPin } from './MapViewer';
import { LocationMatchesModal } from './LocationMatchesModal';

export const InteractiveMap = () => {
    const { maps, locations, matches, isLoading } = useSportsFestData();
    console.log("a", maps, locations, matches)
    const [activeMapId, setActiveMapId] = useState<number | null>(null);
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

    // activeMapIdが未設定なら最初のマップ（全体マップ等）を選択
    const currentMapId = activeMapId ?? maps?.[0]?.id;
    const activeMap = maps?.find(m => m.id === currentMapId);

    // 現在のマップに属する会場（ピン）を抽出
    const activeLocations = locations?.filter(l => l.mapId === currentMapId) || [];

    // GPSはキャンパスマップ（id: 1を想定）のときのみ有効化
    const isCampusMap = currentMapId === 1;
    const { currentPos, errorMsg } = useCampusGps(isCampusMap);

    if (isLoading || !activeMap) {
        return <div className="flex h-full items-center justify-center text-gray-500">読み込み中...</div>;
    }

    // MapViewerに渡すためのピン配列を生成
    const pins: MapPin[] = activeLocations.map(loc => ({
        id: loc.id,
        label: loc.name,
        xRatio: loc.xRatio,
        yRatio: loc.yRatio,
        isHighlighted: false,
    }));

    // 選択された会場での試合を抽出（時間順などソートも可能）
    const selectedLocationName = locations?.find(l => l.id === selectedLocationId)?.name || '';
    const locationMatches = matches.filter(m => m.locationId === selectedLocationId);

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
                    onPinClick={(pin) => setSelectedLocationId(pin.id)}
                />
            </div>

            {/* 会場ピンクリック時の試合一覧モーダル */}
            <LocationMatchesModal
                isOpen={selectedLocationId !== null}
                onClose={() => setSelectedLocationId(null)}
                locationName={selectedLocationName}
                matches={locationMatches}
            />
        </div>
    );
};