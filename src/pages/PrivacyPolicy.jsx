import "./PrivacyPolicy.css";

const PrivacyPolicy = () => {
  return (
    <div className="privacy-container">
      <div className="privacy-content">
        <h1>Privacy Policy / Informativa sulla Privacy</h1>

        <section className="policy-section">
          <h2>English</h2>

          <h3>Last Updated: {new Date().toLocaleDateString()}</h3>

          <p>This privacy policy describes how we handle your data when you use our web application.</p>

          <h4>Data Collection and Usage</h4>
          <ul>
            <li>
              We collect only essential technical data required for the website to function, provided through our
              hosting service.
            </li>
            <li>
              We store minimal preference data (such as theme settings) locally on your device using browser local
              storage.
            </li>
            <li>We do not use cookies for tracking or marketing purposes.</li>
            <li>We do not collect or store any personal information.</li>
            <li>We do not share any data with third parties.</li>
          </ul>

          <h4>Your Rights</h4>
          <p>Under GDPR, you have the right to:</p>
          <ul>
            <li>Access any data we hold about you</li>
            <li>Request deletion of your data</li>
            <li>Object to our data processing</li>
          </ul>

          <p>For any privacy-related questions, please contact: [RELIABLE_CONTACT]</p>
        </section>

        <section className="policy-section">
          <h2>Italiano</h2>

          <h3>Ultimo aggiornamento: {new Date().toLocaleDateString()}</h3>

          <p>
            Questa informativa sulla privacy descrive come gestiamo i tuoi dati quando utilizzi la nostra applicazione
            web.
          </p>

          <h4>Raccolta e Utilizzo dei Dati</h4>
          <ul>
            <li>
              Raccogliamo solo i dati tecnici essenziali necessari per il funzionamento del sito web, forniti attraverso
              il nostro servizio di hosting (Vercel).
            </li>
            <li>
              Memorizziamo dati minimi sulle preferenze (come le impostazioni del tema) localmente sul tuo dispositivo
              utilizzando il local storage del browser.
            </li>
            <li>Non utilizziamo cookie per il tracciamento o per scopi di marketing.</li>
            <li>Non raccogliamo né memorizziamo informazioni personali.</li>
            <li>Non condividiamo alcun dato con terze parti.</li>
          </ul>

          <h4>I Tuoi Diritti</h4>
          <p>Ai sensi del GDPR, hai il diritto di:</p>
          <ul>
            <li>Accedere a qualsiasi dato che conserviamo su di te</li>
            <li>Richiedere la cancellazione dei tuoi dati</li>
            <li>Opporti al nostro trattamento dei dati</li>
          </ul>

          <p>Per qualsiasi domanda sulla privacy, contattare: [Le Tue Informazioni di Contatto]</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
