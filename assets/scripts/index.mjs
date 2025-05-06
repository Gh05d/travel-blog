const loading = document.getElementById("loading");
const showMoreButton = document.getElementById("show-more-button");

async function renderPosts() {
  loading.style.display = "block";
  showMoreButton.style.display = "none";

  const res = await fetch("assets/search.json");
  const posts = await res.json();

  const container = document.getElementById("latest");
  container.innerHTML = "";

  posts
    .sort(
      (a, b) =>
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    )
    .forEach((post) => {
      const human = new Date(post.publishDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
    <a
        aria-label="${post.imageAlt}"
        href="${post.url}">
        <picture>
            <img
                src="${post.imageUrl}"
                srcset="
                ${post.imageUrl}&dpr=2 2x,
                ${post.imageUrl} 1x
                "
                sizes="(min-width:38rem) 38rem, 100vw"
                alt="${post.imageAlt}"
                loading="lazy"
                decoding="async"
                width="608"
                height="227"
            />
        </picture>
    </a>

    <h3><a href="${post.url}">${post.title}</a></h3>

     <div id="published">
        Published:
        <em
        ><time itemprop="datePublished" datetime="${post.publishDate}">
            ${human}</time
        ></em
        >
    </div>

  <p>${post.description}</p>
`;
      container.appendChild(div);
    });

  loading.style.display = "none";
}

showMoreButton.addEventListener("click", renderPosts);
