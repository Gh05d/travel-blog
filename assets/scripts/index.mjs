window.addEventListener("DOMContentLoaded", () => {
  const e = document.getElementById("loading");
  const n = document.getElementById("show-more-button");
  const t = document.getElementById("latest-featured");
  const i = document.getElementById("latest-grid");

  if (e && n && t && i) {
    let l = [],
      d =
        t.querySelectorAll(".card").length + i.querySelectorAll(".card").length,
      s = !1;
    async function a(t) {
      if (s) return;
      if (
        ((s = !0),
        (e.style.display = "block"),
        (n.disabled = !0),
        0 === l.length)
      ) {
        const e = await fetch("assets/search.json");
        (l = await e.json()),
          l.sort(
            (e, n) =>
              new Date(n.publishDate).getTime() -
              new Date(e.publishDate).getTime()
          );
      }
      const a = l.slice(d, d + t);
      a.forEach((e) => {
        const n = new Date(e.publishDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          t = document.createElement("div");
        (t.className = "card"),
          (t.innerHTML = `\n    <a\n     aria-label="${e.imageAlt}"\n        href="${e.url}"\n    >\n        <picture>\n            <img\n                src="${e.imageUrl}"\n                srcset="\n                ${e.imageUrl} 200w,\n                ${e.imageUrl}&dpr=2 400w\n    "\n                sizes="(min-width:76rem) 18rem, 100vw"\n                alt="${e.imageAlt}"\n        loading="lazy"\n                decoding="async"\n                width="200"\n                height="75"\n            />\n        </picture>\n    </a>\n\n    <h3><a href="${e.url}">${e.title}</a></h3>\n\n     <div id="published">\n        Published:\n        <em><time itemprop="datePublished" datetime="${e.publishDate}">\n            ${n}</time\n        ></em>\n    </div>\n\n  <p>${e.description}</p>\n`),
          i.appendChild(t);
      }),
        (d += a.length),
        (e.style.display = "none"),
        (n.disabled = !1),
        (s = !1),
        d >= l.length && (n.style.display = "none");
    }
    a(10), n.addEventListener("click", () => a(10));
  }
});
