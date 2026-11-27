import { getRestaurants, getDailyMenu, getWeeklyMenu } from "./api.js";
import { searchRestaurants } from "./filter.js";

//Application state
const state = {
  restaurants: [],
  selectedRestaurant: null,
  currentView: "day", // 'day' or 'week'
  favourites: new Set(), // Restaurant id : String
};

// HTML elements
const elements = {
  restaurantList: document.querySelector(".restaurant-list"),
  restaurantCount: document.querySelector(".count"),
  restaurantName: document.querySelector(".restaurant-intro h2"),
  restaurantLocation: document.querySelector(".location"),
  providerLine: document.querySelector(".provider-line"),
  favoriteButton: document.querySelector(".favorite-button"),

  dayMenu: document.querySelector("#day-menu"),
  dayMenuTitle: document.querySelector("#day-menu-title"),
  dayMenuList: document.querySelector("#day-menu .menu-list"),
  dayMenuOpenStatus: document.querySelector("#day-menu .open-status"),

  weekMenu: document.querySelector("#week-menu"),
  weekLabel: document.querySelector("#week-menu .section-label"),
  weekDays: document.querySelector("#week-menu .week-days"),

  viewSwitcher: document.querySelector(".view-switcher"),
  viewTabs: document.querySelectorAll(".view-tab"),

  restaurantSearch: document.querySelector("#restaurant-search"),
};


let menuRequestId = 0;

// Creates a new HTML element
const createElement = (tag, className = "", textContent = "") => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (textContent) element.textContent = textContent;
  return element;
};

// Generates initials from a given name
const getInitials = (name) => {
  const words = name.split(" ");
  const initials = words.map((word) => word.charAt(0).toUpperCase()).join("");
  return initials;
};

// Update favourite button state
const updateFavoriteButton = (button, restaurant) => {
  const isFavourite = state.favourites.has(String(restaurant._id));

  if (isFavourite) {
    button.textContent = "♥";
  } else {
    button.textContent = "♡";
  }

  button.setAttribute("aria-pressed", isFavourite);
};

// Creates a restaurant card element
const createRestaurantCard = (restaurant, index) => {
  const card = createElement("div", "restaurant-card");
  card.dataset.restaurantId = String(restaurant._id);

  // If selected restaurant, add 'selected' class
  if (
    state.selectedRestaurant &&
    String(state.selectedRestaurant._id) === String(restaurant._id)
  ) {
    card.classList.add("selected");
  }

  const link = createElement("a", "restaurant-card-link");
  link.href = "#restaurant-details";
  link.dataset.restaurantId = String(restaurant._id);

  const iconColors = ["", "gold", "blue", "purple", "coral"];
  const iconColor = iconColors[index % iconColors.length];
  const icon = createElement(
    "span",
    "restaurant-icon",
    getInitials(restaurant.name),
  );
  if (iconColor) {
    icon.classList.add(iconColor);
  }

  const copy = createElement("span", "restaurant-card-copy");

  const name = createElement("span", "restaurant-name", restaurant.name);

  const addressWhole = [restaurant.address, restaurant.city]
    .filter(Boolean)
    .join(", ");
  const address = createElement("small", "", addressWhole);

  copy.append(name, address);
  link.append(icon, copy);

  const heart = createElement("button", "heart", "♡");
  heart.type = "button";
  heart.setAttribute("aria-label", `Lisää ${restaurant.name} suosikkeihin`);

  updateFavoriteButton(heart, restaurant);

  card.append(link, heart);

  return card;
};

// Shows the restaurant on the page
const renderRestaurants = () => {
  const fragment = document.createDocumentFragment();

  const filteredRestaurants = searchRestaurants(
    state.restaurants,
    elements.restaurantSearch.value,
  );

  filteredRestaurants.forEach((restaurant, index) => {
    fragment.append(createRestaurantCard(restaurant, index));
  });

  elements.restaurantList.replaceChildren(fragment);
  elements.restaurantCount.textContent = filteredRestaurants.length;
};

