/* Marketplace buttons.
   Leave data-shop-url empty: the control stays visible as "Coming soon" and is not a link.
   Paste a real https URL (AbeBooks or Etsy shop) into data-shop-url to publish it.
   Do not invent a store URL. */
(function () {
  var nodes = document.querySelectorAll("[data-shop-url]");
  for (var i = 0; i < nodes.length; i++) {
    var el = nodes[i];
    var url = (el.getAttribute("data-shop-url") || "").trim();
    if (!/^https:\/\/\S+$/i.test(url)) continue;
    var link = document.createElement("a");
    link.className = "button button-outline";
    link.href = url;
    link.rel = "noopener";
    link.textContent = el.getAttribute("data-shop-name") || "Shop";
    el.replaceWith(link);
  }
})();
