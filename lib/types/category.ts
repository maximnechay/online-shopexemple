export type Category = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null; // ← ТВОЁ ПОЛЕ
    created_at: string | null;
    updated_at: string | null;
};
