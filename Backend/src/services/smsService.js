// Lazy-load Twilio and make SMS optional so missing dependency/creds don't crash the server
let twilioClient = null;

const initTwilio = async () => {
  if (twilioClient) return twilioClient;
  const { TWILIO_SID, TWILIO_TOKEN } = process.env;
  if (!TWILIO_SID || !TWILIO_TOKEN) {
    console.warn('SMS disabled: Missing TWILIO_SID/TWILIO_TOKEN env vars');
    return null;
  }
  try {
    const twilioModule = await import('twilio');
    twilioClient = twilioModule.default(TWILIO_SID, TWILIO_TOKEN);
    return twilioClient;
  } catch (err) {
    console.warn('SMS disabled: Twilio package not installed');
    return null;
  }
};

const sendSMS = async (to, message) => {
  try {
    const client = await initTwilio();
    if (!client) {
      console.log(`SMS skipped -> to: ${to}, message: ${message}`);
      return { skipped: true };
    }
    const from = process.env.TWILIO_PHONE;
    if (!from) {
      console.warn('SMS disabled: Missing TWILIO_PHONE env var');
      return { skipped: true };
    }
    const res = await client.messages.create({ body: message, from, to });
    return res;
  } catch (error) {
    console.error('SMS send error:', error);
    // Do not throw to avoid breaking request flow
    return { error: true, message: error.message };
  }
};

export { sendSMS };