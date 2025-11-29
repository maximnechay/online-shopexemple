# Скрипт для генерации всех иконок из одного изображения

## Установите ImageMagick (если еще не установлен)

### Windows:
```powershell
# Используйте Chocolatey
choco install imagemagick
```

### macOS:
```bash
brew install imagemagick
```

### Linux:
```bash
sudo apt-get install imagemagick
```

## Использование:

Поместите ваш основной логотип (logo-source.png, размер 1024x1024 или больше) в папку public/ и выполните:

```bash
# Перейдите в папку public
cd public

# Создайте favicon.ico
magick logo-source.png -resize 32x32 favicon.ico

# Создайте logo.png (512x512)
magick logo-source.png -resize 512x512 logo.png

# Создайте icon-192.png
magick logo-source.png -resize 192x192 icon-192.png

# Создайте icon-512.png
magick logo-source.png -resize 512x512 icon-512.png

# Создайте apple-icon.png (180x180)
magick logo-source.png -resize 180x180 apple-icon.png

# Создайте og-image.jpg (1200x630)
# Этот нужно создать вручную в графическом редакторе с текстом
```

## Альтернатива: Онлайн инструменты

### Favicon Generator:
https://realfavicongenerator.net/
- Загрузите ваш логотип (минимум 512x512)
- Скачайте все сгенерированные иконки
- Поместите их в папку public/

### PWA Asset Generator:
https://www.pwabuilder.com/imageGenerator
- Загрузите логотип
- Скачайте все иконки для PWA
- Поместите в public/

### Open Graph Image Generator:
https://www.opengraph.xyz/
- Создайте красивое изображение для соцсетей
- Размер: 1200x630
- Скачайте как og-image.jpg
