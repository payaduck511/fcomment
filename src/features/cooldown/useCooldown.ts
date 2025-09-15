'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type Resolution = `${number}x${number}`;
type NumberTemplates = Record<number, HTMLImageElement>;
type TemplateBinCache = Record<number, ImageData>;

/**
 * @param binImage
 * @returns
 */
function isSingleDigitSix(binImage: ImageData): boolean {
  const { width, height, data } = binImage;
  const leftHalfWidth = Math.floor(width / 2);
  let yellowPixelCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < leftHalfWidth; x++) {
      const index = (y * width + x) * 4;
      if (data[index] === 0) {
        yellowPixelCount++;
      }
    }
  }
  const PIXEL_THRESHOLD = 5;
  return yellowPixelCount < PIXEL_THRESHOLD;
}


export function useCooldown(initialResolution: Resolution = '1366x768') {
  const videoWrapperRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cropAreaRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [resolution, setResolution] = useState<Resolution>(initialResolution);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isClickMode, setIsClickMode] = useState(false);
  const [cropConfirmed, setCropConfirmed] = useState(false);
  const [isHuntingActive, setIsHuntingActive] = useState(false);

  const [statusText, setStatusText] = useState<string>('대기중');
  const [clickX, setClickX] = useState(0);
  const [clickY, setClickY] = useState(0);

  const [firstAlarmSrc, setFirstAlarmSrc] = useState<string>('/assets/sound/BikBik.mp3');
  const [secondAlarmSrc, setSecondAlarmSrc] = useState<string>('/assets/sound/dingdong.mp3');
  const firstAlarmRef = useRef<HTMLAudioElement | null>(null);
  const secondAlarmRef = useRef<HTMLAudioElement | null>(null);
  const [firstVolume, setFirstVolume] = useState(1);
  const [secondVolume, setSecondVolume] = useState(1);

  const boxWidth = 40;
  const boxHeight = 40;

  const numberTemplatesRef = useRef<NumberTemplates>({});
  const templateBinCacheRef = useRef<TemplateBinCache>({});

  const captureIntervalRef = useRef<number | null>(null);
  const rVFCHandleRef = useRef<number | null>(null);

  const isCooldownRef = useRef(false);
  const alarmIndexRef = useRef<0 | 1>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const historyRef = useRef<number[]>([]);
  const HISTORY_MAX = 5;

  const [capturePreview, setCapturePreview] = useState<string>('');

  const applyWrapperSize = useCallback((res: Resolution) => {
    const wrapper = videoWrapperRef.current;
    if (!wrapper) return;
    const [w, h] = res.split('x').map(Number);
    wrapper.style.width = `${w}px`;
    wrapper.style.height = `${h}px`;
  }, []);

  useEffect(() => {
    applyWrapperSize(resolution);
  }, [resolution, applyWrapperSize]);

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
      stream.getTracks().forEach((t) => {
        try { t.addEventListener('ended', stopScreenShare); } catch {}
      });
    } catch (e) {
      console.error('화면 공유 실패:', e);
    }
  }, [isScreenSharing, stopScreenShare]);

  const enterCropMode = useCallback(() => {
    setIsClickMode(true);
    setCropConfirmed(false);
    if (cropAreaRef.current) cropAreaRef.current.style.display = 'none';
  }, []);

  // ================== [수정된 부분] ==================
  const onWrapperClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isClickMode || !videoWrapperRef.current || !cropAreaRef.current || !videoRef.current) return;

      const wrapperRect = videoWrapperRef.current.getBoundingClientRect();
      const videoRect = videoRef.current.getBoundingClientRect();

      // 클릭 지점이 비디오 영역 밖이면 무시
      if (e.clientX < videoRect.left || e.clientX > videoRect.right || e.clientY < videoRect.top || e.clientY > videoRect.bottom) return;

      // 클릭 지점을 중앙이 아닌 '왼쪽 위' 좌표로 설정합니다.
      let leftInVideo = e.clientX - videoRect.left;
      let topInVideo  = e.clientY - videoRect.top;

      // 자른 영역이 비디오 밖으로 나가지 않도록 경계 값을 보정합니다.
      leftInVideo = Math.max(0, Math.min(leftInVideo, Math.floor(videoRect.width  - boxWidth)));
      topInVideo  = Math.max(0, Math.min(topInVideo,  Math.floor(videoRect.height - boxHeight)));

      // 이 좌표를 캡처와 빨간 상자 표시에 모두 사용합니다.
      setClickX(leftInVideo);
      setClickY(topInVideo);

      const crop = cropAreaRef.current;
      const offsetLeft = videoRect.left - wrapperRect.left;
      const offsetTop  = videoRect.top  - wrapperRect.top;
      crop.style.left = `${offsetLeft + leftInVideo}px`;
      crop.style.top  = `${offsetTop  + topInVideo }px`;
      crop.style.width  = `${boxWidth}px`;
      crop.style.height = `${boxHeight}px`;
      crop.style.display = 'block';
    },
    [isClickMode, boxWidth, boxHeight]
  );
  // ===============================================

  const confirmCrop = useCallback(() => {
    if (!isClickMode) return;
    setCropConfirmed(true);
    setIsClickMode(false);
    if (canvasRef.current) {
      canvasRef.current.width = boxWidth;
      canvasRef.current.height = boxHeight;
    }
  }, [isClickMode, boxWidth, boxHeight]);

  const clearCaptureInterval = () => {
    if (captureIntervalRef.current) {
      window.clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
  };
  const clearVideoFrameCallback = () => {
    if (rVFCHandleRef.current != null && videoRef.current && 'cancelVideoFrameCallback' in HTMLVideoElement.prototype) {
      (videoRef.current as any)?.cancelVideoFrameCallback?.(rVFCHandleRef.current);
      rVFCHandleRef.current = null;
    }
  };

  const stopHunting = useCallback(() => {
    clearCaptureInterval();
    clearVideoFrameCallback();
    setIsHuntingActive(false);
    isCooldownRef.current = false;
    alarmIndexRef.current = 0;
    historyRef.current = [];
    setStatusText('대기중');
    if (firstAlarmRef.current) { firstAlarmRef.current.pause(); firstAlarmRef.current.currentTime = 0; }
    if (secondAlarmRef.current) { secondAlarmRef.current.pause(); secondAlarmRef.current.currentTime = 0; }
  }, []);

  const toBinaryYellow = useCallback((img: ImageData): ImageData => {
    const { width: w, height: h, data } = img;
    const out = new Uint8ClampedArray(w * h * 4);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const isYellow = (r > 160 && g > 140 && b < 140 && (r + g - b) > 220);
      const v = isYellow ? 0 : 255;
      const k = j * 4;
      out[k] = out[k + 1] = out[k + 2] = v;
      out[k + 3] = 255;
    }
    return new ImageData(out, w, h);
  }, []);

  const ensureTemplateBinCache = useCallback(async () => {
    if (!Object.keys(numberTemplatesRef.current).length) return;
    const cache = templateBinCacheRef.current;
    const makeCanvas = () =>
      (typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(boxWidth, boxHeight) as any
        : (() => { const c = document.createElement('canvas'); c.width = boxWidth; c.height = boxHeight; return c; })()
      );

    for (const k of Object.keys(numberTemplatesRef.current)) {
      const num = Number(k);
      if (cache[num]) continue;
      const img = numberTemplatesRef.current[num];
      if (!img) continue;

      const oc = makeCanvas();
      const ctx = oc.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
      ctx.clearRect(0, 0, boxWidth, boxHeight);
      ctx.drawImage(img, 0, 0, boxWidth, boxHeight);
      const raw = ctx.getImageData(0, 0, boxWidth, boxHeight);
      cache[num] = toBinaryYellow(raw);
    }
  }, [boxWidth, boxHeight, toBinaryYellow]);

  const diffBinary = (a: ImageData, b: ImageData): number => {
    if (a.width !== b.width || a.height !== b.height) return Number.MAX_SAFE_INTEGER;
    const da = a.data, db = b.data;
    let diff = 0;
    for (let i = 0; i < da.length; i += 4) {
      if (da[i] !== db[i]) diff++;
    }
    return diff;
  };

  const modeOf = (arr: number[]): number => {
    const m = new Map<number, number>();
    let best = arr[0] ?? 0, bestC = 0;
    for (const v of arr) {
      const c = (m.get(v) ?? 0) + 1;
      m.set(v, c);
      if (c > bestC) { bestC = c; best = v; }
    }
    return best;
  };

  const recognizeCooldownFast = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const raw = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const bin = toBinaryYellow(raw);

    let bestNum = 0;
    let bestDiff = Infinity;

    const cache = templateBinCacheRef.current;
    const pixels = canvas.width * canvas.height;

    for (const k of Object.keys(cache)) {
      const num = Number(k);
      const tdata = cache[num];
      const d = diffBinary(bin, tdata);
      if (d < bestDiff) {
        bestDiff = d;
        bestNum = num;
      }
    }

    const score = 1 - bestDiff / pixels;
    return { value: bestNum, score, bin }; // 이진화된 이미지도 함께 반환
  }, [toBinaryYellow]);

  const frameLoop = useCallback(() => {
    const wrapper = videoWrapperRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const realW = video.videoWidth;
    const realH = video.videoHeight;
    if (!realW || !realH) return;

    const videoRect = video.getBoundingClientRect();
    if (videoRect.width <= 0 || videoRect.height <= 0) return;

    const scaleX = realW / videoRect.width;
    const scaleY = realH / videoRect.height;

    const baseSrcX = clickX * scaleX;
    const baseSrcY = clickY * scaleY;
    const srcW = boxWidth  * scaleX;
    const srcH = boxHeight * scaleY;

    if (baseSrcX < 0 || baseSrcY < 0 || baseSrcX + srcW > realW || baseSrcY + srcH > realH) return;

    let bestScore = -1;
    let bestVal = 0;
    let bestBin: ImageData | null = null; // 최고 점수일 때의 이진화 이미지를 저장

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const srcX = baseSrcX + dx;
        const srcY = baseSrcY + dy;
        ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, boxWidth, boxHeight);
        const { value, score, bin } = recognizeCooldownFast(ctx, canvas);
        if (score > bestScore) {
          bestScore = score;
          bestVal = value;
          bestBin = bin; // 최고 점수 이미지 저장
        }
      }
    }

    setCapturePreview(canvas.toDataURL());

    if (!Object.keys(templateBinCacheRef.current).length) {
      setStatusText('템플릿 로딩중…');
      return;
    }

    const SCORE_THRESHOLD = 0.70;
    if (bestScore >= SCORE_THRESHOLD) {
      const hist = historyRef.current;
      hist.push(bestVal);
      if (hist.length > HISTORY_MAX) hist.shift();
      const stable = modeOf(hist);

      setStatusText(`감지: ${stable} (${bestScore.toFixed(2)})`);

      if (stable % 10 === 6 && !isCooldownRef.current && bestBin) {
        if (isSingleDigitSix(bestBin)) {
          isCooldownRef.current = true;
          const first = firstAlarmRef.current;
          const second = secondAlarmRef.current;
          if (alarmIndexRef.current === 0 && first) {
            first.volume = firstVolume;
            first.play().catch(e => console.error("첫 번째 알람 재생 실패:", e));
            alarmIndexRef.current = 1;
          } else if (alarmIndexRef.current === 1 && second) {
            second.volume = secondVolume;
            second.play().catch(e => console.error("두 번째 알람 재생 실패:", e));
            alarmIndexRef.current = 0;
          }
          window.setTimeout(() => { isCooldownRef.current = false; }, 2000);
        }
      }

    } else {
      setStatusText(`저신뢰(${bestScore.toFixed(2)})`);
    }
  }, [boxWidth, boxHeight, clickX, clickY, firstVolume, secondVolume, recognizeCooldownFast]);

  const startCooldownDetection = useCallback(() => {
    ensureTemplateBinCache();
    clearCaptureInterval();
    clearVideoFrameCallback();

    const v = videoRef.current as any;
    if (v?.requestVideoFrameCallback) {
      const step = () => {
        if (!isHuntingActive) return;
        frameLoop();
        rVFCHandleRef.current = v.requestVideoFrameCallback(step);
      };
      rVFCHandleRef.current = v.requestVideoFrameCallback(step);
    } else {
      captureIntervalRef.current = window.setInterval(frameLoop, 100);
    }
  }, [ensureTemplateBinCache, frameLoop, isHuntingActive]);

  const toggleHunting = useCallback(() => {
    if (isHuntingActive) {
      stopHunting();
    } else {
      if (!cropConfirmed) {
        alert('화면 영역을 먼저 자르고 확정하세요.');
        return;
      }
      setIsHuntingActive(true);
      setStatusText('작동 시작');
      alarmIndexRef.current = 0;
      historyRef.current = [];
      startCooldownDetection();
    }
  }, [cropConfirmed, isHuntingActive, startCooldownDetection, stopHunting]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const templates: NumberTemplates = {};
      const validNumbers = Array.from({ length: 49 }, (_, k) => k + 6); // 6..54
      for (const i of validNumbers) {
        const img = new Image();
        img.src = `/assets/templates/${i}.png`;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
        templates[i] = img;
      }
      if (!cancelled) {
        numberTemplatesRef.current = templates;
        ensureTemplateBinCache();
      }
    })();
    return () => { cancelled = true; };
  }, [ensureTemplateBinCache]);

  useEffect(() => { firstAlarmRef.current = new Audio(firstAlarmSrc); }, [firstAlarmSrc]);
  useEffect(() => { secondAlarmRef.current = new Audio(secondAlarmSrc); }, [secondAlarmSrc]);

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

  useEffect(() => {
    return () => {
      stopScreenShare();
    };
  }, [stopScreenShare]);

  useEffect(() => {
    if (isHuntingActive) {
      startCooldownDetection();
    } else {
      clearCaptureInterval();
      clearVideoFrameCallback();
    }
  }, [isHuntingActive, startCooldownDetection]);

  return {
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
    capturePreview,
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
  };
}