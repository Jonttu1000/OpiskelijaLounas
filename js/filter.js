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

export { searchRestaurants };
