const data = {
        "posters": [
            {
                "id": "1791180912890pbzpw1mzs",
                "imageUrl": "https://res.cloudinary.com/dhtwjunxe/image/upload/v1791180912/welcome/images/fz4z6uvo7t0c93d6ijha.jpg",
                "order": 0,
                "isActive": true,
                "startDate": "2026-10-05T05:57:00.000Z",
                "endDate": "2026-10-30T05:57:00.000Z",
                "deepLink": "",
                "_id": "6ac72d4333ce67c058cc6fa8"
            },
            {
                "id": "17911824136496p3qyksw4",
                "imageUrl": "https://res.cloudinary.com/dhtwjunxe/image/upload/v1791182413/welcome/images/i5flwxst5ywodyiojhtt.jpg",
                "order": 1,
                "isActive": true,
                "startDate": "2026-10-05T06:39:00.000Z",
                "endDate": "2026-10-30T08:41:00.000Z",
                "deepLink": "",
                "_id": "6ac72d4333ce67c058cc6fa9"
            }
        ]
};

const now = new Date("2026-10-08T12:00:00Z");
let validPosters = data.posters
  ?.filter(p => p.isActive)
  ?.filter(p => !p.startDate || new Date(p.startDate) <= now)
  ?.filter(p => !p.endDate || new Date(p.endDate) >= now)
  ?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];

console.log(validPosters.length);
