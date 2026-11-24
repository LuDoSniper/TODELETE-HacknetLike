import {world,seals} from './world';
export type State={at:string;known:string[];opened:string[];fragments:string[];heat:number;credits:number;turn:number;ending:string;log:string[]};
export const fresh=():State=>({at:'home',known:['home'],opened:['home'],fragments:[],heat:0,credits:0,turn:0,ending:'',log:[]});
const get=(id:string)=>world.find(n=>n.id===id)!;
export const view=(s:State)=>({...s,nodes:world.filter(n=>s.known.includes(n.id)).map(n=>({id:n.id,name:n.name,zone:n.zone,links:n.links.filter(x=>s.known.includes(x)),open:s.opened.includes(n.id)}))});
export function execute(s:State,line:string):string[]{
const [cmd,...args]=line.trim().toLowerCase().split(/\s+/);const arg=args.join(' ');const n=get(s.at);let out:string[]=[];
if(!cmd)return [];
switch(cmd){
case 'help': return ['scan · connect <id> · inspect · unlock <réponse>','ls · cat <fichier> · collect · status · cool · home','clear (terminal) · restore / release (si autorisé)'];
case 'status':return [s.fragments.length+'/3 fragments | signal '+s.heat+'% | crédits '+s.credits,s.ending||'Mission active'];
case 'scan': for(const id of n.links)if(!s.known.includes(id))s.known.push(id);out=n.links.map(id=>id+'  '+get(id).name);break;
case 'connect':if(!n.links.includes(arg)||!s.known.includes(arg))return ['Route inconnue. Utilisez scan.'];s.at=arg;if(!get(arg).lock&&!s.opened.includes(arg))s.opened.push(arg);out=['Connexion : '+get(arg).name];break;
case 'home':s.at='home';out=['Retour au refuge.'];break;
case 'inspect':return [s.opened.includes(n.id)?'Sceau ouvert.':seals[n.lock].hint];
case 'unlock':if(s.opened.includes(n.id))return ['Déjà ouvert.'];if(n.lock==='final'&&s.fragments.length!==3)return ['Trois fragments requis.'];if(arg===seals[n.lock].answer){s.opened.push(n.id);s.credits+=100;out=['Sceau validé. +100 crédits'];}else{s.heat+=22;out=['Réponse incorrecte. Signal accru.'];}break;
case 'ls':return s.opened.includes(n.id)?Object.keys(n.files):['Sceau verrouillé.'];
case 'cat':return !s.opened.includes(n.id)?['Sceau verrouillé.']:[Object.hasOwn(n.files,arg)?n.files[arg]:'Fichier introuvable.'];
case 'collect':if(!s.opened.includes(n.id)||!n.fragment)return ['Aucun fragment accessible.'];if(s.fragments.includes(n.fragment))return ['Fragment déjà acquis.'];s.fragments.push(n.fragment);s.credits+=250;out=['Fragment sauvegardé : '+n.fragment];break;
case 'cool':s.heat=Math.max(0,s.heat-30);out=['Signal stabilisé.'];break;
case 'restore':case 'release':if(s.at!=='core'||!s.opened.includes('core'))return ['Action indisponible.'];if(s.ending)return ['Décision déjà enregistrée.'];s.ending=cmd==='restore'?'Les habitants retrouvent leurs noms. Les preuves restent sous scellés.':'La ville découvre la vérité. Les noms redeviennent publics.';out=[s.ending,'FIN — Merci d’avoir joué.'];break;
default:return ['Commande inconnue. help pour la liste.'];
}
s.turn++;if(cmd!=='cool'&&cmd!=='home')s.heat+=4;if(s.heat>=100){s.at='home';s.heat=0;out.push('SIGNAL PERDU — retour au refuge. Progression conservée.');}s.log=[...s.log,line+' → '+out.join(' / ')].slice(-30);return out;
}
