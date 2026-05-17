'use client';

import {useEffect, useRef, useState} from 'react';
import {TransformComponent, TransformWrapper} from 'react-zoom-pan-pinch';

// ==========================================
// 1. 画像のオリジナルサイズ（ピクセル）を指定
// ==========================================
const IMAGE_WIDTH = 575;
const IMAGE_HEIGHT = 412;

// ==========================================
// 2. 基準点（アンカー）を3つ指定
// 画像上のどのピクセル(x, y)が、現実のどの緯度経度(lat, lng)か
// ==========================================

const ANCHORS = [
    // ポイント1: 画像の左上付近（例：22番の建物の左上角）
    // 手動で1.2倍補正
    {x: 97, y: 76, lat: 38.923105938451066, lng: 141.1052494975393},
    // 38.923105938451066, 141.1052494975393

    // ポイント2: 画像の右上付近（例：川沿いの角）
    {x: 417, y: 162, lat: 38.92551214286872, lng: 141.10607342991662},
    // 38.92551214286872, 141.10607342991662

    // ポイント3: 画像の左下付近（例：正門）
    {x: 178, y: 374, lat: 38.923679737563546, lng: 141.10821709071854},
];

// ==========================================
// 3. 緯度経度 → ピクセル座標への変換関数（アフィン変換）
// ==========================================
function latLngToPixels(lat: number, lng: number) {
    const [p1, p2, p3] = ANCHORS;

    // ベクトルの計算
    const dLat1 = p2.lat - p1.lat;
    const dLng1 = p2.lng - p1.lng;
    const dLat2 = p3.lat - p1.lat;
    const dLng2 = p3.lng - p1.lng;

    const dLat = lat - p1.lat;
    const dLng = lng - p1.lng;

    // クラメルの公式で連立方程式を解く (u, vの比率を求める)
    const det = dLat1 * dLng2 - dLat2 * dLng1;
    if (det === 0) return null; // 3点が一直線上にあるなどのエラー回避

    const u = (dLat * dLng2 - dLat2 * dLng) / det;
    const v = (dLat1 * dLng - dLat * dLng1) / det;

    // 比率を元に、画像のピクセル座標(X, Y)を算出
    const px = p1.x + u * (p2.x - p1.x) + v * (p3.x - p1.x);
    const py = p1.y + u * (p2.y - p1.y) + v * (p3.y - p1.y);

    return {x: px, y: py};
}

export default function CustomMapComponent() {
    const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [minScale, setMinScale] = useState<null | number>(null)
    const mapContainerRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setErrorMsg('お使いのブラウザは位置情報に対応していません。');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                // GPSから取得した緯度経度
                const {latitude, longitude} = position.coords;

                // 緯度経度を独自の計算式で画像のX,Yピクセルに変換！
                const pixels = latLngToPixels(latitude, longitude);
                if (pixels) {
                    setCurrentPos(pixels);
                }
            },
            (error) => setErrorMsg('位置情報の取得に失敗しました。'),
            {enableHighAccuracy: true, timeout: 10000, maximumAge: 0}
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);


    // minScaleを変更する関数.
    const calcMinScale = (size: { width: number; height: number }) => {
        if (size.height > size.width) {  // 縦長
            setMinScale(size.width / IMAGE_WIDTH)
        } else {  // 横長
            setMinScale(size.height / IMAGE_HEIGHT)
        }
    }
    
    // 画面サイズ変更時にminScaleを変更する関数.
    useEffect(() => {
        if (!mapContainerRef.current) return;

        const calcMinScaleHandler = (e: Event) => {
            const size = (e.target as HTMLDivElement).getBoundingClientRect()
            calcMinScale(size)
        }

        calcMinScale(mapContainerRef.current.getBoundingClientRect())
        mapContainerRef.current.addEventListener("resize", calcMinScaleHandler)
        return () => {
            mapContainerRef.current?.removeEventListener("resize", calcMinScaleHandler)
        }
    }, [mapContainerRef, mapContainerRef.current])

    return (
        <div ref={mapContainerRef} style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: '#e0e0e0',
            overflow: 'hidden'
        }}>

            {errorMsg && (
                <div style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    zIndex: 1000,
                    background: 'white',
                    padding: '10px',
                    color: 'red'
                }}>
                    {errorMsg}
                </div>
            )}
            {minScale ? (
                <TransformWrapper  /* ズーム・パン機能のラッパー */
                    initialScale={1}
                    minScale={minScale}
                    maxScale={4}
                    centerOnInit={true}
                    limitToBounds={true}
                    disablePadding={true}
                    centerZoomedOut={true}
                    wheel={{step: 0.1}} // マウスホイールでのズームの滑らかさ
                >
                    <TransformComponent wrapperStyle={{width: "100%", height: "100%"}}>

                        {/* 地図画像とピンを配置するコンテナ（画像サイズを基準にする） */}
                        <div style={{
                            position: 'relative',
                            width: `${IMAGE_WIDTH}px`,
                            height: `${IMAGE_HEIGHT}px`
                        }}>

                            {/* 地図画像 */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/img/map/campus.svg"
                                alt="Campus Map"
                                style={{width: '100%', height: '100%', display: 'block', pointerEvents: 'none'}}
                            />

                            {/* 現在地のピン (計算されたX, Y座標に絶対配置) */}
                            {currentPos && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        // ピンの先端が座標を指すように、少し上にずらして配置 (-50%, -100%)
                                        transform: 'translate(-50%, -100%)',
                                        left: `${currentPos.x}px`,
                                        top: `${currentPos.y}px`,
                                        width: '24px',
                                        height: '36px',
                                        zIndex: 10,
                                    }}
                                >
                                    {/* 簡易的なピンのデザイン（SVG） */}
                                    <svg viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M12 0C5.37 0 0 5.37 0 12C0 21 12 36 12 36C12 36 24 21 24 12C24 5.37 18.63 0 12 0ZM12 16.5C9.51 16.5 7.5 14.49 7.5 12C7.5 9.51 9.51 7.5 12 7.5C14.49 7.5 16.5 9.51 16.5 12C16.5 14.49 14.49 16.5 12 16.5Z"
                                            fill="#E91E63"/>
                                    </svg>
                                </div>
                            )}

                        </div>
                    </TransformComponent>
                </TransformWrapper>
            ) : null}
        </div>
    );
}