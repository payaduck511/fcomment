'use client';

import { useEffect, useState } from 'react';
import NavBar from '@/features/common/NavBar';
import {
  useCubeSim,
  type SelectedItem,
  type GradeKo,
} from '@/features/cubesim/useCubeSim';
import styles from './page.module.css';

export default function CubeSimPage() {
  const sim = useCubeSim();

  // 폼 상태
  const [equipmentType, setEquipmentType] = useState<string>('무기');
  const [level, setLevel] = useState<number | ''>('');
  const [potential, setPotential] = useState<GradeKo>('레어');
  const [additionalPotential, setAdditionalPotential] = useState<GradeKo>('레어');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lvl = typeof level === 'string' ? parseInt(level) : level;
    if (!Number.isFinite(lvl)) {
      alert('장비 레벨을 올바르게 입력해주세요.');
      return;
    }
    const item: SelectedItem = {
      equipmentType,
      level: Number(lvl),
      potential,
      additionalPotential,
    };
    sim.saveItem(item);
  }

  return (
    <>
      <NavBar />

      <div className={styles.fullscreenWarning}>
        최적의 사용을 위해 전체화면으로 사용해주세요.
      </div>

      <main className={styles.page}>
        <div className={styles.mainContainer}>
          {/* 좌측: 기본/에디셔널 패널 */}
          <section className={styles.cubeSimulator}>
            {/* 기본 잠재능력 */}
            <div className={styles.cubeContent}>
              <h1 className={styles.titleRow}>
                <span className={`${styles.cubeIcon} ${styles.blackCube}`} />
                잠재능력
              </h1>

              <p>현재 등급: {sim.currentGrade}</p>

              <p>
                {/* 보기 좋게 줄바꿈 */}
                레어 실패: {sim.failCount.rare}/10 <br />
                에픽 실패: {sim.failCount.epic}/42 <br />
                유니크 실패: {sim.failCount.unique}/107
              </p>

              <button className={styles.button} onClick={sim.onClickCube}>
                큐브 돌리기
              </button>
            </div>

            {/* 에디셔널 잠재능력 */}
            <div className={styles.additionalCubeContent}>
              <h2 className={styles.titleRow}>
                <span className={`${styles.cubeIcon} ${styles.additionalCube}`} />
                에디셔널
              </h2>

              <p>현재 에디셔널 등급: {sim.additionalCurrentGrade}</p>

              <p>
                레어 실패: {sim.additionalFailCount.rare}/62 <br />
                에픽 실패: {sim.additionalFailCount.epic}/152 <br />
                유니크 실패: {sim.additionalFailCount.unique}/214
              </p>

              <button
                className={styles.button}
                onClick={sim.onClickAdditionalCube}
              >
                에디셔널 돌리기
              </button>
            </div>
          </section>

          {/* 중앙: 큰 이미지 + 결과 박스 */}
          <section className={styles.cubeImage}>
            <div className={styles.resultBox}>
              <div
                className={styles.gradeBox}
                style={{ backgroundColor: sim.gradeBox.color }}
              >
                {sim.gradeBox.label}
              </div>
              <div className={styles.optionLine}>{sim.line1 || '옵션 1'}</div>
              <div className={styles.optionLine}>{sim.line2 || '옵션 2'}</div>
              <div className={styles.optionLine}>{sim.line3 || '옵션 3'}</div>
            </div>
          </section>

          {/* 우측: 아이템 정보 입력 */}
          <aside className={styles.itemInfo}>
            <h2>아이템 정보 입력</h2>
            <form onSubmit={onSubmit}>
              <label htmlFor="equipment-type">장비 분류:</label>
              <select
                id="equipment-type"
                className={styles.select}
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value)}
              >
                <option value="무기">무기</option>
                <option value="엠블렘">엠블렘</option>
                <option value="보조무기">보조무기</option>
                <option value="포스실드, 소울링">포스실드, 소울링</option>
                <option value="방패">방패</option>
                <option value="모자">모자</option>
                <option value="상의">상의</option>
                <option value="한벌옷">한벌옷</option>
                <option value="하의">하의</option>
                <option value="신발">신발</option>
                <option value="장갑">장갑</option>
                <option value="망토">망토</option>
                <option value="벨트">벨트</option>
                <option value="어깨장식">어깨장식</option>
                <option value="얼굴장식">얼굴장식</option>
                <option value="눈장식">눈장식</option>
                <option value="귀고리">귀고리</option>
                <option value="반지">반지</option>
                <option value="펜던트">펜던트</option>
                <option value="기계심장">기계심장</option>
              </select>

              <label htmlFor="level">장비 레벨:</label>
              <input
                id="level"
                type="number"
                className={styles.input}
                placeholder="장비 레벨 입력"
                required
                value={level}
                onChange={(e) => {
                  const v = e.target.value;
                  setLevel(v === '' ? '' : Number(v));
                }}
              />

              <label htmlFor="potential">잠재옵션 시작 등급:</label>
              <select
                id="potential"
                className={styles.select}
                value={potential}
                onChange={(e) => setPotential(e.target.value as GradeKo)}
              >
                <option value="레어">레어</option>
                <option value="에픽">에픽</option>
                <option value="유니크">유니크</option>
                <option value="레전드리">레전드리</option>
              </select>

              <label htmlFor="additional-potential">에디셔널 시작 등급:</label>
              <select
                id="additional-potential"
                className={styles.select}
                value={additionalPotential}
                onChange={(e) => setAdditionalPotential(e.target.value as GradeKo)}
              >
                <option value="레어">레어</option>
                <option value="에픽">에픽</option>
                <option value="유니크">유니크</option>
                <option value="레전드리">레전드리</option>
              </select>

              <button type="submit" className={styles.button}>
                저장
              </button>
            </form>

            <p className={styles.input} style={{ background: 'transparent', border: 'none', marginTop: 10 }}>
              대부분의 아이템은 120제 이상으로 구현하였습니다.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}
