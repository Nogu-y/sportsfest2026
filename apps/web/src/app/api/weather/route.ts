import { NextResponse } from 'next/server';

// VercelのData Cacheを利用し, 15分(900秒)ごとにバックグラウンドで再検証する
export const revalidate = 900;

export async function GET() {
    try {
        // 一関市の緯度経度 (大会会場に合わせて微調整してください)
        const lat = 38.93;
        const lon = 141.13;
        // Open-Meteoから天気情報を取得. 日本の気象庁(JMA)のモデルを明示的に指定（&models=jma_seamless ）.
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=weather_code,precipitation_probability&timezone=Asia%2FTokyo&forecast_days=3&models=jma_seamless`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Weather API fetch failed');

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Weather API Error:", error);
        return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
    }
}