//Updates details for the selected restaurant
const renderRestaurantDetails = (restaurant) => {
  elements.restaurantName.textContent = restaurant.name;

  const locationIcon = elements.restaurantLocation.querySelector("svg");

  const postalAndCity = [restaurant.postalCode, restaurant.city]
    .filter(Boolean)
    .join(", ");
  const address = [restaurant.address, postalAndCity]
    .filter(Boolean)
    .join(", ");

  elements.restaurantLocation.textContent = address;

  if (locationIcon) {
    elements.restaurantLocation.prepend(locationIcon);
  }

  elements.providerLine.textContent = restaurant.company || "";
  elements.providerLine.hidden = !restaurant.company;

  updateDetailFavoriteButton();
};

// Update chosen restaurants favourite button state
const updateDetailFavoriteButton = () => {
  const restaurant = state.selectedRestaurant;
  if (!restaurant) return;

  const isFavourite = state.favourites.has(String(restaurant._id));
  const icon = elements.favoriteButton.querySelector("span");

  if (icon) {
    icon.textContent = isFavourite ? "♥" : "♡";
  }

  elements.favoriteButton.setAttribute("aria-pressed", isFavourite);
};

// Toggle favourite status for a restaurant
const toggleFavorite = (restaurant) => {
  const id = String(restaurant._id);
  if (state.favourites.has(id)) {
    state.favourites.delete(id);
  } else {
    state.favourites.add(id);
  }

  renderRestaurants();
  updateDetailFavoriteButton();
};

// Creates a single meal card.
const createMealCard = (course, index) => {
  const card = createElement("article", "meal-card");

  const number = createElement(
    "div",
    "meal-number",
    String(index + 1).padStart(2, "0"),
  );

  const content = createElement("div", "meal-content");
  const name = createElement("h4", "", course.name);
  content.appendChild(name);

  if (course.diets) {
    const tags = createElement("div", "tags");
    tags.append(createElement("span", "", course.diets));
    content.append(tags);
  }

  const price = createElement("strong", "price", course.price || "");
  card.append(number, content, price);

  return card;
};

const renderCourseList = (container, courses) => {
  container.replaceChildren();

  if (!courses || courses.length === 0) {
    container.append(createElement("p", "", "Ei ruokalistaa saatavilla."));
    return;
  }

  // Render each course as a meal card
  courses.forEach((course, index) => {
    container.append(createMealCard(course, index));
  });
};

// Formats a date to Finnish
const formatFinishDate = (date) => {
  const formated = new Intl.DateTimeFormat("fi-FI", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);

  return formated;
};

const parseApiDate = (value) => {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  return null;
};

// Renders the daily menu for a restaurant
const renderDailyMenu = (courses) => {
  elements.dayMenuTitle.textContent = formatFinishDate(new Date());

  elements.dayMenuOpenStatus.hidden = true;

  renderCourseList(elements.dayMenuList, courses);
};

// Renders the weekly menu for a restaurant
const renderWeeklyMenu = (days) => {
  elements.weekDays.replaceChildren();
  elements.weekLabel.textContent = "Viikon ruokalista";

  if (!days || days.length === 0) {
    elements.weekDays.append(
      createElement("p", "", "Ei ruokalistaa saatavilla."),
    );
    return;
  }

  days.forEach((day) => {
    const date = parseApiDate(day.date);
    const validDate = date instanceof Date && !Number.isNaN(date.getTime());

    const details = createElement("details");

    const summary = createElement("summary");
    const dayInfo = createElement("span");
    const rawDate = String(day.date ?? "").trim();

    if (rawDate) {
      dayInfo.append(createElement("strong", "", rawDate));
    } else if (validDate) {
      dayInfo.append(
        createElement(
          "strong",
          "",
          new Intl.DateTimeFormat("fi-FI", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(date),
        ),
      );
    }

    const chevron = createElement("span", "day-chevron", "›");
    chevron.setAttribute("aria-hidden", "true");

    summary.append(dayInfo, chevron);
    details.append(summary);

    if (day.courses && day.courses.length > 0) {
      const meals = createElement("div", "menu-list week-meals");

      renderCourseList(meals, day.courses);
      details.append(meals);
    } else {
      details.append(createElement("p", "", "Ei ruokalistaa saatavilla."));
    }

    elements.weekDays.append(details);
  });
};

const setMenuView = (view) => {
  state.currentView = view;

  if (view === "day") {
    elements.dayMenu.hidden = false;
    elements.weekMenu.hidden = true;
  } else {
    elements.dayMenu.hidden = true;
    elements.weekMenu.hidden = false;
  }

  elements.viewTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === view);
  });
};

