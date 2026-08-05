(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hola, ¿qué noticias recientes hay?' }] }),
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text.slice(0, 2000));
  } catch (err) {
    console.error('Fetch error:', err);
  }
})();
