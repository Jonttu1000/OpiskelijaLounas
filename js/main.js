import {
    getRestaurants,
    getDailyMenu,
    getWeeklyMenu
} from './api.js';

//Application state
const state = {
    restaurants: [],
    selectedRestaurant: null,
    currentView: 'daily', // 'daily' or 'weekly'
    favourites: new Set(), // Restaurant id : String
};

// HTML elements
const elements = {
  restaurantList: document.querySelector('.restaurant-list'),
  restaurantCount: document.querySelector('.count'),
  restaurantName: document.querySelector('.restaurant-intro h2'),
  restaurantLocation: document.querySelector('.location'),
  providerLine: document.querySelector('.provider-line'),
  favoriteButton: document.querySelector('.favorite-button'),

  dayMenu: document.querySelector('#day-menu'),
  dayMenuTitle: document.querySelector('#day-menu-title'),
  dayMenuList: document.querySelector('#day-menu .menu-list'),
  dayMenuOpenStatus: document.querySelector('#day-menu .open-status'),

  weekMenu: document.querySelector('#week-menu'),
  weekLabel: document.querySelector('#week-menu .section-label'),
  weekDays: document.querySelector('#week-menu .week-days'),

  viewSwitcher: document.querySelector('.view-switcher'),
  viewTabs: document.querySelectorAll('.view-tab'),
};

// Creates a new HTML element
const createElement = (tag, className = '', textContent = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
};

// Generates initials from a given name
const getInitials = (name) => {
    const words = name.split(' ');
    const initials = words.map(word => word.charAt(0).toUpperCase()).join('');
    return initials;
}

// Update favourite button state
const updateFavoriteButton = (button, restaurant) => {
    const isFavourite = state.favourites.has(String(restaurant.id))

    if (isFavourite) {
        button.textContent = '♥';
    } else {
        button.textContent = '♡';
    }

    button.setAttribute('aria-pressed', isFavourite)
};
