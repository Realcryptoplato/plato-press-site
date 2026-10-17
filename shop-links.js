/* Marketplace buttons.
   Leave data-shop-url empty: the control stays visible as "Coming soon" and is not a link.
   Paste a real https shop URL into data-shop-url to publish it.
   AbeBooks is still empty. Etsy is a normal link to the shop home in the HTML.
   Do not invent a store URL, and do not link individual Etsy listings. */
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
