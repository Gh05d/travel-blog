window.addEventListener("DOMContentLoaded", () => {
  const loading = document.getElementById("loading"),
    button = document.getElementById("show-more-button"),
    grid = document.getElementById("latest-grid");
  if (!(loading && button && grid)) return;
  let cache = [],
    offset = document.getElementById("latest-posts")?.children?.length || 0,
    busy = false;
  button.addEventListener("click", () =>
    (async function (count, showLoading = true) {
      if (busy) return;
      if ((busy = true), showLoading && (loading.style.display = "block"), (button.disabled = true), cache.length === 0) {
        const resp = await fetch("assets/search.json");
        cache = await resp.json();
        cache.sort(
          (a, b) => new Date(b.publishDate) - new Date(a.publishDate)
        );
      }
      const slice = cache.slice(offset, offset + count);
      slice.forEach((e) => {
        const date = new Date(e.publishDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
 <a aria-label="${e.imageAlt}" href="${e.url}">
   <picture>
     <img
       src="${e.imageUrl}"
       srcset="
         ${e.imageUrl} 200w,
         ${e.imageUrl}&dpr=2 400w
       "
       sizes="(min-width:76rem) 18rem, 100vw"
       alt="${e.imageAlt}"
       loading="lazy"
       decoding="async"
       width="200"
       height="75"
     />
   </picture>
 </a>
 <h3><a href="${e.url}">${e.title}</a></h3>
 <div id="published">
   By <a href="/authors/${e.authorSlug}.html">${e.author}</a> | Published:
   <em><time itemprop="datePublished" datetime="${e.publishDate}">
${date}
   </time></em>
 </div>
 <p>${e.description}</p>
      `;
        grid.appendChild(card);
      });
      offset += slice.length;
      loading.style.display = "none";
      button.disabled = false;
      busy = false;
      offset >= cache.length && (button.style.display = "none");
    })(10)
  );
});

