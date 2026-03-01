exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  try {
    const { pdf_base64 } = JSON.parse(event.body);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: pdf_base64 }
            },
            {
              type: 'text',
              text: `You are parsing a Purchase Order PDF. Return ONLY a valid JSON object with no markdown or explanation.

The PO is sent FROM a customer TO us (Peace Textile America / Pacific Sports). 
- "customer_name" = the BUYER company (who sent the PO to us) — NOT "Peace Textile" or "Pacific Sports"
- "ship_to_address" = where they want us to ship TO (the buyer's address)

{
  "customer_name": "BUYER company name only - single string, no address",
  "po_number": "PO number only - just the number/code",
  "terms": "single terms value only e.g. Net60 or N30 - pick ONE",
  "ship_to_address": "ship to address with newlines as \\n",
  "bill_to_address": "bill to address, or same as ship_to if not specified",
  "due_date": "YYYY-MM-DD format or null",
  "lines": [
    {
      "style_number": "our numeric style number from Description field (e.g. 1368, 2388N, 8368) — NOT the buyer's SKU code",
      "color": "color name only",
      "size": "single size (S/M/L/XL/2XL/3XL etc)",
      "qty": integer,
      "unit_price": number
    }
  ]
}

RULES:
- customer_name: ONLY the company name, no address, no extra text
- terms: pick the SINGLE most relevant value. If multiple exist pick the payment terms (Net60, N30 etc)
- style_number: look in Description column for numbers like 1368, 2388N, 8368, 1348. Format is often "1368-BrandName/Color". If no numeric style found, use the SKU/item code
- Split rows with multiple sizes into separate line items (one per size)
- Normalize sizes: SM→S, LG→L, XXL→2XL, XXXL→3XL
- Skip sizes with qty=0
- Return ONLY the JSON, nothing else`
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: data.error?.message || 'API error' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
