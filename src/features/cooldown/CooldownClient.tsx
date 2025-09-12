// /src/features/cooldown/CooldownClient.tsx

'use client';

import Link from 'next/link';
import styles from '@/app/cooldown/page.module.css';
import { useCooldown } from '@/features/cooldown/useCooldown';

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
    statusText,
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
  } = useCooldown('1280x720');

  return (
    <main className={styles.page}>
      <div className={styles.app} id="app">
        <h1>
          사냥 도우미
          <Link href="/coolhelp" className={styles.helpButton}>
            사용 방법
          </Link>
        </h1>

        {/* (1) 해상도 + 버튼 + 상태 */}
        <div className={styles.controlContainer}>
          <div>
            <label htmlFor="resolution-select" className={styles.labelResolution}>
              해상도 선택:
            </label>
            <select
              id="resolution-select"
              className={styles.resolutionSelect}
              value={resolution}
              onChange={(e) => setResolution(e.target.value as any)}
            >
              <option value="1280x720">1280×720</option>
              <option value="1366x768">1366×768</option>
              <option value="1920x1080">1920×1080</option>
            </select>

            <p className={styles.cooldownDisplay}>{statusText}</p>
          </div>

          <div className={styles.buttonGroup}>
            <button className={styles.btn} onClick={toggleScreenShare}>
              {isScreenSharing ? '화면 공유 중단' : '화면 공유 시작'}
            </button>

            <button
              className={styles.btn}
              onClick={enterCropMode}
              disabled={!isScreenSharing}
            >
              {isClickMode ? '화면 자르는 중' : '화면 자르기'}
            </button>

            <button
              className={styles.btn}
              onClick={confirmCrop}
              disabled={!isScreenSharing || !isClickMode}
            >
              화면 확정
            </button>

            <button
              className={styles.btn}
              onClick={toggleHunting}
              disabled={!cropConfirmed}
            >
              {isHuntingActive ? '사냥 중지' : '사냥 시작'}
            </button>
          </div>
        </div>

        {/* (2) 알람 선택 & 음량 */}
        <div className={styles.alarmContainer}>
          <div className={styles.alarmRow}>
            <label htmlFor="first-alarm">1번째 알람:</label>
            <select
              id="first-alarm"
              value={firstAlarmSrc}
              onChange={(e) => setFirstAlarmSrc(e.target.value)}
            >
              <option value="/assets/sound/alarm.mp3">부르르르</option>
              <option value="/assets/sound/BikBik.mp3">삑삑</option>
              <option value="/assets/sound/dingdong.mp3">딩동</option>
            </select>
            <button type="button" className={styles.btnPreview} onClick={previewFirstAlarm}>
              🔊 미리 듣기
            </button>
          </div>

          <div className={styles.alarmRow}>
            <label htmlFor="second-alarm">2번째 알람:</label>
            <select
              id="second-alarm"
              value={secondAlarmSrc}
              onChange={(e) => setSecondAlarmSrc(e.target.value)}
            >
              <option value="/assets/sound/money.mp3">돈먹어</option>
              <option value="/assets/sound/BikBik.mp3">삑삑</option>
              <option value="/assets/sound/dingdong.mp3">딩동</option>
            </select>
            <button type="button" className={styles.btnPreview} onClick={previewSecondAlarm}>
              🔊 미리 듣기
            </button>
          </div>

          <div className={styles.volumeControl}>
            <label htmlFor="first-alarm-volume">1번째 알람 음량: {firstVolume.toFixed(1)}</label>
            <input
              id="first-alarm-volume"
              className={styles.range}
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={firstVolume}
              onChange={(e) => setFirstVolume(Number(e.target.value))}
            />

            <label htmlFor="second-alarm-volume">2번째 알람 음량: {secondVolume.toFixed(1)}</label>
            <input
              id="second-alarm-volume"
              className={styles.range}
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={secondVolume}
              onChange={(e) => setSecondVolume(Number(e.target.value))}
            />
          </div>
        </div>

        {/* (3) 비디오 + 자르기 영역 + 캔버스 */}
        <div
          ref={videoWrapperRef}
          className={styles.videoWrapper}
          onClick={onWrapperClick}
          id="video-wrapper"
        >
          <video ref={videoRef} className={styles.sharedScreen} autoPlay playsInline id="shared-screen" />
          <div ref={cropAreaRef} className={styles.cropArea} id="crop-area" />
        </div>

        <canvas ref={canvasRef} className={styles.captureCanvas} id="capture-canvas" />
      </div>
    </main>
  );
}