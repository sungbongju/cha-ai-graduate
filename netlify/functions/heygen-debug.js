// netlify/functions/heygen-debug.js
// HeyGen Knowledge Base + Avatar 연결 상태 전체 조회

export default async (req) => {
  const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
  if (!HEYGEN_API_KEY) {
    return new Response(JSON.stringify({ error: "HEYGEN_API_KEY not set" }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }

  const results = {};

  // 1) Knowledge Base 목록 전체 조회
  try {
    const kbRes = await fetch("https://api.heygen.com/v1/streaming/knowledge_base", {
      headers: { "X-Api-Key": HEYGEN_API_KEY }
    });
    const kbData = await kbRes.json();
    results.knowledge_bases = kbData;
  } catch (e) {
    results.kb_error = e.message;
  }

  // 2) 각 KB 상세정보 조회
  try {
    const kbList = results.knowledge_bases?.data?.knowledge_bases ||
                   results.knowledge_bases?.data || [];
    if (Array.isArray(kbList)) {
      results.kb_details = [];
      for (const kb of kbList.slice(0, 10)) {
        const kbId = kb.knowledge_base_id || kb.id;
        if (kbId) {
          const detailRes = await fetch(`https://api.heygen.com/v1/streaming/knowledge_base/${kbId}`, {
            headers: { "X-Api-Key": HEYGEN_API_KEY }
          });
          const detail = await detailRes.json();
          results.kb_details.push({ id: kbId, name: kb.name, detail });
        }
      }
    }
  } catch (e) {
    results.kb_detail_error = e.message;
  }

  // 3) Interactive Avatar 목록 (KB 연결 확인)
  try {
    const iaRes = await fetch("https://api.heygen.com/v1/interactive_avatars", {
      headers: { "X-Api-Key": HEYGEN_API_KEY }
    });
    if (iaRes.ok) {
      results.interactive_avatars = await iaRes.json();
    } else {
      results.ia_status = iaRes.status;
      results.ia_body = await iaRes.text();
    }
  } catch (e) {
    results.ia_error = e.message;
  }

  // 4) 아바타 상세 조회
  try {
    const avRes = await fetch("https://api.heygen.com/v2/avatars/e2eb35c947644f09820aa3a4f9c15488", {
      headers: { "X-Api-Key": HEYGEN_API_KEY }
    });
    if (avRes.ok) {
      results.avatar_detail = await avRes.json();
    } else {
      results.avatar_status = avRes.status;
    }
  } catch (e) {
    results.avatar_error = e.message;
  }

  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
};
