# PageSpeedInsight MCP Tool Guide (Agent için)

Bu doküman, ajanların `pagespeedinsight` MCP server içindeki tool'ları doğru şekilde çağırması için hazırlanmıştır.

## Tool listesi

### 1) `run_pagespeed`
Tek bir strateji (mobile/desktop) için analiz çalıştırır.

**Input**
- `url` (zorunlu, string): Hedef URL. (`https://...` önerilir)
- `strategy` (opsiyonel, string): `mobile` veya `desktop` (varsayılan: `mobile`)
- `categories` (opsiyonel, string[]): Örn: `["performance","seo"]`
- `locale` (opsiyonel, string): Örn: `tr-TR`, `en-US` (varsayılan: `en-US`)
- `timeout_seconds` (opsiyonel, int): 5-180 arası (varsayılan: 60)
- `include_raw` (opsiyonel, bool): `true` olursa ham PSI cevabı da döner

**Output**
- `summary`:
  - `categories` skorları (0-100)
  - `key_metrics` (FCP/LCP/CLS/TBT/INP vb.)
  - `top_opportunities` (en yüksek tahmini kazanım)
- `saved_report_path`: Kaydedilen ham JSON rapor dosyasının tam yolu (`report/<url>-<timestamp>.json`)

### 2) `compare_pagespeed`
Aynı URL için mobile + desktop sonuçlarını karşılaştırır.

**Input**
- `url` (zorunlu, string)
- `categories` (opsiyonel, string[])
- `locale` (opsiyonel, string)
- `timeout_seconds` (opsiyonel, int)

**Output**
- `mobile` özeti
- `desktop` özeti
- `performance_delta_desktop_minus_mobile`
- `saved_report_path`: Kaydedilen birlesik ham JSON rapor dosyasinin tam yolu (mobile + desktop)

## Raporlama davranisi

1. Her cagrida diske JSON rapor dosyasi yazilir.
2. Varsayilan olarak dosyalar calisma dizinindeki `report/` altina yazilir.
3. Dizin `PAGESPEEDINSIGHT_REPORT_DIR` ile degistirilebilir.
4. `compare_pagespeed` kayit dosyasinda iki ham payload birlikte tutulur:
   - `mobile`
   - `desktop`
   - ek olarak `url` ve `saved_at`

## Ajan kullanım kuralları

1. Önce `run_pagespeed` ile `mobile` analizi yap.  
2. İhtiyaç varsa `compare_pagespeed` çağırarak cihaz farkını raporla.  
3. Sonuçları raporlarken şu sırayı koru:
   - Genel performans skoru
   - Core Web Vitals metrikleri (LCP, CLS, INP)
   - En yüksek etkili 3 iyileştirme maddesi
4. `url` protokolsüz verilirse (`example.com`) yine gönderebilirsin; server otomatik `https://` ekler.
5. Hata durumunda kullanıcıya API hata mesajını sade bir cümleyle döndür.

## Örnek tool çağrıları

### Örnek 1: Tek analiz
```json
{
  "tool": "run_pagespeed",
  "arguments": {
    "url": "https://example.com",
    "strategy": "mobile",
    "categories": ["performance", "seo"],
    "locale": "tr-TR"
  }
}
```

### Örnek 2: Mobile/Desktop karşılaştırma
```json
{
  "tool": "compare_pagespeed",
  "arguments": {
    "url": "https://example.com",
    "categories": ["performance", "accessibility"],
    "locale": "en-US"
  }
}
```

## Ornek sonuc alanlari

- `summary.categories.performance`
- `summary.key_metrics.lcp_ms`
- `summary.top_opportunities`
- `saved_report_path`

## Ajan cevap formatı önerisi

- `Performance`: `<score>/100`
- `CWV`: `LCP <x>ms, CLS <y>, INP <z>ms`
- `Top Opportunities`:
  1. `<title> (<estimated_savings_ms>ms)`
  2. `<title> (...)`
  3. `<title> (...)`
- `Recommendation`: İlk 2 aksiyonu kısa ve uygulanabilir şekilde yaz.
