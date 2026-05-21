/* ============================================
   水果知识档案 - 数据管理模块
   ============================================ */

const FruitData = (() => {
  'use strict';

  const STORAGE_KEY = 'fruit-archive-data';
  let fruits = [];
  let initialized = false;

  /**
   * 初始化数据：先尝试从 localStorage 加载，失败则从 JSON 文件加载
   */
  async function init() {
    if (initialized) return fruits;

    // 1. 尝试从 localStorage 加载（用户编辑过的数据）
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        fruits = JSON.parse(stored);
        if (Array.isArray(fruits) && fruits.length > 0) {
          initialized = true;
          return fruits;
        }
      } catch (e) {
        console.warn('localStorage 数据损坏，将重新加载默认数据');
      }
    }

    // 2. 从 JSON 文件加载默认数据
    try {
      const response = await fetch('data/fruits.json');
      if (!response.ok) throw new Error('数据加载失败');
      fruits = await response.json();
      initialized = true;
      return fruits;
    } catch (error) {
      console.error('水果数据加载失败:', error);
      fruits = [];
      initialized = true;
      return fruits;
    }
  }

  /**
   * 获取所有水果
   */
  function getAll() {
    return [...fruits];
  }

  /**
   * 根据 ID 获取单个水果
   */
  function getById(id) {
    return fruits.find(f => f.id === id) || null;
  }

  /**
   * 按关键词搜索（名称、学名、概述、详细描述）
   */
  function search(keyword) {
    if (!keyword || !keyword.trim()) return getAll();
    const kw = keyword.trim().toLowerCase();
    return fruits.filter(f =>
      f.name.toLowerCase().includes(kw) ||
      f.scientificName.toLowerCase().includes(kw) ||
      f.summary.toLowerCase().includes(kw) ||
      f.description.toLowerCase().includes(kw)
    );
  }

  /**
   * 按分类筛选
   */
  function filterByCategory(category) {
    if (!category || category === 'all') return getAll();
    return fruits.filter(f => f.category === category);
  }

  /**
   * 获取所有分类
   */
  function getCategories() {
    const cats = [...new Set(fruits.map(f => f.category))];
    return cats.sort();
  }

  /**
   * 按季节筛选
   */
  function filterBySeason(season) {
    if (!season || season === 'all') return getAll();
    return fruits.filter(f => f.season === season);
  }

  /**
   * 获取所有季节
   */
  function getSeasons() {
    const seasons = [...new Set(fruits.map(f => f.season))];
    return seasons.sort();
  }

  /**
   * 按产地筛选
   */
  function filterByRegion(region) {
    if (!region || region === 'all') return getAll();
    return fruits.filter(f => f.region === region);
  }

  /**
   * 获取所有产地
   */
  function getRegions() {
    const regions = [...new Set(fruits.map(f => f.region))];
    return regions.sort();
  }

  /**
   * 添加水果
   */
  function add(fruit) {
    const id = fruit.id || generateId(fruit.name);
    const newFruit = {
      ...fruit,
      id,
      status: fruit.status || 'published'
    };
    fruits.push(newFruit);
    save();
    return newFruit;
  }

  /**
   * 更新水果
   */
  function update(id, data) {
    const index = fruits.findIndex(f => f.id === id);
    if (index === -1) return false;
    fruits[index] = { ...fruits[index], ...data };
    save();
    return true;
  }

  /**
   * 删除水果
   */
  function remove(id) {
    const initialLength = fruits.length;
    fruits = fruits.filter(f => f.id !== id);
    if (fruits.length !== initialLength) {
      save();
      return true;
    }
    return false;
  }

  /**
   * 保存到 localStorage
   */
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fruits));
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  }

  /**
   * 导出 JSON
   */
  function exportJSON() {
    const data = JSON.stringify(fruits, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fruits-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 导入 JSON
   */
  function importJSON(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (!Array.isArray(data)) throw new Error('数据格式错误');
      fruits = data;
      save();
      return true;
    } catch (e) {
      console.error('导入失败:', e);
      return false;
    }
  }

  /**
   * 重置为默认数据
   */
  async function reset() {
    localStorage.removeItem(STORAGE_KEY);
    initialized = false;
    return init();
  }

  /**
   * 生成 ID
   */
  function generateId(name) {
    const base = name.replace(/[^\w\u4e00-\u9fa5]/g, '-').toLowerCase();
    const timestamp = Date.now().toString(36);
    return base + '-' + timestamp;
  }

  // 公开 API
  return {
    init,
    getAll,
    getById,
    search,
    filterByCategory,
    filterBySeason,
    getCategories,
    getSeasons,
    filterByRegion,
    getRegions,
    add,
    update,
    remove,
    save,
    exportJSON,
    importJSON,
    reset
  };
})();