// src/features/charinfo/usecharinfo.ts
'use client';

let currentPreset: number = 1;
let isTooltipVisible: boolean = false;
let currentEquipmentData: Record<string, any> = {};
let eventsBound = false;
let currentCharacterName: string = '';

interface ItemOption {
  [key: string]: number | undefined;
}

interface ItemData {
  item_name?: string;
  item_icon?: string;
  item_equipment_slot?: string;
  item_equipment_part?: string;
  scroll_upgrade?: number;
  starforce?: number;
  potential_option_grade?: string;
  potential_option_1?: string;
  potential_option_2?: string;
  potential_option_3?: string;
  additional_potential_option_grade?: string;
  additional_potential_option_1?: string;
  additional_potential_option_2?: string;
  additional_potential_option_3?: string;

  item_base_option?: ItemOption;
  item_total_option?: ItemOption;
  item_add_option?: ItemOption;
  item_etc_option?: ItemOption;
  item_starforce_option?: ItemOption;
}

/* ---------- 안전 유틸 ---------- */
function escapeHTML(v: unknown): string {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeImageSrc(url: unknown): string {
  const s = String(url ?? '').trim();
  try {
    const u = new URL(s, window.location.origin);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
  } catch { /* noop */ }
  return '';
}

/* ---------- 툴팁 on/off ---------- */
function toggleTooltip(event: MouseEvent, itemData: ItemData) {
  const tooltip = document.getElementById('tooltip') as HTMLElement | null;
  if (!tooltip) return;

  if (isTooltipVisible) {
    tooltip.style.display = 'none';
    isTooltipVisible = false;
    return;
  }

  const base = itemData.item_base_option || {};
  const total = itemData.item_total_option || {};
  const add  = itemData.item_add_option || {};
  const etc  = itemData.item_etc_option || {};
  const star = itemData.item_starforce_option || {};

  tooltip.innerHTML = `
    ${itemData.starforce && itemData.starforce > 0 ? `<p><span class="star-icon"></span> ${escapeHTML(itemData.starforce)}</p>` : ''}
    <strong>${escapeHTML(itemData.item_name || '이름 없음')}${itemData.scroll_upgrade && itemData.scroll_upgrade > 0 ? `(+${escapeHTML(itemData.scroll_upgrade)})` : ''}</strong><br>
    <p>레벨 제한: ${escapeHTML((base as any).base_equipment_level || '정보 없음')}</p>
    <p>장비 분류: ${escapeHTML(itemData.item_equipment_part || '정보 없음')}</p>
    ${getStatHTML('STR', (total as any).str, (base as any).str, (add as any).str, (etc as any).str, (star as any).str)}
    ${getStatHTML('DEX', (total as any).dex, (base as any).dex, (add as any).dex, (etc as any).dex, (star as any).dex)}
    ${getStatHTML('LUK', (total as any).luk, (base as any).luk, (add as any).luk, (etc as any).luk, (star as any).luk)}
    ${getStatHTML('INT', (total as any).int, (base as any).int, (add as any).int, (etc as any).int, (star as any).int)}
    ${getStatHTML('최대 HP', (total as any).max_hp, (base as any).max_hp, (add as any).max_hp, (etc as any).max_hp, (star as any).max_hp)}
    ${getStatHTML('공격력', (total as any).attack_power, (base as any).attack_power, (add as any).attack_power, (etc as any).attack_power, (star as any).attack_power)}
    ${getStatHTML('마력', (total as any).magic_power, (base as any).magic_power, (add as any).magic_power, (etc as any).magic_power, (star as any).magic_power)}
    ${getStatHTML('데미지', (total as any).damage, (base as any).damage)}
    ${getStatHTML('올스텟', (total as any).all_stat, (base as any).all_stat, (add as any).all_stat, (etc as any).all_stat, (star as any).all_stat)}
    ${getStatHTML('보스 공격 시 데미지 증가', (total as any).boss_damage, (base as any).boss_damage)}
    ${getStatHTML('몬스터 방어율 무시', (total as any).ignore_monster_armor, (base as any).ignore_monster_armor)}
    ${itemData.potential_option_grade ? `<p>잠재옵션: <span style="color:${getOptionColor(itemData.potential_option_grade)};">${escapeHTML(itemData.potential_option_grade)}</span></p>` : ''}
    ${itemData.potential_option_1 ? `<p>${escapeHTML(itemData.potential_option_1)}</p>` : ''}
    ${itemData.potential_option_2 ? `<p>${escapeHTML(itemData.potential_option_2)}</p>` : ''}
    ${itemData.potential_option_3 ? `<p>${escapeHTML(itemData.potential_option_3)}</p>` : ''}
    ${itemData.additional_potential_option_grade ? `<p>에디셔널 잠재옵션: <span style="color:${getOptionColor(itemData.additional_potential_option_grade)};">${escapeHTML(itemData.additional_potential_option_grade)}</span></p>` : ''}
    ${itemData.additional_potential_option_1 ? `<p>${escapeHTML(itemData.additional_potential_option_1)}</p>` : ''}
    ${itemData.additional_potential_option_2 ? `<p>${escapeHTML(itemData.additional_potential_option_2)}</p>` : ''}
    ${itemData.additional_potential_option_3 ? `<p>${escapeHTML(itemData.additional_potential_option_3)}</p>` : ''}
  `;

  tooltip.style.display = 'block';

  let x = event.pageX, y = event.pageY;
  const w = tooltip.offsetWidth, h = tooltip.offsetHeight;

  if (x + w > window.innerWidth)  x = window.innerWidth  - w - 10;
  if (y + h > window.innerHeight) y = window.innerHeight - h - 10;

  tooltip.style.left = x + 'px';
  tooltip.style.top  = y + 'px';
  isTooltipVisible = true;
}

function getStatHTML(name: string, total = 0, base = 0, add = 0, etc = 0, star = 0): string {
  if (!total || total <= 0) return '';
  const parts = [
    base > 0 && `<span style="color:white;">${escapeHTML(base)}</span>`,
    add  > 0 && `<span style="color:lightgreen;">${escapeHTML(add)}</span>`,
    etc  > 0 && `<span style="color:lightblue;">${escapeHTML(etc)}</span>`,
    star > 0 && `<span style="color:orange;">${escapeHTML(star)}</span>`
  ].filter(Boolean).join(' + ');
  return `<p><span style="color:skyblue;">${escapeHTML(name)}: +${escapeHTML(total)}</span> ${parts ? `(${parts})` : ''}</p>`;
}

function getOptionColor(grade: string): string {
  switch (grade) {
    case '레어':      return 'skyblue';
    case '에픽':      return 'purple';
    case '유니크':    return 'yellow';
    case '레전드리':  return 'lightgreen';
    default:          return 'white';
  }
}

/* ---------- API ---------- */
const API = {
  basic:       (name: string) => `/api/character/${encodeURIComponent(name)}`,
  equipment:   (name: string, preset: number) => `/api/character/${encodeURIComponent(name)}/equipment?preset=${preset}`,
  cashEquip:   (name: string) => `/api/character/${encodeURIComponent(name)}/cash-equipment`,
};

/* ---------- 캐릭터 기본 정보 ---------- */
async function fetchCharacterInfo(characterName: string) {
  try {
    const res = await fetch(API.basic(characterName));
    if (!res.ok) throw new Error('캐릭터 정보를 불러오지 못했습니다.');
    const data = await res.json();

    const nameEl   = document.getElementById('character-name');
    const levelEl  = document.getElementById('character-level');
    const jobEl    = document.getElementById('character-job');
    const serverEl = document.getElementById('character-server');
    const imgEl    = document.getElementById('character-image') as HTMLImageElement | null;

    if (!nameEl || !levelEl || !jobEl || !serverEl || !imgEl) {
      console.error('필수 엘리먼트를 찾을 수 없습니다.');
      return;
    }

    nameEl.innerText   = String(data.character_name ?? '');
    levelEl.innerText  = `레벨: ${String(data.character_level ?? '')}`;
    jobEl.innerText    = `직업: ${String(data.character_class ?? '')}`;
    serverEl.innerText = `서버: ${String(data.world_name ?? '')}`;

    const src = safeImageSrc(data.character_image);
    if (src) {
      imgEl.src = src;
      imgEl.alt = String(data.character_name ?? 'character');
    }

    await fetchEquipmentInfo(characterName, currentPreset);
    await fetchCashEquipmentInfo(characterName);
  } catch (e) {
    console.error('캐릭터 정보를 불러오는 중 오류:', e);
  }
}

/* ---------- 장비 정보(프리셋) ---------- */
async function fetchEquipmentInfo(characterName: string, preset: number) {
  try {
    const res = await fetch(API.equipment(characterName, preset));
    if (!res.ok) throw new Error('장비 정보를 불러오지 못했습니다.');
    const data = await res.json();

    const map: Record<string, string> = {
      "반지4": "ring-4",
      "모자": "hat",
      "엠블렘": "emblem",
      "반지3": "ring-3",
      "펜던트2": "pendant-2",
      "얼굴장식": "face-accessory",
      "반지2": "ring-2",
      "펜던트": "pendant-1",
      "눈장식": "eye-accessory",
      "귀고리": "earring",
      "뱃지": "badge",
      "훈장": "medal",
      "반지1": "ring-1",
      "무기": "weapon",
      "상의": "top",
      "한벌옷": "top",
      "어깨장식": "shoulder",
      "보조무기": "secondary-weapon",
      "포켓 아이템": "pocket-item",
      "벨트": "belt",
      "하의": "bottom",
      "장갑": "gloves",
      "망토": "cloak",
      "신발": "shoes",
      "기계 심장": "mechanical-heart"
    };

    document
      .querySelectorAll<HTMLDivElement>('#equipment-list > div')
      .forEach(el => { el.innerHTML = ''; });

    currentEquipmentData = {};

    const list: ItemData[] = data[`item_equipment_preset_${preset}`] || [];
    list.forEach((item: ItemData) => {
      const id = map[item.item_equipment_slot || ''];
      const slot = id && document.getElementById(id);
      if (slot) {
        const img = document.createElement('img');
        img.src = safeImageSrc(item.item_icon);
        img.alt = String(item.item_name ?? '');
        if (img.src) {
          slot.innerHTML = '';
          slot.appendChild(img);
        }
        currentEquipmentData[id] = item;
      }
    });
  } catch (e) {
    console.error('장비 정보를 불러오는 중 오류:', e);
  }
}

/* ---------- 캐시 장비 ---------- */
async function fetchCashEquipmentInfo(characterName: string) {
  try {
    const res = await fetch(API.cashEquip(characterName));
    if (!res.ok) throw new Error('캐시아이템 정보를 불러오지 못했습니다.');
    const data = await res.json();

    const list = document.getElementById('cash-equipment-list') as HTMLElement | null;
    if (!list) return;
    list.innerHTML = '';

    (data.cash_item_equipment_base || []).forEach((item: any) => {
      const el = document.createElement('div');
      el.className = 'cash-item';

      const img = document.createElement('img');
      img.src = safeImageSrc(item.cash_item_icon);
      img.alt = String(item.cash_item_name ?? '');

      if (img.src) el.appendChild(img);
      el.addEventListener('click', (ev) => toggleTooltip(ev as MouseEvent, item));
      list.appendChild(el);
    });
  } catch (e) {
    console.error('캐시 정보를 불러오는 중 오류:', e);
  }
}

/* ---------- 이벤트 바인딩 ---------- */
function bindEventsOnce() {
  if (eventsBound) return;
  eventsBound = true;

  document.getElementById('equipment-list')?.addEventListener('click', (ev) => {
    const target = (ev.target as HTMLElement).closest<HTMLElement>('[data-slot]');
    if (!target) return;
    const id = target.getAttribute('data-slot') || '';
    const item = currentEquipmentData[id];
    if (item) toggleTooltip(ev as MouseEvent, item);
  });

  document.getElementById('preset-1')?.addEventListener('click', () => changePreset(1));
  document.getElementById('preset-2')?.addEventListener('click', () => changePreset(2));
  document.getElementById('preset-3')?.addEventListener('click', () => changePreset(3));
}

function changePreset(preset: number) {
  if (preset !== 1 && preset !== 2 && preset !== 3) return;
  currentPreset = preset;
  if (currentCharacterName) {
    fetchEquipmentInfo(currentCharacterName, preset);
  }
}

/* ---------- 이름 해석 유틸 ---------- */
function resolveCharacterName(passed?: string): string {
  const p = (passed ?? '').trim();
  if (p) return p;

  const sp = new URLSearchParams(location.search);
  return (sp.get('characterName') ?? sp.get('name') ?? '').trim();
}

/* ---------- 초기화 ---------- */
export function init(passedName?: string) {
  bindEventsOnce();

  const name = resolveCharacterName(passedName);
  if (!name) {
    alert('캐릭터 이름이 필요합니다.');
    return;
  }

  currentCharacterName = name;
  const url = new URL(window.location.href);
  if (!url.searchParams.get('characterName')) {
    url.searchParams.set('characterName', name);
    window.history.replaceState(null, '', url.toString());
  }

  // 기본 데이터 로드
  fetchCharacterInfo(name);
}
