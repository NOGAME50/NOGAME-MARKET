import { Link } from 'react-router-dom';
import ContactLink from '../components/ContactLink';
import { LEGAL_UPDATED } from '../lib/legal';

export default function Privacy() {
  return (
    <div className="section narrow">
      <span className="eyebrow">NOGAME MARKET</span>
      <h1>Politique de confidentialité</h1>
      <p>
        <small>Dernière mise à jour : {LEGAL_UPDATED}</small>
      </p>

      <h2>Qui sommes-nous ?</h2>
      <p>
        NOGAME MARKET est une marketplace gratuite qui met en relation des acheteurs, des vendeurs et des
        grossistes en Haïti. Pour toute question sur tes données :{' '}
        <ContactLink subject="Question sur mes données - NOGAME MARKET" />.
      </p>

      <h2>Les données que nous collectons</h2>
      <ul>
        <li>
          <b>Ton compte</b> : nom complet, adresse e-mail, type de compte (acheteur, vendeur, grossiste) et mot de
          passe. Le mot de passe est protégé par notre service d’authentification et nous ne pouvons pas le lire.
          Si tu te connectes avec Google, Google nous transmet ton nom et ton adresse e-mail.
        </li>
        <li>
          <b>Tes boutiques et produits</b> (visibles par tout le monde) : nom, description, numéro de téléphone de
          la boutique, zone, logo, produits, prix et photos.
        </li>
        <li>
          <b>Tes messages</b> avec les vendeurs ou les acheteurs. Seules les deux personnes de la conversation les
          voient.
        </li>
        <li>
          <b>Tes favoris et tes signalements.</b>
        </li>
        <li>
          <b>Ta position</b>, uniquement si tu l’autorises. Elle sert à classer les boutiques près de toi (calcul
          fait sur ton appareil, non enregistré dans ton profil) et, si un vendeur le demande, à renseigner la
          zone de sa boutique. Dans ce cas, les coordonnées sont envoyées à OpenStreetMap pour trouver le nom du
          quartier, et la position de la boutique est enregistrée.
        </li>
        <li>
          <b>Photos</b> : l’appareil photo ou le sélecteur de fichiers de ton téléphone ne sont utilisés que
          lorsque tu ajoutes toi-même une photo.
        </li>
        <li>
          <b>Données techniques</b> : adresse IP et journaux de connexion, conservés par nos hébergeurs pour la
          sécurité et le bon fonctionnement du service.
        </li>
      </ul>

      <h2>Pourquoi nous les utilisons</h2>
      <p>
        Pour créer ton compte et t’envoyer un code de confirmation par e-mail, afficher les boutiques et produits,
        permettre la messagerie, protéger la communauté (signalements et modération) et assurer la sécurité du
        service. Nous ne vendons pas tes données et nous n’affichons pas de publicité ciblée.
      </p>

      <h2>Avec qui elles sont partagées</h2>
      <ul>
        <li>Supabase : authentification, base de données et stockage des images.</li>
        <li>Vercel : hébergement du site.</li>
        <li>Brevo : envoi des e-mails de confirmation.</li>
        <li>Google : connexion avec Google, si tu choisis cette option.</li>
        <li>OpenStreetMap : recherche du nom de quartier à partir d’une position.</li>
      </ul>
      <p>
        Les boutiques, les produits et leurs photos sont publics. Nous pouvons aussi communiquer des données si la
        loi l’exige.
      </p>

      <h2>Combien de temps nous les gardons</h2>
      <p>
        Tant que ton compte existe. Quand tu supprimes ton compte, ton profil, tes boutiques, tes produits, tes
        messages, tes favoris et tes signalements sont supprimés. Des copies de sauvegarde de nos hébergeurs
        peuvent subsister temporairement.
      </p>

      <h2>Tes droits</h2>
      <p>
        Tu peux consulter et modifier ton compte dans « Mon compte », et le supprimer à tout moment : voir{' '}
        <Link to="/suppression-compte">comment supprimer ton compte</Link>. Pour toute autre demande (accès,
        correction, suppression), écris-nous à{' '}
        <ContactLink subject="Demande sur mes données - NOGAME MARKET" />.
      </p>

      <h2>Sécurité</h2>
      <p>
        Les échanges avec NOGAME MARKET sont chiffrés (HTTPS) et l’accès aux données est limité par des règles de
        sécurité. Aucun service n’est parfaitement sûr : choisis un mot de passe solide et ne le partage pas.
      </p>

      <h2>Enfants</h2>
      <p>NOGAME MARKET n’est pas destiné aux enfants de moins de 13 ans.</p>

      <h2>Modifications</h2>
      <p>
        Nous pouvons mettre à jour cette politique. La date en haut de la page indique la dernière version.
      </p>
    </div>
  );
}
