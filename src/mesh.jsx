import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Terminal} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import {Network} from 'vis-network';
import {DataSet} from 'vis-data';
import {io} from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';
import './mesh.css';
import {automaticNodeColor,reconcileNodeColors,nodeColor,annotateNodeColor} from './map-colors.mjs';
import {initVim,vimKey,previousWord} from './vim.mjs';
import {themes,initialPrefs,normalizePrefs,loadPrefs,storePrefs,palette,movePanel,boundRect,defaultRect,terminalTheme,clamp,alpha} from './workspace.mjs';
import {WindowControls,WorkspaceSettings} from './workspace-ui.jsx';

const socket=io({autoConnect:false});
const esc='\x1b[';
const colors={green:esc+'38;5;114m',blue:esc+'38;5;109m',amber:esc+'38;5;179m',red:esc+'38;5;203m',dim:esc+'38;5;244m',reset:esc+'0m'};
let audio;
function sound(){if(audio){if(audio.state==='running'){void audio.suspend();return false;}void audio.resume();return true;}audio=new AudioContext();const g=audio.createGain();g.gain.value=.035;g.connect(audio.destination);for(const hz of [42,63,84]){const o=audio.createOscillator();o.type='sine';o.frequency.value=hz;o.connect(g);o.start();}return true;}
function chime(){if(audio?.state!=='running')return;const o=audio.createOscillator(),g=audio.createGain();o.frequency.setValueAtTime(820,audio.currentTime);o.frequency.exponentialRampToValueAtTime(410,audio.currentTime+.35);g.gain.setValueAtTime(.05,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.5);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.5);}
const clean=s=>String(s).replace(/[\x00-\x08\x0b-\x1f\x7f]/g,'');
function App(){
 const [state,setState]=useState(null),[online,setOnline]=useState(false),[audible,setAudible]=useState(false),[clock,setClock]=useState(new Date()),[mapVisible,setMapVisible]=useState(true),[mapFull,setMapFull]=useState(false),[chatOpen,setChatOpen]=useState(true),[contact,setContact]=useState('iris'),[message,setMessage]=useState(''),[chatBusy,setChatBusy]=useState(false),[pendingMessage,setPendingMessage]=useState(null),[chatError,setChatError]=useState(''),[prefs,setPrefs]=useState(loadPrefs),[settings,setSettings]=useState(false),[front,setFront]=useState(''),[prefError,setPrefError]=useState(''),[selectedNode,setSelectedNode]=useState(null),[nodeColors,setNodeColors]=useState({});
 const termEl=useRef(null),mapEl=useRef(null),net=useRef(null),nodeData=useRef(new DataSet()),edgeData=useRef(new DataSet()),termRef=useRef(null),current=useRef(null),sendChatRef=useRef(null),chatScroll=useRef(null),positions=useRef({}),nodeColorsRef=useRef({}),colorSave=useRef(null),workspaceRef=useRef(null),prefsRef=useRef(prefs);
 prefsRef.current=prefs;
 const updatePrefs=fn=>setPrefs(p=>normalizePrefs(typeof fn==='function'?fn(p):fn));
 const floatPanel=id=>{setFront(id);updatePrefs(p=>{const f={...p.floating};if(f[id])delete f[id];else f[id]=defaultRect(id);return {...p,floating:f,hidden:p.hidden.filter(x=>x!==id)};});};
 const hidePanel=id=>updatePrefs(p=>({...p,hidden:p.hidden.includes(id)?p.hidden.filter(x=>x!==id):[...p.hidden,id]}));
 const theme=palette(prefs),vars=Object.fromEntries(['base','panel','chrome','line','ink','muted','accent','green','blue','warn','map','terminal','foreground','selection'].map(k=>['--'+k,theme[k]]));
 vars['--terminal-bg']=alpha(theme.terminal,prefs.terminalOpacity);vars['--wallpaper']=prefs.wallpaper?'linear-gradient(#000'+Math.round(prefs.wallpaperDim*255/100).toString(16).padStart(2,'0')+',#000'+Math.round(prefs.wallpaperDim*255/100).toString(16).padStart(2,'0')+'),url("'+prefs.wallpaper+'")':'none';vars['--dock-width']=prefs.sideWidth+'%';
 const persistNodeColors=next=>{nodeColorsRef.current=next;setNodeColors(next);try{if(colorSave.current)localStorage.setItem('mesh-node-colors-v1:'+colorSave.current,JSON.stringify(next));}catch{}};
 const changeNodeColor=(color)=>{const s=current.current,n=s?.nodes.find(x=>x.id===selectedNode);if(!n)return;persistNodeColors(annotateNodeColor(nodeColorsRef.current,n,s.at,theme,color));};
 const panelClass=(id,base)=>base+(prefs.floating[id]?' floating':'')+(prefs.hidden.includes(id)?' panelHidden':'')+(front===id?' front':'');
 const panelStyle=id=>{const f=prefs.floating[id];return f?{left:f.x+'%',top:f.y+'%',width:f.w+'%',height:f.h+'%'}:{order:prefs.order.indexOf(id)};};
 const windowProps=id=>({id,prefs,workspaceRef,updatePrefs,floatPanel,hidePanel,setFront});
 useEffect(()=>{const t=termRef.current;if(t)t.options.theme=terminalTheme(prefs);},[theme.terminal,theme.foreground,theme.selection,prefs.terminalOpacity,prefs.theme]);
 useEffect(()=>{const timer=setTimeout(()=>{setPrefError(storePrefs(prefs)?'':'Stockage local saturé : les préférences ne seront pas conservées.');},180);return()=>clearTimeout(timer);},[prefs]);
 useEffect(()=>{const save=()=>storePrefs(prefsRef.current);window.addEventListener('pagehide',save);return()=>window.removeEventListener('pagehide',save);},[]);
 useEffect(()=>{const id=setInterval(()=>setClock(new Date()),1000);return()=>clearInterval(id);},[]);
 useEffect(()=>{
  const t=new Terminal({fontFamily:'Cascadia Code, Consolas, monospace',fontSize:14,lineHeight:1.18,cursorBlink:true,cursorStyle:'block',scrollback:6000,convertEol:true,allowTransparency:true,theme:terminalTheme(prefsRef.current)});
  termRef.current=t;const fit=new FitAddon();t.loadAddon(fit);t.open(termEl.current);fit.fit();const observer=new ResizeObserver(()=>{fit.fit();if(editor)renderEditor();});observer.observe(termEl.current);
  let disposed=false,id='',buffer='',pos=0,history=[],historyIndex=0,draft='',busy=true,tabKey='',renderedRows=1,renderedCursorRow=0,renderedCols=0,renderedCursorCol=0,editor=null;
  const set=s=>{current.current=s;setState(s);};
  sendChatRef.current=(who,body,callback)=>{if(!id||!socket.connected){callback('Canal hors ligne.');return;}socket.timeout(115000).emit('dialogue',{id,contact:who,body},(err,r)=>{if(disposed)return;if(err||r?.error){callback(r?.error||'Transmission interrompue');return;}set(r.state);callback(null,r.source);});};
  const promptPlain=()=>{const s=current.current;if(!s)return 'local $ ';const home='/home/'+s.user;const cwd=s.cwd===home?'~':s.cwd.startsWith(home+'/')?'~'+s.cwd.slice(home.length):s.cwd;return s.user+'@'+s.at+':'+cwd+'$ ';};
  const promptStyled=()=>{const p=promptPlain(),k=p.indexOf(':'),pref=prefsRef.current,pal=palette(pref);const rgb=hex=>esc+'38;2;'+[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(';')+'m';const green=pref.theme==='graphite'&&!pref.custom.green?colors.green:rgb(pal.green),blue=pref.theme==='graphite'&&!pref.custom.blue?colors.blue:rgb(pal.blue);return k<0?p:green+p.slice(0,k)+colors.reset+':'+blue+p.slice(k+1,-2)+colors.reset+'$ ';};
  const print=s=>{if(s)t.writeln(clean(s));};
  const place=()=>{const cols=Math.max(10,t.cols),length=promptPlain().length+buffer.length,index=promptPlain().length+pos;renderedCols=cols;renderedRows=Math.floor(length/cols)+1;renderedCursorRow=Math.floor(index/cols);renderedCursorCol=index%cols;const endRow=Math.floor(length/cols);const extra=endRow-renderedCursorRow;if(extra>0)t.write(esc+extra+'A');t.write('\r');if(renderedCursorCol)t.write(esc+renderedCursorCol+'C');};
  const freshPrompt=()=>{t.write(promptStyled()+buffer);place();};
  const redraw=()=>{t.write('\r');if(renderedCursorRow)t.write(esc+renderedCursorRow+'A');for(let i=0;i<renderedRows;i++){t.write(esc+'2K');if(i<renderedRows-1)t.write(esc+'1B\r');}if(renderedRows>1)t.write(esc+(renderedRows-1)+'A');t.write('\r'+promptStyled()+buffer);place();};
  const atEnd=()=>{pos=buffer.length;redraw();};
  const append=(str)=>{buffer=(buffer.slice(0,pos)+str+buffer.slice(pos)).slice(0,500);pos=Math.min(buffer.length,pos+str.length);redraw();};
  const done=()=>{busy=false;buffer='';pos=0;tabKey='';freshPrompt();};
  const editorLines=()=>editor.data.split('\n');
  const renderEditor=()=>{
   if(!editor)return;const lines=editorLines(),height=Math.max(1,t.rows-4),width=Math.max(10,t.cols);
   if(editor.row<editor.top)editor.top=editor.row;if(editor.row>=editor.top+height)editor.top=editor.row-height+1;
   if(editor.col<editor.left)editor.left=editor.col;if(editor.col>=editor.left+width-1)editor.left=editor.col-width+2;
   t.write(esc+'?25l'+esc+'2J'+esc+'H');
   t.write(colors.blue+(editor.mode==='less'?'LESS':editor.mode==='vim'?'VIM':'NANO')+'  '+clean(editor.path).slice(0,width-18)+(editor.dirty?' *':'')+colors.reset);
   for(let i=0;i<height;i++){t.write(esc+(i+2)+';1H'+clean(lines[editor.top+i]||'').slice(editor.left,editor.left+width-1));}
   t.write(esc+(t.rows-1)+';1H'+colors.amber+clean(editor.mode==='vim'&&['COMMAND','SEARCH'].includes(editor.vimMode)?(editor.vimMode==='COMMAND'?':':editor.searchBack?'?':'/')+editor.ex:editor.message||(editor.mode==='vim'?'-- '+editor.vimMode+' --  ':'')+('Ligne '+(editor.row+1)+' / '+lines.length)).slice(0,width-1)+colors.reset);
   t.write(esc+t.rows+';1H'+colors.dim+(editor.mode==='less'?'↑↓ PgUp PgDn  q Quitter':editor.mode==='vim'?'i INSERT   Esc NORMAL   :w :q :wq   :help':'^O Sauver  ^X Quitter  ↑↓←→ Naviguer').slice(0,width-1)+colors.reset);
   if(editor.mode!=='less')t.write(esc+(editor.row-editor.top+2)+';'+(editor.col-editor.left+1)+'H'+esc+'?25h');
  };
  const closeEditor=()=>{editor=null;t.write(esc+'?1049l'+esc+'?25h');done();};
  const saveEditor=(quit=false)=>{if(!editor||busy)return;if(editor.readOnly){editor.message='E45: fichier en lecture seule';renderEditor();return;}busy=true;socket.timeout(5000).emit('editor:save',{id,path:editor.path,data:editor.data},(err,r)=>{if(disposed||!editor)return;busy=false;editor.message=err||r?.error?r?.error||'Sauvegarde impossible':'Fichier enregistré';if(!err&&!r?.error){editor.dirty=false;editor.savedData=editor.data;if(quit){closeEditor();return;}}renderEditor();});};
  const openEditor=line=>{busy=true;socket.timeout(5000).emit('editor:open',{id,line},(err,r)=>{if(disposed)return;busy=false;if(err||r?.error){print(r?.error||'Éditeur indisponible');done();return;}editor={...r,row:0,col:0,top:0,left:0,dirty:false,message:r.readOnly?'Lecture seule':'',confirm:false};if(editor.mode==='vim')initVim(editor);t.write(esc+'?1049h');renderEditor();});};
  const editKey=data=>{
   if(!editor||busy)return;
   if(editor.mode==='vim'){const action=vimKey(editor,data);if(action==='quit')closeEditor();else if(action==='save'||action==='savequit')saveEditor(action==='savequit');else renderEditor();return;}
   const lines=editorLines(),height=Math.max(1,t.rows-4),e=editor;
   const move=(row,col)=>{e.row=Math.max(0,Math.min(lines.length-1,row));e.col=Math.max(0,Math.min(lines[e.row].length,col));};
   if(e.mode==='less'){if(data==='q'||data==='\x03'){closeEditor();return;}if(data==='\x1b[A')move(e.row-1,0);else if(data==='\x1b[B'||data==='\r')move(e.row+1,0);else if(data==='\x1b[5~'||data==='b')move(e.row-height,0);else if(data==='\x1b[6~'||data===' ')move(e.row+height,0);else if(data==='g'){move(0,0);e.top=0;}else if(data==='G')move(lines.length-1,0);renderEditor();return;}
   if(e.confirm){if(data.toLowerCase()==='y'){closeEditor();return;}if(data.toLowerCase()==='n'||data==='\x03'){e.confirm=false;e.message='';renderEditor();}return;}
   if(data==='\x18'){if(e.dirty){e.confirm=true;e.message='Quitter sans enregistrer ? y/n';renderEditor();}else closeEditor();return;}
   if(data==='\x0f'){saveEditor();return;}
   if(data==='\x1b[A')move(e.row-1,e.col);else if(data==='\x1b[B')move(e.row+1,e.col);else if(data==='\x1b[D'){if(e.col)move(e.row,e.col-1);else if(e.row)move(e.row-1,lines[e.row-1].length);}else if(data==='\x1b[C'){if(e.col<lines[e.row].length)move(e.row,e.col+1);else if(e.row+1<lines.length)move(e.row+1,0);}else if(data==='\x01'||data==='\x1b[H')move(e.row,0);else if(data==='\x05'||data==='\x1b[F')move(e.row,lines[e.row].length);else if(data==='\x1b[5~')move(e.row-height,e.col);else if(data==='\x1b[6~')move(e.row+height,e.col);
   else if(!e.readOnly){const offset=lines.slice(0,e.row).reduce((n,l)=>n+l.length+1,0)+e.col;let next=e.data,at=offset;if(data==='\x7f'||data==='\x08'){if(offset){next=next.slice(0,offset-1)+next.slice(offset);at--;}}else if(data==='\x17'){at=previousWord(next,offset);next=next.slice(0,at)+next.slice(offset);}else if(data==='\x1b[3~')next=next.slice(0,offset)+next.slice(offset+1);else if(!data.includes('\x1b')){const insert=data.replace(/\r\n?/g,'\n').replace(/[\x00-\x08\x0b-\x1f\x7f]/g,'');next=next.slice(0,offset)+insert+next.slice(offset);at+=insert.length;}
    if(next!==e.data&&next.length<=20000){e.data=next;e.dirty=true;const before=next.slice(0,at).split('\n');e.row=before.length-1;e.col=before.at(-1).length;}}
   renderEditor();
  };
  const send=()=>{if(busy)return;atEnd();const line=buffer.trim();t.write('\r\n');buffer='';pos=0;tabKey='';if(!line){done();return;}
   history.push(line);historyIndex=history.length;draft='';
   if(/^(vim|vi|nano|less)\s+/.test(line)&&!/[|;&>]/.test(line)){openEditor(line);return;}
   if(line==='clear'){t.clear();t.write(esc+'2J'+esc+'H');done();return;}
   if(line==='sound'){const active=sound();setAudible(active);print('Ambiance '+(active?'activée':'désactivée'));done();return;}
   if(line==='chat open'){setChatOpen(v=>!v);done();return;}
   if(line==='workspace'){setSettings(v=>!v);done();return;}
   if(line==='theme'){print('Thèmes : '+Object.keys(themes).join(', '));done();return;}
   if(line.startsWith('theme ')){const key=line.slice(6).trim().toLowerCase();if(Object.hasOwn(themes,key)){updatePrefs(p=>({...p,theme:key,custom:{}}));print('Thème : '+themes[key].label);}else print('Thème inconnu. Tape theme.');done();return;}
   if(line.startsWith('popup ')){const key=line.slice(6).trim();if(['terminal','map','chat','resources','defense'].includes(key)){if(key==='chat')setChatOpen(true);setMapVisible(true);floatPanel(key);}else print('popup terminal|map|chat|resources|defense');done();return;}
   if(line==='map layout'){positions.current={};try{localStorage.removeItem('mesh-layout-v3:'+id);}catch{};const nodes=current.current?.nodes||[],zones=['EDGE','INNER','AUDIT'];for(const node of nodes){const i=nodes.filter(n=>n.zone===node.zone).findIndex(n=>n.id===node.id),col=zones.indexOf(node.zone);net.current?.moveNode(node.id,col*290+(i%2)*110,Math.floor(i/2)*100);}net.current?.fit({animation:false});done();return;}
   if(line==='map'){setMapFull(false);setMapVisible(v=>!v);done();return;}
   if(line==='map full'){setMapVisible(true);floatPanel('map');done();return;}
   if(line==='map reset'){net.current?.fit({animation:false});done();return;}
   if(line==='reset'){print('Pour recommencer : reset --confirm');done();return;}
   if(line==='reset --confirm'){localStorage.removeItem('mesh-save-v3');location.reload();return;}
   if(line==='help'){print('COMMANDES DE CONSOLE\n  sound        ambiance sonore\n  map          afficher/masquer la carte\n  map full     agrandir/reduire la carte\n  map reset    recentrer la carte\n  map layout   restaurer les positions\n  chat open   afficher/masquer la messagerie\n  workspace   personnaliser le bureau\n  theme [nom] choisir un thème\n  popup <nom> détacher une fenêtre\n  reset        nouvelle partie\n');}
   busy=true;socket.timeout(/^talk\s/i.test(line)?115000:8000).emit('command',{id,line},(err,r)=>{if(disposed)return;if(err||r?.error){t.writeln(colors.red+(r?.error||'Connexion interrompue. Réessayez.')+colors.reset);done();return;}
    const old=current.current?.phase||0,oldSeq=current.current?.story?.messages?.at(-1)?.id||0;if(r.out)t.writeln((r.code?colors.red:'')+clean(r.out)+colors.reset);if(r.source==='offline')t.writeln(colors.dim+'[ Modèle local indisponible : vérifie Ollama. ]'+colors.reset);set(r.state);
    if((r.state.story?.messages?.at(-1)?.id||0)>oldSeq){chime();t.writeln(colors.dim+'\n[ Nouveau message · messagerie / chat ]'+colors.reset);}
    if(r.state.ending&&r.state.phase>old)t.writeln(colors.green+'\nFIN DE LA MISSION.\nMerci d’avoir joué.\n'+colors.reset);
    done();
   });
  };
  const tab=()=>{if(busy)return;const prior=buffer,priorPos=pos,key=prior+'@'+priorPos;busy=true;socket.timeout(4000).emit('complete',{id,line:buffer,pos},(err,r)=>{if(disposed)return;busy=false;if(err||r?.error)return;if(r.line!==prior){buffer=r.line;pos=r.cursor;redraw();tabKey=buffer+'@'+pos;}else if(r.matches.length>1){if(tabKey===key){atEnd();t.write('\r\n');const width=Math.min(44,Math.max(...r.matches.map(x=>x.length))+2),count=Math.max(1,Math.floor(t.cols/width));for(let i=0;i<r.matches.length;i+=count)t.writeln(r.matches.slice(i,i+count).map(x=>x.padEnd(width)).join(''));pos=priorPos;freshPrompt();}tabKey=key;}else t.write('\x07');});};
  const sub=t.onData(data=>{if(editor){editKey(data);return;}if(busy)return;const move=(n)=>{pos=Math.max(0,Math.min(buffer.length,n));redraw();};
   if(data==='\t'){tab();return;}tabKey='';
   if(data==='\r'||data==='\n'){send();return;}
   if(data==='\x04'&&!buffer){buffer='exit';pos=buffer.length;redraw();send();return;}
   if(data==='\x03'){atEnd();t.writeln('^C');done();return;}
   if(data==='\x0c'){t.clear();t.write(esc+'2J'+esc+'H');freshPrompt();return;}
   if(data==='\x01'||data==='\x1b[H'||data==='\x1b[1~'){move(0);return;}
   if(data==='\x05'||data==='\x1b[F'||data==='\x1b[4~'){move(buffer.length);return;}
   if(data==='\x1b[D'){move(pos-1);return;}if(data==='\x1b[C'){move(pos+1);return;}
   if(data==='\x1b[1;5D'){move(buffer.slice(0,pos).replace(/\s*\S+\s*$/,'').length);return;}
   if(data==='\x1b[1;5C'){move(pos+(buffer.slice(pos).match(/^\s*\S+\s*/)?.[0].length||1));return;}
   if(data==='\x7f'||data==='\x08'){if(pos){buffer=buffer.slice(0,pos-1)+buffer.slice(pos);pos--;redraw();}return;}
   if(data==='\x1b[3~'){buffer=buffer.slice(0,pos)+buffer.slice(pos+1);redraw();return;}
   if(data==='\x15'){buffer=buffer.slice(pos);pos=0;redraw();return;}
   if(data==='\x0b'){buffer=buffer.slice(0,pos);redraw();return;}
   if(data==='\x17'||data==='\x1b\x7f'){const n=previousWord(buffer,pos);buffer=buffer.slice(0,n)+buffer.slice(pos);pos=n;redraw();return;}
   if(data==='\x1b[A'||data==='\x1b[B'||data==='\x12'){if(historyIndex===history.length)draft=buffer;if(data==='\x12'){const p=history.slice(0,historyIndex).findLastIndex(x=>x.includes(buffer));if(p>=0)historyIndex=p;}else historyIndex=Math.max(0,Math.min(history.length,historyIndex+(data.endsWith('A')?-1:1)));buffer=history[historyIndex]??draft;pos=buffer.length;redraw();return;}
   if(data.includes('\x1b'))return;const safe=data.replace(/[\x00-\x1f\x7f]/g,' ');if(safe)append(safe);
  });
  t.attachCustomKeyEventHandler(e=>{if(e.type==='keydown'&&e.ctrlKey&&!e.altKey&&e.key==='Backspace'){e.preventDefault();if(!busy){if(editor){editKey('\x17');}else{const n=previousWord(buffer,pos);buffer=buffer.slice(0,n)+buffer.slice(pos);pos=n;tabKey='';redraw();}}return false;}if(e.type==='keydown'&&e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='c'){const x=t.getSelection();if(x)void navigator.clipboard?.writeText(x);return false;}return true;});
  const on=()=>setOnline(true),off=()=>setOnline(false);socket.on('connect',on);socket.on('disconnect',off);socket.connect();
  t.writeln(colors.dim+'MESH/OS 3.8 · operator workspace'+colors.reset);t.writeln('Connecting to session store…');
  fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:localStorage.getItem('mesh-save-v3')})}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(r=>{if(disposed)return;id=r.id;localStorage.setItem('mesh-save-v3',id);colorSave.current=id;let savedColors={};try{savedColors=JSON.parse(localStorage.getItem('mesh-node-colors-v1:'+id)||'{}')||{};}catch{}nodeColorsRef.current=savedColors;setNodeColors(savedColors);set(r.state);history=r.state.history||[];historyIndex=history.length;print('Session restaurée.\n'+(r.state.ending?r.state.ending:'Canal sécurisé disponible. Tapez chat pour consulter les messages, help pour les commandes.'));print('');done();t.focus();}).catch(()=>{if(!disposed)t.writeln(colors.red+'Impossible de joindre le serveur. Vérifiez npm run setup et relancez la page.'+colors.reset);});
  return()=>{disposed=true;observer.disconnect();sub.dispose();socket.off('connect',on);socket.off('disconnect',off);socket.disconnect();t.dispose();};
 },[]);
 useEffect(()=>{
  const n=new Network(mapEl.current,{nodes:nodeData.current,edges:edgeData.current},{layout:{randomSeed:41},nodes:{shape:'dot',size:8,font:{color:'#c7c9d2',face:'monospace',size:11},borderWidth:1},edges:{color:'#4b4d57',width:1,smooth:{type:'continuous'}},physics:false,interaction:{dragNodes:true,dragView:true,zoomView:true,selectable:true,hover:false}});net.current=n;try{positions.current=JSON.parse(localStorage.getItem('mesh-layout-v3:'+localStorage.getItem('mesh-save-v3'))||'{}');}catch{};n.on('click',p=>setSelectedNode(p.nodes[0]??null));n.on('oncontext',p=>{p.event.preventDefault();const id=n.getNodeAt(p.pointer.DOM);if(id){n.selectNodes([id]);setSelectedNode(id);}else setSelectedNode(null);});n.on('dragEnd',p=>{if(!p.nodes.length)return;Object.assign(positions.current,n.getPositions(p.nodes));try{localStorage.setItem('mesh-layout-v3:'+localStorage.getItem('mesh-save-v3'),JSON.stringify(positions.current));}catch{}});return()=>{n.destroy();net.current=null;};
 },[]);
 const mapSignature=useRef('');
 useEffect(()=>{if(!state||!net.current)return;
  const zones=['EDGE','INNER','AUDIT'],columns={};for(const z of zones)columns[z]=state.nodes.filter(n=>n.zone===z);
  const validColors=reconcileNodeColors(nodeColorsRef.current,state.nodes,state.at,theme);if(JSON.stringify(validColors)!==JSON.stringify(nodeColorsRef.current))persistNodeColors(validColors);
  const newNodes=state.nodes.map(n=>{const i=columns[n.zone].findIndex(x=>x.id===n.id),col=zones.indexOf(n.zone);return {id:n.id,label:n.id+'\n'+n.ip,x:positions.current[n.id]?.x??col*290+(i%2)*110,y:positions.current[n.id]?.y??Math.floor(i/2)*100,physics:false,fixed:{x:false,y:false},color:nodeColor(n,state.at,theme,validColors),size:n.id===state.at?11:8};});
  nodeData.current.update(newNodes);const edges=new Map();for(const n of state.nodes)for(const x of n.links){const id=[n.id,x].sort().join(':');edges.set(id,{id,from:n.id,to:x});}edgeData.current.update([...edges.values()]);
  const sig=state.nodes.map(n=>n.id).join(',');if(sig!==mapSignature.current){mapSignature.current=sig;net.current.fit({animation:false});}
 },[state,nodeColors,theme.accent,theme.green,theme.blue,theme.muted,theme.line,theme.ink]);
 useEffect(()=>{const n=net.current;if(n)n.setOptions({nodes:{font:{color:theme.ink}},edges:{color:theme.line}});},[theme.ink,theme.line]);
 const memory=state?.ram||{used:0,total:8,hosts:[]};
 const hosts=state?.nodes||[],selectedHost=hosts.find(n=>n.id===selectedNode),selectedColor=selectedHost?nodeColor(selectedHost,state.at,theme,nodeColors).background:'#777777';
 const dockVisible=(!prefs.hidden.includes('chat')&&chatOpen&&!prefs.floating.chat)||(!prefs.hidden.includes('map')&&!prefs.floating.map)||(!prefs.hidden.includes('resources')&&!prefs.floating.resources)||(['pending','active','failed'].includes(state?.story?.battle?.state)&&!prefs.floating.defense);
 const messages=(state?.story?.messages||[]).filter(m=>m.contact===contact),contacts=state?.story?.contacts||['iris'],battle=state?.story?.battle;
 const sendMessage=e=>{e.preventDefault();if(!message.trim()||chatBusy)return;const body=message.trim(),who=contact;setChatBusy(true);setPendingMessage({contact:who,body});setMessage('');setChatError('');sendChatRef.current?.(who,body,(err,source)=>{setChatBusy(false);setPendingMessage(null);if(err){setChatError(err);setMessage(v=>v||body);}else if(source==='offline')setChatError('Modèle local indisponible — vérifie Ollama et le modèle installé.');else if(source==='delivery_error')setChatError('Message reçu, mais réponse non délivrée. Consulte les logs [npc] du serveur.');});};
 useEffect(()=>{if(chatScroll.current)chatScroll.current.scrollTop=chatScroll.current.scrollHeight;},[state?.story?.messages,contact,chatOpen,pendingMessage]);
 useEffect(()=>{if(mapVisible)net.current?.fit({animation:false});},[mapVisible,mapFull]);
 return <main style={vars} className={'layout '+(!mapVisible?'nomap ':'')+(prefs.side==='left'?'dockLeft ':'')+(prefs.floating.terminal?'terminalFloating ':'')+(prefs.wallpaper?'hasWallpaper ':'')+(!dockVisible?'emptyDock':'')}>
  <header className="appbar">
   <div className="brand"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 5h5v14H3zM10 5h4v9h-4zM16 5h5v14h-5z" fill="currentColor"/></svg><b>mesh</b><span className="version">3.8</span></div>
   <div className="crumb"><span>Workspace</span><span className="slash">/</span><b>{state?.at||'desk'}</b></div>
   <div className="appmeta"><button className="chatToggle" onClick={()=>{setChatOpen(v=>!v);updatePrefs(p=>({...p,hidden:p.hidden.filter(x=>x!=='chat')}));}} aria-pressed={chatOpen}>Messages</button><button className="chatToggle" onClick={()=>setSettings(v=>!v)} aria-pressed={settings}>⚙ Bureau</button><span className={online?'connection online':'connection'}><i/>{online?'Connected':'Offline'}</span><span>{clock.toLocaleTimeString('fr-FR')}</span></div>
  </header>
  <div className="workspace" ref={workspaceRef}>
   <section className={panelClass("terminal","terminalPane")} style={panelStyle("terminal")} onPointerDown={()=>setFront("terminal")}>
    <WindowControls {...windowProps("terminal")} title="›_ Terminal" detail={state?.cwd||"~"}/>
    <div className="terminal" ref={termEl}/>
    <div className="keybar"><span><kbd>Tab</kbd> Complete</span><span><kbd>↑ ↓</kbd> History</span><span><kbd>Ctrl ⌫</kbd> Word</span><span><kbd>Ctrl L</kbd> Clear</span><span><kbd>man shell</kbd> Reference</span></div>
    <WindowControls {...windowProps("terminal")} resize/>
   </section>
   <aside className={"inspector "+(chatOpen?"hasChat":"")+(battle&&["pending","active","failed"].includes(battle.state)?" hasBattle":"")}>
    <section className={panelClass("chat","chatPanel")+(!chatOpen?" panelHidden":"")} style={panelStyle("chat")} onPointerDown={()=>setFront("chat")}><WindowControls {...windowProps("chat")} title="Messages" detail="Canal sécurisé"/><div className="contacts">{contacts.map(c=><button key={c} className={contact===c?'chosen':''} onClick={()=>setContact(c)}><span className={'contactDot '+c}/>{c==='iris'?'Iris':'Mara'}</button>)}</div><div className="chatHistory" ref={chatScroll}>{messages.map(m=><article className={m.author==='operator'?'outgoing':'incoming'} key={m.id}><small>{m.author==='operator'?'Vous':m.author==='iris'?'Iris':m.author==='mara'?'Mara':'MESH'}</small><p>{m.body}</p></article>)}{pendingMessage?.contact===contact&&<>{!messages.some(m=>m.author==='operator'&&m.body===pendingMessage.body&&m.id===messages.at(-1)?.id)&&<article className="outgoing"><small>Vous</small><p>{pendingMessage.body}</p></article>}<small className="typing">Transmission<span>…</span></small></>}</div><form className="chatCompose" onSubmit={sendMessage}><input aria-label="Message" placeholder="Écrire un message…" value={message} maxLength={500} onChange={e=>setMessage(e.target.value)}/><button type="submit" disabled={chatBusy||!message.trim()}>Envoyer</button></form>{chatError&&<small className="chatError">{chatError}</small>}<WindowControls {...windowProps("chat")} resize/></section>
    {battle&&['pending','active','failed'].includes(battle.state)&&<section className={panelClass("defense","defensePanel")} style={panelStyle("defense")} onPointerDown={()=>setFront("defense")}><WindowControls {...windowProps("defense")} title="Incident réseau" detail={battle.state==="active"?"En cours":"En attente"}/><div className="defenseBody"><p>{battle.last||'Activité hostile détectée. Canal de défense disponible.'}</p>{battle.state==='active'&&<><div className="resourceRow"><span>Intégrité</span><b>{battle.integrity}%</b></div><div className="meter trace"><i style={{width:battle.integrity+'%'}}/></div>{battle.mode==='live'&&<div className="resourceRow"><span>Temps restant</span><b>{Math.max(0,Math.ceil((battle.deadline-clock.getTime())/1000))} s</b></div>}</>}<code>{battle.state==='active'?'defense inspect':'defense status'}</code></div><WindowControls {...windowProps("defense")} resize/></section>}
    <section className={panelClass("map","map")} style={panelStyle("map")} onPointerDown={()=>setFront("map")}><WindowControls {...windowProps("map")} title="Network" detail={hosts.length+" hosts"}/><div className="zones">{['EDGE','INNER','AUDIT'].map(z=><span key={z} className={state?.routes?.includes(z)?'zone active':'zone'}><i/>{z.toLowerCase()}</span>)}</div><div className="mapCanvas" ref={mapEl}/>{selectedHost&&<div className="nodeColorBar"><span title={selectedHost.id}>{selectedHost.id}</span><label title="Couleur personnalisée, jusqu'au prochain changement automatique">Couleur <input type="color" aria-label={'Couleur de '+selectedHost.id} value={/^#[0-9a-f]{6}$/i.test(selectedColor)?selectedColor:'#777777'} onChange={e=>changeNodeColor(e.target.value)}/></label><button type="button" disabled={!nodeColors[selectedHost.id]} onClick={()=>changeNodeColor(null)}>Auto</button><button type="button" aria-label="Fermer la sélection" onClick={()=>{setSelectedNode(null);net.current?.unselectAll();}}>×</button></div>}<div className="legend"><span><i className="currentNode"/> Current</span><span><i className="knownNode"/> Known</span><span><i className="proxyNode"/> Relay</span></div><WindowControls {...windowProps("map")} resize/></section>
    <section className={panelClass("resources","resources")} style={panelStyle("resources")} onPointerDown={()=>setFront("resources")}><WindowControls {...windowProps("resources")} title="Resources" detail={(state?.jobs?.length||0)+" jobs"}/><div className="resourceBody"><div className="resourceRow"><span>Memory</span><b>{memory.used} <small>/ {memory.total} MiB</small></b></div><div className="meter"><i style={{width:100*memory.used/Math.max(1,memory.total)+'%'}}/></div><div className="resourceRow"><span>Observation</span><b>{state?.trace||0}<small>%</small></b></div><div className="meter trace"><i style={{width:(state?.trace||0)+'%'}}/></div>{state?.jobs?.length>0&&<div className="joblist">{state.jobs.map(j=><div key={j.id}><code>#{j.id}</code><span>{j.type} / {j.target}</span><small>{j.state}</small></div>)}</div>}</div><WindowControls {...windowProps("resources")} resize/></section>

   </aside>
   {settings&&<WorkspaceSettings prefError={prefError} prefs={prefs} updatePrefs={updatePrefs} close={()=>setSettings(false)} reset={()=>{updatePrefs(p=>({...p,side:"right",sideWidth:33,order:initialPrefs().order,floating:{},hidden:[]}));setChatOpen(true);setMapVisible(true);}} showChat={()=>{setChatOpen(true);setMapVisible(true);}}/>}
  </div>
  <footer><div><span className="statusDot"/>{online?'Session active':'Disconnected'}<span className="separator"/>Local simulation</div><div><span>{audible?'Audio on':'Audio off'}</span><span className="separator"/>Auto-save<span className="separator"/><span>{state?.depth||1} sessions</span></div></footer>
 </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
