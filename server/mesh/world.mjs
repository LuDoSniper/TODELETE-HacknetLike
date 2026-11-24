export const world=[
  {
    "id": "desk",
    "zone": "EDGE",
    "links": [
      "lobby",
      "relay",
      "mirror"
    ],
    "ports": {},
    "files": {
      "/home/operator/README.md": "SYSTEME / Contrat de permanence\n\nmail : briefings\nscan : découverte réseau\nprobe <hôte> : ports et état des services\nman network : transport et sessions\nman services : interroger les protocoles fictifs\nman vault : espace partagé et validation\nToutes les machines et tous les services sont simulés.",
      "/home/operator/notes.md": "# Notes personnelles\n",
      "/etc/motd": "Poste indépendant / accès opérateur",
      "/etc/hostname": "desk",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\noperator:x:1000:1000:Operator:/home/operator:/bin/mesh",
      "/etc/services": ""
    },
    "users": {
      "operator": ""
    },
    "user": "operator",
    "ram": 8,
    "ip": "10.73.0.10"
  },
  {
    "id": "lobby",
    "zone": "EDGE",
    "links": [
      "desk",
      "relay",
      "catalog",
      "dispatch"
    ],
    "ports": {
      "4080": {
        "name": "bulletin",
        "version": "2.4",
        "banner": "read-only public bulletin"
      }
    },
    "files": {
      "/srv/public/README.md": "Le registre des incidents est publié sur catalog. Le service dispatch conserve les événements originaux.",
      "/srv/public/bulletin.txt": "Révisions publiques : KITE-18 exercice ; KITE-22 transport ; KITE-41 litige. Les références correspondent aux entrées du registre.",
      "/var/log/web.log": "03:21 GET /bulletin 200\n03:22 GET /catalog 302",
      "/etc/hostname": "lobby",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "bulletin 4080/tcp"
    },
    "users": {
      "guest": ""
    },
    "ip": "10.73.0.20",
    "ram": 0
  },
  {
    "id": "relay",
    "zone": "EDGE",
    "links": [
      "desk",
      "lobby",
      "dispatch",
      "mirror",
      "gate"
    ],
    "ports": {
      "4200": {
        "name": "forwarder",
        "version": "1.8",
        "banner": "relay diagnostics / proxy capable"
      }
    },
    "files": {
      "/srv/docs/relay.txt": "proxy add relay permet de déléguer des tâches sur ce relais. Capacité : 4 MiB. Les routes déjà explorées sont mémorisées par le client.",
      "/var/log/relay.log": "03:13 route internal disabled\n03:17 public relay OK",
      "/etc/hostname": "relay",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "forwarder 4200/tcp"
    },
    "users": {
      "guest": ""
    },
    "ram": 4,
    "proxy": true,
    "ip": "10.73.0.30"
  },
  {
    "id": "mirror",
    "zone": "EDGE",
    "links": [
      "desk",
      "relay",
      "catalog",
      "spool"
    ],
    "ports": {
      "4201": {
        "name": "cache",
        "version": "3.1",
        "banner": "public index"
      }
    },
    "files": {
      "/srv/cache/index.csv": "id,revision,state\nKITE-18,2,CLOSED\nKITE-22,1,CLOSED\nKITE-41,3,PENDING",
      "/srv/cache/README.md": "Les références révisées peuvent être différentes de celles du journal d’origine. Les commandes svc sont spécifiques au service.",
      "/etc/hostname": "mirror",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "cache 4201/tcp"
    },
    "users": {
      "guest": ""
    },
    "ram": 4,
    "proxy": true,
    "ip": "10.73.0.40"
  },
  {
    "id": "catalog",
    "zone": "EDGE",
    "links": [
      "lobby",
      "mirror",
      "dispatch",
      "spool"
    ],
    "ports": {
      "4101": {
        "name": "registry",
        "version": "4.2",
        "banner": "public registry, actions: list, describe, revision"
      }
    },
    "files": {
      "/srv/docs/registry.txt": "registry: list, describe <id>, revision <id>. La dernière révision est publique, le journal original est sur dispatch.",
      "/var/log/catalog.log": "03:15 KITE-41 revision 3 redacted",
      "/etc/hostname": "catalog",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "registry 4101/tcp"
    },
    "users": {
      "guest": ""
    },
    "ip": "10.73.0.50",
    "ram": 0
  },
  {
    "id": "dispatch",
    "zone": "EDGE",
    "links": [
      "lobby",
      "relay",
      "catalog",
      "gate"
    ],
    "ports": {
      "4102": {
        "name": "dispatch",
        "version": "1.6",
        "banner": "event stream, actions: log, ticket, lease"
      }
    },
    "files": {
      "/srv/docs/dispatch.txt": "log affiche les événements. ticket <id> lit un ticket si sa référence est connue. lease <id> <nonce> produit un accès temporaire au dossier concerné. Les nonces de debug sont parfois restés dans le journal.",
      "/var/log/events.log": "03:11 KITE-18 CLOSE exercise\n03:12 KITE-22 CLOSE delivery\n03:13 KITE-41 OPEN override\n03:14 KITE-41 HOLD nonce=FJ-62\n03:16 KITE-41 REDACT revision=3",
      "/etc/hostname": "dispatch",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "dispatch 4102/tcp"
    },
    "users": {
      "guest": ""
    },
    "ip": "10.73.0.60",
    "ram": 0
  },
  {
    "id": "spool",
    "zone": "EDGE",
    "links": [
      "mirror",
      "catalog",
      "gate"
    ],
    "ports": {
      "4103": {
        "name": "spool",
        "version": "2.0",
        "banner": "sealed mailbox; shell disabled until valid lease"
      }
    },
    "files": {
      "/home/reader/README.md": "Le reçu original est dans /srv/spool. Une fois rapatrié, submit depuis n’importe quel poste.",
      "/srv/spool/KITE-41.txt": "KITE-41|OVERRIDE|MARA|CUSTODY-17",
      "/srv/spool/KITE-22.txt": "KITE-22|DELIVERY|OK",
      "/etc/hostname": "spool",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nreader:x:1000:1000:Operator:/home/reader:/bin/mesh",
      "/etc/services": "spool 4103/tcp"
    },
    "users": {
      "reader": ""
    },
    "user": "reader",
    "key": "",
    "protected": true,
    "ip": "10.73.0.70",
    "ram": 0
  },
  {
    "id": "gate",
    "zone": "EDGE",
    "links": [
      "relay",
      "dispatch",
      "spool",
      "switch",
      "codec"
    ],
    "ports": {
      "4300": {
        "name": "meshgate",
        "version": "2.3",
        "banner": "routing controller; actions: status, policy, permit"
      }
    },
    "files": {
      "/srv/docs/gate.txt": "Le réseau interne exige un mandat de transport valide. permit <référence> <code> ; la référence et le code sont dans le reçu original. Les zones accessibles sont visibles dans net.",
      "/var/log/routes.log": "03:17 INTERNAL blocked / no custody permit",
      "/etc/hostname": "gate",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "meshgate 4300/tcp"
    },
    "users": {
      "guest": ""
    },
    "ip": "10.73.0.80",
    "ram": 0
  },
  {
    "id": "switch",
    "zone": "INNER",
    "links": [
      "gate",
      "codec",
      "archive",
      "journal",
      "workbench"
    ],
    "ports": {
      "4301": {
        "name": "mesh",
        "version": "1.0",
        "banner": "internal relay"
      }
    },
    "files": {
      "/srv/docs/switch.txt": "Relais interne. proxy add switch fournit 6 MiB pour les tâches virtuelles.",
      "/etc/hostname": "switch",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "mesh 4301/tcp"
    },
    "users": {
      "guest": ""
    },
    "ram": 6,
    "proxy": true,
    "ip": "10.73.1.10"
  },
  {
    "id": "codec",
    "zone": "INNER",
    "links": [
      "gate",
      "switch",
      "archive",
      "journal"
    ],
    "ports": {
      "4401": {
        "name": "chunks",
        "version": "1.4",
        "banner": "read-only fragments, actions: list, meta, slice"
      }
    },
    "files": {
      "/srv/docs/chunks.txt": "Le flux exporté est encodé en base64. meta <id> indique la taille ; slice <id> <offset> <taille> limite chaque lecture à 8 caractères. Les morceaux du même lot sont numérotés à partir de zéro.",
      "/srv/index.csv": "id,batch,part,encoding\nA17,C17,0,base64\nA19,C19,0,base64",
      "/etc/hostname": "codec",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "chunks 4401/tcp"
    },
    "users": {
      "guest": ""
    },
    "ip": "10.73.1.20",
    "ram": 0
  },
  {
    "id": "archive",
    "zone": "INNER",
    "links": [
      "switch",
      "codec",
      "journal",
      "notary",
      "workbench"
    ],
    "ports": {
      "4402": {
        "name": "revision",
        "version": "3.6",
        "banner": "revision service; actions: list, diff, read"
      }
    },
    "files": {
      "/srv/docs/revision.txt": "read <id> vérifie les droits. diff <base> <revision> vérifie uniquement la base puis retourne la différence. Les exports historiques comportent des données périmées.",
      "/srv/revisions/index.csv": "id,batch,part\nold,C16,1\nr17,C17,1\nr19,C19,1",
      "/srv/revisions/old.txt": "C16|1|TERRAIN",
      "/srv/revisions/r17.txt": "C17|1|EMBER",
      "/srv/revisions/r19.txt": "C19|1|DUSK",
      "/etc/hostname": "archive",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "revision 4402/tcp"
    },
    "users": {
      "guest": ""
    },
    "ip": "10.73.1.30",
    "ram": 0
  },
  {
    "id": "journal",
    "zone": "INNER",
    "links": [
      "switch",
      "codec",
      "archive",
      "notary"
    ],
    "ports": {
      "4403": {
        "name": "events",
        "version": "2.1",
        "banner": "filtered log stream"
      }
    },
    "files": {
      "/var/log/queue.log": "03:41 C19 CANCEL\n03:43 C17 EXPORT part=0 codec:A17\n03:44 C17 EXPORT part=1 archive:r17\n03:45 C17 EXPORT part=2 journal:tail\n03:46 C17 ACK all",
      "/srv/export/tail.part": "C17|2|NORTH",
      "/srv/export/old.part": "C16|2|WEST",
      "/etc/hostname": "journal",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "events 4403/tcp"
    },
    "users": {
      "guest": ""
    },
    "ip": "10.73.1.40",
    "ram": 0
  },
  {
    "id": "workbench",
    "zone": "INNER",
    "links": [
      "switch",
      "archive",
      "compute",
      "sentinel"
    ],
    "ports": {
      "4500": {
        "name": "scheduler",
        "version": "4.0",
        "banner": "distributed diagnostics"
      }
    },
    "files": {
      "/srv/docs/scheduler.txt": "Le snapshot de diagnostic consomme 12 MiB et exige deux relais. Une tâche capture consomme 4 MiB. Le générateur de charge fork consomme 6 MiB ; il crée uniquement des workers fictifs dans la file de surveillance. Le verrou du snapshot est levé tant que la file est saturée. Les tâches fork s’arrêtent automatiquement après 8 opérations. man jobs.",
      "/var/log/scheduler.log": "03:58 snapshot requested / local memory insufficient",
      "/etc/hostname": "workbench",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "scheduler 4500/tcp"
    },
    "users": {
      "guest": ""
    },
    "ram": 6,
    "proxy": true,
    "ip": "10.73.1.50"
  },
  {
    "id": "notary",
    "zone": "INNER",
    "links": [
      "archive",
      "journal",
      "compute",
      "sentinel"
    ],
    "ports": {
      "4501": {
        "name": "notary",
        "version": "1.2",
        "banner": "manifest validation"
      }
    },
    "files": {
      "/srv/docs/manifest.txt": "Le format du manifeste est LOT|partie0|partie1|partie2. Les parties sont au format LOT|index|valeur. assemble <3 fichiers> [sortie] reconstruit le manifeste. Les fragments doivent être du même lot.",
      "/etc/hostname": "notary",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "notary 4501/tcp"
    },
    "users": {
      "guest": ""
    },
    "ip": "10.73.1.60",
    "ram": 0
  },
  {
    "id": "compute",
    "zone": "INNER",
    "links": [
      "workbench",
      "notary",
      "sentinel",
      "uplink"
    ],
    "ports": {
      "4502": {
        "name": "memory",
        "version": "2.8",
        "banner": "diagnostic memory image; guard enforced by sentinel"
      }
    },
    "files": {
      "/srv/docs/memory.txt": "Le snapshot exige une fenêtre de maintenance ou un mode diagnostic de secours. Interroger sentinel et examiner ses journaux. Une fois le snapshot lancé, il continue même si la fenêtre se ferme. Les anciennes sessions sont des leurres.",
      "/var/log/runtime.log": "04:02 diagnostic C17 active session M-42\n04:03 stale M-31 discarded",
      "/etc/hostname": "compute",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "memory 4502/tcp"
    },
    "users": {
      "guest": ""
    },
    "ip": "10.73.1.70",
    "ram": 0
  },
  {
    "id": "sentinel",
    "zone": "INNER",
    "links": [
      "workbench",
      "notary",
      "compute",
      "uplink"
    ],
    "ports": {
      "4503": {
        "name": "monitor",
        "version": "2.0",
        "banner": "trace monitor; actions: status, window, maintenance"
      }
    },
    "files": {
      "/srv/docs/monitor.txt": "La surveillance bloque les snapshots pendant la période d’observation. Une fenêtre de maintenance peut être ouverte par un bail valide ; une ancienne révision du journal mentionne le dernier bail de test. Une saturation temporaire des workers déclenche également le mode diagnostic de secours. trace wait réduit le signal.",
      "/var/log/monitor.log": "04:01 monitor active\n04:02 MAINTENANCE lease=OBS-14 window=8 state=expired\n04:03 MAINTENANCE lease=OBS-17 window=8 state=valid\n04:04 snapshot blocked: monitor owns guard",
      "/etc/hostname": "sentinel",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "monitor 4503/tcp"
    },
    "users": {
      "guest": ""
    },
    "ip": "10.73.1.80",
    "ram": 0
  },
  {
    "id": "uplink",
    "zone": "INNER",
    "links": [
      "compute",
      "sentinel",
      "audit",
      "keyring"
    ],
    "ports": {
      "4600": {
        "name": "uplink",
        "version": "3.0",
        "banner": "custody routing; actions: status, permit"
      }
    },
    "files": {
      "/srv/docs/uplink.txt": "Le second réseau exige le jeton de session actif extrait du snapshot. permit <session> <jeton>. Les sessions annulées ne passent pas.",
      "/var/log/uplink.log": "04:04 AUDIT blocked / active session required",
      "/etc/hostname": "uplink",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "uplink 4600/tcp"
    },
    "users": {
      "guest": ""
    },
    "ip": "10.73.1.90",
    "ram": 0
  },
  {
    "id": "audit",
    "zone": "AUDIT",
    "links": [
      "uplink",
      "keyring",
      "clock",
      "records"
    ],
    "ports": {
      "4601": {
        "name": "audit",
        "version": "5.1",
        "banner": "event evidence; actions: query, schema"
      }
    },
    "files": {
      "/srv/docs/audit.txt": "Les événements bruts sont stockés en UTC. La machine clock possède les offsets de chaque source. Les événements de même transaction ont le même identifiant TX.",
      "/srv/log/audit.csv": "local,source,tx,action\n09:14,alpha,T-77,REQUEST\n09:20,beta,T-77,APPROVE\n09:21,beta,T-80,DENY\n09:15,alpha,T-81,TEST\n09:18,alpha,T-77,COMMIT",
      "/etc/hostname": "audit",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "audit 4601/tcp"
    },
    "users": {
      "guest": ""
    },
    "ip": "10.73.2.10",
    "ram": 0
  },
  {
    "id": "keyring",
    "zone": "AUDIT",
    "links": [
      "uplink",
      "audit",
      "clock",
      "records",
      "review"
    ],
    "ports": {
      "4602": {
        "name": "tokens",
        "version": "1.9",
        "banner": "session registry"
      }
    },
    "files": {
      "/srv/sessions.csv": "session,tx,state\nM-31,T-80,REVOKED\nM-42,T-77,ACTIVE\nM-50,T-81,TEST",
      "/srv/docs/identity.txt": "Une transaction active doit être corrélée à sa session. Ne pas confondre les événements de test et les refus.",
      "/etc/hostname": "keyring",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "tokens 4602/tcp"
    },
    "users": {
      "guest": ""
    },
    "ip": "10.73.2.20",
    "ram": 0
  },
  {
    "id": "clock",
    "zone": "AUDIT",
    "links": [
      "audit",
      "keyring",
      "review"
    ],
    "ports": {
      "4603": {
        "name": "time",
        "version": "2.0",
        "banner": "clock offsets, actions: status"
      }
    },
    "files": {
      "/srv/time/offsets.csv": "source,minutes_to_utc\nalpha,-4\nbeta,-9",
      "/srv/docs/time.txt": "minutes_to_utc est à ajouter à l’heure locale. reconstruct <journal> <offsets> <transaction> [sortie] normalise et trie les événements de cette transaction.",
      "/etc/hostname": "clock",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "time 4603/tcp"
    },
    "users": {
      "guest": ""
    },
    "ip": "10.73.2.30",
    "ram": 0
  },
  {
    "id": "records",
    "zone": "AUDIT",
    "links": [
      "audit",
      "keyring",
      "review",
      "registry"
    ],
    "ports": {
      "4700": {
        "name": "records",
        "version": "1.5",
        "banner": "document records; actions: index, read, preview"
      }
    },
    "files": {
      "/srv/docs/records.txt": "Le document final est scellé. Le registre d’autorisations est sur registry. Le service preview impose une limite de 10 caractères par lecture, mais les documents protégés doivent être ouverts par le registre, pas reconstitués via preview.",
      "/srv/records/T-77.txt": "T-77|MARA|ORDER-17|SEALED",
      "/srv/records/T-80.txt": "T-80|REJECTED",
      "/etc/hostname": "records",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nauditor:x:1000:1000:Operator:/home/auditor:/bin/mesh",
      "/etc/services": "records 4700/tcp"
    },
    "users": {
      "auditor": ""
    },
    "user": "auditor",
    "protected": true,
    "ip": "10.73.2.40",
    "ram": 0
  },
  {
    "id": "review",
    "zone": "AUDIT",
    "links": [
      "keyring",
      "clock",
      "records",
      "registry",
      "press"
    ],
    "ports": {
      "4701": {
        "name": "review",
        "version": "2.4",
        "banner": "review tickets; actions: list, inspect, compare"
      }
    },
    "files": {
      "/srv/docs/review.txt": "inspect <révision> lit un ticket public. compare <base> <révision> vérifie seulement la base. Le ticket R17 contient le rôle à rétablir et la référence de mandat.",
      "/srv/review/R16.txt": "R16|TEST|viewer",
      "/srv/review/R17.txt": "R17|T-77|auditor|MANDAT-9",
      "/etc/hostname": "review",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "review 4701/tcp"
    },
    "users": {
      "guest": ""
    },
    "ip": "10.73.2.50",
    "ram": 0
  },
  {
    "id": "registry",
    "zone": "AUDIT",
    "links": [
      "records",
      "review",
      "press"
    ],
    "ports": {
      "4702": {
        "name": "grants",
        "version": "2.7",
        "banner": "ACL registry; actions: list, delegate"
      }
    },
    "files": {
      "/srv/docs/grants.txt": "delegate <hôte> <rôle> <mandat> restaure une autorisation approuvée. Les mandats expirés sont refusés.",
      "/var/log/acl.log": "04:18 records auditor revoked via stale sync\n04:19 R17 approved / delegation permitted",
      "/etc/hostname": "registry",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "grants 4702/tcp"
    },
    "users": {
      "guest": ""
    },
    "ip": "10.73.2.60",
    "ram": 0
  },
  {
    "id": "press",
    "zone": "AUDIT",
    "links": [
      "review",
      "registry",
      "records"
    ],
    "ports": {
      "4800": {
        "name": "publish",
        "version": "1.0",
        "banner": "final distribution"
      }
    },
    "files": {
      "/srv/docs/publish.txt": "Les pièces validées sont conservées dans le coffre de l’opérateur. La diffusion finale distingue le dépôt sous scellés et la publication anonymisée.",
      "/srv/messages/consent.txt": "MARA : Je souhaite que l’ordre soit public, mais je refuse la publication de mes données personnelles. Le rapport anonymisé est suffisant.",
      "/etc/hostname": "press",
      "/etc/os-release": "NAME=\"MESH/OS\"\nVERSION=\"3.8\"",
      "/etc/passwd": "root:x:0:0:root:/root:/bin/mesh\nguest:x:1000:1000:Operator:/home/guest:/bin/mesh",
      "/etc/services": "publish 4800/tcp"
    },
    "users": {
      "guest": ""
    },
    "ip": "10.73.2.70",
    "ram": 0
  }
];
export const missions=[
  {
    "title": "Le dossier effacé",
    "from": "Iris / permanence",
    "subject": "Un incident n'a pas existé",
    "body": "Un dossier de détention a été révisé cette nuit. Identifie l'événement original dans dispatch, puis récupère le reçu scellé de spool. Les services sont interrogeables sans session shell : probe <hôte>, svc <hôte> <port> help. Les documents publics peuvent expliquer leur fonctionnement. Un bail de lecture autorisé donne accès à spool. Soumets le reçu via submit depuis n'importe quelle machine.",
    "needed": "reçu original"
  },
  {
    "title": "Au-delà du pare-feu",
    "from": "Iris / permanence",
    "subject": "Rétablir un chemin",
    "body": "Le reçu contient un mandat de transport. Le contrôleur gate peut l'accepter. Trouve son port et consulte son protocole. Ouvre la route interne, puis valide avec submit route. Tu n'as pas besoin de revenir sur desk.",
    "needed": "route interne"
  },
  {
    "title": "Un export incomplet",
    "from": "Mara / canal sécurisé",
    "subject": "Trois fragments",
    "body": "Un export a été fractionné avant sa suppression. Les journaux internes indiquent le bon lot, les services codec et archive permettent de récupérer les morceaux. Recompose les fichiers avec le shell, puis assemble <3 fichiers> [sortie]. Utilise /vault pour partager tes fichiers entre les machines. Soumets le manifeste.",
    "needed": "manifeste reconstruit"
  },
  {
    "title": "Mémoire distribuée",
    "from": "Iris / permanence",
    "subject": "Une session encore active",
    "body": "Il faut obtenir le snapshot de compute. Le service de surveillance le bloque en temps normal. Examine sentinel : une fenêtre de maintenance ou une saturation temporaire des workers virtuels permet de lancer le diagnostic. Il faut également suffisamment de RAM répartie sur deux relais. man jobs. Le snapshot contient une session active et des leurres. Soumets un fichier contenant uniquement SESSION|JETON pour la session active.",
    "needed": "session et jeton actifs"
  },
  {
    "title": "Les horloges divergent",
    "from": "Mara / canal sécurisé",
    "subject": "Prouver la chronologie",
    "body": "Le jeton actif permet d'ouvrir le second réseau via uplink. Une transaction doit être reconstruite à partir du journal et des décalages de source. Identifie la bonne transaction dans keyring. Utilise reconstruct ou construis toi-même le fichier normalisé. man reconstruct. Soumets la chronologie.",
    "needed": "chronologie UTC"
  },
  {
    "title": "Le mandat révoqué",
    "from": "Iris / permanence",
    "subject": "Une permission perdue",
    "body": "La preuve de l'ordre est sur records. Le mandat de restauration est dans review, mais les droits de lecture ont été altérés. Examine les ports et le comportement des opérations de révision. Rétablis l'autorisation via registry, puis récupère l'ordre et soumets-le.",
    "needed": "ordre original"
  },
  {
    "title": "Publication",
    "from": "Mara / canal sécurisé",
    "subject": "Notre histoire, notre choix",
    "body": "Nous avons validé le dossier ensemble. Je souhaite que l'ordre soit rendu public sans mes données personnelles. Lis /srv/messages/consent.txt sur press si tu veux. Tu peux choisir publish public ou publish sealed depuis press. L'option publique anonymise les pièces. La décision finale reste à toi.",
    "needed": "diffusion finale"
  }
];
