'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type Resolution = `${number}x${number}`;
type NumberTemplates = Record<number, HTMLImageElement>;

type TemplateRep = {
  w: number;
  h: number;
  hsvMask: Uint8ClampedArray;
  edge: Float32Array;
  edgeMean: number;
  edgeNorm: number;
};

type TemplateCache = Record<number, TemplateRep[]>;

function rgb2hsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (d !== 0) {
    switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break; }
    h /= 6;
  }
  return { h: h * 360, s, v };
}

function toBinaryYellowHSV(img: ImageData): ImageData {
  const { width: w, height: h, data } = img;
  const out = new Uint8ClampedArray(w * h * 4);

  const sampleStep = Math.max(1, Math.floor((w * h) / 400));
  const vSamples: number[] = [];
  for (let i = 0; i < data.length; i += 4 * sampleStep) vSamples.push(rgb2hsv(data[i], data[i+1], data[i+2]).v);
  vSamples.sort((a,b)=>a-b);
  const vMed = vSamples.length ? vSamples[Math.floor(vSamples.length/2)] : 0.6;
  const vTh = Math.max(0.45, Math.min(0.65, vMed * 0.9));

  for (let i = 0, px = 0; i < data.length; i += 4, px++) {
    const { h: H, s: S, v: V } = rgb2hsv(data[i], data[i+1], data[i+2]);
    const isYellow = (H >= 40 && H <= 75 && S >= 0.4 && V >= vTh);
    const vOut = isYellow ? 0 : 255;
    const k = px * 4; out[k]=out[k+1]=out[k+2]=vOut; out[k+3]=255;
  }

  const out2 = out.slice();
  for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) {
    let black = 0;
    for (let yy=-1; yy<=1; yy++) for (let xx=-1; xx<=1; xx++) if (out[((y+yy)*w+(x+xx))*4]===0) black++;
    const idx0 = (y*w+x)*4; const vOut = black>=4?0:255; out2[idx0]=out2[idx0+1]=out2[idx0+2]=vOut;
  }
  return new ImageData(out2, w, h);
}

function toGray(img: ImageData): Uint8ClampedArray {
  const g = new Uint8ClampedArray(img.data.length/4);
  for (let i=0,j=0; i<img.data.length; i+=4, j++) g[j]=Math.round(0.2126*img.data[i]+0.7152*img.data[i+1]+0.0722*img.data[i+2]);
  return g;
}

function sobelEdge(gray: Uint8ClampedArray, w: number, h: number): Float32Array {
  const out = new Float32Array(w*h);
  const gxK=[-1,0,1,-2,0,2,-1,0,1], gyK=[-1,-2,-1,0,0,0,1,2,1];
  for (let y=1;y<h-1;y++) for (let x=1;x<w-1;x++){
    let gx=0, gy=0, k=0;
    for (let yy=-1; yy<=1; yy++) for (let xx=-1; xx<=1; xx++, k++){
      const v = gray[(y+yy)*w+(x+xx)];
      gx += v*gxK[k]; gy += v*gyK[k];
    }
    out[y*w+x]=Math.hypot(gx,gy);
  }
  return out;
}

function ncc(a: Float32Array, aMean: number, aNorm: number, b: Float32Array, bMean: number, bNorm: number): number {
  if (a.length!==b.length || aNorm===0 || bNorm===0) return 0;
  let acc=0; for (let i=0;i<a.length;i++) acc += (a[i]-aMean)*(b[i]-bMean);
  return acc/(aNorm*bNorm);
}

function meanAndNorm(vec: Float32Array){ let sum=0; for(let i=0;i<vec.length;i++) sum+=vec[i];
  const mean=sum/vec.length; let sq=0; for(let i=0;i<vec.length;i++){ const v=vec[i]-mean; sq+=v*v;}
  return {mean, norm: Math.sqrt(sq)};
}

