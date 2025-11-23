// app/page.tsx
'use client';

import Link from 'next/link';
import {
    ArrowRight,
    Check,
    Package,
    Truck,
    Shield,
    Award,
    Star,
    Sparkles,
    Mail
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            {/* Hero Section - Professional Minimalist */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <div className="space-y-8">
                            {/* Small badge */}
                            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-1 text-xs uppercase tracking-[0.16em] text-gray-600">
                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Новые поступления - топовые бренды
                            </div>

                            <div className="space-y-6">
                                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 leading-[1.1] tracking-tight">
                                    Премиум кроссовки
                                    <span className="block font-normal mt-2">для каждого стиля</span>
                                </h1>

                                <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                                    Оригинальные кроссовки от ведущих мировых брендов.
                                    Профессионально подобранные, с гарантией качества и быстрой доставкой.
                                </p>
                            </div>

                            {/* CTA */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link
                                    href="/catalog"
                                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
                                >
                                    Zum Shop
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="/about"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-300 text-gray-900 font-medium hover:border-gray-900 transition-colors"
                                >
                                    Mehr erfahren
                                </Link>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap items-center gap-10 pt-8 border-t border-gray-200">
                                <div>
                                    <div className="text-4xl font-light text-gray-900 mb-1">1000+</div>
                                    <div className="text-sm text-gray-600">Моделей</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-light text-gray-900 mb-1">20+</div>
                                    <div className="text-sm text-gray-600">Брендов</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-light text-gray-900 mb-1">15k+</div>
                                    <div className="text-sm text-gray-600">Покупателей</div>
                                </div>
                            </div>

                            {/* Trust line */}
                            <div className="flex items-center gap-3 text-sm text-gray-500 pt-2">
                                <Shield className="w-4 h-4" />
                                <span>100% оригинальная продукция от авторизованных дистрибьюторов</span>
                            </div>
                        </div>

                        {/* Right Image */}
                        <div className="relative lg:h-[600px]">
                            <div className="relative h-full rounded-3xl bg-gray-100 overflow-hidden border border-gray-100 shadow-sm">
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{
                                        backgroundImage:
                                            "url('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=1600&fit=crop')"
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                                <div className="absolute bottom-8 left-8 right-8">
                                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                                        <div className="text-white space-y-1">
                                            <p className="text-xs uppercase tracking-[0.18em] text-white/70">
                                                Ваш стиль
                                            </p>
                                            <p className="text-2xl font-light">Премиум качество каждый день</p>
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs text-gray-900 backdrop-blur">
                                            <Truck className="w-4 h-4" />
                                            <span>Бесплатная доставка от 5000 ₽</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Badge */}
                            <div className="absolute -bottom-8 -left-8 bg-white shadow-lg p-6 border border-gray-100 rounded-3xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-black flex items-center justify-center rounded-2xl">
                                        <Award className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1">
                                            <div className="text-2xl font-light text-gray-900">4.9/5</div>
                                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            на основе более 1 200 отзывов
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Brand strip */}
            <section className="py-10 px-4 sm:px-6 lg:px-8 border-y border-gray-100 bg-white">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                        Популярные бренды
                    </p>
                    <div className="flex flex-wrap gap-x-10 gap-y-4 text-sm sm:text-base text-gray-500">
                        <span className="tracking-wide">Nike</span>
                        <span className="tracking-wide">Adidas</span>
                        <span className="tracking-wide">New Balance</span>
                        <span className="tracking-wide">Puma</span>
                        <span className="tracking-wide">Asics</span>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16">
                        <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                            Категории
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl">
                            Откройте для себя нашу тщательно подобранную коллекцию кроссовок
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                name: 'Беговые',
                                desc: 'Для бега и тренировок',
                                image:
                                    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=800&fit=crop'
                            },
                            {
                                name: 'Баскетбольные',
                                desc: 'Для баскетбола',
                                image:
                                    'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=600&h=800&fit=crop'
                            },
                            {
                                name: 'Повседневные',
                                desc: 'На каждый день',
                                image:
                                    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=800&fit=crop'
                            },
                            {
                                name: 'Тренировочные',
                                desc: 'Для кроссфита и зала',
                                image:
                                    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=800&fit=crop'
                            }
                        ].map((category, index) => (
                            <Link
                                key={index}
                                href="/catalog"
                                className="group relative overflow-hidden aspect-[3/4] bg-gray-100 rounded-3xl"
                            >
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                    style={{ backgroundImage: `url(${category.image})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <h3 className="text-xl font-light mb-1">{category.name}</h3>
                                    <p className="text-sm text-white/80 mb-3">{category.desc}</p>
                                    <div className="inline-flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                        Ansehen <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bestseller Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-3">
                                Бестселлеры
                            </h2>
                            <p className="text-lg text-gray-600 max-w-xl">
                                Наши самые популярные модели, выбранные покупателями и экспертами.
                            </p>
                        </div>
                        <Link
                            href="/catalog"
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 border-b border-gray-900/30 hover:border-gray-900"
                        >
                            Все модели
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                name: 'Air Zoom Pegasus',
                                brand: 'Nike',
                                price: '12 990 ₽',
                                size: 'EU 36-46',
                                tag: 'Хит продаж'
                            },
                            {
                                name: 'Ultraboost Light',
                                brand: 'Adidas',
                                price: '18 990 ₽',
                                size: 'EU 36-46',
                                tag: 'Новинка'
                            },
                            {
                                name: 'Air Force 1',
                                brand: 'Nike',
                                price: '10 990 ₽',
                                size: 'EU 36-46',
                                tag: 'Классика'
                            },
                            {
                                name: 'GEL-Kayano 30',
                                brand: 'Asics',
                                price: '17 990 ₽',
                                size: 'EU 36-46',
                                tag: 'Премиум'
                            }
                        ].map((product, index) => (
                            <Link
                                key={index}
                                href="/catalog"
                                className="group rounded-3xl border border-gray-100 bg-white p-4 sm:p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="aspect-[4/5] rounded-2xl bg-gray-50 mb-4 overflow-hidden relative">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Package className="w-10 h-10 text-gray-300 group-hover:scale-105 transition-transform" />
                                    </div>
                                    <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/80 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white">
                                        <Sparkles className="w-3 h-3" />
                                        <span>{product.tag}</span>
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                                        {product.brand}
                                    </p>
                                    <h3 className="text-sm font-medium text-gray-900">
                                        {product.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-3">{product.size}</p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-base font-medium text-gray-900">
                                            {product.price}
                                        </span>
                                        <span className="text-xs font-medium text-gray-500 group-hover:text-gray-900 flex items-center gap-1">
                                            Details
                                            <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12">
                        {[
                            {
                                icon: Truck,
                                title: 'Быстрая доставка',
                                desc: '2-3 дня по всей России'
                            },
                            {
                                icon: Shield,
                                title: '100% оригинал',
                                desc: 'Авторизованные дилеры'
                            },
                            {
                                icon: Check,
                                title: 'Безопасная оплата',
                                desc: 'SSL шифрование'
                            },
                            {
                                icon: Award,
                                title: 'Программа лояльности',
                                desc: 'До 15% скидки'
                            }
                        ].map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div key={index} className="text-center">
                                    <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center">
                                        <Icon className="w-8 h-8 text-gray-900" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-gray-600">{feature.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl lg:text-5xl font-light text-white mb-6">
                        Готовы начать?
                    </h2>
                    <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                        Откройте для себя нашу коллекцию и найдите идеальные кроссовки для вашего стиля
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/catalog"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors"
                        >
                            К каталогу
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/about"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-700 text-white font-medium hover:border-gray-500 transition-colors"
                        >
                            О нас
                        </Link>
                    </div>
                </div>
            </section>

            {/* Newsletter / Info Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-4xl mx-auto rounded-3xl border border-gray-100 bg-gray-50/60 p-8 sm:p-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                    <div className="flex items-start gap-4">
                        <div className="mt-1">
                            <Mail className="w-6 h-6 text-gray-900" />
                        </div>
                        <div>
                            <h3 className="text-xl font-medium text-gray-900 mb-1">
                                Эксклюзивные предложения на email
                            </h3>
                            <p className="text-sm text-gray-600 max-w-md">
                                Узнавайте первыми о новых брендах, акциях и лимитированных коллекциях.
                                Никакого спама, только вдохновение.
                            </p>
                        </div>
                    </div>
                    <form className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            placeholder="Ваш email адрес"
                            className="w-full sm:w-64 px-4 py-3 text-sm border border-gray-200 rounded-full outline-none focus:border-gray-900"
                        />
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                            Подписаться
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </section>

            <Footer />
        </div>
    );
}
