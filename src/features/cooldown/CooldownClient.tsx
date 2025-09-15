'use client';

import Link from 'next/link';
import styles from '@/app/cooldown/page.module.css';
import { useCooldown } from '@/features/cooldown/useCooldown';
import React from 'react';

export default function CooldownClient() {
  const {
    videoWrapperRef,
    videoRef,
    cropAreaRef,
    canvasRef,
    resolution,
    setResolution,
    isScreenSharing,
    isClickMode,
    cropConfirmed,
    isHuntingActive,
    statusText,             // 내부 인식 상태
    firstAlarmSrc,
    setFirstAlarmSrc,
    secondAlarmSrc,
    setSecondAlarmSrc,
    firstVolume,
    setFirstVolume,
    secondVolume,
    setSecondVolume,
    previewFirstAlarm,
    previewSecondAlarm,
    toggleScreenShare,
    enterCropMode,
    onWrapperClick,
    confirmCrop,
    toggleHunting,
  } = useCooldown('1366x768');

  const handleWrapperClick = (event: React.MouseEvent<HTMLDivElement>) => {
    onWrapperClick(event);
  };

  // 간단 상태
  const stateText = isHuntingActive ? '작동중' : '작동 준비중';

  return (
    <main className={styles.page}>
      <aside className={styles.controlPanel}>
        <header className={styles.panelHeader}>
          <h1>사냥 도우미</h1>
          <Link href="/coolhelp" className={styles.helpLink}>
            사용 방법
          </Link>
        </header>

        <div className={styles.statusDisplay}>
          <p>{stateText}</p>
          <p style={{ fontSize: '12px', color: '#888' }}>
            {statusText}
          </p>
        </div>

        <section className={styles.controlSection}>
          <h2>1. 화면 설정</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="resolution-select">해상도 선택</label>
            <select
              id="resolution-select"
              value={resolution}
              onChange={(e) => setResolution(e.target.value as any)}
              disabled={isScreenSharing}
            >
              <option value="1280x720">1280×720</option>
              <option value="1366x768">1366×768</option>
              <option value="1920x1080">1920×1080</option>
            </select>
          </div>
          <button className={styles.btn} onClick={toggleScreenShare}>
            {isScreenSharing ? '화면 공유 중단' : '화면 공유 시작'}
          </button>
          <div className={styles.buttonRow}>
            <button
              className={styles.btn}
              onClick={enterCropMode}
              disabled={!isScreenSharing}
            >
              {isClickMode ? '화면 자르는 중...' : '화면 자르기'}
            </button>
            <button
              className={styles.btn}
              onClick={confirmCrop}
              disabled={!isScreenSharing || !isClickMode}
            >
              화면 확정
            </button>
          </div>
        </section>

        <section className={styles.controlSection}>
          <h2>2. 알람 설정</h2>

          <div className={styles.inputGroup}>
            <label htmlFor="first-alarm">1번째 알람</label>
            <div className={styles.selectWithButton}>
              <select
                id="first-alarm"
                value={firstAlarmSrc}
                onChange={(e) => setFirstAlarmSrc(e.target.value)}
              >
                <option value="/assets/sound/alarm.mp3">부르르르</option>
                <option value="/assets/sound/BikBik.mp3">삑삑</option>
                <option value="/assets/sound/dingdong.mp3">딩동</option>
              </select>
              <button type="button" onClick={previewFirstAlarm}>🔊</button>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="first-alarm-volume">
              음량: {Math.round(firstVolume * 100)}%
            </label>
            <input
              id="first-alarm-volume"
              type="range"
              min={0} max={1} step={0.1}
              value={firstVolume}
              onChange={(e) => setFirstVolume(Number(e.target.value))}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="second-alarm">2번째 알람</label>
            <div className={styles.selectWithButton}>
              <select
                id="second-alarm"
                value={secondAlarmSrc}
                onChange={(e) => setSecondAlarmSrc(e.target.value)}
              >
                <option value="/assets/sound/money.mp3">돈먹어</option>
                <option value="/assets/sound/BikBik.mp3">삑삑</option>
                <option value="/assets/sound/dingdong.mp3">딩동</option>
              </select>
              <button type="button" onClick={previewSecondAlarm}>🔊</button>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="second-alarm-volume">
              음량: {Math.round(secondVolume * 100)}%
            </label>
            <input
              id="second-alarm-volume"
              type="range"
              min={0} max={1} step={0.1}
              value={secondVolume}
              onChange={(e) => setSecondVolume(Number(e.target.value))}
            />
          </div>
        </section>

        <section className={styles.controlSection}>
          <h2>3. 사냥 제어</h2>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={toggleHunting}
            disabled={!cropConfirmed}
          >
            {isHuntingActive ? '사냥 중지' : '사냥 시작'}
          </button>
        </section>
      </aside>

      <div className={styles.displayArea}>
        <div
          ref={videoWrapperRef}
          className={styles.videoWrapper}
          onClick={handleWrapperClick}
        >
          <video ref={videoRef} className={styles.sharedScreen} autoPlay playsInline />
          <div ref={cropAreaRef} className={styles.cropArea} />
        </div>
        <canvas ref={canvasRef} className={styles.captureCanvas} />
      </div>
    </main>
  );
}
