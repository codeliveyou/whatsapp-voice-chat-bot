export const getBardResponse = async (prompt) => {
    const request = await fetch("https://api.bardapi.dev/chat", {
      //get api key in https://bardapi.dev
      headers: { Authorization: "Bearer your_bard_api_key" },
      method: "POST",
      body: JSON.stringify({ input: prompt }),
    });
    const response = await request.json();
    return response.output
};