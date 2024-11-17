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
        try {
            recognition.stop();
        }
        catch (e) {
            
        }
        openAIContainer();
    });
}

document.getElementById('ai-btn-2').onclick = () => {
    startAudioProcessing();
};
