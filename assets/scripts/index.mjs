const loading = document.getElementById("loading");
const showMoreButton = document.getElementById("show-more-button");
const latest = document.getElementById("latest");

let allPosts = [];
let loadedCount = latest.children.length;
let isFetching = false;

async function loadMore() {
  if (isFetching) return;
  isFetching = true;
  loading.style.display = "block";
  showMoreButton.disabled = true;

  if (allPosts.length === 0) {
    const response = await fetch("assets/search.json");
    allPosts = await response.json();
    allPosts.sort(
      (a, b) =>
        new Date(b.publishDate).getTime() -
        new Date(a.publishDate).getTime()
    );
  }

  const nextPosts = allPosts.slice(loadedCount, loadedCount + 10);

  nextPosts.forEach((post) => {
    const published = new Date(post.publishDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
    <a
        aria-label="${post.imageAlt}"
        href="${post.url}"
    >
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
        <em><time itemprop="datePublished" datetime="${post.publishDate}">
            ${published}</time
        ></em>
    </div>

  <p>${post.description}</p>
`;
    latest.appendChild(card);
  });

  loadedCount += nextPosts.length;
  loading.style.display = "none";
  showMoreButton.disabled = false;
  isFetching = false;

  if (loadedCount >= allPosts.length) {
    showMoreButton.style.display = "none";
  }
}

showMoreButton.addEventListener("click", loadMore);
