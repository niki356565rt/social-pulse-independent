import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Impressum = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Startseite
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Impressum</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Angaben gemäß § 5 TMG</h2>
            <div className="text-muted-foreground leading-relaxed">
              <p>Niklas Schütz</p>
              <p>Michaelisstraße</p>
              <p>99084 Erfurt</p>
              <p>Deutschland</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Kontakt</h2>
            <div className="text-muted-foreground leading-relaxed">
              <p>E-Mail: niklasschutz528@gmail.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Umsatzsteuer-ID</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kleinunternehmer gemäß § 19 UStG - keine Umsatzsteuer-Identifikationsnummer vorhanden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <div className="text-muted-foreground leading-relaxed">
              <p>Niklas Schütz</p>
              <p>Michaelisstraße</p>
              <p>99084 Erfurt</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Streitschlichtung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
              <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Haftung für Inhalte</h2>
            <p className="text-muted-foreground leading-relaxed">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den 
              allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht 
              verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen 
              zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen 
              Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt 
              der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden 
              Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Haftung für Links</h2>
            <p className="text-muted-foreground leading-relaxed">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. 
              Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der 
              verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Urheberrecht</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen 
              Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der 
              Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Impressum;
