import express from 'express';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {Server} from 'socket.io';
import {PrismaClient} from '@prisma/client';
import {fresh,execute,view,complete} from './engine.mjs';
const app=express(),http=createServer(app),io=new Server(http,{maxHttpBufferSize:16384}),db=new PrismaClient();
const valid=id=>typeof id==='string'&&/^rift1:[a-f0-9-]{36}$/.test(id);
const queues=new Map();
app.use(express.json({limit:'4kb'}));
app.post('/api/session',async(req,res)=>{try{const id=valid(req.body?.id)?req.body.id:'rift1:'+randomUUID();const save=await db.save.upsert({where:{id},create:{id,state:JSON.stringify(fresh())},update:{}});res.json({id,state:view(JSON.parse(save.state))});}catch(e){console.error(e);res.status(500).json({error:'Sauvegarde indisponible. npm run setup'});}});
function queue(id,ack,fn){const p=(queues.get(id)||Promise.resolve()).then(async()=>{const save=await db.save.findUnique({where:{id}});if(!save)return ack({error:'Session introuvable'});const s=JSON.parse(save.state);await fn(s);}).catch(e=>{console.error(e);ack({error:'Erreur de session'});});queues.set(id,p);void p.finally(()=>{if(queues.get(id)===p)queues.delete(id);});}
io.on('connection',socket=>{
 socket.on('command',(p,ack)=>{if(typeof ack!=='function')return;if(!valid(p?.id)||typeof p.line!=='string'||p.line.length>500)return ack({error:'Commande invalide'});queue(p.id,ack,async s=>{const r=execute(s,p.line);await db.save.update({where:{id:p.id},data:{state:JSON.stringify(s)}});ack({...r,state:view(s)});});});
 socket.on('complete',(p,ack)=>{if(typeof ack!=='function'||!valid(p?.id)||typeof p.line!=='string'||p.line.length>500)return;queue(p.id,ack,s=>ack(complete(s,p.line)));});
});
app.use(express.static(resolve('dist')));
http.listen(3000,'127.0.0.1',()=>console.log('RIFT/OS — http://localhost:3000'));
