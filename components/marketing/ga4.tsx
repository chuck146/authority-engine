import Script from 'next/script'

// Google Analytics 4 for the public marketing site only (not the dashboard).
// Loads only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set. Google signals and ad
// personalization are disabled — this is used for traffic and lead measurement,
// not advertising audiences.
export function Ga4() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  if (!measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}', {
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});`}
      </Script>
    </>
  )
}
