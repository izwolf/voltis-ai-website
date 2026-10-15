export async function onRequestPost(context) {
  try {
    const data = await context.request.json();

    const { type, service, name, business, email, phone, website, challenge } = data;

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

    const leadType = type === 'waitlist' ? `Waitlist: ${service || 'Unknown'}` : 'Free Audit';

    const properties: Record<string, any> = {
      'Name': { title: [{ text: { content: name } }] },
      'Business': { rich_text: [{ text: { content: business } }] },
      'Email': { email: email },
      'Challenge': { select: { name: challenge || 'Not sure where to start' } },
      'Lead Type': { select: { name: leadType } },
      'Status': { select: { name: 'New' } },
      'Submitted': { date: { start: new Date().toISOString() } },
    };
    if (phone) properties['Phone'] = { phone_number: phone };
    if (website) properties['Website'] = { url: website.startsWith('http') ? website : `https://${website}` };

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: DATABASE_ID },
        properties,
      }),
    });

    if (!notionRes.ok) {
      const errText = await notionRes.text();
      console.error('Notion API error:', errText);
      return new Response(JSON.stringify({ error: 'Failed to save lead', detail: errText, status: notionRes.status }), {
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
