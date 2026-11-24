// Local workspace preferences. No game state or external resources are modified.
export const themes={
 graphite:{label:'Graphite',description:'Le thème original.',base:'#191b20',panel:'#202228',chrome:'#25272e',line:'#32343c',ink:'#e1e2e9',muted:'#9295a1',accent:'#aaa5d8',green:'#86bd9c',blue:'#83afc1',warn:'#d5ad78',map:'#1c1e23',terminal:'#191b20',foreground:'#d2d4db',selection:'#454d6b'},
 aubergine:{label:'Aubergine',description:'Violet profond, console chaleureuse.',base:'#251b2b',panel:'#2e2335',chrome:'#382940',line:'#4b3954',ink:'#f0e6ef',muted:'#b5a3bb',accent:'#d4a5e7',green:'#9bcf9a',blue:'#a6b8f1',warn:'#e6b075',map:'#281e30',terminal:'#2b1930',foreground:'#f0e6ef',selection:'#59415f'},
 phosphor:{label:'Phosphor',description:'Monochrome vert, esprit CRT.',base:'#101a15',panel:'#15231b',chrome:'#1d2d23',line:'#30483a',ink:'#c6efce',muted:'#89aa90',accent:'#86d696',green:'#a4f0aa',blue:'#91c8b2',warn:'#e3c989',map:'#101d17',terminal:'#0d1710',foreground:'#bce8c1',selection:'#34543b'},
 midnight:{label:'Midnight',description:'Bleu nuit et acier froid.',base:'#121a29',panel:'#192436',chrome:'#202e44',line:'#32435c',ink:'#dbe8fa',muted:'#94a6bf',accent:'#8ab8ed',green:'#85d0b8',blue:'#a6c7f5',warn:'#e7b77e',map:'#142030',terminal:'#101a2a',foreground:'#d7e4f5',selection:'#304a6b'},
 ember:{label:'Ember',description:'Noir chaud et ambre.',base:'#201b18',panel:'#29211e',chrome:'#342a24',line:'#493b34',ink:'#f2e5d8',muted:'#b6a294',accent:'#e3ae78',green:'#a5c59a',blue:'#b1bdcd',warn:'#f1bd75',map:'#221c19',terminal:'#1b1714',foreground:'#e8d9ca',selection:'#624a35'}
};
export const panels=['terminal','chat','map','resources','defense'];
export const initialPrefs=()=>({theme:'graphite',custom:{},wallpaper:'',wallpaperDim:55,terminalOpacity:100,side:'right',sideWidth:33,order:['chat','defense','map','resources'],floating:{},hidden:[]});
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const finite=(n,d)=>Number.isFinite(n)?n:d;
const hex=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
export function normalizePrefs(raw){
 const d=initialPrefs(),p=raw&&typeof raw==='object'?raw:{};
 d.theme=Object.hasOwn(themes,p.theme)?p.theme:d.theme;
 d.custom=Object.fromEntries(Object.entries(p.custom||{}).filter(([k,v])=>Object.hasOwn(themes.graphite,k)&&hex(v)));
 d.wallpaper=typeof p.wallpaper==='string'&&/^data:image\/(?:jpeg|png|webp);base64,/.test(p.wallpaper)&&p.wallpaper.length<3000000?p.wallpaper:'';
 d.wallpaperDim=clamp(finite(p.wallpaperDim,55),0,90);d.terminalOpacity=clamp(finite(p.terminalOpacity,100),35,100);
 d.side=p.side==='left'?'left':'right';d.sideWidth=clamp(finite(p.sideWidth,33),23,65);
 d.order=[...new Set([...(Array.isArray(p.order)?p.order.filter(x=>d.order.includes(x)):[]),...d.order])];
 d.hidden=Array.isArray(p.hidden)?[...new Set(p.hidden.filter(x=>['chat','map','resources'].includes(x)))]:[];
 for(const id of panels){const f=p.floating?.[id];if(f&&typeof f==='object')d.floating[id]=boundRect({x:finite(f.x,12),y:finite(f.y,12),w:finite(f.w,65),h:finite(f.h,70)});}
 return d;
}
export const palette=p=>({...themes[p.theme]||themes.graphite,...p.custom});
export function movePanel(order,id,direction){const a=[...order],i=a.indexOf(id),j=i+direction;if(i<0||j<0||j>=a.length)return a;[a[i],a[j]]=[a[j],a[i]];return a;}
export function boundRect(r){const w=clamp(r.w,24,98),h=clamp(r.h,20,98);return {x:clamp(r.x,0,100-w),y:clamp(r.y,0,100-h),w,h};}
export const defaultRect=id=>boundRect(id==='terminal'?{x:8,y:8,w:78,h:80}:id==='chat'?{x:22,y:8,w:55,h:78}:{x:12,y:9,w:76,h:80});
export function alpha(hex,opacity){return hex+Math.round(clamp(opacity,0,100)*255/100).toString(16).padStart(2,'0');}
export function terminalTheme(p){const t=palette(p);return {background:p.terminalOpacity===100?t.terminal:alpha(t.terminal,p.terminalOpacity),foreground:t.foreground,cursor:p.theme==='graphite'&&!p.custom.foreground?'#d8d8e2':t.foreground,selectionBackground:t.selection};}
export function loadPrefs(){try{return normalizePrefs(JSON.parse(localStorage.getItem('mesh-workspace-v1')||'null'));}catch{return initialPrefs();}}
export function storePrefs(p){try{localStorage.setItem('mesh-workspace-v1',JSON.stringify(p));return true;}catch{return false;}}
