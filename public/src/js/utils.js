function setDateToParagraph(paragraphId) {
    const paragraph = document.getElementById(paragraphId);
    if (!paragraph) {
        console.error(`Aucun paragraphe trouvé avec l'ID: ${paragraphId}`);
        return;
    }

    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const dayName = days[now.getDay()];
    const day = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();

    const formattedDate = `${dayName} ${day}th <br> ${monthName} ${year}`;
    paragraph.innerHTML = formattedDate;
}

function updateClock() {
    const now = new Date();

    // Get current time
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Calculate the rotation for each hand
    const secondsDegree = (seconds / 60) * 360;
    const minutesDegree = (minutes / 60) * 360 + (seconds / 60) * 6; // Includes seconds offset
    const hoursDegree = (hours % 12 / 12) * 360 + (minutes / 60) * 30; // Includes minutes offset

    // Rotate the hands
    const hourHand = document.getElementById('hours');
    const minuteHand = document.getElementById('minutes');
    const secondHand = document.getElementById('seconds');

    if (hourHand) hourHand.style.transform = `rotate(${hoursDegree}deg)`;
    if (minuteHand) minuteHand.style.transform = `rotate(${minutesDegree}deg)`;
    if (secondHand) secondHand.style.transform = `rotate(${secondsDegree}deg)`;
}

function computeWeather() {
    getUserLocationAndWeather().then(({ latitude, longitude, weather_data }) => {
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
        console.log(weather_data);
        temperatures = weather_data.daily.temperature_2m_max;
        const temperature = Math.round(temperatures.reduce((a, b) => a + b) / temperatures.length);
        const weather = weather_data.daily.weather_code[0];
        const weatherDescription = getWeatherDescription(weather);

        console.log(`Temperature: ${temperature}°C`);
        console.log(`Weather Code: ${weather}`);
        console.log(`Weather: ${weatherDescription}`);

        setWeatherToParagraph('weather-p', weatherDescription, temperature);
        setWeatherIcon('weather-icon', weatherDescription);
        setWeatherToParagraph('weather-p1', weatherDescription, temperature);
        setWeatherIcon('weather-icon1', weatherDescription);

    }).catch(error => {
        console.error("Error retriving weather forecast:", error);
    });
}

function getUserLocationAndWeather() {
    return new Promise((resolve, reject) => {
        const locationPermission = localStorage.getItem('locationPermission');

        if (locationPermission === 'granted') {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    getWeather(latitude, longitude).then(weather_data => {
                        resolve({ latitude, longitude, weather_data });
                    }).catch(error => reject(error));
                },
                (error) => {
                    reject(error);
                }
            );
        } else {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    getWeather(latitude, longitude).then(weather_data => {
                        localStorage.setItem('locationPermission', 'granted');
                        resolve({ latitude, longitude, weather_data });
                    }).catch(error => reject(error));
                },
                (error) => {
                    if (error.code === error.PERMISSION_DENIED) {
                        localStorage.setItem('locationPermission', 'denied');
                    }
                    reject(error);
                }
            );
        }
    });
}

function getWeather(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,cloud_cover,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=Europe%2FBerlin`;

    return fetch(url)
        .then(response => response.json())
        .then(data => data)
        .catch(error => {
            throw new Error("Erreur lors de la récupération des données météo: " + error);
        });
}

function getWeatherDescription(weatherCode) {
    // Groupes de codes météo avec descriptions simplifiées
    if (weatherCode === 0) return 'Clear';
    if ([1, 2, 3].includes(weatherCode)) return 'Cloudy';
    if ([45, 48].includes(weatherCode)) return 'Fog';
    if ([51, 53, 55].includes(weatherCode)) return 'Drizzle';
    if ([56, 57].includes(weatherCode)) return 'Freezing';
    if ([61, 63, 65].includes(weatherCode)) return 'Rain';
    if ([66, 67].includes(weatherCode)) return 'Sleet';
    if ([71, 73, 75].includes(weatherCode)) return 'Snow';
    if (weatherCode === 77) return 'Grainy';
    if ([80, 81, 82].includes(weatherCode)) return 'Showers';
    if ([85, 86].includes(weatherCode)) return 'Blizzard';
    if (weatherCode === 95) return 'Thunder';
    if ([96, 99].includes(weatherCode)) return 'Storm';

    return 'Unknown';
}

function setWeatherToParagraph(paragraphId, weatherDescription, temperature) {
    const paragraph = document.getElementById(paragraphId);
    if (!paragraph) {
        console.error(`Aucun paragraphe trouvé avec l'ID: ${paragraphId}`);
        return;
    }

    paragraph.innerHTML = `${weatherDescription} <br> ${temperature}°C`;
}

