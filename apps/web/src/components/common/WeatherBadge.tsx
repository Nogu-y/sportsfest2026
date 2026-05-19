import React from "react";
import { Sun, CloudSun, Cloud, CloudDrizzle, CloudRain, CloudLightning, Snowflake } from "lucide-react";

type WeatherBadgeProps = {
    weather?: { code: number; prob: number } | null;
    done?: boolean;
    variant?: "full" | "simple"; // full: アイコン+テキスト+確率, simple: アイコン+確率
};

const getWeatherInfo = (code: number) => {
    if (code === 0) return { icon: <Sun size={14} />, text: "快晴" };
    if (code === 1 || code === 2) return { icon: <CloudSun size={14} />, text: "晴れ/曇" };
    if (code === 3) return { icon: <Cloud size={14} />, text: "曇り" };
    if (code >= 40 && code <= 49) return { icon: <Cloud size={14} />, text: "霧" };
    if (code >= 50 && code <= 59) return { icon: <CloudDrizzle size={14} />, text: "霧雨" };
    if (code >= 60 && code <= 69) return { icon: <CloudRain size={14} />, text: "雨" };
    if (code >= 70 && code <= 79) return { icon: <Snowflake size={14} />, text: "雪" };
    if (code >= 80 && code <= 89) return { icon: <CloudRain size={14} />, text: "にわか雨" };
    if (code >= 90 && code <= 99) return { icon: <CloudLightning size={14} />, text: "雷雨" };
    return { icon: <CloudSun size={14} />, text: "不明" };
};

export const WeatherBadge: React.FC<WeatherBadgeProps> = ({ weather, done = false, variant = "full" }) => {
    if (!weather) return null;

    const info = getWeatherInfo(weather.code);
    const isHighProb = weather.prob >= 30;

    // SimpleSlot用のコンパクトなデザイン
    if (variant === "simple") {
        return (
            <div className="flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-gray-50 rounded text-xs text-gray-500">
                <span className={done ? "opacity-50" : "text-[#2d5a8e]"}>{info.icon}</span>
                <span className={`font-medium ${done ? "opacity-50" : isHighProb ? "text-blue-500" : ""}`}>
          {weather.prob}%
        </span>
            </div>
        );
    }

    // TimeSlot用の標準デザイン (テキストあり)
    return (
        <div className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100 text-xs text-gray-500">
            <span className={done ? "opacity-50" : "text-[#2d5a8e]"}>{info.icon}</span>
            <span className={done ? "opacity-50" : ""}>{info.text}</span>
            <span className={`font-medium ${done ? "opacity-50" : isHighProb ? "text-blue-500" : ""}`}>
        {weather.prob}%
      </span>
        </div>
    );
};