import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Protected from "./components/Protected";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import Merchant from "./pages/Merchant";
import ShopCreate from "./pages/ShopCreate";
import Plans from "./pages/Plans";
import ProductDetail from "./pages/ProductDetail";
import Placeholder from "./pages/Placeholder";

export default function App(){return <Routes><Route element={<Layout/>}>
<Route index element={<Home/>}/>
<Route path="connexion" element={<Auth mode="login"/>}/>
<Route path="inscription" element={<Auth mode="register"/>}/>
<Route path="produit/:id" element={<ProductDetail/>}/>
<Route path="boutiques" element={<div className="section narrow"><span className="eyebrow">DÉCOUVRIR</span><h1>Boutiques</h1><p className="muted">Les boutiques visibles seront listées ici dès que la requête publique et les règles d’abonnement seront en place.</p><div className="empty-state"><StoreIcon/><b>Aucune boutique affichée</b><span>Les boutiques non validées ou sans abonnement actif restent masquées.</span></div></div>}/>
<Route path="vendeur" element={<Protected><Merchant/></Protected>}/>
<Route path="vendeur/nouvelle-boutique" element={<Protected><ShopCreate/></Protected>}/>
<Route path="vendeur/abonnements" element={<Protected><Plans/></Protected>}/>
<Route path="compte" element={<Protected><Account/></Protected>}/>
<Route path="commandes" element={<Protected><Placeholder kind="orders"/></Protected>}/>
<Route path="assistance" element={<Placeholder kind="help"/>}/>
<Route path="parametres" element={<Protected><Placeholder kind="settings"/></Protected>}/>
<Route path="administration" element={<Protected roles={["admin"]}><Placeholder kind="admin"/></Protected>}/>
<Route path="*" element={<Navigate to="/" replace/>}/>
</Route></Routes>}
function StoreIcon(){return <span className="empty-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h18l-1.5-6h-15L3 10Zm2 0v10h14V10M9 20v-6h6v6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>}