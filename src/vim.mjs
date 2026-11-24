// Keyboard-only, isolated Vim-inspired editor. No host filesystem access.
export const previousWord=(value,pos)=>value.slice(0,pos).replace(/\S+\s*$|\s+$/,'').length;
export const initVim=e=>Object.assign(e,{vimMode:'NORMAL',ex:'',pending:'',count:'',undo:[],redo:[],register:null,search:'',savedData:e.data});
const lines=e=>e.data.split('\n');
const offset=e=>lines(e).slice(0,e.row).reduce((n,l)=>n+l.length+1,0)+e.col;
function move(e,row,col){const l=lines(e);e.row=Math.max(0,Math.min(l.length-1,row));e.col=Math.max(0,Math.min(col,Math.max(0,l[e.row].length-(e.vimMode==='INSERT'?0:1))));}
function jump(e,n){const a=e.data.slice(0,Math.max(0,Math.min(n,e.data.length))).split('\n');move(e,a.length-1,a.at(-1).length);}
const snap=e=>({data:e.data,row:e.row,col:e.col});
function restore(e,s){Object.assign(e,s);e.dirty=e.data!==e.savedData;move(e,e.row,e.col);}
function change(e,data,at,record=true){if(e.readOnly){e.message='E45: fichier en lecture seule';return;}if(data.length>20000){e.message='Quota dépassé';return;}if(data!==e.data){if(record){e.undo.push(snap(e));if(e.undo.length>100)e.undo.shift();}e.redo=[];e.data=data;e.dirty=data!==e.savedData;}jump(e,at);}
function insert(e,data){const p=offset(e);change(e,e.data.slice(0,p)+data+e.data.slice(p),p+data.length);}
function wordForward(s,p){const m=s.slice(p).match(/^(?:\w+|[^\w\s]+)?\s*/);return Math.min(s.length,p+Math.max(1,m?.[0].length||0));}
function wordBack(s,p){const m=s.slice(0,p).match(/(?:\w+|[^\w\s]+)\s*$/);return m?p-m[0].length:0;}
function wordEnd(s,p){const m=s.slice(p+1).match(/^\s*(?:\w+|[^\w\s]+)/);return m?Math.min(s.length-1,p+m[0].length):Math.max(0,s.length-1);}
function search(e,back=false){if(!e.search)return;const p=offset(e),s=e.data;let i=back?s.lastIndexOf(e.search,p-1):s.indexOf(e.search,p+1);if(i<0)i=back?s.lastIndexOf(e.search):s.indexOf(e.search);if(i>=0)jump(e,i);else e.message='E486: motif introuvable';}
export function vimKey(e,key){
 e.message='';
 if(e.vimMode==='COMMAND'||e.vimMode==='SEARCH'){
  if(key==='\x1b'||key==='\x03'){e.vimMode='NORMAL';e.ex='';return;}
  if(key==='\x7f'||key==='\x08'){e.ex=e.ex.slice(0,-1);return;}
  if(key==='\x17'||key==='\x1b\x7f'){e.ex=e.ex.slice(0,previousWord(e.ex,e.ex.length));return;}
  if(key==='\r'||key==='\n'){
   const mode=e.vimMode,cmd=e.ex.trim();e.vimMode='NORMAL';e.ex='';
   if(mode==='SEARCH'){if(cmd)e.search=cmd;search(e,e.searchBack);return;}
   if(/^\d+$/.test(cmd)){move(e,Number(cmd)-1,0);return;}
   if(cmd==='q'||cmd==='quit'){if(e.dirty){e.message='E37: modifications non enregistrées (:q! pour abandonner)';return;}return 'quit';}
   if(cmd==='q!')return 'quit';
   if(cmd==='w'||cmd==='write')return 'save';
   if(['wq','x','xit'].includes(cmd))return cmd!=='wq'&&!e.dirty?'quit':'savequit';
   if(cmd==='help'){e.message='i/a/o INSERT · Esc NORMAL · dd yy p u · /mot · :w :q :wq';return;}
   if(cmd)e.message='E492: commande inconnue : '+cmd;return;
  }
  if(!/[\x00-\x1f\x7f]/.test(key))e.ex+=key;return;
 }
 if(e.vimMode==='INSERT'){
  if(key==='\x1b'||key==='\x03'){e.vimMode='NORMAL';move(e,e.row,Math.max(0,e.col-1));return;}
  const p=offset(e);
  if(key==='\x7f'||key==='\x08'){if(p)change(e,e.data.slice(0,p-1)+e.data.slice(p),p-1);return;}
  if(key==='\x17'||key==='\x1b\x7f'){const n=previousWord(e.data,p);change(e,e.data.slice(0,n)+e.data.slice(p),n);return;}
  if(key==='\x1b[3~'){change(e,e.data.slice(0,p)+e.data.slice(p+1),p);return;}
  if(key==='\x1b[A')move(e,e.row-1,e.col);else if(key==='\x1b[B')move(e,e.row+1,e.col);else if(key==='\x1b[D')jump(e,p-1);else if(key==='\x1b[C')jump(e,p+1);else if(key==='\x1b[H')move(e,e.row,0);else if(key==='\x1b[F')move(e,e.row,lines(e)[e.row].length);else if(!key.includes('\x1b')){const s=key.replace(/\r\n?/g,'\n').replace(/[\x00-\x08\x0b-\x1f\x7f]/g,'');if(s)insert(e,s);}return;
 }
 if(key==='\x1b'||key==='\x03'){e.pending='';e.count='';return;}
 if(/^[1-9]$/.test(key)||key==='0'&&e.count){e.count=(e.count+key).slice(0,3);return;}
 const n=Math.min(200,Number(e.count)||1),p=offset(e),l=lines(e),line=l[e.row],base=p-e.col,prior=e.pending;
 e.count='';e.pending='';
 if(prior==='g'){if(key==='g')move(e,n-1,0);return;}
 if(prior==='d'||prior==='y'){
  if(key===prior){const end=Math.min(l.length,e.row+n),part=l.slice(e.row,end);e.register={data:part.join('\n'),line:true};if(prior==='d'){const next=[...l.slice(0,e.row),...l.slice(end)].join('\n');change(e,next,Math.min(base,next.length));}return;}
  let end=p;if(key==='w'){for(let i=0;i<n;i++)end=wordForward(e.data,end);}else if(key==='$')end=base+line.length;else if(key==='b'){for(let i=0;i<n;i++)end=wordBack(e.data,end);}else return;
  const a=Math.min(p,end),b=Math.max(p,end);e.register={data:e.data.slice(a,b),line:false};if(prior==='d')change(e,e.data.slice(0,a)+e.data.slice(b),a);return;
 }
 switch(key){
 case 'g':case 'd':case 'y':e.pending=key;e.count=n>1?String(n):'';return;
 case ':':e.vimMode='COMMAND';e.ex='';return;
 case '/':case '?':e.vimMode='SEARCH';e.ex='';e.searchBack=key==='?';return;
 case 'n':search(e,e.searchBack);return;
 case 'N':search(e,!e.searchBack);return;
 case 'h':case '\x1b[D':move(e,e.row,e.col-n);return;
 case 'l':case '\x1b[C':move(e,e.row,e.col+n);return;
 case 'j':case '\x1b[B':move(e,e.row+n,e.col);return;
 case 'k':case '\x1b[A':move(e,e.row-n,e.col);return;
 case '0':case '\x1b[H':move(e,e.row,0);return;
 case '^':move(e,e.row,line.search(/\S/)<0?0:line.search(/\S/));return;
 case '$':case '\x1b[F':move(e,e.row+n-1,lines(e)[Math.min(l.length-1,e.row+n-1)].length);return;
 case 'G':move(e,n===1?l.length-1:n-1,0);return;
 case 'w':{let q=p;for(let i=0;i<n;i++)q=wordForward(e.data,q);jump(e,q);return;}
 case 'b':{let q=p;for(let i=0;i<n;i++)q=wordBack(e.data,q);jump(e,q);return;}
 case 'e':{let q=p;for(let i=0;i<n;i++)q=wordEnd(e.data,q);jump(e,q);return;}
 case 'i':case 'I':case 'a':case 'A':case 'o':case 'O':
  if(e.readOnly){e.message='E45: fichier en lecture seule';return;}e.vimMode='INSERT';
  if(key==='I')move(e,e.row,Math.max(0,line.search(/\S/)));if(key==='a')move(e,e.row,e.col+(line.length?1:0));if(key==='A')move(e,e.row,line.length);
  if(key==='o'){const at=base+line.length;change(e,e.data.slice(0,at)+'\n'+e.data.slice(at),at+1);}
  if(key==='O'){change(e,e.data.slice(0,base)+'\n'+e.data.slice(base),base);}return;
 case 'x':{const end=Math.min(base+line.length,p+n);e.register={data:e.data.slice(p,end),line:false};change(e,e.data.slice(0,p)+e.data.slice(end),p);return;}
 case 'D':e.register={data:line.slice(e.col),line:false};change(e,e.data.slice(0,p)+e.data.slice(base+line.length),p);return;
 case 'p':case 'P':if(e.register){if(e.register.line){const at=e.row+(key==='p'?1:0),next=[...l.slice(0,at),...Array(n).fill(e.register.data),...l.slice(at)].join('\n');change(e,next,l.slice(0,at).reduce((x,y)=>x+y.length+1,0));}else{const at=key==='p'?Math.min(base+line.length,p+1):p;change(e,e.data.slice(0,at)+e.register.data.repeat(n)+e.data.slice(at),at);} }return;
 case 'u':if(e.undo.length){e.redo.push(snap(e));restore(e,e.undo.pop());}return;
 case '\x12':if(e.redo.length){e.undo.push(snap(e));restore(e,e.redo.pop());}return;
 case 'Z':if(prior==='Z')return e.dirty?'savequit':'quit';e.pending='Z';return;
 }
}
