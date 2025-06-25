const loading = document.getElementById("loading");
const showMoreButton = document.getElementById("show-more-button");

async function renderPosts() {
  (loading.style.display = "block"), (showMoreButton.style.display = "none");
  const e = await fetch("assets/search.json"),
    n = await e.json(),
    t = document.getElementById("latest");
  (t.innerHTML = ""),
    n
      .sort(
        (e, n) =>
          new Date(n.publishDate).getTime() - new Date(e.publishDate).getTime()
      )
      .forEach((e) => {
        const n = new Date(e.publishDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          i = document.createElement("div");
        (i.className = "card"),
          (i.innerHTML = `\n    <a\n        aria-label="${e.imageAlt}"\n        href="${e.url}">\n        <picture>\n            <img\n                src="${e.imageUrl}"\n                srcset="\n                ${e.imageUrl}&dpr=2 2x,\n                ${e.imageUrl} 1x\n                "\n                sizes="(min-width:38rem) 38rem, 100vw"\n                alt="${e.imageAlt}"\n                loading="lazy"\n                decoding="async"\n                width="608"\n                height="227"\n            />\n        </picture>\n    </a>\n\n    <h3><a href="${e.url}">${e.title}</a></h3>\n\n     <div id="published">\n        Published:\n        <em\n        ><time itemprop="datePublished" datetime="${e.publishDate}">\n            ${n}</time\n        ></em\n        >\n    </div>\n\n  <p>${e.description}</p>\n`),
          t.appendChild(i);
      }),
    (loading.style.display = "none");
}

showMoreButton.addEventListener("click", renderPosts);
