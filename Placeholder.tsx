import { Link } from "react-router-dom";
import { CircleHelp, Package, Settings, ShieldCheck } from "lucide-react";
const data: Record<string,{title:string;desc:string;icon:React.ReactNode}> = {
 orders:{title:"Mes commandes",desc:"Le module de panier, de commande, de livraison et de suivi doit être relié à ses tables sécurisées avant toute commande réelle.",icon:<Package/>},
 help:{title:"Centre d’assistance",desc:"Cet espace accueillera les demandes d’aide, les réponses et le suivi des tickets.",icon:<CircleHelp/>},
 settings:{title:"Paramètres et confidentialité",desc:"Les préférences de compte, de notifications et de confidentialité seront gérées ici.",icon:<Settings/>},
 admin:{title:"Administration",desc:"L’administration doit être réservée aux comptes autorisés et protégée par les politiques RLS côté base de données.",icon:<ShieldCheck/>}
};
export default function Placeholder({kind}:{kind:"orders"|"help"|"settings"|"admin"}){const d=data[kind];return <div className="section narrow"><div className="placeholder-icon">{d.icon}</div><span className="eyebrow">NOGAME MARKET</span><h1>{d.title}</h1><p className="muted">{d.desc}</p><div className="notice">Cette partie n’est pas encore activée dans les fichiers source fournis. Aucun faux historique ni donnée fictive n’est affiché.</div><Link to="/" className="btn btn-primary">Retour à l’accueil</Link></div>}