function iouMask(aMask: Uint8ClampedArray, bMask: Uint8ClampedArray){
  if (aMask.length!==bMask.length) return 0;
  let inter=0, union=0;
  for (let i=0;i<aMask.length;i+=4){
    const ay = (aMask[i]===0)?1:0, by=(bMask[i]===0)?1:0;
    inter+=(ay&by); union+=(ay|by);
  }
  return union===0?0:inter/union;
}

function makeCanvas(w:number,h:number){ if(typeof OffscreenCanvas!=='undefined'){ return new OffscreenCanvas(w,h) as any; }
  const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }

function get2d(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null){
  if(!ctx) return null as any; (ctx as any).imageSmoothingEnabled=false; (ctx as any).filter='none'; return ctx;
}

/** 템플릿을 HSV/Edge로 캐시(다중 스케일) */
function buildTemplateRep(img: HTMLImageElement, boxW:number, boxH:number, scale:number): TemplateRep{
  const w=Math.max(1,Math.round(boxW*scale)), h=Math.max(1,Math.round(boxH*scale));
  const oc:any = makeCanvas(boxW,boxH); const ctx=get2d(oc.getContext('2d',{willReadFrequently:true}) as any);
  ctx.clearRect(0,0,boxW,boxH);
  const tmp:any = makeCanvas(w,h); const tctx=get2d(tmp.getContext('2d',{willReadFrequently:true}) as any);
  tctx.clearRect(0,0,w,h); tctx.drawImage(img,0,0,w,h);
  const x=Math.floor((boxW-w)/2), y=Math.floor((boxH-h)/2);
  ctx.drawImage(tmp,x,y,w,h);

  const raw = ctx.getImageData(0,0,boxW,boxH);
  const hsvMaskImg = toBinaryYellowHSV(raw);
  const gray = toGray(raw);
  const edge = sobelEdge(gray, boxW, boxH);
  const {mean:edgeMean, norm:edgeNorm} = meanAndNorm(edge);
  return { w:boxW, h:boxH, hsvMask:hsvMaskImg.data, edge, edgeMean, edgeNorm };
}

function buildFrameRep(img: ImageData){
  const hsvMaskImg = toBinaryYellowHSV(img);
  const gray = toGray(img);
  const edge = sobelEdge(gray, img.width, img.height);
  const {mean, norm} = meanAndNorm(edge);
  return { hsvMask:hsvMaskImg, edge, edgeMean:mean, edgeNorm:norm };
}

