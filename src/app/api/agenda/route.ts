import { NextResponse } from "next/server";
import { listAgendaEventos } from "@/app/db/content-repository";

export const revalidate = 60;

export async function GET() {
  try {
    const eventos = await listAgendaEventos();
    return NextResponse.json(eventos);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error leyendo agenda" }, { status: 500 });
  }
}
