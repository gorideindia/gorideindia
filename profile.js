// =========================
// LOAD USER PROFILE
// =========================

fetch("http://localhost:3000/me", {
    credentials: "include"
})

.then(res => {

    if (!res.ok) {
        window.location.href = "login.html";
        return;
    }

    return res.json();

})

.then(data => {

    if (!data || !data.success) {
        window.location.href = "login.html";
        return;
    }

    const user = data.user;

    document.getElementById("userName").innerText =
        user.name;

    document.getElementById("userMobile").innerText =
        user.phone;

    document.getElementById("userEmail").innerText =
        user.email;

})

.catch(error => {

    console.error("Profile Error:", error);

    window.location.href = "login.html";

});


// =========================
// LOGOUT
// =========================

function logout() {

    fetch("http://localhost:3000/logout", {
        credentials: "include"
    })

    .then(() => {

        window.location.href = "login.html";

    })

    .catch(error => {

        console.error("Logout Error:", error);

    });

}