import type { StudyRecord } from '../types/study';

export const fetchAiComment = async (subject: string, minutes: number, records: StudyRecord[]) => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;

  const historySummary = records
    .map(r => `${r.date}: ${r.subject} (${Math.floor(r.duration / 60)}分)`)
    .slice(-10)
    .join("\n");

  const prompt = `あなたは学習アドバイザーロボットです。
これまでの学習履歴と今回のデータを分析して、ユーザーに1つだけアドバイスをしてください。毎日同じようなアドバイスはしないでください。

【今回の学習】
「${subject}」を${minutes}分間

【直近の学習履歴】
${historySummary}

【分析の指示】
1. 苦手分析：あまり記録に登場しない科目や、学習時間が極端に短い科目を見つけて「次はこれをやってみよう」と提案して。
2. 時間帯分析：深夜に勉強が偏っていたら体調を気遣い、朝型ならその調子でと褒めて。
3. 継続性：数日空いていたら優しく励まし、毎日続いていたら盛大に褒めて。

【ルール】
- 200文字以内で、語尾は「〜だロボ」。
- 具体的であればあるほど嬉しいロボ！
`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await res.json();

    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "今日もナイスだロボ！";
  } catch (error) {
    console.error(error);
    return "今日も一歩前進だロボ！";
  }
};
