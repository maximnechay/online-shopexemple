import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function WiderrufPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h1 className="text-4xl font-light mb-8">Widerrufsbelehrung</h1>

          <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-medium mb-4">Widerrufsrecht</h2>
              <p className="text-gray-700 mb-4">
                Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu
                widerrufen.
              </p>
              <p className="text-gray-700 mb-4">
                Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen
                benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw.
                hat.
              </p>
              <p className="text-gray-700 mb-4">
                Um Ihr Widerrufsrecht auszuüben, müssen Sie uns:
              </p>
              <p className="text-gray-700 mb-4">
                Élégance Beauty Shop<br />
                Musterstraße 10<br />
                10115 Berlin<br />
                Deutschland
              </p>
              <p className="text-gray-700 mb-4">
                Telefon: +49 (123) 456-7890<br />
                E-Mail: info@elegance-beauty.de
              </p>
              <p className="text-gray-700 mb-4">
                mittels einer eindeutigen Erklärung (z.B. ein mit der Post versandter Brief oder E-Mail)
                über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.
              </p>
              <p className="text-gray-700 mb-4">
                Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung
                des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">Folgen des Widerrufs</h2>
              <p className="text-gray-700 mb-4">
                Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen
                erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die
                sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene,
                günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn
                Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags
                bei uns eingegangen ist.
              </p>
              <p className="text-gray-700 mb-4">
                Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der
                ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich
                etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte
                berechnet.
              </p>
              <p className="text-gray-700 mb-4">
                Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder
                bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem,
                welches der frühere Zeitpunkt ist.
              </p>
              <p className="text-gray-700 mb-4">
                Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem
                Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns
                zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der
                Frist von vierzehn Tagen absenden.
              </p>
              <p className="text-gray-700 mb-4">
                Sie tragen die unmittelbaren Kosten der Rücksendung der Waren.
              </p>
              <p className="text-gray-700 mb-4">
                Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust
                auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht
                notwendigen Umgang mit ihnen zurückzuführen ist.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">Ausschluss des Widerrufsrechts</h2>
              <p className="text-gray-700 mb-4">
                Das Widerrufsrecht besteht nicht bei Verträgen:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>
                  zur Lieferung von Waren, die nicht vorgefertigt sind und für deren Herstellung eine
                  individuelle Auswahl oder Bestimmung durch den Verbraucher maßgeblich ist oder die
                  eindeutig auf die persönlichen Bedürfnisse des Verbrauchers zugeschnitten sind
                </li>
                <li>
                  zur Lieferung von Waren, die schnell verderben können oder deren Verfallsdatum schnell
                  überschritten würde
                </li>
                <li>
                  zur Lieferung versiegelter Waren, die aus Gründen des Gesundheitsschutzes oder der
                  Hygiene nicht zur Rückgabe geeignet sind, wenn ihre Versiegelung nach der Lieferung
                  entfernt wurde
                </li>
                <li>
                  zur Lieferung von Waren, wenn diese nach der Lieferung auf Grund ihrer Beschaffenheit
                  untrennbar mit anderen Gütern vermischt wurden
                </li>
                <li>
                  zur Lieferung von Ton- oder Videoaufnahmen oder Computersoftware in einer versiegelten
                  Packung, wenn die Versiegelung nach der Lieferung entfernt wurde
                </li>
              </ul>
            </section>

            <section className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-medium mb-4">Muster-Widerrufsformular</h2>
              <p className="text-gray-700 mb-4">
                Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und
                senden Sie es zurück.
              </p>
              <div className="bg-white p-6 border border-gray-300 rounded">
                <p className="text-gray-700 mb-2">An:</p>
                <p className="text-gray-700 mb-4">
                  Élégance Beauty Shop<br />
                  Musterstraße 10<br />
                  10115 Berlin<br />
                  Deutschland<br />
                  E-Mail: info@elegance-beauty.de
                </p>
                <p className="text-gray-700 mb-4">
                  Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den
                  Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)
                </p>
                <p className="text-gray-700 mb-4">
                  Bestellt am (*)/erhalten am (*)
                </p>
                <p className="text-gray-700 mb-4">
                  Name des/der Verbraucher(s)
                </p>
                <p className="text-gray-700 mb-4">
                  Anschrift des/der Verbraucher(s)
                </p>
                <p className="text-gray-700 mb-4">
                  Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)
                </p>
                <p className="text-gray-700">
                  Datum
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  (*) Unzutreffendes streichen
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">Besondere Hinweise</h2>
              <p className="text-gray-700 mb-4">
                Bitte vermeiden Sie Beschädigungen und Verunreinigungen der Ware. Senden Sie die Ware
                bitte in Originalverpackung mit sämtlichem Zubehör und mit allen Verpackungsbestandteilen
                an uns zurück. Verwenden Sie ggf. eine schützende Umverpackung. Wenn Sie die
                Originalverpackung nicht mehr besitzen, sorgen Sie bitte mit einer geeigneten Verpackung
                für einen ausreichenden Schutz vor Transportschäden.
              </p>
              <p className="text-gray-700 mb-4">
                Bitte senden Sie die Ware nicht unfrei an uns zurück.
              </p>
              <p className="text-gray-700 mb-4">
                Bitte beachten Sie, dass die vorgenannten Modalitäten nicht Voraussetzung für die
                wirksame Ausübung des Widerrufsrechts sind.
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