// Loads the daily and weekly menus for a restaurant using api.
const loadMenus = async (restaurant) => {
  const requestId = ++menuRequestId;

  elements.dayMenuList.textContent = "Ladataan ruokalistaa...";
  elements.weekDays.textContent = "Ladataan ruokalistaa...";
  elements.weekLabel.textContent = "Viikon ruokalista";

  const [dailyResult, weeklyResult] = await Promise.allSettled([
    getDailyMenu(restaurant._id),
    getWeeklyMenu(restaurant._id),
  ]);

  if (
    requestId !== menuRequestId ||
    String(state.selectedRestaurant?._id) !== String(restaurant._id)
  ) {
    return;
  }

  if (dailyResult.status === "fulfilled") {
    renderDailyMenu(dailyResult.value);
  } else {
    console.error(
      "Päivän ruokalistan lataaminen epäonnistui:",
      dailyResult.reason,
    );
    elements.dayMenuList.replaceChildren(
      createElement("p", "", "Ei ruokalistaa saatavilla."),
    );
  }

  if (weeklyResult.status === "fulfilled") {
    renderWeeklyMenu(weeklyResult.value);
  } else {
    console.error(
      "Viikon ruokalistan lataaminen epäonnistui:",
      weeklyResult.reason,
    );
    elements.weekDays.replaceChildren(
      createElement("p", "", "Ei ruokalistaa saatavilla."),
    );
  }
};

// Selects a restaurant and updates the UI accordingly
const selectRestaurant = async (restaurant) => {
  state.selectedRestaurant = restaurant;

  renderRestaurants();
  renderRestaurantDetails(restaurant);

  await loadMenus(restaurant);
};

// Loads the list of restaurants from the API.
const loadRestaurants = async () => {
  elements.restaurantList.textContent = "Ladataan ravintoloita...";

  try {
    state.restaurants = await getRestaurants();

    if (state.restaurants.length === 0) {
      elements.restaurantList.textContent = "Ravintoloita ei löytynyt.";
      return;
    }

    // Select first restaurant by default
    await selectRestaurant(state.restaurants[0]);
  } catch (error) {
    console.error("Ravintoloiden lataaminen epäonnistui:", error);

    elements.restaurantList.textContent = `Ravintoloiden lataaminen epäonnistui: ${error.message}`;
  }
};

//Event listeners
const setupEventListeners = () => {
  elements.favoriteButton.addEventListener("click", () => {
    if (state.selectedRestaurant) {
      toggleFavorite(state.selectedRestaurant);
    }
  });

  elements.restaurantList.addEventListener("click", async (event) => {
    // Favourite button clicked
    const heart = event.target.closest(".heart");

    if (heart) {
      const card = heart.closest(".restaurant-card");

      const restaurant = state.restaurants.find(
        (item) => String(item._id) === card.dataset.restaurantId,
      );
      if (restaurant) {
        toggleFavorite(restaurant);
      }

      console.log("Favourites:", Array.from(state.favourites));

      return;
    }
  
    // Restaurant chosen
    const link = event.target.closest(".restaurant-card-link");
    if (link) {
      const restaurant = state.restaurants.find(
        (item) => String(item._id) === link.dataset.restaurantId,
      );
      if (restaurant) {
        await selectRestaurant(restaurant);
      }
    }
  });

  // Search input changed
  elements.restaurantSearch.addEventListener("input", () => {
      renderRestaurants();
      console.log("Serach term:", elements.restaurantSearch.value);
    });


  // View switcher clicked
  elements.viewSwitcher.addEventListener("click", (event) => {
    const button = event.target.closest(".view-tab");
    if (button && button.dataset.view) {
      setMenuView(button.dataset.view);
    }
  });
};

// Start the application
const initApp = () => {
  setupEventListeners();
  setMenuView("day");
  loadRestaurants();
};

initApp();
