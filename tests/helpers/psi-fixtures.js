export function makePsiPayload({
  id = "https://example.com/",
  fetchTime = "2026-04-22T10:00:00.000Z",
  lighthouseVersion = "12.0.0",
  performanceScore = 0.75,
  accessibilityScore = 0.9,
  bestPracticesScore = 0.8,
  seoScore = 0.88,
  fcp = 1200,
  lcp = 2500,
  speedIndex = 2400,
  tbt = 180,
  cls = 0.04,
  inp = 230
} = {}) {
  return {
    id,
    lighthouseResult: {
      fetchTime,
      lighthouseVersion,
      categories: {
        performance: { score: performanceScore },
        accessibility: { score: accessibilityScore },
        "best-practices": { score: bestPracticesScore },
        seo: { score: seoScore }
      },
      audits: {
        "first-contentful-paint": { numericValue: fcp },
        "largest-contentful-paint": { numericValue: lcp },
        "speed-index": { numericValue: speedIndex },
        "total-blocking-time": { numericValue: tbt },
        "cumulative-layout-shift": { numericValue: cls },
        "interaction-to-next-paint": { numericValue: inp },
        "render-blocking-resources": {
          title: "Eliminate render-blocking resources",
          description: "Some resources block first paint.",
          numericValue: 480
        },
        "unused-javascript": {
          title: "Reduce unused JavaScript",
          description: "Large bundles are unused.",
          numericValue: 320
        },
        "unused-css-rules": {
          title: "Reduce unused CSS",
          description: "Large CSS blocks are unused.",
          numericValue: 140
        },
        "modern-image-formats": {
          title: "Serve images in next-gen formats",
          description: "WebP/AVIF suggested.",
          details: { type: "opportunity" },
          numericValue: 600
        }
      }
    },
    loadingExperience: {
      overall_category: "FAST",
      initial_url: id
    },
    originLoadingExperience: {
      overall_category: "AVERAGE",
      origin_fallback: true
    }
  };
}
