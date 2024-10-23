import React from 'react';
import './Impressum.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const Impressum = ({ onBack }) => {
  return (
    <div className="impressum-container">
        <div className="back-button" onClick={onBack}>
        <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </div>
          <h1 className='h1-impressum'> Impressum</h1>
            <h2 className='h2-impressum'> Angaben gemäß § 5 TMG</h2>
              <p>
                Julian Schäpermeier <br />
                Von-den-Berken Straße 3c <br />
                44141 Dortmund
              </p>
              
            <h2 className='h2-impressum'> Kontakt</h2>
              <p>
                Telefon: 0176/43836260 <br />
                E-Mail: info@julianschaepermeier.com
              </p>
            <h2 className='h2-impressum'> Hinweise zur Website</h2>
            <h2 className='h2-impressum'> Information gemäß § 36 VSBG</h2>
              <p>
              Gemäß § 36 VSBG (Verbraucherstreitbeilegungsgesetz – Gesetz über die alternative Streitbeilegung in Verbrauchersachen) erklärt der Betreiber dieser Website:<br /><br />

                Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.<br /><br />

                <i> Das Impressum wurde mit dem <a href="https://www.activemind.de/generatoren/impressum/">Impressums-Generator der activeMind AG</a> erstellt. </i> 
              </p>
  
    </div>
  );
};

export default Impressum;
