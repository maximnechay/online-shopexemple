import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function AGBPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h1 className="text-4xl font-light mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>

          <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-medium mb-4">1. Geltungsbereich</h2>
              <p className="text-gray-700 mb-4">
                Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge über die Lieferung
                von Waren, die zwischen Élégance Beauty Shop (nachfolgend „Verkäufer" genannt) und dem
                Kunden (nachfolgend „Kunde" genannt) über den Online-Shop des Verkäufers geschlossen
                werden.
              </p>
              <p className="text-gray-700 mb-4">
                Entgegenstehende oder von diesen AGB abweichende Bedingungen des Kunden werden nicht
                anerkannt, es sei denn, der Verkäufer stimmt ihrer Geltung ausdrücklich zu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">2. Vertragspartner, Vertragsschluss</h2>
              <p className="text-gray-700 mb-4">
                Der Kaufvertrag kommt zustande mit:
              </p>
              <p className="text-gray-700 mb-4">
                Élégance Beauty Shop<br />
                Musterstraße 10<br />
                10115 Berlin<br />
                Deutschland
              </p>
              <p className="text-gray-700 mb-4">
                Die Präsentation der Waren im Online-Shop stellt kein rechtlich bindendes Angebot,
                sondern einen unverbindlichen Online-Katalog dar. Sie können unsere Produkte zunächst
                unverbindlich in den Warenkorb legen und Ihre Eingaben vor Absenden Ihrer verbindlichen
                Bestellung jederzeit korrigieren.
              </p>
              <p className="text-gray-700 mb-4">
                Durch Anklicken des Buttons „Zahlungspflichtig bestellen" geben Sie eine verbindliche
                Bestellung ab. Die Bestätigung des Zugangs Ihrer Bestellung erfolgt per E-Mail
                unmittelbar nach dem Absenden der Bestellung.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">3. Preise und Versandkosten</h2>
              <p className="text-gray-700 mb-4">
                Alle Preise sind Endpreise und enthalten die gesetzliche Mehrwertsteuer.
              </p>
              <p className="text-gray-700 mb-4">
                Neben den Endpreisen können für die Lieferung Versandkosten anfallen. Die Versandkosten
                werden Ihnen auf den Produktseiten, im Warenkorb und im Rahmen des Bestellvorgangs
                deutlich mitgeteilt.
              </p>
              <p className="text-gray-700 mb-4">
                Bei Lieferungen in Länder außerhalb der Europäischen Union können im Einzelfall weitere
                Kosten anfallen, die wir nicht zu vertreten haben und die von Ihnen zu tragen sind. Hierzu
                zählen beispielsweise Kosten für die Geldübermittlung durch Kreditinstitute oder Zölle.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">4. Lieferung, Warenverfügbarkeit</h2>
              <p className="text-gray-700 mb-4">
                Die Lieferung erfolgt nur innerhalb Deutschlands und in die im Online-Shop aufgeführten
                Länder.
              </p>
              <p className="text-gray-700 mb-4">
                Ist die Lieferung der Ware durch Ausverkauf oder aus anderen Gründen nicht möglich,
                informieren wir den Kunden unverzüglich. Im Falle der Nichtverfügbarkeit der Ware wird
                der Verkäufer den Kunden unverzüglich informieren und ihm gegebenenfalls die Lieferung
                eines vergleichbaren Produktes vorschlagen.
              </p>
              <p className="text-gray-700 mb-4">
                Die Lieferzeit beträgt, soweit nicht anders angegeben, 3-5 Werktage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">5. Zahlungsbedingungen</h2>
              <p className="text-gray-700 mb-4">
                Die Zahlung erfolgt wahlweise per:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Kreditkarte (Visa, MasterCard)</li>
                <li>PayPal</li>
                <li>Vorkasse (Überweisung)</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Bei Zahlung per Vorkasse nennen wir Ihnen unsere Bankverbindung in gesonderter E-Mail und
                liefern die Ware nach Zahlungseingang.
              </p>
              <p className="text-gray-700 mb-4">
                Bei Zahlung mittels einer von PayPal angebotenen Zahlungsart erfolgt die
                Zahlungsabwicklung über den Zahlungsdienstleister PayPal (Europe) S.à.r.l. et Cie, S.C.A.,
                22-24 Boulevard Royal, L-2449 Luxembourg.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">6. Eigentumsvorbehalt</h2>
              <p className="text-gray-700 mb-4">
                Die gelieferte Ware bleibt bis zur vollständigen Bezahlung Eigentum des Verkäufers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">7. Gewährleistung</h2>
              <p className="text-gray-700 mb-4">
                Es gelten die gesetzlichen Gewährleistungsrechte.
              </p>
              <p className="text-gray-700 mb-4">
                Ist der Kunde Verbraucher, beträgt die Gewährleistungsfrist für bewegliche Sachen zwei
                Jahre ab Ablieferung der Ware.
              </p>
              <p className="text-gray-700 mb-4">
                Gegenüber Unternehmern beträgt die Gewährleistungsfrist für bewegliche Sachen ein Jahr ab
                Ablieferung der Ware.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">8. Haftung</h2>
              <p className="text-gray-700 mb-4">
                Für Ansprüche aufgrund von Schäden, die durch uns, unsere gesetzlichen Vertreter oder
                Erfüllungsgehilfen verursacht wurden, haften wir stets unbeschränkt:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>bei Verletzung von Leben, Körper und Gesundheit</li>
                <li>bei vorsätzlicher oder grob fahrlässiger Pflichtverletzung</li>
                <li>bei Garantieversprechen, soweit vereinbart</li>
                <li>soweit der Anwendungsbereich des Produkthaftungsgesetzes eröffnet ist</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Bei Verletzung wesentlicher Vertragspflichten, deren Erfüllung die ordnungsgemäße
                Durchführung des Vertrages überhaupt erst ermöglicht und auf deren Einhaltung der
                Vertragspartner regelmäßig vertrauen darf, haften wir und unsere Erfüllungsgehilfen nur
                für den vorhersehbaren, vertragstypischen Schaden.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">9. Streitbeilegung</h2>
              <p className="text-gray-700 mb-4">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit,
                die Sie unter{' '}
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  https://ec.europa.eu/consumers/odr
                </a>{' '}
                finden.
              </p>
              <p className="text-gray-700 mb-4">
                Wir sind nicht bereit und verpflichtet, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">10. Schlussbestimmungen</h2>
              <p className="text-gray-700 mb-4">
                Auf Verträge zwischen dem Verkäufer und den Kunden findet das Recht der Bundesrepublik
                Deutschland Anwendung. Von dieser Rechtswahl ausgenommen sind die zwingenden
                Verbraucherschutzvorschriften des Landes, in dem der Kunde seinen gewöhnlichen Aufenthalt
                hat. Die Anwendung des UN-Kaufrechts ist ausgeschlossen.
              </p>
              <p className="text-gray-700 mb-4">
                Sofern es sich beim Kunden um einen Kaufmann, eine juristische Person des öffentlichen
                Rechts oder um ein öffentlich-rechtliches Sondervermögen handelt, ist Gerichtsstand für
                alle Streitigkeiten aus Vertragsverhältnissen zwischen dem Kunden und dem Verkäufer der
                Sitz des Verkäufers.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-gray-500 mb-4">
                Stand: November 2024
              </p>
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
