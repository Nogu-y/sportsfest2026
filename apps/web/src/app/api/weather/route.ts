import { NextResponse } from 'next/server';

// VercelのData Cacheを利用し, 15分(900秒)ごとにバックグラウンドで再検証する
export const revalidate = 900;

export async function GET() {
    try {
        // 一関高専の緯度経度
        const lat = 38.924;
        const lon = 141.107;
        // jma_seamless では precipitation_probability が null 返却になるため、
        // モデルは best_match(指定なし)を利用して降水確率を取得する。
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=weather_code,precipitation_probability,temperature_2m,precipitation&timezone=Asia%2FTokyo&forecast_days=3`;
        

        const res = await fetch(url);
        if (!res.ok) throw new Error('Weather API fetch failed');

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Weather API Error:", error);
        return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
    }
}
