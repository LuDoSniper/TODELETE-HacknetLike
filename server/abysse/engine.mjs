import {world,missions} from './world.mjs';
const engine=(function buildEngine(world,missions){
 const host=id=>world.find(h=>h.id===id);
 const groups={
 "SHELL":{help:"[commande] — index",man:"<commande|shell|reseau|atelier> — manuel",pwd:"— répertoire courant",ls:"[-la] [chemin...] — fichiers",cd:"[répertoire] — navigation",cat:"<fichier...> — lecture",less:"<fichier> — lecture",find:"[chemin] [-name motif] [-type f|d] — recherche",grep:"[-inrv] <motif> [fichier...] — filtrage",head:"[-n nombre] [fichier...] — début",tail:"[-n nombre] [fichier...] — fin",wc:"[-lwc] [fichier...] — comptage",sort:"[-r] [fichier...] — tri",uniq:"[-c] [fichier...] — doublons",cut:"-d séparateur -f champ [fichier] — découpage",base64:"[-d] [fichier] — encodage/décodage",echo:"[texte...] — sortie",printf:"<format> [texte...] — sortie formatée",mkdir:"[-p] <chemin...> — créer dossier",touch:"<fichier...> — créer fichier",cp:"<source> <destination> — copier",mv:"<source> <destination> — déplacer",rm:"<fichier...> — supprimer",stat:"<fichier> — métadonnées",tree:"[chemin] — arborescence",whoami:"— identité",hostname:"— machine",uname:"[-a] — système",date:"— heure de simulation",env:"— environnement",export:"NOM=valeur — variable",history:"— historique",clear:"— effacer l'écran"},
 "RESEAU":{scan:"— découvrir les voisins",ip:"[addr|route] — interfaces et routes",ping:"<hôte> — vérifier la liaison",probe:"[hôte] — services déclarés",ssh:"<utilisateur@hôte> [jeton] — ouvrir une session",exit:"— revenir à la session précédente",fetch:"<fichier distant> [destination locale] — rapatrier",net:"— topologie connue"},
 "ATELIER":{mail:"[numéro] — messages de mission",submit:"<fichier...> — transmettre les pièces",status:"— progression et état",assemble:"<partie1> <partie2> <partie3> [sortie] — reconstruire"},
 "SERVICES VIRTUELS":{bus:"status|queue|calibrate <minutes>|replay <seq>",grid:"status|stop <charge>|start <charge>",ps:"— processus virtuels",kill:"<PID> — arrêter un processus virtuel",service:"status|start <nom>",transmit:"private|public — transmission"}
 };
 const all=Object.assign({},...Object.values(groups));
 const manuals={
 shell:"SHELL ABYSSE\n\nChemins absolus /, relatifs, ~, . et .. ; glob * et ?. Les fichiers et variables sont propres à chaque machine.\nOpérateurs : | (pipe), > (écraser), >> (ajouter), && (si succès), ; (séquence).\nGuillemets simples/doubles, $VAR, $?, historique.\nTAB : commandes, chemins, hôtes, utilisateurs et options.\nCtrl+A/E : début/fin ; Ctrl+U/K : effacer ; Ctrl+W : mot ; Ctrl+L : écran ; Ctrl+C : annuler la saisie.\nLes commandes n'accèdent jamais au vrai système.",
 reseau:"RESEAU SIMULE\n\nscan découvre les voisins directs. ssh <user@host> [jeton] ouvre une session sur un voisin découvert. IP et noms sont acceptés. exit dépile la session.\nLe réseau s'ouvre au fur et à mesure de la mission. ping et probe ne contactent que les machines fictives.\nfetch /chemin [destination] copie un fichier lisible du poste distant dans ~/loot sur atelier (ou vers un chemin local choisi).",
 atelier:"ATELIER\n\nmail liste les messages reçus ; mail 1 ouvre le premier. submit <fichier...> ne fonctionne que sur atelier et vérifie les données, pas le nom du fichier.\nstatus affiche l'objectif. fetch rapatrie les fichiers sans modifier la source. Les sauvegardes sont automatiques.",
 bus:"BUS ACOUSTIQUE (protocole fictif)\n\nbus status — synchronisation et état.\nbus calibrate <minutes> — sur horloge, ajoute un décalage à l'heure locale.\nbus queue — sur relais, affiche les trames en attente.\nbus replay <seq> — sur relais, rejoue une trame valide après synchronisation. Le SOS récupéré est écrit dans /var/spool/sos.txt.",
 grid:"GESTION DE PUISSANCE\n\ngrid status affiche les charges et la capacité.\ngrid stop <charge> coupe une charge non critique.\ngrid start <charge> alimente une charge si le budget le permet.\nLa liaison et la ventilation sont critiques. Disponible sur batterie et pompe.",
 assemble:"ASSEMBLE — sur atelier\n\nassemble <fichier1> <fichier2> <fichier3> [sortie]\nLes parties doivent être en texte, au format CAMPAGNE|INDEX|VALEUR. Les trois index distincts doivent appartenir à la même campagne valide. Ordre libre. Sortie par défaut : ~/position.txt.",
 transmit:"TRANSMISSION — sur balise, après validation des preuves\n\ntransmit private : secours et confidentialité.\ntransmit public : secours et enquête publique.\nDécision définitive."
 };
 const fresh=()=>({version:2,stack:[{host:'atelier',user:'operateur',cwd:'/home/operateur',prev:'/home/operateur'}],known:['atelier'],phase:0,files:Object.fromEntries(world.map(h=>[h.id,{...h.files}])),dirs:Object.fromEntries(world.map(h=>[h.id,['/','/tmp',...Object.keys(h.users).map(u=>'/home/'+u),...(h.id==='atelier'?['/home/operateur/loot']:[])]])),vars:{},hist:[],activity:[],offset:0,replayed:false,grid:{liaison:true,ventilation:true,sonar:true,pompe:false},processes:{'204':true,'731':true},circulation:false,ending:'',last:0});
 const ctx=s=>s.stack.at(-1),home=c=>'/home/'+c.user;
 const path=(c,p)=>{p=String(p??'');if(p==='~'||p.startsWith('~/'))p=home(c)+p.slice(1);if(!p.startsWith('/'))p=c.cwd+'/'+p;const a=[];for(const x of p.split('/')){if(x==='..')a.pop();else if(x&&x!=='.')a.push(x);}return '/'+a.join('/');};
 const parent=p=>p.slice(0,p.lastIndexOf('/'))||'/',basename=p=>p.split('/').at(-1);
 const dirs=(s,h)=>{const d=new Set(s.dirs[h]);for(const p of [...Object.keys(s.files[h]),...d]){let x=p;while(x!=='/'){x=parent(x);d.add(x);}}return d;};
 const exists=(s,h,p)=>Object.hasOwn(s.files[h],p);
 const read=(s,c,p)=>{const q=path(c,p);if(!exists(s,c.host,q))throw Error(p+': aucun fichier de ce type');return s.files[c.host][q];};
 const writable=(c,p)=>p.startsWith(home(c)+'/')||p.startsWith('/tmp/');
 const put=(s,c,p,data,append=false)=>{const q=path(c,p),f=s.files[c.host];if(!writable(c,q))throw Error(q+': permission refusée');if(!dirs(s,c.host).has(parent(q)))throw Error(q+': répertoire parent introuvable');if(dirs(s,c.host).has(q))throw Error(q+': est un répertoire');const value=(append&&exists(s,c.host,q)?f[q]:'')+data;if(value.length>20000||(!exists(s,c.host,q)&&Object.keys(f).length>=350))throw Error('Quota dépassé');f[q]=value;return q;};
 const local=s=>s.stack[0],reachable=(s,h)=>host(ctx(s).host).links.includes(h.id),resolveHost=x=>world.find(h=>h.id===x||h.ip===x);
 const required=h=>({SURFACE:0,LIAISON:1,FOND:2,HABITAT:3,ENQUETE:4})[h.zone]??0;
 const available=s=>world.filter(h=>s.known.includes(h.id));
 const load=s=>Object.entries(s.grid).reduce((n,[k,v])=>n+(v?({liaison:10,ventilation:15,sonar:30,pompe:35})[k]:0),0);
 const integrity=s=>s.grid.pompe&&s.grid.ventilation&&s.grid.liaison&&s.circulation&&!s.processes['731']&&s.processes['204'];
 const view=s=>({phase:s.phase,total:missions.length,mission:missions[Math.min(s.phase,missions.length-1)].title,objective:missions[Math.min(s.phase,missions.length-1)].needed,at:ctx(s).host,user:ctx(s).user,cwd:ctx(s).cwd,depth:s.stack.length,nodes:available(s).map(h=>({id:h.id,ip:h.ip,zone:h.zone,links:h.links.filter(x=>s.known.includes(x)),available:required(h)<=s.phase})),activity:s.activity.slice(-8),ending:s.ending,history:s.hist.slice(-100),unread:Math.min(s.phase+1,missions.length)});
 const success=(out='')=>({out,code:0}),fail=out=>({out,code:1});
 const globRe=p=>new RegExp('^'+p.replace(/[.+^$(){}|[\]\\]/g,'\\$&').replace(/\*/g,'[^/]*').replace(/\?/g,'[^/]')+'$');
 const expand=(s,c,a)=>a.flatMap(x=>{if(!/[*?]/.test(x))return [x];const re=globRe(path(c,x));const found=[...new Set([...Object.keys(s.files[c.host]),...dirs(s,c.host)])].filter(p=>re.test(p)).sort();return found.length?found:[x];});
 const inputText=(s,c,args,input)=>args.length?args.map(p=>read(s,c,p)).join('\n'):input;
 const fmtHelp=()=>Object.entries(groups).map(([k,v])=>k+'\n'+Object.entries(v).map(([n,d])=>'  '+n.padEnd(13)+d).join('\n')).join('\n\n');
 const values=(s,c)=>({USER:c.user,HOME:home(c),PWD:c.cwd,HOSTNAME:c.host,SHELL:'/bin/abyss',PATH:'/bin:/usr/bin','?':String(s.last),...(s.vars[c.host]||{})});
 function tokenize(s,line){
 let tokens=[],buf='',active=false,quote='',escape=false;const v=values(s,ctx(s));
 const flush=()=>{if(active){tokens.push({v:buf,op:false});buf='';active=false;}};
 for(let i=0;i<line.length;i++){const ch=line[i];if(escape){buf+=ch;active=true;escape=false;continue;}if(ch==='\\'&&quote!=="'"){escape=true;active=true;continue;}if(ch===quote){quote='';continue;}if(!quote&&(ch==="'"||ch==='"')){quote=ch;active=true;continue;}if(ch==='$'&&quote!=="'"){const m=line.slice(i+1).match(/^(\?|[A-Za-z_][A-Za-z0-9_]*)/);if(m){buf+=v[m[0]]??'';i+=m[0].length;active=true;continue;}}if(!quote&&/\s/.test(ch)){flush();continue;}if(!quote&&'|;>&'.includes(ch)){flush();let op=ch;if((ch==='>'||ch==='&')&&line[i+1]===ch){op+=ch;i++;}if(op==='&')throw Error('Opérateur & non pris en charge');tokens.push({v:op,op:true});continue;}buf+=ch;active=true;}
 if(quote||escape)throw Error('Guillemets ou échappement non terminés');flush();return tokens;
 }
 function command(s,name,a,input){
 const c=ctx(s),h=host(c.host),f=s.files[c.host],d=dirs(s,c.host),args=()=>expand(s,c,a);
 const requireHost=(...ids)=>{if(!ids.includes(c.host))throw Error('Service indisponible sur '+c.host);};
 const flags=a.filter(x=>x.startsWith('-')),plain=a.filter(x=>!x.startsWith('-'));
 switch(name){
 case 'help':return success(a[0]?(all[a[0]]?a[0]+' '+all[a[0]]:'Commande inconnue'):fmtHelp());
 case 'man':return success(manuals[a[0]]||(all[a[0]]?a[0]+' '+all[a[0]]:'Manuel : '+Object.keys(manuals).join(', ')));
 case 'pwd':return success(c.cwd);
 case 'whoami':return success(c.user);
 case 'hostname':return success(c.host);
 case 'uname':return success(a.includes('-a')?'ABYSS/OS '+c.host+' 6.27.1 virtual x86_64 GNU-like':'ABYSS/OS');
 case 'date':return success('Nuit 27 / 02:'+String(14+Math.min(s.phase*4,40)).padStart(2,'0')+' UTC (horloge du scénario)');
 case 'env':return success(Object.entries(values(s,c)).map(([k,v])=>k+'='+v).join('\n'));
 case 'export':{const m=a.join(' ').match(/^([A-Za-z_]\w*)=(.*)$/);if(!m)throw Error('usage: export NOM=valeur');(s.vars[c.host]??={})[m[1]]=m[2];return success();}
 case 'history':return success(s.hist.map((x,i)=>String(i+1).padStart(4)+'  '+x).join('\n'));
 case 'clear':return success();
 case 'cd':{const p=a[0]==='-'?c.prev:path(c,a[0]||'~');if(!d.has(p))throw Error(p+': répertoire introuvable');c.prev=c.cwd;c.cwd=p;return success(a[0]==='-'?p:'');}
 case 'ls':{const long=flags.some(x=>x.includes('l')),hidden=flags.some(x=>x.includes('a'));const targets=expand(s,c,plain.length?plain:['.']);const format=(p)=>{const dir=d.has(p),perm=dir?'drwxr-xr-x':writable(c,p)?'-rw-r--r--':'-r--r--r--';return long?perm+'  1 '+(writable(c,p)?c.user:'root').padEnd(11)+' '+String(dir?4096:f[p]?.length||0).padStart(6)+'  '+basename(p)+(dir?'/':''):basename(p)+(dir?'/':'');};return success(targets.map(x=>{const p=path(c,x);if(exists(s,c.host,p))return format(p);if(!d.has(p))throw Error(x+': introuvable');let children=[...new Set([...d,...Object.keys(f)])].filter(q=>q!==p&&parent(q)===p&&(hidden||!basename(q).startsWith('.'))).sort();return (targets.length>1?p+':\n':'')+children.map(format).join(long?'\n':'  ');}).join('\n'));}
 case 'cat':case 'less':return success(inputText(s,c,args(),input));
 case 'echo':return success(a.join(' '));
 case 'printf':{let i=1;return success((a[0]||'').replace(/%s/g,()=>a[i++]||'').replace(/\\n/g,'\n').replace(/\\t/g,'\t'));}
 case 'find':{const root=path(c,a[0]&&!a[0].startsWith('-')?a[0]:'.'),ni=a.indexOf('-name'),ti=a.indexOf('-type'),re=ni>=0?globRe(a[ni+1]||'*'):null;return success([...new Set([...d,...Object.keys(f)])].filter(p=>(p===root||p.startsWith(root==='/'?'/':root+'/'))&&(!re||re.test(basename(p)))&&(ti<0||(a[ti+1]==='d'?d.has(p):exists(s,c.host,p)))).sort().join('\n'));}
 case 'tree':{const root=path(c,a[0]||'.');if(!d.has(root))throw Error('Répertoire introuvable');return success(root+'\n'+[...new Set([...d,...Object.keys(f)])].filter(p=>p!==root&&p.startsWith(root==='/'?'/':root+'/')).sort().map(p=>'  '.repeat(p.slice(root==='/'?1:root.length+1).split('/').length-1)+'├─ '+basename(p)+(d.has(p)?'/':'')).join('\n'));}
 case 'grep':{const opts=flags.join(''),pat=plain[0];if(pat===undefined)throw Error('usage: grep [-inrv] motif [fichier]');let re;try{re=new RegExp(pat,opts.includes('i')?'i':'');}catch{throw Error('Expression régulière invalide');}let fs=expand(s,c,plain.slice(1));if(opts.includes('r'))fs=fs.flatMap(x=>{const p=path(c,x);return d.has(p)?Object.keys(f).filter(q=>q.startsWith(p==='/'?'/':p+'/')):[x];});const sources=fs.length?fs.map(p=>[p,read(s,c,p)]):[['',input]];const lines=sources.flatMap(([p,t])=>t.split('\n').flatMap((l,i)=>(re.test(l)!==opts.includes('v'))?[(sources.length>1?p+':':'')+(opts.includes('n')?(i+1)+':':'')+l]:[]));return {out:lines.join('\n'),code:lines.length?0:1};}
 case 'head':case 'tail':{let n=10,b=[...a];const ix=b.indexOf('-n');if(ix>=0){n=Number(b[ix+1]);b.splice(ix,2);}if(!Number.isInteger(n)||n<0||n>1000)throw Error('Nombre invalide');const lines=inputText(s,c,expand(s,c,b),input).split('\n');return success((name==='head'?lines.slice(0,n):n?lines.slice(-n):[]).join('\n'));}
 case 'wc':{const t=inputText(s,c,expand(s,c,plain),input),n=t?t.split('\n').length:0,w=t.trim()?t.trim().split(/\s+/).length:0;return success((flags.length?[...(flags.join('').includes('l')?[n]:[]),...(flags.join('').includes('w')?[w]:[]),...(flags.join('').includes('c')?[t.length]:[])]:[n,w,t.length]).join('  '));}
 case 'sort':{let l=inputText(s,c,expand(s,c,plain),input).split('\n').sort();if(flags.includes('-r'))l.reverse();return success(l.join('\n'));}
 case 'uniq':{const l=inputText(s,c,expand(s,c,plain),input).split('\n'),r=[];for(const x of l){if(r.length&&r.at(-1)[0]===x)r.at(-1)[1]++;else r.push([x,1]);}return success(r.map(([x,n])=>(flags.includes('-c')?String(n).padStart(5)+' ':'')+x).join('\n'));}
 case 'cut':{const di=a.indexOf('-d'),fi=a.indexOf('-f');if(di<0||fi<0)throw Error('usage: cut -d séparateur -f champ [fichier]');const sep=a[di+1],n=Number(a[fi+1]);if(!sep||!Number.isInteger(n)||n<1)throw Error('Champ invalide');const b=a.filter((_,i)=>![di,di+1,fi,fi+1].includes(i));return success(inputText(s,c,expand(s,c,b),input).split('\n').map(x=>x.split(sep)[n-1]||'').join('\n'));}
 case 'base64':{const t=inputText(s,c,expand(s,c,plain),input);try{return success(flags.includes('-d')?new TextDecoder().decode(Uint8Array.from(atob(t.trim()),x=>x.charCodeAt(0))):btoa(String.fromCharCode(...new TextEncoder().encode(t))));}catch{throw Error('Base64 invalide');}}
 case 'mkdir':{if(!plain.length)throw Error('usage: mkdir [-p] chemin');for(const x of plain){const p=path(c,x);if(!writable(c,p))throw Error('Permission refusée');if(!dirs(s,c.host).has(parent(p))&&!flags.includes('-p'))throw Error('Parent introuvable');if(exists(s,c.host,p))throw Error('Un fichier existe');if(!s.dirs[c.host].includes(p))s.dirs[c.host].push(p);}return success();}
 case 'touch':for(const x of args()){const p=path(c,x);put(s,c,p,exists(s,c.host,p)?f[p]:'');}return success();
 case 'cp':case 'mv':{if(a.length!==2)throw Error('usage: '+name+' source destination');const p=path(c,a[0]),dest=path(c,a[1]);if(name==='mv'&&!writable(c,p))throw Error('Permission refusée');const q=put(s,c,d.has(dest)?dest+'/'+basename(p):dest,read(s,c,p));if(name==='mv'&&q!==p)delete f[p];return success();}
 case 'rm':for(const x of args()){const p=path(c,x);if(!writable(c,p))throw Error('Permission refusée');if(!exists(s,c.host,p))throw Error('Fichier introuvable');delete f[p];}return success();
 case 'stat':{const p=path(c,a[0]);if(!exists(s,c.host,p)&&!d.has(p))throw Error('Introuvable');return success('Fichier : '+p+'\nType : '+(d.has(p)?'directory':'regular file')+'\nTaille : '+(f[p]?.length||0)+' octets\nAccès : '+(writable(c,p)?'lecture/écriture':'lecture seule'));}
 case 'scan':{for(const id of h.links)if(!s.known.includes(id))s.known.push(id);return success('HOTE'.padEnd(16)+'IP'.padEnd(17)+'ETAT\n'+h.links.map(id=>{const t=host(id);return t.id.padEnd(16)+t.ip.padEnd(17)+(required(t)<=s.phase?'joignable':'liaison isolée');}).join('\n'));}
 case 'ip':return success(a[0]==='route'?h.links.filter(x=>s.known.includes(x)).map(x=>host(x).ip+' via '+h.id+' dev mesh0').join('\n')||'Aucune route connue':'1: lo    127.0.0.1/8\n2: mesh0 '+h.ip+'/24  UP');
 case 'ping':case 'probe':{const t=a[0]?resolveHost(a[0]):h;if(!t||!s.known.includes(t.id)||(t.id!==h.id&&!reachable(s,t))||required(t)>s.phase)throw Error('Hôte inaccessible');return success(name==='ping'?'64 bytes from '+t.ip+': seq=1 time=12ms (virtuel)':t.id+' / '+t.ip+'\n'+t.services.map(x=>'  '+x.padEnd(18)+'available').join('\n'));}
 case 'net':return success(available(s).map(x=>x.ip.padEnd(17)+x.id.padEnd(16)+x.zone).join('\n'));
 case 'ssh':{const [u,id]=(a[0]||'').split('@'),t=resolveHost(id);if(!t||!s.known.includes(t.id)||!reachable(s,t))throw Error('ssh: aucune route vers cet hôte. scan pour les voisins.');if(required(t)>s.phase)throw Error('ssh: liaison isolée');if(!Object.hasOwn(t.users,u)||t.users[u]!== (a[1]||''))throw Error('ssh: authentification refusée');if(s.stack.length>=60)throw Error('Trop de sessions imbriquées');s.stack.push({host:t.id,user:u,cwd:'/home/'+u,prev:'/home/'+u});return success('Connected to '+t.id+' ('+t.ip+')\n'+(s.files[t.id]['/etc/motd']||'ABYSS/OS remote session'));}
 case 'exit':if(s.stack.length===1)return success('Déjà sur atelier.');s.stack.pop();return success('Connection to '+c.host+' closed.');
 case 'fetch':{if(c.host==='atelier')throw Error('fetch: commande réservée aux sessions distantes');const p=path(c,a[0]),dest=a[1]||'~/loot/'+basename(p);return success('Reçu : '+put(s,local(s),dest,read(s,c,p)));}
 case 'mail':{if(!a.length)return success(missions.slice(0,Math.min(s.phase+1,missions.length)).map((m,i)=>String(i+1).padEnd(4)+m.from.padEnd(24)+m.subject).join('\n'));const n=Number(a[0])-1;if(!Number.isInteger(n)||n<0||n>s.phase||!missions[n])throw Error('Message inconnu');const m=missions[n];return success('DE : '+m.from+'\nOBJET : '+m.subject+'\n'+'─'.repeat(46)+'\n'+m.body);}
 case 'status':return success(s.ending||'CHAPITRE '+(s.phase+1)+'/'+missions.length+' — '+missions[s.phase].title+'\nObjectif : '+missions[s.phase].needed+'\nConsultez mail '+(s.phase+1));
 case 'submit':{requireHost('atelier');if(s.phase>=5)throw Error('Aucune pièce attendue');const v=a.map(x=>read(s,c,x).trim());const expected=[['R27 | DETRESSE | Habitat NEREIDE | équipage: 6 | demande: secours immédiat | signature: VERA-27'],['SOS-81 | NEREIDE | VERA | six personnes | accès profond restauré'],['N27 | EST-12 | PROF-480 | CAP-031'],['NEREIDE | circulation OK | sas secteur B | équipage 6'],['R27 | ALARME CONFIRMEE | isolement ordonné avant le défaut de pompe | source: directive-17','DIRECTIVE-17 | ordre: isoler NEREIDE | motif: dissimulation expérience | validation: V. LENOIR']][s.phase];if(!expected.every(x=>v.includes(x)))throw Error('Pièces refusées : données manquantes ou incorrectes');if(s.phase===1&&!s.replayed||s.phase===3&&!integrity(s))throw Error('État du système non confirmé');s.phase++;return success('PIÈCES VALIDÉES.\nNouveau message : mail '+(s.phase+1));}
 case 'bus':{requireHost('relais','horloge');const [op,v]=a;if(op==='status')return success('offset='+s.offset+' min | '+(s.offset===-7?'SYNC':'DRIFT')+' | SOS '+(s.replayed?'RECUPERE':'ATTENTE'));if(op==='calibrate'){requireHost('horloge');const n=Number(v);if(!v||!Number.isInteger(n)||Math.abs(n)>60)throw Error('Décalage invalide');s.offset=n;return success('offset='+n+' min');}if(op==='queue'){requireHost('relais');return success('SEQ TYPE     CRC  DELIVERY\n79  ROUTINE  OK   SENT\n81  SOS      OK   '+(s.replayed?'SENT':'WAIT')+'\n82  SOS      BAD  WAIT\n83  ROUTINE  OK   WAIT');}if(op==='replay'){requireHost('relais');if(s.offset!==-7)throw Error('REJECT: CLOCK_DRIFT');if(v==='82')throw Error('REJECT: CRC_INVALID');if(v!=='81')return success('Trame de routine ; aucune donnée de mission.');s.replayed=true;f['/var/spool/sos.txt']='SOS-81 | NEREIDE | VERA | six personnes | accès profond restauré';return success('ACK 81 — /var/spool/sos.txt');}throw Error(manuals.bus);}
 case 'assemble':{requireHost('atelier');if(a.length<3||a.length>4)throw Error('usage: assemble a b c [sortie]');const parts=a.slice(0,3).map(x=>read(s,c,x).trim().split('|')).sort((x,y)=>Number(x[1])-Number(y[1]));if(parts.some((x,i)=>x[0]!=='N27'||x[1]!==String(i+1)||x[2]!==['EST-12','PROF-480','CAP-031'][i]))throw Error('Assemblage refusé : campagne ou fragments incohérents');return success('Position reconstruite : '+put(s,c,a[3]||'~/position.txt','N27 | EST-12 | PROF-480 | CAP-031'));}
 case 'grid':{requireHost('batterie','pompe');const [op,k]=a;if(op==='status')return success(Object.entries(s.grid).map(([x,on])=>x.padEnd(15)+(on?'ON ':'OFF')+'   '+({liaison:10,ventilation:15,sonar:30,pompe:35})[x]+' kW').join('\n')+'\nTOTAL '+load(s)+' / 70 kW');if(!Object.hasOwn(s.grid,k)||!['start','stop'].includes(op))throw Error('Charge ou opération inconnue');if(op==='stop'&&['liaison','ventilation'].includes(k))throw Error('Charge critique : arrêt interdit');const before=s.grid[k];s.grid[k]=op==='start';if(load(s)>70){s.grid[k]=before;throw Error('Protection : capacité dépassée');}if(!s.grid.pompe)s.circulation=false;return success(k+' '+(s.grid[k]?'ON':'OFF')+' / '+load(s)+' kW');}
 case 'ps':return success(c.host==='pompe'?'PID  USER         COMMAND\n1    root         init\n'+(s.processes['204']?'204  technicien   regulateur --live\n':'')+(s.processes['731']?'731  technicien   diagnostic --hold-pressure\n':''):'PID  USER         COMMAND\n1    root         init\n48   '+c.user.padEnd(13)+'shell');
 case 'kill':{requireHost('pompe');const pid=a.at(-1);if(!Object.hasOwn(s.processes,pid)||!s.processes[pid])throw Error('kill: processus introuvable');s.processes[pid]=false;if(pid==='204')s.circulation=false;return success();}
 case 'service':{const [op,k]=a;if(c.host==='pompe'&&op==='start'&&k==='circulation'){if(!s.grid.pompe||s.processes['731'])throw Error('Service bloqué : vérifier alimentation et ps');s.processes['204']=true;s.circulation=true;return success('circulation active / pression stable');}if(op==='status'&&['sas','pompe','station'].includes(c.host)){if(integrity(s)&&c.host==='sas')f['/var/run/integrite.txt']='NEREIDE | circulation OK | sas secteur B | équipage 6';return success('Circulation : '+(integrity(s)?'OK':'DEFAUT')+'\nSas : '+(integrity(s)?'OUVERT / secteur B':'VERROUILLE')+(integrity(s)&&c.host==='sas'?'\nRapport : /var/run/integrite.txt':''));}throw Error('Service inconnu');}
 case 'transmit':{requireHost('balise');if(s.phase!==5||!['private','public'].includes(a[0])||s.ending)throw Error('Transmission indisponible');s.ending=a[0]==='public'?'Les six membres de NEREIDE ont été évacués. Les preuves sont publiques. Une enquête indépendante s’ouvre.':'Les six membres de NEREIDE ont été évacués. Le dossier est confié au navire, sous protection. La vérité reste à défendre.';s.phase=6;return success('TRANSMISSION CONFIRMEE\n'+s.ending);}
 default:throw Error(name+': command not found');
 }
 }
 function execute(s,line){
 if(!line.trim())return success();if(line.length>500)return fail('Commande trop longue');
 s.hist.push(line);s.hist=s.hist.slice(-200);
 let result=success(),outputs=[];
 try{
 const tokens=tokenize(s,line);let chains=[],pipeline=[],segment=[];
 const flush=()=>{if(!segment.length)throw Error('Syntaxe invalide');pipeline.push(segment);segment=[];};
 for(const t of tokens){if(t.op&&['|',';','&&'].includes(t.v)){flush();if(t.v!=='|'){chains.push({pipeline,after:t.v});pipeline=[];}}else segment.push(t);}
 if(segment.length)flush();else if(tokens.at(-1)?.v==='|'||tokens.at(-1)?.v==='&&')throw Error('Commande incomplète');
 if(pipeline.length)chains.push({pipeline,after:''});
 let previous=';';
 for(const chain of chains){if(previous==='&&'&&result.code!==0){previous=chain.after;continue;}let input='';
 for(const seg of chain.pipeline){let words=seg.filter(x=>!x.op).map(x=>x.v),redirect=null;const ix=seg.findIndex(x=>x.op);if(ix>=0){if(!['>','>>'].includes(seg[ix].v)||ix!==seg.length-2||seg[ix+1].op)throw Error('Redirection invalide');redirect={op:seg[ix].v,p:seg[ix+1].v};words=seg.slice(0,ix).map(x=>x.v);}
 try{result=command(s,words[0],words.slice(1),input);}catch(e){result=fail(e.message||'Erreur');}
 if(redirect&&result.code===0){put(s,ctx(s),redirect.p,result.out+(result.out?'\n':''),redirect.op==='>>');result=success();}
 input=result.out;
 }
 if(result.out)outputs.push(result.out);previous=chain.after;
 }
 }catch(e){result=fail(e.message||'Erreur');outputs.push(result.out);}
 s.last=result.code;s.activity.push({host:ctx(s).host,command:line.trim().split(/\s+/)[0],code:result.code});s.activity=s.activity.slice(-30);return {out:outputs.join('\n'),code:result.code};
 }
 function complete(s,line,pos=line.length){
 const c=ctx(s),before=line.slice(0,pos),start=Math.max(before.lastIndexOf(' '),before.lastIndexOf('|'),before.lastIndexOf(';'))+1,part=before.slice(start),prefix=before.slice(0,start),words=prefix.trim().split(/\s+/),cmd=words[0];let list=[];
 if(!prefix.trim()||/[|;]\s*$/.test(prefix))list=Object.keys(all);
 else if(cmd==='ssh'){const users=available(s).filter(h=>reachable(s,h)&&required(h)<=s.phase).flatMap(h=>Object.keys(h.users).flatMap(u=>[u+'@'+h.id,u+'@'+h.ip]));list=words.length===1?users:[];}
 else if(['ping','probe'].includes(cmd))list=available(s).flatMap(h=>[h.id,h.ip]);
 else if(cmd==='help'||cmd==='man')list=[...Object.keys(all),...Object.keys(manuals)];
 else if(cmd==='bus')list=words.length===1?['status','queue','calibrate','replay']:[];
 else if(cmd==='grid')list=words.length===1?['status','start','stop']:Object.keys(s.grid);
 else if(cmd==='service')list=words.length===1?['status','start']:['circulation'];
 else if(cmd==='transmit')list=['private','public'];
 else if(cmd==='mail')list=missions.slice(0,s.phase+1).map((_,i)=>String(i+1));
 else if(part.startsWith('-'))list=({ls:['-l','-a','-la'],grep:['-i','-n','-r','-v','-in'],head:['-n'],tail:['-n'],find:['-name','-type'],base64:['-d'],mkdir:['-p'],cut:['-d','-f'],wc:['-l','-w','-c'],sort:['-r'],uniq:['-c']})[cmd]||[];
 else {const slash=part.lastIndexOf('/'),base=slash>=0?part.slice(0,slash+1):'',stem=part.slice(slash+1),target=path(c,base||'.'),dd=dirs(s,c.host);list=[...new Set([...dd,...Object.keys(s.files[c.host])])].filter(p=>p!==target&&parent(p)===target&&basename(p).startsWith(stem)&&(cmd!=='cd'||dd.has(p))).map(p=>base+basename(p)+(dd.has(p)?'/':''));}
 list=[...new Set(list)].filter(x=>x.startsWith(part)).sort();let common=list[0]||part;for(const x of list)while(!x.startsWith(common))common=common.slice(0,-1);const replacement=list.length===1?list[0]+(list[0].endsWith('/')?'':' '):common;return {line:prefix+replacement+line.slice(pos),cursor:prefix.length+replacement.length,matches:list};
 }
 return {fresh,execute,view,complete};
})(world,missions);
export const {fresh,execute,view,complete}=engine;
