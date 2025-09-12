const BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export const preMemo = {
  get: async () => {
    console.log("fetching data from:", BASE);
    const res = await fetch(`${BASE}/preMemo`, {
      method: "GET",
    });
    return res.json();
  },
  post: async (data: { title: string; content: string }) => {
    const res = await fetch(`${BASE}/preMemo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  put: async (id: string, data: { title: string; content: string }) => {
    const res = await fetch(`${BASE}/preMemo/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`${BASE}/preMemo/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },
};
