/**
 * Send the browser to a checkout redirect. The simulated gateway returns an
 * internal path (client-side nav is right); real PayPal returns its own hosted
 * approval URL (absolute), which the Next router cannot navigate to — that needs
 * a full document navigation. One helper so every "pay online" button handles
 * both without thinking about it.
 */
export function goToCheckout(redirect: string, router: { push: (href: string) => void }): void {
  if (/^https?:\/\//i.test(redirect)) {
    window.location.assign(redirect)
  } else {
    router.push(redirect)
  }
}
