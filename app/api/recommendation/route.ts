// POST /api/recommendation — Rekomendasi Pengadaan Cerdas (US-09, ADDENDUM §2).
//
// Alur: sinyal deterministik (lib/recommendations) → LLM Anthropic HANYA untuk
// merangkai narasi/penjelasan → angka di-overwrite kembali dari sinyal (LLM tidak
// pernah memutuskan angka). Tiga lapis jaring pengaman agar demo tidak pernah kosong:
//   1. ANTHROPIC_API_KEY kosong  → langsung narasi template (tanpa panggilan jaringan)
//   2. Panggilan LLM gagal/timeout → respons sukses terakhir koperasi ini (cache in-memory)
//   3. Cache kosong               → narasi template
// Key HANYA dibaca dari env server — tidak pernah dikirim/berada di frontend.

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import { getAuthContext } from "@/lib/auth";
import { devCommodities } from "@/lib/dev-fixture";
import type { PoolDetail } from "@/lib/pool-types";
import { getPoolDetails } from "@/lib/pools";
import {
  buildFallbackCard,
  computeSignals,
  type CandidateSignal,
  type NarrativeContext,
  type RecommendationCard,
} from "@/lib/recommendations";

type RecommendationResponse = {
  rekomendasi: RecommendationCard[];
  // Asal narasi — transparan untuk debug demo: llm | cache | template
  sumber: "llm" | "cache" | "template";
};

// Cache respons sukses terakhir per koperasi. In-memory cukup untuk demo satu
// instance (Vercel: per-lambda, best-effort — fallback template tetap menjamin isi).
const lastGoodResponse = new Map<string, RecommendationResponse>();

