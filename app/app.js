import { ack, fetchIncidents } from './api.js';

const list = document.querySelector('[data-testid="incident-list"]');
const loader = document.querySelector('[data-testid="loader"]');
const empty = document.querySelector('[data-testid="empty"]');
const incidents = new Map();
const acked = new Set();

function render() {
  const rows = [...incidents.values()].sort(
    (a, b) => new Date(b.openedAt) - new Date(a.openedAt),
  );
  list.replaceChildren();
  empty.hidden = rows.length > 0;

  for (const incident of rows) {
    const row = document.createElement('li');
    row.dataset.testid = 'incident-row';
    row.dataset.id = incident.id;
    row.className = `row ${incident.severity}`;

    const id = document.createElement('span');
    id.className = 'id';
    id.textContent = incident.id;
    const severity = document.createElement('span');
    severity.className = 'sev';
    severity.textContent = incident.severity;
    const summary = document.createElement('span');
    summary.className = 'what';
    summary.textContent = `${incident.service} · ${incident.region} · ${incident.summary}`;
    const time = document.createElement('time');
    time.dateTime = incident.openedAt;
    time.textContent = new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(incident.openedAt));

    row.append(id, severity, summary, time);
    if (acked.has(incident.id)) {
      const mark = document.createElement('span');
      mark.dataset.testid = 'acked';
      mark.textContent = 'Acked';
      row.append(mark);
    } else {
      const button = document.createElement('button');
      button.dataset.testid = 'ack';
      button.type = 'button';
      button.textContent = 'Ack';
      row.append(button);
    }
    list.append(row);
  }
}

list.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-testid="ack"]');
  if (!button) return;
  const row = button.closest('[data-testid="incident-row"]');
  button.disabled = true;
  try {
    await ack(row.dataset.id);
    acked.add(row.dataset.id);
    render();
  } catch (error) {
    button.disabled = false;
    console.error(error);
  }
});

let loading = false;
async function refresh() {
  if (loading) return;
  loading = true;
  try {
    const page = await fetchIncidents();
    for (const incident of page.incidents) incidents.set(incident.id, incident);
    loader.hidden = true;
    render();
  } catch (error) {
    loader.hidden = true;
    empty.hidden = true;
    console.error(error);
  } finally {
    loading = false;
  }
}

await refresh();
window.setInterval(refresh, 2000);
