import {test} from 'node:test';
import assert from 'node:assert/strict';
import {automaticNodeColor,nodeColor,reconcileNodeColors,annotateNodeColor} from './map-colors.mjs';
const theme={accent:'#ffaaaa',green:'#00ff00',blue:'#0000ff',muted:'#999999',line:'#333333',ink:'#ffffff'};
const a={id:'a',proxy:false,access:false,available:true};
const b={id:'b',proxy:false,access:false,available:true};
test('manual annotation persists on unchanged automatic color and is isolated per node',()=>{
 const saved=annotateNodeColor({},a,'desk',theme,'#ffa500');
 const restored=JSON.parse(JSON.stringify(saved));
 assert.equal(nodeColor(a,'desk',theme,reconcileNodeColors(restored,[a,b],'desk',theme)).background,'#ffa500');
 assert.equal(nodeColor(b,'desk',theme,restored).background,theme.muted);
 assert.equal(Object.keys(annotateNodeColor(saved,a,'desk',theme,null)).length,0);
});
test('game transition permanently clears custom color; selected color is reset too',()=>{
 const saved=annotateNodeColor({},a,'desk',theme,'#ffa500');
 const active=reconcileNodeColors(saved,[a,b],'a',theme);
 assert.equal(Object.keys(active).length,0);
 assert.equal(nodeColor(a,'a',theme,active).highlight.background,theme.accent);
 assert.equal(nodeColor(a,'desk',theme,active).background,theme.muted);
 for(const next of [{...a,proxy:true},{...a,access:true},{...a,available:false}]){
  assert.equal(Object.keys(reconcileNodeColors(saved,[next],'desk',theme)).length,0);
  assert.equal(nodeColor(next,'desk',theme,saved).background,automaticNodeColor(next,'desk',theme).background);
 }
});
test('invalid colors and old theme annotations are discarded',()=>{
 const saved=annotateNodeColor({},a,'desk',theme,'#ffa500');
 assert.equal(Object.keys(reconcileNodeColors(saved,[a],'desk',{...theme,muted:'#777777'})).length,0);
 assert.equal(Object.keys(reconcileNodeColors({a:{...saved.a,color:'invalid'}},[a],'desk',theme)).length,0);
});
