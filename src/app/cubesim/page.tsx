// /src/app/cubesim/page.tsx

'use client';

import { useState } from 'react';
import NavBar from '@/features/common/NavBar';
import { useCubeSim, GradeKo, SelectedItem, PotentialResult } from '@/features/cubesim/useCubeSim';
import { myOptionProvider } from '@/features/cubesim/optionProvider';
import styles from './page.module.css';

type ResultCardProps = {
  type: 'BEFORE' | 'AFTER';
  result: PotentialResult;
  gradeColors: Record<GradeKo, string>;
  onClick: () => void;
  isDisabled?: boolean;
  isUpgraded?: boolean;
};

function ResultCard({ type, result, gradeColors, onClick, isDisabled, isUpgraded }: ResultCardProps) {
  // --- 클래스 이름 동적 관리 ---
  const cardClassName = [
    styles.resultCard,
    isDisabled ? styles.disabledCard : '',
    isUpgraded ? styles.upgradedCard : '',
    isUpgraded && result.grade === '레전드리' ? styles.gradeLegendary : '',
    isUpgraded && result.grade === '유니크' ? styles.gradeUnique : '',
    isUpgraded && result.grade === '에픽' ? styles.gradeEpic : '',
  ].join(' ');

  return (
    <div className={cardClassName} onClick={isDisabled ? undefined : onClick}>
      <div className={styles.cardHeader}>{type}</div>
      <div className={styles.cardContent}>
        <div 
          className={styles.cardGrade} 
          style={{ backgroundColor: gradeColors[result.grade] }}
        >
          {result.grade}
        </div>
        {result.lines.map((line, index) => (
          <div key={index} className={styles.cardOptionLine}>
            {line}
          </div>
        ))}
      </div>
      <div className={styles.cardFooter}>
         전투력 증가량
        <span style={{ color: type === 'BEFORE' ? 'white' : '#86E57F' }}>
          {type === 'BEFORE' ? ' ±0' : ` ▲+${Math.floor(Math.random() * 10000)}`}
        </span>
      </div>
    </div>
  );
}

