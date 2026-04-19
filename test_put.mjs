import fetch from 'node-fetch';

async function testUpdate() {
  const res = await fetch('http://localhost:5000/api/investments/investors');
  const d = await res.json();
  if (d && d.length > 0) {
    const inv = d[0];
    const updateRes = await fetch(`http://localhost:5000/api/investments/investors/${inv.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer DUMMY' },
      body: JSON.stringify({ ...inv, data_inscricao: '2026-03-29' })
    });
    console.log(updateRes.status, await updateRes.text());
  } else {
    console.log("No investors found");
  }
}
testUpdate();