function meanStd(arr:number[]){ if(!arr.length) return {mean:0,std:0};
  const m=arr.reduce((a,b)=>a+b,0)/arr.length;
  const v=arr.reduce((a,b)=>a+(b-m)*(b-m),0)/arr.length;
  return {mean:m,std:Math.sqrt(v)};
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
  const templateCacheRef = useRef<TemplateCache>({});

  const captureIntervalRef = useRef<number | null>(null);
  const rVFCHandleRef = useRef<number | null>(null);

  /** 타이밍/알람 */
  const cooldownStartAtRef = useRef<number | null>(null);
  const firstAlarmHandleRef = useRef<number | null>(null);
  const endResetHandleRef = useRef<number | null>(null);
  const alarmIndexRef = useRef<0 | 1>(0);

  /** 상태머신 (요청대로 재무장 텀 제거) */
  const lockActiveRef = useRef(false);
  const lockStartAtRef = useRef<number | null>(null);
  const wasHighRef = useRef(false);
  const safetyUnlockHandleRef = useRef<number | null>(null);

  const streamRef = useRef<MediaStream | null>(null);

  const historyRef = useRef<number[]>([]);
  const HISTORY_MAX = 5;

  /** 스코어/임계 */
  const scoreHistRef = useRef<number[]>([]);
  const scoreOnHoldRef = useRef(0);
  const SCORE_ON_TH = 0.29;
  const SCORE_OFF_TH = 0.25;
  const ON_HOLD = 3;

  const [capturePreview, setCapturePreview] = useState<string>('');

  /** 래퍼 크기 적용 */
  const applyWrapperSize = useCallback((res: Resolution) => {
    const wrapper = videoWrapperRef.current;
    if (!wrapper) return;
    const [w, h] = res.split('x').map(Number);
    wrapper.style.width = `${w}px`;
    wrapper.style.height = `${h}px`;
  }, []);
  useEffect(() => { applyWrapperSize(resolution); }, [resolution, applyWrapperSize]);

  /** 화면 공유 on/off */
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
    if (isScreenSharing) return stopScreenShare();
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsScreenSharing(true);
      stream.getTracks().forEach((t) => { try { t.addEventListener('ended', stopScreenShare); } catch {} });
    } catch (e) { console.error('화면 공유 실패:', e); }
  }, [isScreenSharing, stopScreenShare]);

  /** 크롭 모드 */
  const enterCropMode = useCallback(() => {
    setIsClickMode(true);
    setCropConfirmed(false);
    if (cropAreaRef.current) cropAreaRef.current.style.display = 'none';
  }, []);
  const onWrapperClick = useCallback((e: React.MouseEvent) => {
    if (!isClickMode || !videoWrapperRef.current || !cropAreaRef.current || !videoRef.current) return;
    const wrapperRect = videoWrapperRef.current.getBoundingClientRect();
    const videoRect = videoRef.current.getBoundingClientRect();
    if (e.clientX < videoRect.left || e.clientX > videoRect.right || e.clientY < videoRect.top || e.clientY > videoRect.bottom) return;

    let leftInVideo = e.clientX - videoRect.left;
    let topInVideo  = e.clientY - videoRect.top;
    leftInVideo = Math.max(0, Math.min(leftInVideo, Math.floor(videoRect.width  - boxWidth)));
    topInVideo  = Math.max(0, Math.min(topInVideo,  Math.floor(videoRect.height - boxHeight)));

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
  }, [isClickMode, boxWidth, boxHeight]);
  const confirmCrop = useCallback(() => {
    if (!isClickMode) return;
    setCropConfirmed(true);
    setIsClickMode(false);
    if (canvasRef.current) {
      canvasRef.current.width = boxWidth;
      canvasRef.current.height = boxHeight;
      const c = canvasRef.current.getContext('2d');
      if (c) { (c as any).imageSmoothingEnabled = false; (c as any).filter = 'none'; }
    }
    // 상태 초기화
    cooldownStartAtRef.current = null;
    lockActiveRef.current = false;
    lockStartAtRef.current = null;
    wasHighRef.current = false;
    scoreOnHoldRef.current = 0;
  }, [isClickMode, boxWidth, boxHeight]);

  /** 인터벌 정리 */
  const clearCaptureInterval = () => { if (captureIntervalRef.current) { window.clearInterval(captureIntervalRef.current); captureIntervalRef.current = null; } };
  const clearVideoFrameCallback = () => {
    if (rVFCHandleRef.current != null && videoRef.current && 'cancelVideoFrameCallback' in HTMLVideoElement.prototype) {
      (videoRef.current as any)?.cancelVideoFrameCallback?.(rVFCHandleRef.current);
      rVFCHandleRef.current = null;
    }
  };

  /** 알람 스케줄/정리 */
  const clearAlarmTimers = useCallback(() => {
    if (firstAlarmHandleRef.current) { window.clearTimeout(firstAlarmHandleRef.current); firstAlarmHandleRef.current = null; }
    if (endResetHandleRef.current)  { window.clearTimeout(endResetHandleRef.current);  endResetHandleRef.current  = null; }
    if (safetyUnlockHandleRef.current) { window.clearTimeout(safetyUnlockHandleRef.current); safetyUnlockHandleRef.current = null; }
  }, []);
  const scheduleAlarms = useCallback((startedAtMs: number) => {
    clearAlarmTimers();
    const now = performance.now();
    const elapsed = Math.max(0, (now - startedAtMs) / 1000);
    const toFirst = Math.max(500, (52 - elapsed) * 1000);

    firstAlarmHandleRef.current = window.setTimeout(() => {
      const a = alarmIndexRef.current === 0 ? firstAlarmRef.current : secondAlarmRef.current;
      if (a) { a.volume = alarmIndexRef.current === 0 ? firstVolume : secondVolume; a.play().catch(() => {}); }
      alarmIndexRef.current = alarmIndexRef.current === 0 ? 1 : 0;
      setStatusText('알람: 52초 경과(6~5초 전)');

      // 알람 후 즉시 감지 재개(대기 텀 없음)
      lockActiveRef.current = false;
    }, toFirst);

    // 70초 강제 해제(알람 이벤트가 실패했을 때 대비)
    safetyUnlockHandleRef.current = window.setTimeout(() => {
      lockActiveRef.current = false;
      setStatusText('안전 해제(타이머 만료)');
    }, Math.max(60000, (70 - elapsed) * 1000));
  }, [clearAlarmTimers, firstVolume, secondVolume]);

  /** 사냥 중지 */
  const stopHunting = useCallback(() => {
    clearCaptureInterval(); clearVideoFrameCallback(); clearAlarmTimers();
    setIsHuntingActive(false);
    historyRef.current = []; scoreHistRef.current = [];
    cooldownStartAtRef.current = null;

    lockActiveRef.current = false;
    lockStartAtRef.current = null;
    wasHighRef.current = false;
    scoreOnHoldRef.current = 0;

    setStatusText('대기중');
    if (firstAlarmRef.current) { firstAlarmRef.current.pause(); firstAlarmRef.current.currentTime = 0; }
    if (secondAlarmRef.current) { secondAlarmRef.current.pause(); secondAlarmRef.current.currentTime = 0; }
  }, [clearAlarmTimers]);

  /** 템플릿 캐시 */
  const ensureTemplateCache = useCallback(async () => {
    if (!Object.keys(numberTemplatesRef.current).length) return;
    const cache = templateCacheRef.current;
    const scales = [0.9, 1.0, 1.1];
    for (const k of Object.keys(numberTemplatesRef.current)) {
      const num = Number(k);
      if (cache[num]?.length) continue;
      const img = numberTemplatesRef.current[num];
      if (!img) continue;
      cache[num] = scales.map(s => buildTemplateRep(img, boxWidth, boxHeight, s));
    }
  }, [boxWidth, boxHeight]);

  /** 프레임-템플릿 유사도 (HSV IoU + Edge NCC) — 감지 로직 그대로 유지 */
  function matchBestTemplate(frameImg: ImageData) {
    const frameRep = buildFrameRep(frameImg);
    const cache = templateCacheRef.current;
    let bestNum = 0, bestScore = -Infinity, secondScore = -Infinity;

    for (const k of Object.keys(cache)) {
      const num = Number(k), reps = cache[num];
      let localBest = -Infinity;
      for (const rep of reps) {
        const iou = iouMask(frameRep.hsvMask.data, rep.hsvMask);
        const nccVal = ncc(frameRep.edge, frameRep.edgeMean, frameRep.edgeNorm, rep.edge, rep.edgeMean, rep.edgeNorm);
        const score = 0.4 * iou + 0.6 * Math.max(0, nccVal);
        if (score > localBest) localBest = score;
      }
      if (localBest > bestScore) { secondScore = bestScore; bestScore = localBest; bestNum = num; }
      else if (localBest > secondScore) { secondScore = localBest; }
    }
    const delta = bestScore - (secondScore === -Infinity ? -1 : secondScore);
    return { value: bestNum, score: bestScore, delta };
  }

  /** 프레임 루프 */
  const frameLoop = useCallback(() => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return; (ctx as any).imageSmoothingEnabled=false; (ctx as any).filter='none';

    const realW = video.videoWidth, realH = video.videoHeight; if (!realW || !realH) return;
    const videoRect = video.getBoundingClientRect(); if (videoRect.width<=0 || videoRect.height<=0) return;

    const scaleX = realW / videoRect.width, scaleY = realH / videoRect.height;
    const baseSrcX = clickX * scaleX, baseSrcY = clickY * scaleY;
    const srcW = boxWidth * scaleX, srcH = boxHeight * scaleY;
    if (baseSrcX<0 || baseSrcY<0 || baseSrcX+srcW>realW || baseSrcY+srcH>realH) return;

    // 락이 활성화 되어 있으면 감지 무시, 남은 시간만 표시
    if (lockActiveRef.current) {
      setStatusText(() => {
        if (!lockStartAtRef.current) return '락: 대기 중…';
        const now = performance.now();
        const elapsed = (now - lockStartAtRef.current) / 1000;
        const remain = Math.max(0, 52 - elapsed);
        return `락(감지 정지): 알람까지 ${Math.ceil(remain)}s`;
      });
      return;
    }

    // 3x3 탐색 (감지 로직 기존 유지)
    let bestScore = -Infinity, bestVal = 0, bestDelta = 0;
    for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++){
      const srcX = baseSrcX + dx, srcY = baseSrcY + dy;
      ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, boxWidth, boxHeight);
      const raw = ctx.getImageData(0,0,boxWidth,boxHeight);
      const { value, score, delta } = matchBestTemplate(raw);
      if (score > bestScore) { bestScore=score; bestVal=value; bestDelta=delta; }
    }

    setCapturePreview(canvas.toDataURL());
    if (!Object.keys(templateCacheRef.current).length) { setStatusText('템플릿 로딩중…'); return; }

    // —— 임계 기반 상태머신 (재무장 텀 없음, 낮→높 에지에서만 트리거) ——
    const hist = scoreHistRef.current; hist.push(Math.max(0,bestScore)); if (hist.length>60) hist.shift();
    const { mean: mScore, std: sScore } = meanStd(hist);
    const adaptiveT = Math.max(0.55, mScore + 0.25 * sScore); // 표시용

    if (bestScore >= SCORE_ON_TH) {
      if (!wasHighRef.current) {
        // 낮 -> 높 에지: 홀드 확인 후 락 진입
        scoreOnHoldRef.current++;
        if (scoreOnHoldRef.current >= ON_HOLD) {
          lockActiveRef.current = true;
          lockStartAtRef.current = performance.now();
          cooldownStartAtRef.current = lockStartAtRef.current;
          scoreOnHoldRef.current = 0;
          wasHighRef.current = true;

          scheduleAlarms(lockStartAtRef.current!);
          setStatusText(`락 시작(55초): score ${bestScore.toFixed(2)} | num ${bestVal}`);
        } else {
          setStatusText(`감지 중(score ${bestScore.toFixed(2)})`);
        }
      } else {
        // 이미 높음 상태 유지 → 같은 쿨다운 내 재트리거 방지
        setStatusText(`유지 중(score ${bestScore.toFixed(2)})`);
      }
    } else if (bestScore <= SCORE_OFF_TH) {
      // 낮음으로 떨어짐 → 다음 낮→높에서 즉시 새 사이클 가능
      wasHighRef.current = false;
      scoreOnHoldRef.current = 0;
      setStatusText(`저신뢰(score ${bestScore.toFixed(2)} / T${adaptiveT.toFixed(2)})`);
    } else {
      // 히스테리시스 구간(0.25~0.29): 상태 유지
      setStatusText(`유지 구간(score ${bestScore.toFixed(2)})`);
    }

    // (선택) 숫자 히스토리 디버깅용
    if (bestScore >= SCORE_ON_TH) {
      const h = historyRef.current; h.push(bestVal); if (h.length>HISTORY_MAX) h.shift();
    }
  }, [boxWidth, boxHeight, clickX, clickY, scheduleAlarms]);

  /** 탐지 시작/중지 */
  const startCooldownDetection = useCallback(() => {
    ensureTemplateCache(); clearCaptureInterval(); clearVideoFrameCallback();
    const v = videoRef.current as any;
    if (v?.requestVideoFrameCallback) {
      const step = () => { if (!isHuntingActive) return; frameLoop(); rVFCHandleRef.current = v.requestVideoFrameCallback(step); };
      rVFCHandleRef.current = v.requestVideoFrameCallback(step);
    } else {
      captureIntervalRef.current = window.setInterval(frameLoop, 100);
    }
  }, [ensureTemplateCache, frameLoop, isHuntingActive]);

  const toggleHunting = useCallback(() => {
    if (isHuntingActive) {
      stopHunting();
    } else {
      if (!cropConfirmed) { alert('화면 영역을 먼저 자르고 확정하세요.'); return; }
      setIsHuntingActive(true);
      setStatusText('작동 시작');
      historyRef.current = []; scoreHistRef.current = [];
      cooldownStartAtRef.current = null;

      // 상태머신 초기화
      lockActiveRef.current = false;
      lockStartAtRef.current = null;
      wasHighRef.current = false;
      scoreOnHoldRef.current = 0;

      startCooldownDetection();
    }
  }, [cropConfirmed, isHuntingActive, startCooldownDetection, stopHunting]);

  /** 템플릿 로드 — 6..54 */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const templates: NumberTemplates = {};
      const validNumbers = Array.from({ length: 49 }, (_, k) => k + 6); // 6..54
      for (const i of validNumbers) {
        const img = new Image(); img.src = `/assets/templates/${i}.png`;
        await new Promise<void>((resolve) => { img.onload = () => resolve(); img.onerror = () => resolve(); });
        templates[i] = img;
      }
      if (!cancelled) { numberTemplatesRef.current = templates; ensureTemplateCache(); }
    })();
    return () => { cancelled = true; };
  }, [ensureTemplateCache]);

  /** 알람 오디오 */
  useEffect(() => { firstAlarmRef.current = new Audio(firstAlarmSrc); }, [firstAlarmSrc]);
  useEffect(() => { secondAlarmRef.current = new Audio(secondAlarmSrc); }, [secondAlarmSrc]);
  const previewFirstAlarm = useCallback(() => { const a = new Audio(firstAlarmSrc); a.volume = firstVolume; a.play().catch(() => {}); }, [firstAlarmSrc, firstVolume]);
  const previewSecondAlarm = useCallback(() => { const a = new Audio(secondAlarmSrc); a.volume = secondVolume; a.play().catch(() => {}); }, [secondAlarmSrc, secondVolume]);

  /** 언마운트/상태 전환 정리 */
  useEffect(() => { return () => { stopScreenShare(); }; }, [stopScreenShare]);
  useEffect(() => {
    if (isHuntingActive) startCooldownDetection();
    else { clearCaptureInterval(); clearVideoFrameCallback(); clearAlarmTimers(); }
  }, [isHuntingActive, startCooldownDetection, clearAlarmTimers]);

  return {
    videoWrapperRef,
    videoRef,
    cropAreaRef,
    canvasRef,
    resolution, setResolution,
    isScreenSharing, isClickMode, cropConfirmed, isHuntingActive,
    statusText, capturePreview,
    firstAlarmSrc, setFirstAlarmSrc,
    secondAlarmSrc, setSecondAlarmSrc,
    firstVolume, setFirstVolume,
    secondVolume, setSecondVolume,
    previewFirstAlarm, previewSecondAlarm,
    toggleScreenShare, enterCropMode, onWrapperClick, confirmCrop, toggleHunting,
  };
}
