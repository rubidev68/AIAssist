let allArticles = []; // Stockage de tous les articles du flux
let currentArticleIndex = 0; // Index de début pour l'affichage

let weather_dataAI = null;
let articles_dataAI = null;

var converter = new showdown.Converter();

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
        //console.log(weather_data);
        temperatures = weather_data.daily.temperature_2m_max;
        const temperature = Math.round(temperatures.reduce((a, b) => a + b) / temperatures.length);
        const weather = weather_data.daily.weather_code[0];
        const weatherDescription = getWeatherDescription(weather);

        console.log(`Temperature: ${temperature}°C`);
        //console.log(`Weather Code: ${weather}`);
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
                        weather_dataAI = weather_data;
                        resolve({ latitude, longitude, weather_data });
                    }).catch(error => reject(error));
                },
                (error) => {
                    console.log("Error getting location for weather:", error);
                    const latitude = 49.1837;
                    const longitude = -0.356;
                    getWeather(latitude, longitude).then(weather_data => {
                        weather_dataAI = weather_data;
                        resolve({ latitude, longitude, weather_data });
                    }).catch(error => reject(error));
                }
            );
        } else {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    getWeather(latitude, longitude).then(weather_data => {
                        weather_dataAI = weather_data;
                        localStorage.setItem('locationPermission', 'granted');
                        resolve({ latitude, longitude, weather_data });
                    }).catch(error => reject(error));
                },
                (error) => {
                    if (error.code === error.PERMISSION_DENIED) {
                        localStorage.setItem('locationPermission', 'denied');
                    }
                    console.log("Error getting location for weather:", error);
                    const latitude = 49.1837;
                    const longitude = -0.356;
                    getWeather(latitude, longitude).then(weather_data => {
                        weather_dataAI = weather_data;
                        resolve({ latitude, longitude, weather_data });
                    }).catch(error => reject(error));
                    
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
        'Showers': 'rain.png',
        'Blizzard': 'blizzard.svg',
        'Thunder': 'thunder.svg',
        'Storm': 'storm.svg',
        'Unknown': 'unknown.svg'
    };

    const icon = weatherIcons[weatherDescription];
    weatherIcon.src = `res/${icon}`;
}


async function fetchRSSFeed() {
    const proxyUrl = 'https://api.rss2json.com/v1/api.json?rss_url=';
    const rssUrl = 'http://feeds.bbci.co.uk/news/rss.xml';

    try {
        const response = await fetch(proxyUrl + encodeURIComponent(rssUrl));
        const data = await response.json(); // Changé de .text() à .json()
        articles_dataAI = data;
        return data; // Retourne directement l'objet JSON
    } catch (error) {
        console.error('Erreur lors de la récupération du flux RSS:', error);
        return null;
    }
}

function updateNewsArticles(data) { // Modifié pour accepter l'objet JSON
    if (!data || !data.items) return;

    allArticles = data.items.map(item => ({
        title: item.title,
        description: item.description,
        link: item.link,
        mediaContent: item.thumbnail, // Utilise directement l'URL de la miniature
    }));

    displayCurrentArticles();
}

function rollArticles() {
    if (allArticles.length > 0) {
        const containers = document.querySelectorAll('.article-1, .article-1-small');

        containers.forEach(container => {
            const content = container.querySelector('.content, .content-small');
            content.classList.add('slide-out');
        });

        setTimeout(() => {
            currentArticleIndex = (currentArticleIndex + containers.length) % allArticles.length;

            containers.forEach(container => {
                console.log(container);
                const content = container.querySelector('.content, .content-small');
                content.classList.remove('slide-out');
                content.classList.add('slide-in');
            });

            displayCurrentArticles();

            requestAnimationFrame(() => {
                containers.forEach(container => {
                    const content = container.querySelector('.content, .content-small');
                    content.classList.remove('slide-in');
                });
            });
        }, 500);
    }
}

