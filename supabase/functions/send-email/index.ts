import { SMTPClient } from "npm:emailjs@4.0.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, from, subject, text, imageData, smtpSettings } = await req.json();

    if (!smtpSettings || !smtpSettings.server || !smtpSettings.username || !smtpSettings.password) {
      throw new Error("SMTP settings are required");
    }

    const smtp = new SMTPClient({
      user: smtpSettings.username,
      password: smtpSettings.password,
      host: smtpSettings.server,
      port: smtpSettings.port || 587,
      tls: true,
    });

    const message = {
      from: from || smtpSettings.username,
      to: to,
      subject: subject,
      text: text,
    };

    // Add image attachment if provided
    if (imageData) {
      const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, '');
      message.attachment = [
        {
          data: `<img src="${imageData}" alt="Intruder Detection" style="max-width: 100%; height: auto;">`,
          alternative: true,
        },
      ];
    }

    await smtp.sendAsync(message);

    return new Response(JSON.stringify({ success: true, message: "Email sent successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send email", 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});