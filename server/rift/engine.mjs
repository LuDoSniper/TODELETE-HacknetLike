import {hosts,missions} from './world.mjs';
const H=Object.fromEntries(hosts.map(h=>[h.id,h]));
const roles={none:0,public:0,user:1,root:2};
const toolset={latch:{ram:5,noise:18,protocol:'FRAME/1',desc:'Reconstitue une trame virtuelle à partir de son ordre de lecture.'},splice:{ram:7,noise:24,protocol:'RING/2',desc:'Aligne les deux anneaux du protocole simulé.'},weave:{ram:8,noise:26,protocol:'GRAPH/3',desc:'Reconstitue un chemin dans le graphe de validation virtuel.'},prism:{ram:9,noise:28,protocol:'KERNEL',desc:'Réordonne les modules du noyau virtuel selon sa signature de confiance.'}};
const pages={
 help:['Index des commandes','help [commande]','Liste les outils disponibles ou affiche leur manuel.'],
 man:['Manuel','man <commande>','Affiche les explications, options et exemples.'],
 tutorial:['Formation','tutorial','Affiche la prochaine étape pratique du laboratoire.'],
 scan:['Découverte réseau','scan [hôte]','Découvre les voisins directs d’un hôte déjà joignable. Sans argument : machine courante. Ne donne aucun accès au système.','scan'],
 probe:['Reconnaissance de ports','probe <hôte>','Liste les services simulés, leurs versions et l’état du shell. Un service en écoute ne signifie pas un shell accessible.','probe lab-target'],
 inspect:['Examiner un service','inspect <hôte> <port>','Analyse le protocole et sa signature. Enregistre le résultat dans le scanner. Compare avec tools et man avant de lancer une attaque.','inspect lab-target 7410'],
 request:['Dialogue applicatif','request <hôte> <port> GET <ressource>','Tous les services utilisent la même convention de ressources. GET / liste les chemins et droits. GET /status consulte l’état si disponible. Les ressources user/root exigent le niveau correspondant. Cette commande ne permet pas d’obtenir un shell.','request lab-target 7410 GET /'],
 tools:['Catalogue des outils','tools','Liste les outils virtuels, les protocoles compatibles, la RAM et le bruit généré.'],
 run:['Lancer une attaque virtuelle','run <latch|splice|weave> <hôte> <port> [--quiet|--burst] ; run prism [--quiet|--burst]','Réserve de la RAM et démarre une épreuve. Les attaques distantes exigent d’avoir inspecté le service. PRISM exige une session utilisateur sur un noyau vulnérable et un sysinfo préalable. --quiet réserve 2 MiB supplémentaires et réduit le bruit initial ; --burst économise 2 MiB mais augmente le bruit. Les tâches actives produisent du bruit à chaque opération. Aucun trafic réel.','run latch lab-target 7410'],
 latch:['LATCH — accès utilisateur','run latch <hôte> <port>','Sur FRAME/1 vulnérable, le défi présente quatre symboles et leur ordre (indices commençant à zéro). Compose les symboles dans cet ordre. Une réussite ouvre le compte utilisateur.','job 1 ; solve 1 ABCD'],
 splice:['SPLICE — accès utilisateur','run splice <hôte> <port>','Sur RING/2 vulnérable, le défi présente un anneau et une cible. Trouve de combien de crans vers la gauche faire tourner l’anneau. Un succès ouvre le compte utilisateur.','job 1 ; solve 1 2'],
 weave:['WEAVE — accès utilisateur','run weave <hôte> <port>','Sur GRAPH/3 vulnérable, trouve le chemin orienté le moins coûteux entre S et T. Les liaisons indiquent leur coût. Entre la suite des sommets sans espaces.','job 1 ; solve 1 SABT'],
 prism:['PRISM — élévation locale','run prism','Sur le noyau d’une session utilisateur, compare les emplacements des modules et l’ordre de confiance. Donne les indices de leurs emplacements dans l’ordre attendu. Un succès accorde root, pas seulement l’accès à un service.','sysinfo ; run prism ; job 2 ; solve 2 2031'],
 jobs:['Processus d’attaque','jobs','Liste les épreuves en cours, la cible et la mémoire réservée.'],
 job:['Détail d’une épreuve','job <id>','Affiche le défi courant. Les indices sont toujours lisibles et les échecs ne suppriment pas les preuves.','job 1'],
 solve:['Soumettre une réponse','solve <id> <réponse>','Vérifie la solution à l’épreuve virtuelle. Un échec augmente le bruit ; l’épreuve reste ouverte sauf verrouillage. Une réussite libère la RAM et accorde les droits.'],
 kill:['Arrêter une tâche','kill <id>','Annule une épreuve et libère sa mémoire. Ne retire pas les accès déjà obtenus.'],
 connect:['Ouvrir un shell','connect <hôte>','Exige un compte public ou une autorisation obtenue. Revient au dernier répertoire mémorisé. Ne contourne pas les droits de lecture.'],
 local:['Revenir au poste','local','Retourne au poste de travail sans perdre les accès.'],
 exit:['Fermer une session','exit','Retourne au poste de travail.'],
 whoami:['Identité','whoami','Affiche le rôle du shell : guest, operator ou root.'],
 hostname:['Hôte','hostname','Affiche le nom de la machine courante.'],
 pwd:['Répertoire','pwd','Affiche le répertoire courant.'],
 ls:['Lister les fichiers','ls [chemin]','Liste fichiers et dossiers avec les droits nécessaires. /vault est le coffre local, accessible depuis les sessions.'],
 cd:['Changer de dossier','cd <chemin>','Chemin absolu ou relatif ; .. remonte d’un niveau.'],
 cat:['Lire un document','cat <fichier...>','Lit les fichiers si les droits le permettent. Sans fichier, lit le flux entrant.'],
 echo:['Afficher du texte','echo [texte...]','Écrit les arguments sur la sortie standard.'],
 grep:['Filtrer les lignes','grep [-i] [-v] <motif> [fichier...]','Recherche une chaîne littérale, -i ignore la casse et -v inverse la sélection. Sans fichier utilise le flux entrant.','cat /vault/notes.txt | grep -i erreur'],
 head:['Premières lignes','head [-n nombre] [fichier]','Affiche les premières lignes (10 par défaut).'],
 tail:['Dernières lignes','tail [-n nombre] [fichier]','Affiche les dernières lignes (10 par défaut).'],
 cp:['Copier un document','cp <source> <destination>','Copie une source lisible vers un fichier de /vault.'],
 shell:['Flux du terminal','commande | commande ; commande > /vault/fichier','Les pipes transmettent le texte. > remplace une copie locale, >> ajoute. Les originaux restent protégés. Les guillemets préservent les espaces.','request exemple 7400 GET /status | grep -i disponible > /vault/note.txt'],
 fetch:['Copier une preuve','fetch <fichier> [nom]','Copie un document lisible vers /vault. Les originaux distants sont immuables.'],
 rm:['Supprimer une copie','rm <fichier>','Seules les copies de /vault sont modifiables. Une copie peut être récupérée à nouveau.'],
 proxy:['Relais de calcul','proxy list | add <hôte> | remove <hôte>','Un relais compatible exige un accès utilisateur. Ajoute sa mémoire au pool et réduit le bruit des nouvelles attaques. Impossible de retirer un relais utilisé tant qu’un job est actif.'],
 ram:['Mémoire','ram','Affiche la RAM réservée et la capacité des relais.'],
 trace:['Surveillance','trace [hôte]','Affiche le bruit par machine et les verrouillages. À 100 %, la machine coupe les attaques en cours.'],
 wait:['Laisser retomber le bruit','wait','Réduit le bruit des machines sans attaque active et libère leur verrouillage sous 50 %. Arrête les tâches concernées avant d’attendre. Le temps est simulé, sans attendre réellement.'],
 sysinfo:['Noyau courant','sysinfo','Décrit les modules et la possibilité d’élévation locale ; nécessaire avant PRISM.'],
 route:['Routage','route [open]','Sans argument : zones accessibles. route open depuis une passerelle root active sa zone distante.'],
 mail:['Messagerie','mail [numéro]','Liste les messages reçus ou lit celui choisi.'],
 mission:['Objectif','mission','Affiche le but courant, sans les solutions.'],
 submit:['Validation','submit <fichier...>','Transmet les copies demandées. Vérification du contenu et des accès ; pas de perte de progression en cas de refus.'],
 publish:['Publication','publish <public|sealed>','Depuis la machine de publication, après validation des preuves, choisit le mode de diffusion.'],
 clear:['Effacer le terminal','clear','Efface l’affichage uniquement.'],
 history:['Historique','history','Relit les commandes récentes.']
};
export function manual(name){const p=pages[name];return p?name.toUpperCase()+'(1) — RIFT/OS\n\nNOM\n  '+p[0]+'\n\nSYNOPSIS\n  '+p[1]+'\n\nDESCRIPTION\n  '+p[2]+(p[3]?'\n\nEXEMPLE\n  '+p[3]:''):'Aucune page pour '+name;}
export const commandNames=Object.keys(pages).sort();
const own=(o,k)=>Object.hasOwn(o,k);
export function fresh(){return {version:1,phase:0,at:'station',cwd:'/home/operator',known:['station'],zones:['LAB'],access:{station:'user'},probed:{},inspected:{},kernelSeen:{},trace:{},locked:{},jobs:[],next:1,proxies:[],vault:{},history:[],cwdByHost:{},flags:{},tick:0,ending:''};}
const role=(s,id)=>s.access[id]|| (H[id]?.publicShell&&s.known.includes(id)&&s.zones.includes(H[id].zone)?'user':'none');
const authorized=(s,id,level)=>roles[role(s,id)]>=roles[level];
const resolve=(s,x)=>{const h=hosts.find(h=>h.id===x||h.ip===x);if(!h||!s.known.includes(h.id))throw Error('Hôte inconnu. Utilise scan.');if(!s.zones.includes(h.zone))throw Error('Réseau filtré. Une route est nécessaire.');return h;};
const port=(h,p)=>{const d=h.ports[p];if(!d)throw Error('Port fermé. Utilise probe.');return d;};
const active=s=>s.jobs.filter(j=>j.state==='active');
const cap=s=>12+s.proxies.reduce((n,id)=>n+(H[id].ram||0),0);
const used=s=>active(s).reduce((n,j)=>n+j.ram,0);
const noise=(s,id,n)=>{s.trace[id]=Math.min(100,(s.trace[id]||0)+Math.max(1,n-4*s.proxies.filter(x=>x!==id).length));if(s.trace[id]>=100){s.locked[id]=true;for(const j of active(s).filter(j=>j.host===id))j.state='blocked';}};
const path=(s,p='.')=>{const a=(p.startsWith('/')?p:s.cwd+'/'+p).split('/'),b=[];for(const x of a){if(x==='..')b.pop();else if(x&&x!=='.')b.push(x);}return '/'+b.join('/');};
const fileList=s=>({...H[s.at].files,...Object.fromEntries(Object.entries(s.vault).map(([p,body])=>[p,{role:'user',body}]))});
const directories=f=>{const d=new Set(['/','/vault','/home','/home/operator','/home/guest']);for(const p of Object.keys(f)){let x=p;while(x.lastIndexOf('/')>0){x=x.slice(0,x.lastIndexOf('/'));d.add(x);}}return d;};
const read=(s,p)=>{const q=path(s,p),f=fileList(s)[q];if(!f)throw Error(q+': fichier introuvable');if(!authorized(s,s.at,f.role))throw Error(q+': privilèges insuffisants ('+f.role+')');return f.body;};
const evidence=(s,inputs,values)=>values.every(v=>inputs.includes(v));
const writeCopy=(s,dest,data,append=false)=>{const q=path(s,dest);if(!/^\/vault\/[a-z0-9._-]{1,80}$/i.test(q))throw Error('Seul /vault est modifiable.');if(Object.keys(s.vault).length>=100&&!own(s.vault,q))throw Error('Coffre plein');const body=(append?(s.vault[q]||'')+'\n':'')+String(data);if(body.length>20000)throw Error('Copie trop volumineuse');s.vault[q]=body;return 'Écrit : '+q;};
const jobView=j=>({id:j.id,host:j.host,tool:j.tool,state:j.state,ram:j.ram,prompt:j.prompt,challenge:j.challenge,mode:j.mode,attempts:j.attempts});
function challenge(tool,d){
 if(tool==='latch')return {prompt:'TRAME FRAME\nSymboles : '+d.symbols.map((x,i)=>i+'='+x).join('  ')+'\nOrdre de lecture : '+d.order.join(' → ')+'\nCompose les quatre symboles dans cet ordre, sans espace.',answer:d.order.map(i=>d.symbols[i]).join(''),challenge:{kind:'latch',symbols:d.symbols,order:d.order}};
 if(tool==='splice'){let n=0;for(;n<d.ring.length;n++)if(d.ring.slice(n)+d.ring.slice(0,n)===d.target)break;return {prompt:'ANNEAU RING\nSource : '+d.ring+'\nCible  : '+d.target+'\nCombien de rotations d’un cran vers la gauche (0 à 3) ?',answer:String(n),challenge:{kind:'splice',ring:d.ring,target:d.target}};}
 if(tool==='weave'){const paths=[];const walk=(v,p,c)=>{if(v==='T'){paths.push({p,c});return;}for(const [a,b,n] of d.edges)if(a===v&&!p.includes(b))walk(b,p+b,c+n);};walk('S','S',0);paths.sort((a,b)=>a.c-b.c);return {prompt:'GRAPHE DE VALIDATION\n'+d.edges.map(([a,b,n])=>a+' → '+b+' : '+n).join('\n')+'\nTrouve le chemin de S à T au coût total minimal. Écris les sommets sans espaces.',answer:paths[0].p,challenge:{kind:'weave',edges:d.edges}};}
 return {prompt:'TABLE DE CONFIANCE\nEmplacements : '+d.slots.map((x,i)=>i+'='+x).join('  ')+'\nOrdre attendu : '+d.trusted.join(' → ')+'\nEntre les indices des emplacements dans cet ordre (sans espace).',answer:d.trusted.map(x=>d.slots.indexOf(x)).join(''),challenge:{kind:'prism',slots:d.slots,trusted:d.trusted}};
}
function training(s){
 if(s.phase>0)return 'Formation validée. Les manuels restent disponibles.';
 const steps=[
 [s.known.includes('lab-target'),'01 / Découvrir le voisinage','Tape scan. Tu verras deux hôtes du laboratoire ; entry est encore filtré.'],
 [s.probed['lab-target'],'02 / Examiner les ports','Tape probe lab-target. Le service et son port sont distincts du shell.'],
 [s.flags.labPublic,'03 / Interroger un service','Tape request lab-target 7410 GET / puis request lab-target 7410 GET /info. Tu peux lire des ressources publiques sans compte.'],
 [s.inspected['lab-target:7410'],'04 / Identifier une faiblesse','Tape inspect lab-target 7410. Compare le protocole avec tools et man latch.'],
 [s.access['lab-target'],'05 / Attaquer','Lance run latch lab-target 7410. Lis job <id>, puis solve <id> <réponse>. La RAM est réservée tant que la tâche existe.'],
 [s.at==='lab-target'||s.flags.labConnected,'06 / Session utilisateur','Tape connect lab-target, whoami, puis ls /evidence. Essaie cat /evidence/lab.txt : le compte utilisateur ne suffit pas.'],
 [s.kernelSeen['lab-target'],'07 / Examiner le noyau','Depuis lab-target, tape sysinfo et man prism.'],
 [s.access['lab-target']==='root','08 / Élévation','Lance run prism, puis job <id> et solve <id> <réponse>. Vérifie whoami. En cas de verrouillage : trace et wait.'],
 [own(s.vault,'/vault/lab.txt'),'09 / Préserver une preuve','Tape fetch /evidence/lab.txt pour copier le document dans ton coffre.'],
 [s.flags.labProxy,'10 / Relais','Tape local, puis proxy add lab-relay. Compare ram et trace ; la capacité augmente et les attaques futures sont moins bruyantes.'],
 [false,'11 / Validation','Tape submit /vault/lab.txt. Tu recevras ton premier dossier.']
 ];
 const p=steps.find(x=>!x[0]);return p[1]+'\n\n'+p[2];
}
function start(s,t,id,p,mode='normal'){
 const h=resolve(s,id),def=toolset[t];if(!def)throw Error('Outil inconnu. tools');
 if(s.locked[id])throw Error('Cible verrouillée. trace et wait.');
 if(active(s).some(j=>j.host===id&&j.tool===t))throw Error('Une tâche identique est déjà active.');
 if(!['normal','--quiet','--burst'].includes(mode))throw Error('Mode inconnu : --quiet ou --burst');const ram=def.ram+(mode==='--quiet'?2:mode==='--burst'?-2:0),initialNoise=def.noise+(mode==='--quiet'?-10:mode==='--burst'?18:0);
 if(used(s)+ram>cap(s))throw Error('RAM insuffisante. ram ; proxy ; kill.');
 let data;
 if(t==='prism'){if(s.at!==id||role(s,id)!=='user'||!h.kernel||!s.kernelSeen[id])throw Error('PRISM exige une session utilisateur et sysinfo sur un noyau compatible.');data=h.kernel;}
 else{const d=port(h,p);if(!s.inspected[id+':'+p])throw Error('Inspecte le service avant de choisir un outil.');if(d.weakness!==t)throw Error('Outil incompatible avec cette signature.');if(authorized(s,id,'user'))throw Error('Accès utilisateur déjà disponible.');data=d.frame;}
 const puzzle=challenge(t,data),j={id:s.next++,host:id,tool:t,ram,mode,state:'active',attempts:0,...puzzle};s.jobs.push(j);noise(s,id,initialNoise);
 if(j.state!=='active')throw Error('La surveillance a interrompu l’attaque. wait pour récupérer.');
 return 'PID '+j.id+' — '+t.toUpperCase()+' / '+id+'\n'+j.prompt+'\n\nsolve '+j.id+' <réponse>   |   kill '+j.id;
}
const output=(out='',code=0)=>({out,code});
function action(s,cmd,a,input=''){
 switch(cmd){
 case 'help':return a[0]?manual(a[0]):commandNames.join('  ')+'\n\nman <commande> ; tutorial ; mission';
 case 'man':return a[0]?manual(a[0]):commandNames.join('  ');
 case 'tutorial':return training(s);
 case 'mission':return missions[s.phase].title+'\n'+missions[s.phase].goal;
 case 'mail':{if(!a.length)return missions.slice(0,s.phase+1).map((m,i)=>(i+1)+'  '+m.from+' — '+m.title).join('\n');const m=missions[Number(a[0])-1];if(!m||Number(a[0])>s.phase+1)throw Error('Message inconnu');return m.from+' — '+m.title+'\n\n'+m.body;}
 case 'scan':{const h=resolve(s,a[0]||s.at);for(const id of h.links)if(!s.known.includes(id))s.known.push(id);return h.links.map(id=>id.padEnd(15)+H[id].ip.padEnd(18)+H[id].zone.padEnd(10)+(s.zones.includes(H[id].zone)?'reachable':'filtered')).join('\n');}
 case 'probe':{const h=resolve(s,a[0]);s.probed[h.id]=true;return h.id+' / '+h.ip+'\nPORT     SERVICE         PROTOCOL       VERSION\n'+Object.entries(h.ports).map(([p,d])=>p.padEnd(9)+d.name.padEnd(16)+d.protocol.padEnd(15)+d.version).join('\n')+'\nSHELL    '+(authorized(s,h.id,'user')?'authorized':'authentication required');}
 case 'inspect':{const h=resolve(s,a[0]),p=a[1],d=port(h,p);if(!s.probed[h.id])throw Error('Commence par probe.');s.inspected[h.id+':'+p]=true;return d.name+' '+d.version+' — '+d.protocol+'\nSignature : '+(d.weakness?'anomalie '+d.weakness.toUpperCase()+' compatible':'aucune faiblesse détectée')+'\nRessources : request '+h.id+' '+p+' GET /';}
 case 'request':{const h=resolve(s,a[0]),d=port(h,a[1]);if(a[2]!=='GET'||!a[3])throw Error('request <hôte> <port> GET <ressource>');if(a[3]==='/')return '200 OK\n'+Object.entries(d.resources).map(([p,f])=>p+'  ['+f.role+']').join('\n');const f=d.resources[a[3]];if(!f)throw Error('404 Not Found');if(!authorized(s,h.id,f.role))throw Error('403 Forbidden — '+f.role+' required');if(h.id==='lab-target'&&a[3]==='/info')s.flags.labPublic=true;return '200 OK\n'+f.body;}
 case 'tools':return Object.entries(toolset).map(([k,v])=>k.toUpperCase()+'  '+v.protocol+'  '+v.ram+' MiB  bruit +'+v.noise+'\n  '+v.desc).join('\n');
 case 'run':return a[0]==='prism'?start(s,'prism',s.at,null,a[1]):start(s,a[0],resolve(s,a[1]).id,a[2],a[3]);
 case 'jobs':return s.jobs.slice(-15).map(j=>String(j.id).padEnd(5)+j.tool.padEnd(9)+j.host.padEnd(16)+j.state+'  '+(j.state==='active'?j.ram:0)+' MiB').join('\n')||'Aucune tâche.';
 case 'job':{const j=s.jobs.find(j=>j.id===Number(a[0]));if(!j||j.state!=='active')throw Error('Tâche inactive ou inconnue');return j.prompt;}
 case 'kill':{const j=active(s).find(j=>j.id===Number(a[0]));if(!j)throw Error('Tâche inactive');j.state='cancelled';return 'Tâche arrêtée. RAM libérée.';}
 case 'solve':{const j=active(s).find(j=>j.id===Number(a[0]));if(!j||!a[1])throw Error('solve <id> <réponse>');j.attempts++;if(a[1].toUpperCase()!==j.answer){noise(s,j.host,22);throw Error(j.state==='blocked'?'Verrouillage : tâche interrompue.':'Trame rejetée. Réessaie ; bruit augmenté.');}j.state='done';s.access[j.host]=j.tool==='prism'?'root':'user';return 'ACCÈS '+s.access[j.host].toUpperCase()+' OBTENU : '+j.host+'\nRAM libérée.';}
 case 'connect':{const h=resolve(s,a[0]);if(!authorized(s,h.id,'user'))throw Error('Shell : authentification requise. Examine les services.');s.cwdByHost[s.at]=s.cwd;s.at=h.id;s.access[h.id]??='user';s.cwd=s.cwdByHost[h.id]|| (h.publicShell&&h.id!=='station'?'/home/guest':'/home/operator');if(h.id==='lab-target')s.flags.labConnected=true;return 'Session ouverte : '+h.id+' ('+role(s,h.id)+')';}
 case 'exit':case 'local':s.cwdByHost[s.at]=s.cwd;s.at='station';s.cwd=s.cwdByHost.station||'/home/operator';return 'Poste local.';
 case 'whoami':return role(s,s.at)==='root'?'root':H[s.at].publicShell&&s.at!=='station'?'guest':'operator';
 case 'hostname':return s.at;
 case 'pwd':return s.cwd;
 case 'ls':{const p=path(s,a[0]),f=fileList(s),d=directories(f);if(own(f,p))return p+' ['+f[p].role+']';if(!d.has(p))throw Error('Répertoire inconnu');const prefix=p==='/'?'/':p+'/';return [...new Set([...d,...Object.keys(f)].filter(x=>x!==p&&x.startsWith(prefix)).map(x=>prefix+x.slice(prefix.length).split('/')[0]))].sort().map(x=>x.slice(prefix.length)+(d.has(x)?'/':' ['+f[x].role+']')).join('\n')||'(vide)';}
 case 'cd':{const p=path(s,a[0]||'/home/operator');if(!directories(fileList(s)).has(p))throw Error('Répertoire inconnu');s.cwd=p;return '';}
 case 'cat':return a.length?a.map(x=>read(s,x)).join('\n'):input;
 case 'echo':return a.join(' ');
 case 'grep':{const flags=a.filter(x=>/^-[iv]+$/.test(x)),rest=a.filter(x=>!/^-[iv]+$/.test(x));if(!rest.length)throw Error('grep <motif> [fichier...]');const ignore=flags.some(x=>x.includes('i')),invert=flags.some(x=>x.includes('v')),needle=ignore?rest[0].toLowerCase():rest[0],data=rest.length>1?rest.slice(1).map(x=>read(s,x)).join('\n'):input;return data.split('\n').filter(x=>((ignore?x.toLowerCase():x).includes(needle))!==invert).join('\n');}
 case 'head':case 'tail':{const i=a.indexOf('-n'),n=i<0?10:Number(a[i+1]);if(!Number.isInteger(n)||n<1||n>1000)throw Error('Nombre invalide');const rest=i<0?a:a.filter((_,k)=>k!==i&&k!==i+1),data=rest.length?rest.map(x=>read(s,x)).join('\n'):input;const lines=data.split('\n');return (cmd==='head'?lines.slice(0,n):lines.slice(-n)).join('\n');}
 case 'cp':{if(a.length!==2)throw Error('cp <source> <destination>');return writeCopy(s,a[1],read(s,a[0]));}
 case 'fetch':{if(!a[0])throw Error('fetch <fichier> [nom]');const data=read(s,a[0]),name=a[1]||path(s,a[0]).split('/').at(-1);if(!/^[a-z0-9._-]{1,80}$/i.test(name))throw Error('Nom invalide');const dest='/vault/'+name;if(Object.keys(s.vault).length>=100&&!own(s.vault,dest))throw Error('Coffre plein');s.vault[dest]=data;return 'Copié : '+dest;}
 case 'rm':{const p=path(s,a[0]);if(!own(s.vault,p))throw Error('Seules les copies personnelles peuvent être supprimées.');delete s.vault[p];return '';}
 case 'proxy':{if(!a[0]||a[0]==='list')return s.proxies.join('\n')||'Aucun relais.';const h=resolve(s,a[1]);if(a[0]==='add'){if(!h.relay||!authorized(s,h.id,'user'))throw Error('Relais non compatible ou accès manquant.');if(!s.proxies.includes(h.id))s.proxies.push(h.id);if(h.id==='lab-relay')s.flags.labProxy=true;return 'Relais ajouté : '+h.id+' / '+h.ram+' MiB';}if(a[0]==='remove'){if(active(s).length)throw Error('Des tâches utilisent le pool de RAM.');s.proxies=s.proxies.filter(x=>x!==h.id);return 'Relais retiré.';}throw Error('proxy list|add|remove');}
 case 'ram':return used(s)+' / '+cap(s)+' MiB\n'+s.proxies.map(x=>x+' +'+H[x].ram+' MiB').join('\n');
 case 'trace':return (a[0]?[resolve(s,a[0]).id]:s.known).map(x=>x.padEnd(16)+(s.trace[x]||0)+'%'+(s.locked[x]?' LOCKED':'')).join('\n');
 case 'wait':for(const id of Object.keys(s.trace)){if(active(s).some(j=>j.host===id))continue;s.trace[id]=Math.max(0,s.trace[id]-30);if(s.trace[id]<50)delete s.locked[id];}return 'Le bruit retombe. Les preuves et accès sont conservés.';
 case 'sysinfo':{const h=H[s.at];s.kernelSeen[h.id]=true;return 'RIFT/kernel — '+h.id+'\nPrivilège : '+role(s,h.id)+'\n'+(h.kernel?'Module non signé : PRISM compatible.':'Aucune faiblesse locale détectée.');}
 case 'route':{if(!a[0])return s.zones.join('  ');const h=H[s.at];if(a[0]!=='open'||!h.route||role(s,h.id)!=='root')throw Error('Passerelle root nécessaire.');if(!s.zones.includes(h.route))s.zones.push(h.route);return 'Route '+h.route+' activée. scan pour découvrir les voisins.';}
 case 'submit':{if(s.phase>=4)throw Error('Aucune nouvelle pièce attendue.');const v=a.map(x=>read(s,x)),expected=[['RIFT-LAB|VALIDATED'],['NOTICE|SUSPENSION|UNREVIEWED'],['REVISION|ORIGINAL|APPROVAL-MISSING','EVENTS|REQUEST|MISSING-APPROVAL|COMMIT'],['ORDER|SUSPENSION|REVIEW-REQUIRED']][s.phase];if(!evidence(s,v,expected))throw Error('Pièces insuffisantes. Relis mission et les messages.');if(s.phase===0&&(!s.flags.labProxy||!s.flags.labPublic||s.access['lab-target']!=='root'))throw Error('Formation incomplète. tutorial');s.phase++;if(s.phase===1)s.zones.push('FRINGE');return 'PIÈCES VALIDÉES\nNouveau message de '+missions[s.phase].from+'.';}
 case 'publish':{if(s.phase!==4||s.at!=='publisher'||!['public','sealed'].includes(a[0]))throw Error('Publication indisponible ou mode invalide.');s.phase=5;s.ending=a[0]==='public'?'Diffusion anonymisée effectuée.':'Dossier déposé sous scellés.';return s.ending;}
 case 'history':return s.history.map((x,i)=>(i+1)+'  '+x).join('\n');
 case 'clear':return '';
 default:throw Error(cmd+': commande inconnue. help');
 }
}
export function execute(s,line){
 if(typeof line!=='string'||line.length>500)return output('Commande invalide',1);
 const words=line.trim().match(/"(?:[^"\\]|\\.)*"|'[^']*'|>>|[|>;]|[^\s|>;]+/g)||[];if(!words.length)return output();
 s.history.push(line);s.history=s.history.slice(-100);s.tick++;
 try{
  const result=[];let segment=[],input='',redirect=null,append=false;
  const executeSegment=()=>{if(!segment.length)throw Error('Commande incomplète');const [raw,...a]=segment.map(x=>/^(['"]).*\1$/.test(x)?x.slice(1,-1):x),cmd=raw.toLowerCase();segment=[];if(!['help','man','job','jobs','trace','ram','tutorial','history','clear'].includes(cmd))for(const j of active(s))noise(s,j.host,j.mode==='--quiet'?3:j.mode==='--burst'?8:5);input=action(s,cmd,a,input);};
  const flush=()=>{if(segment.length)executeSegment();if(redirect){result.push(writeCopy(s,redirect,input,append));redirect=null;}else if(input)result.push(input);input='';};
  for(let i=0;i<words.length;i++){const x=words[i];if(x==='|'){if(redirect)throw Error('Pipe après redirection');executeSegment();if(i===words.length-1)throw Error('Pipe incomplet');}else if(x==='>'||x==='>>'){if(redirect||!segment.length||!words[i+1]||/^[|>;]+$/.test(words[i+1]))throw Error('Redirection invalide');redirect=words[++i].replace(/^(['"])(.*)\1$/,'$2');append=x==='>>';if(i+1<words.length&&words[i+1]!==';')throw Error('Redirection en fin de commande');}else if(x===';'){flush();}else{if(redirect)throw Error('Redirection en fin de commande');segment.push(x);}}
  flush();return output(result.join('\n'));
 }catch(e){return output(String(e.message||e),1);}
}
export function view(s){return {phase:s.phase,at:s.at,cwd:s.cwd,user:role(s,s.at)==='root'?'root':H[s.at].publicShell&&s.at!=='station'?'guest':'operator',mission:missions[s.phase].goal,messages:missions.slice(0,s.phase+1).map(({title,from,body},i)=>({id:i+1,title,from,body})),tutorial:training(s),zones:s.zones,nodes:s.known.map(id=>{const h=H[id];return {id,ip:h.ip,zone:h.zone,links:h.links.filter(x=>s.known.includes(x)),reachable:s.zones.includes(h.zone),role:role(s,id),proxy:s.proxies.includes(id),trace:s.trace[id]||0,locked:!!s.locked[id],services:s.probed[id]?Object.entries(h.ports).map(([port,d])=>({port,name:d.name,protocol:d.protocol,version:d.version,signature:s.inspected[id+':'+port]?d.weakness||'stable':null})):null};}),jobs:s.jobs.slice(-20).map(jobView),ram:{used:used(s),total:cap(s)},files:Object.entries(s.vault).map(([path,body])=>({path,body})),ending:s.ending,history:s.history.slice(-100)};}
export function complete(s,line){const i=line.lastIndexOf(' ')+1,part=line.slice(i),words=line.slice(0,i).trim().split(/\s+/),cmd=words[0];let candidates=i===0?commandNames:['scan','probe','inspect','request','connect','trace'].includes(cmd)&&words.length===1?s.known:cmd==='man'?commandNames:cmd==='run'&&words.length===1?Object.keys(toolset):cmd==='run'&&words.length===2?s.known:cmd==='run'&&words.length===3?Object.keys(H[words[2]]?.ports||{}):['inspect','request'].includes(cmd)&&words.length===2?Object.keys(H[words[1]]?.ports||{}):cmd==='proxy'&&words.length===1?['add','list','remove']:cmd==='proxy'&&words.length===2?s.known:['cat','fetch','rm','submit','cd','ls'].includes(cmd)?[...Object.keys(fileList(s)),...directories(fileList(s))]:[];candidates=[...new Set(candidates.filter(x=>x.toLowerCase().startsWith(part.toLowerCase())))].sort();return {line:candidates.length===1?line.slice(0,i)+candidates[0]+' ':line,matches:candidates};}
