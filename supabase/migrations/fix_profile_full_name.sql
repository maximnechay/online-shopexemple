-- Исправляем триггер для корректного создания full_name из first_name и last_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            CONCAT_WS(' ', 
                NEW.raw_user_meta_data->>'first_name', 
                NEW.raw_user_meta_data->>'last_name'
            ),
            ''
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
