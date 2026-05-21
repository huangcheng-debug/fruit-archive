/* ============================================
   水果知识档案 - 首页应用逻辑（多维筛选版 + JS预加载图片）
   ============================================ */

(function () {
  'use strict';

  // DOM 元素
  const fruitGrid = document.getElementById('fruitGrid');
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  const resultCount = document.getElementById('resultCount');
  const emptyState = document.getElementById('emptyState');
  const filterReset = document.getElementById('filterReset');

  const filterCategory = document.getElementById('filterCategory');
  const filterSeason = document.getElementById('filterSeason');
  const filterRegion = document.getElementById('filterRegion');

  // 状态
  let filters = { category: 'all', season: 'all', region: 'all' };
  let currentKeyword = '';
  let allFruits = [];

  async function init() {
    allFruits = await FruitData.init();
    renderFilterChips('category', filterCategory, FruitData.getCategories());
    renderFilterChips('season', filterSeason, FruitData.getSeasons());
    renderFilterChips('region', filterRegion, FruitData.getRegions());
    renderCards();
    bindEvents();
  }

  function renderFilterChips(dimKey, container, options) {
    const chips = [`<button class="filter-chip active" data-dim="${dimKey}" data-value="all">全部</button>`];
    options.forEach(opt => chips.push(`<button class="filter-chip" data-dim="${dimKey}" data-value="${opt}">${opt}</button>`));
    container.innerHTML = chips.join('');
  }

  function getFilteredFruits() {
    let filtered = allFruits;
    if (filters.category !== 'all') filtered = filtered.filter(f => f.category === filters.category);
    if (filters.season !== 'all') filtered = filtered.filter(f => f.season === filters.season);
    if (filters.region !== 'all') filtered = filtered.filter(f => f.region === filters.region);
    if (currentKeyword.trim()) {
      const kw = currentKeyword.trim().toLowerCase();
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(kw) || f.scientificName.toLowerCase().includes(kw) ||
        f.summary.toLowerCase().includes(kw) || f.description.toLowerCase().includes(kw)
      );
    }
    return filtered;
  }

  function renderCards() {
    const fruits = getFilteredFruits();
    resultCount.innerHTML = `共 <strong>${fruits.length}</strong> 种水果`;

    if (fruits.length === 0) {
      fruitGrid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    // 卡片不含 img 标签，只用 emoji
    fruitGrid.innerHTML = fruits.map(fruit => `
      <article class="fruit-card" data-id="${fruit.id}" onclick="location.href='detail.html?id=${encodeURIComponent(fruit.id)}'" role="link" tabindex="0">
        <div class="card-image" data-img="${fruit.imageUrl || ''}">
          <span class="fruit-emoji">${fruit.emoji || '🍎'}</span>
          <span class="card-category">${fruit.category}</span>
        </div>
        <div class="card-body">
          <div class="card-name">${fruit.name}</div>
          <div class="card-scientific">${fruit.scientificName}</div>
          <p class="card-summary">${fruit.summary}</p>
          <div class="card-meta">
            <span class="meta-tag">🌍 ${fruit.region}</span>
            <span class="meta-tag">📅 ${fruit.season}</span>
          </div>
        </div>
      </article>
    `).join('');

    // 用 JS 预加载图片，成功后设为背景
    preloadImages();
  }

  function preloadImages() {
    document.querySelectorAll('.card-image[data-img]').forEach(cardImage => {
      const url = cardImage.dataset.img;
      if (!url) return;

      const img = new Image();
      img.onload = function () {
        cardImage.style.backgroundImage = `url('${url}')`;
        cardImage.style.backgroundSize = 'cover';
        cardImage.style.backgroundPosition = 'center';
        cardImage.classList.add('has-bg');
      };
      img.onerror = function () {
        // emoji 保持在原位
      };
      img.src = url;
    });
  }

  function applyFilter(dimKey, value) {
    filters[dimKey] = value;
    const container = document.getElementById(dimKey === 'category' ? 'filterCategory' : dimKey === 'season' ? 'filterSeason' : 'filterRegion');
    container.querySelectorAll('.filter-chip').forEach(chip => chip.classList.toggle('active', chip.dataset.value === value));
    renderCards();
  }

  function resetAllFilters() {
    filters = { category: 'all', season: 'all', region: 'all' };
    document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.toggle('active', chip.dataset.value === 'all'));
    renderCards();
  }

  function doSearch(keyword) {
    currentKeyword = keyword;
    searchClear.style.display = keyword ? 'block' : 'none';
    renderCards();
  }

  function bindEvents() {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => doSearch(searchInput.value), 300);
    });
    searchClear.addEventListener('click', () => { searchInput.value = ''; doSearch(''); searchInput.focus(); });

    const filterPanel = document.getElementById('filterPanel');
    filterPanel.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      applyFilter(chip.dataset.dim, chip.dataset.value);
    });
    filterReset.addEventListener('click', resetAllFilters);

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchInput.focus(); searchInput.select(); }
      if (e.key === 'Escape' && document.activeElement === searchInput) { searchInput.value = ''; doSearch(''); searchInput.blur(); }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();