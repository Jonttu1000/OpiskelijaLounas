//TODO: handles api communication -> returns data.

const API_BASE_URL =
  'https://media2.edu.metropolia.fi/restaurant/api/v1';

const fetchData = async (endpoint) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};
export const getRestaurants = async () => {
    const data = await fetchData('/restaurants');
    return data ?? [];
}
export const getDailyMenu = async (restaurantId, lang='fi') => {
    const data = await fetchData(`/restaurants/daily/${encodeURIComponent(restaurantId)}/${lang}`);
    if (Array.isArray(data)) {
        return data;
    }
    return data?.courses ?? [];
}

export const getWeeklyMenu = async (restaurantId, lang='fi') => {
    const data = await fetchData(`/restaurants/weekly/${encodeURIComponent(restaurantId)}/${lang}`);
    if (Array.isArray(data)) {
        return data;
    }
    return data?.days ?? [];
}