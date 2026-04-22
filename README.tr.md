# pagespeedinsight-mcp

Google PageSpeed Insights'i MCP tool olarak sunan Node.js sunucu paketi.

OpenClaw ve MCP uyumlu diğer projelerdeki ajanlar bu sunucu ile:
1. Sayfa için detaylı PageSpeed raporu alabilir.
2. Rapordaki hata ve iyileştirme fırsatlarını analiz edebilir.
3. Sonuçlara göre optimizasyon yapıp tekrar ölçüm döngüsüne alabilir.

## Kurulum ve çalıştırma

Global kurulum:
```bash
npm install -g pagespeedinsight-mcp
pagespeedinsight-mcp
```

NPX ile çalıştırma:
```bash
npx -y pagespeedinsight-mcp
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

NPX ile:
```json
{
  "mcpServers": {
    "pagespeedinsight": {
      "command": "npx",
      "args": ["-y", "pagespeedinsight-mcp"],
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

Ajan kullanım kılavuzu:
- `docs/PAGESPEEDINSIGHT_TOOL_GUIDE.md`

## Geliştirme

```bash
npm install
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
