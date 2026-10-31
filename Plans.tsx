import { useEffect, useState } from "react";
import { Check, Clock3 } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { SubscriptionPlan } from "../types";
const fallback: SubscriptionPlan[] = [{id:"one",name:"Mensuel",duration_months:1,price:0,currency:"HTG"},{id:"six",name:"Semestriel",duration_months:6,price:0,currency:"HTG"},{id:"twelve",name:"Annuel",duration_months:12,price:0,currency:"HTG"}];
export default function Plans() {
 const [plans,setPlans]=useState<SubscriptionPlan[]>([]);const [loading,setLoading]=useState(true);
 useEffect(()=>{let ok=true;if(supabase)supabase.from("subscription_plans").select("id,name,duration_months,price,currency").eq("is_active",true).order("duration_months").then(({data})=>{if(ok)setPlans((data as SubscriptionPlan[])||[]);setLoading(false);});else{setPlans(fallback);setLoading(false);}return()=>{ok=false;};},[]);
 return <div className="section"><span className="eyebrow">ABONNEMENTS VENDEURS</span><h1>Choisis ta durée</h1><p className="muted">Les formules disponibles sont mensuelle, semestrielle et annuelle. Les prix affichés viennent de la configuration réelle.</p>{loading?<div className="empty-state">Chargement…</div>:<div className="plan-grid">{plans.map(p=><article className="plan-card" key={p.id}><Clock3/><h2>{p.name}</h2><strong>{p.duration_months} mois</strong><p>{p.price>0?`${p.price.toLocaleString("fr-HT")} ${p.currency}`:"Prix à configurer"}</p><ul><li><Check/>Durée à partir du paiement confirmé</li><li><Check/>Aucune activation par simple capture d’écran</li><li><Check/>Produits masqués à l’expiration, non supprimés</li></ul><span className="muted">Demande de paiement à intégrer au processus de validation.</span></article>)}</div>}</div>;
}