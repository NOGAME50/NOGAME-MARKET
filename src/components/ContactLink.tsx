import { CONTACT_EMAIL } from '../lib/legal';

/**
 * Adresse e-mail de contact cliquable : un appui ouvre l'application e-mail (Gmail)
 * avec un message déjà adressé au propriétaire. Le texte n'est pas sélectionnable
 * dans l'application (voir styles/native-app.css).
 */
export default function ContactLink({
  subject = 'Contact NOGAME MARKET'
}: {
  subject?: string;
}) {
  const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
  return (
    <a href={href} className="contact-link">
      {CONTACT_EMAIL}
    </a>
  );
}
