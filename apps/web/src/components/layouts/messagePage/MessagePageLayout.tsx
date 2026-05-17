import {ReactNode} from "react";

export const MessagePageLayout = ({children}: {children: ReactNode} ) => {
    return (
        <div className="relative h-screen w-screen bg-black">
            {children}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[9999999] overflow-hidden"
            >
                {/* 配置用のコンテナ（画面中央上部、h-[546px]） */}
                <div className="absolute left-1/2 top-0 w-full min-w-[768px] -translate-x-1/2 -translate-y-1/2 h-[160%]">
                    {/* マスク用のコンテナ */}
                    <div className="absolute inset-0 [mask-image:radial-gradient(at_50%_18%,black_27%,transparent_70%)]">
                        <div className="absolute inset-0 overflow-hidden">
                            {/* 背景効果用のコンテナ。★ここを変更します。 */}
                            <div
                                className={`pointer-events-none absolute -inset-2.5 overflow-hidden blur-2xl invert transition-opacity duration-500 dark:opacity-70 dark:invert-0`}
                                style={{
                                    // CSS変数の定義（前回から変更なし）
                                    '--ds-background-200': '#1A1A1A',
                                    '--ds-teal-500': '#14B8A6',
                                    '--ds-blue-700': '#1E40AF',
                                    '--ds-purple-700': '#6B21A8',
                                    '--ds-pink-700': '#BE185D',
                                    '--ds-amber-700': '#B45309',

                                    '--background-color': 'var(--ds-background-200)',
                                    '--gaps': 'repeating-linear-gradient(110deg, var(--background-color) 0%, var(--background-color) 7%, transparent 10%, transparent 12%, var(--background-color) 19%)',
                                    '--lights': 'repeating-linear-gradient(110deg, var(--ds-teal-500) 10%, var(--ds-blue-700) 15%, var(--ds-purple-700) 20%, var(--ds-pink-700) 25%, var(--ds-amber-700) 30%)',

                                    // 背景画像の設定
                                    backgroundImage: 'var(--gaps), var(--lights)',
                                    transform: 'translate3d(0px, 0px, 0px)',
                                } as React.CSSProperties} // ← 型エラー回避のためのアサーション
                            >
                                {/* 実際にアニメーションするオーロラのレイヤー（ここも少し調整します） */}
                                <div
                                    className={`absolute h-full w-[300%] mix-blend-difference animate-northern-lights`}
                                    style={{
                                        backgroundImage: 'var(--gaps), var(--lights)',
                                    } as React.CSSProperties} // ← 型エラー回避のためのアサーション
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}