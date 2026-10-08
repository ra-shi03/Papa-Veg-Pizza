const https = require('https');
const fs = require('fs');

https.get("https://res.cloudinary.com/dhtwjunxe/image/upload/v1791180912/welcome/images/fz4z6uvo7t0c93d6ijha.jpg", (res) => {
  res.pipe(fs.createWriteStream("poster1.jpg"));
});
https.get("https://res.cloudinary.com/dhtwjunxe/image/upload/v1791182413/welcome/images/i5flwxst5ywodyiojhtt.jpg", (res) => {
  res.pipe(fs.createWriteStream("poster2.jpg"));
});
