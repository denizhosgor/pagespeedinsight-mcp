# @denizhosgor/pagespeedinsight-mcp

## Desteklenen Platformlar

<p>
  <a href="https://openclaw.ai">
    <img src="https://avatars.githubusercontent.com/u/252820863?s=64&v=4" alt="OpenClaw Logo" height="34" />
  </a>
  <a href="https://paperclip.ing">
    <img src="https://avatars.githubusercontent.com/u/264498616?s=64&v=4" alt="Paperclip Logo" height="34" />
  </a>
</p>

![OpenClaw](https://img.shields.io/badge/OPENCLAW-SUPPORTED-2563EB?style=for-the-badge&labelColor=4B5563)
![Paperclip](https://img.shields.io/badge/PAPERCLIP-SUPPORTED-1D4ED8?style=for-the-badge&labelColor=4B5563)
![Build](https://img.shields.io/badge/BUILD-PASSING-44CC11?style=for-the-badge&labelColor=4B5563)
![Tests](https://img.shields.io/badge/TESTS-PASSING-44CC11?style=for-the-badge&labelColor=4B5563)
![Vulnerabilities](https://img.shields.io/badge/VULNERABILITIES-0%20HIGH%2FCRITICAL-44CC11?style=for-the-badge&labelColor=4B5563)
![Release](https://img.shields.io/npm/v/%40denizhosgor%2Fpagespeedinsight-mcp?style=for-the-badge&label=RELEASE&labelColor=4B5563)
![License](https://img.shields.io/badge/LICENSE-MIT-007EC6?style=for-the-badge&labelColor=4B5563)

Google PageSpeed Insights'i MCP tool olarak sunan Node.js paketidir.

## Node.js Uyumlulugu

- Desteklenen Node.js surumleri: `20`, `22`, `24`
- Lokal gelistirme varsayilani: en guncel Node.js `24` (`.nvmrc` = `24`)

## Kurulum

Global:

```bash
npm install -g @denizhosgor/pagespeedinsight-mcp
```

Calistirma:

```bash
pagespeedinsight-mcp
```

NPX:

```bash
npx -y @denizhosgor/pagespeedinsight-mcp
```

## API Anahtari

Anahtari sadece ortam degiskeni olarak verin (chat/log icine yazmayin):

```bash
export GOOGLE_API_KEY="YOUR_KEY"
# Bu paket icin desteklenen alternatif ad:
export PAGESPEEDINSIGHT_API_KEY="YOUR_KEY"
```

Iki degisken birden varsa `PAGESPEEDINSIGHT_API_KEY` onceliklidir.

## OpenClaw Kurulumu

1. MCP sunucusunu kaydet:

```bash
openclaw mcp set pagespeed-insights '{"command":"npx","args":["-y","@denizhosgor/pagespeedinsight-mcp"]}'
```

2. OpenClaw skill dosyasini kur (paket komutu ile):

```bash
pagespeedinsight-mcp install-skill --openclaw-dir /absolute/path/to/openclaw --chown node:node
```

3. Skill yuklendigini kontrol et:

```bash
openclaw skills list
```

4. Yeni oturum acip runtime tool listesini kontrol et:

```text
/new
/tools verbose
```

Skill'i manuel kopyalamak istersen dizin:

```text
openclaw/skills/pagespeed_insights
```

### Allowlist Notu

OpenClaw tarafinda skill allowlist kullaniyorsan `pagespeed_insights` ekle:

```json
{
  "agents": {
    "defaults": {
      "skills": ["pagespeed_insights"]
    }
  }
}
```

## Mevcut Toollar

MCP (OpenClaw ve MCP istemcileri):

- `run_pagespeed`
- `compare_pagespeed`

Sadece Paperclip:

- `check_plugin_version`

## Raporlama

- Her tool cagrisinda JSON rapor yazilir ve `saved_report_path` doner.
- Varsayilan rapor klasoru: `<cwd>/report`
- Dosya formati: `<url>-<timestamp>.json`
- Klasoru degistirmek icin: `PAGESPEEDINSIGHT_REPORT_DIR=/custom/path`

`run_pagespeed` sonucu: `request_context`, `summary`, opsiyonel `raw`, `saved_report_path`.

`compare_pagespeed` sonucu: `request_context`, `mobile`, `desktop`, `performance_delta_desktop_minus_mobile`, `saved_report_path`.

## Paperclip Plugin Destegi

Bu paket Paperclip manifest + worker dosyalarini da icerir (`src/manifest.ts`, `src/worker.ts`).

- `package.json > paperclipPlugin`
- Worker girisi: `dist/worker.js`
- Manifest girisi: `dist/manifest.js`
- Yetkiler:
  - `agent.tools.register`
  - `http.outbound`
- Kayitli Paperclip toollari:
  - `pagespeedinsight-mcp:run_pagespeed`
  - `pagespeedinsight-mcp:compare_pagespeed`
  - `pagespeedinsight-mcp:check_plugin_version`

Health cevabinda otomatik registry surum kontrolu varsayilan kapali gelir.
Gerekirse ac:

```bash
export PAGESPEEDINSIGHT_HEALTH_VERSION_CHECK=true
```

## Guvenlik Notlari

- npm lifecycle install script'i (`postinstall`) yoktur.
- Varsayilan outbound host allowlist: `www.googleapis.com`
- Gerekirse allowlist degistir:

```bash
export PAGESPEEDINSIGHT_ALLOWED_OUTBOUND_HOSTS=www.googleapis.com
```

- HTTP hata cevaplari tool'a donmeden once sadeleştirilir.

## OpenClaw Skill Dosyasi

- Repo yolu: `openclaw/skills/pagespeed_insights/SKILL.md`
- Paket icindeki fallback: `skills/SKILL.md`

## Gelistirme ve Test

```bash
npm install
npm run build
npm run typecheck
npm run check
npm test
```

## Guvenlik ve Yayin Oncesi Kontroller

```bash
npm run security:prod
npm run security:full
npm run release:check
```