// --- 메인 페이지 컴포넌트 ---
export default function CubeSimPage() {
  const sim = useCubeSim({ optionProvider: myOptionProvider });
  const [equipmentType, setEquipmentType] = useState<string>('무기');
  const [level, setLevel] = useState<number | ''>('');
  const [potential, setPotential] = useState<GradeKo>('레어');
  const [additionalPotential, setAdditionalPotential] = useState<GradeKo>('레어');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lvl = typeof level === 'string' ? parseInt(level, 10) : level;
    if (!lvl || !Number.isFinite(lvl)) {
      alert('장비 레벨을 올바르게 입력해주세요.');
      return;
    }
    const item: SelectedItem = { equipmentType, level: lvl, potential, additionalPotential };
    sim.saveItem(item);
  }

  const cubeImageClassName = `${styles.cubeImage} ${
    sim.cubeResults.after.length > 0 ? styles.resultsVisible : ''
  }`;

  return (
    <>

      <div className={styles.navBarWrapper}>
        <NavBar />
      </div>
      <div className={styles.fullscreenWarning}>최적의 사용을 위해 전체화면으로 사용해주세요.</div>

      <main className={styles.page}>
        <div className={styles.mainContainer}>
          {/* 좌측: 컨트롤 패널 */}
          <section className={styles.cubeSimulator}>
            {/* 잠재능력 */}
            <div className={styles.cubeContent}>
              <h1 className={styles.titleRow}>
                <span className={`${styles.cubeIcon} ${styles.blackCube}`} />잠재능력
              </h1>
              <p>현재 등급: {sim.currentGrade}</p>
              <p>{sim.failText}</p>
              <button
                className={styles.button}
                onClick={() => {
                  sim.setIsAdditionalMode(false);
                  sim.handleCubeReroll();
                }}
              >
                큐브 사용하기
              </button>
            </div>

            {/* 에디셔널 */}
            <div className={styles.additionalCubeContent}>
              <h2 className={styles.titleRow}>
                <span className={`${styles.cubeIcon} ${styles.additionalCube}`} />에디셔널
              </h2>
              <p>현재 에디셔널 등급: {sim.additionalCurrentGrade}</p>
              <p>{sim.additionalFailText}</p>
              <button
                className={styles.button}
                onClick={() => {
                  sim.setIsAdditionalMode(true);
                  sim.handleCubeReroll();
                }}
              >
                큐브 사용하기
              </button>
            </div>
          </section>

          {/* 중앙: 결과 표시 영역 */}
          <section className={cubeImageClassName}>
            {sim.cubeResults.after.length > 0 && sim.cubeResults.before && (
              <div className={styles.resultsContainer}>
                <h3 className={styles.resultsTitle}>
                  {sim.cubeResults.gradeUpOccurred 
                    ? '등급이 상승했습니다! 적용할 옵션을 선택해주세요.'
                    : '재설정된 잠재능력 중 적용할 옵션을 선택해 주세요.'
                  }
                </h3>
                <div className={styles.resultCardsWrapper}>
                  <ResultCard 
                    type="BEFORE" 
                    result={sim.cubeResults.before} 
                    gradeColors={sim.gradeColors}
                    isDisabled={sim.cubeResults.gradeUpOccurred}
                    onClick={() => sim.applyResult(null)}
                  />
                  {sim.cubeResults.after.map((result, index) => {
                    const isUpgraded = sim.gradeOrder[result.grade] > sim.gradeOrder[sim.cubeResults.before!.grade];
                    return (
                      <ResultCard 
                        key={index}
                        type="AFTER"
                        result={result}
                        gradeColors={sim.gradeColors}
                        isUpgraded={isUpgraded}
                        onClick={() => sim.applyResult(result)}
                      />
                    );
                  })}
                </div>
                <div className={styles.rerollButtonContainer}>
                   <div className={styles.rerollInfo}>
                     ⓘ 재설정을 누를 경우 자동으로 BEFORE 옵션이 선택됩니다.
                   </div>
                   <button className={styles.rerollButton} onClick={sim.handleCubeReroll}>
                     재설정 1회
                   </button>
                </div>
              </div>
            )}

            {/* 평상시 아이템 정보창 */}
            {sim.cubeResults.after.length === 0 && (
              <div className={styles.resultBox}>
                <div className={styles.gradeBox} style={{ backgroundColor: sim.activeGradeBox.color }}>
                  {sim.activeGradeBox.label}
                </div>
                <div className={styles.optionLine}>{sim.line1 || '옵션 1'}</div>
                <div className={styles.optionLine}>{sim.line2 || '옵션 2'}</div>
                <div className={styles.optionLine}>{sim.line3 || '옵션 3'}</div>
              </div>
            )}
          </section>

          {/* 우측: 아이템 정보 입력 */}
          <aside className={styles.itemInfo}>
            <h2>아이템 정보 입력</h2>
            <form onSubmit={onSubmit}>
              <label htmlFor="equipment-type">장비 분류:</label>
              <select id="equipment-type" className={styles.select} value={equipmentType} onChange={(e) => setEquipmentType(e.target.value)}>
                 {/* 옵션 리스트는 생략 */}
                <option value="무기">무기</option><option value="엠블렘">엠블렘</option><option value="보조무기">보조무기</option><option value="포스실드, 소울링">포스실드, 소울링</option><option value="방패">방패</option><option value="모자">모자</option><option value="상의">상의</option><option value="한벌옷">한벌옷</option><option value="하의">하의</option><option value="신발">신발</option><option value="장갑">장갑</option><option value="망토">망토</option><option value="벨트">벨트</option><option value="어깨장식">어깨장식</option><option value="얼굴장식">얼굴장식</option><option value="눈장식">눈장식</option><option value="귀고리">귀고리</option><option value="반지">반지</option><option value="펜던트">펜던트</option><option value="기계심장">기계심장</option>
              </select>

              <label htmlFor="level">장비 레벨:</label>
              <input id="level" type="number" className={styles.input} placeholder="장비 레벨 입력" required value={level} onChange={(e) => setLevel(e.target.value === '' ? '' : Number(e.target.value))} />

              <label htmlFor="potential">잠재옵션 시작 등급:</label>
              <select id="potential" className={styles.select} value={potential} onChange={(e) => setPotential(e.target.value as GradeKo)}>
                <option value="레어">레어</option><option value="에픽">에픽</option><option value="유니크">유니크</option><option value="레전드리">레전드리</option>
              </select>

              <label htmlFor="additional-potential">에디셔널 시작 등급:</label>
              <select id="additional-potential" className={styles.select} value={additionalPotential} onChange={(e) => setAdditionalPotential(e.target.value as GradeKo)}>
                <option value="레어">레어</option><option value="에픽">에픽</option><option value="유니크">유니크</option><option value="레전드리">레전드리</option>
              </select>

              <button type="submit" className={styles.button}>저장</button>
            </form>
            
            <hr className={styles.divider} />

            {/* --- 신규 기능 토글 스위치 --- */}
            <div className={styles.toggleSwitchContainer}>
                <span>MVP 블랙 모드</span>
                <label className={styles.switch}>
                    <input type="checkbox" checked={sim.isMvpBlackMode} onChange={(e) => sim.setMvpBlackMode(e.target.checked)} />
                    <span className={styles.slider}></span>
                </label>
            </div>
            <div className={styles.toggleSwitchContainer}>
                <span>미라클 타임</span>
                <label className={styles.switch}>
                    <input type="checkbox" checked={sim.isMiracleTime} onChange={(e) => sim.setMiracleTime(e.target.checked)} />
                    <span className={styles.slider}></span>
                </label>
            </div>

          </aside>
        </div>
      </main>
    </>
  );
}