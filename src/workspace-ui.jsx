import React,{useEffect,useRef,useState} from 'react';
import {themes,palette,storePrefs,movePanel,boundRect,clamp} from './workspace.mjs';

export function WindowControls({id,prefs,workspaceRef,updatePrefs,floatPanel,hidePanel,setFront,title,detail,resize=false}){
 const gesture=useRef(null),floating=!!prefs.floating[id];
 const start=e=>{if(e.button!==0||!floating)return;const area=workspaceRef.current?.getBoundingClientRect();if(!area?.width||!area.height)return;e.preventDefault();e.stopPropagation();setFront(id);e.currentTarget.setPointerCapture(e.pointerId);gesture.current={rect:boundRect(prefs.floating[id]),area,x:e.clientX,y:e.clientY};};
 const move=e=>{const g=gesture.current;if(!g)return;const r=g.rect,dx=100*(e.clientX-g.x)/g.area.width,dy=100*(e.clientY-g.y)/g.area.height;const next=resize?boundRect({...r,w:clamp(r.w+dx,24,100-r.x),h:clamp(r.h+dy,20,100-r.y)}):boundRect({...r,x:r.x+dx,y:r.y+dy});updatePrefs(p=>({...p,floating:{...p.floating,[id]:next}}));};
 const end=()=>{gesture.current=null;};
 const events={onPointerDown:start,onPointerMove:move,onPointerUp:end,onPointerCancel:end,onLostPointerCapture:end};
 if(resize)return floating?<div className="resizeHandle" title="Redimensionner" {...events}/>:null;
 return <div className={'sectionTitle windowHeading'+(floating?' draggable':'')} {...events}>
  <span className="windowName">{title}</span><span className="muted windowDetail">{detail}</span>
  <div className="windowActions" onPointerDown={e=>e.stopPropagation()}>
   {!floating&&id!=='terminal'&&<><button type="button" title="Monter" aria-label={'Monter '+title} onClick={()=>updatePrefs(p=>({...p,order:movePanel(p.order,id,-1)}))}>↑</button><button type="button" title="Descendre" aria-label={'Descendre '+title} onClick={()=>updatePrefs(p=>({...p,order:movePanel(p.order,id,1)}))}>↓</button></>}
   <button type="button" title={floating?'Ancrer':'Détacher'} aria-label={(floating?'Ancrer ':'Détacher ')+title} onClick={()=>floatPanel(id)}>{floating?'↙':'↗'}</button>
   {!floating&&['chat','map','resources'].includes(id)&&<button type="button" title="Masquer" aria-label={'Masquer '+title} onClick={()=>hidePanel(id)}>−</button>}
  </div>
 </div>;
}

export function WorkspaceSettings({prefs,updatePrefs,close,reset,showChat}){
 const [error,setError]=useState(''),theme=palette(prefs);
 useEffect(()=>{const key=e=>{if(e.key==='Escape')close();};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[close]);
 const patch=obj=>updatePrefs(p=>({...p,...obj}));
 const setWallpaper=async ev=>{const file=ev.target.files?.[0];ev.target.value='';if(!file)return;try{if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15000000)throw Error('Image JPEG, PNG ou WebP de 15 Mo maximum.');const bitmap=await createImageBitmap(file);const ratio=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const data=canvas.toDataURL('image/jpeg',.76);if(data.length>=3000000)throw Error('Image trop volumineuse.');patch({wallpaper:data});setError('');}catch(e){setError(e.message||'Image illisible');}};
 const ranges=[['wallpaperDim','Assombrissement',0,90],['terminalOpacity','Opacité du terminal',35,100],['sideWidth','Largeur des panneaux',23,65]];
 const range=([key,label,min,max])=><label className="settingRange" key={key}><span>{label}<b>{prefs[key]}%</b></span><input type="range" min={min} max={max} value={prefs[key]} onChange={e=>patch({[key]:Number(e.target.value)})}/></label>;
 return <div className="settingsShade" onPointerDown={e=>{if(e.target===e.currentTarget)close();}}>
  <section className="settingsDialog" role="dialog" aria-label="Personnaliser le bureau" aria-modal="true">
   <div className="settingsHeader"><div><h2>Bureau</h2><small>Personnalise ton espace de travail.</small></div><button type="button" onClick={close} aria-label="Fermer">×</button></div>
   <div className="settingsScroll">
    <h3>Thèmes</h3><div className="themeGrid">{Object.entries(themes).map(([id,t])=><button type="button" key={id} className={prefs.theme===id?'selectedTheme':''} onClick={()=>patch({theme:id,custom:{}})}><div className="themePreview" style={{background:t.terminal,color:t.green,borderColor:t.line}}><span>operator@desk:~$</span><i style={{background:t.accent}}/><i style={{background:t.panel}}/></div><b>{t.label}</b><small>{t.description}</small></button>)}</div>
    <h3>Couleurs personnalisées</h3><div className="colorGrid">{[['accent','Accent'],['terminal','Fond terminal'],['foreground','Texte terminal'],['panel','Panneaux'],['base','Bureau'],['green','Indicateurs']].map(([k,label])=><label key={k}>{label}<input type="color" value={theme[k]} onChange={ev=>updatePrefs(p=>({...p,custom:{...p.custom,[k]:ev.target.value}}))}/></label>)}</div><button type="button" className="smallAction" onClick={()=>patch({custom:{}})}>Restaurer les couleurs du thème</button>
    <h3>Fond d’écran</h3><div className="wallpaperControls"><label className="smallAction fileAction">Choisir une image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={setWallpaper}/></label><button type="button" className="smallAction" onClick={()=>patch({wallpaper:''})}>Retirer</button></div>{ranges.slice(0,2).map(range)}
    <h3>Disposition</h3><div className="wallpaperControls">{['left','right'].map(side=><button type="button" key={side} className={'smallAction '+(prefs.side===side?'chosen':'')} onClick={()=>patch({side})}>Panneaux à {side==='left'?'gauche':'droite'}</button>)}</div>{range(ranges[2])}
    <div className="panelSettings">{[['chat','Messages'],['map','Carte'],['resources','Ressources']].map(([id,label])=><label key={id}><input type="checkbox" checked={!prefs.hidden.includes(id)} onChange={e=>{if(id==='chat'&&e.target.checked)showChat();updatePrefs(p=>({...p,hidden:e.target.checked?p.hidden.filter(x=>x!==id):[...p.hidden,id]}));}}/>{label}</label>)}</div>
    <button type="button" className="smallAction" onClick={reset}>Réinitialiser la disposition</button>{error&&<p className="chatError">{error}</p>}
   </div>
  </section>
 </div>;
}
