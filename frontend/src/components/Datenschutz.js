import React from 'react';
import './Datenschutz.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const Impressum = ({ 
      onBack }) => {

  return (
    <div className="impressum-container">
        <div className="back-button" onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </div>
      <h1 className='h1-impressum'> Datenschutz</h1>
      <p>
      Verantwortlicher im Sinne der Datenschutzgesetze, insbesondere der EU-Datenschutzgrundverordnung (DSGVO), ist: <br/> <br/>

        Julian Schäpermeier <br />
        Von-den-Berken Straße 3c <br />
        44141 Dortmund

      </p>
      
     <h2 className='h2-impressum'> Ihre Betroffenenrechte</h2>
    <p>
        Unter den angegebenen Kontaktdaten unseres Datenschutzbeauftragten können Sie jederzeit folgende Rechte ausüben:  <br />
            <ul>
              <li> Auskunft über Ihre bei uns gespeicherten Daten und deren Verarbeitung (Art. 15 DSGVO),</li>
              <li> Berichtigung unrichtiger personenbezogener Daten (Art. 16 DSGVO),</li>
              <li> Löschung Ihrer bei uns gespeicherten Daten (Art. 17 DSGVO),</li>
              <li> Einschränkung der Datenverarbeitung, sofern wir Ihre Daten aufgrund gesetzlicher Pflichten noch nicht löschen dürfen (Art. 18 DSGVO),</li>
              <li> Widerspruch gegen die Verarbeitung Ihrer Daten bei uns (Art. 21 DSGVO) und</li>
              <li> Datenübertragbarkeit, sofern Sie in die Datenverarbeitung eingewilligt haben oder einen Vertrag mit uns abgeschlossen haben (Art. 20 DSGVO).</li>
            </ul>
      Sofern Sie uns eine Einwilligung erteilt haben, können Sie diese jederzeit mit Wirkung für die Zukunft widerrufen. <br /> <br />

      Sie können sich jederzeit mit einer Beschwerde an eine Aufsichtsbehörde wenden, z. B. an die zuständige Aufsichtsbehörde des Bundeslands Ihres Wohnsitzes oder an die für uns als verantwortliche Stelle zuständige Behörde.  <br /> <br />

      Eine Liste der Aufsichtsbehörden (für den nichtöffentlichen Bereich) mit Anschrift finden Sie unter: https://www.bfdi.bund.de/.
    </p>

    <h2 className='h2-impressum'> Registrierung auf unserer Website</h2>
      <h3 className='h3-impressum'> Art und Zweck der Verarbeitung:</h3>
        <p>
        Für die Registrierung auf unserer Website benötigen wir einige personenbezogene Daten, die über eine Eingabemaske an uns übermittelt werden. <br />

        Ihre Registrierung ist für das Bereithalten bestimmter Inhalte und Leistungen auf unserer Website erforderlich. <br />
        </p>
      <h3 className='h3-impressum'> Rechtsgrundlage:</h3>
        <p>
        Die Verarbeitung der bei der Registrierung eingegebenen Daten erfolgt auf Grundlage einer Einwilligung des Nutzers (Art. 6 Abs. 1 lit. a DSGVO).
        </p>

      <h3 className='h3-impressum'> Empfänger:</h3>
        <p>
        Empfänger der Daten sind ggf. technische Dienstleister, die für den Betrieb und die Wartung unserer Website als Auftragsverarbeiter tätig werden.
        </p>

      <h3 className='h3-impressum'> Speicherdauer:</h3>
        <p>
        Daten werden in diesem Zusammenhang nur verarbeitet, solange die entsprechende Einwilligung vorliegt.
        </p>

      <h3 className='h3-impressum'> Bereitstellung vorgeschrieben oder erforderlich:</h3>
        <p>
        Die Bereitstellung Ihrer personenbezogenen Daten erfolgt freiwillig, allein auf Basis Ihrer Einwilligung. 
        Ohne die Bereitstellung Ihrer personenbezogenen Daten können wir Ihnen keinen Zugang auf unsere angebotenen Inhalte gewähren.
        </p>

  <h2 className='h2-impressum'> SSL-Verschlüsselung:</h2>
        <p>
        Um die Sicherheit Ihrer Daten bei der Übertragung zu schützen, verwenden wir dem aktuellen Stand der Technik entsprechende Verschlüsselungsverfahren (
            z. B. SSL) über HTTPS.
        </p>

  <h2 className='h2-impressum'> SInformation über Ihr Widerspruchsrecht nach Art. 21 DSGVO:</h2>
    <h3 className='h3-impressum'> Einzelfallbezogenes Widerspruchsrecht:</h3>

      <p>
      Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung Sie betreffender personenbezogener Daten, die aufgrund Art. 6 Abs. 1 lit. f DSGVO (Datenverarbeitung auf der Grundlage einer Interessenabwägung) erfolgt, Widerspruch einzulegen; dies gilt auch für ein auf diese Bestimmung gestütztes Profiling im Sinne von Art. 4 Nr. 4 DSGVO.

      Legen Sie Widerspruch ein, werden wir Ihre personenbezogenen Daten nicht mehr verarbeiten, es sei denn, wir können zwingende schutzwürdige Gründe für die Verarbeitung nachweisen, die Ihre Interessen, Rechte und Freiheiten überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.
      </p>

    <h3 className='h3-impressum'> Änderung unserer Datenschutzbestimmungen:</h3>
      <p>
      Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen in der Datenschutzerklärung umzusetzen, z.B. bei der Einführung neuer Services. Für Ihren erneuten Besuch gilt dann die neue Datenschutzerklärung.
      </p>

    <h3 className='h3-impressum'> Fragen an den Datenschutzbeauftragten:</h3>
      <p>
      Wenn Sie Fragen zum Datenschutz haben, schreiben Sie mir bitte eine E-Mail.
      </p>

      <p>
        <i> 
            Die Datenschutzerklärung wurde mithilfe der activeMind AG erstellt, <a href="https://www.activemind.de/datenschutz/datenschutzbeauftragter/">den Experten für externe Datenschutzbeauftragte </a>
        </i> 
      </p>   
       
    </div>
  );
};

export default Impressum;