function setWeatherIcon(weatherIconStr, weatherDescription) {
    const weatherIcon = document.getElementById(weatherIconStr);
    if (!weatherIcon) {
        console.error(`Aucune icône météo trouvée avec l'ID: weather-icon`);
        return;
    }

    const weatherIcons = {
        'Clear': 'sun.png',
        'Cloudy': 'cloud.png',
        'Fog': 'fog.png',
        'Drizzle': 'sun_clouds_rain.png',
        'Freezing': 'freezing.png',
        'Rain': 'rain.png',
        'Sleet': 'rain.png',
        'Snow': 'snow.svg',
        'Grainy': 'grainy.svg',
        'Showers': 'showers.svg',
        'Blizzard': 'blizzard.svg',
        'Thunder': 'thunder.svg',
        'Storm': 'storm.svg',
        'Unknown': 'unknown.svg'
    };

    const icon = weatherIcons[weatherDescription];
    weatherIcon.src = `res/${icon}`;
}


async function fetchRSSFeed() {
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const rssUrl = 'http://feeds.bbci.co.uk/news/rss.xml';

    try {
        const response = await fetch(proxyUrl + encodeURIComponent(rssUrl));
        const data = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, 'application/xml');
        return xmlDoc;
    } catch (error) {
        console.error('Erreur lors de la récupération du flux RSS:', error);
        return null;
    }
}

let allArticles = []; // Stockage de tous les articles du flux
let currentArticleIndex = 0; // Index de début pour l'affichage

function updateNewsArticles(xmlDoc) {
    const items = xmlDoc.getElementsByTagName('item');
    allArticles = Array.from(items).map(item => ({
        title: item.getElementsByTagName('title')[0].textContent,
        description: item.getElementsByTagName('description')[0].textContent,
        link: item.getElementsByTagName('link')[0].textContent,
        mediaContent: item.getElementsByTagNameNS('*', 'thumbnail'),
    }));

    displayCurrentArticles();
}

function rollArticles() {
    if (allArticles.length > 0) {
        const containers = document.querySelectorAll('.article-1');
        
        containers.forEach(container => {
            const oldContent = container.querySelector('.content');
            const newContent = oldContent.cloneNode(true);
            
            // Préparer le nouveau contenu
            newContent.classList.add('slide-in');
            container.appendChild(newContent);
            
            // Animation de sortie de l'ancien contenu
            oldContent.classList.add('slide-out');
            
            setTimeout(() => {
                currentArticleIndex = (currentArticleIndex + 4) % allArticles.length;
                displayCurrentArticles();
                
                // Animation d'entrée du nouveau contenu
                setTimeout(() => {
                    newContent.classList.remove('slide-in');
                    //newContent.classList.add('active');
                    container.removeChild(oldContent);
                }, 50);
            }, 500);
        });
    }
}

function displayCurrentArticles() {
    for (let i = 0; i < 4; i++) {
        const articleIndex = (currentArticleIndex + i) % allArticles.length;
        const article = allArticles[articleIndex];

        if (article) {
            const articleContainer = document.getElementById(`article${i + 1}Container`);
            if (articleContainer) {
                const content = articleContainer.querySelector('.content');
                const titleElement = content.querySelector('h3');
                const descElement = content.querySelector('.content > div');

                titleElement.textContent = article.title;

                const imageUrl = article.mediaContent.length > 0 ?
                    article.mediaContent[0].getAttribute('url') : null;

                // Mise à jour du background avec transition
                if (imageUrl) {
                    articleContainer.style.backgroundImage = `url(${imageUrl})`;
                }

                if (descElement) {
                    const containerHeight = articleContainer.clientHeight;
                    const titleHeight = titleElement.clientHeight;
                    const availableSpace = containerHeight - titleHeight - 40;

                    if (availableSpace >= 40) {
                        descElement.textContent = article.description;
                        descElement.style.display = 'block';
                    } else {
                        descElement.style.display = 'none';
                    }
                }

                // Mettre à jour le lien
                articleContainer.onclick = () => window.open(article.link, '_blank');
            }
        }
    }
}

async function updateNews() {
    const xmlDoc = await fetchRSSFeed();
    if (xmlDoc) {
        updateNewsArticles(xmlDoc);
    }
}

function initPhotoSlider() {
    const slider = document.querySelector('.photos-slider');
    const slides = document.querySelectorAll('.photos-slider .photos-icon');
    let currentSlide = 0;

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        slider.style.transform = `translateX(-${currentSlide * 100}%)`;
    }

    setInterval(nextSlide, 10000);
}