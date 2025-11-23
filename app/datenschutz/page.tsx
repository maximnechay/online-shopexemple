import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function DatenschutzPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-light mb-8">Datenschutzerklärung</h1>

          <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-medium mb-4">1. Datenschutz auf einen Blick</h2>

              <h3 className="text-xl font-medium mb-2 mt-4">Allgemeine Hinweise</h3>
              <p className="text-gray-700 mb-4">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
                personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten
                sind alle Daten, mit denen Sie persönlich identifiziert werden können.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">Datenerfassung auf dieser Website</h3>
              <h4 className="text-lg font-medium mb-2 mt-3">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</h4>
              <p className="text-gray-700 mb-4">
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen
                Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
              </p>

              <h4 className="text-lg font-medium mb-2 mt-3">Wie erfassen wir Ihre Daten?</h4>
              <p className="text-gray-700 mb-4">
                Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es
                sich z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben.
              </p>
              <p className="text-gray-700 mb-4">
                Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch
                unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z.B. Internetbrowser,
                Betriebssystem oder Uhrzeit des Seitenaufrufs).
              </p>

              <h4 className="text-lg font-medium mb-2 mt-3">Wofür nutzen wir Ihre Daten?</h4>
              <p className="text-gray-700 mb-4">
                Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu
                gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
              </p>

              <h4 className="text-lg font-medium mb-2 mt-3">Welche Rechte haben Sie bezüglich Ihrer Daten?</h4>
              <p className="text-gray-700 mb-4">
                Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck
                Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die
                Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur
                Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit für die Zukunft
                widerrufen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">2. Hosting</h2>
              <p className="text-gray-700 mb-4">
                Wir hosten die Inhalte unserer Website bei folgendem Anbieter:
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">Externes Hosting</h3>
              <p className="text-gray-700 mb-4">
                Diese Website wird extern gehostet. Die personenbezogenen Daten, die auf dieser Website
                erfasst werden, werden auf den Servern des Hosters / der Hoster gespeichert. Hierbei kann
                es sich v.a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten,
                Vertragsdaten, Kontaktdaten, Namen, Websitezugriffe und sonstige Daten, die über eine
                Website generiert werden, handeln.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">3. Allgemeine Hinweise und Pflichtinformationen</h2>

              <h3 className="text-xl font-medium mb-2 mt-4">Datenschutz</h3>
              <p className="text-gray-700 mb-4">
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir
                behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen
                Datenschutzvorschriften sowie dieser Datenschutzerklärung.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">Hinweis zur verantwortlichen Stelle</h3>
              <p className="text-gray-700 mb-4">
                Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
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
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">4. Datenerfassung auf dieser Website</h2>

              <h3 className="text-xl font-medium mb-2 mt-4">Cookies</h3>
              <p className="text-gray-700 mb-4">
                Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind kleine Textdateien und
                richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend für die
                Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem
                Endgerät gespeichert.
              </p>
              <p className="text-gray-700 mb-4">
                Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert
                werden und Cookies nur im Einzelfall erlauben, die Annahme von Cookies für bestimmte Fälle
                oder generell ausschließen sowie das automatische Löschen der Cookies beim Schließen des
                Browsers aktivieren.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">Server-Log-Dateien</h3>
              <p className="text-gray-700 mb-4">
                Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten
                Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Browsertyp und Browserversion</li>
                <li>verwendetes Betriebssystem</li>
                <li>Referrer URL</li>
                <li>Hostname des zugreifenden Rechners</li>
                <li>Uhrzeit der Serveranfrage</li>
                <li>IP-Adresse</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">Kontaktformular</h3>
              <p className="text-gray-700 mb-4">
                Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem
                Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung
                der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">Registrierung auf dieser Website</h3>
              <p className="text-gray-700 mb-4">
                Sie können sich auf dieser Website registrieren, um zusätzliche Funktionen auf der Seite
                zu nutzen. Die dazu eingegebenen Daten verwenden wir nur zum Zwecke der Nutzung des
                jeweiligen Angebotes oder Dienstes, für den Sie sich registriert haben.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">5. Analyse-Tools und Werbung</h2>

              <h3 className="text-xl font-medium mb-2 mt-4">Google Analytics</h3>
              <p className="text-gray-700 mb-4">
                Diese Website nutzt Funktionen des Webanalysedienstes Google Analytics. Anbieter ist die
                Google Ireland Limited („Google"), Gordon House, Barrow Street, Dublin 4, Irland.
              </p>
              <p className="text-gray-700 mb-4">
                Google Analytics verwendet so genannte „Cookies". Das sind Textdateien, die auf Ihrem
                Computer gespeichert werden und die eine Analyse der Benutzung der Website durch Sie
                ermöglichen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">6. Plugins und Tools</h2>

              <h3 className="text-xl font-medium mb-2 mt-4">PayPal</h3>
              <p className="text-gray-700 mb-4">
                Auf dieser Website bieten wir u.a. die Bezahlung via PayPal an. Anbieter dieses
                Zahlungsdienstes ist die PayPal (Europe) S.à.r.l. et Cie, S.C.A., 22-24 Boulevard Royal,
                L-2449 Luxembourg (im Folgenden „PayPal").
              </p>
              <p className="text-gray-700 mb-4">
                Wenn Sie die Bezahlung via PayPal auswählen, werden die von Ihnen eingegebenen
                Zahlungsdaten an PayPal übermittelt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">7. Ihre Rechte</h2>
              <p className="text-gray-700 mb-4">
                Sie haben nach der DSGVO folgende Rechte:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
                <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
                <li>Recht auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO)</li>
              </ul>
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
