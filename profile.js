fetch("/profile")

.then(res => {

    if (!res.ok) {
        window.location.href = "login.html";
        return;
    }

    return res.json();

})

.then(user => {

    if (!user) return;

    document.getElementById("userName").innerText = user.name;
    document.getElementById("userMobile").innerText = user.phone;
    document.getElementById("userEmail").innerText = user.email;

});

function logout(){

    fetch("/logout")
    .then(() => {
        window.location.href = "login.html";
    });

}