// /src/features/charinfo/CharInfoClient.tsx

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
      // 캐릭터 이름이 없는 경우 처리 (예: 검색 페이지로 리디렉션 또는 안내 메시지)
      setError('검색할 캐릭터 이름을 입력해주세요.');
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

  if (loading) {
    return <main className={styles.page}><div className={styles.message}>정보를 불러오는 중...</div></main>;
  }
  if (error) {
    return <main className={styles.page}><div className={styles.message}>{error}</div></main>;
  }
  if (!characterInfo) {
    return <main className={styles.page}><div className={styles.message}>캐릭터 정보가 없습니다.</div></main>;
  }

  // 장비 슬롯 매핑
  const equipmentMap = equipment.reduce((acc, item) => {
    if (item.item_equipment_slot) {
      acc[item.item_equipment_slot] = item;
    }
    return acc;
  }, {} as Record<string, ItemData>);

  const renderSlot = (slotName: string, displayName: string) => {
      const item = equipmentMap[displayName];
      return (
        <div className={styles.slot} data-slot={slotName}>
          {item && item.item_icon && (
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
        <div className={styles.container}>
            <section className={styles.profileSection}>
                <img id="character-image" src={characterInfo.character_image} alt={characterInfo.character_name} className={styles.characterImage} />
                <div className={styles.profileDetails}>
                    <h1 id="character-name">{characterInfo.character_name}</h1>
                    <p id="character-level">레벨: {characterInfo.character_level}</p>
                    <p id="character-job">직업: {characterInfo.character_class}</p>
                    <p id="character-server">서버: {characterInfo.world_name}</p>
                </div>
            </section>

            <section className={styles.equipmentSection}>
                <h2>장비</h2>
                <div className={styles.presetButtons}>
                    <button onClick={() => handlePresetChange(1)} className={activePreset === 1 ? styles.active : ''}>1</button>
                    <button onClick={() => handlePresetChange(2)} className={activePreset === 2 ? styles.active : ''}>2</button>
                    <button onClick={() => handlePresetChange(3)} className={activePreset === 3 ? styles.active : ''}>3</button>
                </div>
                <div className={styles.equipmentGrid}>
                    {/* 장비 슬롯 렌더링 */}
                    {renderSlot('ring-1', '반지1')}
                    {renderSlot('ring-2', '반지2')}
                    {renderSlot('ring-3', '반지3')}
                    {renderSlot('ring-4', '반지4')}
                    {renderSlot('pocket-item', '포켓 아이템')}
                    {renderSlot('pendant-1', '펜던트')}
                    {renderSlot('pendant-2', '펜던트2')}
                    {renderSlot('belt', '벨트')}
                    {renderSlot('medal', '훈장')}
                    {renderSlot('badge', '뱃지')}
                    {renderSlot('hat', '모자')}
                    {renderSlot('face-accessory', '얼굴장식')}
                    {renderSlot('eye-accessory', '눈장식')}
                    {renderSlot('top', '상의')}
                    {renderSlot('bottom', '하의')}
                    {renderSlot('shoes', '신발')}
                    {renderSlot('earring', '귀고리')}
                    {renderSlot('shoulder', '어깨장식')}
                    {renderSlot('gloves', '장갑')}
                    {renderSlot('emblem', '엠블렘')}
                    {renderSlot('weapon', '무기')}
                    {renderSlot('secondary-weapon', '보조무기')}
                    {renderSlot('cloak', '망토')}
                    {renderSlot('mechanical-heart', '기계 심장')}
                </div>
            </section>

             <section className={styles.cashEquipmentSection}>
                <h2>캐시 장비</h2>
                <div className={styles.cashGrid}>
                    {cashEquipment.map((item, index) => (
                        <div key={index} className={styles.cashItem}>
                            {item.cash_item_icon && <img src={item.cash_item_icon} alt={item.cash_item_name} />}
                        </div>
                    ))}
                </div>
            </section>
        </div>
      </main>
      <ItemTooltip tooltip={tooltip} />
    </>
  );
}