window.addEventListener("DOMContentLoaded", () => {
  const loading = document.getElementById("loading");
  const button = document.getElementById("show-more-button");
  const grid = document.getElementById("latest-grid");
  if (!(loading && button && grid)) return;

  let allPosts = [];
  let offset = document.getElementById("latest-posts")?.children?.length || 0;
  let busy = false;

  async function loadMore(count, showSpinner = true) {
    if (busy) return;
    busy = true;
    if (showSpinner) loading.style.display = "block";
    button.disabled = true;

    if (allPosts.length === 0) {
      const res = await fetch("assets/search.json");
      allPosts = await res.json();
      allPosts.sort(
        (a, b) => new Date(b.publishDate) - new Date(a.publishDate)
      );
    }

    const slice = allPosts.slice(offset, offset + count);
    slice.forEach((post) => {
      const published = new Date(post.publishDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
 <a aria-label="${post.imageAlt}" href="${post.url}">
   <picture>
     <img
       src="${post.imageUrl}"
       srcset="
         ${post.imageUrl} 200w,
         ${post.imageUrl}&dpr=2 400w
       "
       sizes="(min-width:76rem) 18rem, 100vw"
       alt="${post.imageAlt}"
       loading="lazy"
       decoding="async"
       width="200"
       height="75"
     />
   </picture>
 </a>
 <h3><a href="${post.url}">${post.title}</a></h3>
 <div id="published">
   Published:
   <em><time itemprop="datePublished" datetime="${post.publishDate}">
     ${published}
   </time></em>
 </div>
 <p>${post.description}</p>
      `;
      grid.appendChild(card);
    });

    offset += slice.length;
    loading.style.display = "none";
    button.disabled = false;
    busy = false;
    if (offset >= allPosts.length) button.style.display = "none";
  }

  button.addEventListener("click", () => loadMore(10));
});