const CARD_SCHEMA = {
  type: "object",
  properties: {
    kartu: {
      type: "array",
      items: {
        type: "object",
        properties: {
          komoditas: { type: "string" },
          alasan: {
            type: "string",
            description:
              "Penjelasan 'kenapa rekomendasi ini' dalam bahasa awam pengurus koperasi desa.",
          },
          narasi: {
            type: "string",
            description:
              "Narasi rekomendasi singkat (maks 2 kalimat) untuk kartu dashboard.",
          },
          qty_saran: { type: "integer" },
          hemat_estimasi: { type: "integer" },
          pool_ref: { type: ["string", "null"] },
          deadline_pool: { type: ["string", "null"] },
        },
        required: [
          "komoditas",
          "alasan",
          "narasi",
          "qty_saran",
          "hemat_estimasi",
          "pool_ref",
          "deadline_pool",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["kartu"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `Kamu asisten pengadaan untuk pengurus koperasi desa (KDMP) di Indonesia.
Tugasmu HANYA mengubah sinyal terstruktur menjadi (a) narasi rekomendasi singkat,
(b) penjelasan "kenapa" yang natural dan mudah dipahami orang awam, (c) konfirmasi qty saran.
Aturan keras:
- Balas JSON valid SAJA sesuai skema — tanpa markdown, tanpa teks lain.
- SALIN angka qty_saran, hemat_estimasi, pool_ref, deadline_pool persis dari sinyal; jangan menghitung ulang.
- Satu kartu per sinyal, urutan sama dengan input.
- Bahasa Indonesia hangat & ringkas; sebut harga sebagai "vs pembelian terakhirmu".
- Framing "memperluas jaringan supplier"/"efisiensi pengadaan"; JANGAN pakai kata "marketplace", "barter", atau "potensi desa".`;

/** Ambil objek JSON dari teks LLM secara aman (strip pagar \`\`\`json bila ada). */
function safeParseJson(text: string): unknown | null {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

function buildContexts(
  signals: CandidateSignal[],
  pools: PoolDetail[],
  wilayah: string,
): NarrativeContext[] {
  const poolById = new Map(pools.map((pool) => [pool.id, pool]));

  return signals.map((signal) => {
    const commodity = devCommodities.find(
      (item) => item.id === signal.commodityId,
    );
    const pool = signal.poolId ? poolById.get(signal.poolId) : undefined;
    const targetTier = pool?.progress.targetTier ?? null;

    return {
      namaKomoditas: commodity?.nama ?? signal.commodityId,
      satuan: commodity?.satuan ?? "unit",
      wilayah,
      deadlinePool: pool?.windowEnd ?? null,
      poolProgress:
        pool && targetTier
          ? {
              percent: pool.progress.progressPercent,
              tier_nama: targetTier.name,
              tier_harga: targetTier.pricePerUnit,
              total_volume: pool.totalVolume,
              min_volume: targetTier.minVolume,
            }
          : null,
    };
  });
}

function templateCards(
  signals: CandidateSignal[],
  contexts: NarrativeContext[],
): RecommendationCard[] {
  return signals.map((signal, index) =>
    buildFallbackCard(signal, contexts[index]),
  );
}

async function narrateWithClaude(
  signals: CandidateSignal[],
  contexts: NarrativeContext[],
): Promise<RecommendationCard[]> {
  const client = new Anthropic({ timeout: 15_000, maxRetries: 1 });

  const signalPayload = signals.map((signal, index) => ({
    komoditas: contexts[index].namaKomoditas,
    satuan: contexts[index].satuan,
    wilayah_pool: contexts[index].wilayah,
    stok_saat_ini: signal.stokSaatIni,
    velocity_harian: Math.round(signal.velocityHarian * 10) / 10,
    prediksi_stok_habis: signal.habisPada,
    harga_beli_terakhir: signal.hargaBeliTerakhir,
    harga_tier_pool: signal.hargaTierPool,
    pool_aktif: signal.poolAktif,
    pool_ref: signal.poolId,
    deadline_pool: contexts[index].deadlinePool,
    qty_saran: signal.qtySaran,
    hemat_estimasi: signal.hematEstimasi,
    di_atas_het: signal.flagHet,
    komponen_skor: signal.skorRincian,
  }));

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    thinking: { type: "disabled" }, // tugas narasi ringan — utamakan latensi demo
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: CARD_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Sinyal rekomendasi (urut skor tertinggi):\n${JSON.stringify(signalPayload)}`,
      },
    ],
  });

  const text = response.content.find((block) => block.type === "text")?.text;
  const parsed = text ? safeParseJson(text) : null;
  const kartu = (parsed as { kartu?: unknown[] } | null)?.kartu;

  if (!Array.isArray(kartu) || kartu.length !== signals.length) {
    throw new Error("Bentuk JSON LLM tidak sesuai skema kartu.");
  }

  // Integritas angka: HANYA teks (alasan/narasi) dari LLM; semua angka, referensi,
  // progress, dan komponen skor tetap dari sinyal deterministik.
  return signals.map((signal, index) => {
    const raw = kartu[index] as Partial<RecommendationCard>;
    const fallback = buildFallbackCard(signal, contexts[index]);
    return {
      ...fallback,
      alasan:
        typeof raw.alasan === "string" && raw.alasan.trim()
          ? raw.alasan.trim()
          : fallback.alasan,
      narasi:
        typeof raw.narasi === "string" && raw.narasi.trim()
          ? raw.narasi.trim()
          : fallback.narasi,
    };
  });
}

export async function POST(): Promise<NextResponse> {
  const auth = await getAuthContext();

  if (!auth) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  if (auth.role !== "koperasi" || !auth.cooperative) {
    return NextResponse.json(
      { error: "Rekomendasi hanya untuk akun koperasi." },
      { status: 403 },
    );
  }

  const cooperative = auth.cooperative;
  const pools = await getPoolDetails(auth);
  const signals = computeSignals(cooperative.id, {
    wilayah: cooperative.kabupaten,
    pools,
  });

  if (signals.length === 0) {
    return NextResponse.json<RecommendationResponse>({
      rekomendasi: [],
      sumber: "template",
    });
  }

  const contexts = buildContexts(signals, pools, cooperative.kabupaten);

  // Lapis 1: tanpa key → template, tanpa panggilan jaringan.
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json<RecommendationResponse>({
      rekomendasi: templateCards(signals, contexts),
      sumber: "template",
    });
  }

  try {
    const payload: RecommendationResponse = {
      rekomendasi: await narrateWithClaude(signals, contexts),
      sumber: "llm",
    };
    lastGoodResponse.set(cooperative.id, payload);
    return NextResponse.json(payload);
  } catch {
    // Lapis 2: respons sukses terakhir; Lapis 3: template.
    const cached = lastGoodResponse.get(cooperative.id);
    if (cached) {
      return NextResponse.json<RecommendationResponse>({
        ...cached,
        sumber: "cache",
      });
    }
    return NextResponse.json<RecommendationResponse>({
      rekomendasi: templateCards(signals, contexts),
      sumber: "template",
    });
  }
}
