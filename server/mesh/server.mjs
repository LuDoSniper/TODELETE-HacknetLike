import express from 'express';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {Server} from 'socket.io';
import {PrismaClient} from '@prisma/client';
import {fresh,execute,view,complete,openEditor,saveEditor} from './engine.mjs';
import {beginRoleplay,finishRoleplay} from './narrative.mjs';
import {generateCharacterReply} from './characters.mjs';
const app=express(),http=createServer(app),io=new Server(http,{maxHttpBufferSize:65536}),db=new PrismaClient();
const valid=id=>typeof id==='string'&&/^me3:[a-f0-9-]{36}$/.test(id);
app.use(express.json({limit:'8kb'}));
app.post('/api/session',async(req,res)=>{const id=valid(req.body?.id)?req.body.id:'me3:'+randomUUID();const save=await db.save.upsert({where:{id},create:{id,state:JSON.stringify(fresh())},update:{}});res.json({id,state:view(JSON.parse(save.state))});});
const queues=new Map();
const withState=(id,ack,fn)=>{const task=(queues.get(id)||Promise.resolve()).then(async()=>{const save=await db.save.findUnique({where:{id}});if(!save)return ack({error:'Session inconnue'});const s=JSON.parse(save.state);await fn(s);}).catch(()=>ack({error:'Erreur de session'}));queues.set(id,task);void task.finally(()=>{if(queues.get(id)===task)queues.delete(id);});return task;};
const pendingDialogue=new Set();
async function respondDialogue(id,contact,body,ack,terminal=false){
 if(pendingDialogue.has(id))return ack({error:'Une réponse est déjà en cours.'});
 pendingDialogue.add(id);let context;
 try{
  await withState(id,ack,async state=>{const candidate=beginRoleplay(state,contact,body);await db.save.update({where:{id},data:{state:JSON.stringify(state)}});context=candidate;});
  if(!context)return;
  const result=await generateCharacterReply(context);
  await withState(id,ack,async state=>{const out=finishRoleplay(state,context,result);await db.save.update({where:{id},data:{state:JSON.stringify(state)}});ack({state:view(state),source:result.source,...(terminal?{out,code:0}:{})});});
 }finally{pendingDialogue.delete(id);}
}
io.on('connection',socket=>{
 socket.on('command',(p,ack)=>{if(typeof ack!=='function')return;if(!valid(p?.id)||typeof p?.line!=='string'||p.line.length>500)return ack({error:'Commande invalide'});const talk=p.line.trim().match(/^talk\s+(\S+)\s+([\s\S]+)$/i);if(talk){let body=talk[2].trim();if((body.startsWith('"')&&body.endsWith('"'))||(body.startsWith("'")&&body.endsWith("'")))body=body.slice(1,-1);void respondDialogue(p.id,talk[1],body,ack,true);return;}withState(p.id,ack,async s=>{const result=execute(s,p.line);await db.save.update({where:{id:p.id},data:{state:JSON.stringify(s)}});ack({...result,state:view(s)});});});
 socket.on('dialogue',(p,ack)=>{if(typeof ack!=='function')return;if(!valid(p?.id)||typeof p.contact!=='string'||typeof p.body!=='string'||!p.body.trim()||p.body.length>500)return ack({error:'Message invalide'});void respondDialogue(p.id,p.contact,p.body,ack);});
 socket.on('editor:open',(p,ack)=>{if(typeof ack!=='function'||!valid(p?.id)||typeof p?.line!=='string'||p.line.length>500)return;withState(p.id,ack,s=>{try{ack(openEditor(s,p.line));}catch(e){ack({error:e.message});}});});
 socket.on('editor:save',(p,ack)=>{if(typeof ack!=='function'||!valid(p?.id)||typeof p?.path!=='string'||typeof p?.data!=='string'||p.data.length>20000)return;withState(p.id,ack,async s=>{try{saveEditor(s,p.path,p.data);await db.save.update({where:{id:p.id},data:{state:JSON.stringify(s)}});ack({ok:true});}catch(e){ack({error:e.message});}});});
 socket.on('complete',(p,ack)=>{if(typeof ack!=='function')return;if(!valid(p?.id)||typeof p?.line!=='string'||p.line.length>500)return ack({error:'Saisie invalide'});withState(p.id,ack,s=>ack(complete(s,p.line,Math.max(0,Math.min(p.line.length,Number.isInteger(p.pos)?p.pos:p.line.length)))));});
});
app.use(express.static(resolve('dist')));
http.listen(3000,'127.0.0.1',()=>console.log('MESH — http://localhost:3000'));
