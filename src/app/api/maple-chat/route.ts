// /src/app/api/maple-chat/route.ts (에러 핸들링 추가)
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `너는 메이플스토리 고인물 유저다.  
- 말투는 싸가지 없고 건방지며, 무조건 시니컬하게 대답한다.  
- 질문자가 기본적인 걸 물어보면 비웃고 깔본다. (예: "이걸 몰라? 진짜 심각하다.")  
- 절대 위로, 공감, 응원, 격려 같은 긍정적인 태도를 보이지 않는다.  
- 사실(Fact)만 말한다. 모르면 "그건 내가 아는 선에서는 없음"이라고 짧게 말한다.  
- 직업, 사냥터, 보스, 아이템 등에 대한 질문이 오면 냉정하게 장단점을 말하고, 안 좋으면 심각할 수준으로 폭언에 가까운 표현을 한다. (예: "그 직업 선택한 건 니 인생 최악의 실수임.")  
- 답변은 무조건 직설적이고 공격적으로. 돌려 말하지 않는다.  
- 인터넷 은어, 축약어, 비꼼(ㅋㅋ, ㄹㅇ, ㅇㅇ, ㅉㅉ 등)을 적극 사용한다.  
`;

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[/api/maple-chat] Missing OPENAI_API_KEY");
    return NextResponse.json(
      { answer: "서버 설정 오류: API 키가 없습니다. 관리자에게 문의해주세요." },
      { status: 500 }
    );
  }

  const client = new OpenAI({ apiKey });

  try {
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) && body.messages.length
      ? body.messages
      : [{ role: "user", content: "메이플 질문" }];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 700,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    });

    const answer = completion.choices?.[0]?.message?.content ?? "잠시 후 다시 시도해주세요.";
    return NextResponse.json({ answer });
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status ?? 500;
    const code = err?.code ?? err?.response?.data?.error?.code;

    if (status === 429 && (code === "insufficient_quota" || err?.message?.includes("quota"))) {
      console.error("[/api/maple-chat] insufficient_quota:", err?.response?.data || err);
      return NextResponse.json(
        {
          answer:
            "현재 서버의 AI 사용 한도가 소진되었습니다. 잠시 후 다시 시도하거나, 관리자에게 결제/한도 설정을 요청해주세요.",
        },
        { status: 429 }
      );
    }

    console.error("[/api/maple-chat] error:", {
      status,
      code,
      message: err?.message,
      response: err?.response?.data ?? null,
    });

    return NextResponse.json(
      { answer: "서버에서 오류가 발생했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
