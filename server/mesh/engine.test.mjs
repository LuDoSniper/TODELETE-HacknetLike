import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,execute,view,complete,openEditor,saveEditor} from './engine.mjs';
const run=(s,...lines)=>{for(const line of lines){const r=execute(s,line);assert.equal(r.code,0,line+' => '+r.out);}};
test('network gates, case-insensitive completion, shared storage and cached sessions',()=>{
 const s=fresh();assert.equal(complete(s,'cat re').line,'cat README.md ');assert.equal(execute(s,'connect catalog').code,1);
 run(s,'scan','scan lobby','scan relay','scan catalog');assert.equal(execute(s,'connect spool').code,1);
 run(s,'svc dispatch 4102 lease KITE-41 FJ-62','connect spool','fetch /srv/spool/KITE-41.txt','echo test > /vault/Example.txt','cd /srv/spool','connect lobby','cat /vault/Example.txt','connect spool');
 assert.equal(view(s).cwd,'/srv/spool');assert.equal(complete(s,'cat /vault/ex').line,'cat /vault/Example.txt ');assert.equal(complete(s,'cat /VAULT/ex').line,'cat /vault/Example.txt ');assert.ok(execute(s,'sessions').out.includes('spool'));
 const f=openEditor(s,'vim /vault/Example.txt');saveEditor(s,f.path,'edited');run(s,'connect desk');assert.equal(execute(s,'cat /vault/Example.txt').out,'edited');
 assert.equal(execute(s,'connect switch').code,1);assert.ok(execute(s,'probe spool').out.includes('22/tcp'));
});
test('full campaign including distributed contention and permissions',()=>{
 const s=fresh();
 run(s,'scan','scan lobby','scan relay','scan catalog','svc dispatch 4102 lease KITE-41 FJ-62','connect spool','fetch /srv/spool/KITE-41.txt','submit /vault/KITE-41.txt','svc gate 4300 permit KITE-41 CUSTODY-17','submit route','scan gate','scan switch','scan codec');
 assert.equal(execute(s,'svc archive 4402 read r17').code,1);
 run(s,'svc codec 4401 slice A17 0 8 > /vault/a.b64','svc codec 4401 slice A17 8 8 >> /vault/a.b64','svc codec 4401 slice A17 16 8 >> /vault/a.b64','base64 -d /vault/a.b64 > /vault/a.part','svc archive 4402 diff old r17 | grep "^\\\\+" | cut -d " " -f 2- > /vault/b.part','connect journal','fetch /srv/export/tail.part','assemble /vault/a.part /vault/b.part /vault/tail.part','submit /vault/manifest.txt','scan workbench','proxy add relay','proxy add switch');
 assert.equal(execute(s,'jobs start snapshot compute').code,1);
 run(s,'jobs start fork sentinel','jobs start snapshot compute');assert.equal(view(s).ram.used,18);assert.equal(execute(s,'proxy remove switch').code,1);
 run(s,'jobs status','ram','jobs collect 2','echo "M-42|VANTA-62" > /vault/session.txt','submit /vault/session.txt');assert.equal(view(s).story.battle.state,'pending');run(s,'defense engage','defense inspect');for(const op of ['isolate','quarantine','revoke']){const bad=s.battle.threats.find(t=>t.signature==='INVALID');run(s,'defense '+op+' '+bad.id);}assert.equal(view(s).story.battle.state,'complete');run(s,'scan compute','svc uplink 4600 permit M-42 VANTA-62','scan uplink','scan audit','scan keyring','svc audit 4601 query > /vault/audit.csv','svc clock 4603 status > /vault/offsets.csv','reconstruct /vault/audit.csv /vault/offsets.csv T-77','submit /vault/chronology.txt','scan review');
 assert.equal(execute(s,'svc review 4701 inspect R17').code,1);assert.equal(execute(s,'svc records 4700 read T-77').code,1);
 run(s,'svc review 4701 compare R16 R17','svc registry 4702 delegate records auditor MANDAT-9','connect records','fetch /srv/records/T-77.txt','submit /vault/T-77.txt','connect press','publish public');
 assert.equal(s.phase,7);assert.ok(s.ending);assert.equal(view(s).ram.used,0);
});
test('alternate diagnostic solution, RAM limits and trace recovery',()=>{
 const s=fresh();run(s,'scan','scan relay','scan lobby','svc dispatch 4102 lease KITE-41 FJ-62','svc gate 4300 permit KITE-41 CUSTODY-17','scan gate','scan switch','scan workbench');
 assert.equal(execute(s,'svc sentinel 4503 maintenance OBS-14').code,1);
 run(s,'svc sentinel 4503 maintenance OBS-17','proxy add relay');assert.equal(execute(s,'jobs start snapshot compute').code,1);
 run(s,'proxy add switch','jobs start snapshot compute','jobs status','ram','jobs collect 1');assert.ok(s.flags.snapshot);assert.equal(view(s).ram.used,0);
 s.trace=95;assert.equal(execute(s,'svc uplink 4600 permit M-42 VANTA-62').code,1);run(s,'scan compute','trace wait','svc uplink 4600 permit M-42 VANTA-62');
});

test('narrative onboarding, dialogue and migration',()=>{const s=fresh();assert.equal(view(s).story.messages.length,1);run(s,'scan');assert.ok(view(s).story.messages.length>1);assert.equal(execute(s,'talk iris "Comment utiliser les ports ?"').code,1);run(s,'tutorial off');assert.equal(view(s).story.coaching,false);const old=JSON.parse(JSON.stringify(s));delete old.story;delete old.battle;old.phase=5;assert.equal(view(old).story.battle.state,'complete');});
test('defense failure preserves evidence, retry and live deadline',()=>{const s=fresh();s.phase=4;delete s.battle;s.vault['/vault/proof.txt']='safe';run(s,'defense engage');for(let i=0;i<4;i++)run(s,'defense isolate 0');assert.equal(view(s).story.battle.state,'failed');assert.equal(s.vault['/vault/proof.txt'],'safe');run(s,'defense engage live');assert.ok(view(s).story.battle.deadline>Date.now());s.battle.deadline=Date.now()-1;run(s,'defense status');assert.equal(view(s).story.battle.state,'failed');run(s,'defense engage');assert.equal(view(s).story.battle.state,'active');});
