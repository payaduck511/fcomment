// /src/features/charinfo/ItemTooltip.tsx

'use client';

import styles from '@/app/charinfo/page.module.css';
import { ItemData } from '@/features/charinfo/types';

// 툴팁에 표시될 옵션의 색상을 반환하는 함수
const getOptionColor = (grade?: string) => {
    switch (grade) {
        case '레어': return '#00BFFF';
        case '에픽': return '#9932CC';
        case '유니크': return '#FFD700';
        case '레전드리': return '#32CD32';
        default: return 'white';
    }
};

// 툴팁 컴포넌트
export default function ItemTooltip({ tooltip }: { tooltip: { visible: boolean, data: ItemData | null, x: number, y: number } }) {
    if (!tooltip.visible || !tooltip.data) {
        return null;
    }

    const { data, x, y } = tooltip;
    const item = data;

    return (
        <div className={styles.tooltip} style={{ left: x + 15, top: y + 15 }}>
            <p className={styles.tooltipTitle}>
                {item.item_name} {item.scroll_upgrade && item.scroll_upgrade > 0 ? `(+${item.scroll_upgrade})` : ''}
            </p>
            {/* 여기에 잠재능력, 추가옵션 등 툴팁 내용을 채워넣습니다. */}
            {item.potential_option_grade && (
                <div className={styles.potentialSection}>
                    <p style={{ color: getOptionColor(item.potential_option_grade) }}>잠재옵션 ({item.potential_option_grade})</p>
                    <p>{item.potential_option_1}</p>
                    <p>{item.potential_option_2}</p>
                    <p>{item.potential_option_3}</p>
                </div>
            )}
            {item.additional_potential_option_grade && (
                 <div className={styles.potentialSection}>
                    <p style={{ color: getOptionColor(item.additional_potential_option_grade) }}>에디셔널 잠재옵션 ({item.additional_potential_option_grade})</p>
                    <p>{item.additional_potential_option_1}</p>
                    <p>{item.additional_potential_option_2}</p>
                    <p>{item.additional_potential_option_3}</p>
                </div>
            )}
        </div>
    );
}