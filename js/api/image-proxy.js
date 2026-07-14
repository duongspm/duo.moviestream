export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).end();

    try {
        const response = await fetch(decodeURIComponent(url), {
            headers: {
                // Giả vờ request đến từ chính trang KKPhim
                "Referer": "https://phimapi.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        });

        if (!response.ok) return res.status(response.status).end();

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") || "image/jpeg";

        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=86400"); // cache 1 ngày
        res.setHeader("Access-Control-Allow-Origin", "*");
        return res.send(Buffer.from(buffer));
    } catch (err) {
        return res.status(500).end();
    }
}