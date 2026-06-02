/**
 * Serenity Weather — Mind-Relaxing Climate Insights
 * ================================================
 * Uses Open-Meteo APIs (forecast, air-quality, historical)
 * BigDataCloud for reverse geocoding
 * Browser Geolocation API for auto-detection
 */

(function () {
  'use strict';

  // ===== DOM References =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    loadingScreen: $('#loading-screen'),
    errorScreen: $('#error-screen'),
    errorText: $('#error-text'),
    retryBtn: $('#retry-btn'),
    viewToday: $('#view-today'),
    viewClimate: $('#view-climate'),
    tabBtns: $$('.tab-btn'),
    searchInput: $('#search-input'),
    searchResults: $('#search-results'),
    locateBtn: $('#locate-btn'),
    cityName: $('#city-name'),
    dateTime: $('#date-time'),
    weatherIconLarge: $('#weather-icon-large'),
    tempValue: $('#temp-value'),
    conditionText: $('#condition-text'),
    feelsLike: $('#feels-like'),
    humidityValue: $('#humidity-value'),
    windValue: $('#wind-value'),
    uvValue: $('#uv-value'),
    aqiValue: $('#aqi-value'),
    goldenHourCard: $('#golden-hour-card'),
    goldenHourTime: $('#golden-hour-time'),
    goldenHourCountdown: $('#golden-hour-countdown'),
    adviceItems: $('#advice-items'),
    insightText: $('#insight-text'),
    hourlyCarousel: $('#hourly-carousel'),
  };

  // ===== State =====
  let state = {
    lat: null,
    lon: null,
    city: '',
    forecastChart: null,
    climateChart: null,
    goldenHourInterval: null,
    searchDebounce: null,
    dateTimeInterval: null,
  };

  // ===== API Endpoints =====
  const API = {
    forecast: (lat, lon) =>
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,weather_code&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=7`,
    airQuality: (lat, lon) =>
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5`,
    historical: (lat, lon, start, end) =>
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${start}&end_date=${end}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`,
    geocode: (name) =>
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=6&language=en&format=json`,
    reverseGeo: (lat, lon) =>
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
  };

  // ===== Weather Code Mapping =====
  const weatherCodes = {
    0:  { text: 'Clear Sky',                  icon: '☀️',  type: 'clear' },
    1:  { text: 'Mainly Clear',               icon: '🌤️', type: 'clear' },
    2:  { text: 'Partly Cloudy',              icon: '⛅',  type: 'cloudy' },
    3:  { text: 'Overcast',                   icon: '☁️',  type: 'cloudy' },
    45: { text: 'Foggy',                      icon: '🌫️', type: 'cloudy' },
    48: { text: 'Depositing Rime Fog',        icon: '🌫️', type: 'cloudy' },
    51: { text: 'Light Drizzle',              icon: '🌦️', type: 'rain' },
    53: { text: 'Moderate Drizzle',           icon: '🌦️', type: 'rain' },
    55: { text: 'Dense Drizzle',              icon: '🌧️', type: 'rain' },
    56: { text: 'Freezing Drizzle',           icon: '🌧️', type: 'rain' },
    57: { text: 'Heavy Freezing Drizzle',     icon: '🌧️', type: 'rain' },
    61: { text: 'Slight Rain',                icon: '🌧️', type: 'rain' },
    63: { text: 'Moderate Rain',              icon: '🌧️', type: 'rain' },
    65: { text: 'Heavy Rain',                 icon: '🌧️', type: 'rain' },
    66: { text: 'Freezing Rain',              icon: '🌧️', type: 'rain' },
    67: { text: 'Heavy Freezing Rain',        icon: '🌧️', type: 'rain' },
    71: { text: 'Slight Snow',                icon: '🌨️', type: 'rain' },
    73: { text: 'Moderate Snow',              icon: '🌨️', type: 'rain' },
    75: { text: 'Heavy Snow',                 icon: '❄️',  type: 'rain' },
    77: { text: 'Snow Grains',                icon: '❄️',  type: 'rain' },
    80: { text: 'Slight Showers',             icon: '🌦️', type: 'rain' },
    81: { text: 'Moderate Showers',           icon: '🌧️', type: 'rain' },
    82: { text: 'Violent Showers',            icon: '⛈️',  type: 'rain' },
    85: { text: 'Slight Snow Showers',        icon: '🌨️', type: 'rain' },
    86: { text: 'Heavy Snow Showers',         icon: '🌨️', type: 'rain' },
    95: { text: 'Thunderstorm',               icon: '⛈️',  type: 'rain' },
    96: { text: 'Thunderstorm with Hail',     icon: '⛈️',  type: 'rain' },
    99: { text: 'Thunderstorm with Heavy Hail', icon: '⛈️', type: 'rain' },
  };

  // ===== Initialize App =====
  function init() {
    createParticles();
    createAmbientOrbs();
    setupEventListeners();
    getUserLocation();
  }

  // ===== Background Particles =====
  function createParticles() {
    const container = $('#bg-particles');
    if (!container) return;
    for (let i = 0; i < 25; i++) {
      const p = document.createElement('div');
      p.classList.add('particle');
      const size = Math.random() * 60 + 20;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (Math.random() * 18 + 14) + 's';
      p.style.animationDelay = (Math.random() * 12) + 's';
      container.appendChild(p);
    }
  }

  // ===== Ambient Orbs =====
  function createAmbientOrbs() {
    const container = $('#bg-orbs');
    if (!container) return;
    const colors = [
      'rgba(120, 160, 255, 0.3)',
      'rgba(255, 180, 100, 0.2)',
      'rgba(200, 120, 255, 0.15)',
    ];
    for (let i = 0; i < 3; i++) {
      const orb = document.createElement('div');
      orb.classList.add('orb');
      const size = Math.random() * 200 + 150;
      orb.style.width = size + 'px';
      orb.style.height = size + 'px';
      orb.style.background = colors[i];
      orb.style.top = (Math.random() * 80) + '%';
      orb.style.left = (Math.random() * 80) + '%';
      orb.style.animationDuration = (Math.random() * 10 + 15) + 's';
      orb.style.animationDelay = (i * 3) + 's';
      container.appendChild(orb);
    }
  }

  // ===== Event Listeners =====
  function setupEventListeners() {
    // Tabs
    dom.tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Search
    dom.searchInput.addEventListener('input', handleSearchInput);
    dom.searchInput.addEventListener('focus', () => {
      if (dom.searchResults.childElementCount > 0) {
        dom.searchResults.classList.add('open');
      }
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#search-wrapper')) {
        dom.searchResults.classList.remove('open');
      }
    });

    // Location
    dom.locateBtn.addEventListener('click', getUserLocation);

    // Retry
    dom.retryBtn.addEventListener('click', async () => {
      if (state.lat && state.lon) {
        try {
          await fetchAllData(state.lat, state.lon, state.city);
        } catch (err) {
          console.error('Retry fetch error:', err);
          showError('Unable to fetch weather data. Please check your connection and try again.');
        }
      } else {
        getUserLocation();
      }
    });
  }

  // ===== Tab Switching =====
  function switchTab(tab) {
    dom.tabBtns.forEach((btn) => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive);
    });
    dom.viewToday.classList.toggle('active', tab === 'today');
    dom.viewClimate.classList.toggle('active', tab === 'climate');
  }

  // ===== Search =====
  function handleSearchInput() {
    clearTimeout(state.searchDebounce);
    const query = dom.searchInput.value.trim();
    if (query.length < 2) {
      dom.searchResults.classList.remove('open');
      dom.searchResults.innerHTML = '';
      return;
    }
    state.searchDebounce = setTimeout(() => searchCity(query), 300);
  }

  async function searchCity(query) {
    try {
      const res = await fetch(API.geocode(query));
      if (!res.ok) throw new Error('Geocoding error');
      const data = await res.json();

      if (!data.results || data.results.length === 0) {
        dom.searchResults.innerHTML =
          `<div class="search-no-results">
             <span class="no-results-icon">📍</span>
             <p class="no-results-text">Specific local data not found.</p>
             <p class="no-results-hint">Try searching for your broader parent district or city (e.g., "Singrauli" instead of "Nawanagar").</p>
           </div>`;
        dom.searchResults.classList.add('open');
        return;
      }

      dom.searchResults.innerHTML = data.results
        .map(
          (r) =>
            `<div class="search-result-item" data-lat="${r.latitude}" data-lon="${r.longitude}" data-name="${r.name}">
               <span>${r.name}</span>
               <span class="result-country">${r.admin1 ? r.admin1 + ', ' : ''}${r.country || ''}</span>
             </div>`
        )
        .join('');
      dom.searchResults.classList.add('open');

      // Attach click events
      dom.searchResults.querySelectorAll('.search-result-item[data-lat]').forEach((item) => {
        item.addEventListener('click', async () => {
          const lat = parseFloat(item.dataset.lat);
          const lon = parseFloat(item.dataset.lon);
          const name = item.dataset.name;
          dom.searchInput.value = name;
          dom.searchResults.classList.remove('open');
          try {
            await fetchAllData(lat, lon, name);
          } catch (err) {
            console.error('Search fetch error:', err);
            showError('Unable to fetch weather data for this location. Please try again.');
          }
        });
      });
    } catch (err) {
      console.error('Search error:', err);
    }
  }

  // ===== MASTER GEOLOCATION: Strict A→B→C→D→E Cascade =====
  // Singrauli, MP fallback coordinates (never default to London/Delhi)
  const FALLBACK_LAT = 24.1993;
  const FALLBACK_LON = 82.6645;
  const FALLBACK_CITY = 'Singrauli';

  function getUserLocation() {
    showLoading();

    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser. Please search for a city using the search bar.');
      return;
    }

    // === Step A: Attempt True GPS ===
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await handleGeoSuccess(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.error('Geolocation error:', err);
        if (err.code === 1 /* PERMISSION_DENIED */) {
          showError('Location permission denied. Please search for a city manually using the search bar above.');
        } else {
          // === Step E: Ultimate Backup — Singrauli, MP ===
          console.warn('Geolocation failed/timed out. Falling back to Singrauli, MP.');
          fetchAllData(FALLBACK_LAT, FALLBACK_LON, FALLBACK_CITY);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  /**
   * Steps B, C, D — runs after successful GPS fix.
   * Reverse-geocodes the coordinates, extracts a hierarchical city name,
   * and validates the micro-locality can actually be fetched from Open-Meteo.
   */
  async function handleGeoSuccess(latitude, longitude) {
    let targetCity = FALLBACK_CITY;
    let parentCity = '';
    let reverseGeoData = null;

    try {
      // === Step B: Reverse-Geocoding Check ===
      const geoRes = await fetch(API.reverseGeo(latitude, longitude));
      if (!geoRes.ok) throw new Error('Reverse geocode HTTP error: ' + geoRes.status);
      reverseGeoData = await geoRes.json();

      // === Step C: Hierarchical Name Extraction ===
      // Exact fallback chain as specified:
      targetCity =
        reverseGeoData.locality ||
        reverseGeoData.city ||
        reverseGeoData.principalSubdivision ||
        FALLBACK_CITY;

      // Also capture the parent city separately for Step D fallback
      parentCity =
        reverseGeoData.city ||
        (reverseGeoData.localityInfo?.administrative
          ?.filter((a) => a.order >= 5 && a.name && a.name !== targetCity)
          ?.sort((a, b) => b.order - a.order)?.[0]?.name) ||
        reverseGeoData.principalSubdivision ||
        '';

    } catch (e) {
      console.warn('Reverse geocoding failed:', e);
      // Proceed with coordinates + fallback city name
    }

    // Build the display name: "Nawanagar, Singrauli" if both available and different
    let displayName = targetCity;
    if (parentCity && parentCity !== targetCity) {
      displayName = `${targetCity}, ${parentCity}`;
    } else if (reverseGeoData) {
      // Append state if no separate parent city
      const stateRegion = reverseGeoData.principalSubdivision || '';
      if (stateRegion && stateRegion !== targetCity) {
        displayName = `${targetCity}, ${stateRegion}`;
      }
    }

    // === Step D: Micro-Location Evaluation ===
    // Attempt to fetch weather with the GPS coordinates.
    // If the fetch fails (which can happen with extreme micro-coordinates),
    // retry using the parent city's known coordinates.
    try {
      await fetchAllData(latitude, longitude, displayName);
    } catch (fetchErr) {
      console.warn(`Weather fetch failed for "${displayName}". Trying parent city: "${parentCity}"`);

      if (parentCity && parentCity !== targetCity) {
        // Try to geocode the parent city to get cleaner coordinates
        try {
          const parentGeoRes = await fetch(API.geocode(parentCity));
          const parentGeoData = await parentGeoRes.json();
          if (parentGeoData.results && parentGeoData.results.length > 0) {
            const best = parentGeoData.results[0];
            await fetchAllData(best.latitude, best.longitude, parentCity);
            return;
          }
        } catch (e2) {
          console.warn('Parent city geocode failed:', e2);
        }
      }

      // === Step E: Ultimate Backup ===
      console.warn('All location attempts failed. Falling back to Singrauli, MP.');
      try {
        await fetchAllData(FALLBACK_LAT, FALLBACK_LON, FALLBACK_CITY);
      } catch (finalErr) {
        console.error('Even fallback failed:', finalErr);
        showError('Unable to fetch weather data. Please check your internet connection and try again.');
      }
    }
  }

  // ===== Fetch All Data =====
  // NOTE: This function intentionally throws on failure so the
  // geolocation cascade (Step D) can catch and retry with parent city.
  async function fetchAllData(lat, lon, city) {
    state.lat = lat;
    state.lon = lon;
    state.city = city;

    showLoading();

    const [forecastRes, aqiRes] = await Promise.all([
      fetch(API.forecast(lat, lon)),
      fetch(API.airQuality(lat, lon)),
    ]);

    if (!forecastRes.ok) throw new Error('Forecast API error: ' + forecastRes.status);
    const forecast = await forecastRes.json();

    let aqi = null;
    if (aqiRes.ok) {
      aqi = await aqiRes.json();
    }

    // Only update UI AFTER all data has been confirmed
    renderTodayView(forecast, aqi, city);
    renderHourlyCarousel(forecast);
    renderForecastChart(forecast);
    fetchAndRenderClimate(lat, lon, forecast);

    hideLoading();
  }

  // ===== Render Today's View =====
  function renderTodayView(forecast, aqi, city) {
    const current = forecast.current;
    const daily = forecast.daily;
    const temp = Math.round(current.temperature_2m);
    const weatherCode = current.weather_code;
    const weatherInfo = weatherCodes[weatherCode] || { text: 'Unknown', icon: '🌍', type: 'clear' };
    const uvMax = daily.uv_index_max?.[0] ?? '--';
    const aqiVal = aqi?.current?.us_aqi ?? '--';

    // City & Date
    dom.cityName.textContent = city;
    updateDateTime();
    startDateTimeUpdater();

    // Icon & Condition
    dom.weatherIconLarge.textContent = weatherInfo.icon;
    dom.conditionText.textContent = weatherInfo.text;

    // Temperature
    dom.tempValue.textContent = temp;
    dom.feelsLike.textContent = `Feels like ${Math.round(current.apparent_temperature)}°C`;

    // Stats
    dom.humidityValue.textContent = `${current.relative_humidity_2m}%`;
    dom.windValue.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    dom.uvValue.textContent = typeof uvMax === 'number' ? uvMax.toFixed(1) : uvMax;
    dom.aqiValue.textContent = aqiVal;

    // Dynamic background
    setTheme(temp, weatherInfo.type);

    // Golden hour
    renderGoldenHour(daily);

    // Advice
    renderAdvice(temp, uvMax, aqiVal, weatherInfo.type, current);
  }

  // ===== Live Date-Time Updater =====
  function updateDateTime() {
    dom.dateTime.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function startDateTimeUpdater() {
    if (state.dateTimeInterval) clearInterval(state.dateTimeInterval);
    state.dateTimeInterval = setInterval(updateDateTime, 60000);
  }

  // ===== Dynamic Theme & Background =====
  function setTheme(temp, type) {
    document.body.classList.remove('theme-hot', 'theme-cool', 'theme-rain');

    let themeClass = 'theme-cool';
    if (type === 'rain') {
      themeClass = 'theme-rain';
    } else if (type === 'cloudy' && temp < 25) {
      themeClass = 'theme-rain';
    } else if (temp > 28) {
      themeClass = 'theme-hot';
    }

    document.body.classList.add(themeClass);

    // Update background layers opacity
    const layers = {
      hot: document.getElementById('bg-hot'),
      cool: document.getElementById('bg-cool'),
      rain: document.getElementById('bg-rain'),
    };

    Object.values(layers).forEach((l) => {
      if (l) l.style.opacity = '0';
    });

    if (themeClass === 'theme-hot' && layers.hot) {
      layers.hot.style.opacity = '1';
    } else if (themeClass === 'theme-cool' && layers.cool) {
      layers.cool.style.opacity = '1';
    } else if (themeClass === 'theme-rain' && layers.rain) {
      layers.rain.style.opacity = '1';
    }
  }

  // ===== Golden Hour =====
  function renderGoldenHour(daily) {
    if (state.goldenHourInterval) clearInterval(state.goldenHourInterval);

    const sunset = daily.sunset?.[0];
    if (!sunset) {
      dom.goldenHourCard.style.display = 'none';
      return;
    }

    const sunsetDate = new Date(sunset);
    // Golden hour: 45 minutes before sunset
    const goldenStart = new Date(sunsetDate.getTime() - 45 * 60 * 1000);

    dom.goldenHourTime.textContent = sunsetDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    function updateCountdown() {
      const now = new Date();
      // Countdown to golden hour start (45 min before sunset)
      const diff = goldenStart - now;

      if (diff < 0 && now < sunsetDate) {
        dom.goldenHourCountdown.textContent = '✨ Golden Hour active!';
        return;
      }
      if (now >= sunsetDate) {
        dom.goldenHourCountdown.textContent = 'Sunset has passed';
        clearInterval(state.goldenHourInterval);
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      if (hours > 0) {
        dom.goldenHourCountdown.textContent = `Starts in ${hours}h ${mins}m`;
      } else if (mins > 0) {
        dom.goldenHourCountdown.textContent = `Starts in ${mins}m ${secs}s`;
      } else {
        dom.goldenHourCountdown.textContent = `Starts in ${secs}s`;
      }
    }

    updateCountdown();
    state.goldenHourInterval = setInterval(updateCountdown, 1000);
    dom.goldenHourCard.style.display = '';
  }

  // ===== Personalized Well-being & Diet Advisory =====
  function renderAdvice(temp, uvMax, aqiVal, weatherType, current) {
    const items = [];

    // Extreme Heat (Over 35°C)
    if (temp > 35) {
      items.push({
        emoji: '🔥',
        type: 'danger',
        text: '<strong>High heat index.</strong> Stay constantly hydrated. Wear loose, light cotton clothing. Eat water-rich, cooling fruits like watermelon. Sunstroke risk is elevated; stay out of direct sunlight between 12 PM and 4 PM.',
      });
    } else if (temp > 30) {
      items.push({
        emoji: '🌡️',
        type: 'warning',
        text: '<strong>Hot weather ahead.</strong> Stay hydrated and wear light, breathable clothing. Take breaks in shaded areas. Include coconut water and cucumber in your diet.',
      });
    }

    // High Sun Exposure (UV > 7)
    if (typeof uvMax === 'number' && uvMax > 7) {
      items.push({
        emoji: '😎',
        type: 'warning',
        text: '<strong>Intense UV rays active.</strong> Apply SPF 50 sunscreen, wear protective sunglasses, and seek shaded areas. Reapply sunscreen every 2 hours if outdoors.',
      });
    } else if (typeof uvMax === 'number' && uvMax > 5) {
      items.push({
        emoji: '🧴',
        type: 'info',
        text: '<strong>Moderate UV exposure.</strong> Apply sunscreen before heading out. A hat or cap adds extra protection during peak hours.',
      });
    }

    // Heavy Pollution (AQI > 100)
    if (typeof aqiVal === 'number' && aqiVal > 100) {
      items.push({
        emoji: '😷',
        type: 'danger',
        text: '<strong>Air quality is degraded today.</strong> Consider moving workouts indoors or wearing a protective mask outside. Sensitive groups should minimize outdoor exposure.',
      });
    } else if (typeof aqiVal === 'number' && aqiVal > 50) {
      items.push({
        emoji: '🌬️',
        type: 'info',
        text: '<strong>Moderate air quality.</strong> Sensitive individuals may experience mild discomfort. Keep windows closed during peak traffic hours.',
      });
    }

    // Chilly Weather (Under 10°C)
    if (temp < 10) {
      items.push({
        emoji: '🧣',
        type: 'cold',
        text: '<strong>Crisp air outside.</strong> Layer up with cozy thermal wear and enjoy warm herbal teas. Protect extremities with gloves and a warm hat.',
      });
    } else if (temp < 18) {
      items.push({
        emoji: '🍵',
        type: 'info',
        text: '<strong>Cool and comfortable.</strong> A light jacket or sweater is ideal. Perfect weather for a brisk walk or warm beverage.',
      });
    }

    // Rain / Storm
    if (weatherType === 'rain') {
      items.push({
        emoji: '☂️',
        type: 'info',
        text: '<strong>Rain expected.</strong> Carry an umbrella and wear waterproof footwear. Drive cautiously on wet roads. A warm soup would be a perfect companion!',
      });
    }

    // High Wind
    if (current.wind_speed_10m > 40) {
      items.push({
        emoji: '💨',
        type: 'warning',
        text: '<strong>High winds detected.</strong> Secure loose outdoor items. Be cautious near trees and open areas. Not the best time for outdoor activities.',
      });
    }

    // Pleasant weather fallback
    if (items.length === 0) {
      items.push({
        emoji: '✨',
        type: 'info',
        text: '<strong>Beautiful weather!</strong> Perfect conditions for outdoor activities. Enjoy a walk, picnic, or simply soak up the pleasant atmosphere. Stay hydrated and enjoy the day!',
      });
    }

    dom.adviceItems.innerHTML = items
      .map(
        (item, i) =>
          `<div class="advice-item ${item.type}" style="animation-delay: ${i * 0.1}s">
            <span class="advice-emoji">${item.emoji}</span>
            <div class="advice-content"><p>${item.text}</p></div>
          </div>`
      )
      .join('');
  }

  // ===== 24-Hour Forecast Carousel =====
  function renderHourlyCarousel(forecast) {
    const hourly = forecast.hourly;
    if (!hourly || !hourly.time || !hourly.temperature_2m) return;

    const now = new Date();
    const currentHourISO = now.toISOString().slice(0, 13);

    // Find index of the current hour
    let startIdx = 0;
    for (let i = 0; i < hourly.time.length; i++) {
      if (hourly.time[i].slice(0, 13) >= currentHourISO) {
        startIdx = i;
        break;
      }
    }

    // Take 24 hours from current
    const sliceEnd = Math.min(startIdx + 24, hourly.time.length);
    const hours = hourly.time.slice(startIdx, sliceEnd);
    const temps = hourly.temperature_2m.slice(startIdx, sliceEnd);
    const codes = hourly.weather_code
      ? hourly.weather_code.slice(startIdx, sliceEnd)
      : [];

    dom.hourlyCarousel.innerHTML = hours
      .map((timeStr, i) => {
        const dt = new Date(timeStr);
        const isNow = i === 0;
        const timeLabel = isNow
          ? 'Now'
          : dt.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        const code = codes[i] ?? 0;
        const icon = (weatherCodes[code] || weatherCodes[0]).icon;
        const temp = Math.round(temps[i]);

        return `
          <div class="hourly-block ${isNow ? 'now' : ''}">
            <span class="hourly-time">${timeLabel}</span>
            <span class="hourly-icon">${icon}</span>
            <span class="hourly-temp">${temp}°</span>
          </div>`;
      })
      .join('');
  }

  // ===== 7-Day Forecast Chart =====
  function renderForecastChart(forecast) {
    const daily = forecast.daily;
    const labels = daily.time.map((d) =>
      new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    );
    const highs = daily.temperature_2m_max;
    const lows = daily.temperature_2m_min;

    const ctx = document.getElementById('forecast-chart');
    if (!ctx) return;
    const context = ctx.getContext('2d');

    if (state.forecastChart) state.forecastChart.destroy();

    // Create gradient fills
    const gradientHigh = context.createLinearGradient(0, 0, 0, 260);
    gradientHigh.addColorStop(0, 'rgba(255, 170, 100, 0.25)');
    gradientHigh.addColorStop(1, 'rgba(255, 170, 100, 0)');

    const gradientLow = context.createLinearGradient(0, 0, 0, 260);
    gradientLow.addColorStop(0, 'rgba(120, 180, 255, 0.15)');
    gradientLow.addColorStop(1, 'rgba(120, 180, 255, 0)');

    state.forecastChart = new Chart(context, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'High °C',
            data: highs,
            borderColor: 'rgba(255, 170, 100, 0.9)',
            backgroundColor: gradientHigh,
            fill: true,
            tension: 0.45,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: 'rgba(255, 170, 100, 1)',
            pointBorderColor: 'rgba(255, 170, 100, 0.4)',
            pointBorderWidth: 3,
            borderWidth: 2.5,
          },
          {
            label: 'Low °C',
            data: lows,
            borderColor: 'rgba(120, 180, 255, 0.9)',
            backgroundColor: gradientLow,
            fill: true,
            tension: 0.45,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: 'rgba(120, 180, 255, 1)',
            pointBorderColor: 'rgba(120, 180, 255, 0.4)',
            pointBorderWidth: 3,
            borderWidth: 2.5,
          },
        ],
      },
      options: chartOptions('Temperature (°C)'),
    });
  }

  // ===== Climate Compare =====
  async function fetchAndRenderClimate(lat, lon, currentForecast) {
    try {
      const currentStart = currentForecast.daily.time[0];
      const currentEnd = currentForecast.daily.time[currentForecast.daily.time.length - 1];

      // 10 years ago, same week
      const histStart = shiftDateString(currentStart, -10);
      const histEnd = shiftDateString(currentEnd, -10);

      const res = await fetch(API.historical(lat, lon, histStart, histEnd));
      if (!res.ok) throw new Error('Historical API error');
      const histData = await res.json();

      renderClimateChart(currentForecast, histData);
      renderClimateInsight(currentForecast, histData);
    } catch (err) {
      console.error('Climate data error:', err);
      if (dom.insightText) {
        dom.insightText.innerHTML =
          '<p>Unable to load historical climate data for comparison. The archive may not cover this date range.</p>';
      }
    }
  }

  function shiftDateString(dateStr, years) {
    const d = new Date(dateStr);
    d.setFullYear(d.getFullYear() + years);
    return d.toISOString().split('T')[0];
  }

  function renderClimateChart(current, historical) {
    const currentDaily = current.daily;
    const histDaily = historical.daily;

    const labels = currentDaily.time.map((d) =>
      new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    );

    // Average of high + low for each day
    const currentAvg = currentDaily.temperature_2m_max.map((h, i) =>
      parseFloat(((h + currentDaily.temperature_2m_min[i]) / 2).toFixed(1))
    );
    const histAvg = histDaily.temperature_2m_max
      ? histDaily.temperature_2m_max.map((h, i) =>
          parseFloat(((h + (histDaily.temperature_2m_min?.[i] ?? h)) / 2).toFixed(1))
        )
      : [];

    const ctx = document.getElementById('climate-chart');
    if (!ctx) return;
    const context = ctx.getContext('2d');

    if (state.climateChart) state.climateChart.destroy();

    // Gradient fills
    const gradientCurrent = context.createLinearGradient(0, 0, 0, 330);
    gradientCurrent.addColorStop(0, 'rgba(255, 150, 80, 0.2)');
    gradientCurrent.addColorStop(1, 'rgba(255, 150, 80, 0)');

    const gradientHist = context.createLinearGradient(0, 0, 0, 330);
    gradientHist.addColorStop(0, 'rgba(130, 190, 255, 0.12)');
    gradientHist.addColorStop(1, 'rgba(130, 190, 255, 0)');

    const currentYear = new Date().getFullYear();

    state.climateChart = new Chart(context, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `This Week (${currentYear})`,
            data: currentAvg,
            borderColor: 'rgba(255, 150, 80, 0.9)',
            backgroundColor: gradientCurrent,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: 'rgba(255, 150, 80, 1)',
            pointBorderColor: 'rgba(255, 150, 80, 0.3)',
            pointBorderWidth: 3,
            borderWidth: 2.5,
          },
          {
            label: `Same Week (${currentYear - 10})`,
            data: histAvg,
            borderColor: 'rgba(130, 190, 255, 0.9)',
            backgroundColor: gradientHist,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: 'rgba(130, 190, 255, 1)',
            pointBorderColor: 'rgba(130, 190, 255, 0.3)',
            pointBorderWidth: 3,
            borderWidth: 2.5,
            borderDash: [6, 4],
          },
        ],
      },
      options: chartOptions('Avg Temperature (°C)'),
    });
  }

  function renderClimateInsight(current, historical) {
    const currentDaily = current.daily;
    const histDaily = historical.daily;

    if (!histDaily.temperature_2m_max || histDaily.temperature_2m_max.length === 0) {
      dom.insightText.innerHTML =
        '<p>Historical data is not available for this location or date range.</p>';
      return;
    }

    const currentAvgHigh =
      currentDaily.temperature_2m_max.reduce((a, b) => a + b, 0) /
      currentDaily.temperature_2m_max.length;
    const currentAvgLow =
      currentDaily.temperature_2m_min.reduce((a, b) => a + b, 0) /
      currentDaily.temperature_2m_min.length;
    const histAvgHigh =
      histDaily.temperature_2m_max.reduce((a, b) => a + b, 0) /
      histDaily.temperature_2m_max.length;
    const histAvgLow =
      histDaily.temperature_2m_min.reduce((a, b) => a + b, 0) /
      histDaily.temperature_2m_min.length;

    const currentAvg = (currentAvgHigh + currentAvgLow) / 2;
    const histAvg = (histAvgHigh + histAvgLow) / 2;
    const diff = (currentAvg - histAvg).toFixed(1);
    const direction = diff > 0 ? 'warmer' : 'cooler';
    const absDiff = Math.abs(diff);

    const currentYear = new Date().getFullYear();

    let narrative = '';
    if (absDiff < 0.5) {
      narrative = `Temperatures this week in <strong>${state.city}</strong> are remarkably similar to the same period a decade ago, suggesting relatively stable climate patterns for this region. The average temperature both then and now hovers around <span class="insight-highlight">${currentAvg.toFixed(1)}°C</span>.`;
    } else if (absDiff < 2) {
      narrative = `This week in <strong>${state.city}</strong> is <span class="insight-highlight">${absDiff}°C ${direction}</span> than the same week in ${currentYear - 10}. While small fluctuations are natural, tracking these micro-shifts helps reveal long-term climate trends influenced by urbanization and global environmental changes.`;
    } else {
      narrative = `This week in <strong>${state.city}</strong> is <span class="insight-highlight">${absDiff}°C ${direction}</span> compared to the same week a decade ago. This notable ${parseFloat(diff) > 0 ? 'warming' : 'cooling'} trend may reflect broader environmental and climate changes affecting your region, including urban heat island effects and shifting weather patterns.`;
    }

    dom.insightText.innerHTML = `
      <p><strong>Climate Analysis:</strong> ${narrative}</p>
      <p style="margin-top: 12px; font-size: 0.78rem; color: var(--text-muted); line-height: 1.5;">
        This comparison uses average daily temperatures (high + low ÷ 2) for the current 7-day forecast versus
        the same calendar week ${currentYear - 10}. Data sourced from Open-Meteo's historical weather archive.
      </p>
    `;
  }

  // ===== Chart.js Common Options =====
  function chartOptions(yLabel) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          labels: {
            color: 'rgba(255, 255, 255, 0.7)',
            font: { family: 'Inter', size: 12, weight: '400' },
            padding: 20,
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(10, 10, 30, 0.92)',
          titleColor: 'rgba(255, 255, 255, 0.9)',
          bodyColor: 'rgba(255, 255, 255, 0.75)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          cornerRadius: 12,
          padding: 14,
          titleFont: { family: 'Inter', weight: '600', size: 13 },
          bodyFont: { family: 'Inter', size: 12 },
          displayColors: true,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}°C`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.04)',
            drawBorder: false,
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.45)',
            font: { family: 'Inter', size: 11 },
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.04)',
            drawBorder: false,
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.45)',
            font: { family: 'Inter', size: 11 },
            callback: (val) => val + '°',
          },
          title: {
            display: true,
            text: yLabel,
            color: 'rgba(255, 255, 255, 0.3)',
            font: { family: 'Inter', size: 11, weight: '400' },
          },
        },
      },
      animation: {
        duration: 1400,
        easing: 'easeOutQuart',
      },
    };
  }

  // ===== UI State Helpers =====
  function showLoading() {
    dom.loadingScreen.classList.remove('hidden');
    dom.errorScreen.classList.add('hidden');
    dom.viewToday.classList.remove('active');
    dom.viewClimate.classList.remove('active');
  }

  function hideLoading() {
    dom.loadingScreen.classList.add('hidden');
    // Show whichever tab is active
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab?.dataset.tab === 'climate') {
      dom.viewClimate.classList.add('active');
    } else {
      dom.viewToday.classList.add('active');
    }
  }

  function showError(msg) {
    dom.loadingScreen.classList.add('hidden');
    dom.errorScreen.classList.remove('hidden');
    dom.errorText.textContent = msg;
  }

  // ===== Launch =====
  document.addEventListener('DOMContentLoaded', init);
})();
