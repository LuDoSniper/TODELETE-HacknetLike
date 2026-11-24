// Per-save annotations. A changed automatic color permanently invalidates an annotation.
export function automaticNodeColor(node,current,theme){
 const active=node.id===current;
 return {background:active?theme.accent:node.proxy?theme.green:node.access?theme.blue:node.available?theme.muted:theme.line,border:active?theme.ink:node.proxy?theme.green:node.available?theme.muted:theme.line};
}
export const colorSignature=color=>JSON.stringify([color.background,color.border]);
export function reconcileNodeColors(saved,nodes,current,theme){
 const next={};
 for(const n of nodes){
  const entry=saved?.[n.id],auto=automaticNodeColor(n,current,theme);
  if(entry&&/^#[0-9a-f]{6}$/i.test(entry.color)&&entry.signature===colorSignature(auto))next[n.id]=entry;
 }
 return next;
}
export function nodeColor(node,current,theme,annotations){
 const auto=automaticNodeColor(node,current,theme),entry=annotations?.[node.id];
 if(!entry||entry.signature!==colorSignature(auto)||!/^#[0-9a-f]{6}$/i.test(entry.color))return auto;
 return {...auto,background:entry.color,highlight:{background:entry.color,border:auto.border},hover:{background:entry.color,border:auto.border}};
}
export function annotateNodeColor(saved,node,current,theme,color){
 const next={...saved};
 if(!color)delete next[node.id];
 else if(/^#[0-9a-f]{6}$/i.test(color))next[node.id]={color,signature:colorSignature(automaticNodeColor(node,current,theme))};
 return next;
}
