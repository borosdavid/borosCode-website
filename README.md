# BorosCode

A [boroscode.com](https://boroscode.com/) nyilvános, magyar nyelvű projektfőoldala. A kezdőoldal tartalma a `public/index.html`, a megjelenés a `public/styles.css` fájlban szerkeszthető. Az első bemutatott projekt az Otthontár.

## Helyi ellenőrzés

Node.js 22 vagy újabb verzióval, a repository gyökerében:

```sh
npm ci
npm run dev
npm run check
```

A `dev` a helyi előnézetet indítja, a `check` telepítés nélkül próbálja ki a Wrangler csomagolását.

## Cloudflare Workers Builds

| Beállítás | Érték |
| --- | --- |
| GitHub repository | `borosdavid/borosCode-website` |
| Production branch | `main` |
| Root directory | `/` |
| Build command | Üresen maradhat |
| Deploy command | `npm run deploy` |
| Node.js | 22 vagy újabb |

A `wrangler.jsonc` megadja a Worker nevét és a publikálandó `public/` könyvtárat. A `name` értékének egyeznie kell a Cloudflare-ben már létrehozott Worker nevével. Az alapértelmezett érték `boroscode-website`. A már a Workerhez rendelt `boroscode.com` egyéni domaint a Workers Builds beállításakor meg lehet tartani.

A betűtípus a Space Grotesk, licencszövege a `licenses/space-grotesk.txt` fájlban található. A tárolódobozok illusztrációja a főoldalhoz készült.

## Otthontár a főoldalról

A főoldal gombja a `https://boroscode.com/otthontar/` útvonalra visz. A Worker innen az Otthontár szerverére továbbítja a kéréseket. A leltárba az Otthontár saját felhasználónevével és jelszavával lehet belépni.

### Jelenlegi Ubuntu-alapú éles útvonal (2026-11-24-i dokumentált állapot)

A jelenlegi nyilvános `/otthontar/` útvonal a Cloudflare Worker és Tunnel mögötti **Ubuntu**-példányhoz kapcsolódik; a Windowsos leírás alább **elkülönített, opcionális tesztpéldányhoz** tartozik, nem az éles kiszolgáló kötelező telepítése. A rendszer állapotát és az Ubuntu-frissítés menetét az [Otthontár projektállapota](https://github.com/borosdavid/borosCode/blob/main/projekt/ALLAPOT.md), a [távoli hozzáférési leírás](https://github.com/borosdavid/borosCode/blob/main/projekt/SZERVER-TAVOLI-HOZZAFERES.md) és a [dev Ubuntu frissítési útmutató](https://github.com/borosdavid/borosCode/blob/dev/docs/KNOWHOW-ubuntu-frissites.md) tárgyalja. A Cloudflare-fiókban ténylegesen beállított tunnel és origin aktuális értékeit külön kell ellenőrizni.

**Nyitott üzemeltetési hiba:** az Otthontár HTML által generált, tartalomhash-es CSS/JS/manifest URL-ek közül több 404-et kap. A Worker `src/worker.js` allowlistája jelenleg csak az alapneveket engedi. A feladatot a [privát konzisztencia-vizsgálat](https://github.com/borosdavid/borosCode-knowledge/blob/main/reviews/2026-11-24-KONZISZTENCIA.md) dokumentálja. Ez a README-frissítés **nem jelent kódjavítást vagy újratelepítést**.

### Cloudflare – a korábbi Windows-tesztkonfiguráció részletei

Az alábbi korábbi Cloudflare-lépések egy Windows tesztoriginre (`127.0.0.1:18740`) vonatkoznak. Ne alkalmazd őket változatlanul az Ubuntu éles példányára.

### A Windows-tesztpéldány beállítása

A `borosdavid/borosCode` repó friss `dev` munkapéldányában:

```powershell
.\scripts\Build.ps1
# Ha a natív tesztpéldány már fut, állítsd le a helyi tesztprofilt.
# .\scripts\Start.ps1 -TestRun -Stop
$env:BIND_ADDRESS = '127.0.0.1'
$env:PUBLIC_ORIGIN = 'https://boroscode.com'
$env:APP_CONTEXT_PATH = '/otthontar'
$env:SESSION_COOKIE_SECURE = 'true'
$env:APP_UPLOAD_MAX_REQUEST_SIZE = '90MB'
.\scripts\Start.ps1 -TestRun -Native -NoBrowser
```

A helyi ellenőrző végpont `http://127.0.0.1:18740/otthontar/actuator/health`. Ha még nincs tesztfiók, PowerShellben futtasd a `.\scripts\Account.ps1 -TestRun -Action create -UserName david` parancsot. A jelszót a gépen adhatod meg. A tesztprofil külön MySQL-adatbázist és képmappát használ.

### Cloudflare beállítás

1. Tartsd meg a **Workers Free** és a **Zero Trust Free** csomagot. A `boroscode.com` egyéni domain maradjon a `boroscode-website` Workeren.
2. A **Zero Trust → Access controls → Service credentials → Service Tokens** alatt hozz létre egy `boroscode-website` szolgáltatási tokent. Jegyezd fel a kliensazonosítót, a titkot és a lejáratot.
3. A **Zero Trust → Access controls → Applications** alatt hozz létre egy **Self-hosted** alkalmazást a teljes `otthontar-origin.boroscode.com` hostnévre. Állíts be **Service Auth** szabályt, amely csak az előbb létrehozott tokent engedi. A háttérhost szabályára az alkalmazás útvonala mellett a többi útvonal is tartozzon.
4. A **Networking → Tunnels** alatt hozz létre tunnelt. A `cloudflared` csatlakozót a tesztpéldányt futtató Windows-gépen indítsd. A tunnel **Routes → Add route → Published application** alatt a hostnév legyen `otthontar-origin.boroscode.com`, a **Path** maradjon üres, a szolgáltatás pedig `http://127.0.0.1:18740`. Az origin beállításainál állítsd a **HTTP Host Header** értékét `boroscode.com`-ra, és kapcsold be a **Protect with Access** ellenőrzést az előbb létrehozott Access-alkalmazással.
5. A `boroscode-website` Worker **Settings → Variables and Secrets** menüjében adj hozzá két **Secret** értéket. Az `OTTHONTAR_ACCESS_CLIENT_ID` a kliensazonosító, az `OTTHONTAR_ACCESS_CLIENT_SECRET` a kliens titka. Ezzel telepítsd az új beállításokat. A két érték a Worker és az origin közötti hitelesítéshez tartozik. Lejárat előtt frissítsd őket.
6. Próbáld ki a `https://boroscode.com/otthontar/` címet. Ellenőrizd a bejelentkezést, a leltárt és egy tesztfotó feltöltését, majd kijelentkezés után a leltár újbóli megnyitását. A háttérhost közvetlen megnyitását a szolgáltatási token szabálya elutasítja.

Az alkalmazásfelhasználóknak az Otthontár saját belépése elegendő. Ha külön Cloudflare e-mailes ellenőrzést is szeretnél, akkor a `boroscode.com/otthontar` útvonalra és minden alútvonalára állíts be Access-szabályt. A háttérhost Service Auth alkalmazása ettől függetlenül szükséges.

A 90 MiB-os mentési korlát a Cloudflare Free 100 MB-os kérésméret-határán belül marad. A **Windowsos tesztorigin** eléréséhez a Windows-gépnek és a hozzá tartozó tunnelnek futnia kell. Az éles Ubuntu-környezetet ez a feltétel nem írja le.

[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/) · [Access service token](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/) · [Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
