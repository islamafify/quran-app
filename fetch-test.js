const fs = require('fs');

async function checkAudio() {
    const res = await fetch('https://api.quran.com/api/v4/recitations/7/by_ayah/2:255');
    const data = await res.json();
    console.log(data);
}
checkAudio();
