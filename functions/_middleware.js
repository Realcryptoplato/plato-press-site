const CANONICAL_HOST = "www.plato-press.com";

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === "plato-press.com") {
    url.protocol = "https:";
    url.hostname = CANONICAL_HOST;
    url.port = "";
    return Response.redirect(url.toString(), 308);
  }

  return context.next();
}
