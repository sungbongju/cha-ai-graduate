// netlify/functions/heygen-debug.js
// HeyGen 계정의 아바타, 보이스 정보 조회 (디버그용)

export default async (req) => {
  const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
  if (!HEYGEN_API_KEY) {
    return new Response(JSON.stringify({ error: "HEYGEN_API_KEY not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const results = {};

  // 1) 아바타 목록 조회
  try {
    const avatarRes = await fetch("https://api.heygen.com/v2/avatars", {
      headers: { "X-Api-Key": HEYGEN_API_KEY }
    });
    const avatarData = await avatarRes.json();
    // 커스텀 아바타만 필터링
    const customAvatars = (avatarData.data?.avatars || [])
      .filter(a => a.avatar_type === "custom" || a.avatar_type === "uploaded" || a.is_custom)
      .map(a => ({
        avatar_id: a.avatar_id,
        avatar_name: a.avatar_name,
        avatar_type: a.avatar_type,
        voice_id: a.voice?.voice_id || a.default_voice?.voice_id || null,
        voice_name: a.voice?.name || a.default_voice?.name || null,
      }));
    results.custom_avatars = customAvatars;
    results.total_avatars = (avatarData.data?.avatars || []).length;
  } catch (e) {
    results.avatar_error = e.message;
  }

  // 2) 보이스 목록 조회
  try {
    const voiceRes = await fetch("https://api.heygen.com/v2/voices", {
      headers: { "X-Api-Key": HEYGEN_API_KEY }
    });
    const voiceData = await voiceRes.json();
    // 클론된 보이스만 필터링
    const clonedVoices = (voiceData.data?.voices || [])
      .filter(v => v.type === "cloned" || v.type === "custom" || v.is_cloned)
      .map(v => ({
        voice_id: v.voice_id,
        name: v.name || v.display_name,
        type: v.type,
        language: v.language,
      }));
    results.cloned_voices = clonedVoices;
    results.all_voices_count = (voiceData.data?.voices || []).length;
  } catch (e) {
    results.voice_error = e.message;
  }

  // 3) 특정 아바타 상세 정보 (현재 사용 중인 아바타)
  try {
    const targetId = "e2eb35c947644f09820aa3a4f9c15488";
    const detailRes = await fetch(`https://api.heygen.com/v2/avatars/${targetId}`, {
      headers: { "X-Api-Key": HEYGEN_API_KEY }
    });
    if (detailRes.ok) {
      const detailData = await detailRes.json();
      results.current_avatar_detail = detailData.data;
    } else {
      results.current_avatar_detail = `Status ${detailRes.status}`;
    }
  } catch (e) {
    results.avatar_detail_error = e.message;
  }

  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
};
