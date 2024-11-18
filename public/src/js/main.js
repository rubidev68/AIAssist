setDateToParagraph('date');

setInterval(updateClock, 1000);

updateClock();

computeWeather()

setInterval(computeWeather, 30 * 60 * 1000);

updateNews();
setInterval(updateNews, 60 * 60 * 1000); 
setInterval(rollArticles, 10000);

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


document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const loginPopup = document.getElementById("loginPopup");
    const errorMessage = document.getElementById("errorMessage");

    loginPopup.style.display = "flex";
    loginPopup.style.zIndex = 100;
    loginPopup.classList.add('show');

    // Hash du mot de passe (à faire une seule fois et stocker le hash)
    const storedHashedPassword = '649e96e75a2326aea3682b21bf9960493e0120aae931e764dafd7480eecabca0'; // Remplacez par le hash de votre mot de passe

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const password = loginForm.password.value;
        const hashedPassword = await hashPassword(password);

        // Vérifiez le mot de passe avec le hash stocké
        if (hashedPassword === storedHashedPassword) {
            loginPopup.style.display = "none";
            try{
                recognition.start();
            }
            catch (e) {
                
            }
            
        } else {
            errorMessage.style.display = "block";
        }
    });
});