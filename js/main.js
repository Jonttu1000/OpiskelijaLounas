import {
  getRestaurants,
  getDailyMenu,
  getWeeklyMenu,
  getCurrentUser,
  updateUser,
  loginUser,
  registerUser,
} from "./api.js";
import { searchRestaurants, sortRestaurants } from "./filter.js";
import { getUserLocation } from "./utils.js";
//Application state
const state = {
  restaurants: [],
  selectedRestaurant: null,
  currentView: "day", // 'day' or 'week'
  userLocation: null, // { latitude: Number, longitude: Number } or null
  currentUser: null, //
  favourite: null, // Restaurant id : String
  sortOption: "name-asc", // 'name-asc', 'name-desc', 'location', 'favourite'
  authToken: localStorage.getItem("token") || null,
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
  restaurantFilters: document.querySelectorAll("input[name='sort']"),

  loginButton: document.querySelector(".login-button"),
  loginDialog: document.querySelector("#login-dialog"),
  loginForm: document.querySelector("#login-form"),
  loginError: document.querySelector("#login-error"),
  closeLogin: document.querySelector("#close-login"),
  profileMenu: document.querySelector(".profile-menu"),
  profileUsername: document.querySelector("#profile-username"),
  logoutButton: document.querySelector("#logout-button"),

  registerFields: document.querySelector("#register-fields"),
  toggleRegister: document.querySelector("#toggle-register"),
  loginTitle: document.querySelector("#login-title"),
  loginSubmitButton: document.querySelector("#login-form-submit-btn"),
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
  const isFavourite = state.favourite === String(restaurant._id);

  button.textContent = isFavourite ? "♥" : "♡";

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

  const sortedRestaurants = sortRestaurants(state, filteredRestaurants);

  sortedRestaurants.forEach((restaurant, index) => {
    fragment.append(createRestaurantCard(restaurant, index));
  });

  elements.restaurantList.replaceChildren(fragment);
  elements.restaurantCount.textContent = sortedRestaurants.length;
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

  const isFavourite = state.favourite === String(restaurant._id);
  const icon = elements.favoriteButton.querySelector("span");

  if (icon) {
    icon.textContent = isFavourite ? "♥" : "♡";
  }

  elements.favoriteButton.setAttribute("aria-pressed", isFavourite);
};

let favouriteSaving = false;

// Toggle favourite status for a restaurant
const toggleFavorite = async (restaurant) => {
  if (favouriteSaving) return;

  const restaurantId = String(restaurant._id);
  const newFavourite = state.favourite === restaurantId ? null : restaurantId;

  // If user is logged in, save favourite to server
  if (state.authToken) {
    favouriteSaving = true;

    try {
      await updateUser(state.authToken, { favouriteRestaurant: newFavourite });
    } catch (error) {
      console.error("Favourite saving failed:", error);
      alert("Favourite couldn't be saved. Please try again.");
      alert("Favourite couldn't be saved. Please try again.");
      return;
    } finally {
      favouriteSaving = false;
    }
  }

  state.favourite = newFavourite;

  renderRestaurants();
  updateDetailFavoriteButton();
};

const authenticateUser = async (username, password) => {
  const loginResult = await loginUser(username, password);
  const user = await getCurrentUser(loginResult.token);

  state.authToken = loginResult.token;
  state.currentUser = user;

  state.favourite = user.favouriteRestaurant
    ? String(user.favouriteRestaurant)
    : null;

  localStorage.setItem("token", state.authToken);

  updateAuthUI();
  renderRestaurants();
  updateDetailFavoriteButton();

  return user;
};

