// lib/types/banner.ts
export type HomeBanner = {
    id: string;
    title: string | null;
    subtitle: string | null;      // цветная строка
    description: string | null;   // абзац под заголовком
    buttonText: string | null;
    buttonUrl: string | null;
    desktopImageUrl: string;
    mobileImageUrl: string | null;
    isActive: boolean;
};
