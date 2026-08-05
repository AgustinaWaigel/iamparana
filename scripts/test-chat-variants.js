(async () => {
  const tests = [
    {
      name: 'simple string content',
      body: { messages: [{ role: 'user', content: 'Hola, ¿qué noticias recientes hay?' }] },
    },
    {
      name: 'parts array',
      body: { messages: [{ role: 'user', parts: [{ type: 'text', text: 'hola' }], id: 'f1' }] },
    },
    {
      name: 'system + user',
      body: { messages: [{ role: 'system', content: 'Eres un asistente servicial.' }, { role: 'user', content: 'Resume las últimas noticias.' }] },
    },
    {
      name: 'empty content object',
      body: { messages: [{ role: 'user' }] },
    },
  ];

  for (const t of tests) {
    console.log('\n=== Test:', t.name, '===');
    try {
      const res = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t.body),
      });
      console.log('Status:', res.status);
      const text = await res.text();
      console.log('Body:', text.slice(0, 2000));
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }
})();
