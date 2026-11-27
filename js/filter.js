import { getDistance } from "./utils.js";

const searchRestaurants = (restaurants, searchTerm) => {
  const searchTermLower = searchTerm.trim().toLowerCase();

  if (!searchTermLower) {
    return restaurants;
  }

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const searchableFields = [
      restaurant.name,
      restaurant.address,
      restaurant.city,
      restaurant.company,
    ];

    return searchableFields.some((field) => {
      return String(field ?? "")
        .toLocaleLowerCase()
        .includes(searchTermLower);
    });
  });

  return filteredRestaurants;
};

const sortRestaurants = (state, restaurants) => {

  const sortedRestaurants = [...restaurants].sort((a, b) => {
    switch (state.sortOption) {
      case "name-asc":
        return (a.name ?? "").localeCompare(b.name ?? "", 'fi');
      case "name-desc":
        return (b.name ?? "").localeCompare(a.name ?? "", 'fi');
      case "location":
        if (state.userLocation) {
            const distanceA = getDistance(a, state.userLocation);
            const distanceB = getDistance(b, state.userLocation);
            return distanceA - distanceB;
        }
        return 0;
        case "favourite":
            const aFavourite = String(a._id) === state.favourite;
            const bFavourite = String(b._id) === state.favourite;

            return Number(bFavourite) - Number(aFavourite) || (a.name ?? "").localeCompare(b.name ?? "", 'fi');
      default:
        return 0;
    }
  });

  return sortedRestaurants;
};

export { searchRestaurants, sortRestaurants };
