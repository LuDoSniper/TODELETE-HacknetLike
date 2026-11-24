// Story dialogue and adversarial game simulation. No real network or process operations.
const names={iris:'Iris',mara:'Mara',system:'Mesh'};
const normalize=s=>s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
const has=(s,re)=>re.test(s);
const brief=[
 "Salut. Iris, à la permanence. Tu es sur le poste de travail indépendant. Un dossier a été effacé. Avant de te lâcher dans le réseau, essaie simplement scan. Dis-moi si tu as besoin d'un coup de main.",
 "J'ai reçu le document. Il y a quelque chose d'étrange dans ce mandat de transport. Je te laisse regarder les contrôleurs de routage.",
 "Ici Mara. Ce qu'ils ont conservé de mon dossier n'est pas la version originale. On m'a parlé d'un export fragmenté. Il faut le reconstituer sans confondre les lots.",
 "L'export est cohérent. On peut maintenant vérifier la mémoire du système. Le service de surveillance ne nous facilitera pas la tâche.",
 "Tu as trouvé ma session. Merci. Mais quelqu'un vient de réagir à nos recherches. Iris va te guider pour protéger ton accès avant que nous poursuivions.",
 "La chronologie est exploitable. Il reste à prouver qui a autorisé cet ordre. Les droits d'accès ont manifestement changé.",
 "J'ai lu le dossier. Je veux que l'ordre soit rendu public, sans mes informations personnelles. Je ne veux pas qu'on décide à ma place."
];
const hints=[
 ["Commence par observer les machines et les services qui répondent. Les références du registre et du journal doivent correspondre.","Les journaux de dispatch contiennent les événements originaux. Compare leur état avec le registre."],
 ["La passerelle ne demande pas un mot de passe arbitraire. Elle attend une autorisation de transport.","Le reçu original contient les deux informations que le protocole de la passerelle réclame."],
 ["Les fragments n'ont pas tous le même format. Il faut vérifier le lot et les index avant d'assembler.","Un service peut refuser une lecture directe tout en laissant une autre opération répondre. Consulte les manuels des machines."],
 ["Le snapshot dépend de la mémoire et de la surveillance. Tu peux choisir une approche calme ou une approche plus agressive.","Consulte les journaux de sentinel et man jobs ; les relais fournissent de la RAM et certaines tâches peuvent influencer la surveillance."],
 ["Cherche les événements d'une seule transaction. Les horloges des sources ne sont pas synchronisées.","Le registre des sessions lie une session à une transaction. Les offsets des horloges permettent de normaliser ses événements."],
 ["Regarde ce qui vérifie les droits et ce qui ne le fait pas. Une révision publique peut servir de point de départ.","Les autorisations sont gérées par un autre service que les documents. Cherche quel mandat rétablit l'accès."],
 ["Il ne s'agit plus d'une énigme. Mara souhaite une publication anonymisée, mais tu peux aussi conserver le dossier sous scellés."]
];
export function initNarrative(s){
 if(!s.story){s.story={messages:[],seq:0,coaching:s.phase===0,seen:[],hint:{},briefed:s.phase};push(s,'iris',brief[s.phase===7?6:s.phase]);if(s.phase>=2)push(s,'mara',s.phase===7?'Merci pour ce que tu as fait.':'Je suis sur le canal. Tu peux me parler si tu as des questions.');}
 if(!s.battle)s.battle={state:s.phase>=5?'complete':s.phase===4?'pending':'locked',attempt:0,wave:0,integrity:100,threats:[],deadline:0,mode:'turn',last:''};
 return s;
}
function push(s,contact,body,author=contact){
 const story=s.story;story.messages.push({id:++story.seq,contact,author,body,tick:s.tick||0});if(story.messages.length>120)story.messages.splice(0,story.messages.length-120);
}
export function onAdvance(s,old){
 initNarrative(s);if(s.phase<=old||s.phase>6)return;
 const contact=[2,4,6].includes(s.phase)?'mara':'iris';
 push(s,contact,brief[s.phase]);s.story.briefed=s.phase;
 if(s.phase===4&&s.battle.state==='locked'){s.battle.state='pending';push(s,'iris','Alerte : une activité hostile vise notre client. Je peux ouvrir un canal de défense quand tu es prêt. Tape defense status, puis man defense. Les preuves déjà récupérées restent en sécurité.');}
}
export function coach(s,line,code){
 initNarrative(s);if(!s.story.coaching||s.phase!==0||code!==0)return;
 const command=line.trim().split(/\s+/)[0];
 const cues={
 scan:"Bien. Les hôtes découverts apparaissent sur ta carte. Tu peux déplacer les nœuds comme tu veux. Essaie probe sur l'un des hôtes connus pour voir ses ports.",
 probe:"Tu vois les services et leurs ports. svc <hôte> <port> help te montre le protocole que ce service comprend. Tu peux interroger un service sans ouvrir de shell.",
 svc:"Les réponses des services se comportent comme du texte dans le shell : grep, pipes et redirections fonctionnent. Essaie aussi connect sur un hôte accessible si tu veux lire ses fichiers.",
 connect:"Tu es sur une autre machine. ls, cd, cat et vim fonctionnent ici. Tes accès sont mémorisés ; connect te permet de revenir sans retaper de jeton.",
 fetch:"Le fichier est maintenant dans /vault, notre volume commun. Pas besoin de revenir au poste initial : submit accepte les preuves depuis n'importe où."
 };
 if(cues[command]&&!s.story.seen.includes(command)){s.story.seen.push(command);push(s,'iris',cues[command]);}
}
export function dialogue(s,contact,body){
 initNarrative(s);contact=normalize(String(contact));body=String(body).trim().slice(0,500);if(!['iris','mara'].includes(contact)||contact==='mara'&&s.phase<2)throw Error('Contact indisponible');if(!body)throw Error('Message vide');push(s,contact,body,'operator');
 const q=normalize(body),p=Math.min(s.phase,6),key=contact+':'+p;
 let reply;
 if(has(q,/\b(merci|super|parfait|genial|bravo)\b/)&&!has(q,/\?/))reply=contact==='iris'?'De rien. Je reste sur le canal.':'Merci à toi de m’écouter.';
 else if(has(q,/\b(bonjour|salut|coucou|hello|hey)\b/)&&q.length<45)reply=contact==='iris'?'Salut. Je suis là. Qu’est-ce que tu veux vérifier ?':'Salut. Je peux enfin te répondre directement.';
 else if(has(q,/\b(public|prive|publier|consentement|volonte|anonym)\w*/)&&p>=5)reply=contact==='mara'?'Je veux que les faits soient connus. Je ne veux pas que mes données personnelles circulent. Une publication anonymisée me convient.':'Mara a exprimé son consentement à une publication anonymisée. Le dépôt sous scellés reste possible.';
 else if(has(q,/\b(attaque|combat|defense|alerte|intrus|pirate|quarantaine)\w*/)&&s.battle.state!=='locked')reply=s.battle.state==='complete'?'L’accès a été sécurisé. On peut reprendre l’enquête.':'Observe les événements de défense avant d’agir. defense status et defense inspect donnent des informations différentes ; man defense explique les outils. Une erreur ne détruit pas ton dossier.';
 else if(has(q,/\b(port|service|probe|scan|connexion|connect|ssh|reseau|route)\w*/)&&p===0)reply='Commence par scan, puis probe <hôte>. svc <hôte> <port> help décrit les actions. connect ouvre le shell si l’accès est autorisé. Les routes déjà découvertes sont réutilisées.';
 else if(has(q,/\b(vault|fetch|transfert|fichier|submit|rapatri)\w*/)&&p<=1)reply='Utilise /vault pour conserver les fichiers entre les sessions. fetch copie un fichier vers ce volume. submit <fichier> transmet la preuve sans avoir à revenir sur desk.';
 else if(has(q,/\b(ram|memoire|proxy|relais|jobs|snapshot)\w*/)&&p===3)reply='Regarde ram et proxy list. Les tâches réservent de la mémoire jusqu’à leur collecte ou arrêt. Il te faut aussi tenir compte du contrôle exercé par sentinel.';
 else if(has(q,/\b(histoire|pourquoi|qui es|qui etes|mara|victime|dossier)\w*/)&&contact==='mara')reply='Mon dossier a été modifié sans mon accord. Je veux comprendre qui a donné l’ordre, et garder la maîtrise de mon témoignage. Je peux te parler de ce que nous savons, pas inventer ce qui manque.';
 else if(has(q,/\b(aide|indice|bloque|perdu|comment|quoi|objectif|suite|faire|comprend|coince|piste)\w*/)||q.includes('?')){const i=s.story.hint[key]||0;reply=hints[p][Math.min(i,hints[p].length-1)];s.story.hint[key]=i+1;}
 else reply=contact==='iris'?'Je ne suis pas certaine de comprendre. Dis-moi plutôt ce que tu observes, la commande qui bloque ou si tu veux un indice.':'Je ne connais pas la réponse à ça. Tu peux me demander ce que je sais du dossier ou demander une piste à Iris.';
 push(s,contact,reply);return names[contact]+' : '+reply;
}
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
 b.threats=[a,c,d].map((id,k)=>({id,label:labels[k],signature:k===bad?'INVALID':'VALID',origin:k===bad?'unknown':k===0?'desk':'trusted relay'}));
 b.deadline=b.mode==='live'?Date.now()+90000:0;b.last=waveData[i].note;
}
function loss(s,note){const b=s.battle;b.state='failed';b.deadline=0;b.last=note;push(s,'iris','Le canal a été interrompu, mais tes preuves sont intactes. Réessaie quand tu veux avec defense engage.');return note+'\nCanal isolé. defense engage pour reprendre.';}
function battleView(s){const b=s.battle;return {state:b.state,integrity:b.integrity,wave:b.state==='active'?b.wave+1:0,mode:b.mode,deadline:b.deadline,last:b.last};}
export function defense(s,args){
 initNarrative(s);const b=s.battle,op=args[0]||'status';
 if(b.state==='active'&&b.deadline&&Date.now()>b.deadline)loss(s,'Fenêtre de réaction expirée.');
 if(op==='status')return b.state==='locked'?'Aucun incident actif.':b.state==='pending'?'Alerte en attente. defense engage [live] pour ouvrir le canal de défense.':b.state==='complete'?'Canal sécurisé.':b.state==='failed'?'Canal isolé. defense engage pour recommencer.':'Canal sous pression / intégrité '+b.integrity+'%\n'+b.last+'\nUtilise defense inspect.';
 if(op==='engage'){
  if(!['pending','failed'].includes(b.state))throw Error('Aucun incident à engager.');
  if(args[1]&&args[1]!=='live')throw Error('usage: defense engage [live]');
  b.state='active';b.attempt++;b.wave=0;b.integrity=100;b.mode=args[1]==='live'?'live':'turn';generate(b);push(s,'iris','Je suis sur le canal de secours. Identifie les anomalies avant de les isoler.');return 'CANAL DE DEFENSE OUVERT\n'+b.last;
 }
 if(op==='abort'&&b.state==='active')return loss(s,'Canal interrompu volontairement.');
 if(b.state!=='active')throw Error('Aucun incident actif. defense status');
 if(op==='inspect')return 'TYPE '+waveData[b.wave].kind.toUpperCase()+'\nID     RESOURCE                ORIGIN          SIGNATURE\n'+b.threats.map(t=>t.id.padEnd(7)+t.label.padEnd(24)+t.origin.padEnd(16)+t.signature).join('\n');
 if(op==='wait'){b.integrity=Math.max(0,b.integrity-20);if(!b.integrity)return loss(s,'Intégrité épuisée.');return 'L’adversaire maintient la pression. Intégrité '+b.integrity+'%.';}
 const wanted=['isolate','quarantine','revoke'][b.wave];
 if(!['isolate','quarantine','revoke'].includes(op))throw Error('Commande inconnue. man defense');
 const t=b.threats.find(t=>t.id===args[1]);
 if(op!==wanted||!t||t.signature!=='INVALID'){b.integrity=Math.max(0,b.integrity-30);b.last='Contre-mesure incorrecte : le canal a subi une perte d’intégrité.';if(!b.integrity)return loss(s,'Intégrité épuisée.');return b.last+'\nIntégrité '+b.integrity+'%.';}
 b.wave++;
 if(b.wave>=waveData.length){b.state='complete';b.deadline=0;b.last='Canal sécurisé.';push(s,'iris','C’est bon, le trafic hostile a cessé. Reprenons là où nous en étions.');return 'DEFENSE REUSSIE — canal sécurisé.';}
 generate(b);return 'Menace neutralisée. Nouveau trafic détecté.\n'+b.last;
}
