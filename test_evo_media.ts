// test script
const EVOLUTION_API_URL = "https://agencia-wg1234-evolution-api.yj3mui.easypanel.host";
const EVOLUTION_API_KEY = "14587F3EDC5E-42B5-8D41-E4E6F96FEB8B";
const EVOLUTION_INSTANCE_NAME = "Wg 2";

const media = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg==";

const body: any = {
  number: "5511974594009", // Used in previous recent conversations
  media: media,
  mediatype: "image",
  mimetype: "image/png",
  caption: "Test image Base64 payload",
  fileName: "test.png"
};

async function testEvo() {
  const res = await fetch(
    `${EVOLUTION_API_URL}/message/sendMedia/${encodeURIComponent(EVOLUTION_INSTANCE_NAME)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify(body),
    }
  );

  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Response:", data);
}

testEvo();
