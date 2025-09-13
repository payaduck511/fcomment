'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '@/app/charinfo/page.module.css';
import ItemTooltip from '@/features/charinfo/ItemTooltip';
import { ItemData } from '@/features/charinfo/types';

const API = {
  basic: (name: string) => `/api/character/${encodeURIComponent(name)}`,
  equipment: (name:string, preset: number) => `/api/character/${encodeURIComponent(name)}/equipment?preset=${preset}`,
  cashEquip: (name: string) => `/api/character/${encodeURIComponent(name)}/cash-equipment`,
};

// 장비 슬롯의 표시 이름과 API에서 오는 실제 이름을 매핑합니다.
const slotDisplayNameMap: Record<string, string> = {
    '반지1': 'ring-1', '반지2': 'ring-2', '반지3': 'ring-3', '반지4': 'ring-4',
    '포켓 아이템': 'pocket-item', '펜던트': 'pendant-1', '펜던트2': 'pendant-2', '벨트': 'belt',
    '훈장': 'medal', '뱃지': 'badge', '모자': 'hat', '얼굴장식': 'face-accessory',
    '눈장식': 'eye-accessory', '상의': 'top', '하의': 'bottom', '신발': 'shoes',
    '귀고리': 'earring', '어깨장식': 'shoulder', '장갑': 'gloves', '엠블렘': 'emblem',
    '무기': 'weapon', '보조무기': 'secondary-weapon', '망토': 'cloak', '기계 심장': 'mechanical-heart'
};

const equipmentSlotsLayout = [
    '반지4', null, '모자', null, '엠블렘',
    '반지3', '펜던트2', '얼굴장식', null, '뱃지',
    '반지2', '펜던트', '눈장식', '귀고리', '훈장',
    '반지1', '무기', '상의', '어깨장식', '보조무기',
    '포켓 아이템', '벨트', '하의', '장갑', '망토',
    null, null, '신발', null, '기계 심장'
];

export default function CharInfoClient() {
  const searchParams = useSearchParams();
  const [characterName, setCharacterName] = useState('');
  const [characterInfo, setCharacterInfo] = useState<any>(null);
  const [equipment, setEquipment] = useState<ItemData[]>([]);
  const [cashEquipment, setCashEquipment] = useState<any[]>([]);
  const [activePreset, setActivePreset] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    data: ItemData | null;
    x: number;
    y: number;
  }>({ visible: false, data: null, x: 0, y: 0 });

  const fetchData = useCallback(async (name: string, preset: 1 | 2 | 3) => {
    setLoading(true);
    setError(null);
    try {
      const [basicRes, equipRes, cashRes] = await Promise.all([
        fetch(API.basic(name)),
        fetch(API.equipment(name, preset)),
        fetch(API.cashEquip(name)),
      ]);

      if (!basicRes.ok || !equipRes.ok || !cashRes.ok) {
        throw new Error('캐릭터 정보를 불러오는 데 실패했습니다.');
      }

      const basicData = await basicRes.json();
      const equipData = await equipRes.json();
      const cashData = await cashRes.json();
      
      setCharacterInfo(basicData);
      setEquipment(equipData[`item_equipment_preset_${preset}`] || []);
      setCashEquipment(cashData.cash_item_equipment_base || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const nameFromURL = searchParams.get('characterName');
    if (nameFromURL) {
      setCharacterName(nameFromURL);
      fetchData(nameFromURL, activePreset);
    } else {
      setError('검색할 캐릭터 이름을 URL에 추가해주세요. (예: /charinfo?characterName=매우기뻐)');
      setLoading(false);
    }
  }, [searchParams, activePreset, fetchData]);

  const handlePresetChange = (preset: 1 | 2 | 3) => {
    setActivePreset(preset);
  };
  
  const handleItemHover = (e: React.MouseEvent, itemData: ItemData) => {
      setTooltip({ visible: true, data: itemData, x: e.clientX, y: e.clientY });
  };
  const handleItemLeave = () => {
      setTooltip({ visible: false, data: null, x: 0, y: 0 });
  };

  if (loading || error) {
    return (
        <main className={`${styles.page} ${styles.centeredContainer}`}>
            <div className={styles.message}>{loading ? "캐릭터 정보를 불러오는 중..." : error}</div>
        </main>
    );
  }

  if (!characterInfo) {
    return (
        <main className={`${styles.page} ${styles.centeredContainer}`}>
            <div className={styles.message}>캐릭터 정보가 없습니다.</div>
        </main>
    );
  }

  // 장비 슬롯 맵 생성
  const equipmentMap = equipment.reduce((acc, item) => {
    if (item.item_equipment_slot) {
      acc[item.item_equipment_slot] = item;
    }
    return acc;
  }, {} as Record<string, ItemData>);


  const renderSlot = (displayName: string | null) => {
    if (!displayName) {
      return <div className={`${styles.equipmentSlot} ${styles.emptySlot}`}></div>;
    }
    const item = equipmentMap[displayName];
    return (
      <div 
        className={`${styles.equipmentSlot} ${item ? '' : styles.emptySlot}`} 
        data-grade={item?.potential_option_grade}
        id={slotDisplayNameMap[displayName] || ''}
      >
        {item?.item_icon && (
          <img 
            src={item.item_icon} 
            alt={item.item_name} 
            onMouseMove={(e) => handleItemHover(e, item)}
            onMouseLeave={handleItemLeave}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <main className={styles.page}>
        <aside className={styles.profilePanel}>
            <div className={styles.characterImageContainer}>
                <img src={characterInfo.character_image} alt={characterInfo.character_name} />
            </div>
            <h1 className={styles.characterName}>{characterInfo.character_name}</h1>
            <div className={styles.characterDetails}>
                <p><strong>레벨</strong> <span>{characterInfo.character_level}</span></p>
                <p><strong>직업</strong> <span>{characterInfo.character_class}</span></p>
                <p><strong>서버</strong> <span>{characterInfo.world_name}</span></p>
                <p><strong>길드</strong> <span>{characterInfo.character_guild_name || '없음'}</span></p>
            </div>
        </aside>

        <section className={styles.equipmentPanel}>
            <header className={styles.panelHeader}>
                <h2>장비 프리셋</h2>
                <div className={styles.presetButtons}>
                    <button onClick={() => handlePresetChange(1)} className={activePreset === 1 ? styles.active : ''}>1</button>
                    <button onClick={() => handlePresetChange(2)} className={activePreset === 2 ? styles.active : ''}>2</button>
                    <button onClick={() => handlePresetChange(3)} className={activePreset === 3 ? styles.active : ''}>3</button>
                </div>
            </header>
            <div className={styles.equipmentGrid}>
                {equipmentSlotsLayout.map((slotName, index) => (
                    <div key={index}>{renderSlot(slotName)}</div>
                ))}
            </div>
        </section>
      </main>
      <ItemTooltip tooltip={tooltip} />
    </>
  );
}

