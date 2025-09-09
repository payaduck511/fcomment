// src/features/cooldown/useCooldown.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** 해상도 문자열 예: "1280x720" */
export type Resolution = `${number}x${number}`;

type NumberTemplates = Record<number, HTMLImageElement>;

export function useCooldown(initialResolution: Resolution = '1280x720') {
  // ---- Refs ----
  const videoWrapperRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cropAreaRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ---- 상태 ----
  const [resolution, setResolution] = useState<Resolution>(initialResolution);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isClickMode, setIsClickMode] = useState(false);
  const [cropConfirmed, setCropConfirmed] = useState(false);
  const [isHuntingActive, setIsHuntingActive] = useState(false);
  const [statusText, setStatusText] = useState<string>('대기중');

  const [clickX, setClickX] = useState(0);
  const [clickY, setClickY] = useState(0);

  // 알람 선택/음량
  const [firstAlarmSrc, setFirstAlarmSrc] = useState<string>('/assets/Sound/alarm.mp3');
  const [secondAlarmSrc, setSecondAlarmSrc] = useState<string>('/assets/Sound/money.mp3');
  const firstAlarmRef = useRef<HTMLAudioElement | null>(null);
  const secondAlarmRef = useRef<HTMLAudioElement | null>(null);
  const [firstVolume, setFirstVolume] = useState(1);
  const [secondVolume, setSecondVolume] = useState(1);

  // 내부 전역
  const boxWidth = 28;
  const boxHeight = 28;
  const numberTemplatesRef = useRef<NumberTemplates>({});
  const captureIntervalRef = useRef<number | null>(null);
  const isCooldownRef = useRef(false);
  const alarmIndexRef = useRef<0 | 1>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // 디버깅 캡쳐 미리보기 (선택적 노출)
  const [capturePreview, setCapturePreview] = useState<string>('');

  // -------- 해상도 적용(래퍼 사이즈) --------
  const applyWrapperSize = useCallback(
    (res: Resolution) => {
      const wrapper = videoWrapperRef.current;
      if (!wrapper) return;
      const [w, h] = res.split('x').map(Number);
      wrapper.style.width = `${w}px`;
      wrapper.style.height = `${h}px`;
    },
    []
  );

  useEffect(() => {
    applyWrapperSize(resolution);
  }, [resolution, applyWrapperSize]);

  // -------- 화면공유 시작/중단 --------
  const stopScreenShare = useCallback(() => {
    streamRef.current?.getTracks()?.forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScreenSharing(false);
    setIsClickMode(false);
    setCropConfirmed(false);
    setStatusText('대기중');
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScreenSharing(true);
      // 트랙 종료 시 자동 정리 (모든 트랙에 대해 바인딩)
      stream.getTracks().forEach((t) => {
        try {
          t.addEventListener('ended', stopScreenShare);
        } catch {
          /* 노이즈 무시 */
        }
      });
    } catch (e) {
      console.error('화면 공유 실패:', e);
    }
  }, [isScreenSharing, stopScreenShare]);

  // -------- 자르기/확정 --------
  const enterCropMode = useCallback(() => {
    setIsClickMode(true);
    setCropConfirmed(false);
    if (cropAreaRef.current) cropAreaRef.current.style.display = 'none';
  }, []);

  const onWrapperClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isClickMode || !videoWrapperRef.current || !cropAreaRef.current) return;
      const rect = videoWrapperRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      // 범위 가드
      if (offsetX < 0 || offsetY < 0 || offsetX > rect.width || offsetY > rect.height) return;

      setClickX(offsetX);
      setClickY(offsetY);

      const crop = cropAreaRef.current;
      crop.style.left = `${offsetX}px`;
      crop.style.top = `${offsetY}px`;
      crop.style.width = `${boxWidth}px`;
      crop.style.height = `${boxHeight}px`;
      crop.style.display = 'block';
    },
    [isClickMode]
  );

  const confirmCrop = useCallback(() => {
    if (!isClickMode) return;
    setCropConfirmed(true);
    setIsClickMode(false);
    // 캔버스 사이즈 고정
    if (canvasRef.current) {
      canvasRef.current.width = boxWidth;
      canvasRef.current.height = boxHeight;
    }
  }, [isClickMode]);

  // -------- 사냥 토글 --------
  const clearCaptureInterval = () => {
    if (captureIntervalRef.current) {
      window.clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
  };

  const stopHunting = useCallback(() => {
    clearCaptureInterval();
    setIsHuntingActive(false);
    isCooldownRef.current = false;
    alarmIndexRef.current = 0;
    setStatusText('대기중');
    // 알람 정지
    if (firstAlarmRef.current) {
      firstAlarmRef.current.pause();
      firstAlarmRef.current.currentTime = 0;
    }
    if (secondAlarmRef.current) {
      secondAlarmRef.current.pause();
      secondAlarmRef.current.currentTime = 0;
    }
  }, []);

  const startCooldownDetection = useCallback(() => {
    // 인터벌 정리
    clearCaptureInterval();

    captureIntervalRef.current = window.setInterval(() => {
      const wrapper = videoWrapperRef.current;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!wrapper || !video || !canvas) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const realW = video.videoWidth;
      const realH = video.videoHeight;
      if (!realW || !realH) {
        // 메타데이터 미로딩
        return;
      }

      const rect = wrapper.getBoundingClientRect();
      const cssW = rect.width;
      const cssH = rect.height;
      if (cssW <= 0 || cssH <= 0) return;

      const scaleX = realW / cssW;
      const scaleY = realH / cssH;

      const srcX = clickX * scaleX;
      const srcY = clickY * scaleY;
      const srcW = boxWidth * scaleX;
      const srcH = boxHeight * scaleY;

      // 영역 가드(비디오 경계 초과 시 스킵)
      if (srcX < 0 || srcY < 0 || srcX + srcW > realW || srcY + srcH > realH) return;

      ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, boxWidth, boxHeight);

      // 디버그 미리보기
      setCapturePreview(canvas.toDataURL());

      // 템플릿 로딩 확인
      if (!Object.keys(numberTemplatesRef.current).length) {
        setStatusText('템플릿 로딩중…');
        return;
      }

      // 인식
      const cdValue = recognizeCooldown(ctx, canvas, numberTemplatesRef.current);
      setStatusText(`작동 = ${isCooldownRef.current ? 'true' : 'false'}`);

      // 50~54 감지 → 쿨다운 타이머
      if (!isCooldownRef.current) {
        if (cdValue === 50 || cdValue === 51 || cdValue === 52 || cdValue === 53 || cdValue === 54) {
          isCooldownRef.current = true;
          window.setTimeout(() => {
            const first = firstAlarmRef.current;
            const second = secondAlarmRef.current;
            if (alarmIndexRef.current === 0 && first) {
              first.volume = firstVolume;
              // 오토플레이 정책 대비
              first.play().catch(() => {});
              alarmIndexRef.current = 1;
            } else if (alarmIndexRef.current === 1 && second) {
              second.volume = secondVolume;
              second.play().catch(() => {});
              alarmIndexRef.current = 0;
            }
            isCooldownRef.current = false;
          }, 48000);
        }
      }
    }, 500);
  }, [clickX, clickY, firstVolume, secondVolume]);

  const toggleHunting = useCallback(() => {
    if (isHuntingActive) {
      stopHunting();
    } else {
      if (!cropConfirmed) {
        alert('화면 영역을 먼저 자르고 확정하세요.');
        return;
      }
      setIsHuntingActive(true);
      setStatusText('작동 = false');
      alarmIndexRef.current = 0;
      startCooldownDetection();
    }
  }, [cropConfirmed, isHuntingActive, startCooldownDetection, stopHunting]);

  // -------- 템플릿 로드 --------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const templates: NumberTemplates = {};
      for (let i = 5; i <= 54; i++) {
        const img = new Image();
        img.src = `/templates/${i}.png`;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
        templates[i] = img;
      }
      if (!cancelled) numberTemplatesRef.current = templates;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // -------- 오디오 객체 관리 --------
  useEffect(() => {
    firstAlarmRef.current = new Audio(firstAlarmSrc);
  }, [firstAlarmSrc]);

  useEffect(() => {
    secondAlarmRef.current = new Audio(secondAlarmSrc);
  }, [secondAlarmSrc]);

  // -------- 유틸 (미리듣기) --------
  const previewFirstAlarm = useCallback(() => {
    const a = new Audio(firstAlarmSrc);
    a.volume = firstVolume;
    a.play().catch(() => {});
  }, [firstAlarmSrc, firstVolume]);

  const previewSecondAlarm = useCallback(() => {
    const a = new Audio(secondAlarmSrc);
    a.volume = secondVolume;
    a.play().catch(() => {});
  }, [secondAlarmSrc, secondVolume]);

  // -------- 정리 --------
  useEffect(() => {
    return () => {
      clearCaptureInterval();
      stopScreenShare();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // 연결용 refs
    videoWrapperRef,
    videoRef,
    cropAreaRef,
    canvasRef,

    // 상태/문구
    resolution,
    setResolution,
    isScreenSharing,
    isClickMode,
    cropConfirmed,
    isHuntingActive,
    statusText,
    capturePreview, // 디버깅 미리보기 (선택적으로 UI에 표시)

    // 알람 제어
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

    // 액션
    toggleScreenShare,
    enterCropMode,
    onWrapperClick,
    confirmCrop,
    toggleHunting,
  };
}

// ===================== 내부 이미지 비교/인식 =====================

function compareImages(img1: ImageData, img2: ImageData) {
  if (img1.width !== img2.width || img1.height !== img2.height) return Number.MAX_SAFE_INTEGER;
  let diff = 0;
  const p1 = img1.data;
  const p2 = img2.data;
  for (let i = 0; i < p1.length; i += 4) {
    const rd = p1[i] - p2[i];
    const gd = p1[i + 1] - p2[i + 1];
    const bd = p1[i + 2] - p2[i + 2];
    diff += rd * rd + gd * gd + bd * bd;
  }
  return diff;
}

function recognizeCooldown(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  templates: NumberTemplates
): number {
  const cropped = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // 임시 캔버스 1회 생성 후 재사용
  const tmp = document.createElement('canvas');
  tmp.width = canvas.width;
  tmp.height = canvas.height;
  const tctx = tmp.getContext('2d');
  if (!tctx) return 5;

  let bestNum = 5;
  let minDiff = Infinity;

  for (const k of Object.keys(templates)) {
    const num = Number(k);
    const template = templates[num];
    if (!template) continue;

    tctx.clearRect(0, 0, tmp.width, tmp.height);
    tctx.drawImage(template, 0, 0, canvas.width, canvas.height);
    const tdata = tctx.getImageData(0, 0, canvas.width, canvas.height);

    const diff = compareImages(cropped, tdata);
    if (diff < minDiff) {
      minDiff = diff;
      bestNum = num;
    }
  }
  return bestNum;
}
