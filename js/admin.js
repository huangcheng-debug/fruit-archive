/* ============================================
   水果知识档案 - 后台管理应用逻辑
   ============================================ */

(function () {
  'use strict';

  // DOM 元素
  const tableBody = document.getElementById('adminTableBody');
  const adminCount = document.getElementById('adminCount');
  const adminEmpty = document.getElementById('adminEmpty');
  const adminSearch = document.getElementById('adminSearch');
  const editorOverlay = document.getElementById('editorOverlay');
  const editorTitle = document.getElementById('editorTitle');
  const editorForm = document.getElementById('editorForm');
  const importFile = document.getElementById('importFile');
  const toastContainer = document.getElementById('toastContainer');

  // 按钮
  const btnAdd = document.getElementById('btnAdd');
  const btnExport = document.getElementById('btnExport');
  const btnImport = document.getElementById('btnImport');
  const btnReset = document.getElementById('btnReset');
  const editorClose = document.getElementById('editorClose');
  const editorCancel = document.getElementById('editorCancel');
  const editorSave = document.getElementById('editorSave');

  // 表单字段
  const formFields = {
    id: null,
    name: document.getElementById('edName'),
    emoji: document.getElementById('edEmoji'),
    scientificName: document.getElementById('edScientific'),
    category: document.getElementById('edCategory'),
    region: document.getElementById('edRegion'),
    season: document.getElementById('edSeason'),
    summary: document.getElementById('edSummary'),
    description: document.getElementById('edDescription'),
    calories: document.getElementById('edCalories'),
    vitaminC: document.getElementById('edVitaminC'),
    fiber: document.getElementById('edFiber'),
    nutrients: document.getElementById('edNutrients'),
    funFact: document.getElementById('edFunFact'),
    status: document.getElementById('edStatus')
  };

  let editingId = null;
  let searchKeyword = '';

  /**
   * 初始化
   */
  async function init() {
    await FruitData.init();
    renderTable();
    bindEvents();
  }

  /**
   * 获取过滤后的水果列表
   */
  function getFilteredFruits() {
    const all = FruitData.getAll();
    if (!searchKeyword.trim()) return all;
    const kw = searchKeyword.trim().toLowerCase();
    return all.filter(f =>
      f.name.toLowerCase().includes(kw) ||
      f.scientificName.toLowerCase().includes(kw) ||
      f.category.toLowerCase().includes(kw)
    );
  }

  /**
   * 渲染表格
   */
  function renderTable() {
    const fruits = getFilteredFruits();

    adminCount.innerHTML = `共 <strong>${fruits.length}</strong> 种水果`;

    if (fruits.length === 0) {
      tableBody.innerHTML = '';
      adminEmpty.style.display = 'block';
      return;
    }
    adminEmpty.style.display = 'none';

    tableBody.innerHTML = fruits.map((fruit, index) => `
      <tr>
        <td style="color: var(--color-gray-500);">${index + 1}</td>
        <td>
          <div class="fruit-name-cell">
            <span class="cell-emoji">${fruit.emoji || '🍎'}</span>
            <span style="font-weight:500;">${fruit.name}</span>
          </div>
        </td>
        <td>${fruit.category}</td>
        <td>${fruit.season}</td>
        <td>${fruit.region}</td>
        <td><span class="status-badge ${fruit.status || 'published'}">${fruit.status === 'draft' ? '草稿' : '已发布'}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="window._editFruit('${fruit.id}')" title="编辑">✏️ 编辑</button>
          <button class="btn btn-danger btn-sm" onclick="window._deleteFruit('${fruit.id}')" title="删除" style="margin-left:4px;">🗑️ 删除</button>
        </td>
      </tr>
    `).join('');
  }

  // 暴露到全局便于内联调用
  window._editFruit = function (id) {
    openEditor(id);
  };
  window._deleteFruit = function (id) {
    deleteFruit(id);
  };

  /**
   * 打开编辑器
   */
  function openEditor(id) {
    editingId = id;
    if (id) {
      const fruit = FruitData.getById(id);
      if (!fruit) return;

      editorTitle.textContent = '编辑水果';
      formFields.id = id;
      formFields.name.value = fruit.name || '';
      formFields.emoji.value = fruit.emoji || '';
      formFields.scientificName.value = fruit.scientificName || '';
      formFields.category.value = fruit.category || '';
      formFields.region.value = fruit.region || '';
      formFields.season.value = fruit.season || '';
      formFields.summary.value = fruit.summary || '';
      formFields.description.value = fruit.description || '';
      if (fruit.nutrition) {
        formFields.calories.value = fruit.nutrition.calories != null ? fruit.nutrition.calories : '';
        formFields.vitaminC.value = fruit.nutrition.vitaminC != null ? fruit.nutrition.vitaminC : '';
        formFields.fiber.value = fruit.nutrition.fiber != null ? fruit.nutrition.fiber : '';
      } else {
        formFields.calories.value = '';
        formFields.vitaminC.value = '';
        formFields.fiber.value = '';
      }
      formFields.nutrients.value = Array.isArray(fruit.nutrients) ? fruit.nutrients.join(', ') : '';
      formFields.funFact.value = fruit.funFact || '';
      formFields.status.value = fruit.status || 'published';
    } else {
      // 新增模式
      editorTitle.textContent = '添加水果';
      formFields.id = null;
      Object.keys(formFields).forEach(key => {
        if (key !== 'id' && formFields[key]) {
          formFields[key].value = '';
        }
      });
      formFields.category.value = '';
      formFields.status.value = 'published';
    }

    editorOverlay.style.display = 'flex';
    formFields.name.focus();
  }

  /**
   * 关闭编辑器
   */
  function closeEditor() {
    editingId = null;
    editorOverlay.style.display = 'none';
    editorForm.reset();
  }

  /**
   * 保存水果数据
   */
  function saveFruit() {
    // 基本验证
    const name = formFields.name.value.trim();
    const category = formFields.category.value;

    if (!name) {
      showToast('请输入水果名称', 'error');
      formFields.name.focus();
      return;
    }
    if (!category) {
      showToast('请选择水果分类', 'error');
      formFields.category.focus();
      return;
    }

    // 构建水果对象
    const fruitData = {
      name,
      emoji: formFields.emoji.value || '🍎',
      scientificName: formFields.scientificName.value.trim(),
      category,
      region: formFields.region.value.trim(),
      season: formFields.season.value.trim(),
      summary: formFields.summary.value.trim(),
      description: formFields.description.value.trim(),
      nutrition: {
        calories: parseFloat(formFields.calories.value) || 0,
        vitaminC: parseFloat(formFields.vitaminC.value) || 0,
        fiber: parseFloat(formFields.fiber.value) || 0
      },
      nutrients: formFields.nutrients.value
        .split(/[,，、]/)
        .map(s => s.trim())
        .filter(s => s),
      funFact: formFields.funFact.value.trim(),
      status: formFields.status.value || 'published',
      imageUrl: '',
      videoUrl: ''
    };

    let success;
    if (editingId) {
      // 更新
      success = FruitData.update(editingId, fruitData);
      if (success) {
        showToast(`「${name}」已更新`, 'success');
      }
    } else {
      // 新增
      fruitData.id = generateId(name);
      FruitData.add(fruitData);
      showToast(`「${name}」已添加`, 'success');
    }

    closeEditor();
    renderTable();
  }

  /**
   * 删除水果
   */
  function deleteFruit(id) {
    const fruit = FruitData.getById(id);
    if (!fruit) return;

    if (!confirm(`确定要删除「${fruit.name}」吗？\n\n此操作不可恢复。`)) return;

    FruitData.remove(id);
    showToast(`「${fruit.name}」已删除`, 'success');
    renderTable();
  }

  /**
   * 导入 JSON 文件
   */
  function handleImport() {
    const file = importFile.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) throw new Error('格式错误');

        const success = FruitData.importJSON(data);
        if (success) {
          showToast(`成功导入 ${data.length} 条水果数据`, 'success');
          renderTable();
        } else {
          showToast('导入失败，请检查文件格式', 'error');
        }
      } catch (err) {
        showToast('文件解析失败，请确认是有效的 JSON 文件', 'error');
      }
    };
    reader.onerror = function () {
      showToast('文件读取失败', 'error');
    };
    reader.readAsText(file, 'UTF-8');

    // 清空 file input
    importFile.value = '';
  }

  /**
   * 重置数据
   */
  async function handleReset() {
    if (!confirm('确定要重置所有数据吗？\n\n这将恢复到默认的 50 种水果数据，您所有的修改将会丢失。\n\n建议先导出备份。')) return;

    await FruitData.reset();
    showToast('数据已重置为默认', 'success');
    renderTable();
  }

  /**
   * 生成 ID
   */
  function generateId(name) {
    const base = name.replace(/[^\w\u4e00-\u9fa5]/g, '-').replace(/-+/g, '-').toLowerCase();
    const timestamp = Date.now().toString(36);
    return base + '-' + timestamp;
  }

  /**
   * Toast 提示
   */
  function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // 3秒后自动消失
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 添加水果
    btnAdd.addEventListener('click', () => openEditor(null));

    // 导出数据
    btnExport.addEventListener('click', () => {
      FruitData.exportJSON();
      showToast('数据已导出', 'success');
    });

    // 导入数据
    btnImport.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', handleImport);

    // 重置数据
    btnReset.addEventListener('click', handleReset);

    // 编辑器关闭
    editorClose.addEventListener('click', closeEditor);
    editorCancel.addEventListener('click', closeEditor);

    // 点击遮罩关闭
    editorOverlay.addEventListener('click', (e) => {
      if (e.target === editorOverlay) {
        closeEditor();
      }
    });

    // 保存
    editorSave.addEventListener('click', saveFruit);

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      // Escape 关闭编辑器
      if (e.key === 'Escape' && editorOverlay.style.display === 'flex') {
        closeEditor();
      }
      // Enter 保存（在弹窗内时）
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && editorOverlay.style.display === 'flex') {
        e.preventDefault();
        saveFruit();
      }
    });

    // 搜索
    let debounceTimer;
    adminSearch.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchKeyword = adminSearch.value;
        renderTable();
      }, 300);
    });
  }

  // 启动
  document.addEventListener('DOMContentLoaded', init);
})();