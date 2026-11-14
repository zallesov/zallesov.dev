// Generates the narration for the "Development Pipeline" animation with ElevenLabs.
//   ELEVENLABS_API_KEY=... node scripts/voiceover.mjs [id ...]
// Reads src/components/approach/voiceover.json, writes public/audio/pipeline/<id>.mp3
// and stores each line's length (seconds) back into the JSON; the scene stretches to fit.
import { readFileSync, writeFileSync } from "node:fs";

const key = process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error("ELEVENLABS_API_KEY is not set");
const file = new URL("../src/components/approach/voiceover.json", import.meta.url);
const out = new URL("../public/audio/pipeline/", import.meta.url);
const spec = JSON.parse(readFileSync(file, "utf8"));
const only = process.argv.slice(2);

for (const [i, line] of spec.lines.entries()) {
  if (only.length && !only.includes(line.id)) continue;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${spec.voice}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: line.text,
      model_id: spec.model,
      // neighbours keep the intonation continuous from line to line
      previous_text: spec.lines[i - 1]?.text,
      next_text: spec.lines[i + 1]?.text,
    }),
  });
  if (!res.ok) throw new Error(`${line.id}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  writeFileSync(new URL(`${line.id}.mp3`, out), Buffer.from(data.audio_base64, "base64"));
  line.seconds = Number(data.alignment.character_end_times_seconds.at(-1).toFixed(2));
  console.log(line.id, line.seconds + "s", line.text.slice(0, 50));
}
writeFileSync(file, JSON.stringify(spec, null, 2) + "\n");
