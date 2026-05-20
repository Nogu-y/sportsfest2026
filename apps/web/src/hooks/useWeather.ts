import useSWR from "swr";
import { useCallback } from "react";

type WeatherData = {
    hourly: {
        time: string[];
        weather_code: number[];
        precipitation_probability: Array<number | null>;
        temperature_2m: Array<number | null>;
        precipitation: Array<number | null>;
    };
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useWeather() {
    const { data, error, isLoading } = useSWR<WeatherData>('/api/weather', fetcher);

    // 指定した時刻（ミリ秒）に最も近いその時間の天気情報を取得する
    const getWeatherForTime = useCallback((targetTimeMs: number) => {
        if (!data?.hourly) return null;

        const targetDate = new Date(targetTimeMs);
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const hours = String(targetDate.getHours()).padStart(2, '0');
        const targetString = `${year}-${month}-${day}T${hours}:00`;

        const index = data.hourly.time.findIndex(t => t === targetString);

        if (index !== -1) {
            return {
                code: data.hourly.weather_code[index],
                prob: data.hourly.precipitation_probability[index],
                temp: data.hourly.temperature_2m[index],
                precip: data.hourly.precipitation[index],
            };
        }
        return null;
    }, [data]);

    return {
        weatherData: data,
        isLoading,
        isError: !!error,
        getWeatherForTime,
    };
}
