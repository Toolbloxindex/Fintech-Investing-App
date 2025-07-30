const API_KEY = process.env.CRYPTO_API_KEY;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids");

  // Build the API URL based on whether ids is provided
  let apiUrl = "https://pro-api.coinmarketcap.com/v2/cryptocurrency/info/1";
  

  const response = await fetch(
    apiUrl,
    {
      headers: {
        "X-CMC_PRO_API_KEY": API_KEY!,
      },
    }
  );

  const res = await response.json();
  if (!res.data) {
    return Response.json({ error: "No data found", details: res }, { status: 404 });
  }
  return Response.json(res.data);
}