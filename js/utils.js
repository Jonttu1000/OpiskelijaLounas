const getDistance = (restaurant, userLocation) => {
  const [longitude, latitude] = restaurant.location.coordinates;

  return Math.sqrt(
    (longitude - userLocation.longitude) ** 2 +
      (latitude - userLocation.latitude) ** 2,
  );
};

const getUserLocation = () => {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ latitude, longitude });
      },
      (error) => {
        // Käyttäjä esti sijainnin tai haku epäonnistui
        console.warn("Sijainnin haku epäonnistui:", error.message);
        resolve(null);
      },
    );
  });
};

export { getDistance, getUserLocation };
