import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ImpressumPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-light mb-8">Impressum</h1>

          <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-medium mb-4">Angaben gemäß § 5 TMG</h2>
              <p className="text-gray-700">
                Élégance Beauty Shop<br />
                Musterstraße 10<br />
                10115 Berlin<br />
                Deutschland
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">Vertreten durch</h2>
              <p className="text-gray-700">
                Max Mustermann<br />
                Geschäftsführer
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">Kontakt</h2>
              <p className="text-gray-700">
                Telefon: +49 (123) 456-7890<br />
                E-Mail: info@elegance-beauty.de
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">Umsatzsteuer-ID</h2>
              <p className="text-gray-700">
                Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
                DE123456789
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">Handelsregister</h2>
              <p className="text-gray-700">
                Registergericht: Amtsgericht Berlin<br />
                Registernummer: HRB 12345
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
              <p className="text-gray-700">
                Max Mustermann<br />
                Musterstraße 10<br />
                10115 Berlin
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">EU-Streitschlichtung</h2>
              <p className="text-gray-700">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
                .<br />
                Unsere E-Mail-Adresse finden Sie oben im Impressum.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
              <p className="text-gray-700">
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">Haftungsausschluss</h2>

              <h3 className="text-xl font-medium mb-2 mt-4">Haftung für Inhalte</h3>
              <p className="text-gray-700 mb-4">
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
                nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
                Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
                Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
                Tätigkeit hinweisen.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">Haftung für Links</h3>
              <p className="text-gray-700 mb-4">
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
                Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
                Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
                Seiten verantwortlich.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">Urheberrecht</h3>
              <p className="text-gray-700">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
                dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
                der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
                Zustimmung des jeweiligen Autors bzw. Erstellers.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                ← Zurück zur Startseite
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
