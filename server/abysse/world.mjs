export const world = (function makeWorld(){
 const H=(id,ip,zone,links,users,files,services=[],protectedPaths=[])=>({id,ip,zone,links,users,files,services,protectedPaths});
 return [
 H('atelier','10.42.0.2','SURFACE',['quai'],{operateur:''},{
 '/home/operateur/BIENVENUE.txt':`Vous êtes de permanence pour le réseau de maintenance du projet ABYSSE.\nUn appel de détresse est arrivé pendant la nuit.\nConsultez votre messagerie : mail\nManuel local : man shell ; man reseau ; man atelier\nAucune commande ne touche votre véritable ordinateur.`,
 '/home/operateur/notes.txt':'Notes personnelles — à compléter.',
 '/etc/hostname':'atelier','/etc/resolv.conf':'nameserver 10.42.0.1',
 '/etc/motd':'ABYSSE / console de maintenance indépendante','/var/log/boot.log':'00:00 système initialisé\n00:01 liaison acoustique ouverte'
 },['shell','mail']),
 H('quai','10.42.0.10','SURFACE',['atelier','depot','vigie'],{invite:''},{
 '/etc/hostname':'quai','/etc/motd':'Terminal public — accès invité',
 '/var/log/dispatch.log':`01:02 OPEN R19 exercice\n01:16 CLOSE R19\n02:04 OPEN R27 detresse\n02:07 OPEN R31 maintenance\n02:09 CLOSE R31\n02:13 RETRY R27 accusé absent\n02:14 COPY R27 depot /srv/records/R27.txt`,
 '/srv/public/annuaire.txt':'depot : compte archiviste, badge de permanence dans le casier /srv/public/casiers/bleu.txt\nvigie : invite, surveillance des lignes.',
 '/srv/public/casiers/rouge.txt':'Badge expiré : quai-199',
 '/srv/public/casiers/bleu.txt':'Permanence nuit / archiviste / jeton : corail-27',
 '/srv/public/casiers/vert.txt':'Badge réservé au jour : quai-402',
 '/var/log/maintenance.log':'R19 : simulation terminée\nR31 : test de lampe terminé'
 },['shell','dispatch']),
 H('depot','10.42.0.21','SURFACE',['quai','vigie'],{archiviste:'corail-27'},{
 '/etc/hostname':'depot','/srv/records/R19.txt':'R19 — exercice de sécurité sans anomalie.',
 '/srv/records/R31.txt':'R31 — entretien ordinaire.',
 '/srv/records/R27.txt':'R27 | DETRESSE | Habitat NEREIDE | équipage: 6 | demande: secours immédiat | signature: VERA-27',
 '/home/archiviste/lisez-moi.txt':'Le ticket non clôturé doit être transmis au poste de permanence. fetch permet de rapatrier un dossier vers atelier.',
 '/var/log/access.log':'02:14 R27 archived\n02:15 passage en mode lecture seule'
 },['shell','records']),
 H('vigie','10.42.0.30','SURFACE',['quai','depot','relais'],{invite:''},{
 '/etc/hostname':'vigie','/srv/public/topologie.txt':'Le relais immergé ne répond plus au dialogue normal. Sa console de diagnostic reste ouverte.',
 '/var/log/line.log':'02:10 uplink stable\n02:11 sync lost\n02:12 time service drift\n02:13 uplink degraded'
 },['shell','line']),
 H('relais','10.42.1.1','LIAISON',['vigie','horloge','bouee'],{invite:''},{
 '/etc/hostname':'relais','/srv/public/protocole.txt':'Le bus acoustique conserve les messages non livrés. La console bus accepte les commandes status, queue et replay. Une horloge désynchronisée fait rejeter tout rejeu. Consultez horloge.',
 '/var/log/bus.log':'02:14 reject seq=81 reason=clock\n02:15 reject seq=82 reason=checksum\n02:16 reject seq=83 reason=clock',
 '/srv/public/consigne.txt':'Ne rejouer que le message de secours qui est valide et non livré. Les messages de routine ne servent pas.'
 },['shell','bus']),
 H('horloge','10.42.1.8','LIAISON',['relais','bouee'],{invite:''},{
 '/etc/hostname':'horloge','/var/log/clock.log':'REFERENCE 04:12:00\nLOCAL     04:19:00\nREFERENCE 04:13:00\nLOCAL     04:20:00',
 '/srv/public/calibration.txt':'Le décalage est exprimé en minutes à ajouter à LOCAL. Utiliser bus calibrate depuis cette machine. La synchronisation est partagée avec relais.'
 },['shell','clock']),
 H('bouee','10.42.1.12','LIAISON',['relais','horloge','carto','hydro'],{invite:''},{
 '/etc/hostname':'bouee','/srv/public/frames.csv':'seq,type,crc,etat\n79,ROUTINE,OK,LIVRE\n81,SOS,OK,ATTENTE\n82,SOS,BAD,ATTENTE\n83,ROUTINE,OK,ATTENTE',
 '/srv/public/lien.txt':'La liaison profonde est désactivée tant que le SOS original n’a pas été récupéré et transmis à la permanence.'
 },['shell','frames']),
 H('carto','10.42.2.11','FOND',['bouee','hydro','archive'],{lecteur:'nautilus-81'},{
 '/etc/hostname':'carto','/home/lecteur/README':'Un relevé est réparti sur trois machines. Choisir les fragments de la même campagne, série N27. Les versions précédentes sont des leurres accidentels.',
 '/srv/surveys/2024/alpha.part':'N24|1|NORD',
 '/srv/surveys/2026/alpha.part':'N27|1|EST-12',
 '/srv/surveys/2026/obsolete.part':'N26|1|EST-99',
 '/var/log/survey.log':'campagne N27 / alpha / valide'
 },['shell','survey']),
 H('hydro','10.42.2.12','FOND',['bouee','carto','archive'],{lecteur:'nautilus-81'},{
 '/etc/hostname':'hydro','/srv/mesures/README':'Le dernier export est encodé en base64 pour être transmis sur la liaison acoustique. Décoder le fichier sur atelier.',
 '/srv/mesures/beta.b64':'TjI3fDJ8UFJPRi00ODA=',
 '/srv/mesures/beta-old.part':'N24|2|PROF-100',
 '/var/log/sonar.log':'N27 echo stable / profondeur confirmée'
 },['shell','sonar']),
 H('archive','10.42.2.20','FOND',['carto','hydro','station'],{lecteur:'nautilus-81'},{
 '/etc/hostname':'archive','/srv/catalogue/index.csv':'date,id,etat,chemin\n2026-06-17,N27,VALIDE,/srv/backup/gamma.part\n2026-06-18,N28,ANNULE,/srv/backup/gamma-new.part\n2024-01-04,N24,VALIDE,/srv/backup/gamma-old.part',
 '/srv/backup/gamma.part':'N27|3|CAP-031',
 '/etc/archive/access.conf':'viewer=lecteur\nread.restricted=N27\npreview.max=8\npreview.acl=legacy\n',
 '/var/log/preview.log':'2026-06-17 preview N24 offset=0 len=8 OK\n2026-06-17 read N27 DENIED\n2026-06-17 preview N27 offset=8 len=8 OK\n',
 '/srv/public/rpc-manual.txt':'Service archive : rpc inspect <id>, rpc read <id>, rpc preview <id> <offset> <length>. Les offsets sont en octets, commencent à 0 et la prévisualisation est limitée à 8 octets par requête. Le mode legacy devrait être désactivé.',
 '/srv/backup/gamma-new.part':'N28|3|CAP-091',
 '/srv/backup/gamma-old.part':'N24|3|CAP-220',
 '/srv/public/notice':'Le dossier de géolocalisation doit être assemblé sur atelier via assemble, avec trois fichiers de la campagne N27. Les permissions de lecture directe de la dernière sauvegarde ont été modifiées. Examiner le service archive et ses journaux.'
 },['shell','archive','rpc']),
 H('station','10.42.3.1','HABITAT',['archive','batterie','pompe','sas'],{technicien:'nereide-031'},{
 '/etc/hostname':'station','/etc/motd':'Habitat NEREIDE — mode secours',
 '/srv/maintenance/procedure.txt':'La batterie est limitée à 70 kW. Le réseau de secours et la ventilation doivent rester actifs. Le sonar est facultatif. La pompe principale exige 35 kW. La console grid est accessible depuis batterie et pompe.',
 '/var/log/alarm.log':'02:17 pump stopped: capacity\n02:18 oxygen reserve declining\n02:19 door controller isolated',
 '/srv/maintenance/equipe.txt':'6 personnes détectées. Le sas de secours est bloqué tant que la circulation d’air n’est pas restaurée.'
 },['shell','maintenance']),
 H('batterie','10.42.3.5','HABITAT',['station','pompe'],{technicien:'nereide-031'},{
 '/etc/hostname':'batterie','/srv/public/budget.txt':'CAPACITE 70 kW\nliaison 10 (critique)\nventilation 15 (critique)\nsonar 30 (facultatif)\npompe 35\n',
 '/var/log/power.log':'55 kW nominal ; pompe hors tension'
 },['shell','grid']),
 H('pompe','10.42.3.6','HABITAT',['station','batterie','sas'],{technicien:'nereide-031'},{
 '/etc/hostname':'pompe','/srv/maintenance/processus.txt':'Le processus régulateur contrôle la pression. Une ancienne instance de diagnostic bloque la boucle de régulation. Identifier le processus de diagnostic dans ps, puis arrêter uniquement celui-ci avec kill PID. Ne pas arrêter le régulateur.',
 '/srv/maintenance/restart.txt':'grid start pompe pour alimenter la pompe ; service start circulation pour lancer la régulation. ps et service status pour vérifier.'
 },['shell','grid','circulation']),
 H('sas','10.42.3.9','HABITAT',['station','pompe','dossier'],{technicien:'nereide-031'},{
 '/etc/hostname':'sas','/srv/public/instructions.txt':'Un rapport d’intégrité est produit lorsque le courant et la circulation sont rétablis. Utiliser service status puis fetch /var/run/integrite.txt.',
 '/srv/public/occupants.txt':'NEREIDE / équipage : 6 / route de secours : secteur B'
 },['shell','door']),
 H('dossier','10.42.4.2','ENQUETE',['sas','direction','balise'],{enqueteur:'secours-b'},{
 '/etc/hostname':'dossier','/srv/incident/index.txt':'Incident R27 / examiner les journaux du système et les directives de direction. Le rapport automatique a été falsifié.',
 '/var/log/incident.log':'02:03 ALARM oxygen_low\n02:04 COMMAND isolate NEREIDE\n02:05 ACTOR directive-17\n02:06 OVERRIDE rescue_request\n02:10 REPORT normal',
 '/srv/incident/rapport-public.txt':'Aucun incident signalé. Maintenance ordinaire.',
 '/srv/incident/rapport-brut.txt':'R27 | ALARME CONFIRMEE | isolement ordonné avant le défaut de pompe | source: directive-17'
 },['shell','audit']),
 H('direction','10.42.4.8','ENQUETE',['dossier','balise'],{enqueteur:'secours-b'},{
 '/etc/hostname':'direction','/srv/directives/16.txt':'Directive 16 : test des alarmes.',
 '/srv/directives/17.txt':'DIRECTIVE-17 | ordre: isoler NEREIDE | motif: dissimulation expérience | validation: V. LENOIR',
 '/srv/directives/18.txt':'Directive 18 : mise à jour documentaire.',
 '/var/log/approval.log':'02:05 17 APPROVED VLENOIR\n02:12 18 DRAFT',
 '/etc/directives/access.conf':'role=enqueteur\nread.17=deny\ncompare=allow\ncompare_acl=left_only\n',
 '/srv/directives/README':'Service de révision : rpc read <id> et rpc diff <ancien> <nouveau>. Le comparateur hérité vérifie les droits du document de base. Chaque directive tient sur une ligne.'
 },['shell','records','rpc']),
 H('balise','10.42.4.12','ENQUETE',['dossier','direction'],{enqueteur:'secours-b'},{
 '/etc/hostname':'balise','/srv/public/evacuation.txt':'La balise de secours peut émettre une transmission signée vers le navire de secours. Les pièces jointes sont vérifiées par la permanence. Après validation, le choix de diffusion reste à l’opérateur.',
 '/srv/public/frequences.txt':'PRIVE : secours uniquement\nPUBLIC : secours et enquête indépendante'
 },['shell','transmission'])
 ];
})();
for (const h of world) {
 const u=Object.keys(h.users)[0];
 Object.assign(h.files,{
 '/etc/os-release':'NAME="ABYSS/OS"\nVERSION="6.27.1"\nID=abyss',
 '/etc/passwd':'root:x:0:0:root:/root:/bin/abyss\n'+u+':x:1000:1000:Operator:/home/'+u+':/bin/abyss',
 '/etc/group':'root:x:0:\noperators:x:1000:'+u,
 '/proc/version':'ABYSS/OS virtual kernel 6.27.1',
 '/proc/uptime':'89127.11 81273.51',
 '/var/log/auth.log':'01:00 session manager online\n01:01 authorized role '+u,
 ['/home/'+u+'/.profile']:'export PATH=/bin:/usr/bin\nexport LANG=fr_FR.UTF-8',
 ...h.files
 });
}
export const missions = [
  {
    "title": "Permanence de nuit",
    "from": "Lina / coordination",
    "subject": "Un appel sans réponse",
    "body": "Un ticket de détresse n'a jamais été clôturé. Trouve le ticket original dans le dépôt, pas un exercice. Rapatrie-le sur atelier avec fetch puis envoie-le avec submit <fichier>. Commence par scan, ssh invite@quai et explore /var/log. Les accès sont dans les documents publics.",
    "needed": "ticket de détresse"
  },
  {
    "title": "Silence acoustique",
    "from": "Lina / coordination",
    "subject": "La liaison profonde",
    "body": "Six personnes sont en danger. La vigie connaît le relais. Répare sa synchronisation, identifie la bonne trame de secours et récupère le message original. Les consoles bus sont décrites dans man bus. Soumets le message récupéré.",
    "needed": "message SOS"
  },
  {
    "title": "Sous la thermocline",
    "from": "VERA / NEREIDE",
    "subject": "Nous ne sommes pas où ils pensent",
    "body": "Nos coordonnées officielles sont fausses. Trois mesures de la campagne N27 sont réparties sur les serveurs profonds. Compte lecteur, jeton nautilus-81. Rapatrie les mesures, décode ce qui doit l'être et assemble-les sur atelier. man assemble. Soumets le fichier produit.",
    "needed": "position reconstruite"
  },
  {
    "title": "Respirer",
    "from": "Lina / coordination",
    "subject": "Un habitat à remettre en vie",
    "body": "La position est confirmée. Accès technicien, jeton nereide-031. La station de maintenance est derrière archive. Répartis la puissance, identifie l'anomalie de régulation, restaure la circulation. Le sas produit alors un rapport d'intégrité. Soumets ce rapport.",
    "needed": "rapport d'intégrité"
  },
  {
    "title": "Ce que la mer garde",
    "from": "VERA / NEREIDE",
    "subject": "Ce n'était pas un accident",
    "body": "Le sas est ouvert. Je t'envoie un accès enquêteur, jeton secours-b. Trouve le rapport brut et la directive qui prouve l'ordre d'isolement. Rapatrie les deux, puis submit <rapport> <directive>. La balise attend ensuite ta décision.",
    "needed": "preuves concordantes"
  },
  {
    "title": "Dernière transmission",
    "from": "Lina / coordination",
    "subject": "À toi de décider",
    "body": "Le navire est en approche. Depuis la balise, transmets les preuves par le canal privé ou public. man transmit. Dans les deux cas, l'équipage est évacué. Les conséquences de la diffusion t'appartiennent.",
    "needed": "transmission finale"
  }
];
