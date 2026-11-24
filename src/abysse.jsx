import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Terminal} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import {Network} from 'vis-network';
import {DataSet} from 'vis-data';
import {io} from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';
import './abysse.css';

const socket=io({autoConnect:false});
const esc='\x1b[';
const colors={green:esc+'38;5;114m',blue:esc+'38;5;109m',amber:esc+'38;5;179m',red:esc+'38;5;203m',dim:esc+'38;5;244m',reset:esc+'0m'};
let audio;
function sound(){if(audio){if(audio.state==='running'){void audio.suspend();return false;}void audio.resume();return true;}audio=new AudioContext();const g=audio.createGain();g.gain.value=.035;g.connect(audio.destination);for(const hz of [42,63,84]){const o=audio.createOscillator();o.type='sine';o.frequency.value=hz;o.connect(g);o.start();}return true;}
function chime(){if(audio?.state!=='running')return;const o=audio.createOscillator(),g=audio.createGain();o.frequency.setValueAtTime(820,audio.currentTime);o.frequency.exponentialRampToValueAtTime(410,audio.currentTime+.35);g.gain.setValueAtTime(.05,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.5);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.5);}
const clean=s=>String(s).replace(/[\x00-\x08\x0b-\x1f\x7f]/g,'');
function App(){
 const [state,setState]=useState(null),[online,setOnline]=useState(false),[audible,setAudible]=useState(false),[clock,setClock]=useState(new Date()),[mapVisible,setMapVisible]=useState(true);
 const termEl=useRef(null),mapEl=useRef(null),net=useRef(null),nodeData=useRef(new DataSet()),edgeData=useRef(new DataSet()),termRef=useRef(null),current=useRef(null);
 useEffect(()=>{const id=setInterval(()=>setClock(new Date()),1000);return()=>clearInterval(id);},[]);
 useEffect(()=>{
  const t=new Terminal({fontFamily:'Cascadia Code, Consolas, monospace',fontSize:14,lineHeight:1.18,cursorBlink:true,cursorStyle:'block',scrollback:6000,convertEol:true,theme:{background:'#080d10',foreground:'#c4d3d2',cursor:'#d2e9c7',selectionBackground:'#395455'}});
  termRef.current=t;const fit=new FitAddon();t.loadAddon(fit);t.open(termEl.current);fit.fit();const observer=new ResizeObserver(()=>{fit.fit();if(editor)renderEditor();});observer.observe(termEl.current);
  let disposed=false,id='',buffer='',pos=0,history=[],historyIndex=0,draft='',busy=true,tabKey='',renderedRows=1,renderedCursorRow=0,renderedCols=0,renderedCursorCol=0,editor=null;
  const set=s=>{current.current=s;setState(s);};
  const promptPlain=()=>{const s=current.current;if(!s)return 'local $ ';const home='/home/'+s.user;const cwd=s.cwd===home?'~':s.cwd.startsWith(home+'/')?'~'+s.cwd.slice(home.length):s.cwd;return s.user+'@'+s.at+':'+cwd+'$ ';};
  const promptStyled=()=>{const p=promptPlain(),k=p.indexOf(':');return k<0?p:colors.green+p.slice(0,k)+colors.reset+':'+colors.blue+p.slice(k+1,-2)+colors.reset+'$ ';};
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
   t.write(colors.blue+(editor.mode==='less'?'LESS':'NANO')+'  '+clean(editor.path).slice(0,width-18)+(editor.dirty?' *':'')+colors.reset);
   for(let i=0;i<height;i++){t.write(esc+(i+2)+';1H'+clean(lines[editor.top+i]||'').slice(editor.left,editor.left+width-1));}
   t.write(esc+(t.rows-1)+';1H'+colors.amber+clean(editor.message||('Ligne '+(editor.row+1)+' / '+lines.length)).slice(0,width-1)+colors.reset);
   t.write(esc+t.rows+';1H'+colors.dim+(editor.mode==='less'?'↑↓ PgUp PgDn  q Quitter':'^O Sauver  ^X Quitter  ↑↓←→ Naviguer').slice(0,width-1)+colors.reset);
   if(editor.mode!=='less')t.write(esc+(editor.row-editor.top+2)+';'+(editor.col-editor.left+1)+'H'+esc+'?25h');
  };
  const closeEditor=()=>{editor=null;t.write(esc+'?1049l'+esc+'?25h');done();};
  const saveEditor=()=>{if(!editor||editor.readOnly||busy)return;busy=true;socket.timeout(5000).emit('editor:save',{id,path:editor.path,data:editor.data},(err,r)=>{if(disposed||!editor)return;busy=false;editor.message=err||r?.error?r?.error||'Sauvegarde impossible':'Fichier enregistré';if(!err&&!r?.error)editor.dirty=false;renderEditor();});};
  const openEditor=line=>{busy=true;socket.timeout(5000).emit('editor:open',{id,line},(err,r)=>{if(disposed)return;busy=false;if(err||r?.error){print(r?.error||'Éditeur indisponible');done();return;}editor={...r,row:0,col:0,top:0,left:0,dirty:false,message:r.readOnly?'Lecture seule':'',confirm:false};t.write(esc+'?1049h');renderEditor();});};
  const editKey=data=>{
   if(!editor||busy)return;
   const lines=editorLines(),height=Math.max(1,t.rows-4),e=editor;
   const move=(row,col)=>{e.row=Math.max(0,Math.min(lines.length-1,row));e.col=Math.max(0,Math.min(lines[e.row].length,col));};
   if(e.mode==='less'){if(data==='q'||data==='\x03'){closeEditor();return;}if(data==='\x1b[A')move(e.row-1,0);else if(data==='\x1b[B'||data==='\r')move(e.row+1,0);else if(data==='\x1b[5~'||data==='b')move(e.row-height,0);else if(data==='\x1b[6~'||data===' ')move(e.row+height,0);else if(data==='g'){move(0,0);e.top=0;}else if(data==='G')move(lines.length-1,0);renderEditor();return;}
   if(e.confirm){if(data.toLowerCase()==='y'){closeEditor();return;}if(data.toLowerCase()==='n'||data==='\x03'){e.confirm=false;e.message='';renderEditor();}return;}
   if(data==='\x18'){if(e.dirty){e.confirm=true;e.message='Quitter sans enregistrer ? y/n';renderEditor();}else closeEditor();return;}
   if(data==='\x0f'){saveEditor();return;}
   if(data==='\x1b[A')move(e.row-1,e.col);else if(data==='\x1b[B')move(e.row+1,e.col);else if(data==='\x1b[D'){if(e.col)move(e.row,e.col-1);else if(e.row)move(e.row-1,lines[e.row-1].length);}else if(data==='\x1b[C'){if(e.col<lines[e.row].length)move(e.row,e.col+1);else if(e.row+1<lines.length)move(e.row+1,0);}else if(data==='\x01'||data==='\x1b[H')move(e.row,0);else if(data==='\x05'||data==='\x1b[F')move(e.row,lines[e.row].length);else if(data==='\x1b[5~')move(e.row-height,e.col);else if(data==='\x1b[6~')move(e.row+height,e.col);
   else if(!e.readOnly){const offset=lines.slice(0,e.row).reduce((n,l)=>n+l.length+1,0)+e.col;let next=e.data,at=offset;if(data==='\x7f'||data==='\x08'){if(offset){next=next.slice(0,offset-1)+next.slice(offset);at--;}}else if(data==='\x1b[3~')next=next.slice(0,offset)+next.slice(offset+1);else if(!data.includes('\x1b')){const insert=data.replace(/\r\n?/g,'\n').replace(/[\x00-\x08\x0b-\x1f\x7f]/g,'');next=next.slice(0,offset)+insert+next.slice(offset);at+=insert.length;}
    if(next!==e.data&&next.length<=20000){e.data=next;e.dirty=true;const before=next.slice(0,at).split('\n');e.row=before.length-1;e.col=before.at(-1).length;}}
   renderEditor();
  };
  const send=()=>{if(busy)return;atEnd();const line=buffer.trim();t.write('\r\n');buffer='';pos=0;tabKey='';if(!line){done();return;}
   history.push(line);historyIndex=history.length;draft='';
   if(/^(nano|less)\s+/.test(line)&&!/[|;&>]/.test(line)){openEditor(line);return;}
   if(line==='clear'){t.clear();t.write(esc+'2J'+esc+'H');done();return;}
   if(line==='sound'){const active=sound();setAudible(active);print('Ambiance '+(active?'activée':'désactivée'));done();return;}
   if(line==='map'){setMapVisible(v=>!v);done();return;}
   if(line==='reset'){print('Pour recommencer : reset --confirm');done();return;}
   if(line==='reset --confirm'){localStorage.removeItem('abysse-save-v2');location.reload();return;}
   if(line==='help'){print('COMMANDES DE CONSOLE\n  sound        ambiance sonore\n  map          afficher/masquer la carte\n  reset        nouvelle partie\n');}
   busy=true;socket.timeout(8000).emit('command',{id,line},(err,r)=>{if(disposed)return;if(err||r?.error){t.writeln(colors.red+(r?.error||'Connexion interrompue. Réessayez.')+colors.reset);done();return;}
    const old=current.current?.phase||0;if(r.out)t.writeln((r.code?colors.red:'')+clean(r.out)+colors.reset);set(r.state);
    if(r.state.phase>old){chime();t.writeln(colors.amber+'\n[ NOUVELLE TRANSMISSION / '+(r.state.ending?'MISSION TERMINEE':'mail '+(r.state.phase+1))+' ]'+colors.reset);}
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
   if(data==='\x17'){const n=buffer.slice(0,pos).replace(/\s*\S+\s*$/,'').length;buffer=buffer.slice(0,n)+buffer.slice(pos);pos=n;redraw();return;}
   if(data==='\x1b[A'||data==='\x1b[B'||data==='\x12'){if(historyIndex===history.length)draft=buffer;if(data==='\x12'){const p=history.slice(0,historyIndex).findLastIndex(x=>x.includes(buffer));if(p>=0)historyIndex=p;}else historyIndex=Math.max(0,Math.min(history.length,historyIndex+(data.endsWith('A')?-1:1)));buffer=history[historyIndex]??draft;pos=buffer.length;redraw();return;}
   if(data.includes('\x1b'))return;const safe=data.replace(/[\x00-\x1f\x7f]/g,' ');if(safe)append(safe);
  });
  t.attachCustomKeyEventHandler(e=>{if(e.type==='keydown'&&e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='c'){const x=t.getSelection();if(x)void navigator.clipboard?.writeText(x);return false;}return true;});
  const on=()=>setOnline(true),off=()=>setOnline(false);socket.on('connect',on);socket.on('disconnect',off);socket.connect();
  t.writeln(colors.dim+'ABYSS/OS 6.27.1  —  CONSOLE DE MAINTENANCE'+colors.reset);t.writeln('Initialisation de la liaison acoustique...');
  fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:localStorage.getItem('abysse-save-v2')})}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(r=>{if(disposed)return;id=r.id;localStorage.setItem('abysse-save-v2',id);set(r.state);history=r.state.history||[];historyIndex=history.length;print('Session restaurée.\n'+(r.state.ending?r.state.ending:'Tapez mail pour consulter vos messages, help pour les commandes.'));print('');done();t.focus();}).catch(()=>{if(!disposed)t.writeln(colors.red+'Impossible de joindre le serveur. Vérifiez npm run setup et relancez la page.'+colors.reset);});
  return()=>{disposed=true;observer.disconnect();sub.dispose();socket.off('connect',on);socket.off('disconnect',off);socket.disconnect();t.dispose();};
 },[]);
 useEffect(()=>{
  const n=new Network(mapEl.current,{nodes:nodeData.current,edges:edgeData.current},{layout:{randomSeed:19},nodes:{shape:'dot',size:10,font:{color:'#b8c4c8',face:'monospace',size:11},borderWidth:1},edges:{color:'#365057',width:1,smooth:false},physics:{solver:'barnesHut',barnesHut:{gravitationalConstant:-1400,springLength:100},stabilization:{iterations:80}},interaction:{dragNodes:false,dragView:true,zoomView:true,selectable:false,hover:false}});net.current=n;return()=>{n.destroy();net.current=null;};
 },[]);
 useEffect(()=>{if(!state||!net.current)return;nodeData.current.update(state.nodes.map(n=>({id:n.id,label:n.id+'\n'+n.ip,color:{background:n.id===state.at?'#d3e6b9':n.available?'#244f52':'#242b30',border:n.id===state.at?'#ebf4db':n.available?'#6dada6':'#777b7f'},size:n.id===state.at?13:9})));const edges=new Map();for(const n of state.nodes)for(const x of n.links){const id=[n.id,x].sort().join(':');edges.set(id,{id,from:n.id,to:x});}edgeData.current.update([...edges.values()]);},[state]);
 return <main className={'layout '+(!mapVisible?'nomap':'')}><header><div className="mark"><span className="symbol">◈</span><div><b>ABYSSE</b><small>DEEP LINK / OPERATOR CONSOLE</small></div></div><div className="telemetry"><span className={online?'live':'dead'}>● {online?'LINK ESTABLISHED':'LINK OFFLINE'}</span><span>{clock.toLocaleTimeString('fr-FR')}</span><span>FR / UTC+01</span></div></header><div className="subheader"><span>SESSION <b>{state?state.user+'@'+state.at:'—'}</b></span><span>SSH DEPTH <b>{Math.max(0,(state?.depth||1)-1)}</b></span><span>CHANNEL <b>27-A</b></span><span className="soundstatus">AUDIO <b>{audible?'ON':'OFF'}</b></span></div><div className="workspace"><section className="terminalPane"><div className="windowbar"><span className="indicator"/> <span>tty0 — {state?.at||'local'}</span><small>VT / INTERACTIVE</small></div><div className="terminal" ref={termEl}/><div className="keybar"><span>TAB COMPLETE</span><span>↑↓ HISTORY</span><span>CTRL+C CANCEL</span><span>CTRL+L CLEAR</span><span>HELP MANUAL</span></div></section><aside><section className="map"><div className="sectionTitle">01 / TOPOLOGIE <span>{state?.nodes.length||0} HOSTS</span></div><div className="mapCanvas" ref={mapEl}/><div className="legend"><i/> CURRENT <i/> KNOWN <i/> ISOLATED</div></section><section className="mission"><div className="sectionTitle">02 / TRANSMISSION <span>{state?.ending?'FIN':(state?.phase||0)+1+' / '+(state?.total||6)}</span></div><div className="missionBody"><div className="progress">{Array.from({length:state?.total||6},(_,i)=><i key={i} className={i<(state?.phase||0)?'complete':i===(state?.phase||0)?'current':''}/>)}</div><h2>{state?.ending?'Mission terminée':state?.mission||'En attente'}</h2><p>{state?.ending?'Transmission confirmée':state?.objective||'Synchronisation...'}</p><code>{state?.ending?'reset --confirm':'mail '+(state?.unread||1)}</code></div></section><section className="activity"><div className="sectionTitle">03 / JOURNAL SYSTEME</div><div className="activityBody">{[...(state?.activity||[])].reverse().slice(0,7).map((a,i)=><div key={i}><span>{a.host}</span><b>{a.command}</b><em className={a.code?'dead':'live'}>{a.code?'ERR':'OK'}</em></div>)}</div></section></aside></div><footer><span>SIMULATION ISOLEE / AUCUN ACCES AU RESEAU REEL</span><span>SAUVEGARDE AUTOMATIQUE</span></footer></main>;
}
createRoot(document.getElementById('root')).render(<App/>);
