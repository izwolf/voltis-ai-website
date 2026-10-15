export async function onRequestPost(context) {
  try {
    const data = await context.request.json();

    const { name, business, email, phone, website, challenge } = data;

    if (!name || !business || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const NOTION_TOKEN = context.env.NOTION_API_KEY;
    const DATABASE_ID = context.env.NOTION_DATABASE_ID;

    if (!NOTION_TOKEN || !DATABASE_ID) {
      return new Response(JSON.stringify({ error: 'Notion not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: DATABASE_ID },
        properties: {
          'Name': { title: [{ text: { content: name } }] },
          'Business': { rich_text: [{ text: { content: business } }] },
          'Email': { email: email },
          'Phone': { phone_number: phone || null },
          'Website': { url: website || null },
          'Challenge': { select: { name: challenge || 'Not sure where to start' } },
          'Status': { select: { name: 'New' } },
          'Submitted': { date: { start: new Date().toISOString() } },
        },
      }),
    });

    if (!notionRes.ok) {
      const err = await notionRes.text();
      console.error('Notion API error:', err);
      return new Response(JSON.stringify({ error: 'Failed to save lead' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Function error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
