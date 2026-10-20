import type { NextConfig } from "next";

/**
 * `output: "standalone"` нужен только для сборки Docker-образа (см. Dockerfile).
 * Vercel эту настройку игнорирует, зато она ломает локальный `next start`,
 * поэтому включается через переменную окружения, а не всегда.
 */
const nextConfig: NextConfig = {
    reactStrictMode: true,
    ...(process.env.BUILD_STANDALONE === "true"
        ? { output: "standalone" as const }
        : {}),

    // Приложение стало фуллстеком: загружаемых файлов с внешнего бэкенда больше
    // нет, все изображения лежат в /public.
    images: {
        remotePatterns: [],
    },

    // Заголовки безопасности для страниц проставляет middleware; здесь —
    // те, что должны прийти и на статику, и на ответы API.
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-Frame-Options", value: "DENY" },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
