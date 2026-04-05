export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'content-security-policy': '',
    'x-frame-options': '',
    'referrer-policy': '',
    'x-content-type-options': ''
  })
})
