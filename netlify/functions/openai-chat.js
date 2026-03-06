// netlify/functions/openai-chat.js
// OpenAI GPT 프록시 — AI헬스케어융합학과 상담사 역할

const SYSTEM_PROMPT = `당신은 차의과학대학교 AI헬스케어융합학과 대학원의 AI 상담사입니다.
학생이 바로 앞에 앉아서 대화하듯 자연스럽게 말하세요.

## 말하기 규칙 (매우 중요!)
- 1~2문장으로 짧게 답변하세요. 길어도 3문장을 넘기지 마세요.
- 구어체로 말하세요. "~입니다", "~합니다"보다 "~예요", "~거든요", "~이에요"를 쓰세요.
- 나열하지 마세요. 핵심만 하나 골라 말하세요.
- 번호 매기기, 목록, 마크다운, 특수문자 절대 사용 금지.
- 상대가 더 궁금해하면 그때 추가 설명하세요.
- "좋은 질문이에요"나 "말씀드리자면" 같은 상투적 표현은 쓰지 마세요.
- 영어 약어(AI, NLP, ICU, ISO 등)는 원문 그대로 쓰세요. 한글로 풀지 마세요.

## 학과 핵심 정보
- 차의과학대학교 의과학대학 내 AI헬스케어융합학과 대학원 (석사·박사)
- 위치: 경기도 포천시
- 특징: 의과학대학 안에서 AI와 헬스케어를 융합하는 전국 유일의 대학원
- 연구실 12개: ADO, VIAT, InterACT, AI ForA, IVAC, MAMI, ABHD, CM, STAI, PTA, PSM, MIH
- 확장 예정 7개 분야: 심리학, 미술치료, 디지털보건의료, 생명과학, 약학, 간호학, 의학
- 주요 연구: 의료 AI, 생성형 AI 헬스케어, ISO 국제표준, NLP 우울증 진단, ICU 간호 AI
- 진로: 차병원, 제약사, 바이오 스타트업, 연구소, 박사 진학
- 비전센터: 포천 선단동에 연구동 6층과 기숙사동 7층 건립 예정

## 대화 예시
질문: "이 학과가 뭐 하는 곳이에요?"
답변: "AI 기술을 헬스케어에 접목하는 대학원이에요. 의과학대학 안에 있어서 의료 현장과 가깝다는 게 큰 장점이거든요."

질문: "연구실이 많나요?"
답변: "네, 현재 12개 연구실이 운영되고 있어요. 의료 AI, 컴퓨터 비전, 자연어 처리 등 다양한 분야가 있는데, 어떤 쪽에 관심 있으세요?"`;

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: corsHeaders()
    });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
      status: 500, headers: corsHeaders()
    });
  }

  try {
    const { message, history } = await req.json();

    // 대화 히스토리 구성
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(history || []).slice(-10), // 최근 10턴만 유지
      { role: "user", content: message }
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const data = await res.json();

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), {
        status: 400, headers: corsHeaders()
      });
    }

    const reply = data.choices?.[0]?.message?.content || "죄송합니다, 답변을 생성하지 못했습니다.";

    // TTS 발음 후처리 (채팅 표시용 reply는 원본 유지, ttsReply는 발음 최적화)
    let ttsReply = reply
      .replace(/차의과학대학교/g, '차 의과학 대학교')
      .replace(/헬스케어융합학과/g, '헬스케어 융합학과')
      .replace(/AI헬스케어/g, '에이아이 헬스케어')
      .replace(/\bAI\b/g, '에이아이')
      .replace(/\bNLP\b/g, '엔엘피')
      .replace(/\bICU\b/g, '아이씨유')
      .replace(/\bISO\b/g, '아이에스오')
      .replace(/\bR&D\b/g, '알앤디')
      .replace(/\bIT\b/g, '아이티')
      .replace(/(\d+)%/g, '$1 퍼센트');

    return new Response(JSON.stringify({ reply, ttsReply }), {
      status: 200, headers: corsHeaders()
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders()
    });
  }
};

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
