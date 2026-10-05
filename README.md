# 🐰 Zajko Utekajko

Hra pre deti (cca 10 rokov): zajko beží po poli, zbiera mrkvičky a uteká pred kombajnom.

**Hrať:** https://opinko.github.io/rabbit-game/

## Ako sa hrá

- Zajko beží sám dopredu. Ovládaš ho **len hore a dole** – šípky ↑ ↓ (alebo W / S),
  na mobile ťukni nad / pod zajka alebo potiahni prstom.
- 🥕 **Mrkvy sú body.** Veľa mrkiev za sebou bez nárazu = **KOMBO** (násobič bodov).
- Za zajkom celý čas ide **kombajn**. Na začiatku ide rovnako rýchlo ako zajko,
  ale postupne zrýchľuje – a každý ďalší level je rýchlejší.
- 👟 **Rýchle topánky** (3 v každom leveli) zrýchlia zajka natrvalo. Bez nich kombajn zajka dobehne.
- ⚡ Turbo (prerazí prekážky), 🧲 magnet na mrkvy, 🫧 ochranná bublina, 🔧 kľúč, ktorý pokazí kombajn.
- Kamene, bahno, balíky sena a ježkovia zajka spomalia.
- Na konci levelu zajko dobehne do stodoly a vyberie si **trvalé vylepšenie** (rýchlosť, magnet, bublina, turbo, šťastie, kombo).
- Keď kombajn zajka dobehne – **ŠPLECH!** fialový fľak a koniec hry. Level sa dá skúsiť znova.

Postup (rozohraná hra, vylepšenia, rekord, nastavenia zvuku) sa ukladá do `localStorage` prehliadača.

## Technológie

- [Phaser 4](https://phaser.io/) + TypeScript + [Vite](https://vite.dev/)
- Celá grafika je vektorová (SVG generované v kóde), zvuky a hudba sú syntetizované cez Web Audio API – žiadne externé súbory.
- Čisto statická (serverless) aplikácia, nasadzovaná cez GitHub Actions na GitHub Pages.

## Vývoj

```bash
npm install
npm run dev      # lokálny server
npm run build    # produkčný build do dist/
```

Otvorením s `?debug` sa objekt hry sprístupní ako `window.game` (na automatické testy).

## Nasadenie

Workflow `.github/workflows/deploy.yml` pri každom pushi zbuildí hru a nasadí ju na GitHub Pages.
V nastaveniach repozitára musí byť **Settings → Pages → Source: GitHub Actions**.
