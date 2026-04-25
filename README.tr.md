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

Google PageSpeed Insights'i MCP tool olarak sunan Node.js sunucu paketi.

OpenClaw ve MCP uyumlu diğer projelerdeki ajanlar bu sunucu ile:
1. Sayfa için detaylı PageSpeed raporu alabilir.
2. Rapordaki hata ve iyileştirme fırsatlarını analiz edebilir.
3. Sonuçlara göre optimizasyon yapıp tekrar ölçüm döngüsüne alabilir.

## Node.js uyumlulugu

- Desteklenen surumler: Node.js `20`, `22`, `24`
- Lokal gelistirme varsayilan hedefi: en guncel Node.js `24` (`.nvmrc` = `24`)

## Kurulum ve çalıştırma

Global kurulum:
```bash
npm install -g @denizhosgor/pagespeedinsight-mcp
pagespeedinsight-mcp
```

NPX ile çalıştırma:
```bash
npx -y @denizhosgor/pagespeedinsight-mcp
```

Opsiyonel API anahtarı:
```bash
export PAGESPEEDINSIGHT_API_KEY=YOUR_API_KEY
```

## OpenClaw MCP konfigürasyonu

Global paket ile:
```json
{
  "mcpServers": {
    "pagespeedinsight": {
      "command": "pagespeedinsight-mcp",
      "env": {
        "PAGESPEEDINSIGHT_API_KEY": "YOUR_KEY_OPTIONAL"
      }
    }
  }
}
```

## Paperclip plugin destegi

Bu paket resmi scaffold akisina uygun Paperclip plugin manifest + worker yapisini da icerir (`src/manifest.ts`, `src/worker.ts`).

- Paket baglanti alani: `package.json > paperclipPlugin`
- Manifest kaynak dosyasi: `src/manifest.ts` (`dist/manifest.js` olarak derlenir)
- Plugin id: `pagespeedinsight-mcp`
- Worker kaynak dosyasi: `src/worker.ts` (`dist/worker.js` olarak derlenir)
- Yetkiler:
  - `agent.tools.register`
  - `http.outbound`
- Paperclip tool adlari:
  - `pagespeedinsight-mcp:run_pagespeed`
  - `pagespeedinsight-mcp:compare_pagespeed`

Cift giris noktasi davranisi:
- OpenClaw (MCP istemcileri) paket `bin` yolunu (`pagespeedinsight-mcp`) ve stdio MCP protokolunu kullanir.
- Paperclip runtime MCP `bin` kismini kullanmaz, `paperclipPlugin.worker` yolunu yukler.

NPX ile:
```json
{
  "mcpServers": {
    "pagespeedinsight": {
      "command": "npx",
      "args": ["-y", "@denizhosgor/pagespeedinsight-mcp"],
      "env": {
        "PAGESPEEDINSIGHT_API_KEY": "YOUR_KEY_OPTIONAL"
      }
    }
  }
}
```

## Mevcut tool'lar

- `run_pagespeed`
- `compare_pagespeed`
- Ham rapor JSON dosyasi otomatik olarak `report/<url>-<timestamp>.json` altina kaydedilir
- Kayit dizinini degistirmek icin: `PAGESPEEDINSIGHT_REPORT_DIR=/ozel/yol`

## Raporlama ve sonuc yapisi

- Her tool cagrisi diskte rapor dosyasi uretir ve `saved_report_path` dondurur.
- Varsayilan klasor: `<calisma-dizini>/report`
- Dosya adi formati: `<normalize-url>-<timestamp>.json`
- Timestamp formati: dosya adina uygun UTC ISO benzeri format.
- `run_pagespeed` icin varsayilan strategy: `desktop`
- `categories` gonderilmezse varsayilan olarak sadece `performance` kategorisi istenir.
- Her iki tool icin desteklenen opsiyonel query alanlari:
  - `utm_campaign`
  - `utm_source`
  - `captcha_token` (PSI API'ye `captchaToken` olarak gider)

`run_pagespeed` sonucu:
- `request_context`
- `summary`: normalize edilmis skorlar ve metrikler
- `summary.api_metadata` (`kind`, `analysis_utc_timestamp`, `pagespeed_version` vb.)
- `summary.lighthouse_context` (`requested_url`, `final_url`, `run_warnings`, `runtime_error`, `config_settings`)
- `summary.loading_experience.metrics` / `summary.origin_loading_experience.metrics`
- `saved_report_path`: ham PSI JSON dosya yolu
- `raw`: sadece `include_raw=true` oldugunda

`compare_pagespeed` sonucu:
- `request_context`
- `mobile`: mobile ozet
- `desktop`: desktop ozet
- `performance_delta_desktop_minus_mobile`
- `saved_report_path`: birlesik ham JSON dosya yolu

Kaydedilen rapor dosyasi yapisi:
- `run_pagespeed`: `request_context`, `response_summary`, `raw_response`
- `compare_pagespeed`: `request_context`, `comparison_summary`, `raw_response.mobile`, `raw_response.desktop`

Ajan kullanım kılavuzu:
- `docs/tr/PAGESPEEDINSIGHT_TOOL_GUIDE.md`

## OpenClaw skill dosyasını kurma

Bu paket su dosyayi olusturabilir:
`app/skills/pagespeedinsight-mcp/SKILL.md`
Ve `SKILL.md` icerigini `PAGESPEEDINSIGHT_TOOL_GUIDE.md` dosyasindan kopyalar.

Secenek A: npm kurulumunda otomatik (onerilen)
```bash
OPENCLAW_DIR=/openclaw/tam/yol OPENCLAW_SKILL_OWNER=node:node npm install -g @denizhosgor/pagespeedinsight-mcp
```

Secenek B: manuel
```bash
pagespeedinsight-mcp install-skill --openclaw-dir /openclaw/tam/yol --chown node:node
```

Dogrudan skills klasoru vererek:
```bash
pagespeedinsight-mcp install-skill --skills-dir /openclaw/tam/yol/app/skills
```

Var olani ezmek icin:
```bash
pagespeedinsight-mcp install-skill --openclaw-dir /openclaw/tam/yol --force --chown node:node
```

Ortaminda `node:node` sahipligi zorunluysa, kurulumu `chown` yetkisi olan kullanici ile calistirmalisin (root/sudo).

## Onemli: skill ve tool farki

- `SKILL.md` sadece ajana kullanim kurali verir.
- Tool taninmasi OpenClaw `mcpServers` konfigrasyonu ile olur.
- Ajan tool'u gormuyorsa MCP server baglantisi/reload tarafi eksiktir.

## Geliştirme

```bash
npm install
npm run build
npm run typecheck
npm run check
npm start
```

## Test

```bash
npm test
npm run test:watch
```

## Güvenlik ve yayın öncesi kontroller

Üretim bağımlılıkları güvenlik taraması:
```bash
npm run security:prod
```

Tüm bağımlılıklar (dev dahil):
```bash
npm run security:full
```

Tek komutla yayın öncesi kontrol:
```bash
npm run release:check
```

`release:check` şu adımları çalıştırır:
1. `npm run check` (syntax + test)
2. `npm run security:prod` (audit)
3. `npm run pack:dry-run` (paketlenebilirlik)

## npm publish adımları

1. `package.json` içindeki `name` benzersiz olmalı.
2. Versiyon artır: `npm version patch` (veya `minor`/`major`).
3. Giriş yap: `npm login`
4. Yayınla: `npm publish --access public`
