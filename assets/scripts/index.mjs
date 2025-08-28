const loading = document.getElementById("loading");
const showMoreButton = document.getElementById("show-more-button");

function applyRandomLayout(cards) {
  cards.forEach((card) => {
    card.classList.remove("card--wide", "card--tall", "card--big");
    const rand = Math.random();
    if (rand < 0.25) {
      card.classList.add("card--big");
    } else if (rand < 0.5) {
      card.classList.add("card--wide");
    } else if (rand < 0.75) {
      card.classList.add("card--tall");
    }
  });
}

applyRandomLayout(document.querySelectorAll(".posts .card"));

async function renderPosts() {
  loading.style.display = "block";
  showMoreButton.style.display = "none";
  const response = await fetch("assets/search.json");
  const posts = await response.json();
  const container = document.getElementById("latest");
  container.innerHTML = "";
  posts
    .sort(
      (a, b) =>
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    )
    .forEach((post) => {
      const published = new Date(post.publishDate).toLocaleDateString(
        "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      );
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
      container.appendChild(card);
    });
  applyRandomLayout(container.querySelectorAll(".card"));
  loading.style.display = "none";
}

showMoreButton.addEventListener("click", renderPosts);

