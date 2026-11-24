// Story dialogue and adversarial game simulation. No real network or process operations.
const names={iris:'Iris',mara:'Mara',system:'Mesh'};
const normalize=s=>s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
import {characterContext,characterFallback,rejectInput,relationship,applyRelationship,noteProgress,referenceDocument} from './characters.mjs';
const brief=[
 "Salut, c'est Iris. On m'a signalé qu'un dossier a été modifié cette nuit. J'aimerais retrouver le reçu original, mais je n'ai pas accès au registre depuis mon poste. Tu peux regarder de ton côté ?",
 "J'ai reçu le document. Il y a quelque chose d'étrange dans ce mandat de transport. Je te laisse regarder les contrôleurs de routage.",
 "Ici Mara. Ce qu'ils ont conservé de mon dossier n'est pas la version originale. On m'a parlé d'un export fragmenté. Il faut le reconstituer sans confondre les lots.",
 "L'export est cohérent. On peut maintenant vérifier la mémoire du système. Le service de surveillance ne nous facilitera pas la tâche.",
 "Tu as retrouvé ma session. Merci. Iris vient de me dire que notre liaison est menacée. Fais attention à toi.",
 "La chronologie est exploitable. Il reste à prouver qui a autorisé cet ordre. Les droits d'accès ont manifestement changé.",
 "J'ai lu le dossier. Je veux que l'ordre soit rendu public, sans mes informations personnelles. Je ne veux pas qu'on décide à ma place."
];
export function initNarrative(s){
 if(!s.story){s.story={messages:[],seq:0,coaching:s.phase===0,seen:[],hint:{},briefed:s.phase};push(s,'iris',brief[s.phase===7?6:s.phase]);if(s.phase>=2)push(s,'mara',s.phase===7?'Merci pour ce que tu as fait.':'Je suis sur le canal. Tu peux me parler si tu as des questions.');}
 relationship(s,'iris');if(s.phase>=2)relationship(s,'mara');
 if(!s.battle)s.battle={state:s.phase>=5?'complete':s.phase===4?'pending':'locked',attempt:0,wave:0,integrity:100,threats:[],deadline:0,mode:'turn',last:''};
 return s;
}
function push(s,contact,body,author=contact){
 const story=s.story;story.messages.push({id:++story.seq,contact,author,body,tick:s.tick||0});if(story.messages.length>120)story.messages.splice(0,story.messages.length-120);
}
export function onAdvance(s,old){
 initNarrative(s);if(s.phase<=old||s.phase>6)return;
 noteProgress(s);
 const contact=[2,4,6].includes(s.phase)?'mara':'iris';
 push(s,contact,brief[s.phase]);s.story.briefed=s.phase;
 if(s.phase===4&&s.battle.state==='locked'){s.battle.state='pending';push(s,'iris','Alerte : une activité hostile vise notre client. Je peux ouvrir un canal de défense quand tu es prêt. Tape defense status, puis man defense. Les preuves déjà récupérées restent en sécurité.');}
}
export function coach(s,line,code){
 initNarrative(s);s.story.events??=[];const once=(id,contact,body)=>{if(!s.story.events.includes(id)){s.story.events.push(id);push(s,contact,body);}};
 if(code===0){if(s.grants.spool)once('spool','iris','Le bail est actif. Garde une copie du reçu : nous pourrons toujours y revenir.');if(s.routes.includes('INNER'))once('inner','iris','Je vois la route interne. Tu n’auras plus besoin de repasser par la passerelle à chaque connexion.');if(s.proxies.length>=2)once('relays','iris','Tes relais répondent. Pense à surveiller la mémoire réellement disponible, pas seulement la capacité totale.');if(s.flags.snapshot&&s.phase>=3)once('snapshot','mara','Le snapshot est arrivé. Il y aura probablement des sessions anciennes mêlées à la mienne.');if(s.routes.includes('AUDIT'))once('audit','iris','La route d’audit répond. Garde le canal ouvert ; nous approchons des données sensibles.');}
 // An occasional check-in driven by actual game activity, not an extra model call or wall-clock timer.
 const rel=relationship(s,'iris');const latest=s.story.messages.filter(m=>m.contact==='iris').at(-1);
 if(s.phase<6&&rel.trust>=55&&rel.irritation<35&&s.tick-(latest?.tick||0)>=22&&s.tick-rel.lastInitiative>=40){rel.lastInitiative=s.tick;push(s,'iris','Je travaille sur le dossier de mon côté. Si tu as besoin de prendre du recul, raconte-moi où tu en es.');}
 if(!s.story.coaching||s.phase!==0||code!==0)return;
 const command=line.trim().split(/\s+/)[0];
 const cues={
 scan:"Bien. Les hôtes découverts apparaissent sur ta carte. Tu peux déplacer les nœuds comme tu veux. Essaie probe sur l'un des hôtes connus pour voir ses ports.",
 probe:"Tu vois les services et leurs ports. svc <hôte> <port> help te montre le protocole que ce service comprend. Tu peux interroger un service sans ouvrir de shell.",
 svc:"Les réponses des services se comportent comme du texte dans le shell : grep, pipes et redirections fonctionnent. Essaie aussi connect sur un hôte accessible si tu veux lire ses fichiers.",
 connect:"Tu es sur une autre machine. ls, cd, cat et vim fonctionnent ici. Tes accès sont mémorisés ; connect te permet de revenir sans retaper de jeton.",
 fetch:"Le fichier est maintenant dans /vault, notre volume commun. Pas besoin de revenir au poste initial : submit accepte les preuves depuis n'importe où."
 };
 if(cues[command]&&!s.story.seen.includes(command)){s.story.seen.push(command);push(s,'iris',cues[command],'system');}
}
export function beginRoleplay(s,contact,body){
 initNarrative(s);contact=normalize(String(contact));body=String(body).trim();
 if(!['iris','mara'].includes(contact)||contact==='mara'&&s.phase<2)throw Error('Contact indisponible');
 if(!body||body.length>500)throw Error('Message invalide');
 const context=characterContext(s,contact,body);push(s,contact,body,'operator');return context;
}
export function finishRoleplay(s,context,result){
 initNarrative(s);
 if(s.phase!==context.phase)return '';
 if(result.source==='offline')return '';
 applyRelationship(s,context.contact,result.effect||'neutral');
 if(!result.reply)return '';
 let reply=result.reply;
 if(context.contact==='iris'&&result.attachment==='reference'){
  // An allowlisted, immutable document; no model-generated file or path.
  s.vault[referenceDocument.path]=referenceDocument.body;
  reply+='\n[Note transmise : '+referenceDocument.path+']';
 }
 push(s,context.contact,reply);return names[context.contact]+' : '+reply;
}
export function dialogue(s,contact,body){const c=beginRoleplay(s,contact,body);return finishRoleplay(s,c,{reply:null,source:'offline'});}
export function storyView(s){initNarrative(s);return {messages:s.story.messages,contacts:s.phase>=2?['iris','mara']:['iris'],coaching:s.story.coaching,battle:battleView(s)};}
export function readDialogue(s,contact){initNarrative(s);return s.story.messages.filter(m=>!contact||m.contact===contact).slice(-15).map(m=>(m.author==='operator'?'Vous':names[m.author]||m.author)+' : '+m.body).join('\n\n')||'Aucun message.';}
const waveData=[
 {kind:'worker',note:'Un worker inconnu consomme de la mémoire sur le client. Identifie son origine dans la table de processus.',decoy:'maintenance'},
 {kind:'route',note:'Un relais injecte une route concurrente. Compare les signatures et ne coupe pas le chemin légitime.',decoy:'primary'},
 {kind:'session',note:'Une seconde session revendique ton identité. Isole la session non signée sans fermer le canal de secours.',decoy:'rescue'}
];
function generate(b){
 const i=b.wave,n=b.attempt*13+i*7;
 const a=String(210+n),c=String(270+n),d=String(330+n);
 const labels=i===0?['worker sync','worker mirror','worker cache']:i===1?['route relay','route switch','route backup']:['session desk','session relay','session rescue'];
 const bad=(b.attempt+i)%3;
 b.threats=[a,c,d].map((id,k)=>{const baseline=((Number(id)*7919+17)%65536).toString(16).padStart(4,'0').toUpperCase();const observed=k===bad?((Number(id)*7919+31)%65536).toString(16).padStart(4,'0').toUpperCase():baseline;return {id,label:labels[k],signature:k===bad?'INVALID':'VALID',baseline,observed,origin:k===0?'desk':'relay'};});
 b.deadline=b.mode==='live'?Date.now()+90000:0;b.last=waveData[i].note;
}
function loss(s,note){const b=s.battle;b.state='failed';b.deadline=0;b.last=note;push(s,'iris','Le canal a été interrompu, mais tes preuves sont intactes. Réessaie quand tu veux avec defense engage.');return note+'\nCanal isolé. defense engage pour reprendre.';}
function battleView(s){const b=s.battle;return {state:b.state,integrity:b.integrity,wave:b.state==='active'?b.wave+1:0,mode:b.mode,deadline:b.deadline,last:b.last};}
export function defense(s,args){
 initNarrative(s);const b=s.battle,op=args[0]||'status';
 if(b.state==='active'&&b.deadline&&Date.now()>b.deadline)loss(s,'Fenêtre de réaction expirée.');
 if(op==='status')return b.state==='locked'?'Aucun incident actif.':b.state==='pending'?'Alerte en attente. defense engage [live] pour ouvrir le canal de défense.':b.state==='complete'?'Canal sécurisé.':b.state==='failed'?'Canal isolé. defense engage pour recommencer.':'Canal sous pression / intégrité '+b.integrity+'%\n'+b.last+'\nUtilise defense inspect et defense verify.';
 if(op==='engage'){
  if(!['pending','failed'].includes(b.state))throw Error('Aucun incident à engager.');
  if(args[1]&&args[1]!=='live')throw Error('usage: defense engage [live]');
  b.state='active';b.attempt++;b.wave=0;b.integrity=100;b.mode=args[1]==='live'?'live':'turn';generate(b);push(s,'iris','Je suis sur le canal de secours. Compare les signatures observées à la référence de confiance avant d’isoler une ressource.');return 'CANAL DE DEFENSE OUVERT\n'+b.last;
 }
 if(op==='abort'&&b.state==='active')return loss(s,'Canal interrompu volontairement.');
 if(b.state!=='active')throw Error('Aucun incident actif. defense status');
 if(op==='inspect')return 'TYPE '+waveData[b.wave].kind.toUpperCase()+'\nID     RESOURCE                ORIGIN          SIGNATURE\n'+b.threats.map(t=>t.id.padEnd(7)+t.label.padEnd(24)+t.origin.padEnd(16)+(t.observed||t.signature)).join('\n');
 if(op==='verify')return 'Référence des signatures autorisées\nID     RESOURCE                EXPECTED\n'+b.threats.map(t=>t.id.padEnd(7)+t.label.padEnd(24)+(t.baseline||'VALID')).join('\n');
 if(op==='wait'){b.integrity=Math.max(0,b.integrity-20);if(!b.integrity)return loss(s,'Intégrité épuisée.');return 'L’adversaire maintient la pression. Intégrité '+b.integrity+'%.';}
 const wanted=['isolate','quarantine','revoke'][b.wave];
 if(!['isolate','quarantine','revoke'].includes(op))throw Error('Commande inconnue. man defense');
 const t=b.threats.find(t=>t.id===args[1]);
 if(op!==wanted||!t||t.signature!=='INVALID'){b.integrity=Math.max(0,b.integrity-30);b.last='Contre-mesure incorrecte : le canal a subi une perte d’intégrité.';if(!b.integrity)return loss(s,'Intégrité épuisée.');return b.last+'\nIntégrité '+b.integrity+'%.';}
 b.wave++;
 if(b.wave>=waveData.length){b.state='complete';b.deadline=0;b.last='Canal sécurisé.';push(s,'iris','C’est bon, le trafic hostile a cessé. Reprenons là où nous en étions.');return 'DEFENSE REUSSIE — canal sécurisé.';}
 generate(b);return 'Menace neutralisée. Nouveau trafic détecté.\n'+b.last;
}
