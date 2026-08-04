function registerUser() {

    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!name || !phone || !email || !password) {
        alert("Please fill all fields");
        return;
    }

    fetch("/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name,
            phone,
            email,
            password
        })
    })
    .then(res => res.text())
    .then(msg => {
        alert(msg);

        if (msg === "Registration Successful") {
            window.location.href = "login.html";
        }
    })
    .catch(err => {
        console.log(err);
        alert("Registration Failed");
    });

}