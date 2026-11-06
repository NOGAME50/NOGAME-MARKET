import { Link } from 'react-router-dom';
import ContactLink from '../components/ContactLink';

export default function AccountDeletion() {
  return (
    <div className="section narrow">
      <span className="eyebrow">NOGAME MARKET</span>
      <h1>Supprimer ton compte</h1>

      <h2>Dans l’application ou sur le site</h2>
      <ol>
        <li>Connecte-toi à ton compte.</li>
        <li>
          Ouvre <Link to="/compte">Mon compte</Link>.
        </li>
        <li>Descends jusqu’à « Supprimer mon compte », puis confirme.</li>
      </ol>

      <h2>Ce qui est supprimé</h2>
      <p>
        Ton profil, tes boutiques, tes produits et leurs photos, tes messages, tes favoris, tes signalements et ton
        accès de connexion. La suppression est définitive et immédiate.
      </p>

      <h2>Tu n’arrives plus à te connecter ?</h2>
      <p>
        Écris-nous à <ContactLink subject="Suppression de compte NOGAME MARKET" /> depuis l’adresse e-mail
        de ton compte, avec pour objet « Suppression de compte NOGAME MARKET ».
      </p>

      <p>
        <Link to="/confidentialite">Politique de confidentialité</Link>
      </p>
    </div>
  );
}
