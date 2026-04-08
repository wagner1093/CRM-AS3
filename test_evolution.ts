const instance = "Wg 2";
const apikey = "14587F3EDC5E-42B5-8D41-E4E6F96FEB8B";
const serverUrl = "https://agencia-wg1234-evolution-api.yj3mui.easypanel.host";
const remoteJid = "120363425499828369@g.us";

const findGroupUrl = `${serverUrl}/group/findGroup/${instance}/${remoteJid}`;
console.log("Calling:", findGroupUrl);

try {
    const resp = await fetch(findGroupUrl, { headers: { apikey } });
    if (!resp.ok) {
        console.error("HTTP Error:", resp.status, await resp.text());
        Deno.exit(1);
    }
    const data = await resp.json();
    console.log("Full response data:");
    console.log(JSON.stringify(data, null, 2));
} catch (e) {
    console.error("Fetch error:", e);
}
