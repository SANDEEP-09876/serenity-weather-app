# serenity-weather-app
A minimalist, mind-relaxing weather dashboard that translates live environmental data into actionable lifestyle insights and visualizes 10-year local climate change trends.
# 🌤️ Serenity Weather & Climate Insights Dashboard

Serenity Weather is a minimalist, mind-relaxing web application built to transform complex weather telemetry into soothing visuals and actionable lifestyle data. Moving away from generic "tacky" weather apps, Serenity dynamically adapts its aesthetic theme to match the pulse of your environment while exposing hidden climate trends.

## ✨ Key Features

*   **Mind-Relaxing Dynamic UI:** The interface utilizes soft glassmorphism and smooth CSS color-gradient transitions that dynamically shift based on real-time environmental temperatures and weather codes (e.g., pastel peach for high heat, twilight purple for cool nights, calming slate for rain).
*   **High-Accuracy Cascading Geolocation:** Implements a strict, tiered geolocation architecture leveraging browser GPS and keyless reverse-geocoding. It targets exact local neighborhoods (like Nawanagar) and gracefully falls back to broader parent districts (like Singrauli) to ensure accurate local tracking without crashing.
*   **Google-Style 24-Hour Forecast Carousel:** A horizontally scrollable timeline showing an hour-by-hour breakdown of temperatures and conditions for the next 24 hours.
*   **Well-being & Smart Dietary Advisory Engine:** Context-aware health logic that processes UV index, Air Quality Index (AQI), and temperatures to provide practical suggestions (e.g., severe heat warnings, hydration reminders, seasonal fruit suggestions like watermelon, and sunstroke precaution windows).
*   **"Climate Compare" Analytics:** A dedicated feature mapping the current week's temperature metrics directly against historical data from **10 years ago** using historical weather archives, visually demonstrating the tangible local impacts of global warming.

## 🛠️ Built With

*   **Frontend:** Semantic HTML5, Custom CSS3 (Glassmorphism + Variable Gradients), Vanilla JavaScript (ES6+ Async/Await).
*   **Data APIs:** [Open-Meteo API](https://open-meteo.com/) (Free, keyless endpoints for Forecast, Air Quality, and Historical data Archives), [BigDataCloud](https://www.bigdatacloud.com/) (Reverse Geocoding).
*   **Charts/Graphs:** [Chart.js](https://www.chartjs.org/) for rendering the 7-day outlook and the 10-year climate delta comparison graphs.

## 🚀 Getting Started

### Prerequisites
You only need a modern web browser. No complex API keys or tokens are required to run this repository locally because it functions entirely on open-source, keyless API infrastructure.

### Installation & Local Run
1. Clone the repository:
```bash
   git clone [https://github.com/YOUR_USERNAME/serenity-weather-app.git](https://github.com/YOUR_USERNAME/serenity-weather-app.git)
