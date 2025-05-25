'use client'

import Script from 'next/script'

export default function AdminPage() {
  return (
    <>
      <Script
        src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"
        strategy="afterInteractive"
      />
      <div id="nc-root">Loading...</div>
    </>
  )
}
