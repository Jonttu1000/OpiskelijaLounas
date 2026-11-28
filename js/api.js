//TODO: handles api communication -> returns data.

const API_BASE_URL = "https://media2.edu.metropolia.fi/restaurant/api/v1";

const fetchData = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    const data = await response.json();

    if (!response.ok) {
      console.error("API error response:", data);

      throw new Error(
        data?.message || `HTTP error! status: ${response.status}`,
      );
    }

    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

export const getRestaurants = async () => {
  const data = await fetchData("/restaurants");
  return data ?? [];
};

// Fetch a single restaurant by its ID
export const getDailyMenu = async (restaurantId, lang = "fi") => {
  const data = await fetchData(
    `/restaurants/daily/${encodeURIComponent(restaurantId)}/${lang}`,
  );
  if (Array.isArray(data)) {
    return data;
  }
  return data?.courses ?? [];
};

// Fetch weekly menu for a specific restaurant
export const getWeeklyMenu = async (restaurantId, lang = "fi") => {
  const data = await fetchData(
    `/restaurants/weekly/${encodeURIComponent(restaurantId)}/${lang}`,
  );
  if (Array.isArray(data)) {
    return data;
  }
  return data?.days ?? [];
};

// login user with username and password, returns token if successful
export const loginUser = async (username, password) => {
  const data = await fetchData("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!data || !data?.token) {
    throw new Error(data?.message || "Login failed");
  }

  return data;
};

// Fetch current user data using the provided token
export const getCurrentUser = async (token) => {
  const data = await fetchData("/users/token", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data;
};

export const updateUser = async (token, userData) => {
  return await fetchData("/users", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });
};

export const registerUser = async (username, email, password) => {
  return await fetchData("/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
      email: email,
    }),
  });
};
