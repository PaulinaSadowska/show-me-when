import { ack, fetchIncidents } from './api.js';

const list = document.querySelector('[data-testid="incident-list"]');
const loader = document.querySelector('[data-testid="loader"]');
const empty = document.querySelector('[data-testid="empty"]');
const incidents = new Map();
const rowElements = new Map();
const acked = new Set();
const timeFormatter = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function createRow() {
  const row = document.createElement('li');
  row.dataset.testid = 'incident-row';
  const id = document.createElement('span');
  id.className = 'id';
  const severity = document.createElement('span');
  severity.className = 'sev';
  const summary = document.createElement('span');
  summary.className = 'what';
  const time = document.createElement('time');
  row.append(id, severity, summary, time);
  return row;
}

function updateRow(row, incident) {
  row.dataset.id = incident.id;
  row.dataset.openedAt = incident.openedAt;
  row.className = `row ${incident.severity}`;
  row.querySelector('.id').textContent = incident.id;
  row.querySelector('.sev').textContent = incident.severity;
  row.querySelector('.what').textContent = `${incident.service} · ${incident.region} · ${incident.summary}`;
  const time = row.querySelector('time');
  time.dateTime = incident.openedAt;
  time.textContent = timeFormatter.format(new Date(incident.openedAt));

  const button = row.querySelector('[data-testid="ack"]');
  const mark = row.querySelector('[data-testid="acked"]');
  if (acked.has(incident.id)) {
    button?.remove();
    if (!mark) {
      const ackedMark = document.createElement('span');
      ackedMark.dataset.testid = 'acked';
      ackedMark.textContent = 'Acked';
      row.append(ackedMark);
    }
  } else {
    mark?.remove();
    if (!button) {
      const ackButton = document.createElement('button');
      ackButton.dataset.testid = 'ack';
      ackButton.type = 'button';
      ackButton.textContent = 'Ack';
      row.append(ackButton);
    }
  }
}

function render() {
  const rows = [...incidents.values()].sort(
    (a, b) => new Date(b.openedAt) - new Date(a.openedAt),
  );
  empty.hidden = rows.length > 0;

  for (const incident of rows) {
    let row = rowElements.get(incident.id);
    if (!row) {
      row = createRow();
      rowElements.set(incident.id, row);
      const before = [...list.children].find(
        (existing) => new Date(existing.dataset.openedAt) < new Date(incident.openedAt),
      );
      list.insertBefore(row, before ?? null);
    }
    updateRow(row, incident);
  }
}

list.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-testid="ack"]');
  if (!button) return;
  const row = button.closest('[data-testid="incident-row"]');
  const incidentId = row.dataset.id;
  if (!window.confirm(`Acknowledge incident ${incidentId}?`)) return;
  button.disabled = true;
  try {
    await ack(incidentId);
    acked.add(incidentId);
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