function displayCurrentArticles() {
    const containers = document.querySelectorAll('.article-1, .article-1-small');

    containers.forEach((container, index) => {
        const article = allArticles[currentArticleIndex + index];
        if (article) {
            const titleElement = container.querySelector('.article-title');
            const descElement = container.querySelector('.article-content');

            // Préserver les classes et propriétés existantes
            if (container.classList.contains('article-1-small')) {
                // Ajouter classes spécifiques pour les articles verticaux
                if (index === 0) {
                    container.classList.add('article-top');
                } else {
                    container.classList.add('article-bottom');
                }
            }

            // Ajouter l'overlay s'il n'existe pas
            if (!container.querySelector('.overlay')) {
                const overlay = document.createElement('div');
                overlay.classList.add('overlay');
                container.appendChild(overlay);
            }

            // Mise à jour du contenu
            if (titleElement && descElement) {
                titleElement.textContent = article.title;
                descElement.textContent = article.description;

                if (article.mediaContent) {
                    
                    container.style.backgroundImage = `url(${article.mediaContent})`;
                }

                // S'assurer que le content est bien positionné
                const content = container.querySelector('.content');
                if (content) {
                    content.style.position = 'relative';
                    content.style.zIndex = '2';
                }

                container.onclick = () => openNewsDetails(article.link);
            }
        }
    });
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

function openAIContainer() {
    //recognition.stop();
    var popup = document.getElementById("vocalChatPopup");
    if (!popup) return;

    popup.style.display = "flex";
    popup.style.zIndex = 100;

    // Déclencher l'animation après un court délai
    requestAnimationFrame(() => {
        popup.classList.add('show');
    });

    popup.setAttribute("closable", "");

    var onClick = function (event) {
        if (event.target === popup && popup.hasAttribute("closable")) {
            popup.classList.remove('show');
            setTimeout(() => {
                popup.style.display = "none";
            }, 300);
        }
    };

    popup.addEventListener("click", onClick);
    updateAIOrderText('Speak now...');
    updateAITranscriptText("Listening...")
    startAudioProcessing();
}

function updateTextWithAnimation(element, newText, append = false) {
    if (append) {
        element.classList.add('fade-out');
        setTimeout(() => {
            element.textContent += newText;
            element.classList.remove('fade-out');
            element.classList.add('fade-in');
        }, 500); // Correspond à la durée de l'animation fade-out
    } else {
        element.classList.add('fade-out');
        setTimeout(() => {
            element.textContent = newText;
            element.classList.remove('fade-out');
            element.classList.add('fade-in');
        }, 500); // Correspond à la durée de l'animation fade-out
    }
    setTimeout(() => {
        element.classList.remove('fade-in');
    }, 1000); // Correspond à la durée totale des animations
}

function openNewsDetails(url) {
    var url = url.replace(/^https?:\/\/[^/]+/, "");
    var proxyUrl = window.location.protocol + '//' + window.location.host + '/proxy/';
    var popup = document.getElementById("newsDetailsPopup");
    var iframe = document.getElementById("news-iframe");

    if (!popup || !iframe) return;

    iframe.src = proxyUrl + url;
    popup.style.display = "flex";
    popup.style.zIndex = 100;

    // Déclencher l'animation après un court délai
    requestAnimationFrame(() => {
        popup.classList.add('show');
    });

    popup.setAttribute("closable", "");

    var onClick = function (event) {
        if (event.target === popup && popup.hasAttribute("closable")) {
            popup.classList.remove('show');
            setTimeout(() => {
                popup.style.display = "none";
                iframe.src = ""; // Réinitialiser l'iframe
            }, 300);
        }
    };

    popup.addEventListener("click", onClick);
}

function updateAIOrderText(newText) {
    var orderElement = document.querySelector('.order');
    updateTextWithAnimation(orderElement, newText);
}

function updateAITranscriptText(newText, append = false) {
    var transcriptElement = document.querySelector('.transcript-txt');
    updateTextWithAnimation(transcriptElement, newText, append);
}

function AIgetsNews() {
    if (articles_dataAI) {
        return JSON.stringify(articles_dataAI);
    }
    else {
        return "No news available";
    }
}

function AIgetsWeather() {
    if (weather_dataAI) {
        return JSON.stringify(weather_dataAI);
    }
    else {
        return "No weather available";
    }
}

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
