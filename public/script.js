document.addEventListener("DOMContentLoaded", function () {
    const userIcon = document.querySelector(".user-icon");
    const userDropdown = document.querySelector(".user-dropdown");

    if (userIcon) {
        userIcon.addEventListener("click", function (event) {
            event.stopPropagation();
            userDropdown.style.display = userDropdown.style.display === "block" ? "none" : "block";
        });
        document.addEventListener("click", function (event) {
            if (!userIcon.contains(event.target)) {
                userDropdown.style.display = "none";
            }
        });
    }

    const navLinks = {
        "plant-guide": "plant-guide.html",
        "plants": "plants.html",
        "tools": "gardentools.html",
        "pots": "pots.html",
        "seeds": "seeds.html",
        "signin": "auth.html"
    };

    for (const id in navLinks) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener("click", function () {
                window.location.href = navLinks[id];
            });
        }
    }
    const shopBtn = document.querySelector(".shop-btn");
    if (shopBtn) {
        shopBtn.addEventListener("click", function () {
            document.getElementById("products").scrollIntoView({ behavior: "smooth" });
        });
    }
    const signInLink = document.getElementById("signin");
    const logoutLink = document.querySelector(".logout");

    function checkAuth() {
        const authToken = localStorage.getItem("authToken");
        const userRole = localStorage.getItem("userRole");

        if (authToken) {
            if (userRole === "admin") {
                signInLink.innerText = "Admin Panel";
                signInLink.href = "admin.html";
            } else {
                signInLink.innerText = "Profile";
                signInLink.href = "ecommerce.html";
            }
            if (logoutLink) logoutLink.style.display = "block";
        } else {
            signInLink.innerText = "Sign In";
            signInLink.href = "auth.html";
            if (logoutLink) logoutLink.style.display = "none";
        }
    }

    function logout() {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
        alert("You have been logged out.");
        window.location.href = "ecommerce.html";
    }

    if (logoutLink) {
        logoutLink.addEventListener("click", logout);
    }

    checkAuth();
});
