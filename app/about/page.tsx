// app/about/page.tsx
import Link from 'next/link';
import { Award, Heart, Sparkles, Users, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-24 pb-16">
                {/* Hero Section */}
                <section className="px-6 lg:px-8 mb-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                                    <Sparkles className="w-4 h-4 text-gray-900" />
                                    <span className="text-sm text-gray-900 font-medium">О нас</span>
                                </div>

                                <h1 className="text-5xl lg:text-6xl font-serif font-light text-gray-900 leading-tight">
                                    Ваш стиль —<br />
                                    <span className="italic text-gray-700">наша страсть</span>
                                </h1>

                                <p className="text-lg text-gray-600 leading-relaxed">
                                    Более 10 лет мы предлагаем нашим клиентам эксклюзивные премиум кроссовки
                                    и профессиональную консультацию. Для нас важно ваше удовлетворение и
                                    уникальный стиль.
                                </p>
                            </div>

                            <div className="relative h-[500px] rounded-3xl overflow-hidden bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 shadow-2xl">
                                <div className="absolute inset-0 flex items-center justify-center text-white/90">
                                    <div className="text-center p-12">
                                        <Sparkles className="w-32 h-32 mx-auto mb-6 opacity-80" />
                                        <p className="text-2xl font-serif">Sneakers Store</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="px-6 lg:px-8 mb-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid md:grid-cols-4 gap-8">
                            <div className="text-center">
                                <div className="text-5xl font-serif text-gray-900 mb-2">10+</div>
                                <p className="text-gray-600">Лет опыта</p>
                            </div>
                            <div className="text-center">
                                <div className="text-5xl font-serif text-gray-900 mb-2">15000+</div>
                                <p className="text-gray-600">Довольных клиентов</p>
                            </div>
                            <div className="text-center">
                                <div className="text-5xl font-serif text-gray-900 mb-2">20+</div>
                                <p className="text-gray-600">Премиум брендов</p>
                            </div>
                            <div className="text-center">
                                <div className="text-5xl font-serif text-gray-900 mb-2">1000+</div>
                                <p className="text-gray-600">Моделей</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="bg-gray-50 py-20 px-6 lg:px-8 mb-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-4">
                                Наши ценности
                            </h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Что нас отличает и вдохновляет
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-white rounded-2xl p-8 text-center hover:shadow-lg transition-shadow">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Award className="w-8 h-8 text-gray-900" />
                                </div>
                                <h3 className="text-xl font-serif text-gray-900 mb-3">
                                    Высочайшее качество
                                </h3>
                                <p className="text-gray-600">
                                    Мы предлагаем только оригинальные кроссовки от проверенных
                                    международных брендов. Качество для нас — это приоритет номер один.
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl p-8 text-center hover:shadow-lg transition-shadow">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Heart className="w-8 h-8 text-gray-900" />
                                </div>
                                <h3 className="text-xl font-serif text-gray-900 mb-3">
                                    Персональный подход
                                </h3>
                                <p className="text-gray-600">
                                    Наша опытная команда предоставит вам профессиональную консультацию
                                    и поможет найти идеальную пару для ваших потребностей.
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl p-8 text-center hover:shadow-lg transition-shadow">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Users className="w-8 h-8 text-gray-900" />
                                </div>
                                <h3 className="text-xl font-serif text-gray-900 mb-3">
                                    Удовлетворенность клиентов
                                </h3>
                                <p className="text-gray-600">
                                    Ваше удовлетворение — наш успех. Мы делаем все возможное,
                                    чтобы вы были полностью довольны нашими товарами и сервисом.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Story Section */}
                <section className="px-6 lg:px-8 mb-20">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-8 text-center">
                            Наша история
                        </h2>
                        <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
                            <p>
                                Начавшись в 2013 году как небольшой магазин кроссовок в Москве, мы выросли
                                в одного из ведущих поставщиков премиум обуви в России. Наш основатель,
                                вдохновленный страстью к уличной культуре и качественной обуви, имел видение:
                                дать каждому возможность выразить свой стиль через лучшие кроссовки.
                            </p>
                            <p>
                                За последние 10 лет мы постоянно расширяли наш ассортимент и сегодня работаем
                                с более чем 20 известными международными брендами. При этом мы никогда не
                                забывали наши корни: персональный подход, качество и удовлетворенность клиентов
                                по-прежнему находятся в центре нашей деятельности.
                            </p>
                            <p>
                                Сегодня мы обслуживаем более 15 000 довольных клиентов и гордимся тем, что
                                являемся частью их стиля жизни. Будь то в нашем интернет-магазине или в
                                шоуруме — у нас вы найдете идеальные кроссовки для ваших индивидуальных
                                потребностей.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="bg-gradient-to-b from-gray-50 to-white py-20 px-6 lg:px-8 mb-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-4">
                                Наша команда
                            </h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Профессиональные эксперты по кроссовкам со страстью
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    name: 'Алексей Петров',
                                    role: 'Основатель и CEO',
                                    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
                                },
                                {
                                    name: 'Мария Иванова',
                                    role: 'Менеджер по продукту',
                                    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'
                                },
                                {
                                    name: 'Дмитрий Соколов',
                                    role: 'Эксперт-консультант',
                                    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'
                                }
                            ].map((member, index) => (
                                <div key={index} className="text-center group">
                                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-200">
                                        <div
                                            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                                            style={{ backgroundImage: `url(${member.image})` }}
                                        />
                                    </div>
                                    <h3 className="text-xl font-serif text-gray-900 mb-1">
                                        {member.name}
                                    </h3>
                                    <p className="text-gray-600">{member.role}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-12 text-center text-white">
                            <h2 className="text-4xl font-serif mb-4">
                                Готовы начать свой путь?
                            </h2>
                            <p className="text-lg mb-8 text-white/90">
                                Откройте для себя нашу эксклюзивную коллекцию кроссовок
                            </p>
                            <Link
                                href="/catalog"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-medium hover:shadow-lg transition-all"
                            >
                                К каталогу
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
