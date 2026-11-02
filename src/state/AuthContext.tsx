import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types';
import { supabase } from '../lib/supabase';
type AuthValue={session:Session|null;user:User|null;profile:Profile|null;loading:boolean;refreshProfile:()=>Promise<void>};
const AuthContext=createContext<AuthValue>({session:null,user:null,profile:null,loading:true,refreshProfile:async()=>{}});
export function AuthProvider({children}:{children:React.ReactNode}){
 const [session,setSession]=useState<Session|null>(null); const [profile,setProfile]=useState<Profile|null>(null); const [loading,setLoading]=useState(true);
 const refreshProfile=async()=>{if(!supabase){setProfile(null);return;} const {data:{session:current}}=await supabase.auth.getSession(); if(!current){setProfile(null);return;} const {data,error}=await supabase.from('profiles').select('id,full_name,role,phone,account_status,trust_level').eq('id',current.user.id).maybeSingle(); if(!error)setProfile((data as Profile|null)??null);};
 useEffect(()=>{if(!supabase){setLoading(false);return;} let alive=true; supabase.auth.getSession().then(async({data})=>{if(!alive)return;setSession(data.session);if(data.session)await refreshProfile();if(alive)setLoading(false);}); const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);if(!next)setProfile(null);else window.setTimeout(()=>{void refreshProfile();},0);}); return()=>{alive=false;subscription.unsubscribe();};},[]);
 return <AuthContext.Provider value={{session,user:session?.user??null,profile,loading,refreshProfile}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
