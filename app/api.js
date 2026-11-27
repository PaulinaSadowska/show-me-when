// The incident API client. The proxy keeps the challenge session server-side.
import { API } from './config.js';

let cursor = null;

/** This board's incidents, newest first: { updatedAt, incidents: [{ id, service, region, summary, severity, openedAt }] }. */
export async function fetchIncidents() {
  const url = new URL(`${API}/incidents`);
  if (cursor) url.searchParams.set('since', cursor);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`incidents: ${res.status} ${await res.text()}`);
  const page = await res.json();
  cursor = page.cursor;
  return page;
}

/** Acks one incident: { id, ackedAt, receipt }. Every receipt is also kept in `acks` and logged. */
export const acks = [];
export async function ack(id) {
  const url = new URL(`${API}/ack`);
  url.searchParams.set('id', id);
  url.searchParams.set('cursor', cursor);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ack: ${res.status} ${await res.text()}`);
  const reply = await res.json();
  acks.push(reply);
  console.info('ack', reply.id, reply.ackedAt, reply.receipt);
  return reply;
}
