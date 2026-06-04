import crypto from "crypto";
import { NextResponse } from "next/server";
import { getReturnOption, getStatusOption, STATUS_OPTIONS } from "@/lib/status-options";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_ROW_ID = true;

function timingSafeEqualText(left, right) {
  const leftBuffer = Buffer.from(left || "");
  const rightBuffer = Buffer.from(right || "");

  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function normalizeText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function serializeRow(row) {
  return {
    status_key: row.status_key,
    status_label: row.status_label,
    emoji: row.emoji,
    custom_status: row.custom_status || "",
    message: row.message || "",
    return_option: row.return_option || "",
    return_at: row.return_at,
    updated_at: row.updated_at
  };
}

export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("couple_status")
      .select("*")
      .eq("id", STATUS_ROW_ID)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      status: data
        ? serializeRow(data)
        : {
            status_key: "busy",
            status_label: "正在忙",
            emoji: "💻",
            custom_status: "",
            message: "还没有同步过状态。",
            return_option: "不确定",
            return_at: null,
            updated_at: null
          }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to read status" }, { status: 500 });
  }
}

export async function PUT(request) {
  const adminToken = process.env.ADMIN_TOKEN;
  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!adminToken || !bearerToken || !timingSafeEqualText(bearerToken, adminToken)) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const selected = getStatusOption(body.statusKey);
    const customStatus = normalizeText(body.customStatus, 60);
    const message = normalizeText(body.message, 280);
    const returnOption = getReturnOption(body.returnKey);
    const now = new Date();
    const returnAt = returnOption.minutes
      ? new Date(now.getTime() + returnOption.minutes * 60 * 1000).toISOString()
      : null;

    const allowedKeys = new Set(STATUS_OPTIONS.map((item) => item.key));
    if (!allowedKeys.has(body.statusKey)) {
      return NextResponse.json({ error: "Invalid statusKey" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("couple_status")
      .upsert(
        {
          id: STATUS_ROW_ID,
          status_key: selected.key,
          status_label: selected.label,
          emoji: selected.emoji,
          custom_status: customStatus || null,
          message: message || null,
          return_option: returnOption.label,
          return_at: returnAt,
          updated_at: now.toISOString()
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ status: serializeRow(data) });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to update status" }, { status: 500 });
  }
}
