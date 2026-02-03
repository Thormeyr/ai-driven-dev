const DEFAULT_CATEGORY = "general";

const newsGrid = document.getElementById("newsGrid");
const statusEl = document.getElementById("status");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const refreshBtn = document.getElementById("refreshBtn");
const categoryButtons = document.querySelectorAll(".chip");
const activeCategoryEl = document.getElementById("activeCategory");
const resultCountEl = document.getElementById("resultCount");
const lastUpdatedEl = document.getElementById("lastUpdated");
const viewButtons = document.querySelectorAll(".toggle-btn");

const CATEGORY_LABELS = {
  general: "Geral",
  world: "Mundo",
  nation: "Brasil",
  business: "Negócios",
  technology: "Tecnologia",
  entertainment: "Entretenimento",
  sports: "Esportes",
  science: "Ciência",
  health: "Saúde",
};

const state = {
  category: DEFAULT_CATEGORY,
  query: "",
};

const formatDate = (isoDate) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (date = new Date()) =>
  date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const setStatus = (message) => {
  statusEl.textContent = message;
};

const buildUrl = () => {
  const url = new URL("/api/news", window.location.origin);
  url.searchParams.set("category", state.category);
  if (state.query) {
    url.searchParams.set("q", state.query);
  }
  return url.toString();
};

const renderSkeleton = () => {
  newsGrid.innerHTML = Array.from({ length: 6 })
    .map(
      () => `
        <article class="card card--skeleton">
          <div class="card__media"></div>
          <div class="card__body">
            <div class="skeleton-block" style="width: 40%"></div>
            <div class="skeleton-block" style="width: 80%"></div>
            <div class="skeleton-block" style="width: 60%"></div>
            <div class="skeleton-block" style="width: 90%"></div>
          </div>
        </article>
      `
    )
    .join("");
};

const renderEmpty = () => {
  newsGrid.innerHTML = `
    <article class="card">
      <div class="card__body">
        <h2 class="card__title">Nenhuma notícia encontrada</h2>
        <p class="card__desc">
          Tente mudar a categoria ou ajustar o termo de busca.
        </p>
      </div>
    </article>
  `;
};

const buildShareLinks = (title, url) => {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);
  return {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
  };
};

const renderNews = (articles = []) => {
  if (!articles.length) {
    renderEmpty();
    return;
  }

  newsGrid.innerHTML = articles
    .map((article) => {
      const { title, description, image, url, source, publishedAt } = article;
      const share = buildShareLinks(title, url);
      return `
        <article class="card">
          <div class="card__media">
            <img
              src="${image || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=900&q=80"}"
              alt="${title || "Notícia"}"
              loading="lazy"
            />
            <span class="card__badge">${source?.name || "GNews"}</span>
          </div>
          <div class="card__body">
            <div class="card__meta">
              <span class="tag">${source?.name || "GNews"}</span>
              <span>📅 ${formatDate(publishedAt)}</span>
            </div>
            <h2 class="card__title">${title || "Sem título"}</h2>
            <p class="card__desc">${description || "Sem descrição disponível."}</p>
            <div class="card__actions">
              <a class="btn btn--primary" href="${url}" target="_blank" rel="noreferrer">
                Ler notícia
              </a>
              <a class="share" href="${share.whatsapp}" target="_blank" rel="noreferrer">WhatsApp</a>
              <a class="share" href="${share.x}" target="_blank" rel="noreferrer">X</a>
              <a class="share" href="${share.facebook}" target="_blank" rel="noreferrer">Facebook</a>
              <a class="share" href="${share.linkedin}" target="_blank" rel="noreferrer">LinkedIn</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
};

const fetchJson = async (url) => {
  const response = await fetch(url);
  const data = await response.json();
  return { response, data };
};

const updateStats = (total = 0) => {
  activeCategoryEl.textContent = CATEGORY_LABELS[state.category] || "Geral";
  resultCountEl.textContent = total.toString();
  lastUpdatedEl.textContent = formatTime();
};

const fetchNews = async () => {
  setStatus("Carregando notícias...");
  renderSkeleton();

  try {
    const { response, data } = await fetchJson(buildUrl());

    if (!response.ok) {
      const message = data?.errors?.join(" | ") || data?.message || "Erro ao carregar notícias.";
      setStatus(message);
      renderEmpty();
      updateStats(0);
      return;
    }

    setStatus(`Mostrando ${data.articles.length} notícias.`);
    renderNews(data.articles);
    updateStats(data.articles.length);
  } catch (error) {
    setStatus("Não foi possível conectar ao servidor local.");
    renderEmpty();
    updateStats(0);
  }
};

const setActiveCategory = (category) => {
  categoryButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.category === category);
  });
};

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.query = searchInput.value.trim();
  fetchNews();
});

clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  state.query = "";
  fetchNews();
});

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.category = button.dataset.category;
    setActiveCategory(state.category);
    fetchNews();
  });
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    viewButtons.forEach((btn) => btn.classList.remove("is-active"));
    button.classList.add("is-active");
    newsGrid.classList.toggle("is-list", button.dataset.view === "list");
  });
});

refreshBtn.addEventListener("click", fetchNews);

fetchNews();
