export default function Head() {
  const title = '메이플 사냥 쿨타임 도우미 | 메이플스토리 재획 타이머';
  const desc =
    '메이플스토리 사냥 스킬 쿨타임 도우미 - 메이플 재획 타이머 및 사냥 최적화 기능 제공';
  const url = 'https://comment.pe.kr/cooldown';
  const img = 'https://comment.pe.kr/images/cooldown.png';

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <meta name="keywords" content="메이플 사냥, 메이플 쿨타임, 메이플 재획, 메이플 사냥 쿨타임, 메이플스토리 타이머" />
      <meta name="author" content="comment.pe.kr" />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta property="og:url" content={url} />

      <link rel="icon" href="/assets/images/logo.png" type="image/png" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </>
  );
}
