import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  const payload = await req.json();
  console.log(payload);
  console.log(req.headers);
  
  

  const eventType = req.headers.get('x-supabase-event') ?? 'UNKNOWN';
  const record = payload.record;
  const oldRecord = payload.old_record;

  let subject = '';
  let message = '';

  if (eventType === 'INSERT') {
    subject = `New Transaction Submitted`;
    message = `A new transaction was submitted by ${record.created_by}.`;
  } else if (eventType === 'UPDATE') {
    const statusChanged = oldRecord.status !== record.status;
    const docVerifiedChanged = !oldRecord.documentation_verified && record.documentation_verified;
    

    if (statusChanged) {
      subject = `Transaction Status Updated`;
      message = `Transaction ${record.id} status changed to ${record.status}.`;
    } else if (docVerifiedChanged) {
      subject = `Transaction Verified`;
      message = `Transaction ${record.id} has been verified by ${record.verified_by}.`;
    } else {
      return new Response('No significant update, skipping email.', { status: 200 });
    }
  } else if (eventType === 'TEST') {
  return new Response("Test event received", { status: 200 });
} else {
    return new Response('Unhandled event type', { status: 400 });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'FX Pipeline <onboarding@resend.dev>',
      to: 'chibuezeonyenze123@gmail.com', // <- Replace with desired recipients
      subject,
      html: `<strong>${message}</strong>`,
    }),
  });

  const result = await response.json();
  return new Response(JSON.stringify(result), { status: 200 });
});
