# BorosCode website – AI munkamenet-kezdés

Minden weboldal-, Cloudflare-, domain-, DNS-, proxy- vagy telepítési feladat **előtt** olvasd el a **privát** `borosdavid/borosCode-knowledge` repository `main` ágának legfrissebb `AGENTS.md`, `knowledge/KOZOS_TUDASTAR.md`, `knowledge/ALLAPOT.md` és szükség esetén `knowledge/DONTESI_NAPLO.md` fájljait. Ez az egyetlen hiteles központi tudástár a privát és publikus technikai kontextushoz:

https://github.com/borosdavid/borosCode-knowledge/blob/main/knowledge/KOZOS_TUDASTAR.md

Ezután olvasd el ennek a repositorynak a README.md fájlját, a wrangler.jsonc konfigurációját és az érintett forrásfájlokat, ellenőrizd az aktuális main commitot és a valós telepítési állapotot.

- Ez a repó a boroscode.com nyilvános főoldala; az Otthontár alkalmazáskódja a külön borosdavid/borosCode repóban van.
- A boroscode.com/otthontar/ útvonal külön háttérrendszerhez tartozik. Az útvonalszabályokat és auth-védelmet ne változtasd meg ellenőrzés nélkül.
- A közös tudástárban nyitott CSS/JS 404 hibák szerepelnek 2026-11-24-ről; az ok csak tényleges hibakeresés után jelölhető igazoltnak.
- A konfiguráció titkait kizárólag Cloudflare Secrets / más megfelelő titoktárolás kezelje; GitHubra, még privát repóba se kerüljön jelszó, token vagy privát kulcs.
- Módosítás előtt ellenőrizd a távoli aktuális állapotot, ne írj felül párhuzamos változásokat, és a feladat végén frissítsd a privát közös tudástár ellenőrzött döntéseit külön commitban, a privát repo `main` ágán. Ha az nem érhető el, jelezd; ne találgass.
- Másik gép vagy beszélgetés nem publikált változásai automatikusan nem láthatók.
