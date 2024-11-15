setDateToParagraph('date');

setInterval(updateClock, 1000);

updateClock();

computeWeather()

setInterval(computeWeather, 30 * 60 * 1000);

updateNews();
setInterval(updateNews, 60 * 60 * 1000); 
setInterval(rollArticles, 60 * 1000);

document.addEventListener('DOMContentLoaded', initPhotoSlider);

var weatherContainer = document.getElementById("weatherContainer");
if (weatherContainer) {
    weatherContainer.addEventListener("click", function () {
        var popup = document.getElementById("weatherDetailsPopup");
        if (!popup) return;
        var popupStyle = popup.style;
        if (popupStyle) {
            popupStyle.display = "flex";
            popupStyle.zIndex = 100;
            popupStyle.backgroundColor = "rgba(113, 113, 113, 0.3)";
            popupStyle.alignItems = "center";
            popupStyle.justifyContent = "center";
        }
        popup.setAttribute("closable", "");

        var onClick =
            popup.onClick ||
            function (e) {
                if (e.target === popup && popup.hasAttribute("closable")) {
                    popupStyle.display = "none";
                }
            };
        popup.addEventListener("click", onClick);
    });
}

var aIContainer = document.getElementById("aIContainer");
if (aIContainer) {
    aIContainer.addEventListener("click", function () {
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
    });
}