// Load saved favourite from server if user is logged in
const loadSavedFavourite = async () => {
  if (!state.authToken) return;

  try {
    const user = await getCurrentUser(state.authToken);

    state.currentUser = user;
    state.favourite = user.favouriteRestaurant
      ? String(user.favouriteRestaurant)
      : null;

    updateAuthUI();
    renderRestaurants();
    updateDetailFavoriteButton();
  } catch (error) {
    console.error("Error while fetching user data", error);

    //Clears saved session if token is invalid or expired
    localStorage.removeItem("token");
    state.authToken = null;
    state.currentUser = null;
    state.favourite = null;
    updateAuthUI();
  }
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

//User login handling
const updateAuthUI = () => {
  const isLoggedIn = Boolean(state.authToken && state.currentUser);

  elements.loginButton.hidden = isLoggedIn;
  elements.profileMenu.hidden = !isLoggedIn;

  elements.profileUsername.textContent =
    state.currentUser?.username ?? "Anonymous";
};

let isRegisterMode = false;

const setAuthMode = (registerMode) => {
  isRegisterMode = registerMode;

  elements.registerFields.hidden = !registerMode;

  elements.loginTitle.textContent = registerMode
    ? "Luo käyttäjätili"
    : "Kirjaudu sisään";

  elements.toggleRegister.textContent = registerMode
    ? "Takaisin kirjautumiseen"
    : "Luo uusi käyttäjä";

  elements.loginSubmitButton.textContent = registerMode
    ? "Rekisteröidy"
    : "Kirjaudu";

  const emailInput = elements.loginForm.elements.email;
  const confirmInput = elements.loginForm.elements.confirmPassword;

  emailInput.required = registerMode;
  confirmInput.required = registerMode;

  elements.loginError.textContent = "";
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

  // Sort option changed
  elements.restaurantFilters.forEach((radio) => {
    radio.addEventListener("change", async () => {
      if (radio.value === "location" && !state.userLocation) {
        const location = await getUserLocation();
        if (!radio.checked) return; // User changed selection while waiting for location

        if (!location) {
          alert("could not get your location. Using default sorting instead.");

          state.sortOption = "name-asc";

          document.querySelector(
            'input[name="sort"][value="name-asc"]',
          ).checked = true;

          renderRestaurants();
          return;
        } else {
          state.userLocation = location;
        }
      }

      state.sortOption = String(radio.value);
      renderRestaurants();
    });
  });

  // View switcher clicked
  elements.viewSwitcher.addEventListener("click", (event) => {
    const button = event.target.closest(".view-tab");
    if (button && button.dataset.view) {
      setMenuView(button.dataset.view);
    }
  });

  // ==== Login handling ====
  elements.loginButton.addEventListener("click", () => {
    elements.loginError.textContent = "";
    elements.loginDialog.showModal();
  });

  elements.closeLogin.addEventListener("click", () => {
    elements.loginDialog.close();
  });

  elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const form = elements.loginForm;

    const username = form.elements.username.value.trim();
    const password = form.elements.password.value;

    const submitButton = form.querySelector('button[type="submit"]');

    elements.loginError.textContent = "";
    submitButton.disabled = true;

    try {
      if (isRegisterMode) {
        const email = form.elements.email.value.trim();
        const confirmPassword = form.elements.confirmPassword.value;

        if (password !== confirmPassword) {
          elements.loginError.textContent = "Salasanat eivät täsmää.";
          return;
        }

        try {
          await registerUser(username, email, password);
        } catch (error) {
          if (!error.message.includes("535 Authentication failed")) {
            throw error;
          }
          console.warn("SMTP error. Trying automatic login...");
        }

        await authenticateUser(username, password);

        form.reset();
        setAuthMode(false);

        elements.loginError.textContent =
          "Rekisteröinti onnistui! Voit nyt kirjautua sisään.";
      } else {
        await authenticateUser(username, password);

        form.reset();
        elements.loginDialog.close();
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      elements.loginError.textContent =
        error.message ||
        (isRegisterMode
          ? "Rekisteröinti epäonnistui. Yritä uudelleen."
          : "Kirjautuminen epäonnistui. Yritä uudelleen.");
    } finally {
      submitButton.disabled = false;
    }
  });

  elements.logoutButton.addEventListener("click", (event) => {
    event.preventDefault();

    localStorage.removeItem("token");

    state.authToken = null;
    state.currentUser = null;
    state.favourite = null;

    elements.profileMenu.open = false;

    updateAuthUI();
    renderRestaurants();
    updateDetailFavoriteButton();
  });

  elements.toggleRegister.addEventListener("click", () => {
    setAuthMode(!isRegisterMode);
  });
};
// Start the application
const initApp = async () => {
  setupEventListeners();
  setMenuView("day");
  updateAuthUI();

  await loadRestaurants();
  await loadSavedFavourite();
};

initApp();
