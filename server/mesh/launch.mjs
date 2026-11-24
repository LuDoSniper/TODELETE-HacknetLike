// Own a private Ollama instance for this game only. Never terminate an existing user daemon.
import {spawn,spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';
const mode=process.argv[2]||'dev',win=process.platform==='win32',children=new Set();
let daemon,closing=false;
const endpoint='http://127.0.0.1:11435';
const env={...process.env,MESH_OLLAMA_PRIVATE:'1'};
const alive=async()=>{try{const r=await fetch(endpoint+'/api/version',{signal:AbortSignal.timeout(700)});return r.ok;}catch{return false;}};
function child(command,args,options={}){const p=spawn(command,args,{stdio:'inherit',windowsHide:true,...options});children.add(p);p.once('exit',()=>children.delete(p));p.on('error',err=>console.error('[mesh]',err.message));return p;}
function terminate(p){if(!p?.pid||p.exitCode!==null||p.signalCode!==null)return;if(win)spawnSync('taskkill.exe',['/PID',String(p.pid),'/T','/F'],{stdio:'ignore',windowsHide:true,timeout:4000});else {try{p.kill('SIGTERM');}catch{}}}
async function close(code=0){if(closing)return;closing=true;for(const p of [...children])if(p!==daemon)terminate(p);if(daemon){try{await fetch(endpoint+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:process.env.MESH_NPC_MODEL||'qwen2.5:7b',keep_alive:0}),signal:AbortSignal.timeout(2500)});}catch{}terminate(daemon);}process.exit(code);}
process.on('SIGINT',()=>void close());process.on('SIGTERM',()=>void close());if(win)process.on('SIGBREAK',()=>void close());
if(await alive()){console.warn('[mesh] Le port privé 11435 est déjà utilisé ; instance existante laissée intacte. Quitte-la avant de relancer pour une gestion automatique.');}
else{
 daemon=child('ollama',['serve'],{env:{...env,OLLAMA_HOST:'127.0.0.1:11435',OLLAMA_NO_CLOUD:'1',OLLAMA_KEEP_ALIVE:'45s'},stdio:['ignore','ignore','inherit']});
 for(let i=0;i<15&&!closing;i++){if(await alive()||!daemon.pid||daemon.exitCode!==null)break;await sleep(300);}
 if(!await alive())console.warn('[mesh] Ollama indisponible : le jeu reste jouable, les dialogues peuvent être hors ligne.');
}
if(!closing){
 const args=mode==='watch'?['--watch-path=server/mesh','server/mesh/server.mjs']:['server/mesh/server.mjs'];
 const server=child(process.execPath,args,{env});server.once('exit',code=>void close(code??0));server.once('error',()=>void close(1));
 if(mode!=='start'){const vite=child(process.execPath,[resolve('node_modules/vite/bin/vite.js')],{env});vite.once('exit',code=>void close(code??0));vite.once('error',()=>void close(1));}
}
