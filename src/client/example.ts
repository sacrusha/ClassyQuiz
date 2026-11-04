// /example, the worked example (docs/design/example-page.md). The page is static;
// this only points the conversation's links at its dark picture when the
// device is in dark mode, as the preview's <picture> already does.

if (matchMedia("(prefers-color-scheme: dark)").matches) {
  for (const a of document.querySelectorAll<HTMLAnchorElement>("#convo, #convo-all")) a.href = "/examples/conversation-dark.webp";
}
